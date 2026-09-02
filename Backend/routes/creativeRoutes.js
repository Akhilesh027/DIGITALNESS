/**
 * creativeRoutes.js
 * Express Routes for Creative Generation, Versioning, and Revisions
 */

const express = require("express");
const router = express.Router();
const creativePipelineService = require("../ai/creative/CreativePipelineService");
const CreativeAsset = require("../models/CreativeAsset");
const { protect } = require("../middleware/authMiddleware");

/**
 * POST /api/creatives/synthesize-prompt
 * Synthesizes master-tier visual prompt and copy package from CRM customer context
 */
router.post("/synthesize-prompt", protect, async (req, res) => {
  try {
    const { customerId, occasion, customPrompt, topic } = req.body;
    const Customer = require("../models/Customer");
    const { synthesizePosterBrief } = require("../ai/agents/creativePosterEngine");

    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId).lean();
    }

    const promptText = `${occasion || topic || "Commercial Brand Poster"} ${customPrompt || ""}`.trim();
    const allColors = [
      ...(customer?.brandProfile?.brandColors || []),
      ...(customer?.brandProfile?.secondaryColors || []),
      ...(customer?.brandProfile?.additionalColors || []),
    ].filter(Boolean);

    const briefContext = {
      customerId: customer?._id,
      customerName: customer?.companyName || customer?.name,
      tagline: customer?.brandProfile?.tagline,
      brandDescription: customer?.brandProfile?.description,
      industry: customer?.businessProfile?.industry || customer?.businessType || customer?.industry,
      services: (customer?.businessProfile?.services || customer?.requirements || []).join(", "),
      products: (customer?.businessProfile?.products || []).join(", "),
      usp: (customer?.businessProfile?.usp || []).join(", "),
      targetAudience: (customer?.businessProfile?.targetAudience || []).join(", "),
      toneOfVoice: (customer?.brandProfile?.toneOfVoice || []).join(", "),
      visualStyle: customer?.brandProfile?.visualStyle,
      brandColors: allColors.length > 0 ? allColors.join(" + ") : "#0B0F19 + #06B6D4",
      website: customer?.website,
      phone: (customer?.contactNumbers && customer?.contactNumbers.join(", ")) || customer?.phone,
      email: customer?.email,
      address: customer?.address,
      city: customer?.city || "Hyderabad",
      state: customer?.state,
      notes: customer?.notes,
      activityNotes: (customer?.activityLogs || []).slice(-3).map((l) => l.message || l.title).join("; "),
      customPrompt,
      occasion,
    };

    const brief = await synthesizePosterBrief(promptText, briefContext);
    return res.status(200).json({ success: true, data: brief });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/creatives/generate
 * Triggers poster generation for a client and occasion
 */
router.post("/generate", protect, async (req, res) => {
  try {
    const { customerId, locationId, occasion, customPrompt } = req.body;
    const result = await creativePipelineService.generateCreative({
      customerId,
      locationId,
      occasion,
      customPrompt,
      requestedBy: req.user?._id,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/creatives/revision
 * Requests a revision (renderer-only or generative)
 */
router.post("/revision", protect, async (req, res) => {
  try {
    const { creativeAssetId, changes, feedback } = req.body;
    const result = await creativePipelineService.requestRevision({
      creativeAssetId,
      changes,
      feedback,
      actorId: req.user?._id,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/creatives/:id
 * Fetches creative asset by assetId
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const asset = await CreativeAsset.findOne({
      $or: [{ assetId: req.params.id }, { _id: req.params.id }],
    })
      .populate("customerId", "name companyName brandName logo")
      .populate("locationId", "name address city phone")
      .lean();

    if (!asset) {
      return res.status(404).json({ success: false, message: "CreativeAsset not found" });
    }
    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/creatives/customer/:customerId/versions
 * Lists version history for a customer's creatives
 */
router.get("/customer/:customerId/versions", protect, async (req, res) => {
  try {
    const assets = await CreativeAsset.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: assets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
