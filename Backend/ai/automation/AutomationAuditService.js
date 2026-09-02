/**
 * AutomationAuditService.js
 * Tracks, logs, and queries all autonomous agency activities and execution runs.
 */

const AutomationRun = require("../../models/AutomationRun");

class AutomationAuditService {
  /**
   * Initializes a new automation run.
   */
  async startRun({
    engine,
    triggerType,
    triggerReference = "",
    policyKey = "",
    policyMode = "APPROVAL_REQUIRED",
    idempotencyKey = null,
    actionsPlanned = [],
    triggeredBy = null,
    metadata = {},
  }) {
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const run = await AutomationRun.create({
      runId,
      engine,
      triggerType,
      triggerReference,
      policyKey,
      policyMode,
      status: "RUNNING",
      idempotencyKey,
      actionsPlanned,
      triggeredBy,
      metadata,
      startedAt: new Date(),
    });

    return run;
  }

  /**
   * Completes or updates an automation run.
   */
  async completeRun(runId, { status = "COMPLETED", actionsExecuted = [], summary = "", error = "" }) {
    const run = await AutomationRun.findOneAndUpdate(
      { runId },
      {
        status,
        actionsExecuted,
        summary,
        error,
        completedAt: new Date(),
      },
      { new: true }
    );
    return run;
  }

  /**
   * Fetches recent automation runs.
   */
  async getRecentRuns(limit = 20, engine = null) {
    const query = {};
    if (engine) query.engine = engine;

    return await AutomationRun.find(query)
      .populate("triggeredBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Summarizes today's autonomous activity.
   */
  async getTodayActivitySummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const runs = await AutomationRun.find({
      createdAt: { $gte: startOfDay },
    }).lean();

    const counts = {
      totalRuns: runs.length,
      completed: runs.filter((r) => r.status === "COMPLETED").length,
      waitingApproval: runs.filter((r) => r.status === "WAITING_APPROVAL").length,
      failed: runs.filter((r) => r.status === "FAILED").length,
    };

    const highlights = runs
      .filter((r) => r.summary)
      .map((r) => ({
        engine: r.engine,
        summary: r.summary,
        time: r.createdAt,
        status: r.status,
      }))
      .slice(0, 10);

    return { counts, highlights, runs };
  }
}

module.exports = new AutomationAuditService();
