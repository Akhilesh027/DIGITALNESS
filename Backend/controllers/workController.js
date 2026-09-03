const Work = require("../models/Work.js");
const Customer = require("../models/Customer.js");
const User = require("../models/User");
const WorkApproval = require("../models/WorkApproval.js");
const createNotification = require("../utils/createNotification");
const sendMail = require("../utils/sendMail");

const ADMIN_ROLES = ["Admin", "admin", "Super Admin", "superadmin", "Owner", "owner"];
const MANAGER_ROLES = [
  "Operational Manager",
  "Branch Manager",
  "Manager",
  "manager",
  "operations manager",
  "operational manager",
];

const allowedStatuses = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Approved",
  "Completed",
  "Revision",
  "Failed",
];

const getUserId = (user) => user?._id || user?.id || user;

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const cleanObjectId = (value) => {
  if (!value || value === "" || value === "null" || value === "undefined") {
    return null;
  }
  return value;
};

const notifyUser = async ({
  title,
  message,
  type = "work",
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

const populateWorkQuery = (query) => {
  return query
    .populate("parentWorkId", "title workType status priority dueDate")
    .populate("customer", "name companyName businessType contactNumbers email city branchId assignedTo")
    .populate("assignedTo", "name fullName username email role department branchId")
    .populate("createdBy", "name fullName username email role")
    .populate("approvedBy", "name fullName username email role");
};

const populateWork = async (id) => {
  return await populateWorkQuery(Work.findById(id));
};

const getRoleWorkFilter = async (user) => {
  const role = String(user?.role || "").trim().toLowerCase();

  if (
    role === "admin" ||
    role === "super admin" ||
    role === "superadmin" ||
    role === "owner"
  ) {
    return {};
  }

  if (
    role === "operational manager" ||
    role === "branch manager" ||
    role === "manager" ||
    role === "operations manager"
  ) {
    if (user.branchId) {
      const customers = await Customer.find({ branchId: user.branchId }).distinct("_id");
      return { customer: { $in: customers } };
    }
    return {};
  }

  return { assignedTo: { $in: [getUserId(user)] } };
};

const sendWorkMail = async ({
  to,
  subject,
  title,
  message,
  work,
  customer,
  employeeName,
  parentWork,
}) => {
  if (!to) return;

  const workUrl = `${process.env.CLIENT_URL || "http://localhost:8080"}/works`;

  await sendMail({
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb">
          <h2 style="margin:0 0 12px;color:#111827">${title}</h2>
          <p style="font-size:15px;color:#374151;line-height:1.6">Hi ${employeeName || "Employee"},</p>
          <p style="font-size:15px;color:#374151;line-height:1.6">${message}</p>

          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:18px">
            <p><b>Work Title:</b> ${work?.title || "-"}</p>
            <p><b>Parent Work:</b> ${parentWork?.title || "Main Work"}</p>
            <p><b>Work Type:</b> ${work?.workType || "-"}</p>
            <p><b>Status:</b> ${work?.status || "-"}</p>
            <p><b>Priority:</b> ${work?.priority || "-"}</p>
            <p><b>Customer:</b> ${customer?.name || customer?.companyName || "-"}</p>
            <p><b>Due Date:</b> ${
              work?.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "-"
            }</p>
          </div>

          <a href="${workUrl}"
             style="display:inline-block;margin-top:20px;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px">
             Open Work Dashboard
          </a>

          <p style="font-size:12px;color:#6b7280;margin-top:24px">
            This is an automated email from Digitalness CRM.
          </p>
        </div>
      </div>
    `,
  });
};

const sendMailToAssignedEmployees = async ({
  assignedTo = [],
  subject,
  title,
  message,
  work,
  customer,
  parentWork,
}) => {
  const employeeIds = toArray(assignedTo);

  if (employeeIds.length === 0) return;

  const employees = await User.find({
    _id: { $in: employeeIds },
    email: { $exists: true, $ne: "" },
  }).select("name fullName username email");

  await Promise.all(
    employees.map((employee) =>
      sendWorkMail({
        to: employee.email,
        subject,
        title,
        message,
        work,
        customer,
        parentWork,
        employeeName:
          employee.name || employee.fullName || employee.username || "Employee",
      })
    )
  );
};

const syncCustomerWork = async (work) => {
  if (!work?.customer) return;

  await Customer.updateOne(
    {
      _id: work.customer?._id || work.customer,
      "works.work": work._id,
    },
    {
      $set: {
        "works.$.title": work.title,
        "works.$.workType": work.workType,
        "works.$.assignedTo": work.assignedTo,
        "works.$.status": work.status,
        "works.$.priority": work.priority,
        "works.$.dueDate": work.dueDate,
      },
    }
  );
};

exports.createWork = async (req, res) => {
  try {
    const userId = getUserId(req.user);

    const {
      title,
      workType,
      type,
      customer,
      customerId,
      assignedTo,
      priority,
      dueDate,
      description,
      deliverables,
      completedDeliverables,
      slaDays,
      estimatedHours,
      parentWorkId,
      attachments,
    } = req.body;

    const finalWorkType = workType || type;
    const finalCustomer = cleanObjectId(customer || customerId);
    const finalParentWorkId = cleanObjectId(parentWorkId);
    const finalAssignedTo = toArray(assignedTo).filter(Boolean);

    if (!title || !finalWorkType || !finalCustomer || finalAssignedTo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title, work type, customer and employee are required",
      });
    }

    const customerExists = await Customer.findById(finalCustomer);

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    let parentWork = null;

    if (finalParentWorkId) {
      parentWork = await Work.findById(finalParentWorkId);

      if (!parentWork) {
        return res.status(404).json({
          success: false,
          message: "Parent work not found",
        });
      }
    }

    const formattedAttachments = toArray(attachments).map((file) => {
      if (typeof file === "string") {
        return {
          fileName: file.split("/").pop() || "Attachment",
          fileUrl: file,
          fileType: "",
          uploadedBy: userId,
        };
      }

      return {
        fileName: file.fileName || "Attachment",
        fileUrl: file.fileUrl || file.url || "",
        fileType: file.fileType || "",
        uploadedBy: userId,
      };
    });

    const newWork = await Work.create({
      title,
      parentWorkId: finalParentWorkId,
      workType: finalWorkType,
      customer: finalCustomer,
      assignedTo: finalAssignedTo,
      priority: priority || "Medium",
      dueDate,
      description,
      deliverables: Number(deliverables) || 1,
      completedDeliverables: Number(completedDeliverables) || 0,
      slaDays: Number(slaDays) || 2,
      estimatedHours: Number(estimatedHours) || 0,
      attachments: formattedAttachments,
      createdBy: userId,
      status: "Not Started",
      timeline: [
        {
          title: finalParentWorkId ? "Task Created" : "Work Created",
          description: `${title} was created and assigned`,
          createdBy: userId,
        },
      ],
    });

    await Customer.findByIdAndUpdate(finalCustomer, {
      $push: {
        works: {
          work: newWork._id,
          parentWorkId: finalParentWorkId,
          title: newWork.title,
          workType: newWork.workType,
          assignedTo: newWork.assignedTo,
          status: newWork.status,
          priority: newWork.priority,
          dueDate: newWork.dueDate,
        },
      },
    });

    const notificationTitle = finalParentWorkId
      ? "New Task Assigned"
      : "New Work Assigned";

    const notificationMessage = finalParentWorkId
      ? `${newWork.title} has been assigned to you under ${parentWork.title}.`
      : `${newWork.title} has been assigned to you for ${
          customerExists.name || customerExists.companyName || "customer"
        }.`;

    await notifyMany(finalAssignedTo, {
      title: notificationTitle,
      message: notificationMessage,
      type: "work",
      moduleId: newWork._id,
      moduleModel: "Work",
      createdBy: userId,
      link: "/works",
    });

    await sendMailToAssignedEmployees({
      assignedTo: finalAssignedTo,
      subject: notificationTitle,
      title: notificationTitle,
      message: notificationMessage,
      work: newWork,
      customer: customerExists,
      parentWork,
    });

    const populatedWork = await populateWork(newWork._id);

    return res.status(201).json({
      success: true,
      message: "Work created successfully",
      data: populatedWork,
    });
  } catch (error) {
    console.log("Create work error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create work",
      error: error.message,
    });
  }
};

exports.getAllWorks = async (req, res) => {
  try {
    const { branchId, parentWorkId, onlyTasks, onlyMainWorks, status, customer } =
      req.query;

    let filter = await getRoleWorkFilter(req.user);

    if (branchId) {
      const customersInBranch = await Customer.find({ branchId }).distinct("_id");
      filter.customer = { $in: customersInBranch };
    }

    if (customer) filter.customer = customer;

    if (parentWorkId) filter.parentWorkId = parentWorkId;

    if (onlyTasks === "true") filter.parentWorkId = { $ne: null };

    if (onlyMainWorks === "true") filter.parentWorkId = null;

    if (status) filter.status = status;

    const works = await populateWorkQuery(
      Work.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: works.length,
      data: works,
    });
  } catch (error) {
    console.log("Get works error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch works",
      error: error.message,
    });
  }
};

exports.getEmployeeWorks = async (req, res) => {
  try {
    const works = await populateWorkQuery(
      Work.find({
        assignedTo: { $in: [req.params.employeeId] },
      }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: works.length,
      data: works,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee works",
      error: error.message,
    });
  }
};

exports.getCustomerWorks = async (req, res) => {
  try {
    const { customerId } = req.params;

    const works = await populateWorkQuery(
      Work.find({ customer: customerId }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: works.length,
      data: works,
      works,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer works",
      error: error.message,
    });
  }
};

exports.updateWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = getUserId(req.user);

    const oldWork = await Work.findById(workId);

    if (!oldWork) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    const updates = { ...req.body };

    delete updates._id;
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;
    delete updates.timeline;
    delete updates.comments;
    delete updates.updates;

    if (updates.type && !updates.workType) updates.workType = updates.type;
    if (updates.customerId && !updates.customer) updates.customer = updates.customerId;

    updates.customer = cleanObjectId(updates.customer);
    updates.parentWorkId = cleanObjectId(updates.parentWorkId);

    delete updates.customerId;
    delete updates.type;

    if (updates.assignedTo !== undefined) {
      updates.assignedTo = toArray(updates.assignedTo).filter(Boolean);
    }

    if (updates.deliverables !== undefined) {
      updates.deliverables = Number(updates.deliverables) || 1;
    }

    if (updates.completedDeliverables !== undefined) {
      updates.completedDeliverables = Number(updates.completedDeliverables) || 0;
    }

    if (updates.slaDays !== undefined) {
      updates.slaDays = Number(updates.slaDays) || 2;
    }

    if (updates.estimatedHours !== undefined) {
      updates.estimatedHours = Number(updates.estimatedHours) || 0;
    }

    if (updates.status && !allowedStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work status",
      });
    }

    if (updates.customer) {
      const customerExists = await Customer.findById(updates.customer);

      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    if (updates.parentWorkId) {
      const parentWork = await Work.findById(updates.parentWorkId);

      if (!parentWork) {
        return res.status(404).json({
          success: false,
          message: "Parent work not found",
        });
      }
    }

    const oldAssignedIds = toArray(oldWork.assignedTo).map((id) =>
      String(getUserId(id))
    );

    const newAssignedIds = updates.assignedTo
      ? updates.assignedTo.map((id) => String(getUserId(id)))
      : oldAssignedIds;

    const addedAssignedIds = newAssignedIds.filter(
      (id) => !oldAssignedIds.includes(id)
    );

    const removedAssignedIds = oldAssignedIds.filter(
      (id) => !newAssignedIds.includes(id)
    );

    const oldCustomerId = oldWork.customer;
    const newCustomerId = updates.customer || oldCustomerId;

    const updatedWork = await Work.findByIdAndUpdate(
      workId,
      {
        $set: updates,
        $push: {
          timeline: {
            title: "Work Updated",
            description: "Work details were updated",
            createdBy: userId,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (String(oldCustomerId) !== String(newCustomerId)) {
      await Customer.findByIdAndUpdate(oldCustomerId, {
        $pull: { works: { work: updatedWork._id } },
      });

      await Customer.findByIdAndUpdate(newCustomerId, {
        $push: {
          works: {
            work: updatedWork._id,
            parentWorkId: updatedWork.parentWorkId || null,
            title: updatedWork.title,
            workType: updatedWork.workType,
            assignedTo: updatedWork.assignedTo,
            status: updatedWork.status,
            priority: updatedWork.priority,
            dueDate: updatedWork.dueDate,
          },
        },
      });
    } else {
      await syncCustomerWork(updatedWork);
    }

    if (addedAssignedIds.length > 0) {
      await notifyMany(addedAssignedIds, {
        title: "Work Assigned",
        message: `${updatedWork.title} has been assigned to you.`,
        type: "work",
        moduleId: updatedWork._id,
        moduleModel: "Work",
        createdBy: userId,
        link: "/works",
      });

      await sendMailToAssignedEmployees({
        assignedTo: addedAssignedIds,
        subject: "Work Assigned",
        title: "Work Assigned",
        message: `${updatedWork.title} has been assigned to you.`,
        work: updatedWork,
        customer: null,
      });
    }

    if (removedAssignedIds.length > 0) {
      await notifyMany(removedAssignedIds, {
        title: "Work Reassigned",
        message: `${updatedWork.title} has been reassigned to another employee.`,
        type: "work",
        moduleId: updatedWork._id,
        moduleModel: "Work",
        createdBy: userId,
        link: "/works",
      });
    }

    const populatedWork = await populateWork(updatedWork._id);

    return res.status(200).json({
      success: true,
      message: "Work updated successfully",
      data: populatedWork,
    });
  } catch (error) {
    console.log("Update work error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update work",
      error: error.message,
    });
  }
};

exports.assignWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = getUserId(req.user);
    const finalAssignedTo = toArray(req.body.assignedTo).filter(Boolean);

    if (finalAssignedTo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Assigned employee is required",
      });
    }

    const work = await Work.findById(workId);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.assignedTo = finalAssignedTo;
    work.timeline.push({
      title: "Work Assigned",
      description: "Assigned employees were updated",
      createdBy: userId,
    });

    await work.save();
    await syncCustomerWork(work);

    await notifyMany(finalAssignedTo, {
      title: "Work Assigned",
      message: `${work.title} has been assigned to you.`,
      type: "work",
      moduleId: work._id,
      moduleModel: "Work",
      createdBy: userId,
      link: "/works",
    });

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Work assigned successfully",
      data: populatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to assign work",
      error: error.message,
    });
  }
};

exports.updateWorkStatus = async (req, res) => {
  try {
    const { status, managerReviewNote } = req.body;
    const userId = getUserId(req.user);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work status",
      });
    }

    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.status = status;

    if (managerReviewNote) {
      work.managerReviewNote = managerReviewNote;
    }

    if (status === "Review") {
      work.approvalRequired = true;

      work.timeline.push({
        title: "Submitted For Review",
        description: "Work submitted for manager/admin approval",
        createdBy: userId,
      });

      const approval = await WorkApproval.create({
        work: work._id,
        customer: work.customer,
        submittedBy: userId,
        assignedTo: work.assignedTo,
        reviewMessage: work.progressNote || `${work.title} submitted for approval`,
      });

      const admins = await User.find({
        role: { $in: ADMIN_ROLES },
      });

      await Promise.all(
        admins.map((admin) =>
          notifyUser({
            title: "Work Approval Required",
            message: `${work.title} requires approval.`,
            type: "approval",
            moduleId: approval._id,
            moduleModel: "Work",
            recipient: admin._id,
            createdBy: userId,
            link: "/work-approvals",
          })
        )
      );
    }

    if (status === "Completed" || status === "Approved") {
      work.status = status === "Approved" ? "Approved" : "Completed";
      work.approvalStatus = "Approved";
      work.approvalRequired = false;
      work.approvedBy = userId;
      work.approvedAt = new Date();

      work.timeline.push({
        title: "Work Approved",
        description: managerReviewNote || "Work approved and marked as completed",
        createdBy: userId,
      });

      await WorkApproval.updateMany(
        { work: work._id, status: "Pending Approval" },
        {
          $set: {
            status: "Approved",
            adminRemark: managerReviewNote || "Work approved",
            reviewedBy: userId,
            reviewedAt: new Date(),
          },
        }
      );
    }

    if (status === "Revision") {
      work.approvalStatus = "Revision";
      work.approvalRequired = true;

      work.timeline.push({
        title: "Revision Requested",
        description: managerReviewNote || "Revision requested",
        createdBy: userId,
      });

      await WorkApproval.updateMany(
        { work: work._id, status: "Pending Approval" },
        {
          $set: {
            status: "Revision Requested",
            adminRemark: managerReviewNote || "Revision requested",
            reviewedBy: userId,
            reviewedAt: new Date(),
          },
          $inc: { revisionCount: 1 },
        }
      );
    }

    if (status === "Failed") {
      work.approvalStatus = "Rejected";
      work.timeline.push({
        title: "Work Failed",
        description: managerReviewNote || "Work marked as failed",
        createdBy: userId,
      });
    }

    await work.save();
    await syncCustomerWork(work);

    await notifyMany(work.assignedTo, {
      title: "Work Status Updated",
      message: `${work.title} status changed to ${status}.`,
      type: "work",
      moduleId: work._id,
      moduleModel: "Work",
      createdBy: userId,
      link: "/works",
    });

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Work status updated successfully",
      data: populatedWork,
    });
  } catch (error) {
    console.log("Update status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update work status",
      error: error.message,
    });
  }
};

exports.addWorkUpdate = async (req, res) => {
  try {
    const { message, files, timeSpent } = req.body;
    const userId = getUserId(req.user);

    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    const safeFiles = toArray(files);

    work.updates.push({
      message,
      files: safeFiles,
      timeSpent: Number(timeSpent) || 0,
      by: userId,
      byName: req.user.name || req.user.email,
    });

    work.progressNote = message;
    work.timeSpent = (work.timeSpent || 0) + (Number(timeSpent) || 0);

    safeFiles.forEach((file) => {
      work.attachments.push({
        fileName: String(file).split("/").pop() || "Attachment",
        fileUrl: file,
        fileType: "",
        uploadedBy: userId,
      });
    });

    work.timeline.push({
      title: "Work Update Added",
      description: message || "Employee added work update",
      createdBy: userId,
    });

    await work.save();

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Work update added successfully",
      data: populatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add work update",
      error: error.message,
    });
  }
};

exports.addWorkComment = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = getUserId(req.user);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.comments.push({
      message,
      createdBy: userId,
      createdByName: req.user.name || req.user.email || "User",
    });

    work.timeline.push({
      title: "Comment Added",
      description: message,
      createdBy: userId,
    });

    await work.save();

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: populatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

exports.addWorkAttachment = async (req, res) => {
  try {
    const { fileName, fileUrl, fileType } = req.body;
    const userId = getUserId(req.user);

    if (!fileUrl && !fileName) {
      return res.status(400).json({
        success: false,
        message: "File name or file URL is required",
      });
    }

    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.attachments.push({
      fileName: fileName || "Attachment",
      fileUrl: fileUrl || "",
      fileType: fileType || "",
      uploadedBy: userId,
    });

    work.timeline.push({
      title: "Attachment Added",
      description: fileName || "Attachment added",
      createdBy: userId,
    });

    await work.save();

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Attachment added successfully",
      data: populatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add attachment",
      error: error.message,
    });
  }
};

exports.deleteWorkAttachment = async (req, res) => {
  try {
    const { id, attachmentIndex } = req.params;
    const userId = getUserId(req.user);

    const work = await Work.findById(id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    const index = Number(attachmentIndex);

    if (Number.isNaN(index) || index < 0 || index >= work.attachments.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid attachment index",
      });
    }

    const removed = work.attachments[index];

    work.attachments.splice(index, 1);

    work.timeline.push({
      title: "Attachment Removed",
      description: removed?.fileName || "Attachment removed",
      createdBy: userId,
    });

    await work.save();

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Attachment removed successfully",
      data: populatedWork,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete attachment",
      error: error.message,
    });
  }
};

exports.getWorkAnalytics = async (req, res) => {
  try {
    const filter = await getRoleWorkFilter(req.user);

    const works = await Work.find(filter);

    const total = works.length;
    const completed = works.filter((w) => w.status === "Completed").length;
    const review = works.filter((w) => w.status === "Review").length;
    const inProgress = works.filter((w) => w.status === "In Progress").length;
    const pending = works.filter((w) =>
      ["Pending", "Not Started"].includes(w.status)
    ).length;
    const overdue = works.filter(
      (w) =>
        w.dueDate &&
        new Date(w.dueDate) < new Date() &&
        w.status !== "Completed"
    ).length;

    const urgent = works.filter((w) => w.priority === "Urgent").length;
    const high = works.filter((w) => w.priority === "High").length;
    const totalTimeSpent = works.reduce(
      (sum, work) => sum + Number(work.timeSpent || 0),
      0
    );

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        review,
        inProgress,
        pending,
        overdue,
        urgent,
        high,
        totalTimeSpent,
        completionRate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch work analytics",
      error: error.message,
    });
  }
};

exports.deleteWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    await Customer.findByIdAndUpdate(work.customer, {
      $pull: {
        works: { work: work._id },
      },
    });

    await Work.deleteMany({ parentWorkId: work._id });
    await Work.findByIdAndDelete(req.params.id);

    await notifyMany(work.assignedTo, {
      title: "Work Deleted",
      message: `${work.title} has been deleted.`,
      type: "work",
      moduleId: work._id,
      moduleModel: "Work",
      createdBy: getUserId(req.user),
      link: "/works",
    });

    return res.status(200).json({
      success: true,
      message: "Work deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete work",
      error: error.message,
    });
  }
};

exports.approveWork = async (req, res) => {
  try {
    const { adminRemark, managerReviewNote, status = "Completed" } = req.body;
    const userId = getUserId(req.user);
    const remark = adminRemark || managerReviewNote || "Work approved";

    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.status = status === "Approved" ? "Approved" : "Completed";
    work.approvalStatus = "Approved";
    work.approvalRequired = false;
    work.approvedBy = userId;
    work.approvedAt = new Date();
    work.managerReviewNote = remark;

    work.timeline = work.timeline || [];
    work.timeline.push({
      title: "Work Approved",
      description: remark,
      createdBy: userId,
    });

    await work.save();

    await WorkApproval.updateMany(
      { work: work._id, status: "Pending Approval" },
      {
        $set: {
          status: "Approved",
          adminRemark: remark,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      }
    );

    await syncCustomerWork(work);

    await notifyMany(work.assignedTo || [], {
      title: "Work Approved",
      message: `${work.title} has been approved and marked completed.`,
      type: "approval",
      moduleId: work._id,
      moduleModel: "Work",
      createdBy: userId,
      link: "/works",
    });

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Work approved successfully",
      data: populatedWork,
    });
  } catch (error) {
    console.log("Approve work error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve work",
      error: error.message,
    });
  }
};

exports.revisionWork = async (req, res) => {
  try {
    const { adminRemark, managerReviewNote } = req.body;
    const userId = getUserId(req.user);
    const remark = adminRemark || managerReviewNote || "Revision requested";

    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    work.status = "Revision";
    work.approvalStatus = "Revision";
    work.approvalRequired = true;
    work.managerReviewNote = remark;

    work.timeline = work.timeline || [];
    work.timeline.push({
      title: "Revision Requested",
      description: remark,
      createdBy: userId,
    });

    await work.save();

    await WorkApproval.updateMany(
      { work: work._id, status: "Pending Approval" },
      {
        $set: {
          status: "Revision Requested",
          adminRemark: remark,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
        $inc: { revisionCount: 1 },
      }
    );

    await syncCustomerWork(work);

    await notifyMany(work.assignedTo || [], {
      title: "Revision Requested",
      message: `${work.title} requires revision.`,
      type: "approval",
      moduleId: work._id,
      moduleModel: "Work",
      createdBy: userId,
      link: "/works",
    });

    const populatedWork = await populateWork(work._id);

    return res.status(200).json({
      success: true,
      message: "Revision requested successfully",
      data: populatedWork,
    });
  } catch (error) {
    console.log("Revision work error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to request revision",
      error: error.message,
    });
  }
};