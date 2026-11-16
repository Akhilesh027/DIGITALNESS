const Attendance = require("../models/Attendance");

const normalizeDate = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    ""
  );
};

exports.markClockIn = async (user, req) => {
  const today = normalizeDate();
  const now = new Date();

  // Determine if late based on 10:15 AM IST cutoff
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
  const [hours, minutes] = timeStr.split(":").map(Number);
  const isLate = hours > 10 || (hours === 10 && minutes > 15);
  const initialStatus = isLate ? "Late" : "Present";

  const attendance = await Attendance.findOneAndUpdate(
    {
      employee: user._id,
      date: today,
    },
    {
      $setOnInsert: {
        employee: user._id,
        date: today,
        loginTime: now,
        status: initialStatus,
        branchId: user.branchId || "",
        loginIp: getIp(req),
        deviceInfo: req.body?.deviceInfo || req.headers["user-agent"] || "",
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  return attendance;
};

exports.markClockOut = async (user, req) => {
  const today = normalizeDate();

  const attendance = await Attendance.findOne({
    employee: user._id,
    date: today,
  });

  if (!attendance) {
    throw new Error("Clock-in record not found for today");
  }

  attendance.logoutTime = new Date();
  attendance.logoutIp = getIp(req);

  if (attendance.loginTime) {
    const diffMs = attendance.logoutTime - attendance.loginTime;
    attendance.totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    if (attendance.totalHours > 0 && attendance.totalHours < 4) {
      attendance.status = "Half Day";
    }
  }

  await attendance.save();
  return attendance;
};
