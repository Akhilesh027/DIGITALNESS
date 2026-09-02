const mongoose = require("mongoose");

const contentOperationsPolicySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },
    requiredPostsPerWeek: {
      type: Number,
      default: 3,
    },
    requiredReelsPerMonth: {
      type: Number,
      default: 4,
    },
    requiredGBPPostsPerWeek: {
      type: Number,
      default: 2,
    },
    approvalLeadTimeHours: {
      type: Number,
      default: 24,
    },
    creativeLeadTimeHours: {
      type: Number,
      default: 48,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

let ContentOperationsPolicyModel;
try {
  ContentOperationsPolicyModel = mongoose.model("ContentOperationsPolicy");
} catch (e) {
  ContentOperationsPolicyModel = mongoose.model("ContentOperationsPolicy", contentOperationsPolicySchema);
}

module.exports = ContentOperationsPolicyModel;
