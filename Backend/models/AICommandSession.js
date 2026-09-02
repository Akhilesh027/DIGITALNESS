const mongoose = require("mongoose");

const aiCommandSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    originalPrompt: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      required: true,
    },
    command: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      enum: ["GLOBAL", "CUSTOMER", "LEAD", "EMPLOYEE", "TASK", "OPTIONAL_CUSTOMER"],
      default: "GLOBAL",
    },
    status: {
      type: String,
      enum: [
        "AWAITING_ENTITY",
        "COLLECTING_INPUT",
        "AWAITING_APPROVAL",
        "IMAGE_PROVIDER_REQUIRED",
        "AWAITING_FINAL_REVIEW",
        "CREATIVE_APPROVED",
        "AWAITING_DELIVERY_SCHEDULE",
        "EXECUTING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      default: "AWAITING_ENTITY",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    customerName: {
      type: String,
      default: "",
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    missingFields: {
      type: [String],
      default: [],
    },
    currentQuestion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    blueprint: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    executionId: {
      type: String,
      default: null,
    },
    creativeRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun",
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AICommandSession", aiCommandSessionSchema);
