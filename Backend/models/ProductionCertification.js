const mongoose = require("mongoose");

const productionCertificationSchema = new mongoose.Schema(
  {
    certificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    environment: {
      type: String,
      default: "PILOT",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "BLOCKED",
        "INTERNAL_PILOT_CERTIFIED",
        "CANARY_CERTIFIED",
        "PRODUCTION_READY",
        "REVOKED",
      ],
      default: "IN_PROGRESS",
      index: true,
    },
    gates: [
      {
        gateId: { type: String, required: true },
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
        },
        status: {
          type: String,
          enum: ["MOCK_PASS", "HARNESS_PASS", "REAL_PASS", "NOT_RUN", "BLOCKED", "NOT_IN_SCOPE"],
          default: "NOT_RUN",
        },
        testedAt: { type: Date, default: null },
        evidenceRefs: { type: mongoose.Schema.Types.Mixed, default: {} },
        failureReason: { type: String, default: null },
      },
    ],
    completeness: {
      codeCompleteness: { type: Number, default: 100 },
      harnessCompleteness: { type: Number, default: 100 },
      realProviderCompleteness: { type: Number, default: 0 },
      productionCertificationCompleteness: { type: Number, default: 0 },
    },
    blockingIssues: [{ type: String }],
    certifiedDomains: [{ type: String }],
    nonCertifiedDomains: [{ type: String }],
    certifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

let ProductionCertificationModel;
try {
  ProductionCertificationModel = mongoose.model("ProductionCertification");
} catch (e) {
  ProductionCertificationModel = mongoose.model("ProductionCertification", productionCertificationSchema);
}

module.exports = ProductionCertificationModel;
