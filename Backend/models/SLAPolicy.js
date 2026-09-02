const mongoose = require("mongoose");

const slaPolicySchema = new mongoose.Schema(
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
      default: null, // null = system default SLA
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: [
        "WHATSAPP_CONVERSATION",
        "GBP_REVIEW",
        "LEAD",
        "FOLLOWUP_EXCEPTION",
        "SLA_INCIDENT",
        "ADS_RECOMMENDATION",
        "ALL",
      ],
      default: "ALL",
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT", "ALL"],
      default: "ALL",
    },
    firstResponseMinutes: {
      type: Number,
      default: 30, // 30 minutes default
    },
    resolutionMinutes: {
      type: Number,
      default: 1440, // 24 hours default
    },
    escalationMinutes: {
      type: Number,
      default: 45,
    },
    atRiskThresholdPercent: {
      type: Number,
      default: 80, // at 80% consumed time -> AT_RISK
    },
    businessHoursOnly: {
      type: Boolean,
      default: true,
    },
    businessHours: {
      startHour: { type: Number, default: 9 },
      endHour: { type: Number, default: 19 },
      timezone: { type: String, default: "Asia/Kolkata" },
      weekendTracked: { type: Boolean, default: false },
    },
    escalationTargets: [
      {
        level: { type: String, enum: ["LEVEL_1", "LEVEL_2", "CRITICAL"] },
        role: { type: String, default: "Manager" },
        targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

let SLAPolicyModel;
try {
  SLAPolicyModel = mongoose.model("SLAPolicy");
} catch (e) {
  SLAPolicyModel = mongoose.model("SLAPolicy", slaPolicySchema);
}

module.exports = SLAPolicyModel;
