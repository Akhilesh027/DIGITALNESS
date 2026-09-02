const mongoose = require("mongoose");

const clientProductionPolicySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },
    certifiedDomains: {
      type: [String],
      default: ["SOCIAL", "GBP", "INBOX", "CALENDAR", "REPORTING"],
    },
    externalWritesEnabled: {
      type: Boolean,
      default: false, // Default false until explicit admin sign-off
    },
    adsActivationEnabled: {
      type: Boolean,
      default: false, // Production safety lock
    },
    whatsappAutomationEnabled: {
      type: Boolean,
      default: false,
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
  },
  { timestamps: true }
);

let ClientProductionPolicyModel;
try {
  ClientProductionPolicyModel = mongoose.model("ClientProductionPolicy");
} catch (e) {
  ClientProductionPolicyModel = mongoose.model("ClientProductionPolicy", clientProductionPolicySchema);
}

module.exports = ClientProductionPolicyModel;
