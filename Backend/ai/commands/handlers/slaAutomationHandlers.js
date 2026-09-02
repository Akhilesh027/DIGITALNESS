/**
 * slaAutomationHandlers.js
 * Deterministic command handlers for Phase 5D SLA & Deadline Guardian Engine.
 */

const slaGuardianEngine = require("../../automation/engines/SLAGuardianEngine");
const SLAIncident = require("../../../models/SLAIncident");
const Work = require("../../../models/Work");

exports.scanSLA = async (params = {}, ctx = {}) => {
  const result = await slaGuardianEngine.scan({
    userId: ctx.userId,
    runId: ctx.runId,
  });
  return result;
};

exports.getIncidents = async (params = {}, ctx = {}) => {
  const limit = params.limit ? Number(params.limit) : 20;
  const incidents = await slaGuardianEngine.getActiveIncidents(limit);
  return {
    count: incidents.length,
    incidents,
  };
};

exports.getAtRiskTasks = async (params = {}, ctx = {}) => {
  const tasks = await Work.find({
    status: { $nin: ["Completed", "Failed"] },
    "sla.riskScore": { $gte: 50 },
  })
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name role")
    .sort({ "sla.riskScore": -1 })
    .lean();

  return {
    count: tasks.length,
    tasks,
  };
};

exports.getCriticalTasks = async (params = {}, ctx = {}) => {
  const tasks = await Work.find({
    status: { $nin: ["Completed", "Failed"] },
    "sla.riskScore": { $gte: 85 },
  })
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name role")
    .sort({ "sla.riskScore": -1 })
    .lean();

  return {
    count: tasks.length,
    tasks,
  };
};

exports.explainRisk = async (params = {}, ctx = {}) => {
  const workId = params.workId || params.taskId;
  if (!workId) throw new Error("workId is required.");

  const incident = await SLAIncident.findOne({ workId })
    .populate("workId", "title workType priority dueDate status")
    .populate("clientId", "name companyName")
    .populate("assignedTo", "name role")
    .lean();

  if (!incident) {
    const work = await Work.findById(workId);
    return {
      workId,
      riskScore: work?.sla?.riskScore || 0,
      riskLevel: work?.sla?.riskLevel || "HEALTHY",
      message: "Task is currently healthy with no active SLA incident.",
    };
  }

  return incident;
};

exports.rebalanceWorkload = async (params = {}, ctx = {}) => {
  const result = await slaGuardianEngine.rebalanceWorkload({
    incidentIds: params.incidentIds || [],
    userId: ctx.userId,
  });
  return result;
};

exports.reassignTask = async (params = {}, ctx = {}) => {
  const { workId, targetEmployeeId } = params;
  if (!workId || !targetEmployeeId) throw new Error("workId and targetEmployeeId are required.");

  await Work.findByIdAndUpdate(workId, {
    assignedTo: [targetEmployeeId],
  });

  // Re-scan to recalculate risk
  await slaGuardianEngine.scan({ userId: ctx.userId });

  return { success: true, message: `Task reassigned successfully.` };
};

exports.extendDeadline = async (params = {}, ctx = {}) => {
  const { workId, hours = 24 } = params;
  if (!workId) throw new Error("workId is required.");

  const work = await Work.findById(workId);
  if (!work) throw new Error("Work not found.");

  const currentDue = work.dueDate ? new Date(work.dueDate) : new Date();
  currentDue.setHours(currentDue.getHours() + Number(hours));

  work.dueDate = currentDue;
  await work.save();

  await slaGuardianEngine.scan({ userId: ctx.userId });

  return { success: true, message: `Deadline extended by ${hours} hours.` };
};

exports.acknowledgeIncident = async (params = {}, ctx = {}) => {
  const incidentId = params.incidentId || params.id;
  if (!incidentId) throw new Error("incidentId is required.");

  const result = await slaGuardianEngine.acknowledgeIncident(incidentId);
  return { success: true, incident: result };
};
