/**
 * AdsPerformanceAggregator.js
 * Multi-Window Performance Aggregation & Delta Calculator for Meta Ads
 */

const MetaAdsInsightSnapshot = require("../../models/MetaAdsInsightSnapshot");

class AdsPerformanceAggregator {
  /**
   * Aggregates snapshots for a specific campaign across reporting windows
   */
  async getCampaignRollup({ campaignId, customerId }) {
    const snapshots = await MetaAdsInsightSnapshot.find({
      $or: [{ campaignId }, { objectId: campaignId }],
      customerId,
    }).sort({ dateStart: -1 });

    if (!snapshots || snapshots.length === 0) {
      return {
        hasData: false,
        totalSpend: 0,
        totalLeads: 0,
        overallCPL: null,
        windows: {},
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const last3Days = snapshots.slice(0, 3);
    const prev3Days = snapshots.slice(3, 6);
    const last7Days = snapshots.slice(0, 7);

    const aggregateSlice = (slice) => {
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      let leads = 0;

      for (const s of slice) {
        spend += s.spend || 0;
        impressions += s.impressions || 0;
        clicks += s.clicks || 0;
        leads += s.results || 0;
      }

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : null;
      const cpl = leads > 0 ? Math.round(spend / leads) : null;
      const frequency = slice.length > 0 ? slice[0].frequency : 1.0;

      return {
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        leads,
        ctr: Math.round(ctr * 100) / 100,
        cpc: cpc !== null ? Math.round(cpc * 100) / 100 : null,
        cpl,
        frequency,
        daysCount: slice.length,
      };
    };

    const last3Agg = aggregateSlice(last3Days);
    const prev3Agg = aggregateSlice(prev3Days);
    const last7Agg = aggregateSlice(last7Days);
    const lifetimeAgg = aggregateSlice(snapshots);

    // Calculate deltas between last 3 days and previous 3 days
    let cplChangePct = null;
    if (last3Agg.cpl !== null && prev3Agg.cpl !== null && prev3Agg.cpl > 0) {
      cplChangePct = Math.round(((last3Agg.cpl - prev3Agg.cpl) / prev3Agg.cpl) * 100);
    }

    let spendChangePct = null;
    if (prev3Agg.spend > 0) {
      spendChangePct = Math.round(((last3Agg.spend - prev3Agg.spend) / prev3Agg.spend) * 100);
    }

    return {
      hasData: true,
      lastSyncedAt: snapshots[0].syncedAt,
      windows: {
        last3Days: last3Agg,
        prev3Days: prev3Agg,
        last7Days: last7Agg,
        lifetime: lifetimeAgg,
      },
      deltas: {
        cplChangePct,
        spendChangePct,
      },
    };
  }
}

module.exports = new AdsPerformanceAggregator();
