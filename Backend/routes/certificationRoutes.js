/**
 * certificationRoutes.js
 * REST endpoints for Production Pilot Certification, Go-Live status,
 * domain kill switches, and incident tracking.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ProductionIncident = require("../models/ProductionIncident");
const productionCertificationService = require("../ai/certification/ProductionCertificationService");
const productionPilotConfig = require("../config/productionPilot");

router.use(protect);

/**
 * GET /api/system/certification
 * Returns current certification gates and live status
 */
router.get("/", async (req, res) => {
  try {
    const status = await productionCertificationService.getCertificationStatus();
    return res.json({ success: true, ...status });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/system/certification/gate
 * Records result and evidence for a certification gate
 */
router.post("/gate", async (req, res) => {
  try {
    const { gateId, domain, status, evidenceRefs, failureReason } = req.body;
    const cert = await productionCertificationService.recordGateResult({
      gateId,
      domain,
      status,
      evidenceRefs,
      failureReason,
    });
    return res.json({ success: true, cert });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/system/certification/sign-off
 * Final sign-off by Admin / Owner
 */
router.post("/sign-off", async (req, res) => {
  try {
    const cert = await productionCertificationService.certifyPilot(req.user._id);
    return res.json({ success: true, cert });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/system/certification/kill-switch
 * Toggles emergency write locks
 */
router.post("/kill-switch", async (req, res) => {
  try {
    const { domain, enabled } = req.body;
    if (domain === "GLOBAL") {
      productionPilotConfig.externalWritesEnabled = Boolean(enabled);
    } else if (productionPilotConfig.domainWrites[domain] !== undefined) {
      productionPilotConfig.domainWrites[domain] = Boolean(enabled);
    }

    return res.json({
      success: true,
      externalWritesEnabled: productionPilotConfig.externalWritesEnabled,
      domainWrites: productionPilotConfig.domainWrites,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/system/certification/incidents
 * Lists active and resolved incidents
 */
router.get("/incidents", async (req, res) => {
  try {
    const incidents = await ProductionIncident.find().sort({ detectedAt: -1 }).limit(50).lean();
    return res.json({ success: true, incidents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/system/certification/incidents
 * Logs a new production incident
 */
router.post("/incidents", async (req, res) => {
  try {
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;
    const incident = await ProductionIncident.create({
      incidentId,
      ...req.body,
    });
    return res.status(201).json({ success: true, incident });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
