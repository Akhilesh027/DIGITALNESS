const mongoose = require("mongoose");

const aiCommandActionSchema = new mongoose.Schema(
  {
    actionId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    command: {
      type: String,
      required: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED", "ROLLED_BACK"],
      default: "PENDING",
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: "",
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const aiCommandExecutionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },

    blueprintId: {
      type: String,
      index: true,
    },

    originalPrompt: {
      type: String,
      required: true,
    },

    intent: {
      type: String,
      required: true,
      index: true,
    },

    command: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      default: "GENERAL",
    },

    actionType: {
      type: String,
      enum: ["READ", "WRITE"],
      default: "READ",
    },

    riskLevel: {
      type: String,
      enum: ["R0", "R1", "R2", "R3", "READ", "DRAFT", "LOW_RISK_WRITE", "APPROVAL_REQUIRED", "RESTRICTED"],
      default: "R0",
    },

    approvalRequired: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "COLLECTING_INPUT",
        "READY",
        "WAITING_APPROVAL",
        "APPROVED",
        "EXECUTING",
        "COMPLETED",
        "PARTIALLY_FAILED",
        "FAILED",
        "CANCELLED",
        "ROLLED_BACK",
      ],
      default: "READY",
      index: true,
    },

    conversationState: {
      mode: {
        type: String,
        enum: ["COLLECTING_INPUT", "READY_FOR_CONFIRMATION", "COMPLETED", "ABANDONED"],
        default: "COLLECTING_INPUT",
      },
      collectedFields: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      skippedFields: {
        type: [String],
        default: [],
      },
      missingRequiredFields: {
        type: [String],
        default: [],
      },
      recommendedRemaining: {
        type: [String],
        default: [],
      },
      currentField: {
        type: String,
        default: null,
      },
      currentQuestion: {
        type: String,
        default: null,
      },
      questionHistory: [
        {
          field: String,
          question: String,
          answer: String,
          extractedValue: mongoose.Schema.Types.Mixed,
          status: { type: String, enum: ["ANSWERED", "SKIPPED", "CORRECTED"], default: "ANSWERED" },
          askedAt: { type: Date, default: Date.now },
        },
      ],
      correctionHistory: [
        {
          field: String,
          oldValue: mongoose.Schema.Types.Mixed,
          newValue: mongoose.Schema.Types.Mixed,
          rawStatement: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      startedAt: { type: Date, default: Date.now },
      lastInteractionAt: { type: Date, default: Date.now },
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
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

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    missingParameters: {
      type: [String],
      default: [],
    },

    resolvedEntities: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
      clientLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLocation", default: null },
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Work", default: null },
      leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
      contentItemId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentItem", default: null },
      creativeProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "CreativeProject", default: null },
      customerName: { type: String, default: "" },
      locationName: { type: String, default: "" },
      employeeName: { type: String, default: "" },
      taskTitle: { type: String, default: "" },
      leadName: { type: String, default: "" },
    },

    ambiguity: {
      isAmbiguous: { type: Boolean, default: false },
      field: { type: String, default: "" },
      candidates: { type: [mongoose.Schema.Types.Mixed], default: [] },
      message: { type: String, default: "" },
    },

    actions: {
      type: [aiCommandActionSchema],
      default: [],
    },

    verification: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "VERIFIED", "FAILED"],
        default: "NOT_REQUIRED",
      },
      verifiedAt: { type: Date, default: null },
      query: { type: mongoose.Schema.Types.Mixed, default: null },
      expected: { type: mongoose.Schema.Types.Mixed, default: null },
      actual: { type: mongoose.Schema.Types.Mixed, default: null },
      details: { type: String, default: "" },
    },

    supportsRollback: {
      type: Boolean,
      default: false,
    },

    rollbackData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    rollbackStatus: {
      type: String,
      enum: ["NONE", "AVAILABLE", "ROLLED_BACK", "ROLLBACK_FAILED"],
      default: "NONE",
    },

    warnings: {
      type: [String],
      default: [],
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
      default: null,
    },
  },
  { timestamps: true }
);

aiCommandExecutionSchema.index({ createdAt: -1 });
aiCommandExecutionSchema.index({ requestedBy: 1, createdAt: -1 });
aiCommandExecutionSchema.index({ "resolvedEntities.customerId": 1, createdAt: -1 });

module.exports = mongoose.model("AICommandExecution", aiCommandExecutionSchema);
