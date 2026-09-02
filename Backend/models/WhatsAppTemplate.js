const mongoose = require("mongoose");

const whatsAppTemplateSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
      index: true,
    },
    wabaId: {
      type: String,
      required: true,
      index: true,
    },
    metaTemplateId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      default: "en_US",
    },
    category: {
      type: String,
      enum: ["UTILITY", "MARKETING", "AUTHENTICATION"],
      required: true,
    },
    status: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECTED", "PAUSED", "DISABLED"],
      default: "PENDING",
      index: true,
    },
    components: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    parameterSchema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    qualityState: {
      type: String,
      default: "GREEN",
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

whatsAppTemplateSchema.index({ wabaId: 1, name: 1, language: 1 }, { unique: true });

let WhatsAppTemplateModel;
try {
  WhatsAppTemplateModel = mongoose.model("WhatsAppTemplate");
} catch (e) {
  WhatsAppTemplateModel = mongoose.model("WhatsAppTemplate", whatsAppTemplateSchema);
}

module.exports = WhatsAppTemplateModel;
