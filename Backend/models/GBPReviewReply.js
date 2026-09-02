/**
 * GBPReviewReply.js
 * Persistent MongoDB Model for Google Business Profile Merchant Review Replies & Versioning
 */

const mongoose = require("mongoose");

const GBPReviewReplySchema = new mongoose.Schema(
  {
    replyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
      index: true,
    },
    googleReviewId: {
      type: String,
      required: true,
      index: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    draftText: {
      type: String,
      required: true,
    },
    finalApprovedText: {
      type: String,
      default: "",
    },
    generatedBy: {
      type: String,
      default: "GBPAgent",
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "WAITING_APPROVAL",
        "APPROVED",
        "SUBMITTED",
        "PUBLISHED",
        "WITH_POLICY_ISSUE",
        "REVIEW_CHANGED_AFTER_APPROVAL",
        "FAILED",
      ],
      default: "WAITING_APPROVAL",
      index: true,
    },
    googleReplyState: {
      type: String,
      default: null, // e.g. "PENDING_MODERATION", "PUBLISHED"
    },
    policyViolation: {
      type: String,
      default: null,
    },
    reviewReplyUrl: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    receipt: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GBPReviewReply", GBPReviewReplySchema);
