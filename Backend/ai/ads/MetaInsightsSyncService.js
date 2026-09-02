/**
 * MetaInsightsSyncService.js
 * Scheduled Performance Synchronizer for Meta Ads
 * 
 * Flow:
 * 1. Resolves tracked AdCampaign records for a customer/location
 * 2. Determines date range (today + configurable N-day historical backfill)
 * 3. Fetches daily Insights via MetaInsightsConnector
 * 4. Deterministically upserts snapshots into MetaAdsInsightSnapshot
 * 5. Triggers AdPerformanceWatcherEngine for evidence-based recommendations
 */

const AdCampaign = require("../../models/AdCampaign");
const MetaAdsInsightSnapshot = require("../../models/MetaAdsInsightSnapshot");
const MetaInsightsConnector = require("../integrations/connectors/MetaInsightsConnector");
const IntegrationManager = require("../integrations/IntegrationManager");
const adPerformanceWatcher = require("../automation/engines/AdPerformanceWatcherEngine");

const DEFAULT_BACKFILL_DAYS = parseInt(process.env.META_INSIGHTS_BACKFILL_DAYS || "7", 10);

class MetaInsightsSyncService {
  /**
   * Synchronizes performance metrics for a specific campaign or all tracked campaigns of a customer
   */
  async syncCampaignInsights({ customerId, locationId = null, adCampaignId = null, backfillDays = DEFAULT_BACKFILL_DAYS }) {
    if (!customerId) throw new Error("customerId is required for Insights sync.");

    // 1. Resolve MarketingConnection
    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
    });

    if (!connection) {
      const err = new Error("META_ADS_CONNECTION_NOT_FOUND: Active Meta Ad Account connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    // 2. Query target campaigns
    const query = { customerId };
    if (locationId) query.clientLocationId = locationId;
    if (adCampaignId) query._id = adCampaignId;

    const campaigns = await AdCampaign.find(query);
    const results = [];

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - backfillDays);

    const timeRange = {
      since: startDate.toISOString().split("T")[0],
      until: today.toISOString().split("T")[0],
    };

    for (const camp of campaigns) {
      if (!camp.metaCampaignId) continue;

      try {
        const insightsRes = await MetaInsightsConnector.getInsights({
          customerId,
          locationId,
          objectId: camp.metaCampaignId,
          level: "CAMPAIGN",
          timeRange,
          objective: camp.objective || "OUTCOME_LEADS",
        });

        let upsertCount = 0;

        for (const row of insightsRes.insights) {
          await MetaAdsInsightSnapshot.findOneAndUpdate(
            {
              customerId,
              accountId: connection.platformAccountId,
              level: "CAMPAIGN",
              objectId: camp.metaCampaignId,
              dateStart: row.dateStart,
              dateStop: row.dateStop,
            },
            {
              $set: {
                locationId,
                connectionId: connection._id,
                accountCurrency: connection.metadata?.currency || "INR",
                accountTimezone: connection.metadata?.timezone || "Asia/Kolkata",
                campaignId: camp.metaCampaignId,
                campaignName: camp.campaignName,
                impressions: row.impressions,
                reach: row.reach,
                frequency: row.frequency,
                clicks: row.clicks,
                uniqueClicks: row.uniqueClicks,
                outboundClicks: row.outboundClicks,
                spend: row.spend,
                ctr: row.ctr,
                cpc: row.cpc,
                cpm: row.cpm,
                actionsByType: row.actionsByType,
                rawActions: row.rawActions,
                results: row.results,
                resultType: row.resultType,
                costPerResult: row.costPerResult,
                syncedAt: new Date(),
              },
              $inc: { revisionCount: 1 },
            },
            { upsert: true, new: true }
          );
          upsertCount++;
        }

        // Trigger performance evaluation
        const evaluation = await adPerformanceWatcher.evaluateCampaign({
          adCampaignId: camp._id,
          customerId,
        });

        results.push({
          campaignId: camp._id,
          metaCampaignId: camp.metaCampaignId,
          upsertCount,
          evaluation,
        });
      } catch (err) {
        console.warn(`[MetaInsightsSyncService] Failed to sync insights for Campaign ${camp.metaCampaignId}:`, err.message);
        results.push({
          campaignId: camp._id,
          metaCampaignId: camp.metaCampaignId,
          error: err.message,
        });
      }
    }

    return {
      success: true,
      syncedCampaigns: results.length,
      details: results,
    };
  }
}

module.exports = new MetaInsightsSyncService();
