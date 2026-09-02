/**
 * GoogleAdsPerformanceWatcherEngine.js
 * Evidence-Based Recommendation Engine for Google Ads (100% Read-Only)
 * 
 * Strict Governance Rules:
 * 1. Consumes normalized stored snapshots only.
 * 2. Enforces Insufficient-Data Guard before evaluating metrics.
 * 3. ZERO autonomous mutations (no budget adjustments, no auto negative keyword insertion).
 */

const GoogleAdsInsightSnapshot = require("../../../models/GoogleAdsInsightSnapshot");
const AdsPerformanceRecommendation = require("../../../models/AdsPerformanceRecommendation");

class GoogleAdsPerformanceWatcherEngine {
  /**
   * Evaluates performance snapshots and generates evidence-backed recommendations
   */
  async evaluate({ customerId, locationId = null, googleAdsCustomerId, targetCostPerLead = 250 }) {
    const snapshots = await GoogleAdsInsightSnapshot.find({
      customerId,
      googleAdsCustomerId,
    });

    const recommendations = [];

    // 1. Evaluate Campaign Level
    const campaignSnapshots = snapshots.filter((s) => s.level === "CAMPAIGN");
    for (const snap of campaignSnapshots) {
      // Insufficient data guard
      if (snap.impressions < 100 || snap.clicks < 10) {
        continue;
      }

      if (snap.primaryResultCount > 0 && snap.costPerPrimaryResult) {
        if (snap.costPerPrimaryResult > targetCostPerLead * 1.5) {
          const rec = await AdsPerformanceRecommendation.create({
            customerId,
            locationId,
            platform: "GoogleAds",
            campaignId: snap.campaignId,
            recommendationType: "COST_PER_RESULT_ABOVE_TARGET",
            urgency: "MEDIUM",
            summary: `Google Search CPL (₹${snap.costPerPrimaryResult}) is above target (₹${targetCostPerLead}).`,
            evidence: {
              metricWindow: "LAST_7_DAYS",
              observedCostPerResult: snap.costPerPrimaryResult,
              targetCostPerResult: targetCostPerLead,
              totalSpend: snap.cost,
              totalResults: snap.primaryResultCount,
              impressions: snap.impressions,
              clicks: snap.clicks,
              ctr: snap.ctr,
            },
            suggestedAction: "Review search terms, negative keywords, and ad copy before adjusting budget.",
            isAutonomousActionAllowed: false,
          });
          recommendations.push(rec);
        } else {
          const rec = await AdsPerformanceRecommendation.create({
            customerId,
            locationId,
            platform: "GoogleAds",
            campaignId: snap.campaignId,
            recommendationType: "COST_PER_RESULT_HEALTHY",
            urgency: "LOW",
            summary: `Google Search CPL (₹${snap.costPerPrimaryResult}) is performing efficiently within target (₹${targetCostPerLead}).`,
            evidence: {
              metricWindow: "LAST_7_DAYS",
              observedCostPerResult: snap.costPerPrimaryResult,
              targetCostPerResult: targetCostPerLead,
              totalSpend: snap.cost,
              totalResults: snap.primaryResultCount,
            },
            suggestedAction: "Maintain current keyword bids and monitor search term query volume.",
            isAutonomousActionAllowed: false,
          });
          recommendations.push(rec);
        }
      }
    }

    // 2. Evaluate Search Term Level (Search Term Waste & Opportunities)
    const searchTermSnapshots = snapshots.filter((s) => s.level === "SEARCH_TERM");
    for (const st of searchTermSnapshots) {
      if (st.clicks >= 20 && st.cost >= 500 && st.primaryResultCount === 0) {
        const wasteRec = await AdsPerformanceRecommendation.create({
          customerId,
          locationId,
          platform: "GoogleAds",
          campaignId: st.campaignId,
          recommendationType: "SEARCH_TERM_WASTE_DETECTED",
          urgency: "HIGH",
          summary: `Search term "${st.searchTerm}" spent ₹${st.cost} with 0 leads.`,
          evidence: {
            searchTerm: st.searchTerm,
            clicks: st.clicks,
            cost: st.cost,
            primaryResultCount: 0,
          },
          suggestedAction: `Review "${st.searchTerm}" as a potential negative keyword candidate.`,
          isAutonomousActionAllowed: false,
        });
        recommendations.push(wasteRec);
      } else if (st.primaryResultCount >= 5 && st.costPerPrimaryResult && st.costPerPrimaryResult < targetCostPerLead) {
        const oppRec = await AdsPerformanceRecommendation.create({
          customerId,
          locationId,
          platform: "GoogleAds",
          campaignId: st.campaignId,
          recommendationType: "SEARCH_TERM_OPPORTUNITY",
          urgency: "LOW",
          summary: `High-converting search term "${st.searchTerm}" generated ${st.primaryResultCount} leads at ₹${st.costPerPrimaryResult}/lead.`,
          evidence: {
            searchTerm: st.searchTerm,
            clicks: st.clicks,
            cost: st.cost,
            primaryResultCount: st.primaryResultCount,
            costPerPrimaryResult: st.costPerPrimaryResult,
          },
          suggestedAction: `Consider adding "${st.searchTerm}" as an exact match targeted keyword.`,
          isAutonomousActionAllowed: false,
        });
        recommendations.push(oppRec);
      }
    }

    return recommendations;
  }
}

module.exports = new GoogleAdsPerformanceWatcherEngine();
