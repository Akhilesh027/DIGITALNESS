/**
 * SocialPublishingService.js
 * Social Media Publishing Orchestrator (Instagram & Facebook Pages)
 */

const CreativeAsset = require("../../models/CreativeAsset");
const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const ExecutionService = require("../execution/ExecutionService");
const AssetStorageService = require("../../services/storage/AssetStorageService");

class SocialPublishingService {
  /**
   * Schedules or submits an approved creative for social media publication
   */
  async createPublishingRequest({
    customerId,
    locationId = null,
    creativeAssetId,
    caption = "",
    platforms = ["Instagram", "Facebook"],
    scheduledFor = null,
    requestedBy = null,
  }) {
    if (!customerId || !creativeAssetId) {
      throw new Error("customerId and creativeAssetId are required.");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    const asset = await CreativeAsset.findOne({
      $or: [{ assetId: creativeAssetId }, { _id: creativeAssetId }],
      customerId,
    });

    if (!asset) {
      throw new Error(`CreativeAsset '${creativeAssetId}' not found for customer.`);
    }

    // 1. Ensure asset has a public HTTPS URL (Cloudinary)
    let publicMediaUrl = asset.assetUrl;
    if (!AssetStorageService.isPubliclyReachable(asset)) {
      // Re-upload/convert to public Cloudinary storage
      const cloudUpload = await AssetStorageService.upload({
        customerId,
        occasion: asset.occasion || "social_post",
        assetId: asset.assetId,
        version: asset.version,
        buffer: Buffer.from(asset.previewUrl ? asset.previewUrl.split(",")[1] || "" : "", "base64"),
        format: "jpg",
        mimeType: "image/jpeg",
        forceCloud: true,
      });

      publicMediaUrl = cloudUpload.assetUrl;
      asset.assetUrl = publicMediaUrl;
      await asset.save();
    }

    const title = `Social Post: ${asset.title || "Festival Creative"} (${platforms.join(", ")})`;

    // 2. Create R2 ApprovalRequest for publishing
    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      customer: customerId,
      clientLocation: locationId || asset.locationId || null,
      relatedResourceType: "CreativeAsset",
      relatedResourceId: asset._id,
      executionIntent: {
        action: "social.publish",
        connector: "MetaConnector",
        platforms,
        mediaUrl: publicMediaUrl,
        caption,
        scheduledFor,
      },
      initialPayload: {
        creativeAssetId: asset.assetId,
        mediaUrl: publicMediaUrl,
        caption,
        platforms,
        scheduledFor,
      },
      initialStatus: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    return {
      success: true,
      approvalId: approval.approvalId,
      mediaUrl: publicMediaUrl,
      platforms,
      scheduledFor,
    };
  }

  /**
   * Dispatches approved publishing request to BullMQ social-publishing queue
   */
  async dispatchApprovedPublishing({ approvalId, actorId = null }) {
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    });

    if (!approval) throw new Error("ApprovalRequest not found.");

    if (approval.status !== "APPROVED") {
      const err = new Error(`Cannot publish: ApprovalRequest is in status '${approval.status}'. Must be 'APPROVED'.`);
      err.code = "APPROVAL_NOT_EXECUTABLE";
      throw err;
    }

    const payload = approval.currentSnapshot?.blueprintPayload || approval.executionIntent || {};
    const scheduledFor = payload.scheduledFor ? new Date(payload.scheduledFor).getTime() : null;
    const delay = scheduledFor && scheduledFor > Date.now() ? scheduledFor - Date.now() : 0;

    return ExecutionService.scheduleExecution({
      approvalId: approval._id,
      queueName: "social-publishing",
      operation: "social.publish",
      payload: {
        ...payload,
        creativeAssetId: payload.creativeAssetId,
        mediaUrl: payload.mediaUrl,
        caption: payload.caption,
        platforms: payload.platforms || ["Instagram", "Facebook"],
      },
      delay,
    });
  }
}

module.exports = new SocialPublishingService();
