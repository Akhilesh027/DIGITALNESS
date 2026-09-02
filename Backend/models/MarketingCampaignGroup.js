const mongoose = require("mongoose");

const marketingCampaignGroupSchema = new mongoose.Schema(
  {
    campaignGroupId: {
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
    locationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClientLocation",
      },
    ],
    name: {
      type: String,
      required: true,
      trim: true,
    },
    objective: {
      type: String,
      default: "Brand Awareness & Festive Engagement",
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PLANNING",
        "IN_PRODUCTION",
        "WAITING_APPROVAL",
        "READY",
        "LIVE",
        "COMPLETED",
        "PAUSED",
      ],
      default: "PLANNING",
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

marketingCampaignGroupSchema.index({ customerId: 1, startAt: 1 });

let MarketingCampaignGroupModel;
try {
  MarketingCampaignGroupModel = mongoose.model("MarketingCampaignGroup");
} catch (e) {
  MarketingCampaignGroupModel = mongoose.model("MarketingCampaignGroup", marketingCampaignGroupSchema);
}

module.exports = MarketingCampaignGroupModel;
