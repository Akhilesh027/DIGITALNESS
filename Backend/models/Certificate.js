const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    certificateType: {
      type: String,
      enum: [
        "Internship",
        "Experience",
        "Achievement",
        "Course",
        "CompanyAccreditation",
        "Other",
      ],
      default: "Internship",
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    startDate: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image"],
      default: "pdf",
    },
    status: {
      type: String,
      enum: ["Active", "Revoked", "Expired"],
      default: "Active",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

let CertificateModel;
try {
  CertificateModel = mongoose.model("Certificate");
} catch (e) {
  CertificateModel = mongoose.model("Certificate", certificateSchema);
}

module.exports = CertificateModel;

