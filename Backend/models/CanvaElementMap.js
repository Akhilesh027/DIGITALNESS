const mongoose = require("mongoose");

const canvaElementMapSchema = new mongoose.Schema(
  {
    designId: {
      type: String,
      required: true,
      index: true,
    },
    pageId: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    isResponsive: {
      type: Boolean,
      default: false,
    },
    elementId: {
      type: String,
      required: true,
      index: true,
    },
    semanticRole: {
      type: String,
      enum: [
        "LOGO",
        "HEADLINE",
        "SUBHEADLINE",
        "BODY",
        "PHONE",
        "WEBSITE",
        "ADDRESS",
        "CTA",
        "HERO_IMAGE",
        "PRODUCT_IMAGE",
        "BACKGROUND",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },
    elementType: {
      type: String,
      enum: ["TEXT", "IMAGE", "SHAPE", "GROUP", "VIDEO", "EMBED"],
      default: "TEXT",
    },
    lastKnownText: {
      type: String,
      default: "",
    },
    assetReference: {
      type: String,
      default: "",
    },
    transform: {
      left: { type: Number, default: 0 },
      top: { type: Number, default: 0 },
      width: { type: Number, default: 100 },
      height: { type: Number, default: 100 },
    },
    sourceCreativeVersion: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

canvaElementMapSchema.index({ designId: 1, elementId: 1 }, { unique: true });
canvaElementMapSchema.index({ designId: 1, semanticRole: 1 });

let CanvaElementMapModel;
try {
  CanvaElementMapModel = mongoose.model("CanvaElementMap");
} catch (e) {
  CanvaElementMapModel = mongoose.model("CanvaElementMap", canvaElementMapSchema);
}

module.exports = CanvaElementMapModel;
