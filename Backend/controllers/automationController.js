/**
 * automationController.js
 * Express controllers for Phase 5 Autonomous Agency OS and Automation Center.
 */

const policyService = require("../ai/automation/AutomationPolicyService");
const auditService = require("../ai/automation/AutomationAuditService");
const scheduler = require("../ai/automation/AutomationScheduler");

exports.getAutomationPolicies = async (req, res) => {
  try {
    const policies = await policyService.getAllPolicies();
    return res.status(200).json({ success: true, data: policies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAutomationPolicy = async (req, res) => {
  try {
    const { key } = req.params;
    const { enabled, mode, rolesAllowed, conditions, maxActionsPerRun } = req.body;
    const userId = req.user?._id || req.user?.id;

    const updated = await policyService.updatePolicy(
      key,
      { enabled, mode, rolesAllowed, conditions, maxActionsPerRun },
      userId
    );

    return res.status(200).json({
      success: true,
      message: `Policy '${key}' updated successfully.`,
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAutomationRuns = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const engine = req.query.engine || null;
    const runs = await auditService.getRecentRuns(limit, engine);

    return res.status(200).json({ success: true, count: runs.length, data: runs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAutomationSummary = async (req, res) => {
  try {
    const summary = await auditService.getTodayActivitySummary();
    return res.status(200).json({ success: true, data: summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.triggerAutomationJob = async (req, res) => {
  try {
    const { jobType, metadata } = req.body;
    if (!jobType) return res.status(400).json({ success: false, message: "jobType is required." });

    const result = await scheduler.runJob(jobType, metadata);
    return res.status(200).json({
      success: true,
      message: `Job '${jobType}' triggered successfully.`,
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
