/**
 * creativeEditRoutes.js
 * REST endpoints for Canva creative design editing, natural-language feedback,
 * Before/After visual previews, and draft transaction commits.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const CreativeAsset = require("../models/CreativeAsset");
const CanvaDesignLink = require("../models/CanvaDesignLink");
const CreativeEditRequest = require("../models/CreativeEditRequest");
const canvaEditWorkflowService = require("../ai/creative/canva/CanvaEditWorkflowService");

router.use(protect);

/**
 * POST /api/creatives/:id/edit-request
 * Submits natural-language manager feedback and starts Canva draft editing flow
 */
router.post("/:id/edit-request", async (req, res) => {
  try {
    const { id } = req.params;
    const { rawFeedback } = req.body;

    if (!rawFeedback || !rawFeedback.trim()) {
      return res.status(400).json({ success: false, message: "rawFeedback cannot be empty." });
    }

    const editRequest = await canvaEditWorkflowService.createEditRequest({
      creativeAssetId: id,
      rawFeedback,
      requestedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      editRequest,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/creatives/edit-requests/:editRequestId
 * Retrieves status, Before/After preview, and operations list for an edit request
 */
router.get("/edit-requests/:editRequestId", async (req, res) => {
  try {
    const { editRequestId } = req.params;
    const editRequest = await CreativeEditRequest.findById(editRequestId)
      .populate("creativeAssetId")
      .populate("requestedBy", "name email role");

    if (!editRequest) {
      return res.status(404).json({ success: false, message: "Edit request not found." });
    }

    return res.json({
      success: true,
      editRequest,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/creatives/edit-requests/:editRequestId/approve-commit
 * Approves and commits Canva draft transaction into new version V2/V3
 */
router.post("/edit-requests/:editRequestId/approve-commit", async (req, res) => {
  try {
    const { editRequestId } = req.params;
    const result = await canvaEditWorkflowService.commitApprovedEdit(editRequestId, req.user._id);
    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/creatives/edit-requests/:editRequestId/cancel
 * Cancels Canva draft transaction and discards changes
 */
router.post("/edit-requests/:editRequestId/cancel", async (req, res) => {
  try {
    const { editRequestId } = req.params;
    const result = await canvaEditWorkflowService.cancelEdit(editRequestId, req.user._id);
    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/creatives/:id/link-canva
 * Links an existing Canva design to a CreativeAsset
 */
router.post("/:id/link-canva", async (req, res) => {
  try {
    const { id } = req.params;
    const { canvaDesignId, canvaDesignUrl, canvaTitle } = req.body;

    const asset = await CreativeAsset.findById(id);
    if (!asset) return res.status(404).json({ success: false, message: "CreativeAsset not found." });

    const linkId = `CDL-${Date.now().toString(36).toUpperCase()}`;
    const link = await CanvaDesignLink.create({
      canvaDesignLinkId: linkId,
      customerId: asset.customerId,
      locationId: asset.locationId,
      creativeAssetId: asset._id,
      canvaDesignId: canvaDesignId || `DES-${Date.now()}`,
      canvaDesignUrl: canvaDesignUrl || "",
      canvaTitle: canvaTitle || asset.title,
      sourceCreativeVersion: asset.version,
      linkedBy: req.user._id,
    });

    asset.canvaDesignId = link.canvaDesignId;
    await asset.save();

    return res.status(201).json({ success: true, link });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
