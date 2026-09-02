/**
 * GBPReviewReplyService.js
 * AI Review Reply Generator, Immutable Versioning, and R2 Approval Dispatcher
 */

const GoogleBusinessReview = require("../../models/GoogleBusinessReview");
const GBPReviewReply = require("../../models/GBPReviewReply");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const ExecutionService = require("../execution/ExecutionService");

class GBPReviewReplyService {
  /**
   * Generates initial AI suggested reply draft and creates R2 ApprovalRequest
   */
  async generateInitialReplyDraft({ customerId, locationId = null, googleReview, analysis }) {
    const reviewerName = googleReview.reviewer?.displayName || "valued customer";
    let draftText = "";

    if (googleReview.starRating >= 4) {
      draftText = `Thank you so much for the fantastic 5-star rating, ${reviewerName}! We are thrilled you had a wonderful experience and look forward to serving you again soon.`;
    } else if (googleReview.starRating <= 2) {
      draftText = `Dear ${reviewerName}, thank you for sharing your feedback. We are truly sorry to hear that your visit did not meet your expectations. We take service quality very seriously and would love the opportunity to connect with you directly to make things right. Please feel free to reach out to our management team.`;
    } else {
      draftText = `Hello ${reviewerName}, thank you for your feedback! We appreciate you taking the time to share your experience and are always striving to improve our services.`;
    }

    const title = `Google Review Reply: ${googleReview.starRating}★ from ${reviewerName}`;

    // 1. Create R2 ApprovalRequest
    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "GBP",
      riskLevel: "R2",
      actionType: "GBP_REVIEW_REPLY",
      customer: customerId,
      clientLocation: locationId || null,
      relatedResourceType: "GoogleBusinessReview",
      relatedResourceId: googleReview._id,
      executionIntent: {
        action: "gbp.replyReview",
        connector: "GBPReviewConnector",
        googleLocationId: googleReview.googleLocationId,
        googleReviewId: googleReview.reviewId,
        comment: draftText,
        approvedStarRating: googleReview.starRating,
        approvedComment: googleReview.comment,
      },
      initialPayload: {
        googleLocationId: googleReview.googleLocationId,
        googleReviewId: googleReview.reviewId,
        comment: draftText,
        approvedStarRating: googleReview.starRating,
        approvedComment: googleReview.comment,
      },
      initialStatus: "WAITING_APPROVAL",
    });

    // 2. Create GBPReviewReply Version 1
    const replyDoc = await GBPReviewReply.create({
      replyId: `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      customerId,
      locationId,
      googleReviewId: googleReview.reviewId,
      approvalId: approval._id,
      version: 1,
      draftText,
      finalApprovedText: draftText,
      generatedBy: "GBPAgent",
      status: "WAITING_APPROVAL",
    });

    return {
      success: true,
      replyId: replyDoc.replyId,
      approvalId: approval.approvalId,
      draftText,
      version: 1,
    };
  }

  /**
   * Updates reply draft text, creating an immutable higher version
   */
  async updateReplyDraft({ replyId, newDraftText, actorId = null }) {
    const existing = await GBPReviewReply.findOne({ replyId });
    if (!existing) throw new Error("GBPReviewReply record not found.");

    const newVersion = existing.version + 1;
    const newReplyId = `rep_${Date.now()}_v${newVersion}`;

    const newReply = await GBPReviewReply.create({
      replyId: newReplyId,
      customerId: existing.customerId,
      locationId: existing.locationId,
      googleReviewId: existing.googleReviewId,
      approvalId: existing.approvalId,
      version: newVersion,
      draftText: newDraftText,
      finalApprovedText: newDraftText,
      generatedBy: "ManagerEdit",
      status: "WAITING_APPROVAL",
    });

    // Update ApprovalRequest snapshot
    await ApprovalRequest.findByIdAndUpdate(existing.approvalId, {
      $set: {
        "executionIntent.comment": newDraftText,
        "initialPayload.comment": newDraftText,
      },
    });

    return {
      success: true,
      replyId: newReply.replyId,
      version: newVersion,
      draftText: newDraftText,
    };
  }

  /**
   * Dispatches approved review reply to BullMQ
   */
  async dispatchApprovedReply({ approvalId, actorId = null }) {
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    });

    if (!approval) throw new Error("ApprovalRequest not found.");

    if (approval.status !== "APPROVED") {
      const err = new Error(`Cannot publish: ApprovalRequest is in status '${approval.status}'. Must be 'APPROVED'.`);
      err.code = "APPROVAL_NOT_EXECUTABLE";
      throw err;
    }

    const payload = approval.executionIntent || approval.currentSnapshot?.blueprintPayload || {};

    return ExecutionService.scheduleExecution({
      approvalId: approval._id,
      queueName: "gbp-publishing",
      operation: "gbp.replyReview",
      payload,
    });
  }
}

module.exports = new GBPReviewReplyService();
