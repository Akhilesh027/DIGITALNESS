/**
 * AdsPerformanceRecommendation.js
 * Persistent MongoDB Model for Evidence-Based Performance Recommendations
 */

const mongoose = require("mongoose");

const AdsPerformanceRecommendationSchema = new mongoose.Schema(
  {
    recommendationId: {
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
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
      index: true,
    },
    metaCampaignId: {
      type: String,
      default: null,
    },
    findingType: {
      type: String,
      enum: [
        "CPL_ABOVE_TARGET",
        "SCALE_WINNER",
        "HIGH_FREQUENCY_FATIGUE",
        "ZERO_LEADS_BLEEDING_SPEND",
        "LOW_CTR_CREATIVE_FATIGUE",
        "HEALTHY_PERFORMANCE",
        "INSUFFICIENT_DATA",
        "EXTERNAL_MODIFICATION_DETECTED",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    confidence: {
      type: String,
      enum: ["SUFFICIENT_DATA", "INSUFFICIENT_DATA"],
      default: "SUFFICIENT_DATA",
    },
    evidenceSnapshot: {
      evaluationWindow: { type: String, default: "LAST_3_DAYS" },
      spend: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      leads: { type: Number, default: 0 },
      cpl: { type: Number, default: null },
      targetCpl: { type: Number, default: null },
      ctr: { type: Number, default: 0 },
      frequency: { type: Number, default: 0 },
    },
    recommendationType: {
      type: String,
      enum: [
        "REVIEW_TARGETING",
        "REFRESH_CREATIVE",
        "CONSIDER_BUDGET_INCREASE",
        "CONSIDER_BUDGET_DECREASE",
        "MAINTAIN_CURRENT_DELIVERY",
        "GATHER_MORE_DATA",
        "AUDIT_EXTERNAL_CHANGES",
      ],
      required: true,
    },
    recommendationText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "REVIEWED", "DISMISSED", "ACTION_REQUESTED"],
      default: "OPEN",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdsPerformanceRecommendation", AdsPerformanceRecommendationSchema);
