const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: [
        "Admin",
        "Manager",
        "Operational Manager",
        "Branch Manager",
        "Account Executive",
        "Employee",
        "Client",
        "AI Agent",
        "Scheduler",
        "System",
      ],
      required: true,
      default: "System",
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    actorName: {
      type: String,
      default: "System",
    },

    agentId: {
      type: String,
      default: "",
    },

    agentRunId: {
      type: String,
      default: "",
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      default: "",
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

    inputSummary: {
      type: String,
      default: "",
    },

    outputSummary: {
      type: String,
      default: "",
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    approvalRequired: {
      type: Boolean,
      default: false,
    },

    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkApproval",
      default: null,
    },

    status: {
      type: String,
      enum: ["Success", "Warning", "Error", "Pending Approval"],
      default: "Success",
    },

    error: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
