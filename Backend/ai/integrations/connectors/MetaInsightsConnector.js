/**
 * MetaInsightsConnector.js
 * Read-Only Meta Marketing API Insights Connector
 * 
 * Fetches daily performance metrics (Spend, Impressions, Reach, Clicks, Leads, CPL, Frequency)
 * across Account, Campaign, Ad Set, and Ad levels.
 */

const metaConfig = require("../../../config/meta");
const IntegrationManager = require("../IntegrationManager");
const metaActionNormalizer = require("./meta/MetaActionNormalizer");

class MetaInsightsConnector {
  /**
   * Fetches daily Insights for an object (Campaign, Ad Set, or Ad Account)
   */
  async getInsights({
    customerId,
    locationId = null,
    objectId,
    level = "CAMPAIGN",
    timeRange = { since: "2026-08-18", until: "2026-08-25" },
    objective = "OUTCOME_LEADS",
  }) {
    if (!objectId) throw new Error("objectId is required for Insights query.");

    return IntegrationManager.executeWithConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      operation: "metaAds.readInsights",
      executor: async (credentials, connection) => {
        const { accessToken } = credentials;
        const apiVersion = metaConfig.marketingApiVersion || "v26.0";

        // Mock test token handling for CI
        if (accessToken.startsWith("eaab_mock_token_") || accessToken.startsWith("eaab_test_token_")) {
          const days = [];
          const start = new Date(timeRange.since);
          const end = new Date(timeRange.until);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            const spend = 500;
            const impressions = 2500;
            const clicks = 45;
            const leads = 3;
            const normalized = metaActionNormalizer.normalizeActions({
              rawActions: [{ action_type: "lead", value: leads }],
              objective,
              spend,
            });

            days.push({
              dateStart: dateStr,
              dateStop: dateStr,
              impressions,
              reach: 2100,
              frequency: 1.19,
              clicks,
              uniqueClicks: 40,
              outboundClicks: 38,
              spend,
              ctr: 1.8,
              cpc: 11.11,
              cpm: 200,
              actionsByType: normalized.actionsByType,
              rawActions: normalized.rawActions,
              results: normalized.results,
              resultType: normalized.resultType,
              costPerResult: normalized.costPerResult,
            });
          }

          return {
            success: true,
            mock: true,
            apiVersion,
            objectId,
            level,
            insights: days,
          };
        }

        // Live Meta Graph API Insights Call
        const fields = [
          "date_start",
          "date_stop",
          "account_id",
          "campaign_id",
          "campaign_name",
          "adset_id",
          "adset_name",
          "ad_id",
          "ad_name",
          "impressions",
          "reach",
          "frequency",
          "clicks",
          "unique_clicks",
          "spend",
          "ctr",
          "cpc",
          "cpm",
          "actions",
          "cost_per_action_type",
        ].join(",");

        const params = new URLSearchParams({
          fields,
          level: level.toLowerCase(),
          time_range: JSON.stringify(timeRange),
          time_increment: "1",
          access_token: accessToken,
        });

        const url = `https://graph.facebook.com/${apiVersion}/${objectId}/insights?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.error) {
          const err = new Error(data.error?.message || "Failed to fetch Meta Insights.");
          err.code = "META_INSIGHTS_FETCH_FAILED";
          err.metaError = data.error;
          throw err;
        }

        const rows = (data.data || []).map((row) => {
          const spend = parseFloat(row.spend) || 0;
          const impressions = parseInt(row.impressions, 10) || 0;
          const clicks = parseInt(row.clicks, 10) || 0;
          const reach = parseInt(row.reach, 10) || impressions;
          const frequency = parseFloat(row.frequency) || (reach > 0 ? impressions / reach : 1);

          const ctr = parseFloat(row.ctr) || (impressions > 0 ? (clicks / impressions) * 100 : 0);
          const cpc = parseFloat(row.cpc) || (clicks > 0 ? spend / clicks : null);
          const cpm = parseFloat(row.cpm) || (impressions > 0 ? (spend / impressions) * 1000 : null);

          const actionNorm = metaActionNormalizer.normalizeActions({
            rawActions: row.actions || [],
            objective,
            spend,
          });

          return {
            dateStart: row.date_start,
            dateStop: row.date_stop,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            adSetId: row.adset_id,
            adSetName: row.adset_name,
            adId: row.ad_id,
            adName: row.ad_name,
            impressions,
            reach,
            frequency: Math.round(frequency * 100) / 100,
            clicks,
            uniqueClicks: parseInt(row.unique_clicks, 10) || clicks,
            spend,
            ctr: Math.round(ctr * 100) / 100,
            cpc: cpc !== null ? Math.round(cpc * 100) / 100 : null,
            cpm: cpm !== null ? Math.round(cpm * 100) / 100 : null,
            actionsByType: actionNorm.actionsByType,
            rawActions: actionNorm.rawActions,
            results: actionNorm.results,
            resultType: actionNorm.resultType,
            costPerResult: actionNorm.costPerResult,
          };
        });

        return {
          success: true,
          mock: false,
          apiVersion,
          objectId,
          level,
          insights: rows,
        };
      },
    });
  }
}

module.exports = new MetaInsightsConnector();
