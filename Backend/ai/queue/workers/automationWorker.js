/**
 * automationWorker.js
 * Background worker for automation and recurring agency intelligence jobs.
 * Demonstrates the Step 4 proof migration of ExecutiveBriefingEngine to BullMQ.
 */

const BaseWorker = require("./baseWorker");
const executiveBriefingEngine = require("../../automation/engines/ExecutiveBriefingEngine");

const automationWorker = new BaseWorker({
  queueName: "automation",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { operation, payload } = envelope;
    console.log(`[AutomationWorker] Executing automation job: ${operation}`);

    if (operation === "automation.generateMorningBrief" || operation === "EXECUTIVE_BRIEFING") {
      const result = await executiveBriefingEngine.generateMorningBrief({
        date: payload?.date || new Date().toISOString().split("T")[0],
        userId: envelope.requestedBy,
      });

      return {
        success: true,
        mock: false,
        engine: "ExecutiveBriefingEngine",
        briefingId: result?.briefingId || `briefing:morning:${Date.now()}`,
        healthScore: result?.agencyHealth?.score || 100,
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      operation,
      processedAt: new Date().toISOString(),
    };
  },
});

module.exports = automationWorker;
