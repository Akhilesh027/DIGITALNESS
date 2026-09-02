const ClientAIMemory = require("../models/ClientAIMemory");

exports.getAIMemories = async (req, res) => {
  try {
    const { customerId, type, status = "Active" } = req.query;
    let filter = {};

    if (customerId) filter.customerId = customerId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const memories = await ClientAIMemory.find(filter)
      .populate("customerId", "name companyName")
      .populate("approvedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createAIMemory = async (req, res) => {
  try {
    const { customerId, type, title, content } = req.body;

    if (!customerId || !type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, type, title and content are required",
      });
    }

    const memory = await ClientAIMemory.create({
      ...req.body,
      approvedBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "AI memory record created successfully",
      memory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAIMemory = async (req, res) => {
  try {
    const memory = await ClientAIMemory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "AI Memory record not found",
      });
    }

    await memory.deleteOne();

    res.status(200).json({
      success: true,
      message: "AI Memory deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
