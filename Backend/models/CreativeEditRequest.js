const mongoose = require("mongoose");

const creativeEditRequestSchema = new mongoose.Schema(
  {
    editRequestId: {
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
    sourceVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rawManagerFeedback: {
      type: String,
      required: true,
    },
    interpretedOperations: [
      {
        intent: { type: String, required: true },
        targetRole: { type: String, required: true },
        elementId: { type: String, default: null },
        parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
        managerProvidedValue: { type: String, default: null },
      },
    ],
    unsupportedOperations: [
      {
        intent: { type: String, required: true },
        requestedText: { type: String, default: "" },
        reasonCode: { type: String, required: true },
        explanation: { type: String, required: true },
        suggestedManualAction: { type: String, default: "" },
      },
    ],
    executionMode: {
      type: String,
      enum: ["CANVA_TRANSACTION", "NATIVE_RENDERER", "MANUAL_REQUIRED"],
      default: "CANVA_TRANSACTION",
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "INTERPRETING",
        "VALIDATED",
        "UNSUPPORTED_CHANGES",
        "EDITING",
        "PREVIEW_READY",
        "WAITING_APPROVAL",
        "CHANGES_REQUESTED",
        "COMMITTING",
        "COMMITTED",
        "FAILED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    canvaTransactionReference: {
      type: String,
      default: null,
    },
    previewReference: {
      beforePreviewUrl: { type: String, default: "" },
      afterPreviewUrl: { type: String, default: "" },
      changedPages: { type: [Number], default: [1] },
    },
    operationHash: {
      type: String,
      required: true,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
      index: true,
    },
    resultingCreativeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreativeAsset",
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

creativeEditRequestSchema.index({ customerId: 1, creativeAssetId: 1, sourceVersion: 1 });

let CreativeEditRequestModel;
try {
  CreativeEditRequestModel = mongoose.model("CreativeEditRequest");
} catch (e) {
  CreativeEditRequestModel = mongoose.model("CreativeEditRequest", creativeEditRequestSchema);
}

module.exports = CreativeEditRequestModel;
