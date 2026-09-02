const mongoose = require("mongoose");

const adVariantSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    primaryText: { type: String, required: true },
    callToAction: { type: String, default: "Learn More" },
    format: {
      type: String,
      enum: ["Single Image", "Carousel", "Reel / Video"],
      default: "Single Image",
    },
    creativeRequirements: {
      type: String,
      default: "",
    },
    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
    },
  },
  { _id: false }
);

const audienceTargetingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    strategyType: {
      type: String,
      enum: ["Broad Local", "Niche Interest", "Luxury / High Intent", "Retargeting", "Custom"],
      default: "Broad Local",
    },
    locations: { type: [String], default: [] },
    ageRange: {
      min: { type: Number, default: 21 },
      max: { type: Number, default: 55 },
    },
    genders: {
      type: [String],
      enum: ["All", "Men", "Women"],
      default: ["All"],
    },
    interests: { type: [String], default: [] },
    behaviors: { type: [String], default: [] },
    dailyBudgetShare: { type: Number, default: 0 },
    estimatedDailyReach: { type: String, default: "" },
  },
  { _id: false }
);

const creativeRequirementSchema = new mongoose.Schema(
  {
    requirementId: { type: String, required: true },
    format: { type: String, enum: ["Poster / Banner", "Reel / Story", "Carousel"], default: "Poster / Banner" },
    aspectRatio: { type: String, default: "1:1" },
    concept: { type: String, default: "" },
    headline: { type: String, default: "" },
    offerBadge: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending Generation", "In Production", "Generated", "Approved"],
      default: "Pending Generation",
    },
    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
    },
  },
  { _id: false }
);

const adCampaignSchema = new mongoose.Schema(
  {
    campaignId: {
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

    clientLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },

    campaignName: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      default: "Meta",
    },

    objective: {
      type: String,
      default: "LEAD_GENERATION",
    },

    conversionType: {
      type: String,
      default: "INSTANT_FORM",
    },

    budget: {
      budgetType: {
        type: String,
        default: "Daily",
      },
      amount: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      recommendedMetaSplit: { type: Number, default: 0 },
      recommendedGoogleSplit: { type: Number, default: 0 },
      estimatedCPL: { type: String, default: "₹180 - ₹320" },
      estimatedMonthlyLeads: { type: String, default: "" },
    },

    duration: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date, default: null },
      days: { type: Number, default: 10 },
    },

    targetLocations: { type: [String], default: [] },

    promotedServices: { type: [String], default: [] },

    promotedOffer: { type: String, default: "None (Brand Awareness)" },

    strategy: {
      funnelStage: { type: String, default: "Top of Funnel (Cold Acquisition)" },
      coreMessage: { type: String, default: "" },
      primaryKPI: { type: String, default: "Cost Per Qualified Lead (CPL)" },
      recommendationSummary: { type: String, default: "" },
    },

    audiences: {
      type: [audienceTargetingSchema],
      default: [],
    },

    adVariants: {
      type: [adVariantSchema],
      default: [],
    },

    creativeRequirements: {
      type: [creativeRequirementSchema],
      default: [],
    },

    generatedAssets: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    creativePosterAsset: {
      imageUrl: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      mediaType: { type: String, enum: ["IMAGE", "VIDEO", "CAROUSEL"], default: "IMAGE" },
      headline: { type: String, default: "" },
      subheadline: { type: String, default: "" },
      offerBadge: { type: String, default: "" },
      ctaText: { type: String, default: "" },
      brandLogoUrl: { type: String, default: "" },
      theme: { type: String, default: "gold_luxury" },
      prompt: { type: String, default: "" },
      creativeProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "CreativeProject", default: null },
    },

    specialAdCategory: {
      type: String,
      default: "NONE",
    },

    metaSettings: {
      adAccountId: { type: String, default: "" },
      pageId: { type: String, default: "" },
      instagramActorId: { type: String, default: "" },
      pixelId: { type: String, default: "" },
      leadGenFormId: { type: String, default: "" },
      privacyPolicyUrl: { type: String, default: "" },
      destinationUrl: { type: String, default: "" },
      callToAction: { type: String, default: "LEARN_MORE" },
      placement: { type: String, default: "ALL_PLACEMENTS" }, // Feed, Stories, Reels
      specialAdCategory: { type: String, default: "NONE" },
    },

    googleSettings: {
      customerAccountId: { type: String, default: "" },
      conversionActionId: { type: String, default: "" },
      finalUrl: { type: String, default: "" },
      targetNetwork: { type: String, default: "SEARCH_AND_DISPLAY" },
      keywords: { type: [String], default: [] },
      negativeKeywords: { type: [String], default: [] },
      headlines: { type: [String], default: [] },
      descriptions: { type: [String], default: [] },
    },

    qaAudit: {
      passed: { type: Boolean, default: true },
      checks: { type: [String], default: [] },
      warnings: { type: [String], default: [] },
      checkedAt: { type: Date, default: Date.now },
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Creative In Progress",
        "Ready for Launch",
        "Live",
        "Active",
        "Paused",
        "Completed",
        "Archived",
      ],
      default: "Pending Approval",
    },

    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkApproval",
      default: null,
    },

    version: {
      type: Number,
      default: 1,
    },

    versionHistory: [
      {
        version: { type: Number, required: true },
        snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        revisionNote: { type: String, default: "Initial draft" },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        modifiedAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

adCampaignSchema.index({ customerId: 1, status: 1 });
adCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AdCampaign || mongoose.model("AdCampaign", adCampaignSchema);
