/**
 * socialWorker.js
 * Background worker for social-publishing BullMQ queue
 * 
 * Supports:
 * 1. Independent execution for Instagram & Facebook Page
 * 2. Partial success handling (e.g. Instagram published, Facebook failed)
 * 3. Persistent SocialPublication records & external receipts
 */

const BaseWorker = require("./baseWorker");
const InstagramConnector = require("../../integrations/connectors/InstagramConnector");
const FacebookPageConnector = require("../../integrations/connectors/FacebookPageConnector");
const SocialPublication = require("../../../models/SocialPublication");

const socialWorker = new BaseWorker({
  queueName: "social-publishing",
  concurrency: 5,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, payload, approvalId } = envelope;
    const platforms = payload.platforms || ["Instagram"];
    const mediaUrl = payload.mediaUrl;
    const caption = payload.caption || "";

    const results = {};
    const publications = [];
    const errors = [];

    // 1. Publish to Instagram if requested
    if (platforms.includes("Instagram")) {
      try {
        const igRes = await InstagramConnector.publishImagePost({
          customerId,
          locationId,
          mediaUrl,
          caption,
        });

        results.Instagram = igRes;

        const igPub = await SocialPublication.create({
          publicationId: `pub_ig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          customerId,
          locationId,
          contentItemId: payload.contentItemId || null,
          creativeAssetId: payload.creativeAssetId || null,
          approvalId: envelope.approvalId,
          platform: "Instagram",
          status: "PUBLISHED",
          containerId: igRes.containerId || null,
          externalPostId: igRes.externalPostId,
          externalPostUrl: igRes.externalPostUrl,
          mediaUrl,
          caption,
          publishedAt: new Date(),
          receipt: igRes,
        });
        publications.push(igPub);
      } catch (igErr) {
        errors.push(`Instagram: ${igErr.message}`);
        results.Instagram = { success: false, error: igErr.message };

        await SocialPublication.create({
          publicationId: `pub_ig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          customerId,
          locationId,
          contentItemId: payload.contentItemId || null,
          creativeAssetId: payload.creativeAssetId || null,
          approvalId: envelope.approvalId,
          platform: "Instagram",
          status: "FAILED",
          mediaUrl,
          caption,
          lastError: { code: igErr.code || "IG_ERROR", message: igErr.message, occurredAt: new Date() },
        });
      }
    }

    // 2. Publish to Facebook Page if requested
    if (platforms.includes("Facebook")) {
      try {
        const fbRes = await FacebookPageConnector.publishPhotoPost({
          customerId,
          locationId,
          mediaUrl,
          caption,
        });

        results.Facebook = fbRes;

        const fbPub = await SocialPublication.create({
          publicationId: `pub_fb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          customerId,
          locationId,
          contentItemId: payload.contentItemId || null,
          creativeAssetId: payload.creativeAssetId || null,
          approvalId: envelope.approvalId,
          platform: "Facebook",
          status: "PUBLISHED",
          externalPostId: fbRes.externalPostId,
          externalPostUrl: fbRes.externalPostUrl,
          mediaUrl,
          caption,
          publishedAt: new Date(),
          receipt: fbRes,
        });
        publications.push(fbPub);
      } catch (fbErr) {
        errors.push(`Facebook: ${fbErr.message}`);
        results.Facebook = { success: false, error: fbErr.message };

        await SocialPublication.create({
          publicationId: `pub_fb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          customerId,
          locationId,
          contentItemId: payload.contentItemId || null,
          creativeAssetId: payload.creativeAssetId || null,
          approvalId: envelope.approvalId,
          platform: "Facebook",
          status: "FAILED",
          mediaUrl,
          caption,
          lastError: { code: fbErr.code || "FB_ERROR", message: fbErr.message, occurredAt: new Date() },
        });
      }
    }

    const successCount = publications.filter((p) => p.status === "PUBLISHED").length;

    if (successCount === platforms.length) {
      return {
        success: true,
        status: "PUBLISHED",
        results,
        publications,
      };
    } else if (successCount > 0) {
      return {
        success: true,
        status: "PARTIAL_SUCCESS",
        results,
        publications,
        errors,
      };
    } else {
      const err = new Error(`Social publishing failed: ${errors.join("; ")}`);
      err.code = "SOCIAL_PUBLISHING_FAILED";
      err.platformErrors = errors;
      throw err;
    }
  },
});

module.exports = socialWorker;
