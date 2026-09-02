const mongoose = require("mongoose");

const approvalVersionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    generatedByType: {
      type: String,
      enum: ["USER", "AI_AGENT", "AUTOMATION_ENGINE", "SYSTEM"],
      default: "AI_AGENT",
    },
    generatedBy: {
      type: String,
      default: "System",
    },
    blueprintPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    executionPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previewUrl: {
      type: String,
      default: null,
    },
    assetIds: [
      {
        type: String,
      },
    ],
    managerFeedback: {
      type: String,
      default: null,
    },
    feedbackBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    feedbackAt: {
      type: Date,
      default: null,
    },
    superseded: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const approvalRequestSchema = new mongoose.Schema(
  {
    approvalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      enum: [
        "CREATIVE",
        "SOCIAL_POST",
        "META_ADS",
        "GOOGLE_ADS",
        "GBP",
        "WHATSAPP",
        "PAYMENT",
        "LEAD",
        "CONTENT",
        "INTERNAL",
      ],
      index: true,
    },

    actionType: {
      type: String,
      default: "GENERATE",
    },

    riskLevel: {
      type: String,
      required: true,
      enum: ["R0", "R1", "R2", "R3"],
      default: "R1",
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        "DRAFT",
        "AI_GENERATED",
        "WAITING_APPROVAL",
        "CHANGES_REQUESTED",
        "REGENERATING",
        "APPROVED",
        "REJECTED",
        "QUEUED",
        "EXECUTING",
        "EXECUTED",
        "FAILED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    clientLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },

    sourceAgent: {
      type: String,
      default: null,
    },

    sourceCommand: {
      type: String,
      default: null,
    },

    sourceConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      default: null,
    },

    sourceAgentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun",
      default: null,
    },

    resourceType: {
      type: String,
      default: null,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    currentVersion: {
      type: Number,
      default: 1,
    },

    versions: {
      type: [approvalVersionSchema],
      default: [],
    },

    executionIntent: {
      connector: { type: String, default: null },
      service: { type: String, default: null },
      action: { type: String, default: null },
      payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    submittedByType: {
      type: String,
      enum: ["USER", "AI_AGENT", "AUTOMATION_ENGINE", "SYSTEM"],
      default: "AI_AGENT",
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decisionRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    queuedAt: { type: Date, default: null },
    executionStartedAt: { type: Date, default: null },
    executedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },

    failureReason: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

approvalRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
