/**
 * briefingAutomationHandlers.js
 * Deterministic command handlers for Phase 5F Executive Morning Briefing & EOD Wrap Engine.
 */

const executiveBriefingEngine = require("../../automation/engines/ExecutiveBriefingEngine");
const agencyHealthService = require("../../automation/services/agencyHealthService");
const executivePriorityService = require("../../automation/services/executivePriorityService");
const tomorrowPlanningService = require("../../automation/services/tomorrowPlanningService");
const decisionInboxService = require("../../automation/services/decisionInboxService");

exports.getCurrentBrief = async (params = {}, ctx = {}) => {
  const result = await executiveBriefingEngine.getLiveExecutiveView();
  return result;
};

exports.getMorningBrief = async (params = {}, ctx = {}) => {
  const date = params.date || new Date().toISOString().split("T")[0];
  let brief = await executiveBriefingEngine.getLatestBrief("MORNING");
  if (!brief || brief.date !== date || !brief.clients || brief.delivery?.activeTotal === undefined) {
    brief = await executiveBriefingEngine.generateMorningBrief({ date, userId: ctx.userId });
  }
  return brief && typeof brief.toObject === "function" ? brief.toObject() : brief;
};

exports.getEodWrap = async (params = {}, ctx = {}) => {
  const date = params.date || new Date().toISOString().split("T")[0];
  let brief = await executiveBriefingEngine.getLatestBrief("EOD");
  if (!brief || brief.date !== date || !brief.clients || brief.delivery?.activeTotal === undefined) {
    brief = await executiveBriefingEngine.generateEodWrap({ date, userId: ctx.userId });
  }
  return brief && typeof brief.toObject === "function" ? brief.toObject() : brief;
};

exports.getPriorities = async (params = {}, ctx = {}) => {
  const priorities = await executivePriorityService.getExecutivePriorities();
  return {
    count: priorities.length,
    priorities,
  };
};

exports.getAgencyHealth = async (params = {}, ctx = {}) => {
  const live = await executiveBriefingEngine.getLiveExecutiveView();
  return {
    agencyHealth: live.agencyHealth,
  };
};

exports.getTomorrowPlan = async (params = {}, ctx = {}) => {
  const plan = await tomorrowPlanningService.getTomorrowPlan();
  return plan;
};

exports.getHistory = async (params = {}, ctx = {}) => {
  const limit = params.limit ? Number(params.limit) : 14;
  const history = await executiveBriefingEngine.getBriefHistory(limit);
  return {
    count: history.length,
    history,
  };
};

exports.generateMorning = async (params = {}, ctx = {}) => {
  const date = params.date || new Date().toISOString().split("T")[0];
  const result = await executiveBriefingEngine.generateMorningBrief({ date, userId: ctx.userId });
  return result;
};

exports.generateEod = async (params = {}, ctx = {}) => {
  const date = params.date || new Date().toISOString().split("T")[0];
  const result = await executiveBriefingEngine.generateEodWrap({ date, userId: ctx.userId });
  return result;
};

exports.getDecisionInbox = async (params = {}, ctx = {}) => {
  const decisions = await decisionInboxService.getPendingDecisions();
  return {
    count: decisions.length,
    safeCount: decisions.filter((d) => d.riskLevel === "SAFE").length,
    data: decisions,
  };
};

exports.batchApproveSafe = async (params = {}, ctx = {}) => {
  const result = await decisionInboxService.batchApproveSafe({ userId: ctx.userId });
  return result;
};
