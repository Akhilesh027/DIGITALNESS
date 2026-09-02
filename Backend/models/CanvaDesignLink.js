const mongoose = require("mongoose");

const canvaDesignLinkSchema = new mongoose.Schema(
  {
    canvaDesignLinkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    creativeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeAsset",
      required: true,
      index: true,
    },
    canvaDesignId: {
      type: String,
      required: true,
      index: true,
    },
    canvaDesignUrl: {
      type: String,
      default: "",
    },
    canvaTitle: {
      type: String,
      default: "",
    },
    sourceCreativeVersion: {
      type: Number,
      default: 1,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "UNLINKED"],
      default: "ACTIVE",
      index: true,
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

canvaDesignLinkSchema.index({ customerId: 1, canvaDesignId: 1 });
canvaDesignLinkSchema.index({ creativeAssetId: 1, status: 1 });

let CanvaDesignLinkModel;
try {
  CanvaDesignLinkModel = mongoose.model("CanvaDesignLink");
} catch (e) {
  CanvaDesignLinkModel = mongoose.model("CanvaDesignLink", canvaDesignLinkSchema);
}

module.exports = CanvaDesignLinkModel;
