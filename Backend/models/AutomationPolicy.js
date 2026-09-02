const mongoose = require("mongoose");

const automationPolicySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    engine: {
      type: String,
      enum: [
        "CLIENT_PIPELINE",
        "CONTENT_CALENDAR",
        "SLA_GUARDIAN",
        "PAYMENT_RECOVERY",
        "EXECUTIVE_BRIEFING",
        "GENERAL",
      ],
      default: "GENERAL",
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      enum: [
        "DISABLED",
        "SUGGEST_ONLY",
        "DRAFT",
        "APPROVAL_REQUIRED",
        "AUTO_EXECUTE",
      ],
      default: "APPROVAL_REQUIRED",
    },
    rolesAllowed: {
      type: [String],
      default: ["Admin", "Super Admin", "Manager", "Managing Director"],
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    maxActionsPerRun: {
      type: Number,
      default: 25,
    },
    lastTriggeredAt: {
      type: Date,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AutomationPolicy", automationPolicySchema);
