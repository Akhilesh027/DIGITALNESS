/**
 * GoogleAdsInsightsSyncService.js
 * Scheduled Read-Only Performance Sync & Historical Backfill for Google Ads
 * 
 * Strict Read-Only Policy:
 * 1. Collects metrics, search terms, and change events.
 * 2. Deterministically upserts daily snapshots with 14-day late conversion backfill.
 * 3. ZERO provider mutations or autonomous spend changes.
 */

const GoogleAdsInsightSnapshot = require("../../models/GoogleAdsInsightSnapshot");
const GoogleAdsExternalChange = require("../../models/GoogleAdsExternalChange");
const AdCampaign = require("../../models/AdCampaign");
const GoogleAdsQueryService = require("../integrations/connectors/googleAds/GoogleAdsQueryService");
const googleAdsConversionNormalizer = require("../integrations/connectors/googleAds/GoogleAdsConversionNormalizer");
const IntegrationManager = require("../integrations/IntegrationManager");
const googleAdsPerformanceWatcherEngine = require("../automation/engines/GoogleAdsPerformanceWatcherEngine");

class GoogleAdsInsightsSyncService {
  /**
   * Synchronizes performance insights for a customer
   */
  async syncCustomerInsights({ customerId, locationId = null, backfillDays = 14 }) {
    if (!customerId) throw new Error("customerId is required for Google Ads insights sync.");

    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "GoogleAds",
      accountType: "GoogleAdsAccount",
    });

    if (!connection) {
      const err = new Error("GOOGLE_ADS_CONNECTION_NOT_FOUND: Active connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    const today = new Date();
    const startDate = new Date(today.getTime() - backfillDays * 24 * 3600 * 1000);
    const dateStart = startDate.toISOString().split("T")[0];
    const dateStop = today.toISOString().split("T")[0];

    const googleAdsCustomerId = connection.metadata?.googleAdsCustomerId || connection.platformAccountId;
    const currency = connection.metadata?.currencyCode || "INR";

    // 1. Fetch Campaign Performance
    const campaignResults = await GoogleAdsQueryService.getCampaignPerformance({
      customerId,
      locationId,
      dateStart,
      dateStop,
    });

    const upsertedSnapshots = [];

    for (const row of campaignResults) {
      const camp = row.campaign || {};
      const metrics = row.metrics || {};
      const date = row.segments?.date || dateStart;
      const cost = Number(metrics.costMicros || 0) / 1000000;

      // Normalize conversions
      const normConv = googleAdsConversionNormalizer.normalizeConversions({
        conversionData: [{ actionName: "Default Lead Form", category: "SUBMIT_LEAD_FORM", count: metrics.conversions || 0 }],
        objective: "LEADS",
        totalCost: cost,
      });

      const snapshot = await GoogleAdsInsightSnapshot.findOneAndUpdate(
        {
          customerId,
          googleAdsCustomerId,
          level: "CAMPAIGN",
          externalObjectId: camp.id || "campaign_default",
          dateStart: date,
          reportingDateBasis: "INTERACTION_DATE",
        },
        {
          $set: {
            locationId,
            connectionId: connection._id,
            accountCurrency: currency,
            dateStop: date,
            campaignResourceName: `customers/${googleAdsCustomerId}/campaigns/${camp.id}`,
            impressions: Number(metrics.impressions || 0),
            clicks: Number(metrics.clicks || 0),
            costMicros: Number(metrics.costMicros || 0),
            cost,
            ctr: Number(metrics.ctr || 0),
            averageCpc: Number(metrics.averageCpc || 0),
            averageCpm: Number(metrics.averageCpm || 0),
            conversions: Number(metrics.conversions || 0),
            conversionValue: Number(metrics.conversionsValue || 0),
            primaryResult: normConv.primaryResult,
            primaryResultCount: normConv.primaryResultCount,
            costPerPrimaryResult: normConv.costPerPrimaryResult,
            conversionBreakdown: normConv.conversionBreakdown,
            lastSyncedAt: new Date(),
          },
          $inc: { revisionCount: 1 },
          $setOnInsert: { firstSyncedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      upsertedSnapshots.push(snapshot);
    }

    // 2. Fetch Search Terms
    const searchTermsResults = await GoogleAdsQueryService.getSearchTerms({
      customerId,
      locationId,
      dateStart,
      dateStop,
    });

    for (const row of searchTermsResults) {
      const st = row.searchTermView || {};
      const metrics = row.metrics || {};
      const date = row.segments?.date || dateStart;
      const cost = Number(metrics.costMicros || 0) / 1000000;

      const normConv = googleAdsConversionNormalizer.normalizeConversions({
        conversionData: [{ actionName: "Search Term Conversion", category: "SUBMIT_LEAD_FORM", count: metrics.conversions || 0 }],
        objective: "LEADS",
        totalCost: cost,
      });

      const stSnapshot = await GoogleAdsInsightSnapshot.findOneAndUpdate(
        {
          customerId,
          googleAdsCustomerId,
          level: "SEARCH_TERM",
          externalObjectId: st.searchTerm || "query_default",
          dateStart: date,
          reportingDateBasis: "INTERACTION_DATE",
        },
        {
          $set: {
            locationId,
            connectionId: connection._id,
            accountCurrency: currency,
            dateStop: date,
            searchTerm: st.searchTerm,
            impressions: Number(metrics.impressions || 0),
            clicks: Number(metrics.clicks || 0),
            costMicros: Number(metrics.costMicros || 0),
            cost,
            ctr: Number(metrics.ctr || 0),
            conversions: Number(metrics.conversions || 0),
            primaryResult: normConv.primaryResult,
            primaryResultCount: normConv.primaryResultCount,
            costPerPrimaryResult: normConv.costPerPrimaryResult,
            lastSyncedAt: new Date(),
          },
          $inc: { revisionCount: 1 },
          $setOnInsert: { firstSyncedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      upsertedSnapshots.push(stSnapshot);
    }

    // 3. Fetch Change Events
    const changeResults = await GoogleAdsQueryService.getChangeEvents({
      customerId,
      locationId,
      dateStart: `${dateStart} 00:00:00`,
      dateStop: `${dateStop} 23:59:59`,
    });

    for (const row of changeResults) {
      const ce = row.changeEvent || {};
      await GoogleAdsExternalChange.create({
        customerId,
        locationId,
        googleAdsCustomerId,
        changeDateTime: ce.changeDateTime ? new Date(ce.changeDateTime) : new Date(),
        resourceType: ce.changeResourceType || "UNKNOWN",
        resourceName: ce.changeResourceName || "unknown_resource",
        changedFields: ce.changedFields || [],
        userEmail: ce.userEmail || null,
      });
    }

    // 4. Run Performance Watcher Engine
    const recommendations = await googleAdsPerformanceWatcherEngine.evaluate({
      customerId,
      locationId,
      googleAdsCustomerId,
    });

    return {
      success: true,
      upsertedSnapshotsCount: upsertedSnapshots.length,
      recommendationsCount: recommendations.length,
      recommendations,
    };
  }
}

module.exports = new GoogleAdsInsightsSyncService();
