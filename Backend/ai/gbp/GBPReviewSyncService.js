/**
 * GBPReviewSyncService.js
 * Scheduled & Real-Time Google Business Profile Reviews Synchronizer
 * 
 * Flow:
 * 1. Resolves active GBPLocation connections for customer/location
 * 2. Fetches reviews via GBPReviewConnector (with cursor pagination)
 * 3. Sanitizes review content via ReviewInputSanitizer (Prompt Injection Protection)
 * 4. Deterministically upserts reviews into GoogleBusinessReview
 * 5. Generates AI suggested reply draft and surfaces in Decision Inbox
 */

const GoogleBusinessReview = require("../../models/GoogleBusinessReview");
const GBPReviewConnector = require("../integrations/connectors/GBPReviewConnector");
const IntegrationManager = require("../integrations/IntegrationManager");
const reviewInputSanitizer = require("./ReviewInputSanitizer");
const gbpReviewReplyService = require("./GBPReviewReplyService");

class GBPReviewSyncService {
  /**
   * Synchronizes reviews for a specific customer and branch location
   */
  async syncLocationReviews({ customerId, locationId = null }) {
    if (!customerId) throw new Error("customerId is required for reviews sync.");

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

    const reviewsRes = await GBPReviewConnector.listReviews({
      customerId,
      locationId,
    });

    const synced = [];

    for (const raw of reviewsRes.reviews) {
      const reviewId = raw.reviewId || raw.name?.split("/").pop();
      const reviewerName = raw.reviewer?.displayName || "Google User";
      const comment = raw.comment || "";
      const starRating = raw.starRating || 5;

      // 1. Sanitize & Wrap Untrusted Input
      const sanitizedWrapper = reviewInputSanitizer.sanitizeForAnalysis({
        reviewId,
        starRating,
        comment,
        reviewerName,
      });

      const analysis = reviewInputSanitizer.analyzeLocally({
        starRating,
        comment,
      });

      // 2. Check Existing Review Record
      const existing = await GoogleBusinessReview.findOne({
        customerId,
        googleLocationId: connection.platformAccountId,
        reviewId,
      });

      const isUpdate = Boolean(existing && (existing.comment !== comment || existing.starRating !== starRating));
      const syncStatus = isUpdate ? "UPDATED_REVIEW" : existing ? existing.syncStatus : "NEW_REVIEW";

      // 3. Upsert Review Record
      const reviewDoc = await GoogleBusinessReview.findOneAndUpdate(
        {
          customerId,
          googleLocationId: connection.platformAccountId,
          reviewId,
        },
        {
          $set: {
            locationId,
            connectionId: connection._id,
            googleAccountId: connection.metadata?.googleAccountId || "accounts/default",
            reviewer: {
              displayName: reviewerName,
              profilePhotoUrl: raw.reviewer?.profilePhotoUrl || "",
              isAnonymous: raw.reviewer?.isAnonymous || false,
            },
            starRating,
            comment,
            createTime: raw.createTime ? new Date(raw.createTime) : new Date(),
            updateTime: raw.updateTime ? new Date(raw.updateTime) : new Date(),
            googleReviewReply: raw.googleReviewReply || null,
            sentiment: analysis.sentiment,
            urgency: analysis.urgency,
            aiAnalysis: {
              topics: analysis.topics || ["general_feedback"],
              suggestedTone: analysis.suggestedTone,
              requiresHumanAttention: analysis.requiresHumanAttention,
              sanitizedInputSnapshot: JSON.stringify(sanitizedWrapper),
            },
            syncStatus,
            lastSyncedAt: new Date(),
          },
          $setOnInsert: { firstSyncedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      // 4. Auto-Generate Reply Draft for New or Updated Reviews (without existing reply)
      if (!raw.googleReviewReply && (!existing || isUpdate)) {
        await gbpReviewReplyService.generateInitialReplyDraft({
          customerId,
          locationId,
          googleReview: reviewDoc,
          analysis,
        });
      }

      synced.push(reviewDoc);
    }

    return {
      success: true,
      syncedCount: synced.length,
      reviews: synced,
    };
  }
}

module.exports = new GBPReviewSyncService();
