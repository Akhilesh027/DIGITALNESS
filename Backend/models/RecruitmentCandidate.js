const mongoose = require("mongoose");

const recruitmentCandidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruitmentJob",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    currentCompany: {
      type: String,
      default: "",
      trim: true,
    },

    expectedSalary: {
      type: String,
      default: "",
      trim: true,
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    portfolioUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Interview Scheduled",
        "Selected",
        "Rejected",
      ],
      default: "Applied",
    },

    interviewDate: {
      type: Date,
      default: null,
    },

    hrNotes: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "CRM",
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

recruitmentCandidateSchema.index({ jobId: 1 });
recruitmentCandidateSchema.index({ status: 1 });
recruitmentCandidateSchema.index({ email: 1 });
recruitmentCandidateSchema.index({ phone: 1 });
recruitmentCandidateSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "RecruitmentCandidate",
  recruitmentCandidateSchema
);