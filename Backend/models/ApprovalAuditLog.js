const mongoose = require("mongoose");

const approvalAuditLogSchema = new mongoose.Schema(
  {
    approvalId: {
      type: String,
      required: true,
      index: true,
    },
    approvalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      required: true,
      index: true,
    },
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    actorType: {
      type: String,
      enum: ["USER", "AI_AGENT", "AUTOMATION_ENGINE", "SYSTEM"],
      default: "USER",
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorRole: {
      type: String,
      default: "System",
    },
    remarks: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      default: 1,
    },
    sourceAgentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

approvalAuditLogSchema.index({ approvalId: 1, createdAt: -1 });
approvalAuditLogSchema.index({ approvalRequestId: 1, createdAt: -1 });

module.exports = mongoose.model("ApprovalAuditLog", approvalAuditLogSchema);
