const mongoose = require("mongoose");

const automationRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      required: true,
      index: true,
    },
    triggerType: {
      type: String,
      enum: ["EVENT", "SCHEDULE", "COMMAND", "MANUAL"],
      required: true,
      index: true,
    },
    triggerReference: {
      type: String,
      default: "",
    },
    policyKey: {
      type: String,
      default: "",
      index: true,
    },
    policyMode: {
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
    status: {
      type: String,
      enum: [
        "QUEUED",
        "RUNNING",
        "WAITING_APPROVAL",
        "COMPLETED",
        "PARTIAL",
        "FAILED",
        "SKIPPED",
      ],
      default: "QUEUED",
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    actionsPlanned: {
      type: [
        {
          step: Number,
          action: String,
          command: String,
          parameters: mongoose.Schema.Types.Mixed,
          status: {
            type: String,
            enum: ["PENDING", "APPROVED", "COMPLETED", "FAILED", "SKIPPED"],
            default: "PENDING",
          },
          result: mongoose.Schema.Types.Mixed,
          error: String,
        },
      ],
      default: [],
    },
    actionsExecuted: {
      type: [
        {
          command: String,
          executionId: String,
          executedAt: Date,
          status: String,
          result: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
    error: {
      type: String,
      default: "",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AutomationRun", automationRunSchema);
