/**
 * reportingRoutes.js
 * REST endpoints for Agency Executive Dashboard, Client Scorecards,
 * normalized metrics, grounded narratives, and immutable ReportSnapshots.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Customer = require("../models/Customer");
const ReportSnapshot = require("../models/ReportSnapshot");
const reportingAggregationService = require("../ai/reporting/ReportingAggregationService");

router.use(protect);

/**
 * GET /api/reporting/agency
 * Agency-wide Executive Dashboard summary
 */
router.get("/agency", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const overview = await reportingAggregationService.getAgencyOverview(start, end);
    return res.json({ success: true, ...overview });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/reporting/clients
 * Brief health and scorecard summary across all clients
 */
router.get("/clients", async (req, res) => {
  try {
    const customers = await Customer.find({ status: { $ne: "Archived" } })
      .select("name brandName companyName industry")
      .lean();

    const clientSummaries = await Promise.all(
      customers.map(async (c) => {
        try {
          const overview = await reportingAggregationService.getClientOverview(c._id);
          return {
            customerId: c._id,
            name: c.name,
            brandName: c.brandName,
            healthScore: overview.healthScore,
            deliveryRate: overview.contentDelivery.deliveryRate,
            metaSpend: overview.metaAds.spend,
            totalLeads: overview.leadPipeline.total,
          };
        } catch {
          return {
            customerId: c._id,
            name: c.name,
            healthScore: { score: 100, status: "ON_TRACK" },
            deliveryRate: 100,
            metaSpend: null,
            totalLeads: 0,
          };
        }
      })
    );

    return res.json({ success: true, clients: clientSummaries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/reporting/client/:customerId
 * Comprehensive scorecard for a specific client
 */
router.get("/client/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { locationId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const scorecard = await reportingAggregationService.getClientOverview(customerId, locationId, start, end);
    return res.json({ success: true, scorecard });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reporting/client/:customerId/generate
 * Generates and stores an immutable ReportSnapshot
 */
router.post("/client/:customerId/generate", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { locationId, periodType, periodStart, periodEnd } = req.body;

    const snapshot = await reportingAggregationService.generateReportSnapshot({
      customerId,
      locationId,
      periodType: periodType || "THIS_MONTH",
      periodStart: periodStart || new Date(Date.now() - 30 * 86400 * 1000),
      periodEnd: periodEnd || new Date(),
      user: req.user,
    });

    return res.status(201).json({ success: true, snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/reporting/snapshots/:id
 * Retrieves immutable historical ReportSnapshot
 */
router.get("/snapshots/:id", async (req, res) => {
  try {
    const snapshot = await ReportSnapshot.findById(req.params.id)
      .populate("customerId", "name brandName companyName")
      .populate("generatedBy", "name email");

    if (!snapshot) return res.status(404).json({ success: false, message: "Report snapshot not found." });

    return res.json({ success: true, snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reporting/snapshots/:id/finalize
 * Locks report snapshot into FINALIZED immutable state
 */
router.post("/snapshots/:id/finalize", async (req, res) => {
  try {
    const snapshot = await ReportSnapshot.findById(req.params.id);
    if (!snapshot) return res.status(404).json({ success: false, message: "Report snapshot not found." });

    snapshot.status = "FINALIZED";
    await snapshot.save();

    return res.json({ success: true, snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
