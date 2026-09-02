const Customer = require("../models/Customer");
const Work = require("../models/Work");
const DailyUpdate = require("../models/DailyUpdate");
const User = require("../models/User");

const ADMIN_ROLES = ["Admin", "admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const getUserId = (user) => user?._id || user?.id || user;

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const canAccessCustomer = async (user, customerId) => {
  if (ADMIN_ROLES.includes(user.role)) return true;

  const customer = await Customer.findById(customerId);

  if (!customer) return false;

  if (MANAGER_ROLES.includes(user.role)) {
    return String(customer.branchId || "") === String(user.branchId || "");
  }

  return (
    String(customer.assignedTo || "") === String(getUserId(user)) ||
    String(customer.assignedManager || "") === String(getUserId(user))
  );
};

const getCustomerOrFail = async (customerId, user) => {
  const customer = await Customer.findById(customerId)
    .populate("assignedTo", "name email phone role department")
    .populate("assignedManager", "name email phone role department")
    .populate("createdBy", "name email role");

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  const allowed = await canAccessCustomer(user, customerId);

  if (!allowed) {
    const error = new Error("You do not have permission to access this customer report");
    error.statusCode = 403;
    throw error;
  }

  return customer;
};

const getDateFilter = (query = {}) => {
  const { fromDate, toDate, month, year } = query;

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    end.setHours(23, 59, 59, 999);

    return { $gte: start, $lte: end };
  }

  if (fromDate || toDate) {
    const filter = {};
    if (fromDate) filter.$gte = normalizeDate(fromDate);
    if (toDate) {
      const end = normalizeDate(toDate);
      end.setHours(23, 59, 59, 999);
      filter.$lte = end;
    }
    return filter;
  }

  return null;
};

const getCustomerWorks = async (customerId) => {
  return await Work.find({ customer: customerId })
    .populate("assignedTo", "name email role department designation")
    .populate("parentWorkId", "title workType status")
    .sort({ createdAt: -1 });
};

const getCustomerUpdates = async (customerId, dateQuery = {}) => {
  const filter = { customer: customerId };

  const dateFilter = getDateFilter(dateQuery);
  if (dateFilter) filter.date = dateFilter;

  return await DailyUpdate.find(filter)
    .populate("employee", "name email role department designation")
    .populate("work", "title workType status priority dueDate")
    .sort({ date: -1, submittedAt: -1 });
};

const buildDashboard = async (customerId, query = {}) => {
  const [customer, works, updates] = await Promise.all([
    Customer.findById(customerId),
    getCustomerWorks(customerId),
    getCustomerUpdates(customerId, query),
  ]);

  const completedProjects = works.filter((w) => w.status === "Completed").length;
  const pendingProjects = works.filter((w) =>
    ["Pending", "Not Started", "In Progress", "Review", "Revision"].includes(w.status)
  ).length;

  const totalHours = updates.reduce(
    (sum, update) => sum + Number(update.totalHours || 0),
    0
  );

  const employeesWorked = new Set(
    updates.map((u) => String(u.employee?._id || u.employee)).filter(Boolean)
  ).size;

  const approvedUpdates = updates.filter((u) => u.approvalStatus === "Approved").length;

  return {
    customer,
    totalProjects: works.length,
    completedProjects,
    pendingProjects,
    totalUpdates: updates.length,
    approvedUpdates,
    totalHours,
    employeesWorked,
    completionPercentage:
      works.length > 0 ? Math.round((completedProjects / works.length) * 100) : 0,
    totalPaid: Number(customer?.totalPaid || 0),
    totalPending: Number(customer?.totalPending || 0),
  };
};

exports.getCustomerDashboardReport = async (req, res) => {
  try {
    await getCustomerOrFail(req.params.customerId, req.user);

    const dashboard = await buildDashboard(req.params.customerId, req.query);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerProjectsReport = async (req, res) => {
  try {
    await getCustomerOrFail(req.params.customerId, req.user);

    const works = await getCustomerWorks(req.params.customerId);

    const projects = works.map((work) => ({
      id: work._id,
      title: work.title,
      workType: work.workType,
      parentWork: work.parentWorkId,
      status: work.status,
      priority: work.priority,
      dueDate: work.dueDate,
      deliverables: work.deliverables,
      completedDeliverables: work.completedDeliverables,
      progress:
        Number(work.deliverables || 0) > 0
          ? Math.round((Number(work.completedDeliverables || 0) / Number(work.deliverables || 1)) * 100)
          : 0,
      assignedEmployees: work.assignedTo,
      description: work.description,
      attachments: work.attachments || [],
    }));

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerDailyReport = async (req, res) => {
  try {
    await getCustomerOrFail(req.params.customerId, req.user);

    const updates = await getCustomerUpdates(req.params.customerId, req.query);

    res.json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerMonthlyReport = async (req, res) => {
  try {
    await getCustomerOrFail(req.params.customerId, req.user);

    const updates = await getCustomerUpdates(req.params.customerId, req.query);
    const works = await getCustomerWorks(req.params.customerId);

    const totalHours = updates.reduce(
      (sum, update) => sum + Number(update.totalHours || 0),
      0
    );

    const completedTasks = works.filter((w) => w.status === "Completed").length;
    const pendingTasks = works.filter((w) => w.status !== "Completed").length;

    const employeesWorked = new Set(
      updates.map((u) => String(u.employee?._id || u.employee)).filter(Boolean)
    ).size;

    res.json({
      success: true,
      data: {
        totalHours,
        completedTasks,
        pendingTasks,
        employeesWorked,
        totalUpdates: updates.length,
        updates,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerEmployeeReport = async (req, res) => {
  try {
    await getCustomerOrFail(req.params.customerId, req.user);

    const updates = await getCustomerUpdates(req.params.customerId, req.query);

    const grouped = {};

    updates.forEach((update) => {
      const employeeId = String(update.employee?._id || update.employee);
      if (!employeeId) return;

      if (!grouped[employeeId]) {
        grouped[employeeId] = {
          employee: update.employee,
          totalHours: 0,
          totalUpdates: 0,
          approvedUpdates: 0,
          blockedUpdates: 0,
          avgProgress: 0,
          progressTotal: 0,
        };
      }

      grouped[employeeId].totalHours += Number(update.totalHours || 0);
      grouped[employeeId].totalUpdates += 1;
      grouped[employeeId].progressTotal += Number(update.progressPercentage || 0);

      if (update.approvalStatus === "Approved") grouped[employeeId].approvedUpdates += 1;
      if (update.currentStatus === "Blocked" || update.blockers) grouped[employeeId].blockedUpdates += 1;
    });

    const employees = Object.values(grouped).map((item) => ({
      ...item,
      avgProgress:
        item.totalUpdates > 0
          ? Math.round(item.progressTotal / item.totalUpdates)
          : 0,
      approvalRate:
        item.totalUpdates > 0
          ? Math.round((item.approvedUpdates / item.totalUpdates) * 100)
          : 0,
    }));

    res.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerPaymentReport = async (req, res) => {
  try {
    const customer = await getCustomerOrFail(req.params.customerId, req.user);

    res.json({
      success: true,
      data: {
        totalPaid: Number(customer.totalPaid || 0),
        totalPending: Number(customer.totalPending || 0),
        invoices: customer.invoices || [],
        payments: customer.payments || [],
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerFullReport = async (req, res) => {
  try {
    const customer = await getCustomerOrFail(req.params.customerId, req.user);

    const [dashboard, works, updates] = await Promise.all([
      buildDashboard(req.params.customerId, req.query),
      getCustomerWorks(req.params.customerId),
      getCustomerUpdates(req.params.customerId, req.query),
    ]);

    res.json({
      success: true,
      reportType: "Client Full Report",
      company: {
        name: "Digitalness Industries LLP",
        website: "https://digitalness.co.in",
        location: "Hyderabad, Telangana, India",
      },
      generatedAt: new Date(),
      customer,
      dashboard,
      works,
      updates,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};