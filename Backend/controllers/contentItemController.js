const ContentItem = require("../models/ContentItem");
const Customer = require("../models/Customer");
const WorkApproval = require("../models/WorkApproval");
const AuditLog = require("../models/AuditLog");
const createNotification = require("../utils/createNotification");
const { scheduleContentPublish, cancelScheduledContent } = require("../services/schedulerService");

exports.getContentItems = async (req, res) => {
  try {
    const { customerId, clientLocationId, status, approvalStatus, publishStatus, contentType, platform } = req.query;
    let filter = {};

    if (customerId) filter.customerId = customerId;
    if (clientLocationId) filter.clientLocationId = clientLocationId;
    if (status) filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (publishStatus) filter.publishStatus = publishStatus;
    if (contentType) filter.contentType = contentType;
    if (platform) filter.platforms = { $in: [platform] };

    const items = await ContentItem.find(filter)
      .populate("customerId", "name companyName")
      .populate("clientLocationId", "name city")
      .populate("creativeProjectId", "title versions currentVersion approvalStatus")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ scheduledFor: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getContentItemById = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id)
      .populate("customerId", "name companyName")
      .populate("clientLocationId", "name city")
      .populate("creativeProjectId")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Content item not found",
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createContentItem = async (req, res) => {
  try {
    const { customerId, title, contentType, platforms } = req.body;

    if (!customerId || !title || !contentType) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, title and content type are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Associated Customer not found",
      });
    }

    const item = await ContentItem.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    await AuditLog.create({
      actorType: req.user?.role || "Employee",
      actorId: req.user?._id,
      actorName: req.user?.name || "User",
      action: "content_created",
      entityType: "ContentItem",
      entityId: item._id,
      customerId: item.customerId,
      inputSummary: `Created content item "${item.title}" (${item.contentType})`,
      status: "Success",
    });

    res.status(201).json({
      success: true,
      message: "Content item created successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateContentItem = async (req, res) => {
  try {
    let item = await ContentItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Content item not found",
      });
    }

    item = await ContentItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Content item updated successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.submitContentForApproval = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Content item not found" });

    item.approvalStatus = "Pending Approval";
    item.status = "Approval Pending";
    await item.save();

    const approval = await WorkApproval.create({
      approvalType: "Content",
      contentItemId: item._id,
      customer: item.customerId,
      submittedBy: req.user?._id,
      reviewMessage: req.body.reviewMessage || `Approval requested for content "${item.title}"`,
      status: "Pending Approval",
    });

    await AuditLog.create({
      actorType: req.user?.role || "Employee",
      actorId: req.user?._id,
      actorName: req.user?.name || "User",
      action: "content_approval_requested",
      entityType: "ContentItem",
      entityId: item._id,
      customerId: item.customerId,
      approvalId: approval._id,
      inputSummary: `Submitted content "${item.title}" for manager approval`,
      status: "Pending Approval",
    });

    res.status(200).json({
      success: true,
      message: "Content submitted for manager approval",
      item,
      approval,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveContentItem = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Content item not found" });

    item.approvalStatus = "Approved";
    item.status = "Approved";
    item.approvedBy = req.user?._id;
    item.approvedAt = new Date();
    await item.save();

    await WorkApproval.updateOne(
      { contentItemId: item._id, status: "Pending Approval" },
      { $set: { status: "Approved", reviewedBy: req.user?._id, reviewedAt: new Date(), adminRemark: req.body.remark || "Approved" } }
    );

    await AuditLog.create({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "content_approved",
      entityType: "ContentItem",
      entityId: item._id,
      customerId: item.customerId,
      inputSummary: `Approved content "${item.title}"`,
      status: "Success",
    });

    res.status(200).json({
      success: true,
      message: "Content approved successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestContentRevision = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Content item not found" });

    item.approvalStatus = "Revision Requested";
    item.status = "Revision";
    await item.save();

    await WorkApproval.updateOne(
      { contentItemId: item._id, status: "Pending Approval" },
      { $set: { status: "Revision Requested", reviewedBy: req.user?._id, reviewedAt: new Date(), adminRemark: req.body.remark || "Revision requested" } }
    );

    await AuditLog.create({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "content_revision_requested",
      entityType: "ContentItem",
      entityId: item._id,
      customerId: item.customerId,
      inputSummary: `Requested revision for content "${item.title}": ${req.body.remark || ""}`,
      status: "Warning",
    });

    res.status(200).json({
      success: true,
      message: "Revision requested for content",
      item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleContent = async (req, res) => {
  try {
    const { scheduledFor, timezone } = req.body;
    if (!scheduledFor) return res.status(400).json({ success: false, message: "scheduledFor date/time is required" });

    const result = await scheduleContentPublish({
      contentItemId: req.params.id,
      scheduledFor,
      timezone,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: "Content item scheduled successfully",
      item: result.contentItem,
      scheduledJob: result.scheduledJob,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelContentSchedule = async (req, res) => {
  try {
    const result = await cancelScheduledContent({
      contentItemId: req.params.id,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: "Content schedule cancelled",
      item: result.contentItem,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
