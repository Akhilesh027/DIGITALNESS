/**
 * slaAutomationController.js
 * Express controllers for Phase 5D SLA & Deadline Guardian API.
 */

const slaHandlers = require("../ai/commands/handlers/slaAutomationHandlers");
const slaGuardianEngine = require("../ai/automation/engines/SLAGuardianEngine");

exports.getSLASummary = async (req, res) => {
  try {
    const scanRes = await slaGuardianEngine.scan({ userId: req.user?._id });
    return res.status(200).json({ success: true, data: scanRes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSLAIncidents = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await slaHandlers.getIncidents({ limit });
    return res.status(200).json({ success: true, count: result.count, data: result.incidents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCriticalTasks = async (req, res) => {
  try {
    const result = await slaHandlers.getCriticalTasks();
    return res.status(200).json({ success: true, count: result.count, data: result.tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWorkRiskDetails = async (req, res) => {
  try {
    const { workId } = req.params;
    const result = await slaHandlers.explainRisk({ workId });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.triggerSLAScan = async (req, res) => {
  try {
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await slaHandlers.scanSLA({}, ctx);
    return res.status(200).json({ success: true, message: result.summary, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.rebalanceWorkload = async (req, res) => {
  try {
    const { incidentIds } = req.body;
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await slaHandlers.rebalanceWorkload({ incidentIds }, ctx);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.acknowledgeIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await slaHandlers.acknowledgeIncident({ incidentId: id });
    return res.status(200).json({ success: true, message: "Incident acknowledged.", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.recoverIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, payload } = req.body;
    const userId = req.user?._id || req.user?.id;

    const result = await slaGuardianEngine.applyRecovery({ incidentId: id, action, payload, userId });
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
