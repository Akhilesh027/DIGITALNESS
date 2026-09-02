/**
 * ClientHealthScoreEngine.js
 * Computes deterministic, explainable client health score (0-100) across
 * Content Delivery, Lead Performance, Ads Efficiency, and Operational Quality.
 */

class ClientHealthScoreEngine {
  /**
   * Evaluates client health score based on computed domain metrics
   */
  calculateHealthScore({
    contentDeliveryRate = 100,
    hasAds = false,
    adsEfficiencyScore = 100,
    leadConversionRate = 10,
    reviewReplyRate = 100,
    slaComplianceRate = 100,
    hasGaps = false,
  }) {
    let contentScore = Math.min(100, Math.max(0, contentDeliveryRate));
    if (hasGaps) contentScore = Math.max(50, contentScore - 15);

    let leadScore = Math.min(100, Math.max(0, leadConversionRate * 5)); // 20% conversion = 100
    let operationalScore = Math.round((reviewReplyRate * 0.5) + (slaComplianceRate * 0.5));

    let finalScore = 0;
    const weights = {};

    if (hasAds) {
      weights.content = 0.35;
      weights.leads = 0.25;
      weights.ads = 0.20;
      weights.operations = 0.20;

      finalScore = Math.round(
        contentScore * weights.content +
        leadScore * weights.leads +
        adsEfficiencyScore * weights.ads +
        operationalScore * weights.operations
      );
    } else {
      // Dynamic reweighting when client has no paid ads
      weights.content = 0.45;
      weights.leads = 0.30;
      weights.ads = 0.00;
      weights.operations = 0.25;

      finalScore = Math.round(
        contentScore * weights.content +
        leadScore * weights.leads +
        operationalScore * weights.operations
      );
    }

    let status = "ON_TRACK";
    if (finalScore < 60) {
      status = "AT_RISK";
    } else if (finalScore < 80) {
      status = "ATTENTION_NEEDED";
    }

    return {
      score: finalScore,
      status,
      breakdown: {
        contentDelivery: { score: contentScore, weight: weights.content },
        leadPerformance: { score: leadScore, weight: weights.leads },
        adsEfficiency: { score: hasAds ? adsEfficiencyScore : null, weight: weights.ads, active: hasAds },
        operationalQuality: { score: operationalScore, weight: weights.operations },
      },
    };
  }
}

module.exports = new ClientHealthScoreEngine();
