/**
 * GoogleAdsInsightSnapshot.js
 * Persistent MongoDB Model for Daily Google Ads Performance Metrics & Search Term Intelligence
 */

const mongoose = require("mongoose");

const GoogleAdsInsightSnapshotSchema = new mongoose.Schema(
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
    googleAdsCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    managerCustomerId: {
      type: String,
      default: null,
    },
    accountCurrency: {
      type: String,
      default: "INR",
    },
    accountTimezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    level: {
      type: String,
      enum: ["ACCOUNT", "CAMPAIGN", "AD_GROUP", "KEYWORD", "SEARCH_TERM", "AD"],
      required: true,
      index: true,
    },
    externalObjectId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      default: null,
      index: true,
    },
    campaignResourceName: {
      type: String,
      default: null,
    },
    adGroupId: {
      type: String,
      default: null,
    },
    adGroupResourceName: {
      type: String,
      default: null,
    },
    criterionId: {
      type: String,
      default: null,
    },
    keywordText: {
      type: String,
      default: null,
    },
    keywordMatchType: {
      type: String,
      default: null,
    },
    searchTerm: {
      type: String,
      default: null,
    },
    adGroupAdResourceName: {
      type: String,
      default: null,
    },
    dateStart: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    dateStop: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    reportingDateBasis: {
      type: String,
      enum: ["INTERACTION_DATE", "CONVERSION_DATE"],
      default: "INTERACTION_DATE",
      index: true,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    interactions: {
      type: Number,
      default: 0,
    },
    costMicros: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    ctr: {
      type: Number,
      default: 0,
    },
    averageCpc: {
      type: Number,
      default: 0,
    },
    averageCpm: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    allConversions: {
      type: Number,
      default: 0,
    },
    conversionValue: {
      type: Number,
      default: 0,
    },
    allConversionValue: {
      type: Number,
      default: 0,
    },
    costPerConversion: {
      type: Number,
      default: 0,
    },
    primaryResult: {
      type: String,
      default: null, // e.g. "LEADS", "CALLS"
    },
    primaryResultCount: {
      type: Number,
      default: 0,
    },
    costPerPrimaryResult: {
      type: Number,
      default: null,
    },
    conversionBreakdown: [
      {
        actionName: { type: String },
        category: { type: String },
        count: { type: Number, default: 0 },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    source: {
      type: String,
      default: "GOOGLE_ADS",
    },
    apiVersion: {
      type: String,
      default: "v25",
    },
    firstSyncedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    revisionCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Compound Unique Index for Deterministic Upserts Across Scheduled Syncs
GoogleAdsInsightSnapshotSchema.index(
  {
    customerId: 1,
    googleAdsCustomerId: 1,
    level: 1,
    externalObjectId: 1,
    dateStart: 1,
    reportingDateBasis: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("GoogleAdsInsightSnapshot", GoogleAdsInsightSnapshotSchema);
