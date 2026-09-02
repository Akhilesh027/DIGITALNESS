/**
 * gbpWorker.js
 * Background worker for gbp-publishing BullMQ queue
 * 
 * Supports:
 * 1. gbp.createPost (Step 10: Local Post creation)
 * 2. gbp.replyReview (Step 10B: Review reply with drift protection, ReviewReplyState, and PolicyViolation tracking)
 */

const BaseWorker = require("./baseWorker");
const GBPConnector = require("../../integrations/connectors/GBPConnector");
const GBPReviewConnector = require("../../integrations/connectors/GBPReviewConnector");
const GBPPublication = require("../../../models/GBPPublication");
const GBPReviewReply = require("../../../models/GBPReviewReply");
const GoogleBusinessReview = require("../../../models/GoogleBusinessReview");

const gbpWorker = new BaseWorker({
  queueName: "gbp-publishing",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, operation, payload, approvalId } = envelope;
    console.log(`[GBPWorker] Executing operation '${operation}' for Customer: ${customerId}`);

    // =========================================================================
    // OPERATION 1: gbp.createPost (Local Post Publishing)
    // =========================================================================
    if (operation === "gbp.createPost") {
      try {
        const result = await GBPConnector.createLocalPost({
          customerId,
          locationId,
          postData: payload,
        });

        await GBPPublication.findOneAndUpdate(
          { approvalId: envelope.approvalId },
          {
            $set: {
              status: "PUBLISHED",
              localPostId: result.localPostId,
              searchUrl: result.searchUrl,
              publishedAt: new Date(),
              receipt: result,
            },
          }
        );

        return {
          success: true,
          mock: result.mock,
          platform: "GoogleBusiness",
          localPostId: result.localPostId,
          searchUrl: result.searchUrl,
          publishedAt: result.publishedAt,
        };
      } catch (err) {
        await GBPPublication.findOneAndUpdate(
          { approvalId: envelope.approvalId },
          {
            $set: {
              status: "FAILED",
              lastError: {
                code: err.code || "GBP_PUBLISH_FAILED",
                message: err.message,
                occurredAt: new Date(),
              },
            },
          }
        );
        throw err;
      }
    }

    // =========================================================================
    // OPERATION 2: gbp.replyReview (Merchant Review Reply)
    // =========================================================================
    if (operation === "gbp.replyReview") {
      const { googleReviewId, comment, approvedStarRating, approvedComment } = payload;

      // 1. Review Drift Protection Check: Fetch current review state
      const currentReviewRes = await GBPReviewConnector.getReview({
        customerId,
        locationId,
        reviewId: googleReviewId,
      });

      const currentReview = currentReviewRes.review || {};
      if (
        approvedStarRating &&
        currentReview.starRating &&
        currentReview.starRating !== approvedStarRating
      ) {
        console.warn(`[GBPWorker] Review changed after approval! Original: ${approvedStarRating}★, Current: ${currentReview.starRating}★`);
        await GBPReviewReply.findOneAndUpdate(
          { approvalId: envelope.approvalId },
          { $set: { status: "REVIEW_CHANGED_AFTER_APPROVAL" } }
        );
        const err = new Error("REVIEW_CHANGED_AFTER_APPROVAL: Customer updated review after manager approval. Re-approval required.");
        err.code = "REVIEW_CHANGED_AFTER_APPROVAL";
        throw err;
      }

      // 2. Execute Review Reply via GBPReviewConnector
      try {
        const replyResult = await GBPReviewConnector.replyToReview({
          customerId,
          locationId,
          reviewId: googleReviewId,
          comment,
        });

        // 3. Update GBPReviewReply Ledger
        await GBPReviewReply.findOneAndUpdate(
          { approvalId: envelope.approvalId },
          {
            $set: {
              status: replyResult.policyViolation ? "WITH_POLICY_ISSUE" : "PUBLISHED",
              googleReplyState: replyResult.googleReplyState || "PUBLISHED",
              policyViolation: replyResult.policyViolation || null,
              reviewReplyUrl: replyResult.reviewReplyUrl || null,
              submittedAt: new Date(),
              verifiedAt: new Date(),
              receipt: replyResult,
            },
          }
        );

        // 4. Update GoogleBusinessReview Document
        await GoogleBusinessReview.findOneAndUpdate(
          { customerId, reviewId: googleReviewId },
          {
            $set: {
              googleReviewReply: {
                comment: replyResult.comment,
                updateTime: replyResult.updateTime,
                state: replyResult.googleReplyState,
                reviewReplyUrl: replyResult.reviewReplyUrl,
                policyViolation: replyResult.policyViolation,
              },
              syncStatus: "REPLIED",
            },
          }
        );

        return {
          success: true,
          mock: replyResult.mock,
          operation: "gbp.replyReview",
          reviewId: googleReviewId,
          googleReplyState: replyResult.googleReplyState,
          policyViolation: replyResult.policyViolation,
          reviewReplyUrl: replyResult.reviewReplyUrl,
          repliedAt: new Date().toISOString(),
        };
      } catch (err) {
        await GBPReviewReply.findOneAndUpdate(
          { approvalId: envelope.approvalId },
          { $set: { status: "FAILED" } }
        );
        throw err;
      }
    }

    throw new Error(`Unsupported GBP queue operation: '${operation}'`);
  },
});

module.exports = gbpWorker;
