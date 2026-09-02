const AuditLog = require("../models/AuditLog");

exports.getAuditLogs = async (req, res) => {
  try {
    const { customerId, actorType, action, status, page = 1, limit = 50 } = req.query;
    let filter = {};

    if (customerId) filter.customerId = customerId;
    if (actorType) filter.actorType = actorType;
    if (action) filter.action = action;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find(filter)
      .populate("customerId", "name companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createAuditLog = async (payload) => {
  try {
    return await AuditLog.create(payload);
  } catch (error) {
    console.error("Audit log creation error:", error.message);
  }
};
