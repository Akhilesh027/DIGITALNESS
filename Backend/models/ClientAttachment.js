const mongoose = require("mongoose");

const clientAttachmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Logo",
        "Images",
        "Documents",
        "Brand Assets",
        "References",
        "Project Requirement",
        "Other",
      ],
      default: "Other",
    },

    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,

    status: {
      type: String,
      enum: ["Submitted", "Reviewed", "Approved", "Rejected"],
      default: "Submitted",
    },

    notes: {
      type: String,
      default: "",
    },

    clientLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    usageStatus: {
      type: String,
      enum: ["Active", "Archived", "Draft"],
      default: "Active",
    },

    approvedForAI: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClientAttachment", clientAttachmentSchema);