const mongoose = require("mongoose");

const clientAIMemorySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    clientLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "Brand Rule",
        "Creative Preference",
        "Approved Tagline",
        "Rejected Style",
        "Audience Insight",
        "Campaign Learning",
        "Manager Instruction",
        "Content Preference",
        "Platform Rule",
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    sourceType: {
      type: String,
      enum: ["Manual", "Manager Approval", "Manager Rejection", "AI Extraction"],
      default: "Manual",
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
    },

    confidence: {
      type: Number,
      default: 1.0,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

clientAIMemorySchema.index({ customerId: 1, type: 1, status: 1 });

module.exports = mongoose.model("ClientAIMemory", clientAIMemorySchema);
