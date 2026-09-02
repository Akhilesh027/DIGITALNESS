const mongoose = require("mongoose");

const whatsAppAutomationPolicySchema = new mongoose.Schema(
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
    policyType: {
      type: String,
      enum: [
        "WELCOME_MENU",
        "BUSINESS_HOURS_RESPONSE",
        "HUMAN_HANDOFF_ACK",
        "BASIC_SERVICE_MENU",
      ],
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowedWindow: {
      type: String,
      enum: ["CUSTOMER_SERVICE_WINDOW"],
      default: "CUSTOMER_SERVICE_WINDOW",
    },
    messageDefinition: {
      messageType: {
        type: String,
        enum: ["TEXT", "INTERACTIVE"],
        default: "TEXT",
      },
      text: { type: String, default: "" },
      interactive: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    allowedIntents: {
      type: [String],
      default: ["GREETING", "MENU_REQUEST", "GENERAL_INQUIRY"],
    },
    disallowedTopics: {
      type: [String],
      default: ["PRICING_PROMISES", "REFUND_PROMISES", "DISCOUNTS", "FINANCIAL_GUARANTEES"],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

whatsAppAutomationPolicySchema.index({ customerId: 1, locationId: 1, policyType: 1 }, { unique: true });

let WhatsAppAutomationPolicyModel;
try {
  WhatsAppAutomationPolicyModel = mongoose.model("WhatsAppAutomationPolicy");
} catch (e) {
  WhatsAppAutomationPolicyModel = mongoose.model("WhatsAppAutomationPolicy", whatsAppAutomationPolicySchema);
}

module.exports = WhatsAppAutomationPolicyModel;
