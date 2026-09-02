const mongoose = require("mongoose");

const reportSnapshotSchema = new mongoose.Schema(
  {
    reportSnapshotId: {
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
    reportType: {
      type: String,
      enum: [
        "MONTHLY_CLIENT_SCORECARD",
        "EXECUTIVE_AGENCY_OVERVIEW",
        "CAMPAIGN_SUMMARY",
        "WEEKLY_OPERATIONS",
      ],
      default: "MONTHLY_CLIENT_SCORECARD",
      index: true,
    },
    periodType: {
      type: String,
      enum: ["THIS_MONTH", "LAST_MONTH", "LAST_7_DAYS", "LAST_30_DAYS", "CUSTOM"],
      default: "THIS_MONTH",
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    clientHealthScore: {
      score: { type: Number, default: 100 },
      status: { type: String, default: "ON_TRACK" },
      breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    sourceFreshness: [
      {
        source: { type: String, required: true },
        lastSyncedAt: { type: Date, default: null },
        status: { type: String, enum: ["HEALTHY", "STALE", "NOT_CONFIGURED", "ERROR"], default: "HEALTHY" },
      },
    ],
    generationVersion: {
      type: Number,
      default: 1,
    },
    revision: {
      type: Number,
      default: 1,
    },
    revisionReason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["DRAFT", "GENERATED", "REVIEWED", "FINALIZED", "ARCHIVED"],
      default: "GENERATED",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["INTERNAL", "CLIENT_SAFE"],
      default: "INTERNAL",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    checksum: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

reportSnapshotSchema.index({ customerId: 1, periodStart: 1, periodEnd: 1, reportType: 1 });
reportSnapshotSchema.index({ reportType: 1, createdAt: -1 });

let ReportSnapshotModel;
try {
  ReportSnapshotModel = mongoose.model("ReportSnapshot");
} catch (e) {
  ReportSnapshotModel = mongoose.model("ReportSnapshot", reportSnapshotSchema);
}

module.exports = ReportSnapshotModel;
