/**
 * contentHandlers.js
 * Deterministic handlers for Content and Creative deliverable commands.
 */

const ContentItem = require("../../../models/ContentItem");
const CreativeProject = require("../../../models/CreativeProject");

exports.getPendingContent = async (params = {}, ctx = {}) => {
  const query = {
    approvalStatus: { $in: ["Pending Approval", "Pending", "Draft"] },
  };
  if (params.customerId) {
    query.customerId = params.customerId;
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const items = await ContentItem.find(query)
    .populate("customerId", "name companyName")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    count: items.length,
    items,
  };
};

exports.createContent = async (params = {}, ctx = {}) => {
  const content = await ContentItem.create({
    title: params.title,
    customerId: params.customerId,
    headline: params.headline || "",
    caption: params.caption || "",
    platforms: params.platforms || ["Instagram", "Facebook"],
    scheduledFor: params.scheduledFor ? new Date(params.scheduledFor) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    approvalStatus: "Pending Approval",
    status: "Draft",
    createdBy: ctx.userId || null,
  });

  return content.toObject();
};

exports.approveContent = async (params = {}, ctx = {}) => {
  const content = await ContentItem.findById(params.contentItemId);
  if (!content) throw new Error(`ContentItem with ID '${params.contentItemId}' not found.`);

  const previousStatus = content.approvalStatus;
  content.approvalStatus = "Approved";
  content.status = "Approved";
  content.reviewedBy = ctx.userId || null;
  content.reviewedAt = new Date();

  await content.save();

  if (content.creativeProjectId) {
    await CreativeProject.findByIdAndUpdate(content.creativeProjectId, {
      approvalStatus: "Approved",
      reviewedBy: ctx.userId || null,
    });
  }

  return {
    contentItemId: content._id,
    title: content.title,
    approvalStatus: "Approved",
    previousStatus,
  };
};

exports.rejectContent = async (params = {}, ctx = {}) => {
  const content = await ContentItem.findById(params.contentItemId);
  if (!content) throw new Error(`ContentItem with ID '${params.contentItemId}' not found.`);

  const previousStatus = content.approvalStatus;
  content.approvalStatus = "Rejected";
  content.rejectionReason = params.reason || "Rejected by manager";
  content.reviewedBy = ctx.userId || null;
  content.reviewedAt = new Date();

  await content.save();

  return {
    contentItemId: content._id,
    title: content.title,
    approvalStatus: "Rejected",
    reason: content.rejectionReason,
    previousStatus,
  };
};
