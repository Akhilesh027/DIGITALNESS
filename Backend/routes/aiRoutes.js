/**
 * aiRoutes.js
 * API Routes for Phase 3 AI Marketing OS.
 */

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAIProviderStatus,
  createAIRequest,
  generateDirectPrompt,
  getAgentRuns,
  getAgentRunById,
  approvePlan,
  modifyPlan,
  cancelRun,
  executeRun,
  generatePosterImageForRun,
  handleRevision,
  handleRegeneration,
  handleApproveOutput,
  handleScheduleOutput,
  handleSaveOnly,
} = require("../controllers/aiController");

const {
  handleCommandRequest,
  handleApproveCommand,
  handleRejectCommand,
  handleExecuteCommand,
  handleRollbackCommand,
  handleIntakeAnswer,
  handleFinishIntake,
  getCommandExecutionById,
  getCommandHistory,
  getCommandRegistry,
} = require("../controllers/aiCommandController");

const {
  getAutomationPolicies,
  updateAutomationPolicy,
  getAutomationRuns,
  getAutomationSummary,
  triggerAutomationJob,
} = require("../controllers/automationController");

const {
  getServicePackages,
  getTeamWorkload,
  previewPipeline,
  generatePipeline,
  regeneratePipeline,
  convertAndOnboardLead,
} = require("../controllers/pipelineAutomationController");

const {
  getOpportunities,
  getClientCalendar,
  previewCalendar,
  generateCalendar,
  batchApproveItems,
  regenerateCalendar,
} = require("../controllers/contentCalendarAutomationController");

const {
  getSLASummary,
  getSLAIncidents,
  getCriticalTasks,
  getWorkRiskDetails,
  triggerSLAScan,
  rebalanceWorkload,
  acknowledgeIncident,
  recoverIncident,
} = require("../controllers/slaAutomationController");

const {
  getFinanceSummary,
  getAgingSummary,
  getExpectedCollections,
  getOverdueInvoices,
  getCriticalCollections,
  triggerFinanceScan,
  generateReminderDraft,
  recordPromiseToPay,
  markDisputed,
  resolveDispute,
  generatePaymentLink,
} = require("../controllers/paymentRecoveryAutomationController");

const {
  getLiveBriefing,
  getMorningBrief,
  getEodWrap,
  getPriorities,
  getAgencyHealth,
  getBriefingHistory,
  generateMorningBrief,
  generateEodWrap,
} = require("../controllers/executiveBriefingAutomationController");

const {
  getDecisionInbox,
  approveDecision,
  rejectDecision,
  batchApproveSafe,
} = require("../controllers/decisionInboxAutomationController");

const router = express.Router();

router.use(protect);

// ----------------------------------------------------
// PHASE 5: AUTONOMOUS AGENCY OS & AUTOMATION CENTER
// ----------------------------------------------------
router.get("/automation/policies", getAutomationPolicies);
router.put("/automation/policies/:key", updateAutomationPolicy);
router.get("/automation/runs", getAutomationRuns);
router.get("/automation/summary", getAutomationSummary);
router.post("/automation/trigger", triggerAutomationJob);

// PHASE 5B: ZERO-TOUCH CLIENT PIPELINE & WORKLOAD API
router.get("/automation/packages", getServicePackages);
router.get("/automation/workload", getTeamWorkload);
router.post("/automation/pipeline/preview", previewPipeline);
router.post("/automation/pipeline/generate", generatePipeline);
router.post("/automation/pipeline/regenerate", regeneratePipeline);
router.post("/automation/leads/:leadId/convert-onboard", convertAndOnboardLead);

// PHASE 5C: AUTONOMOUS CONTENT INTELLIGENCE & CALENDAR API
router.get("/automation/content/opportunities", getOpportunities);
router.get("/automation/content/calendar/:clientId", getClientCalendar);
router.post("/automation/content/calendar/preview", previewCalendar);
router.post("/automation/content/calendar/generate", generateCalendar);
router.post("/automation/content/calendar/:id/batch-approve", batchApproveItems);
router.post("/automation/content/calendar/:id/regenerate", regenerateCalendar);

// PHASE 5D: PROACTIVE SLA & DEADLINE GUARDIAN API
router.get("/automation/sla/summary", getSLASummary);
router.get("/automation/sla/incidents", getSLAIncidents);
router.get("/automation/sla/critical", getCriticalTasks);
router.get("/automation/sla/work/:workId", getWorkRiskDetails);
router.post("/automation/sla/scan", triggerSLAScan);
router.post("/automation/sla/rebalance", rebalanceWorkload);
router.post("/automation/sla/incidents/:id/acknowledge", acknowledgeIncident);
router.post("/automation/sla/incidents/:id/recover", recoverIncident);

// PHASE 5E: CASH-FLOW & PAYMENT RECOVERY API
router.get("/automation/finance/summary", getFinanceSummary);
router.get("/automation/finance/aging", getAgingSummary);
router.get("/automation/finance/expected", getExpectedCollections);
router.get("/automation/finance/overdue", getOverdueInvoices);
router.get("/automation/finance/critical", getCriticalCollections);
router.post("/automation/finance/scan", triggerFinanceScan);
router.post("/automation/finance/reminder/generate", generateReminderDraft);
router.post("/automation/finance/promise", recordPromiseToPay);
router.post("/automation/finance/dispute", markDisputed);
router.post("/automation/finance/dispute/resolve", resolveDispute);
router.get("/automation/finance/payment-link/:invoiceId", generatePaymentLink);

// PHASE 5F: EXECUTIVE MORNING BRIEFING & EOD INTELLIGENCE API
router.get("/automation/briefing/live", getLiveBriefing);
router.get("/automation/briefing/morning", getMorningBrief);
router.get("/automation/briefing/eod", getEodWrap);
router.get("/automation/briefing/priorities", getPriorities);
router.get("/automation/briefing/health", getAgencyHealth);
router.get("/automation/briefing/history", getBriefingHistory);
router.post("/automation/briefing/generate-morning", generateMorningBrief);
router.post("/automation/briefing/generate-eod", generateEodWrap);

// PHASE 5G: UNIFIED DECISION INBOX & CROSS-ENGINE APPROVAL API
router.get("/automation/decisions", getDecisionInbox);
router.post("/automation/decisions/batch-approve-safe", batchApproveSafe);
router.post("/automation/decisions/:id/approve", approveDecision);
router.post("/automation/decisions/:id/reject", rejectDecision);

// ----------------------------------------------------
// UNIVERSAL WORKSPACE CONVERSATIONAL COPILOT API
// ----------------------------------------------------
const {
  handleWorkspaceMessage,
  getConversations,
  getConversationById,
  deleteConversation,
} = require("../controllers/aiWorkspaceConversationController");

router.post("/workspace/message", handleWorkspaceMessage);
router.get("/workspace/conversations", getConversations);
router.get("/workspace/conversations/:conversationId", getConversationById);
router.delete("/workspace/conversations/:conversationId", deleteConversation);

// ----------------------------------------------------
// PHASE 4 & 4.1: UNIVERSAL COMMAND & INTAKE ENGINE ROUTES
// ----------------------------------------------------
router.post("/command", handleCommandRequest);
router.post("/command/:executionId/answer", handleIntakeAnswer);
router.post("/command/:executionId/finish-intake", handleFinishIntake);
router.post("/command/:executionId/approve", handleApproveCommand);
router.post("/command/:executionId/reject", handleRejectCommand);
router.post("/command/:executionId/execute", handleExecuteCommand);
router.post("/command/:executionId/rollback", handleRollbackCommand);
router.get("/command/:executionId", getCommandExecutionById);
router.get("/commands/history", getCommandHistory);
router.get("/command-registry", getCommandRegistry);

// ----------------------------------------------------
// PHASE 3: AI MARKETING AGENTS & RUNS (PRESERVED)
// ----------------------------------------------------
router.get("/status", getAIProviderStatus);
router.post("/requests", createAIRequest);
router.post("/prompt", generateDirectPrompt);

router.get("/runs", getAgentRuns);
router.get("/runs/:id", getAgentRunById);

router.post("/runs/:id/approve-plan", approvePlan);
router.post("/runs/:id/modify-plan", modifyPlan);
router.post("/runs/:id/cancel", cancelRun);
router.post("/runs/:id/execute", executeRun);
router.post("/runs/:id/generate-image", generatePosterImageForRun);

router.post("/runs/:id/request-revision", handleRevision);
router.post("/runs/:id/regenerate", handleRegeneration);
router.post("/runs/:id/approve-output", handleApproveOutput);
router.post("/runs/:id/schedule-output", handleScheduleOutput);
router.post("/runs/:id/save-only", handleSaveOnly);

module.exports = router;
