const mongoose = require("mongoose");

const recruitmentJobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    jobType: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Contract"],
      default: "Full Time",
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    openings: {
      type: Number,
      default: 1,
    },

    salaryRange: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    requirements: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Open", "Closed", "On Hold"],
      default: "Open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

recruitmentJobSchema.index({ status: 1 });
recruitmentJobSchema.index({ department: 1 });
recruitmentJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model("RecruitmentJob", recruitmentJobSchema);