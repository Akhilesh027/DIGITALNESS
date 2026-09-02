const mongoose = require("mongoose");

const creativeEditPreviewSchema = new mongoose.Schema(
  {
    editRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeEditRequest",
      required: true,
      index: true,
    },
    designId: {
      type: String,
      required: true,
    },
    changedPages: {
      type: [Number],
      default: [1],
    },
    operationSummary: {
      type: [String],
      default: [],
    },
    previewImages: [
      {
        pageNumber: { type: Number, default: 1 },
        beforeUrl: { type: String, default: "" },
        afterUrl: { type: String, default: "" },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 3600 * 1000), // 24 hours expiry
    },
  },
  { timestamps: true }
);

let CreativeEditPreviewModel;
try {
  CreativeEditPreviewModel = mongoose.model("CreativeEditPreview");
} catch (e) {
  CreativeEditPreviewModel = mongoose.model("CreativeEditPreview", creativeEditPreviewSchema);
}

module.exports = CreativeEditPreviewModel;
