const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
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

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

attendanceSchema.pre("save", function () {
  if (this.date) this.date = normalizeDate(this.date);
});

attendanceSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  if (update.date) update.date = normalizeDate(update.date);
  if (update.$set?.date) update.$set.date = normalizeDate(update.$set.date);
});

module.exports = mongoose.model("Attendance", attendanceSchema);