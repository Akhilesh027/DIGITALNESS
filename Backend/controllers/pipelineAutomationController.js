/**
 * pipelineAutomationController.js
 * Express controllers for Phase 5B Zero-Touch Client Pipeline & Workload API.
 */

const pipelineHandlers = require("../ai/commands/handlers/pipelineAutomationHandlers");

exports.getServicePackages = async (req, res) => {
  try {
    const result = await pipelineHandlers.listPackages();
    return res.status(200).json({ success: true, count: result.count, data: result.packages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeamWorkload = async (req, res) => {
  try {
    const department = req.query.department || null;
    const result = await pipelineHandlers.getTeamCapacity({ department });
    return res.status(200).json({ success: true, count: result.count, data: result.team });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.previewPipeline = async (req, res) => {
  try {
    const { customerId, packageId, month, year } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const result = await pipelineHandlers.previewPipeline({ customerId, packageId, month, year });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.generatePipeline = async (req, res) => {
  try {
    const { customerId, packageId, month, year, deliverables } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await pipelineHandlers.generatePipeline({ customerId, packageId, month, year, deliverables }, ctx);
    return res.status(200).json({ success: true, message: result.summary, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.regeneratePipeline = async (req, res) => {
  try {
    const { customerId, packageId, month, year } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await pipelineHandlers.regeneratePipeline({ customerId, packageId, month, year }, ctx);
    return res.status(200).json({ success: true, message: "Pipeline regenerated successfully.", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.convertAndOnboardLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { packageId, month, year } = req.body;

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await pipelineHandlers.convertAndOnboardLead({ leadId, packageId, month, year }, ctx);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
