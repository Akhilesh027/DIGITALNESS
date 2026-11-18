const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['Legacy', 'Manual'], default: 'Legacy' },
    dayKey: { type: String, default: undefined },
    isOpen: { type: Boolean, default: false },
    revision: { type: Number, default: 0 },
    breaks: [{ startedAt: { type: Date, required: true }, endedAt: { type: Date, default: null } }],
    correctedBreakMinutes: { type: Number, default: null },
    legacySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    events: [{ action: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now }, requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceCorrection' }, reason: String, before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed }],
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    loginTime: {
      type: Date,
      default: null,
    },

    logoutTime: {
      type: Date,
      default: null,
    },

    totalHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day"],
      default: "Present",
    },

    branchId: {
      type: String,
      default: "",
      index: true,
    },

    loginIp: {
      type: String,
      default: "",
    },

    logoutIp: {
      type: String,
      default: "",
    },

    deviceInfo: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employee: 1, dayKey: 1 }, { unique: true, partialFilterExpression: { mode: 'Manual' } });
attendanceSchema.index({ employee: 1, isOpen: 1 }, { unique: true, partialFilterExpression: { mode: 'Manual', isOpen: true } });

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

attendanceSchema.pre("save", function () {
  if (this.date && this.mode !== 'Manual') this.date = normalizeDate(this.date);
});

attendanceSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;
  if (update.mode === 'Manual' || update.$set?.mode === 'Manual') return;

  if (update.date) update.date = normalizeDate(update.date);
  if (update.$set?.date) update.$set.date = normalizeDate(update.$set.date);
});

module.exports = mongoose.model("Attendance", attendanceSchema);
