/**
 * GoogleAdsExternalChange.js
 * Persistent MongoDB Model for Tracking External Modifications in Google Ads (Change Events)
 */

const mongoose = require("mongoose");

const GoogleAdsExternalChangeSchema = new mongoose.Schema(
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
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      default: null,
      index: true,
    },
    googleAdsCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    changeDateTime: {
      type: Date,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["CAMPAIGN", "CAMPAIGN_BUDGET", "AD_GROUP", "AD_GROUP_CRITERION", "AD_GROUP_AD", "UNKNOWN"],
      required: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    changedFields: {
      type: [String],
      default: [],
    },
    oldResource: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    newResource: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userEmail: {
      type: String,
      default: null,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoogleAdsExternalChange", GoogleAdsExternalChangeSchema);
