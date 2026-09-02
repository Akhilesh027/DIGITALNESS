/**
 * CreativeAsset.js
 * Persistent MongoDB Model for Rendered and Versioned Creative Assets
 */

const mongoose = require("mongoose");

const CreativeAssetSchema = new mongoose.Schema(
  {
    assetId: {
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
    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
      index: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    occasion: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["POSTER", "REEL_COVER", "CAROUSEL_SLIDE", "BANNER", "STORY"],
      default: "POSTER",
    },
    format: {
      type: String,
      enum: ["PNG", "JPG", "SVG", "WEBP"],
      default: "PNG",
    },
    width: {
      type: Number,
      default: 1080,
    },
    height: {
      type: Number,
      default: 1080,
    },
    aspectRatio: {
      type: String,
      default: "1:1",
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["GENERATING", "RENDERING", "UPLOADING", "READY", "FAILED", "ARCHIVED"],
      default: "READY",
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ["Cloudinary", "S3", "Local"],
      default: "Local",
    },
    storageKey: {
      type: String,
      required: true,
    },
    assetUrl: {
      type: String,
      required: true,
    },
    previewUrl: {
      type: String,
      default: null,
    },
    sourceProvider: {
      type: String,
      default: "OpenAI DALL-E / Poster Engine",
    },
    sourceGenerationId: {
      type: String,
      default: null,
    },
    checksum: {
      type: String,
      default: null,
    },
    renderSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    blueprint: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    qaReport: {
      passed: { type: Boolean, default: true },
      score: { type: Number, default: 100 },
      warnings: [{ type: String }],
      errors: [{ type: String }],
      checkedAt: { type: Date, default: Date.now },
    },
    revisionType: {
      type: String,
      enum: ["INITIAL", "RENDERER_ONLY", "GENERATIVE", "MANUAL"],
      default: "INITIAL",
    },
    revisionSource: {
      type: String,
      enum: ["INITIAL", "NATIVE_RENDERER", "CANVA_EDIT", "MANUAL_SYNC"],
      default: "INITIAL",
    },
    canvaDesignId: {
      type: String,
      default: null,
      index: true,
    },
    publishReady: {
      type: Boolean,
      default: false,
    },
    parentAssetId: {
      type: String,
      default: null,
    },
    createdByAgent: {
      type: Boolean,
      default: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure fast version history lookup
CreativeAssetSchema.index({ customerId: 1, creativeProjectId: 1, version: -1 });

module.exports = mongoose.model("CreativeAsset", CreativeAssetSchema);
