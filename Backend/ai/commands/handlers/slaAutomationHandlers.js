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

exports.getSLASummary = async (params = {}, ctx = {}) => {
  const [totalActive, overdueTasks, criticalIncidents, highIncidents] = await Promise.all([
    Work.countDocuments({ status: { $nin: ["Completed", "Failed"] } }),
    Work.countDocuments({ status: { $nin: ["Completed", "Failed"] }, dueDate: { $lt: new Date() } }),
    SLAIncident.countDocuments({ status: { $in: ["DETECTED", "ESCALATED"] }, severity: "CRITICAL" }),
    SLAIncident.countDocuments({ status: { $in: ["DETECTED", "ESCALATED"] }, severity: "HIGH" }),
  ]);

  const onTrackCount = Math.max(0, totalActive - (overdueTasks + criticalIncidents));
  const complianceRate = totalActive > 0 ? Math.round((onTrackCount / totalActive) * 100) : 100;

  const criticalTasks = await Work.find({
    status: { $nin: ["Completed", "Failed"] },
    $or: [{ dueDate: { $lt: new Date() } }, { "sla.riskScore": { $gte: 80 } }],
  })
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name role department")
    .sort({ dueDate: 1 })
    .limit(10)
    .lean();

  return {
    totalActive,
    overdueTasks,
    criticalIncidents,
    highIncidents,
    onTrackCount,
    complianceRate,
    healthStatus: complianceRate >= 90 ? "EXCELLENT" : complianceRate >= 75 ? "GOOD" : "CRITICAL_ATTENTION",
    tasks: criticalTasks,
  };
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
  const now = new Date();
  const tasks = await Work.find({
    status: { $nin: ["Completed", "Failed"] },
    $or: [{ dueDate: { $lt: now } }, { "sla.riskScore": { $gte: 50 } }],
  })
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name role department")
    .sort({ dueDate: 1, "sla.riskScore": -1 })
    .limit(30)
    .lean();

  return {
    count: tasks.length,
    tasks: tasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now;
      return {
        ...t,
        formattedClientName: t.customer?.name || t.clientName || "Client",
        assigneeName: t.assignedTo?.[0]?.name || "Unassigned",
        computedSlaBadge: isOverdue ? "🔴 OVERDUE BREACH" : "🟡 AT RISK",
      };
    }),
  };
};

exports.getCriticalTasks = async (params = {}, ctx = {}) => {
  const now = new Date();
  const tasks = await Work.find({
    status: { $nin: ["Completed", "Failed"] },
    $or: [{ dueDate: { $lt: now } }, { "sla.riskScore": { $gte: 80 } }, { priority: "Urgent" }],
  })
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name role department")
    .sort({ dueDate: 1, "sla.riskScore": -1 })
    .limit(20)
    .lean();

  const totalActive = await Work.countDocuments({ status: { $nin: ["Completed", "Failed"] } });
  const overdueCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
  const complianceRate = totalActive > 0 ? Math.round(((totalActive - overdueCount) / totalActive) * 100) : 100;

  return {
    count: tasks.length,
    totalActive,
    overdueCount,
    complianceRate,
    tasks: tasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now;
      let hoursOverdue = 0;
      if (isOverdue) {
        hoursOverdue = Math.round((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60));
      }
      return {
        ...t,
        formattedClientName: t.customer?.name || t.clientName || "Client",
        assigneeName: t.assignedTo?.[0]?.name || "Unassigned",
        assigneeRole: t.assignedTo?.[0]?.role || "None",
        isOverdue,
        hoursOverdue,
        computedSlaBadge: isOverdue ? `🔴 OVERDUE BREACH (${hoursOverdue}h)` : "🟡 CRITICAL DEADLINE",
      };
    }),
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
