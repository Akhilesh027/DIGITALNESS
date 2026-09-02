const mongoose = require("mongoose");

const CONVERSATION_STATES = [
  "NEW",
  "GREETING",
  "QUALIFYING",
  "ENGAGED",
  "HUMAN_HANDOFF",
  "WAITING_CUSTOMER",
  "FOLLOW_UP_ELIGIBLE",
  "CONVERTED",
  "CLOSED",
  "OPTED_OUT",
];

const leadConversationSchema = new mongoose.Schema(
  {
    conversationId: {
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
      default: null,
      index: true,
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingConnection",
      default: null,
    },
    channel: {
      type: String,
      enum: ["WHATSAPP"],
      default: "WHATSAPP",
    },
    wabaId: {
      type: String,
      default: null,
    },
    phoneNumberId: {
      type: String,
      required: true,
      index: true,
    },
    participantWaId: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      enum: CONVERSATION_STATES,
      default: "NEW",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    automationMode: {
      type: String,
      enum: ["AUTOMATED", "HUMAN"],
      default: "AUTOMATED",
    },
    lastInboundAt: {
      type: Date,
      default: null,
    },
    lastOutboundAt: {
      type: Date,
      default: null,
    },
    serviceWindowOpenedAt: {
      type: Date,
      default: null,
    },
    serviceWindowExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    humanHandoffRequested: {
      type: Boolean,
      default: false,
    },
    marketingOptIn: {
      type: Boolean,
      default: false,
    },
    marketingOptInSource: {
      type: String,
      default: null,
    },
    marketingOptInAt: {
      type: Date,
      default: null,
    },
    marketingOptOutAt: {
      type: Date,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    qualificationSummary: {
      intent: { type: String, default: null },
      serviceInterest: { type: String, default: null },
      urgency: { type: String, default: null },
      purchaseTimeline: { type: String, default: null },
      qualificationScore: { type: Number, default: 0 },
      humanEscalationRecommended: { type: Boolean, default: false },
      nextRecommendedAction: { type: String, default: null },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for participant under specific customer and phone number
leadConversationSchema.index(
  { customerId: 1, phoneNumberId: 1, participantWaId: 1 },
  { unique: true }
);

let LeadConversationModel;
try {
  LeadConversationModel = mongoose.model("LeadConversation");
} catch (e) {
  LeadConversationModel = mongoose.model("LeadConversation", leadConversationSchema);
}

module.exports = LeadConversationModel;
