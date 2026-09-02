const ClientAttachment = require("../models/ClientAttachment.js");

exports.uploadClientAttachment = async (req, res) => {
  try {
    const { customerId, title, category, notes } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const attachment = await ClientAttachment.create({
      customerId,
      uploadedBy: req.client?._id,
      title: title || req.file.originalname,
      category: category || "Other",
      notes: notes || "",
      fileName: req.file.originalname,
      fileUrl: `/uploads/client-attachments/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({
      message: "Attachment uploaded successfully",
      attachment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClientAttachments = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.query.customerId;
    const filter = customerId ? { customerId } : {};

    const attachments = await ClientAttachment.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: attachments.length,
      attachments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClientAttachment = async (req, res) => {
  try {
    const attachment = await ClientAttachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    await attachment.deleteOne();

    res.status(200).json({
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};