const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    turnId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    text: { type: String, default: "" },
    state: {
      type: String,
      enum: [
        "IDLE",
        "UNDERSTANDING",
        "AWAITING_ENTITY",
        "COLLECTING_INPUT",
        "AWAITING_APPROVAL",
        "AWAITING_FINAL_REVIEW",
        "AWAITING_DELIVERY_SCHEDULE",
        "EXECUTING",
        "COMPLETED",
        "ERROR",
      ],
      default: "IDLE",
    },
    uiBlocks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: "New AI Workspace Chat",
    },
    state: {
      type: String,
      enum: [
        "IDLE",
        "UNDERSTANDING",
        "AWAITING_ENTITY",
        "COLLECTING_INPUT",
        "AWAITING_APPROVAL",
        "AWAITING_FINAL_REVIEW",
        "AWAITING_DELIVERY_SCHEDULE",
        "EXECUTING",
        "COMPLETED",
        "ERROR",
      ],
      default: "IDLE",
    },
    activeCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    activeCustomerName: {
      type: String,
      default: "",
    },
    pendingCommandId: {
      type: String,
      default: null,
    },
    activeContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    messages: [aiMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIConversation", aiConversationSchema);
