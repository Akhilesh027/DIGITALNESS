/**
 * AutomationScheduler.js
 * Manages periodic background jobs and schedules for Digitalness Autonomous Agency OS.
 */

const orchestrator = require("./AutomationOrchestrator");

class AutomationScheduler {
  constructor() {
    this.intervals = [];
    this.isRunning = false;
  }

  /**
   * Starts all scheduled background timers.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[AutomationScheduler] Started 24/7 Agency Autonomous Background Engine.");

    // SLA Guardian Watcher (Every 30 minutes)
    const slaInterval = setInterval(() => {
      this.runJob("SLA_WATCHER");
    }, 30 * 60 * 1000);
    this.intervals.push(slaInterval);

    // Payment & Dues Watcher (Every 60 minutes)
    const paymentInterval = setInterval(() => {
      this.runJob("PAYMENT_WATCHER");
    }, 60 * 60 * 1000);
    this.intervals.push(paymentInterval);

    // Ads ROAS & CPL Watcher (Every 6 hours)
    const adsInterval = setInterval(() => {
      this.runJob("ADS_WATCHER");
    }, 6 * 60 * 60 * 1000);
    this.intervals.push(adsInterval);
  }

  /**
   * Stops background timers (for graceful shutdown / testing).
   */
  stop() {
    this.intervals.forEach((timer) => clearInterval(timer));
    this.intervals = [];
    this.isRunning = false;
    console.log("[AutomationScheduler] Stopped background timers.");
  }

  /**
   * Triggers a specific background job immediately.
   */
  async runJob(jobType, metadata = {}) {
    console.log(`[AutomationScheduler] Running scheduled job: ${jobType}`);
    try {
      switch (jobType) {
        case "SLA_WATCHER":
          return await orchestrator.dispatch({
            engine: "SLA_GUARDIAN",
            policyKey: "sla.guardianWatchAndAlert",
            triggerType: "SCHEDULE",
            triggerReference: "sla_cron_30m",
            params: metadata,
          }).catch((e) => console.log(`[SLA Job Note]: ${e.message}`));

        case "PAYMENT_WATCHER":
          return await orchestrator.dispatch({
            engine: "PAYMENT_RECOVERY",
            policyKey: "payment.recoveryAndReminders",
            triggerType: "SCHEDULE",
            triggerReference: "payment_cron_60m",
            params: metadata,
          }).catch((e) => console.log(`[Payment Job Note]: ${e.message}`));

        case "ADS_WATCHER":
          const adWatcher = require("./engines/AdPerformanceWatcherEngine");
          return await adWatcher.scan(metadata);

        case "MORNING_BRIEF":
          return await orchestrator.dispatch({
            engine: "EXECUTIVE_BRIEFING",
            policyKey: "briefing.dailyExecutiveRollup",
            triggerType: "SCHEDULE",
            triggerReference: "morning_brief_9am",
            params: { type: "MORNING", ...metadata },
          }).catch((e) => console.log(`[Morning Brief Note]: ${e.message}`));

        case "EOD_BRIEF":
          return await orchestrator.dispatch({
            engine: "EXECUTIVE_BRIEFING",
            policyKey: "briefing.dailyExecutiveRollup",
            triggerType: "SCHEDULE",
            triggerReference: "eod_brief_6pm",
            params: { type: "EOD", ...metadata },
          }).catch((e) => console.log(`[EOD Brief Note]: ${e.message}`));

        default:
          console.warn(`[AutomationScheduler] Unknown jobType '${jobType}'`);
      }
    } catch (err) {
      console.error(`[AutomationScheduler Error in ${jobType}]:`, err.message);
    }
  }
}

module.exports = new AutomationScheduler();
