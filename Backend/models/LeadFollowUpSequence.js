const mongoose = require("mongoose");

const sequenceStepExecutionSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["TEXT", "TEMPLATE", "INTERACTIVE"],
      default: "TEXT",
    },
    templateName: {
      type: String,
      default: null,
    },
    serviceWindowText: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "SCHEDULED", "SENT", "DELIVERED", "READ", "SKIPPED", "FAILED"],
      default: "PENDING",
    },
    skipReason: {
      type: String,
      default: null,
    },
    executionId: {
      type: String,
      default: null,
    },
    bullmqJobId: {
      type: String,
      default: null,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    leadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadMessage",
      default: null,
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const leadFollowUpSequenceSchema = new mongoose.Schema(
  {
    sequenceId: {
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
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadConversation",
      required: true,
      index: true,
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadFollowUpPolicy",
      required: true,
      index: true,
    },
    policyVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACTIVE",
        "WAITING",
        "COMPLETED",
        "STOPPED",
        "CANCELLED",
        "FAILED",
        "PAUSED_HUMAN_HANDOFF",
        "OPTED_OUT",
      ],
      default: "ACTIVE",
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    nextScheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastExecutionAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
    stopReason: {
      type: String,
      default: null,
    },
    steps: {
      type: [sequenceStepExecutionSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

leadFollowUpSequenceSchema.index({ conversationId: 1, status: 1 });
leadFollowUpSequenceSchema.index({ customerId: 1, status: 1, nextScheduledAt: 1 });

let LeadFollowUpSequenceModel;
try {
  LeadFollowUpSequenceModel = mongoose.model("LeadFollowUpSequence");
} catch (e) {
  LeadFollowUpSequenceModel = mongoose.model("LeadFollowUpSequence", leadFollowUpSequenceSchema);
}

module.exports = LeadFollowUpSequenceModel;
