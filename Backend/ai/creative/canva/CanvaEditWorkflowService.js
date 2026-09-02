/**
 * CanvaEditWorkflowService.js
 * Master orchestrator for Canva creative edit requests, draft transactions,
 * preview generation, approval integration, version lineage, and Cloudinary exports.
 */

const CreativeAsset = require("../../../models/CreativeAsset");
const CanvaDesignLink = require("../../../models/CanvaDesignLink");
const CreativeEditRequest = require("../../../models/CreativeEditRequest");
const CreativeEditPreview = require("../../../models/CreativeEditPreview");
const ApprovalRequest = require("../../../models/ApprovalRequest");
const canvaConnector = require("../../integrations/connectors/CanvaConnector");
const creativeEditInterpreter = require("../CreativeEditInterpreter");
const creativeQAGuardian = require("../CreativeQAGuardian");
const assetStorageService = require("../../../services/storage/AssetStorageService");

class CanvaEditWorkflowService {
  /**
   * Initializes a creative edit request from manager natural-language feedback
   */
  async createEditRequest({ creativeAssetId, rawFeedback, requestedBy = null }) {
    const asset = await CreativeAsset.findById(creativeAssetId);
    if (!asset) throw new Error(`Creative asset '${creativeAssetId}' not found.`);

    // 1. Resolve Canva design link
    let designLink = await CanvaDesignLink.findOne({ creativeAssetId: asset._id, status: "ACTIVE" });
    const canvaDesignId = designLink?.canvaDesignId || asset.canvaDesignId || `DES-CANVA-${asset.assetId}`;

    // 2. Interpret natural language feedback
    const interpretation = await creativeEditInterpreter.interpret({
      rawFeedback,
      designId: canvaDesignId,
      customerId: asset.customerId,
    });

    const editRequestId = `CER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const editRequest = await CreativeEditRequest.create({
      editRequestId,
      customerId: asset.customerId,
      locationId: asset.locationId,
      creativeAssetId: asset._id,
      canvaDesignId,
      sourceVersion: asset.version,
      requestedBy,
      rawManagerFeedback: rawFeedback,
      interpretedOperations: interpretation.interpretedOperations,
      unsupportedOperations: interpretation.unsupportedOperations,
      executionMode: interpretation.executionMode,
      operationHash: interpretation.operationHash,
      status: interpretation.unsupportedOperations.length > 0 && interpretation.interpretedOperations.length === 0 ? "UNSUPPORTED_CHANGES" : "VALIDATED",
    });

    // 3. If supported operations exist, execute draft transaction and generate preview
    if (interpretation.interpretedOperations.length > 0) {
      await this.executeDraftTransaction(editRequest._id);
    }

    return editRequest;
  }

  /**
   * Executes draft transaction and generates visual preview
   */
  async executeDraftTransaction(editRequestId) {
    const editRequest = await CreativeEditRequest.findById(editRequestId);
    if (!editRequest) throw new Error("Edit request not found.");

    const asset = await CreativeAsset.findById(editRequest.creativeAssetId);

    // 1. Start Canva draft transaction
    const transaction = await canvaConnector.startEditTransaction(editRequest.canvaDesignId);
    editRequest.canvaTransactionReference = transaction.transactionId;
    editRequest.status = "EDITING";
    await editRequest.save();

    // 2. Perform draft operations
    await canvaConnector.performOperations(transaction.transactionId, editRequest.interpretedOperations);

    // 3. Generate Before/After Preview
    const previewData = await canvaConnector.getPreview(transaction.transactionId, asset.assetUrl);

    editRequest.previewReference = {
      beforePreviewUrl: previewData.beforePreviewUrl,
      afterPreviewUrl: previewData.afterPreviewUrl,
      changedPages: previewData.changedPages,
    };
    editRequest.status = "PREVIEW_READY";
    await editRequest.save();

    // 4. Save preview model
    await CreativeEditPreview.create({
      editRequestId: editRequest._id,
      designId: editRequest.canvaDesignId,
      changedPages: previewData.changedPages,
      operationSummary: editRequest.interpretedOperations.map((op) => `${op.intent}: ${op.targetRole}`),
      previewImages: [
        {
          pageNumber: 1,
          beforeUrl: previewData.beforePreviewUrl,
          afterUrl: previewData.afterPreviewUrl,
        },
      ],
    });

    // 5. Create R1 Approval Request
    const approvalId = `APR-CANVA-${Date.now().toString(36).toUpperCase()}`;
    const approvalDoc = await ApprovalRequest.create({
      approvalId,
      title: `Canva Design Revision V${asset.version + 1} (${asset.title})`,
      description: `Manager Feedback: "${editRequest.rawManagerFeedback}"`,
      domain: "CREATIVE",
      actionType: "CANVA_COMMIT_EDIT",
      riskLevel: "R1",
      status: "WAITING_APPROVAL",
      customer: asset.customerId,
      metadata: {
        editRequestId: editRequest._id,
        canvaDesignId: editRequest.canvaDesignId,
        sourceAssetId: asset._id,
        sourceVersion: asset.version,
        previewReference: editRequest.previewReference,
        supportedOperations: editRequest.interpretedOperations,
        unsupportedOperations: editRequest.unsupportedOperations,
      },
    });

    editRequest.approvalId = approvalDoc._id;
    await editRequest.save();

    return editRequest;
  }

  /**
   * Commits approved Canva edit and produces CreativeAsset V2 (preserving V1)
   */
  async commitApprovedEdit(editRequestId, actorId = null) {
    const editRequest = await CreativeEditRequest.findById(editRequestId);
    if (!editRequest) throw new Error("Edit request not found.");

    const sourceAsset = await CreativeAsset.findById(editRequest.creativeAssetId);
    if (!sourceAsset) throw new Error("Source creative asset not found.");

    // 1. Commit Canva Transaction
    if (editRequest.canvaTransactionReference) {
      await canvaConnector.commitTransaction(editRequest.canvaTransactionReference);
    }

    // 2. Export 1080x1080 JPEG
    const exportResult = await canvaConnector.exportDesign(editRequest.canvaDesignId, "JPEG", { width: 1080, height: 1080 });

    // 3. QA Validation
    const qaReport = await creativeQAGuardian.evaluateAsset({
      assetUrl: exportResult.exportedUrl,
      width: 1080,
      height: 1080,
      format: "JPG",
    });

    // 4. Create new Version (V2 / V3) preserving V1
    const newVersion = sourceAsset.version + 1;
    const newAssetId = `AST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newAsset = await CreativeAsset.create({
      assetId: newAssetId,
      customerId: sourceAsset.customerId,
      locationId: sourceAsset.locationId,
      creativeProjectId: sourceAsset.creativeProjectId,
      title: `${sourceAsset.title} (Rev V${newVersion})`,
      occasion: sourceAsset.occasion,
      type: sourceAsset.type,
      format: "JPG",
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      version: newVersion,
      status: "READY",
      storageProvider: "Cloudinary",
      storageKey: `canva_export_${editRequest.canvaDesignId}`,
      assetUrl: exportResult.exportedUrl,
      previewUrl: editRequest.previewReference.afterPreviewUrl,
      sourceProvider: "Canva Design Studio",
      revisionType: "MANUAL",
      revisionSource: "CANVA_EDIT",
      canvaDesignId: editRequest.canvaDesignId,
      parentAssetId: sourceAsset.assetId,
      qaReport,
      publishReady: Boolean(qaReport.passed),
      requestedBy: actorId || editRequest.requestedBy,
    });

    editRequest.status = "COMMITTED";
    editRequest.resultingCreativeAssetId = newAsset._id;
    await editRequest.save();

    if (editRequest.approvalId) {
      await ApprovalRequest.findByIdAndUpdate(editRequest.approvalId, {
        $set: { status: "APPROVED", executedAt: new Date() },
      });
    }

    return {
      success: true,
      newAsset,
      version: newVersion,
      publishReady: newAsset.publishReady,
    };
  }

  /**
   * Cancels Canva edit request and discards draft
   */
  async cancelEdit(editRequestId, actorId = null) {
    const editRequest = await CreativeEditRequest.findById(editRequestId);
    if (!editRequest) throw new Error("Edit request not found.");

    if (editRequest.canvaTransactionReference) {
      await canvaConnector.cancelTransaction(editRequest.canvaTransactionReference);
    }

    editRequest.status = "CANCELLED";
    await editRequest.save();

    if (editRequest.approvalId) {
      await ApprovalRequest.findByIdAndUpdate(editRequest.approvalId, {
        $set: { status: "REJECTED", cancelledAt: new Date() },
      });
    }

    return { success: true, editRequest };
  }
}

module.exports = new CanvaEditWorkflowService();
