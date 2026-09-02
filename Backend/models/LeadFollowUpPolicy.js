const mongoose = require("mongoose");

const followUpStepSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    delayMinutes: {
      type: Number,
      required: true,
      default: 120, // 2 hours default
    },
    messageType: {
      type: String,
      enum: ["TEXT", "TEMPLATE", "INTERACTIVE"],
      default: "TEXT",
    },
    serviceWindowText: {
      type: String,
      default: "",
    },
    templateName: {
      type: String,
      default: null,
    },
    templateLanguage: {
      type: String,
      default: "en_US",
    },
    templateParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requireApprovalIfOutsideWindow: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const leadFollowUpPolicySchema = new mongoose.Schema(
  {
    policyId: {
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    leadSource: {
      type: String,
      default: "ALL", // "WHATSAPP_INBOUND", "META_LEAD_ADS", "GOOGLE_ADS", "ALL"
    },
    serviceType: {
      type: String,
      default: "GENERAL",
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    eligibilityRules: {
      minScore: { type: Number, default: 20 },
      allowedIntents: { type: [String], default: ["GREETING", "PRICE_INQUIRY", "BOOK_APPOINTMENT", "GENERAL_INQUIRY"] },
      excludedStates: { type: [String], default: ["WON", "LOST", "CLOSED", "OPTED_OUT", "HUMAN_HANDOFF"] },
    },
    steps: {
      type: [followUpStepSchema],
      default: [],
    },
    stopConditions: {
      onCustomerResponse: { type: Boolean, default: true },
      onConversion: { type: Boolean, default: true },
      onOptOut: { type: Boolean, default: true },
      onHumanHandoff: { type: Boolean, default: true },
      onNotInterested: { type: Boolean, default: true },
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      startHour: { type: Number, default: 9 }, // 09:00 AM
      endHour: { type: Number, default: 19 }, // 07:00 PM
      timezone: { type: String, default: "Asia/Kolkata" },
      weekendAllowed: { type: Boolean, default: true },
    },
    maxAttempts: {
      type: Number,
      default: 3,
      max: 3, // Hard global ceiling
    },
    maxFollowupStepAgeHours: {
      type: Number,
      default: 48,
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
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
    },
  },
  { timestamps: true }
);

leadFollowUpPolicySchema.index({ customerId: 1, locationId: 1, status: 1 });

let LeadFollowUpPolicyModel;
try {
  LeadFollowUpPolicyModel = mongoose.model("LeadFollowUpPolicy");
} catch (e) {
  LeadFollowUpPolicyModel = mongoose.model("LeadFollowUpPolicy", leadFollowUpPolicySchema);
}

module.exports = LeadFollowUpPolicyModel;
