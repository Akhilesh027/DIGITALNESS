const mongoose = require("mongoose");

const inboxItemSchema = new mongoose.Schema(
  {
    inboxItemId: {
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
    sourceType: {
      type: String,
      enum: [
        "WHATSAPP_CONVERSATION",
        "GBP_REVIEW",
        "LEAD",
        "FOLLOWUP_EXCEPTION",
        "SLA_INCIDENT",
        "ADS_RECOMMENDATION",
        "MANUAL_TASK",
        "APPROVAL_REQUIRED",
      ],
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: [
        "WHATSAPP",
        "GOOGLE_BUSINESS",
        "META_LEAD",
        "GOOGLE_ADS_LEAD",
        "WEBSITE",
        "PHONE",
        "MANUAL",
        "INTERNAL",
      ],
      default: "WHATSAPP",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "LEAD_INQUIRY",
        "SUPPORT",
        "REPUTATION",
        "BILLING",
        "MARKETING_EXCEPTION",
        "OPERATIONS",
      ],
      default: "LEAD_INQUIRY",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "NEW",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING_CUSTOMER",
        "WAITING_INTERNAL",
        "SNOOZED",
        "RESOLVED",
        "CLOSED",
      ],
      default: "NEW",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    assignmentSource: {
      type: String,
      enum: ["AUTO", "MANUAL"],
      default: "AUTO",
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
    unreadCount: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      default: "",
    },
    snippet: {
      type: String,
      default: "",
    },
    participantName: {
      type: String,
      default: "",
    },
    participantPhone: {
      type: String,
      default: "",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstResponseDueAt: {
      type: Date,
      default: null,
      index: true,
    },
    firstResponseHandledAt: {
      type: Date,
      default: null,
    },
    resolutionDueAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    slaStatus: {
      type: String,
      enum: ["ON_TRACK", "AT_RISK", "BREACHED", "PAUSED", "COMPLETED"],
      default: "ON_TRACK",
      index: true,
    },
    escalationLevel: {
      type: String,
      enum: ["NONE", "LEVEL_1", "LEVEL_2", "CRITICAL"],
      default: "NONE",
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// High-performance compound indexes for workspace filtering & pagination
inboxItemSchema.index({ customerId: 1, status: 1, lastActivityAt: -1 });
inboxItemSchema.index({ customerId: 1, locationId: 1, channel: 1 });
inboxItemSchema.index({ assignedTo: 1, status: 1 });
inboxItemSchema.index({ customerId: 1, sourceType: 1, sourceId: 1 }, { unique: true });
inboxItemSchema.index({ slaStatus: 1, firstResponseDueAt: 1 });

let InboxItemModel;
try {
  InboxItemModel = mongoose.model("InboxItem");
} catch (e) {
  InboxItemModel = mongoose.model("InboxItem", inboxItemSchema);
}

module.exports = InboxItemModel;
