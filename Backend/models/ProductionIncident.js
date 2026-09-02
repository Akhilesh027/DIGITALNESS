const mongoose = require("mongoose");

const productionIncidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["SEV1", "SEV2", "SEV3", "SEV4"],
      required: true,
      index: true,
    },
    domain: {
      type: String,
      enum: [
        "SECURITY",
        "INFRASTRUCTURE",
        "CREATIVE",
        "SOCIAL",
        "META_ADS",
        "GBP",
        "GOOGLE_ADS",
        "WHATSAPP",
        "INBOX",
        "CALENDAR",
        "REPORTING",
      ],
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },
    executionId: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: "",
    },
    errorCode: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"],
      default: "OPEN",
      index: true,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolution: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

let ProductionIncidentModel;
try {
  ProductionIncidentModel = mongoose.model("ProductionIncident");
} catch (e) {
  ProductionIncidentModel = mongoose.model("ProductionIncident", productionIncidentSchema);
}

module.exports = ProductionIncidentModel;
