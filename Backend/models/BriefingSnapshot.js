const mongoose = require("mongoose");

const priorityItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      enum: ["DELIVERY", "COLLECTION", "SALES", "CONTENT", "TEAM", "AUTOMATION"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    clientId: { type: mongoose.Schema.Types.Mixed, default: null },
    clientName: { type: String, default: "" },
    referenceType: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    score: { type: Number, required: true, min: 0, max: 100 },
    severity: {
      type: String,
      enum: ["INFO", "WATCH", "HIGH", "CRITICAL"],
      default: "WATCH",
    },
    reason: { type: String, default: "" },
    recommendedAction: {
      command: { type: String, default: "" },
      label: { type: String, default: "" },
      payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    deadline: { type: Date, default: null },
  },
  { _id: false }
);

const briefingSnapshotSchema = new mongoose.Schema(
  {
    briefingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["MORNING", "EOD", "ON_DEMAND"],
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    period: {
      start: { type: Date },
      end: { type: Date },
    },
    clients: {
      activeCount: { type: Number, default: 0 },
    },
    agencyHealth: {
      score: { type: Number, required: true, min: 0, max: 100 },
      level: {
        type: String,
        enum: ["EXCELLENT", "HEALTHY", "WATCH", "AT_RISK", "CRITICAL"],
        default: "HEALTHY",
      },
      deductions: [
        {
          category: String,
          amount: Number,
          reason: String,
        },
      ],
    },
    delivery: {
      activeTotal: { type: Number, default: 0 },
      dueToday: { type: Number, default: 0 },
      overdue: { type: Number, default: 0 },
      atRisk: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      completedToday: { type: Number, default: 0 },
      awaitingApproval: { type: Number, default: 0 },
    },
    finance: {
      totalRevenue: { type: Number, default: 0 },
      totalOutstanding: { type: Number, default: 0 },
      expectedToday: { type: Number, default: 0 },
      receivedToday: { type: Number, default: 0 },
      overdueAmount: { type: Number, default: 0 },
      dueThisWeek: { type: Number, default: 0 },
      criticalAccounts: { type: Number, default: 0 },
      promisesDue: { type: Number, default: 0 },
      brokenPromises: { type: Number, default: 0 },
    },
    sales: {
      newLeads: { type: Number, default: 0 },
      hotLeads: { type: Number, default: 0 },
      callbacksDue: { type: Number, default: 0 },
      proposalsPending: { type: Number, default: 0 },
      activeDeals: { type: Number, default: 0 },
      pipelineValue: { type: Number, default: 0 },
      conversionsToday: { type: Number, default: 0 },
    },
    content: {
      postsDue: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      awaitingApproval: { type: Number, default: 0 },
      scheduled: { type: Number, default: 0 },
      published: { type: Number, default: 0 },
      creativeGenerationPending: { type: Number, default: 0 },
    },
    team: {
      activeMembers: { type: Number, default: 0 },
      availableMembers: { type: Number, default: 0 },
      overloadedMembers: { type: Number, default: 0 },
      unassignedWork: { type: Number, default: 0 },
      averageCapacity: { type: Number, default: 0 },
    },
    automation: {
      runsToday: { type: Number, default: 0 },
      executed: { type: Number, default: 0 },
      awaitingApproval: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      reliability: { type: Number, default: 100 },
    },
    narrative: {
      headline: { type: String, default: "" },
      summary: { type: String, default: "" },
      focusPoints: [String],
    },
    priorities: [priorityItemSchema],
    accomplishments: [String],
    tomorrowRisks: [String],
    automationRunId: { type: String, default: "" },
  },
  { timestamps: true }
);

briefingSnapshotSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model("BriefingSnapshot", briefingSnapshotSchema);
