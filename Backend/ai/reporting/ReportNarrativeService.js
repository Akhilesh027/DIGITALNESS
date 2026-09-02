/**
 * ReportNarrativeService.js
 * Generates grounded executive summaries, highlights, risks, and next-month actions
 * strictly from computed structured metrics with zero hallucinated figures.
 */

class ReportNarrativeService {
  /**
   * Generates grounded executive narrative
   */
  generateExecutiveNarrative({
    clientName,
    periodLabel,
    contentDeliveryRate,
    publishedCount,
    metaSpend,
    metaPrimaryResults,
    metaCPL,
    totalLeads,
    qualifiedLeads,
    wonLeads,
    reviewCount,
    avgRating,
    replyRate,
    healthScore,
    gaps = [],
  }) {
    const highlights = [];
    const risks = [];
    const recommendations = [];

    // Content Delivery Insights
    if (contentDeliveryRate >= 90) {
      highlights.push(`Content delivery achieved ${contentDeliveryRate}% with ${publishedCount} published deliverables.`);
    } else {
      risks.push(`Content delivery is at ${contentDeliveryRate}% (${publishedCount} published); delivery pace is behind schedule.`);
      recommendations.push({
        title: "Accelerate Content Approvals",
        domain: "CONTENT",
        severity: "HIGH",
        evidence: `Delivery rate currently at ${contentDeliveryRate}% with ${gaps.length} detected gaps.`,
        recommendedAction: "Review pending content in Marketing Calendar and fast-track manager approvals.",
      });
    }

    // Paid Ads Insights
    if (metaSpend > 0 && metaPrimaryResults > 0) {
      highlights.push(`Meta Ads generated ${metaPrimaryResults} primary leads at ₹${Math.round(metaCPL)} CPL from ₹${metaSpend.toLocaleString()} spend.`);
    } else if (metaSpend > 0 && metaPrimaryResults === 0) {
      risks.push(`Meta Ads spent ₹${metaSpend.toLocaleString()} without recorded lead conversions.`);
      recommendations.push({
        title: "Meta Ads Audience & Creative Refresh",
        domain: "ADS",
        severity: "HIGH",
        evidence: `₹${metaSpend.toLocaleString()} spent with 0 primary leads.`,
        recommendedAction: "Audit campaign targeting, ad creative fatigue, and landing page form fields.",
      });
    }

    // Lead Pipeline Insights
    if (totalLeads > 0) {
      highlights.push(`Ingested ${totalLeads} total leads with ${qualifiedLeads} qualified and ${wonLeads} won.`);
    }

    // Reputation Insights
    if (reviewCount > 0) {
      highlights.push(`Maintained an average Google rating of ${avgRating.toFixed(1)}⭐ across ${reviewCount} reviews with ${replyRate}% reply rate.`);
    }

    // Summary paragraph strictly grounded in numbers
    const summaryText = `${clientName} recorded a health score of ${healthScore.score}/100 (${healthScore.status.replace("_", " ")}) for ${periodLabel}. Key results include ${publishedCount} content deliverables published (${contentDeliveryRate}% delivery rate)${metaSpend > 0 ? `, ${metaPrimaryResults} Meta leads generated at ₹${Math.round(metaCPL)} CPL` : ""}, and ${totalLeads} total inbound leads ingested across active channels.`;

    return {
      summaryText,
      highlights,
      risks,
      recommendations,
    };
  }
}

module.exports = new ReportNarrativeService();
