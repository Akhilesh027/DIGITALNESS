const mongoose = require("mongoose");

const leadMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadConversation",
      required: true,
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
    providerMessageId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["INBOUND", "OUTBOUND"],
      required: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["TEXT", "INTERACTIVE", "TEMPLATE", "MEDIA"],
      default: "TEXT",
    },
    text: {
      type: String,
      default: "",
    },
    interactive: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    template: {
      name: { type: String, default: null },
      language: { type: String, default: null },
      components: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    mediaReference: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["QUEUED", "SENDING", "SENT", "DELIVERED", "READ", "FAILED"],
      default: "SENT",
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureCode: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    generatedBy: {
      type: String,
      enum: ["USER", "AUTOMATION_POLICY", "LEAD_AGENT", "SYSTEM"],
      default: "SYSTEM",
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
    },
    automationPolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WhatsAppAutomationPolicy",
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

leadMessageSchema.index({ conversationId: 1, createdAt: -1 });

let LeadMessageModel;
try {
  LeadMessageModel = mongoose.model("LeadMessage");
} catch (e) {
  LeadMessageModel = mongoose.model("LeadMessage", leadMessageSchema);
}

module.exports = LeadMessageModel;
