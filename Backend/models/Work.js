const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    fileType: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByName: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const workUpdateSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      default: "",
    },
    files: [
      {
        type: String,
        default: "",
      },
    ],
    timeSpent: {
      type: Number,
      default: 0,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    byName: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const workSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    workType: {
      type: String,
      required: true,
      trim: true,
    },

    parentWorkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      default: null,
    },

    clientName: {
      type: String,
      trim: true,
      default: "",
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Not Started",
        "In Progress",
        "Review",
        "Completed",
        "Revision",
        "Failed",
      ],
      default: "Pending",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    deliverables: {
      type: Number,
      default: 1,
    },

    completedDeliverables: {
      type: Number,
      default: 0,
    },

    slaDays: {
      type: Number,
      default: 2,
    },

    estimatedHours: {
      type: Number,
      default: 0,
    },

    updates: [workUpdateSchema],

    comments: [commentSchema],

    attachments: [attachmentSchema],

    timeline: [timelineSchema],

    progressNote: {
      type: String,
      trim: true,
      default: "",
    },

    timeSpent: {
      type: Number,
      default: 0,
    },

    managerReviewNote: {
      type: String,
      trim: true,
      default: "",
    },

    approvalRequired: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    generatedByAgent: {
      type: Boolean,
      default: false,
    },

    agentId: {
      type: String,
      default: "",
    },

    agentRunId: {
      type: String,
      default: "",
    },

    aiPrompt: {
      type: String,
      default: "",
    },

    aiOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    aiMetadata: {
      model: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      version: { type: Number, default: 1 },
    },

    pipelineSource: {
      automationRunId: { type: String, default: null, index: true },
      packageId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackageTemplate", default: null },
      packageCode: { type: String, default: "" },
      period: { type: String, default: "" },
      generatedByAutomation: { type: Boolean, default: false },
    },

    contentCalendarSource: {
      calendarId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentCalendar", default: null, index: true },
      calendarItemId: { type: String, default: null },
      opportunityType: { type: String, default: "" },
      opportunityId: { type: String, default: "" },
    },

    sla: {
      riskScore: { type: Number, default: 0, index: true },
      riskLevel: { type: String, enum: ["HEALTHY", "WATCH", "AT_RISK", "HIGH", "CRITICAL"], default: "HEALTHY", index: true },
      lastEvaluatedAt: { type: Date, default: null },
      activeIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: "SLAIncident", default: null },
      breachAt: { type: Date, default: null },
      responsibility: { type: String, enum: ["INTERNAL", "CLIENT", "MANAGER", "EXTERNAL"], default: "INTERNAL" },
    },

    blockedBy: {
      isBlocked: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ["CLIENT_INPUT", "MANAGER_APPROVAL", "OTHER_TASK", "ASSET", "EXTERNAL", ""],
        default: "",
      },
      referenceId: { type: String, default: "" },
      since: { type: Date, default: null },
      note: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

workSchema.index({ customer: 1 });
workSchema.index({ assignedTo: 1 });
workSchema.index({ parentWorkId: 1 });
workSchema.index({ status: 1 });
workSchema.index({ priority: 1 });
workSchema.index({ dueDate: 1 });
workSchema.index({ createdBy: 1 });
workSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Work", workSchema);