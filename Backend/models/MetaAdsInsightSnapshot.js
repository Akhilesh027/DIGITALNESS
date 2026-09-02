/**
 * MetaAdsInsightSnapshot.js
 * Persistent MongoDB Model for Historical Daily Meta Marketing API Insights Snapshots
 */

const mongoose = require("mongoose");

const MetaAdsInsightSnapshotSchema = new mongoose.Schema(
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
    accountId: {
      type: String,
      required: true,
      index: true,
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
      enum: ["ACCOUNT", "CAMPAIGN", "ADSET", "AD"],
      required: true,
      index: true,
    },
    objectId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      default: null,
      index: true,
    },
    adSetId: {
      type: String,
      default: null,
    },
    adId: {
      type: String,
      default: null,
    },
    campaignName: {
      type: String,
      default: "",
    },
    adSetName: {
      type: String,
      default: "",
    },
    adName: {
      type: String,
      default: "",
    },
    dateStart: {
      type: String,
      required: true,
      index: true,
    },
    dateStop: {
      type: String,
      required: true,
      index: true,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    reach: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },
    outboundClicks: {
      type: Number,
      default: 0,
    },
    spend: {
      type: Number,
      default: 0,
    },
    ctr: {
      type: Number,
      default: 0,
    },
    cpc: {
      type: Number,
      default: null,
    },
    cpm: {
      type: Number,
      default: null,
    },
    actionsByType: {
      type: Map,
      of: Number,
      default: {},
    },
    rawActions: {
      type: Array,
      default: [],
    },
    results: {
      type: Number,
      default: null,
    },
    resultType: {
      type: String,
      default: null,
    },
    costPerResult: {
      type: Number,
      default: null,
    },
    attributionContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      default: "META",
    },
    apiVersion: {
      type: String,
      default: "v26.0",
    },
    syncedAt: {
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
MetaAdsInsightSnapshotSchema.index(
  { customerId: 1, accountId: 1, level: 1, objectId: 1, dateStart: 1, dateStop: 1 },
  { unique: true }
);

module.exports = mongoose.model("MetaAdsInsightSnapshot", MetaAdsInsightSnapshotSchema);
