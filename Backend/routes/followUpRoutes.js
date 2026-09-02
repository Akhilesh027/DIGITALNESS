/**
 * followUpRoutes.js
 * API routes for WhatsApp Lead Follow-Up Policies, Execution Sequences,
 * Manager Controls, and Follow-Up Analytics.
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const LeadFollowUpPolicy = require("../models/LeadFollowUpPolicy");
const LeadFollowUpSequence = require("../models/LeadFollowUpSequence");
const followUpAnalyticsService = require("../ai/leads/FollowUpAnalyticsService");
const followUpSchedulerService = require("../ai/leads/FollowUpSchedulerService");
const ApprovalEngine = require("../ai/approval/ApprovalEngine");

// All routes require authentication
router.use(protect);

/**
 * GET /api/whatsapp/followup/policies
 * Lists follow-up policies for customer / location
 */
router.get("/policies", async (req, res) => {
  try {
    const { customerId, locationId } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;

    const policies = await LeadFollowUpPolicy.find(query)
      .populate("approvedBy", "name email")
      .sort({ updatedAt: -1 });

    return res.json({ success: true, policies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/followup/policies
 * Creates a new follow-up policy and submits for R2 manager approval
 */
router.post("/policies", async (req, res) => {
  try {
    const {
      customerId,
      locationId = null,
      name,
      leadSource = "ALL",
      serviceType = "GENERAL",
      eligibilityRules = {},
      steps = [],
      stopConditions = {},
      quietHours = {},
      maxAttempts = 3,
    } = req.body;

    if (!customerId || !name) {
      return res.status(400).json({ success: false, message: "customerId and name are required." });
    }

    const policyId = `POL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const policy = new LeadFollowUpPolicy({
      policyId,
      customerId,
      locationId,
      name,
      leadSource,
      serviceType,
      enabled: false, // Disabled until R2 approved
      version: 1,
      status: "DRAFT",
      eligibilityRules,
      steps,
      stopConditions,
      quietHours,
      maxAttempts: Math.min(3, maxAttempts),
    });

    await policy.save();

    // Create R2 Approval Request for Manager Review
    const approvalReq = await ApprovalEngine.createApprovalRequest({
      title: `Enable WhatsApp Follow-Up Policy: ${name} (V1)`,
      domain: "WHATSAPP",
      actionType: "WHATSAPP_FOLLOWUP_POLICY_ENABLE",
      riskLevel: "R2",
      customer: customerId,
      clientLocation: locationId,
      submittedByType: "USER",
      submittedBy: req.user._id,
      blueprintPayload: {
        policyId: policy._id,
        name,
        stepsCount: steps.length,
        steps,
        quietHours,
        stopConditions,
      },
      executionIntent: {
        service: "LeadFollowUpPolicy",
        action: "policy.enable",
        payload: { policyId: policy._id },
      },
    });

    policy.approvalId = approvalReq._id;
    await policy.save();

    return res.status(201).json({
      success: true,
      policy,
      approvalId: approvalReq.approvalId,
      message: "Follow-up policy created and submitted for R2 Approval.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/whatsapp/followup/policies/:id/approve
 * Approves and enables a follow-up policy (Manager / Admin)
 */
router.put("/policies/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await LeadFollowUpPolicy.findById(id);

    if (!policy) {
      return res.status(404).json({ success: false, message: "Policy not found." });
    }

    policy.status = "APPROVED";
    policy.enabled = true;
    policy.approvedBy = req.user._id;
    policy.approvedAt = new Date();
    await policy.save();

    return res.json({
      success: true,
      policy,
      message: `Policy '${policy.name}' V${policy.version} is now APPROVED and active.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/whatsapp/followup/sequences
 * Lists active and past follow-up execution sequences
 */
router.get("/sequences", async (req, res) => {
  try {
    const { customerId, locationId, status } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;
    if (status) query.status = status;

    const sequences = await LeadFollowUpSequence.find(query)
      .populate("leadId", "name contactNumber status")
      .populate("policyId", "name version")
      .sort({ updatedAt: -1 })
      .limit(100);

    return res.json({ success: true, count: sequences.length, sequences });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/followup/sequences/:id/stop
 * Manually stops an active sequence
 */
router.post("/sequences/:id/stop", async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = await LeadFollowUpSequence.findOne({
      $or: [{ _id: id }, { sequenceId: id }],
    });

    if (!sequence) {
      return res.status(404).json({ success: false, message: "Sequence not found." });
    }

    sequence.status = "STOPPED";
    sequence.stoppedAt = new Date();
    sequence.stopReason = "MANUAL_STOP";
    sequence.nextScheduledAt = null;

    sequence.steps.forEach((st) => {
      if (["PENDING", "SCHEDULED"].includes(st.status)) {
        st.status = "SKIPPED";
        st.skipReason = "SKIPPED_MANUAL_STOP";
      }
    });

    await sequence.save();
    return res.json({ success: true, sequence });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/followup/sequences/:id/pause
 * Manually pauses an active sequence
 */
router.post("/sequences/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = await LeadFollowUpSequence.findOne({
      $or: [{ _id: id }, { sequenceId: id }],
    });

    if (!sequence) {
      return res.status(404).json({ success: false, message: "Sequence not found." });
    }

    sequence.status = "PAUSED_HUMAN_HANDOFF";
    sequence.nextScheduledAt = null;
    await sequence.save();

    return res.json({ success: true, sequence });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/followup/sequences/:id/resume
 * Manually resumes a paused sequence
 */
router.post("/sequences/:id/resume", async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = await LeadFollowUpSequence.findOne({
      $or: [{ _id: id }, { sequenceId: id }],
    });

    if (!sequence) {
      return res.status(404).json({ success: false, message: "Sequence not found." });
    }

    sequence.status = "ACTIVE";
    const policy = await LeadFollowUpPolicy.findById(sequence.policyId);
    if (policy) {
      await followUpSchedulerService.scheduleStep({
        sequence,
        stepNumber: sequence.currentStep,
        policy,
      });
    }
    await sequence.save();

    return res.json({ success: true, sequence });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/whatsapp/followup/analytics
 * Returns aggregated follow-up metrics
 */
router.get("/analytics", async (req, res) => {
  try {
    const { customerId, locationId, policyId, startDate, endDate } = req.query;
    const metrics = await followUpAnalyticsService.getMetrics({
      customerId,
      locationId,
      policyId,
      startDate,
      endDate,
    });
    return res.json({ success: true, metrics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
