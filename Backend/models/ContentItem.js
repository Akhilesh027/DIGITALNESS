const mongoose = require("mongoose");

const contentItemSchema = new mongoose.Schema(
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
      index: true,
    },

    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      default: null,
    },

    creativeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeProject",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    campaignName: {
      type: String,
      default: "",
      trim: true,
    },

    contentType: {
      type: String,
      enum: [
        "Post",
        "Poster",
        "Carousel",
        "Reel",
        "Story",
        "Video",
        "GMB Post",
        "Blog",
        "Ad Creative",
        "Announcement",
        "Offer",
        "Festival",
        "Other",
      ],
      required: true,
    },

    platforms: [
      {
        type: String,
        enum: [
          "Facebook",
          "Instagram",
          "LinkedIn",
          "YouTube",
          "Google Business",
          "Website",
          "Other",
        ],
      },
    ],

    caption: {
      type: String,
      default: "",
    },

    mediaUrl: {
      type: String,
      default: "",
    },

    hashtags: {
      type: [String],
      default: [],
    },

    creativeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreativeProject",
      },
    ],

    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    status: {
      type: String,
      enum: [
        "Idea",
        "Draft",
        "Content Ready",
        "Creative Pending",
        "Approval Pending",
        "Revision",
        "Approved",
        "Scheduled",
        "Publishing",
        "Published",
        "Failed",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    approvalStatus: {
      type: String,
      enum: [
        "Not Submitted",
        "Pending Approval",
        "Approved",
        "Rejected",
        "Revision Requested",
      ],
      default: "Not Submitted",
      index: true,
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

    publishStatus: {
      type: String,
      enum: [
        "Not Scheduled",
        "Scheduled",
        "Queued",
        "Pending Queue",
        "Ready For Publishing",
        "Publishing",
        "Published",
        "Failed",
        "Cancelled",
      ],
      default: "Not Scheduled",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    generatedByAgent: {
      type: Boolean,
      default: false,
    },

    agentRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentRun",
      default: null,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

contentItemSchema.index({ customerId: 1, scheduledFor: 1 });
contentItemSchema.index({ status: 1, approvalStatus: 1 });

module.exports = mongoose.model("ContentItem", contentItemSchema);
