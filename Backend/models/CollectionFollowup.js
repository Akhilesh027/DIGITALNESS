const mongoose = require("mongoose");

const contactAttemptSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "WHATSAPP", "SMS", "CALL"],
      default: "WHATSAPP",
    },
    type: {
      type: String,
      enum: ["REMINDER", "FOLLOW_UP", "PROMISE_CONFIRMATION", "ESCALATION"],
      default: "REMINDER",
    },
    status: {
      type: String,
      enum: ["DRAFTED", "APPROVED", "SENT", "DELIVERED", "FAILED"],
      default: "DRAFTED",
    },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    cta: { type: String, default: "" },
    messageId: { type: String, default: "" },
    automationRunId: { type: String, default: "" },
  },
  { _id: false }
);

const promiseToPaySchema = new mongoose.Schema(
  {
    promiseId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "FULFILLED", "BROKEN"],
      default: "PENDING",
    },
    createdAt: { type: Date, default: Date.now },
    fulfilledAt: { type: Date, default: null },
    brokenAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const collectionFollowupSchema = new mongoose.Schema(
  {
    followupKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "PROMISE_TO_PAY", "DISPUTED", "PAID", "ESCALATED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    agingBucket: {
      type: String,
      enum: [
        "UPCOMING",
        "DUE_TODAY",
        "OVERDUE_1_3",
        "OVERDUE_4_7",
        "OVERDUE_8_15",
        "OVERDUE_16_30",
        "OVERDUE_30_PLUS",
      ],
      default: "UPCOMING",
      index: true,
    },
    balanceAtDetection: {
      type: Number,
      required: true,
      min: 0,
    },
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    recoveryStage: {
      type: String,
      default: "FRIENDLY_REMINDER",
    },
    lastContactAt: {
      type: Date,
      default: null,
    },
    nextFollowupAt: {
      type: Date,
      default: null,
    },
    contactAttempts: [contactAttemptSchema],
    promises: [promiseToPaySchema],
    dispute: {
      active: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      openedAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    assignedCollector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

collectionFollowupSchema.index({ status: 1, agingBucket: 1, priorityScore: -1 });

module.exports = mongoose.model("CollectionFollowup", collectionFollowupSchema);
