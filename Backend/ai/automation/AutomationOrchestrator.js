/**
 * AutomationOrchestrator.js
 * Central coordinator for all autonomous engines and scheduled background jobs.
 */

const policyService = require("./AutomationPolicyService");
const auditService = require("./AutomationAuditService");
const idempotencyService = require("./services/idempotencyService");
const eventBus = require("./services/eventBus");
const clientPipelineEngine = require("./engines/ClientPipelineEngine");
const contentCalendarEngine = require("./engines/ContentCalendarEngine");
const slaGuardianEngine = require("./engines/SLAGuardianEngine");
const paymentRecoveryEngine = require("./engines/PaymentRecoveryEngine");
const executiveBriefingEngine = require("./engines/ExecutiveBriefingEngine");

class AutomationOrchestrator {
  constructor() {
    this.engines = new Map();
    this.registerEngine("CLIENT_PIPELINE", clientPipelineEngine);
    this.registerEngine("CONTENT_CALENDAR", contentCalendarEngine);
    this.registerEngine("SLA_GUARDIAN", slaGuardianEngine);
    this.registerEngine("PAYMENT_RECOVERY", paymentRecoveryEngine);
    this.registerEngine("EXECUTIVE_BRIEFING", executiveBriefingEngine);
    this.setupEventListeners();
  }

  /**
   * Registers an autonomous engine with the orchestrator.
   */
  registerEngine(engineName, engineInstance) {
    this.engines.set(engineName, engineInstance);
    console.log(`[AutomationOrchestrator] Registered engine: ${engineName}`);
  }

  /**
   * Dispatches an automation task safely through Policy, Idempotency, and Audit layers.
   */
  async dispatch({
    engine,
    policyKey,
    triggerType = "COMMAND",
    triggerReference = "",
    idempotencyKey = null,
    params = {},
    userId = null,
    userRole = "Admin",
  }) {
    console.log(`[AutomationOrchestrator] Dispatching engine='${engine}' policy='${policyKey}'`);

    // 1. Policy & Permission Check
    const policyEval = await policyService.evaluateExecutionMode(policyKey, userRole);
    if (!policyEval.isAllowed) {
      return {
        status: "SKIPPED",
        reason: policyEval.reason,
        mode: policyEval.mode,
      };
    }

    // 2. Cross-Run Idempotency Guard
    if (idempotencyKey) {
      const idempCheck = await idempotencyService.checkIdempotency(idempotencyKey);
      if (idempCheck.isDuplicate) {
        console.log(`[Idempotency Guard] Skipping duplicate automation run for key '${idempotencyKey}'`);
        return {
          status: "SKIPPED",
          reason: "ALREADY_PROCESSED",
          previousRunId: idempCheck.runId,
          completedAt: idempCheck.completedAt,
        };
      }
    }

    // 3. Initialize Audit Run
    const run = await auditService.startRun({
      engine,
      triggerType,
      triggerReference,
      policyKey,
      policyMode: policyEval.mode,
      idempotencyKey,
      triggeredBy: userId,
      metadata: params,
    });

    try {
      const engineInstance = this.engines.get(engine);
      if (!engineInstance) {
        throw new Error(`Engine '${engine}' is not registered with AutomationOrchestrator.`);
      }

      // 4. Run the Engine
      const result = await engineInstance.execute({
        params,
        policyMode: policyEval.mode,
        runId: run.runId,
        userId,
        userRole,
      });

      // 5. Complete Audit Record
      const completedRun = await auditService.completeRun(run.runId, {
        status: result.status || "COMPLETED",
        actionsExecuted: result.actionsExecuted || [],
        summary: result.summary || `Executed ${engine}`,
      });

      return {
        status: completedRun.status,
        runId: run.runId,
        result,
        summary: completedRun.summary,
      };
    } catch (err) {
      console.error(`[AutomationOrchestrator Error in ${engine}]:`, err);
      await auditService.completeRun(run.runId, {
        status: "FAILED",
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Sets up real-time event bus subscriptions.
   */
  setupEventListeners() {
    eventBus.on(eventBus.EVENTS.CUSTOMER_CREATED, async (payload) => {
      console.log(`[Automation Trigger] Customer created -> triggering pipeline check for ${payload.customerId}`);
    });

    eventBus.on(eventBus.EVENTS.LEAD_CONVERTED, async (payload) => {
      console.log(`[Automation Trigger] Lead converted -> triggering onboarding for ${payload.leadId}`);
    });
  }
}

module.exports = new AutomationOrchestrator();
