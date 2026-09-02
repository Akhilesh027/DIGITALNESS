const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    type: {
      type: String,
      enum: ["lead", "deal", "work", "task", "proposal", "customer", "system","approval","DailyUpdate"],
      required: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    moduleModel: {
      type: String,
      enum: ["Lead", "Deal", "Work", "Proposal", "Customer"],
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);