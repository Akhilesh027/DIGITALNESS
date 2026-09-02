/**
 * AdPerformanceWatcherEngine.js
 * Read-Only Evidence-Based Performance Intelligence Engine for Meta Ads
 * 
 * Strict Production Safety Rules:
 * 1. Read-Only Intelligence: Generates structured recommendations for managers only.
 * 2. Zero Autonomous Execution: NEVER mutates budgets, pauses campaigns, or edits targeting automatically.
 * 3. Insufficient Data Guard: Refuses to judge campaigns before minimum delivery thresholds are reached.
 */

const AdCampaign = require("../../../models/AdCampaign");
const AdsPerformanceRecommendation = require("../../../models/AdsPerformanceRecommendation");
const adsPerformanceAggregator = require("../../ads/AdsPerformanceAggregator");

// Minimum Data Thresholds to Prevent Premature/Hallucinated Optimization
const MIN_SPEND_FOR_EVALUATION = 500; // ₹500 minimum spend
const MIN_IMPRESSIONS_FOR_EVALUATION = 500; // 500 impressions

class AdPerformanceWatcherEngine {
  /**
   * Evaluates performance for a specific campaign and creates structured recommendations
   */
  async evaluateCampaign({ adCampaignId, customerId }) {
    const campaign = await AdCampaign.findById(adCampaignId);
    if (!campaign) throw new Error("AdCampaign not found for performance evaluation.");

    const rollup = await adsPerformanceAggregator.getCampaignRollup({
      campaignId: campaign.metaCampaignId || campaign._id.toString(),
      customerId,
    });

    if (!rollup.hasData) {
      return { status: "NO_DATA", message: "No snapshot data found for campaign." };
    }

    const last3Days = rollup.windows.last3Days;
    const targetCPL = campaign.budget?.targetCPL || 250;

    // 1. Check Insufficient Data Guard
    if (last3Days.spend < MIN_SPEND_FOR_EVALUATION || last3Days.impressions < MIN_IMPRESSIONS_FOR_EVALUATION) {
      const rec = await this._createOrUpdateRecommendation({
        customerId,
        locationId: campaign.clientLocationId,
        campaignId: campaign._id,
        metaCampaignId: campaign.metaCampaignId,
        findingType: "INSUFFICIENT_DATA",
        severity: "LOW",
        confidence: "INSUFFICIENT_DATA",
        evidenceSnapshot: {
          evaluationWindow: "LAST_3_DAYS",
          spend: last3Days.spend,
          impressions: last3Days.impressions,
          clicks: last3Days.clicks,
          leads: last3Days.leads,
          cpl: last3Days.cpl,
          targetCpl: targetCPL,
          ctr: last3Days.ctr,
          frequency: last3Days.frequency,
        },
        recommendationType: "GATHER_MORE_DATA",
        recommendationText: `Delivery data (₹${last3Days.spend} spend, ${last3Days.impressions} impressions) is below evaluation thresholds. Allow campaign to gather more data before optimizing.`,
      });

      return { status: "INSUFFICIENT_DATA", recommendation: rec };
    }

    // 2. High CPL Finding (> 1.5x Target)
    if (last3Days.cpl !== null && last3Days.cpl > targetCPL * 1.5) {
      const overPct = Math.round(((last3Days.cpl - targetCPL) / targetCPL) * 100);
      const rec = await this._createOrUpdateRecommendation({
        customerId,
        locationId: campaign.clientLocationId,
        campaignId: campaign._id,
        metaCampaignId: campaign.metaCampaignId,
        findingType: "CPL_ABOVE_TARGET",
        severity: "HIGH",
        confidence: "SUFFICIENT_DATA",
        evidenceSnapshot: {
          evaluationWindow: "LAST_3_DAYS",
          spend: last3Days.spend,
          impressions: last3Days.impressions,
          clicks: last3Days.clicks,
          leads: last3Days.leads,
          cpl: last3Days.cpl,
          targetCpl: targetCPL,
          ctr: last3Days.ctr,
          frequency: last3Days.frequency,
        },
        recommendationType: "REVIEW_TARGETING",
        recommendationText: `Last 3 Days: Spend ₹${last3Days.spend}, ${last3Days.leads} leads, CPL ₹${last3Days.cpl} (Target: ₹${targetCPL}, +${overPct}%). Recommendation: Review audience targeting and refresh creative before increasing spend.`,
      });

      return { status: "EVALUATED", finding: "CPL_ABOVE_TARGET", recommendation: rec };
    }

    // 3. Scale Winner Finding (CPL < 0.8x Target)
    if (last3Days.cpl !== null && last3Days.cpl < targetCPL * 0.8) {
      const savingsPct = Math.round(((targetCPL - last3Days.cpl) / targetCPL) * 100);
      const rec = await this._createOrUpdateRecommendation({
        customerId,
        locationId: campaign.clientLocationId,
        campaignId: campaign._id,
        metaCampaignId: campaign.metaCampaignId,
        findingType: "SCALE_WINNER",
        severity: "LOW",
        confidence: "SUFFICIENT_DATA",
        evidenceSnapshot: {
          evaluationWindow: "LAST_3_DAYS",
          spend: last3Days.spend,
          impressions: last3Days.impressions,
          clicks: last3Days.clicks,
          leads: last3Days.leads,
          cpl: last3Days.cpl,
          targetCpl: targetCPL,
          ctr: last3Days.ctr,
          frequency: last3Days.frequency,
        },
        recommendationType: "CONSIDER_BUDGET_INCREASE",
        recommendationText: `Last 3 Days: Spend ₹${last3Days.spend}, ${last3Days.leads} leads, CPL ₹${last3Days.cpl} (Target: ₹${targetCPL}, -${savingsPct}%). Campaign is performing efficiently. Consider budget scaling via manager approval.`,
      });

      return { status: "EVALUATED", finding: "SCALE_WINNER", recommendation: rec };
    }

    // 4. Healthy Performance
    const rec = await this._createOrUpdateRecommendation({
      customerId,
      locationId: campaign.clientLocationId,
      campaignId: campaign._id,
      metaCampaignId: campaign.metaCampaignId,
      findingType: "HEALTHY_PERFORMANCE",
      severity: "LOW",
      confidence: "SUFFICIENT_DATA",
      evidenceSnapshot: {
        evaluationWindow: "LAST_3_DAYS",
        spend: last3Days.spend,
        impressions: last3Days.impressions,
        clicks: last3Days.clicks,
        leads: last3Days.leads,
        cpl: last3Days.cpl,
        targetCpl: targetCPL,
        ctr: last3Days.ctr,
        frequency: last3Days.frequency,
      },
      recommendationType: "MAINTAIN_CURRENT_DELIVERY",
      recommendationText: `Last 3 Days: Spend ₹${last3Days.spend}, ${last3Days.leads} leads, CPL ₹${last3Days.cpl || "N/A"}. Performance is within acceptable target boundaries.`,
    });

    return { status: "EVALUATED", finding: "HEALTHY_PERFORMANCE", recommendation: rec };
  }

  async _createOrUpdateRecommendation(data) {
    const existing = await AdsPerformanceRecommendation.findOne({
      campaignId: data.campaignId,
      status: "OPEN",
    });

    if (existing) {
      existing.findingType = data.findingType;
      existing.severity = data.severity;
      existing.confidence = data.confidence;
      existing.evidenceSnapshot = data.evidenceSnapshot;
      existing.recommendationType = data.recommendationType;
      existing.recommendationText = data.recommendationText;
      return existing.save();
    }

    return AdsPerformanceRecommendation.create({
      recommendationId: `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...data,
    });
  }
}

module.exports = new AdPerformanceWatcherEngine();
