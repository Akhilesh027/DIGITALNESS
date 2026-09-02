/**
 * metaInsightsWorker.js
 * Background worker for analytics-sync BullMQ queue
 * 
 * Flow:
 * 1. Claims analytics sync job
 * 2. Invokes MetaInsightsSyncService to fetch and upsert daily metrics
 * 3. Triggers AdPerformanceWatcherEngine for evidence-based recommendations
 * 4. Records completion metrics
 */

const BaseWorker = require("./baseWorker");
const MetaInsightsSyncService = require("../../ads/MetaInsightsSyncService");

const metaInsightsWorker = new BaseWorker({
  queueName: "analytics-sync",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, payload } = envelope;
    console.log(`[MetaInsightsWorker] Starting scheduled Insights sync for Customer: ${customerId}`);

    const syncRes = await MetaInsightsSyncService.syncCampaignInsights({
      customerId,
      locationId,
      adCampaignId: payload.adCampaignId || null,
      backfillDays: payload.backfillDays || 7,
    });

    return {
      success: true,
      operation: "analytics.metaSync",
      syncedCampaigns: syncRes.syncedCampaigns,
      details: syncRes.details,
      completedAt: new Date().toISOString(),
    };
  },
});

module.exports = metaInsightsWorker;
