/**
 * GoogleBusinessReview.js
 * Persistent MongoDB Model for Google Business Profile Reviews
 */

const mongoose = require("mongoose");

const GoogleBusinessReviewSchema = new mongoose.Schema(
  {
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
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingConnection",
      required: true,
      index: true,
    },
    googleAccountId: {
      type: String,
      required: true,
    },
    googleLocationId: {
      type: String,
      required: true,
      index: true,
    },
    reviewId: {
      type: String,
      required: true,
      index: true,
    },
    reviewResourceName: {
      type: String,
      default: "",
    },
    reviewer: {
      displayName: { type: String, default: "Google User" },
      profilePhotoUrl: { type: String, default: "" },
      isAnonymous: { type: Boolean, default: false },
    },
    starRating: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
      index: true,
    },
    comment: {
      type: String,
      default: "",
    },
    createTime: {
      type: Date,
      required: true,
    },
    updateTime: {
      type: Date,
      default: null,
    },
    reviewMediaItems: [
      {
        mediaFormat: { type: String, default: "PHOTO" },
        thumbnailUrl: { type: String, default: "" },
      },
    ],
    googleReviewReply: {
      comment: { type: String, default: null },
      updateTime: { type: Date, default: null },
      state: { type: String, default: null }, // e.g. "PENDING", "PUBLISHED"
      reviewReplyUrl: { type: String, default: null },
      policyViolation: { type: String, default: null },
    },
    sentiment: {
      type: String,
      enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED", "UNRESOLVED"],
      default: "UNRESOLVED",
      index: true,
    },
    urgency: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    aiAnalysis: {
      topics: { type: [String], default: [] },
      suggestedTone: { type: String, default: "professional_polite" },
      requiresHumanAttention: { type: Boolean, default: false },
      sanitizedInputSnapshot: { type: String, default: "" },
    },
    syncStatus: {
      type: String,
      enum: ["NEW_REVIEW", "UPDATED_REVIEW", "SYNCED", "REPLY_PENDING_APPROVAL", "REPLIED"],
      default: "NEW_REVIEW",
      index: true,
    },
    firstSyncedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound Unique Index for Deterministic Upserts Across Scheduled Syncs
GoogleBusinessReviewSchema.index(
  { customerId: 1, googleLocationId: 1, reviewId: 1 },
  { unique: true }
);

module.exports = mongoose.model("GoogleBusinessReview", GoogleBusinessReviewSchema);
