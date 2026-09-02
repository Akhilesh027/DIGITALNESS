const Communication = require("../models/Communication");

// ========== CUSTOMER COMMUNICATIONS ==========
exports.getCustomerCommunications = async (req, res) => {
  try {
    const { customerId } = req.params;
    const communications = await Communication.find({ customerId })
      .sort({ createdAt: 1 })
      .populate("customerId")
      .populate("by", "name email role");
    res.status(200).json({ success: true, data: communications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomerCommunication = async (req, res) => {
  try {
    const { customerId } = req.params; // ✅ take from URL
    const { channel, direction, subject, message } = req.body;
    const communication = await Communication.create({
      customerId,
      channel,
      direction,
      subject,
      message,
      by: req.user?._id,
      byName: req.user?.name || "System",
    });
    const saved = await Communication.findById(communication._id)
      .populate("customerId")
      .populate("by", "name email role");
    const io = req.app.get("io");
    io.to(`customer_${customerId}`).emit("new_communication", saved);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== EMPLOYEE COMMUNICATIONS ==========
exports.getEmployeeCommunications = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const communications = await Communication.find({ employeeId })
      .sort({ createdAt: 1 })
      .populate("employeeId", "name email role")
      .populate("by", "name email role");
    res.status(200).json({ success: true, data: communications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEmployeeCommunication = async (req, res) => {
  try {
    const { employeeId } = req.params; // ✅ take from URL
    const { channel, direction, subject, message } = req.body;
    const communication = await Communication.create({
      employeeId,
      channel,
      direction,
      subject,
      message,
      by: req.user?._id,
      byName: req.user?.name || "System",
    });
    const saved = await Communication.findById(communication._id)
      .populate("employeeId", "name email role")
      .populate("by", "name email role");
    const io = req.app.get("io");
    io.to(`employee_${employeeId}`).emit("new_communication", saved);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy support (if your frontend still uses old routes)
exports.createCommunication = async (req, res) => {
  const { customerId, employeeId } = req.body;
  if (customerId) {
    req.params.customerId = customerId;
    return exports.createCustomerCommunication(req, res);
  } else if (employeeId) {
    req.params.employeeId = employeeId;
    return exports.createEmployeeCommunication(req, res);
  } else {
    return res.status(400).json({ success: false, message: "Missing customerId or employeeId" });
  }
};