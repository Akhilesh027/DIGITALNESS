const mongoose = require("mongoose");

const creativeVersionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    prompt: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    bgImageUrl: {
      type: String,
      default: "",
    },

    heroImageUrl: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    subheadline: {
      type: String,
      default: "",
    },

    offerText: {
      type: String,
      default: "",
    },

    ctaText: {
      type: String,
      default: "",
    },

    primaryColor: {
      type: String,
      default: "",
    },

    accentColor: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    locationName: {
      type: String,
      default: "",
    },

    showLogo: {
      type: Boolean,
      default: true,
    },

    logoScale: {
      type: Number,
      default: 1.0,
    },

    logoBgStyle: {
      type: String,
      default: "pill",
    },

    layoutTheme: {
      type: String,
      default: "gold_luxury",
    },

    logoUrl: {
      type: String,
      default: "",
    },

    generatedByAgent: {
      type: Boolean,
      default: false,
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, strict: false }
);

const creativeProjectSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    clientLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
      index: true,
    },

    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
    },

    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    campaignName: {
      type: String,
      default: "",
      trim: true,
    },

    assetType: {
      type: String,
      enum: ["Poster", "Banner", "Reel", "Story", "Carousel", "Video", "Other"],
      default: "Poster",
    },

    dimensions: {
      width: { type: Number, default: 1080 },
      height: { type: Number, default: 1080 },
      aspectRatio: { type: String, default: "1:1" },
    },

    brief: {
      type: String,
      default: "",
    },

    bgImageUrl: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    subheadline: {
      type: String,
      default: "",
    },

    offerText: {
      type: String,
      default: "",
    },

    ctaText: {
      type: String,
      default: "",
    },

    primaryColor: {
      type: String,
      default: "",
    },

    accentColor: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    locationName: {
      type: String,
      default: "",
    },

    showLogo: {
      type: Boolean,
      default: true,
    },

    logoUrl: {
      type: String,
      default: "",
    },

    brandContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    aiPrompt: {
      type: String,
      default: "",
    },

    versions: {
      type: [creativeVersionSchema],
      default: [],
    },

    currentVersion: {
      type: Number,
      default: 1,
    },

    approvalStatus: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Rejected",
        "Revision Requested",
      ],
      default: "Draft",
      index: true,
    },

    approvedVersion: {
      type: Number,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    managerFeedback: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

creativeProjectSchema.index({ customerId: 1, approvalStatus: 1 });

module.exports = mongoose.model("CreativeProject", creativeProjectSchema);
