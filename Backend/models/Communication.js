const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    // For customer communications
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },
    // For employee communications
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    channel: {
      type: String,
      enum: ["WhatsApp", "Email", "Call", "Meeting", "SMS"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["Inbound", "Outbound"],
      default: "Outbound",
    },
    subject: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    byName: {
      type: String,
      default: "System",
    },
  },
  { timestamps: true }
);

// Ensure at least one ID is provided


module.exports = mongoose.model("Communication", communicationSchema);