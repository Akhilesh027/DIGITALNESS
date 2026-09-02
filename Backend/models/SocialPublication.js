/**
 * SocialPublication.js
 * Persistent MongoDB Model for Platform-Specific Social Media Post Executions & External Receipts
 */

const mongoose = require("mongoose");

const SocialPublicationSchema = new mongoose.Schema(
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
    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      default: null,
      index: true,
    },
    creativeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeAsset",
      default: null,
      index: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["Instagram", "Facebook"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "QUEUED", "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED"],
      default: "QUEUED",
      index: true,
    },
    containerId: {
      type: String,
      default: null,
    },
    externalPostId: {
      type: String,
      default: null,
      index: true,
    },
    externalPostUrl: {
      type: String,
      default: null,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
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

module.exports = mongoose.model("SocialPublication", SocialPublicationSchema);
