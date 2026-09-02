const mongoose = require("mongoose");

const calendarItemSchema = new mongoose.Schema(
  {
    itemKey: {
      type: String,
      required: true,
    },
    plannedDate: {
      type: Date,
      required: true,
    },
    contentType: {
      type: String,
      enum: [
        "SOCIAL_POST",
        "REEL",
        "CAROUSEL",
        "GBP_POST",
        "AD_CREATIVE",
        "STORY",
      ],
      default: "SOCIAL_POST",
    },
    sourceType: {
      type: String,
      enum: [
        "FESTIVAL",
        "SEASONAL",
        "INDUSTRY",
        "SERVICE",
        "OFFER",
        "EVERGREEN",
        "CAMPAIGN",
      ],
      default: "SERVICE",
    },
    opportunityId: {
      type: String,
      default: "",
    },
    occasion: {
      type: String,
      default: "",
    },
    objective: {
      type: String,
      default: "Engagement & Brand Awareness",
    },
    headline: {
      type: String,
      required: true,
    },
    subheadline: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      required: true,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    creativeBrief: {
      type: String,
      required: true,
    },
    visualPrompt: {
      type: String,
      default: "",
    },
    cta: {
      type: String,
      default: "Book Appointment / Contact Us Today",
    },
    platformTargets: {
      type: [String],
      default: ["Instagram", "Facebook"],
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "APPROVED",
        "REJECTED",
        "GENERATED",
        "SCHEDULED",
        "PUBLISHED",
      ],
      default: "DRAFT",
    },
    reasoningTags: {
      type: [String],
      default: [],
    },
    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      default: null,
    },
    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
    },
    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
    },
    approval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approvedAt: { type: Date, default: null },
    },
  },
  { _id: true }
);

const contentCalendarSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    branchId: {
      type: String,
      default: "",
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      month: { type: Number, required: true },
      year: { type: Number, required: true },
      formatted: { type: String, required: true },
    },
    source: {
      automationRunId: { type: String, default: "" },
      servicePackageId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackageTemplate", default: null },
      generatedByAutomation: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PARTIALLY_APPROVED",
        "APPROVED",
        "GENERATING",
        "SCHEDULED",
        "COMPLETED",
      ],
      default: "DRAFT",
      index: true,
    },
    items: [calendarItemSchema],
    summary: {
      totalItems: { type: Number, default: 0 },
      festivalItems: { type: Number, default: 0 },
      seasonalItems: { type: Number, default: 0 },
      serviceItems: { type: Number, default: 0 },
      posters: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      gbpPosts: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

contentCalendarSchema.index({ clientId: 1, "period.formatted": 1 });

module.exports = mongoose.model("ContentCalendar", contentCalendarSchema);
