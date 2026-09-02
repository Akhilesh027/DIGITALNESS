/**
 * calendarRoutes.js
 * REST endpoints for Marketing & Campaign Operations Workspace,
 * multi-client scheduling, daily operations lanes, readiness evaluation, and gap detection.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const MarketingCalendarItem = require("../models/MarketingCalendarItem");
const MarketingCampaignGroup = require("../models/MarketingCampaignGroup");
const marketingCalendarService = require("../ai/calendar/MarketingCalendarService");
const calendarReadinessEngine = require("../ai/calendar/CalendarReadinessEngine");
const contentGapDetector = require("../ai/calendar/ContentGapDetector");

router.use(protect);

/**
 * GET /api/calendar
 * Paginated/filtered calendar items
 */
router.get("/", async (req, res) => {
  try {
    const { customerId, locationId, channel, status, startDate, endDate, page = 1, limit = 100 } = req.query;
    const query = {};

    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;
    if (channel) query.channel = channel;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.scheduledStartAt = {};
      if (startDate) query.scheduledStartAt.$gte = new Date(startDate);
      if (endDate) query.scheduledStartAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, totalCount] = await Promise.all([
      MarketingCalendarItem.find(query)
        .populate("customerId", "name brandName companyName logoUrl")
        .populate("locationId", "name city")
        .populate("ownerId", "name email role")
        .populate("creativeAssetId")
        .populate("approvalId")
        .sort({ scheduledStartAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MarketingCalendarItem.countDocuments(query),
    ]);

    return res.json({ success: true, totalCount, page: parseInt(page), limit: parseInt(limit), items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/calendar/day
 * Returns 7-lane Daily Operations Workspace (Overdue, Needs Creative, Needs Approval, Ready, Scheduled, Published, Failed)
 */
router.get("/day", async (req, res) => {
  try {
    const { date, customerId, locationId } = req.query;
    const operations = await marketingCalendarService.getDailyOperations(
      date ? new Date(date) : new Date(),
      customerId,
      locationId
    );
    return res.json({ success: true, ...operations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/calendar/campaigns
 * Retrieves campaign groups with progress bars
 */
router.get("/campaigns", async (req, res) => {
  try {
    const { customerId } = req.query;
    const filter = {};
    if (customerId) filter.customerId = customerId;

    const groups = await MarketingCampaignGroup.find(filter)
      .populate("customerId", "name brandName")
      .populate("ownerId", "name email")
      .sort({ startAt: -1 })
      .lean();

    const enriched = await Promise.all(
      groups.map((g) => marketingCalendarService.getCampaignGroupProgress(g._id).catch(() => ({ group: g, progressPercent: 0 })))
    );

    return res.json({ success: true, campaigns: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/calendar/gaps
 * Detects content gaps against client commitments
 */
router.get("/gaps", async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const report = await contentGapDetector.detectGapsForCustomer(customerId);
    return res.json({ success: true, ...report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/calendar/:id
 * Item detail with full approval and creative lineage
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await MarketingCalendarItem.findById(req.params.id)
      .populate("customerId", "name brandName companyName logoUrl")
      .populate("locationId", "name city")
      .populate("ownerId", "name email role")
      .populate("creativeAssetId")
      .populate("approvalId")
      .populate("campaignGroupId");

    if (!item) return res.status(404).json({ success: false, message: "Calendar item not found." });

    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/calendar
 * Creates new marketing calendar item
 */
router.post("/", async (req, res) => {
  try {
    const item = await marketingCalendarService.createCalendarItem({
      ...req.body,
      ownerId: req.user._id,
    });
    return res.status(201).json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/calendar/:id/reschedule
 * Reschedules item and invalidates approval if material change detected
 */
router.post("/:id/reschedule", async (req, res) => {
  try {
    const { newStartAt, timezone } = req.body;
    const item = await marketingCalendarService.rescheduleItem({
      calendarItemId: req.params.id,
      newStartAt,
      timezone,
      actorId: req.user._id,
    });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/calendar/:id/attach-creative
 * Attaches creative and pins version
 */
router.post("/:id/attach-creative", async (req, res) => {
  try {
    const { creativeAssetId, pinnedVersion } = req.body;
    const item = await marketingCalendarService.attachCreative({
      calendarItemId: req.params.id,
      creativeAssetId,
      pinnedVersion,
      actorId: req.user._id,
    });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/calendar/:id/recalculate-readiness
 * Re-evaluates readiness and blockers
 */
router.post("/:id/recalculate-readiness", async (req, res) => {
  try {
    const item = await MarketingCalendarItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });

    const evalResult = await calendarReadinessEngine.evaluateItemReadiness(item);
    item.readinessState = evalResult.readinessState;
    item.readinessScorePercent = evalResult.readinessScorePercent;
    item.blockers = evalResult.blockers;
    await item.save();

    return res.json({ success: true, item, evalResult });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
