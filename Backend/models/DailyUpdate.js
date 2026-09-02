const mongoose = require("mongoose");

const WORK_STATUS = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Completed",
  "Revision",
  "Failed",
  "Blocked",
  "On Hold",
];

const APPROVAL_STATUS = ["Pending", "Approved", "Changes Requested"];

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dailyUpdateSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    work: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    projectName: { type: String, trim: true, default: "" },
    clientName: { type: String, trim: true, default: "" },
    workCategory: { type: String, trim: true, default: "" },

    taskTitle: { type: String, required: true, trim: true },

    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },

    totalHours: { type: Number, default: 0, min: 0, max: 24 },

    currentStatus: {
      type: String,
      enum: WORK_STATUS,
      default: "In Progress",
      index: true,
    },

    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },

    workCompleted: { type: String, required: true, trim: true },
    pendingWork: { type: String, trim: true, default: "" },
    blockers: { type: String, trim: true, default: "" },
    tomorrowPlan: { type: String, trim: true, default: "" },
    referencesLinks: { type: String, trim: true, default: "" },

    attachments: { type: [attachmentSchema], default: [] },

    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS,
      default: "Pending",
      index: true,
    },

    managerComment: { type: String, trim: true, default: "" },
    revisionReason: { type: String, trim: true, default: "" },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },

    branchId: { type: String, default: "", index: true },

    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dailyUpdateSchema.index(
  { employee: 1, work: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { work: { $type: "objectId" } },
  }
);

dailyUpdateSchema.index({ employee: 1, date: -1 });
dailyUpdateSchema.index({ customer: 1, date: -1 });
dailyUpdateSchema.index({ approvalStatus: 1, date: -1 });
dailyUpdateSchema.index({ currentStatus: 1, date: -1 });
dailyUpdateSchema.index({ branchId: 1, date: -1 });

const normalizeDate = (date) => {
  if (!date) return date;
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

dailyUpdateSchema.pre("save", function () {
  if (this.date) this.date = normalizeDate(this.date);
});

dailyUpdateSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  if (update.date) update.date = normalizeDate(update.date);
  if (update.$set?.date) update.$set.date = normalizeDate(update.$set.date);
});

module.exports = mongoose.model("DailyUpdate", dailyUpdateSchema);