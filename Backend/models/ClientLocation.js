const mongoose = require("mongoose");

const clientLocationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumbers: {
      type: [String],
      default: [],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    openingHours: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    cta: {
      type: String,
      default: "",
    },

    socialHandles: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      gbpUrl: { type: String, default: "" },
    },

    gbpIdentity: {
      placeId: { type: String, default: "" },
      businessName: { type: String, default: "" },
      category: { type: String, default: "" },
    },

    services: {
      type: [String],
      default: [],
    },

    activeOffers: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        validUntil: { type: Date, default: null },
      },
    ],

    brandOverrides: {
      logoUrl: { type: String, default: "" },
      phoneOverride: { type: String, default: "" },
      addressOverride: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    creativeOverrides: {
      preferredColors: { type: [String], default: [] },
      preferredStyles: { type: [String], default: [] },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

clientLocationSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model("ClientLocation", clientLocationSchema);
