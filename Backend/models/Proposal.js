const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["created", "updated", "sent", "viewed", "approved", "rejected", "revision", "version", "document", "system"],
      default: "system",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema(
  {
    proposalNumber: { type: String, unique: true, sparse: true },

    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", default: null },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    parentProposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal", default: null },
    version: { type: Number, default: 1 },
    isLatestVersion: { type: Boolean, default: true },

    customerName: { type: String, required: true, trim: true },
    companyName: { type: String, default: "" },
    clientName: { type: String, default: "" },

    contactNumber: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    clientEmail: { type: String, default: "", lowercase: true, trim: true },

    businessType: { type: String, default: "" },
    branchId: { type: String, default: "" },

    title: { type: String, required: true, trim: true },
    packageName: { type: String, default: "" },

    services: { type: [serviceSchema], default: [] },

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    proposalValue: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    scopeOfWork: { type: String, default: "" },
    deliverables: { type: String, default: "" },
    timeline: { type: String, default: "" },
    paymentTerms: { type: String, default: "" },
    termsAndConditions: { type: String, default: "" },
    cancellationPolicy: { type: String, default: "" },
    supportPeriod: { type: String, default: "" },

    customerSignatureUrl: { type: String, default: "" },
    authorizedSignatureUrl: { type: String, default: "" },
    companyStampUrl: { type: String, default: "" },

    attachments: { type: [attachmentSchema], default: [] },

    status: {
      type: String,
      enum: ["Draft", "Sent", "Viewed", "Approved", "Rejected", "Revision Requested", "Expired", "Accepted"],
      default: "Draft",
    },

    mailSubject: { type: String, default: "" },
    mailMessage: { type: String, default: "" },
    mailSent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    viewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    customerCreated: { type: Boolean, default: false },

    activityLogs: { type: [activityLogSchema], default: [] },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    notes: { type: String, default: "" },
    requirements: { type: String, default: "" },
  },
  { timestamps: true }
);

proposalSchema.index({ branchId: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ assignedTo: 1 });
proposalSchema.index({ parentProposalId: 1 });
proposalSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Proposal", proposalSchema);