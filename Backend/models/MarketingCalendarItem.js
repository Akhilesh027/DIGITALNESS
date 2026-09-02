const mongoose = require("mongoose");

const marketingCalendarItemSchema = new mongoose.Schema(
  {
    calendarItemId: {
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
    sourceType: {
      type: String,
      enum: [
        "CONTENT_ITEM",
        "SOCIAL_PUBLICATION",
        "GBP_PUBLICATION",
        "META_AD_CAMPAIGN",
        "GOOGLE_AD_CAMPAIGN",
        "CREATIVE_TASK",
        "MANUAL_MARKETING_TASK",
      ],
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: [
        "POST",
        "REEL",
        "CAROUSEL",
        "STORY",
        "GBP_POST",
        "META_CAMPAIGN_LAUNCH",
        "GOOGLE_CAMPAIGN_LAUNCH",
        "CREATIVE_DEADLINE",
        "COPY_DEADLINE",
        "APPROVAL_DEADLINE",
        "MARKETING_TASK",
      ],
      default: "POST",
      index: true,
    },
    channel: {
      type: String,
      enum: [
        "INSTAGRAM",
        "FACEBOOK",
        "GOOGLE_BUSINESS",
        "META_ADS",
        "GOOGLE_ADS",
        "INTERNAL",
      ],
      default: "INSTAGRAM",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "IN_PRODUCTION",
        "NEEDS_CREATIVE",
        "NEEDS_APPROVAL",
        "READY_TO_SCHEDULE",
        "SCHEDULED",
        "QUEUED",
        "EXECUTING",
        "PUBLISHED",
        "PARTIAL_SUCCESS",
        "FAILED",
        "BLOCKED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    scheduledStartAt: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndAt: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    creativeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeAsset",
      default: null,
      index: true,
    },
    pinnedCreativeVersion: {
      type: Number,
      default: 1,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
      index: true,
    },
    approvalSnapshotHash: {
      type: String,
      default: null,
    },
    executionJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExecutionJob",
      default: null,
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
    },
    readinessState: {
      type: String,
      enum: [
        "NOT_STARTED",
        "CREATIVE_REQUIRED",
        "COPY_REQUIRED",
        "CREATIVE_REVIEW",
        "APPROVAL_REQUIRED",
        "READY_TO_SCHEDULE",
        "SCHEDULED",
        "QUEUED",
        "EXECUTING",
        "COMPLETED",
        "FAILED",
        "BLOCKED",
      ],
      default: "NOT_STARTED",
      index: true,
    },
    readinessScorePercent: {
      type: Number,
      default: 0,
    },
    blockers: [
      {
        code: { type: String, required: true },
        severity: { type: String, enum: ["INFO", "WARNING", "BLOCKING"], default: "BLOCKING" },
        message: { type: String, required: true },
        sourceId: { type: String, default: null },
      },
    ],
    campaignGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingCampaignGroup",
      default: null,
      index: true,
    },
    providerReceipts: [
      {
        channel: { type: String, required: true },
        externalId: { type: String, default: "" },
        status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
        publishedAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

marketingCalendarItemSchema.index({ customerId: 1, scheduledStartAt: 1 });
marketingCalendarItemSchema.index({ customerId: 1, locationId: 1, scheduledStartAt: 1 });
marketingCalendarItemSchema.index({ status: 1, scheduledStartAt: 1 });
marketingCalendarItemSchema.index({ customerId: 1, sourceType: 1, sourceId: 1 }, { unique: true });

let MarketingCalendarItemModel;
try {
  MarketingCalendarItemModel = mongoose.model("MarketingCalendarItem");
} catch (e) {
  MarketingCalendarItemModel = mongoose.model("MarketingCalendarItem", marketingCalendarItemSchema);
}

module.exports = MarketingCalendarItemModel;
