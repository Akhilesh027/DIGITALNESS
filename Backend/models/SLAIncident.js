const mongoose = require("mongoose");

const riskFactorSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    scoreContribution: { type: Number, required: true, default: 0 },
    details: { type: String, default: "" },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "REASSIGN_WORK",
        "EXTEND_DEADLINE",
        "CHANGE_PRIORITY",
        "NOTIFY_ASSIGNEE",
        "NOTIFY_MANAGER",
        "REQUEST_APPROVAL",
        "REQUEST_CLIENT_INPUT",
        "SPLIT_TASK",
      ],
      required: true,
    },
    label: { type: String, required: true },
    confidence: { type: Number, default: 0.85 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const slaIncidentSchema = new mongoose.Schema(
  {
    incidentKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "UPCOMING_DEADLINE",
        "AT_RISK",
        "SLA_BREACH",
        "STALLED_REVIEW",
        "WORKLOAD_RISK",
        "DEPENDENCY_BLOCKED",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "REMEDIATING", "RESOLVED", "IGNORED"],
      default: "OPEN",
      index: true,
    },
    responsibility: {
      type: String,
      enum: ["INTERNAL", "CLIENT", "MANAGER", "EXTERNAL"],
      default: "INTERNAL",
    },
    deadline: {
      type: Date,
    },
    riskFactors: [riskFactorSchema],
    primaryRootCause: {
      type: String,
      default: "",
    },
    rootCauses: [String],
    recommendations: [recommendationSchema],
    escalationLevel: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    automationRunId: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionType: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

slaIncidentSchema.index({ status: 1, severity: 1, riskScore: -1 });

module.exports = mongoose.model("SLAIncident", slaIncidentSchema);
