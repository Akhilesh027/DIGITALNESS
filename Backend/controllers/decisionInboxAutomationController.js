/**
 * decisionInboxAutomationController.js
 * Express controllers for Phase 5G Unified Decision Inbox API.
 */

const decisionInboxService = require("../ai/automation/services/decisionInboxService");

exports.getDecisionInbox = async (req, res) => {
  try {
    const decisions = await decisionInboxService.getPendingDecisions();
    return res.status(200).json({
      success: true,
      count: decisions.length,
      safeCount: decisions.filter((d) => d.riskLevel === "SAFE").length,
      data: decisions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveDecision = async (req, res) => {
  try {
    const { decisionType, payload } = req.body;
    const result = await decisionInboxService.approveDecision({
      decisionId: req.params.id,
      decisionType,
      payload,
      userId: req.user?._id,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectDecision = async (req, res) => {
  try {
    const { decisionType, reason, payload } = req.body;
    const result = await decisionInboxService.rejectDecision({
      decisionId: req.params.id,
      decisionType,
      reason,
      payload,
      userId: req.user?._id,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.batchApproveSafe = async (req, res) => {
  try {
    const result = await decisionInboxService.batchApproveSafe({
      userId: req.user?._id,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
