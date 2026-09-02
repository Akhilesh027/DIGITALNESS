const Attendance = require("../models/Attendance.js");
const User = require("../models/User");

const ADMIN_ROLES = ["Admin", "admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const getUserId = (user) => user?._id || user?.id || user;

const normalizeDate = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getRoleFilter = async (user) => {
  if (ADMIN_ROLES.includes(user.role)) return {};

  if (MANAGER_ROLES.includes(user.role)) {
    return { branchId: user.branchId };
  }

  return { employee: getUserId(user) };
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const filter = { employee: getUserId(req.user) };

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "name email role department designation")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { employeeId, fromDate, toDate, status } = req.query;

    const filter = await getRoleFilter(req.user);

    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = normalizeDate(fromDate);
      if (toDate) filter.date.$lte = normalizeDate(toDate);
    }

    const attendance = await Attendance.find(filter)
      .populate("employee", "name email role department designation branchId")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const today = normalizeDate();
    const filter = await getRoleFilter(req.user);
    filter.date = today;

    const attendance = await Attendance.find(filter)
      .populate("employee", "name email role department designation branchId")
      .sort({ loginTime: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const today = normalizeDate();
    const filter = await getRoleFilter(req.user);
    filter.date = today;

    const attendance = await Attendance.find(filter);

    const employeeFilter = ADMIN_ROLES.includes(req.user.role)
      ? { status: "Active" }
      : MANAGER_ROLES.includes(req.user.role)
      ? { status: "Active", branchId: req.user.branchId }
      : { _id: getUserId(req.user) };

    const totalEmployees = await User.countDocuments(employeeFilter);

    const present = attendance.length;
    const absent = Math.max(totalEmployees - present, 0);
    const late = attendance.filter((a) => a.status === "Late").length;
    const totalHours = attendance.reduce(
      (sum, a) => sum + Number(a.totalHours || 0),
      0
    );

    res.json({
      success: true,
      data: {
        totalEmployees,
        present,
        absent,
        late,
        totalHours,
        attendanceRate:
          totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};