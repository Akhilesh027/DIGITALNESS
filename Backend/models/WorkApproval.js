const mongoose = require("mongoose");

const workApprovalSchema = new mongoose.Schema(
  {
    work: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
    },

    approvalType: {
      type: String,
      enum: ["Work", "Creative", "Content", "AdCampaign"],
      default: "Work",
    },

    adCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      default: null,
    },

    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
    },

    contentItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      default: null,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reviewMessage: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Approved",
        "Rejected",
        "Revision Requested",
      ],
      default: "Pending Approval",
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    revisionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

workApprovalSchema.index({ work: 1 });
workApprovalSchema.index({ customer: 1 });
workApprovalSchema.index({ submittedBy: 1 });
workApprovalSchema.index({ status: 1 });
workApprovalSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WorkApproval", workApprovalSchema);