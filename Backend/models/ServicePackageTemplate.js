const mongoose = require("mongoose");

const deliverableSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "SOCIAL_CREATIVE",
        "REEL",
        "GBP_POST",
        "MONTHLY_REPORT",
        "BLOG_POST",
        "SEO_AUDIT",
        "AD_CREATIVE",
        "AD_COPY",
        "CAMPAIGN_SETUP",
        "WEEKLY_OPTIMIZATION",
        "CUSTOM",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    cadence: {
      type: String,
      enum: ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "ONE_TIME"],
      default: "MONTHLY",
    },
    preferredRole: {
      type: String,
      default: "Graphic Designer",
    },
    slaHours: {
      type: Number,
      default: 48,
    },
    schedulingStrategy: {
      type: String,
      enum: [
        "DISTRIBUTE_MONTH",
        "WEEKLY",
        "MONTH_START",
        "MONTH_END",
        "FIXED_DATE",
        "CUSTOM",
      ],
      default: "DISTRIBUTE_MONTH",
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const servicePackageTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    industryTags: {
      type: [String],
      default: ["GENERAL"],
    },
    deliverables: [deliverableSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ServicePackageTemplate",
  servicePackageTemplateSchema
);
