const DailyUpdate = require("../models/DailyUpdate");
const Work = require("../models/Work");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Customer = require("../models/Customer");

const ADMIN_ROLES = ["Admin", "admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const getUserId = (user) => user?._id || user?.id || user;

const normalizeStatus = (status) => {
  if (!status) return "In Progress";

  const map = {
    "In Review": "Review",
    "Rework Required": "Revision",
    Approved: "Completed",
  };

  return map[status] || status;
};

const normalizeDate = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

const formatAttachments = (files = [], bodyAttachments = []) => {
  const multerFiles =
    files?.map((file) => ({
      fileName: file.originalname || file.filename || "Attachment",
      fileUrl: `/uploads/daily-updates/${file.filename}`,
      fileType: file.mimetype || "",
      uploadedAt: new Date(),
    })) || [];

  let parsedBodyAttachments = [];

  if (Array.isArray(bodyAttachments)) {
    parsedBodyAttachments = bodyAttachments;
  } else if (typeof bodyAttachments === "string") {
    try {
      parsedBodyAttachments = JSON.parse(bodyAttachments);
    } catch {
      parsedBodyAttachments = bodyAttachments
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
    }
  }

  const normalizedBodyAttachments = parsedBodyAttachments.map((item) => {
    if (typeof item === "string") {
      return {
        fileName: item.split("/").pop() || "Attachment",
        fileUrl: item,
        fileType: "",
        uploadedAt: new Date(),
      };
    }

    return {
      fileName: item.fileName || "Attachment",
      fileUrl: item.fileUrl || item.url || "",
      fileType: item.fileType || "",
      uploadedAt: item.uploadedAt || new Date(),
    };
  });

  return [...multerFiles, ...normalizedBodyAttachments];
};

const createNotificationSafe = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error("Notification Create Error:", error.message);
  }
};

const createManyNotificationsSafe = async (payloads = []) => {
  try {
    if (payloads.length > 0) await Notification.insertMany(payloads);
  } catch (error) {
    console.error("Notifications Create Error:", error.message);
  }
};

const populateUpdateQuery = (query) => {
  return query
    .populate("employee", "name fullName username email role branchId department")
    .populate("work", "title workType status priority dueDate progressNote timeSpent assignedTo")
    .populate("customer", "name businessName companyName email phone contactNumbers branchId")
    .populate("reviewedBy", "name fullName username email role");
};

const getRoleFilter = async (user) => {
  if (ADMIN_ROLES.includes(user?.role)) return {};

  if (MANAGER_ROLES.includes(user?.role)) {
    return { branchId: user.branchId };
  }

  return { employee: getUserId(user) };
};

const syncWorkWithDailyUpdate = async ({
  selectedWork,
  dailyUpdate,
  attachmentDocs,
  user,
}) => {
  if (!selectedWork) return;

  selectedWork.status = dailyUpdate.currentStatus || selectedWork.status;
  selectedWork.progressNote = dailyUpdate.workCompleted;
  selectedWork.timeSpent =
    Number(selectedWork.timeSpent || 0) + Number(dailyUpdate.totalHours || 0);

  selectedWork.progressPercentage = Number(dailyUpdate.progressPercentage || 0);

  if (!Array.isArray(selectedWork.updates)) selectedWork.updates = [];

  selectedWork.updates.push({
    message: dailyUpdate.workCompleted,
    files: attachmentDocs.map((a) => a.fileUrl),
    timeSpent: Number(dailyUpdate.totalHours) || 0,
    by: getUserId(user),
    byName: user.name || user.fullName || user.username || user.email,
    createdAt: new Date(),
  });

  if (Array.isArray(selectedWork.attachments)) {
    attachmentDocs.forEach((file) => {
      selectedWork.attachments.push({
        fileName: file.fileName || "Attachment",
        fileUrl: file.fileUrl || "",
        fileType: file.fileType || "",
        uploadedBy: getUserId(user),
        uploadedAt: new Date(),
      });
    });
  }

  if (Array.isArray(selectedWork.timeline)) {
    selectedWork.timeline.push({
      title: "Daily Update Submitted",
      description: dailyUpdate.workCompleted,
      createdBy: getUserId(user),
    });
  }

  await selectedWork.save();
};

exports.submitDailyUpdate = async (req, res) => {
  try {
    const employee = getUserId(req.user);

    const {
      date,
      work,
      taskId,
      startTime,
      endTime,
      totalHours,
      currentStatus,
      progressPercentage,
      workCompleted,
      pendingWork,
      blockers,
      tomorrowPlan,
      referencesLinks,
      attachments,
    } = req.body;

    const workId = work || taskId;

    if (!date || !workCompleted) {
      return res.status(400).json({
        success: false,
        message: "Date and completed work are required",
      });
    }

    let selectedWork = null;

    if (workId) {
      selectedWork = await Work.findById(workId)
        .populate("customer", "name businessName companyName email phone branchId")
        .populate("assignedTo", "name role email");

      if (!selectedWork) {
        return res.status(404).json({
          success: false,
          message: "Selected work/task not found",
        });
      }

      const assignedUsers = Array.isArray(selectedWork.assignedTo)
        ? selectedWork.assignedTo
        : [];

      const isAssigned = assignedUsers.some(
        (user) => String(user._id || user) === String(employee)
      );

      if (!isAssigned && !ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this work",
        });
      }
    }

    const normalizedDate = normalizeDate(date);
    const normalizedStatus = normalizeStatus(currentStatus);
    const attachmentDocs = formatAttachments(req.files, attachments);

    const customerName =
      selectedWork?.customer?.name ||
      selectedWork?.customer?.businessName ||
      selectedWork?.customer?.companyName ||
      req.body.clientName ||
      "";

    const payload = {
      employee,
      work: selectedWork?._id || null,
      customer: selectedWork?.customer?._id || req.body.customer || null,
      date: normalizedDate,

      projectName:
        req.body.projectName ||
        selectedWork?.parentWorkTitle ||
        selectedWork?.projectName ||
        selectedWork?.workType ||
        selectedWork?.title ||
        "",

      clientName: customerName,

      workCategory:
        req.body.workCategory ||
        selectedWork?.workType ||
        selectedWork?.category ||
        "General",

      taskTitle: req.body.taskTitle || selectedWork?.title || "Daily Work Update",

      startTime: startTime || "",
      endTime: endTime || "",
      totalHours: Number(totalHours) || 0,
      currentStatus: normalizedStatus,
      progressPercentage: Number(progressPercentage) || 0,
      workCompleted,
      pendingWork: pendingWork || "",
      blockers: blockers || "",
      tomorrowPlan: tomorrowPlan || "",
      referencesLinks: referencesLinks || "",
      attachments: attachmentDocs,
      approvalStatus: "Pending",
      managerComment: "",
      revisionReason: "",
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: new Date(),

      branchId:
        selectedWork?.customer?.branchId ||
        req.user.branchId ||
        req.body.branchId ||
        "",
    };

    const dailyUpdate = await DailyUpdate.findOneAndUpdate(
      selectedWork
        ? { employee, work: selectedWork._id, date: normalizedDate }
        : { employee, work: null, date: normalizedDate, taskTitle: payload.taskTitle },
      { $set: payload },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    if (selectedWork) {
      await syncWorkWithDailyUpdate({
        selectedWork,
        dailyUpdate,
        attachmentDocs,
        user: req.user,
      });
    }

    const adminsAndManagers = await User.find({
      role: { $in: ["Admin", "admin", "Operational Manager", "Branch Manager"] },
    }).select("_id name role branchId");

    const reviewers = adminsAndManagers.filter((user) => {
      if (ADMIN_ROLES.includes(user.role)) return true;
      return String(user.branchId || "") === String(payload.branchId || req.user.branchId || "");
    });

    const notifications = reviewers.map((user) => ({
      title: "New Daily Work Update",
      message: `${req.user.name || req.user.email} submitted a daily update for "${payload.taskTitle}"`,
      type: "approval",
      moduleId: dailyUpdate._id,
      moduleModel: "DailyUpdate",
      recipient: user._id,
      createdBy: employee,
      link: "/daily-updates",
    }));

    await createManyNotificationsSafe(notifications);

    const populatedUpdate = await populateUpdateQuery(
      DailyUpdate.findById(dailyUpdate._id)
    );

    res.status(200).json({
      success: true,
      message: "Daily update submitted successfully",
      data: populatedUpdate,
    });
  } catch (error) {
    console.error("Submit Daily Update Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUpdates = async (req, res) => {
  try {
    const { employeeId, status, fromDate, toDate, workId, customerId } = req.query;

    const filter = await getRoleFilter(req.user);

    if (employeeId) filter.employee = employeeId;
    if (status) filter.approvalStatus = status;
    if (workId) filter.work = workId;
    if (customerId) filter.customer = customerId;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const updates = await populateUpdateQuery(
      DailyUpdate.find(filter).sort({ date: -1, submittedAt: -1 })
    );

    res.json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyUpdates = async (req, res) => {
  try {
    const { fromDate, toDate, status } = req.query;

    const filter = { employee: getUserId(req.user) };

    if (status) filter.approvalStatus = status;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const updates = await populateUpdateQuery(
      DailyUpdate.find(filter).sort({ date: -1, submittedAt: -1 })
    );

    res.json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCalendarUpdates = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const now = new Date();
    const selectedMonth = Number(month || now.getMonth() + 1);
    const selectedYear = Number(year || now.getFullYear());

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    const filter = await getRoleFilter(req.user);

    filter.date = {
      $gte: startDate,
      $lte: endDate,
    };

    if (employeeId) filter.employee = employeeId;

    const updates = await populateUpdateQuery(
      DailyUpdate.find(filter).sort({ date: 1 })
    );

    const calendar = updates.map((update) => ({
      id: update._id,
      date: update.date,
      employee: update.employee,
      taskTitle: update.taskTitle,
      projectName: update.projectName,
      clientName: update.clientName,
      totalHours: update.totalHours,
      currentStatus: update.currentStatus,
      approvalStatus: update.approvalStatus,
      blockers: update.blockers,
      workCompleted: update.workCompleted,
      managerComment: update.managerComment,
    }));

    res.json({
      success: true,
      count: calendar.length,
      data: calendar,
    });
  } catch (error) {
    console.error("Calendar Updates Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDailyUpdateStats = async (req, res) => {
  try {
    const { fromDate, toDate, employeeId } = req.query;

    const filter = await getRoleFilter(req.user);

    if (employeeId) filter.employee = employeeId;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const updates = await DailyUpdate.find(filter);

    const total = updates.length;
    const pending = updates.filter((u) => u.approvalStatus === "Pending").length;
    const approved = updates.filter((u) => u.approvalStatus === "Approved").length;
    const changesRequested = updates.filter(
      (u) => u.approvalStatus === "Changes Requested"
    ).length;

    const blocked = updates.filter(
      (u) => u.currentStatus === "Blocked" || Boolean(u.blockers)
    ).length;

    const totalHours = updates.reduce(
      (sum, update) => sum + Number(update.totalHours || 0),
      0
    );

    const approvalRate =
      total > 0 ? Math.round((approved / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        changesRequested,
        blocked,
        totalHours,
        approvalRate,
      },
    });
  } catch (error) {
    console.error("Daily Update Stats Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.reviewDailyUpdate = async (req, res) => {
  try {
    const { approvalStatus, managerComment, revisionReason } = req.body;

    const allowedStatuses = ["Pending", "Approved", "Changes Requested"];

    if (!allowedStatuses.includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status",
      });
    }

    const update = await populateUpdateQuery(
      DailyUpdate.findById(req.params.id)
    );

    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Update not found",
      });
    }

    update.approvalStatus = approvalStatus;
    update.managerComment = managerComment || "";
    update.revisionReason =
      approvalStatus === "Changes Requested"
        ? revisionReason || managerComment || ""
        : "";
    update.reviewedBy = getUserId(req.user);
    update.reviewedAt = new Date();

    await update.save();

    if (update.work) {
      const work = await Work.findById(update.work._id || update.work);

      if (work) {
        if (approvalStatus === "Approved") {
          work.timeline?.push({
            title: "Daily Update Approved",
            description: managerComment || "Daily update approved by manager",
            createdBy: getUserId(req.user),
          });
        }

        if (approvalStatus === "Changes Requested") {
          work.status = "Revision";
          work.managerReviewNote = revisionReason || managerComment || "";

          work.timeline?.push({
            title: "Daily Update Changes Requested",
            description: revisionReason || managerComment || "Changes requested",
            createdBy: getUserId(req.user),
          });
        }

        await work.save();
      }
    }

    await createNotificationSafe({
      title:
        approvalStatus === "Approved"
          ? "Daily Update Approved"
          : "Changes Requested",

      message:
        approvalStatus === "Approved"
          ? `Your daily update for "${update.taskTitle}" has been approved by ${req.user.name || req.user.email}`
          : `Changes requested for your daily update "${update.taskTitle}"`,

      type: "approval",
      moduleId: update._id,
      moduleModel: "DailyUpdate",
      recipient: update.employee?._id || update.employee,
      createdBy: getUserId(req.user),
      link: "/daily-updates",
    });

    const populatedUpdate = await populateUpdateQuery(
      DailyUpdate.findById(update._id)
    );

    res.json({
      success: true,
      message: "Daily update reviewed successfully",
      data: populatedUpdate,
    });
  } catch (error) {
    console.error("Review Daily Update Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDailyUpdate = async (req, res) => {
  try {
    const update = await DailyUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Update not found",
      });
    }

    await update.deleteOne();

    res.json({
      success: true,
      message: "Update deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getEmployeeProductivity = async (req, res) => {
  try {
    const { employeeId, fromDate, toDate } = req.query;

    const filter = await getRoleFilter(req.user);

    if (employeeId) filter.employee = employeeId;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const updates = await DailyUpdate.find(filter).populate(
      "employee",
      "name fullName username email role branchId department"
    );

    const grouped = {};

    updates.forEach((update) => {
      const employee = update.employee;
      const id = String(employee?._id || update.employee);

      if (!grouped[id]) {
        grouped[id] = {
          employee,
          totalUpdates: 0,
          totalHours: 0,
          approved: 0,
          pending: 0,
          changesRequested: 0,
          blocked: 0,
          avgProgress: 0,
          progressTotal: 0,
        };
      }

      grouped[id].totalUpdates += 1;
      grouped[id].totalHours += Number(update.totalHours || 0);
      grouped[id].progressTotal += Number(update.progressPercentage || 0);

      if (update.approvalStatus === "Approved") grouped[id].approved += 1;
      if (update.approvalStatus === "Pending") grouped[id].pending += 1;
      if (update.approvalStatus === "Changes Requested") {
        grouped[id].changesRequested += 1;
      }

      if (update.currentStatus === "Blocked" || update.blockers) {
        grouped[id].blocked += 1;
      }
    });

    const productivity = Object.values(grouped).map((item) => ({
      ...item,
      avgProgress:
        item.totalUpdates > 0
          ? Math.round(item.progressTotal / item.totalUpdates)
          : 0,
      approvalRate:
        item.totalUpdates > 0
          ? Math.round((item.approved / item.totalUpdates) * 100)
          : 0,
    }));

    res.json({
      success: true,
      count: productivity.length,
      data: productivity,
    });
  } catch (error) {
    console.error("Productivity Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendReminder = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findById(employeeId).select(
      "name fullName username email role branchId"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await createNotificationSafe({
      title: "Daily Update Reminder",
      message: "You have not submitted today's work update. Please submit it.",
      type: "reminder",
      moduleId: employee._id,
      moduleModel: "User",
      recipient: employee._id,
      createdBy: getUserId(req.user),
      link: "/daily-updates",
    });

    res.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Send Reminder Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const buildReportData = async ({ employeeId, fromDate, toDate }) => {
  const employee = await User.findById(employeeId).select(
    "name fullName username email role department branchId"
  );

  const filter = { employee: employeeId };

  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = normalizeDate(fromDate);
    if (toDate) filter.date.$lte = normalizeDate(toDate);
  }

  const updates = await populateUpdateQuery(
    DailyUpdate.find(filter).sort({ date: 1 })
  );

  const totalHours = updates.reduce(
    (sum, update) => sum + Number(update.totalHours || 0),
    0
  );

  const approved = updates.filter(
    (update) => update.approvalStatus === "Approved"
  ).length;

  const blocked = updates.filter(
    (update) => update.currentStatus === "Blocked" || update.blockers
  ).length;

  const approvalRate =
    updates.length > 0 ? Math.round((approved / updates.length) * 100) : 0;

  return {
    company: {
      name: "Digitalness Industries LLP",
      tagline: "Designed and Developed by Digitalness",
      website: "https://digitalness.co.in",
      location: "Hyderabad, Telangana, India",
    },
    employee,
    summary: {
      totalUpdates: updates.length,
      totalHours,
      approved,
      blocked,
      approvalRate,
    },
    updates,
    fromDate,
    toDate,
    generatedAt: new Date(),
  };
};

exports.generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = normalizeDate(date || new Date());

    const data = await buildReportData({
      employeeId: req.params.employeeId,
      fromDate: reportDate,
      toDate: reportDate,
    });

    res.json({
      success: true,
      reportType: "Daily Report",
      data,
    });
  } catch (error) {
    console.error("Daily Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateWeeklyReport = async (req, res) => {
  try {
    const today = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const data = await buildReportData({
      employeeId: req.params.employeeId,
      fromDate: start,
      toDate: end,
    });

    res.json({
      success: true,
      reportType: "Weekly Report",
      data,
    });
  } catch (error) {
    console.error("Weekly Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month || now.getMonth() + 1);
    const year = Number(req.query.year || now.getFullYear());

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    const data = await buildReportData({
      employeeId: req.params.employeeId,
      fromDate: start,
      toDate: end,
    });

    res.json({
      success: true,
      reportType: "Monthly Report",
      data,
    });
  } catch (error) {
    console.error("Monthly Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};