/**
 * ExecutionJob.js
 * Persistent MongoDB Execution Job Ledger for BullMQ Workers
 */

const mongoose = require("mongoose");

const ExecutionJobSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bullJobId: {
      type: String,
      default: null,
      index: true,
    },
    queueName: {
      type: String,
      required: true,
      index: true,
    },
    jobType: {
      type: String,
      required: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
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
    domain: {
      type: String,
      default: "GENERAL",
    },
    operation: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resourceVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["PENDING", "QUEUED", "EXECUTING", "SUCCEEDED", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    lastError: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      retryable: { type: Boolean, default: false },
      occurredAt: { type: Date, default: null },
    },
    result: {
      externalId: { type: String, default: null },
      mock: { type: Boolean, default: true },
      data: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    correlationId: {
      type: String,
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExecutionJob", ExecutionJobSchema);
