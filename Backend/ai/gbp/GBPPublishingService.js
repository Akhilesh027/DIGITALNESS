/**
 * GBPPublishingService.js
 * Google Business Profile Post Orchestrator & Approval Dispatcher
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const CreativeAsset = require("../../models/CreativeAsset");
const ApprovalRequest = require("../../models/ApprovalRequest");
const GBPPublication = require("../../models/GBPPublication");
const ApprovalEngine = require("../approval/ApprovalEngine");
const ExecutionService = require("../execution/ExecutionService");
const IntegrationManager = require("../integrations/IntegrationManager");
const AssetStorageService = require("../../services/storage/AssetStorageService");

class GBPPublishingService {
  /**
   * Assembles a Google Business Profile post into an R2 ApprovalRequest
   */
  async createPublishingRequest({
    customerId,
    locationId = null,
    creativeAssetId = null,
    summary,
    ctaType = "LEARN_MORE",
    ctaUrl = "",
    topicType = "STANDARD",
    scheduledFor = null,
    requestedBy = null,
  }) {
    if (!customerId || !summary) {
      throw new Error("customerId and summary are required.");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    // 1. Verify GBP Connection exists for this customer/location
    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "GoogleBusiness",
      accountType: "GBPLocation",
    });

    if (!connection) {
      const err = new Error("GBP_CONNECTION_NOT_FOUND: Active Google Business Profile connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    // 2. Resolve public media URL if creative asset provided
    let publicMediaUrl = null;
    let assetDoc = null;
    if (creativeAssetId) {
      assetDoc = await CreativeAsset.findOne({
        $or: [{ assetId: creativeAssetId }, { _id: creativeAssetId }],
        customerId,
      });

      if (assetDoc) {
        if (AssetStorageService.isPubliclyReachable(assetDoc)) {
          publicMediaUrl = assetDoc.assetUrl;
        } else {
          // Upload to Cloudinary for public reachability
          const cloudUpload = await AssetStorageService.upload({
            customerId,
            occasion: assetDoc.occasion || "gbp_post",
            assetId: assetDoc.assetId,
            version: assetDoc.version,
            buffer: Buffer.from(assetDoc.previewUrl ? assetDoc.previewUrl.split(",")[1] || "" : "", "base64"),
            format: "jpg",
            forceCloud: true,
          });
          publicMediaUrl = cloudUpload.assetUrl;
          assetDoc.assetUrl = publicMediaUrl;
          await assetDoc.save();
        }
      }
    }

    const title = `Google Business Profile Post: ${connection.platformAccountName || "Location"} (${topicType})`;

    // 3. Create R2 ApprovalRequest
    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "GBP",
      riskLevel: "R2",
      actionType: "GBP_POST_CREATE",
      customer: customerId,
      clientLocation: locationId || null,
      relatedResourceType: "CreativeAsset",
      relatedResourceId: assetDoc ? assetDoc._id : null,
      executionIntent: {
        action: "gbp.createPost",
        connector: "GBPConnector",
        googleLocationId: connection.platformAccountId,
        topicType,
        summary,
        mediaUrl: publicMediaUrl,
        callToAction: { actionType: ctaType, url: ctaUrl },
        scheduledFor,
      },
      initialPayload: {
        googleLocationId: connection.platformAccountId,
        topicType,
        summary,
        mediaUrl: publicMediaUrl,
        callToAction: { actionType: ctaType, url: ctaUrl },
        scheduledFor,
      },
      initialStatus: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    // 4. Create GBPPublication record
    const publication = await GBPPublication.create({
      publicationId: `pub_gbp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      customerId,
      locationId,
      connectionId: connection._id,
      approvalId: approval._id,
      creativeAssetId: assetDoc ? assetDoc._id : null,
      googleAccountId: connection.metadata?.googleAccountId || "accounts/default",
      googleLocationId: connection.platformAccountId,
      topicType,
      summary,
      callToAction: { actionType: ctaType, url: ctaUrl },
      media: publicMediaUrl ? [{ mediaFormat: "PHOTO", sourceUrl: publicMediaUrl }] : [],
      status: "WAITING_APPROVAL",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    });

    return {
      success: true,
      approvalId: approval.approvalId,
      publicationId: publication.publicationId,
      googleLocationId: connection.platformAccountId,
      mediaUrl: publicMediaUrl,
      scheduledFor,
    };
  }

  /**
   * Dispatches approved GBP post to BullMQ gbp-publishing queue
   */
  async dispatchApprovedPost({ approvalId, actorId = null }) {
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    });

    if (!approval) throw new Error("ApprovalRequest not found.");

    if (approval.status !== "APPROVED") {
      const err = new Error(`Cannot publish: ApprovalRequest status is '${approval.status}'. Must be 'APPROVED'.`);
      err.code = "APPROVAL_NOT_EXECUTABLE";
      throw err;
    }

    const payload = approval.executionIntent || approval.currentSnapshot?.blueprintPayload || {};
    const scheduledFor = payload.scheduledFor ? new Date(payload.scheduledFor).getTime() : null;
    const delay = scheduledFor && scheduledFor > Date.now() ? scheduledFor - Date.now() : 0;

    return ExecutionService.scheduleExecution({
      approvalId: approval._id,
      queueName: "gbp-publishing",
      operation: "gbp.createPost",
      payload,
      delay,
    });
  }
}

module.exports = new GBPPublishingService();
