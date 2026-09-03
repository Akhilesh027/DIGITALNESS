const WorkApproval = require("../models/WorkApproval");
const Work = require("../models/Work");
const User = require("../models/User");
const Customer = require("../models/Customer");
const createNotification = require("../utils/createNotification");

const ADMIN_ROLES = ["Admin", "admin", "Super Admin", "superadmin", "Owner", "owner"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager", "Manager", "manager", "operations manager", "operational manager"];

const getUserId = (user) => user?._id || user?.id || user;

const allowedApprovalStatuses = [
  "Pending Approval",
  "Approved",
  "Rejected",
  "Revision Requested",
];

const canReview = (user) => {
  const role = String(user?.role || "").trim().toLowerCase();
  return [
    "admin",
    "super admin",
    "superadmin",
    "owner",
    "manager",
    "operational manager",
    "branch manager",
    "operations manager",
  ].includes(role);
};

const populateApprovalQuery = (query) => {
  return query
    .populate({
      path: "work",
      populate: [
        {
          path: "assignedTo",
          select: "name fullName username email role department",
        },
        {
          path: "createdBy",
          select: "name fullName username email role",
        },
        {
          path: "parentWorkId",
          select: "title workType status priority dueDate",
        },
      ],
    })
    .populate("customer", "name companyName businessType contactNumbers email city branchId")
    .populate("submittedBy", "name fullName username email role")
    .populate("assignedTo", "name fullName username email role department")
    .populate("reviewedBy", "name fullName username email role");
};

const notifyUser = async ({
  title,
  message,
  type = "approval",
  moduleId,
  moduleModel = "Work",
  recipient,
  createdBy,
  link = "/works",
}) => {
  if (!recipient) return;

  await createNotification({
    title,
    message,
    type,
    moduleId,
    moduleModel,
    recipient,
    createdBy,
    link,
  });
};

const notifyMany = async (recipients = [], payload) => {
  const uniqueRecipients = [
    ...new Set(
      recipients.filter(Boolean).map((recipient) => String(getUserId(recipient)))
    ),
  ];

  await Promise.all(
    uniqueRecipients.map((recipient) =>
      notifyUser({
        ...payload,
        recipient,
      })
    )
  );
};

const updateCustomerWorkStatus = async ({ customerId, workId, status }) => {
  if (!customerId || !workId) return;

  await Customer.updateOne(
    {
      _id: customerId,
      "works.work": workId,
    },
    {
      $set: {
        "works.$.status": status,
      },
    }
  );
};

const updateWorkTimeline = async ({
  work,
  title,
  description,
  createdBy,
}) => {
  if (!work) return;

  work.timeline = work.timeline || [];
  work.timeline.push({
    title,
    description,
    createdBy,
  });

  await work.save();
};

const applyReviewResult = async ({
  approval,
  status,
  adminRemark,
  reviewerId,
}) => {
  const work = await Work.findById(approval.work?._id || approval.work);

  if (!work) {
    throw new Error("Linked work not found");
  }

  approval.status = status;
  approval.adminRemark = adminRemark || "";
  approval.reviewedBy = reviewerId;
  approval.reviewedAt = new Date();

  if (status === "Approved") {
    work.status = "Completed";
    work.approvalStatus = "Approved";
    work.approvalRequired = false;
    work.approvedBy = reviewerId;
    work.approvedAt = new Date();
    work.managerReviewNote = adminRemark || "Work approved";

    work.timeline = work.timeline || [];
    work.timeline.push({
      title: "Work Approved",
      description: adminRemark || "Work approved by manager/admin",
      createdBy: reviewerId,
    });
  }

  if (status === "Revision Requested") {
    approval.revisionCount = Number(approval.revisionCount || 0) + 1;

    work.status = "Revision";
    work.approvalStatus = "Revision";
    work.approvalRequired = true;
    work.managerReviewNote = adminRemark || "Revision requested";

    work.timeline = work.timeline || [];
    work.timeline.push({
      title: "Revision Requested",
      description: adminRemark || "Revision requested by manager/admin",
      createdBy: reviewerId,
    });
  }

  if (status === "Rejected") {
    work.status = "Failed";
    work.approvalStatus = "Rejected";
    work.approvalRequired = false;
    work.managerReviewNote = adminRemark || "Work rejected";

    work.timeline = work.timeline || [];
    work.timeline.push({
      title: "Work Rejected",
      description: adminRemark || "Work rejected by manager/admin",
      createdBy: reviewerId,
    });
  }

  await work.save();
  await approval.save();

  await updateCustomerWorkStatus({
    customerId: work.customer,
    workId: work._id,
    status: work.status,
  });

  const notifyTitle =
    status === "Approved"
      ? "Work Approved"
      : status === "Rejected"
      ? "Work Rejected"
      : "Revision Requested";

  const notifyMessage =
    status === "Approved"
      ? `${work.title} approved by manager/admin.`
      : status === "Rejected"
      ? `${work.title} was rejected.`
      : `${work.title} requires revision.`;

  await notifyUser({
    title: notifyTitle,
    message: notifyMessage,
    type: "approval",
    moduleId: approval._id,
    moduleModel: "Work",
    recipient: approval.submittedBy,
    createdBy: reviewerId,
    link: "/works",
  });

  await notifyMany(work.assignedTo || [], {
    title: notifyTitle,
    message: notifyMessage,
    type: "approval",
    moduleId: approval._id,
    moduleModel: "Work",
    createdBy: reviewerId,
    link: "/works",
  });

  return await populateApprovalQuery(WorkApproval.findById(approval._id));
};

exports.getApprovals = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    if (status && allowedApprovalStatuses.includes(status)) {
      filter.status = status;
    }

    if (ADMIN_ROLES.includes(req.user.role)) {
      filter = { ...filter };
    } else if (MANAGER_ROLES.includes(req.user.role)) {
      const customers = await Customer.find({
        branchId: req.user.branchId,
      }).distinct("_id");

      filter.customer = { $in: customers };
    } else {
      filter.submittedBy = getUserId(req.user);
    }

    const approvals = await populateApprovalQuery(
      WorkApproval.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: approvals.length,
      data: approvals,
    });
  } catch (error) {
    console.log("Get approvals error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch approvals",
      error: error.message,
    });
  }
};

exports.getApprovalById = async (req, res) => {
  try {
    const approval = await populateApprovalQuery(
      WorkApproval.findById(req.params.id)
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Approval not found",
      });
    }

    res.status(200).json({
      success: true,
      data: approval,
    });
  } catch (error) {
    console.log("Get approval by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch approval",
      error: error.message,
    });
  }
};

exports.reviewApproval = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;

    if (!canReview(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can review approvals",
      });
    }

    if (!["Approved", "Rejected", "Revision Requested"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status",
      });
    }

    const approval = await WorkApproval.findById(req.params.id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: "Approval not found",
      });
    }

    if (approval.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "This approval has already been reviewed",
      });
    }

    const updatedApproval = await applyReviewResult({
      approval,
      status,
      adminRemark,
      reviewerId: getUserId(req.user),
    });

    res.status(200).json({
      success: true,
      message: "Approval updated successfully",
      data: updatedApproval,
    });
  } catch (error) {
    console.log("Review approval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to review approval",
      error: error.message,
    });
  }
};

exports.approveWorkApproval = async (req, res) => {
  req.body.status = "Approved";
  return exports.reviewApproval(req, res);
};

exports.requestRevisionApproval = async (req, res) => {
  req.body.status = "Revision Requested";
  return exports.reviewApproval(req, res);
};

exports.rejectWorkApproval = async (req, res) => {
  req.body.status = "Rejected";
  return exports.reviewApproval(req, res);
};

exports.getApprovalStats = async (req, res) => {
  try {
    let filter = {};

    if (ADMIN_ROLES.includes(req.user.role)) {
      filter = {};
    } else if (MANAGER_ROLES.includes(req.user.role)) {
      const customers = await Customer.find({
        branchId: req.user.branchId,
      }).distinct("_id");

      filter.customer = { $in: customers };
    } else {
      filter.submittedBy = getUserId(req.user);
    }

    const approvals = await WorkApproval.find(filter);

    const total = approvals.length;
    const pending = approvals.filter((a) => a.status === "Pending Approval").length;
    const approved = approvals.filter((a) => a.status === "Approved").length;
    const rejected = approvals.filter((a) => a.status === "Rejected").length;
    const revision = approvals.filter((a) => a.status === "Revision Requested").length;

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        revision,
      },
    });
  } catch (error) {
    console.log("Approval stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch approval stats",
      error: error.message,
    });
  }
};