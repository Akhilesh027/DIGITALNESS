/**
 * inboxRoutes.js
 * Comprehensive REST endpoints for Unified Communications Inbox,
 * team assignment, SLA monitoring, internal notes, and AI assist.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const InboxItem = require("../models/InboxItem");
const LeadConversation = require("../models/LeadConversation");
const GoogleBusinessReview = require("../models/GoogleBusinessReview");
const Lead = require("../models/Lead");
const Team = require("../models/Team");
const User = require("../models/User");
const inboxService = require("../ai/inbox/InboxService");
const timelineService = require("../ai/inbox/TimelineService");
const inboxSLAService = require("../ai/inbox/InboxSLAService");

// All routes require authentication
router.use(protect);

/**
 * GET /api/inbox
 * Returns paginated, filtered list of unified inbox items
 */
router.get("/", async (req, res) => {
  try {
    const {
      customerId,
      locationId,
      channel,
      status,
      priority,
      slaStatus,
      assignedTo,
      assignedTeam,
      unread,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Tenant & Branch Isolation
    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;

    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (slaStatus) query.slaStatus = slaStatus;

    if (assignedTo === "unassigned") {
      query.assignedTo = null;
    } else if (assignedTo === "me") {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (assignedTeam) query.assignedTeam = assignedTeam;
    if (unread !== undefined) query.unread = unread === "true";

    // Text search on title, snippet, participantName, participantPhone
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { snippet: searchRegex },
        { participantName: searchRegex },
        { participantPhone: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, totalCount] = await Promise.all([
      InboxItem.find(query)
        .populate("customerId", "name companyName brandName logoUrl")
        .populate("locationId", "name city")
        .populate("assignedTo", "name email role")
        .populate("assignedTeam", "name")
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      InboxItem.countDocuments(query),
    ]);

    // Compute live SLA status for each item
    const enhancedItems = items.map((it) => {
      const slaEval = inboxSLAService.evaluateStatus(it);
      return { ...it, liveSlaStatus: slaEval.slaStatus, remainingMinutes: slaEval.remainingMinutes };
    });

    return res.json({
      success: true,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      items: enhancedItems,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/inbox/metrics
 * Returns quick status counts (SLA Breached, At Risk, WhatsApp, Reviews, Unassigned, Hot Leads)
 */
router.get("/metrics", async (req, res) => {
  try {
    const { customerId, locationId } = req.query;
    const baseQuery = {};
    if (customerId) baseQuery.customerId = customerId;
    if (locationId) baseQuery.locationId = locationId;

    const [
      totalOpen,
      unreadCount,
      unassignedCount,
      slaBreachedCount,
      atRiskCount,
      whatsAppCount,
      reviewsCount,
      hotLeadsCount,
    ] = await Promise.all([
      InboxItem.countDocuments({ ...baseQuery, status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, unread: true }),
      InboxItem.countDocuments({ ...baseQuery, assignedTo: null, status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, slaStatus: "BREACHED", status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, slaStatus: "AT_RISK", status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, channel: "WHATSAPP", status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, channel: "GOOGLE_BUSINESS", status: { $nin: ["RESOLVED", "CLOSED"] } }),
      InboxItem.countDocuments({ ...baseQuery, priority: "HIGH", status: { $nin: ["RESOLVED", "CLOSED"] } }),
    ]);

    return res.json({
      success: true,
      metrics: {
        totalOpen,
        unreadCount,
        unassignedCount,
        slaBreachedCount,
        atRiskCount,
        whatsAppCount,
        reviewsCount,
        hotLeadsCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/inbox/:id
 * Retrieves full details for an inbox item including source document, timeline, and AI assist
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InboxItem.findById(id)
      .populate("customerId", "name companyName brandName logoUrl")
      .populate("locationId", "name city")
      .populate("assignedTo", "name email role")
      .populate("assignedTeam", "name");

    if (!item) {
      return res.status(404).json({ success: false, message: "Inbox item not found." });
    }

    // Mark as read automatically when viewed
    if (item.unread) {
      item.unread = false;
      item.unreadCount = 0;
      await item.save();
    }

    // 1. Resolve source details
    let sourceDetails = null;
    if (item.sourceType === "WHATSAPP_CONVERSATION") {
      sourceDetails = await LeadConversation.findById(item.sourceId).populate("leadId");
    } else if (item.sourceType === "GBP_REVIEW") {
      sourceDetails = await GoogleBusinessReview.findById(item.sourceId);
    } else if (item.sourceType === "LEAD") {
      sourceDetails = await Lead.findById(item.sourceId);
    }

    // 2. Aggregate unified timeline
    const timeline = await timelineService.getTimelineForItem(item);

    // 3. Generate AI Assist Context
    const aiAssist = await inboxService.generateAIDraft({ inboxItemId: item._id });

    return res.json({
      success: true,
      item,
      sourceDetails,
      timeline,
      aiAssist,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/assign
 * Assigns an inbox item to a user or team
 */
router.post("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedTeam } = req.body;
    const item = await inboxService.assignItem({
      inboxItemId: id,
      assignedTo,
      assignedTeam,
      actorId: req.user._id,
    });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/unassign
 * Unassigns an inbox item
 */
router.post("/:id/unassign", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InboxItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });

    item.assignedTo = null;
    item.assignmentSource = "AUTO";
    await item.save();

    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/status
 * Updates operational status (e.g. RESOLVED, IN_PROGRESS, WAITING_CUSTOMER)
 */
router.post("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const item = await inboxService.changeStatus({
      inboxItemId: id,
      status,
      actorId: req.user._id,
    });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/priority
 * Updates priority (LOW, NORMAL, HIGH, URGENT)
 */
router.post("/:id/priority", async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const item = await InboxItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });

    item.priority = priority;
    await item.save();

    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/snooze
 * Snoozes an inbox item
 */
router.post("/:id/snooze", async (req, res) => {
  try {
    const { id } = req.params;
    const { snoozedUntil } = req.body;
    const item = await inboxService.snoozeItem({
      inboxItemId: id,
      snoozedUntil,
      actorId: req.user._id,
    });
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/note
 * Adds an internal collaboration note
 */
router.post("/:id/note", async (req, res) => {
  try {
    const { id } = req.params;
    const { body, mentions = [], attachments = [] } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Note body cannot be empty." });
    }

    const note = await inboxService.addInternalNote({
      inboxItemId: id,
      authorId: req.user._id,
      body,
      mentions,
      attachments,
    });

    return res.status(201).json({ success: true, note });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/takeover
 * Human takeover of conversation
 */
router.post("/:id/takeover", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inboxService.takeOverConversation({
      inboxItemId: id,
      actorId: req.user._id,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/resume-automation
 * Resumes automated bots and nurture sequences
 */
router.post("/:id/resume-automation", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inboxService.resumeConversationAutomation({
      inboxItemId: id,
      actorId: req.user._id,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/inbox/:id/ai-draft
 * Generates an AI assist reply suggestion
 */
router.post("/:id/ai-draft", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inboxService.generateAIDraft({ inboxItemId: id });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
