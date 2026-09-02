const mongoose = require("mongoose");

if (mongoose.models && mongoose.models.Customer) {
  module.exports = mongoose.models.Customer;
  return;
}

const customerDocumentSchema = new mongoose.Schema(
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
      enum: [
        "created",
        "updated",
        "login",
        "proposal",
        "work",
        "payment",
        "note",
        "communication",
        "document",
        "system",
      ],
      default: "system",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communicationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Call", "Email", "WhatsApp", "Meeting", "Note"],
      default: "Note",
    },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    companyName: { type: String, default: "", trim: true },

    businessType: { type: String, required: true, trim: true },

    panNumber: { type: String, default: "", trim: true, uppercase: true },

    gstNumber: { type: String, default: "", trim: true, uppercase: true },

    contactNumbers: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one contact number is required",
      },
    },

    email: { type: String, default: "", trim: true, lowercase: true },

    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },

    contactPerson: { type: String, default: "" },
    pincode: { type: String, default: "" },
    website: { type: String, default: "" },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    branchId: { type: String, required: true },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    requirements: { type: [String], default: [] },

    package: { type: String, default: "" },

    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],

    supportingDocuments: {
      type: [customerDocumentSchema],
      default: [],
    },

    communications: {
      type: [communicationSchema],
      default: [],
    },

    totalPaid: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },

    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    activityLogs: {
      type: [activityLogSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    brandProfile: {
      brandName: { type: String, default: "" },
      tagline: { type: String, default: "" },
      description: { type: String, default: "" },
      brandGuidelines: { type: String, default: "" },
      brandColors: { type: [String], default: [] },
      secondaryColors: { type: [String], default: [] },
      additionalColors: { type: [String], default: [] },
      fonts: { type: [String], default: [] },
      toneOfVoice: { type: [String], default: [] },
      approvedWords: { type: [String], default: [] },
      restrictedWords: { type: [String], default: [] },
      contentLanguages: { type: [String], default: ["English"] },
      visualStyle: { type: String, default: "" },
      logoPreferences: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
      bannerUrl: { type: String, default: "" },
      referenceImages: { type: [String], default: [] },
    },

    businessProfile: {
      industry: { type: String, default: "" },
      businessSummary: { type: String, default: "" },
      products: { type: [String], default: [] },
      services: { type: [String], default: [] },
      usp: { type: [String], default: [] },
      targetAudience: { type: [String], default: [] },
      serviceAreas: { type: [String], default: [] },
      competitors: { type: [String], default: [] },
      businessGoals: { type: [String], default: [] },
      priorityServices: { type: [String], default: [] },
    },

    creativePreferences: {
      preferredStyles: { type: [String], default: [] },
      dislikedStyles: { type: [String], default: [] },
      contentRatio: { type: String, default: "" },
      defaultPosterSizes: { type: [String], default: ["1080x1080"] },
      preferredCTA: { type: [String], default: [] },
      preferredImageStyle: { type: String, default: "" },
      typographyPreference: { type: String, default: "" },
      restrictedCreativeDirections: { type: String, default: "" },
      referenceNotes: { type: String, default: "" },
    },

    marketingPreferences: {
      objectives: { type: [String], default: [] },
      monthlyAdBudget: { type: Number, default: 0 },
      primaryPlatforms: { type: [String], default: [] },
      postingFrequency: { type: String, default: "" },
      approvalRequired: { type: Boolean, default: true },
    },

    socialProfile: {
      primaryPlatforms: { type: [String], default: ["Instagram", "Facebook"] },
      postingFrequency: { type: String, default: "3 Posts / Week" },
      preferredContentTypes: { type: [String], default: ["Poster", "Reel"] },
      contentLanguages: { type: [String], default: ["English"] },
      toneOfVoice: { type: String, default: "Professional & Engaging" },
      ctaPreferences: { type: [String], default: ["Call Us", "Book Appointment"] },
      hashtagStrategy: { type: String, default: "" },
      approvedWords: { type: [String], default: [] },
      restrictedWords: { type: [String], default: [] },
      socialNotes: { type: String, default: "" },
    },

    adsProfile: {
      monthlyMetaBudget: { type: Number, default: 0 },
      monthlyGoogleBudget: { type: Number, default: 0 },
      primaryCampaignGoals: { type: [String], default: ["Lead Generation"] },
      targetLocations: { type: [String], default: [] },
      targetAudienceNotes: { type: String, default: "" },
      promotedServices: { type: [String], default: [] },
      promotedOffers: { type: [String], default: [] },
      leadObjective: { type: String, default: "" },
      campaignRestrictions: { type: String, default: "" },
      adsNotes: { type: String, default: "" },
    },

    seoProfile: {
      website: { type: String, default: "" },
      primaryDomain: { type: String, default: "" },
      targetCities: { type: [String], default: [] },
      targetAreas: { type: [String], default: [] },
      priorityServices: { type: [String], default: [] },
      targetKeywords: { type: [String], default: [] },
      competitors: { type: [String], default: [] },
      seoGoals: { type: [String], default: [] },
      priorityLandingPages: { type: [String], default: [] },
      seoNotes: { type: String, default: "" },
    },

    leadPreferences: {
      leadQualificationRules: { type: String, default: "" },
      priorityServices: { type: [String], default: [] },
      targetLeadTypes: { type: [String], default: [] },
      serviceLocations: { type: [String], default: [] },
      defaultSalesContact: { type: String, default: "" },
      followUpTone: { type: String, default: "Helpful & Professional" },
      followUpNotes: { type: String, default: "" },
      offerDetails: { type: String, default: "" },
    },

    reportingPreferences: {
      reportFrequency: { type: String, default: "Monthly" },
      primaryKPIs: { type: [String], default: ["Leads Generated", "Reach", "Engagement"] },
      secondaryKPIs: { type: [String], default: [] },
      clientReportingNotes: { type: String, default: "" },
      comparisonPreference: { type: String, default: "Month over Month" },
      summaryStyle: { type: String, default: "Executive Summary" },
    },

    socialIntegrations: {
      instagram: {
        accountId: { type: String, default: "" },
        username: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        connected: { type: Boolean, default: false },
        connectedAt: { type: Date, default: null },
      },
      facebook: {
        pageId: { type: String, default: "" },
        pageName: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        connected: { type: Boolean, default: false },
        connectedAt: { type: Date, default: null },
      },
      googleBusiness: {
        locationId: { type: String, default: "" },
        accountId: { type: String, default: "" },
        connected: { type: Boolean, default: false },
        connectedAt: { type: Date, default: null },
      },
      linkedin: {
        organizationId: { type: String, default: "" },
        accessToken: { type: String, default: "" },
        connected: { type: Boolean, default: false },
        connectedAt: { type: Date, default: null },
      },
    },
  },
  { timestamps: true }
);

customerSchema.index({ branchId: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ assignedManager: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ panNumber: 1 });
let CustomerModel;
try {
  CustomerModel = mongoose.model("Customer");
} catch (e) {
  CustomerModel = mongoose.model("Customer", customerSchema);
}
module.exports = CustomerModel;