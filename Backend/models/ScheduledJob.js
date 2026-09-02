const mongoose = require("mongoose");

const scheduledJobSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      enum: [
        "ContentPublish",
        "Reminder",
        "AgentTask",
        "MarketingSync",
        "ReportGeneration",
      ],
      required: true,
      index: true,
    },

    queueName: {
      type: String,
      default: "scheduled-content",
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

    entityType: {
      type: String,
      default: "ContentItem",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      required: true,
      index: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    bullJobId: {
      type: String,
      default: "",
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Queued",
        "Processing",
        "Completed",
        "Failed",
        "Cancelled",
        "Retrying",
      ],
      default: "Pending",
      index: true,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 3,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    executedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

scheduledJobSchema.index({ entityId: 1, scheduledFor: 1, status: 1 });

module.exports = mongoose.model("ScheduledJob", scheduledJobSchema);
