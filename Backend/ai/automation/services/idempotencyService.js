/**
 * idempotencyService.js
 * Cross-run idempotency protection for Phase 5 Autonomous Agency OS.
 */

const AutomationRun = require("../../../models/AutomationRun");
const crypto = require("crypto");

class IdempotencyService {
  /**
   * Generates a deterministic idempotency key.
   */
  generateKey(engine, entityId, period = "") {
    const raw = `${engine}:${entityId}:${period}`;
    return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
  }

  /**
   * Checks if an automated operation has already been executed or queued.
   */
  async checkIdempotency(idempotencyKey) {
    if (!idempotencyKey) return { isDuplicate: false };

    const existingRun = await AutomationRun.findOne({ idempotencyKey }).lean();
    if (!existingRun) return { isDuplicate: false };

    const isCompleted = existingRun.status === "COMPLETED";
    const isRunning = existingRun.status === "RUNNING" || existingRun.status === "QUEUED";

    return {
      isDuplicate: isCompleted || isRunning,
      status: existingRun.status,
      runId: existingRun.runId,
      completedAt: existingRun.completedAt,
      summary: existingRun.summary,
    };
  }

  /**
   * Generates pipeline idempotency key. e.g. pipeline:customer_id:2026-08
   */
  getPipelineKey(customerId, monthYear = new Date().toISOString().slice(0, 7)) {
    return `pipeline:${customerId}:${monthYear}`;
  }

  /**
   * Generates festival post idempotency key. e.g. festival:customer_id:independence-day:2026
   */
  getFestivalKey(customerId, festivalSlug, year = new Date().getFullYear()) {
    return `festival:${customerId}:${festivalSlug}:${year}`;
  }

  /**
   * Generates SLA alert key. e.g. sla:taskId:overdue_alert:2026-08-17
   */
  getSLAAlertKey(taskId, alertType, dateStr = new Date().toISOString().slice(0, 10)) {
    return `sla:${taskId}:${alertType}:${dateStr}`;
  }

  /**
   * Generates payment reminder key. e.g. payment:customerId:reminder_due:2026-08-17
   */
  getPaymentReminderKey(customerId, reminderType, dateStr = new Date().toISOString().slice(0, 10)) {
    return `payment:${customerId}:${reminderType}:${dateStr}`;
  }
}

module.exports = new IdempotencyService();
