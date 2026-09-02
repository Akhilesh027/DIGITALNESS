/**
 * GBPPublication.js
 * Persistent MongoDB Model for Google Business Profile Local Posts and Platform Receipts
 */

const mongoose = require("mongoose");

const GBPPublicationSchema = new mongoose.Schema(
  {
    publicationId: {
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
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingConnection",
      required: true,
      index: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      required: true,
      index: true,
    },
    creativeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeAsset",
      default: null,
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
    localPostId: {
      type: String,
      default: null,
      index: true,
    },
    topicType: {
      type: String,
      enum: ["STANDARD", "EVENT", "OFFER"],
      default: "STANDARD",
    },
    summary: {
      type: String,
      required: true,
    },
    callToAction: {
      actionType: { type: String, default: "LEARN_MORE" },
      url: { type: String, default: "" },
    },
    media: [
      {
        mediaFormat: { type: String, default: "PHOTO" },
        sourceUrl: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: [
        "DRAFT",
        "WAITING_APPROVAL",
        "SCHEDULED",
        "QUEUED",
        "PUBLISHING",
        "PUBLISHED",
        "FAILED",
        "CANCELLED",
      ],
      default: "QUEUED",
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    searchUrl: {
      type: String,
      default: null,
    },
    receipt: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastError: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      occurredAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GBPPublication", GBPPublicationSchema);
