const mongoose = require("mongoose");

const agentRunSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    clientLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    parentAgent: {
      type: String,
      default: "ParentOrchestratorAgent",
    },

    requiredAgents: {
      type: [String],
      default: [],
    },

    intent: {
      type: String,
      default: "",
    },

    originalRequest: {
      type: String,
      required: true,
    },

    readiness: {
      type: Number,
      default: 0,
    },

    plan: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    planStatus: {
      type: String,
      default: "Draft",
    },

    executionStatus: {
      type: String,
      default: "Not Started",
    },

    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    approvalIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkApproval",
      },
    ],

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

agentRunSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AgentRun", agentRunSchema);
