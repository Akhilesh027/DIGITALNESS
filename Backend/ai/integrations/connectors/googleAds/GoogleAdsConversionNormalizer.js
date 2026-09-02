/**
 * GoogleAdsConversionNormalizer.js
 * Google Ads Conversion Action & Category Semantics Resolver
 * 
 * Strict Attribution Rules:
 * 1. Preserves official Google Ads conversion categories.
 * 2. Resolves primary business results (e.g. Leads vs Purchases) based on approved campaign objectives.
 * 3. Never counts Page Views or Outbound Clicks as Leads.
 */

const APPROVED_LEAD_CATEGORIES = [
  "SUBMIT_LEAD_FORM",
  "PHONE_CALL_LEAD",
  "QUALIFIED_LEAD",
  "CONVERTED_LEAD",
  "REQUEST_QUOTE",
  "BOOK_APPOINTMENT",
  "CONTACT",
];

const APPROVED_SALE_CATEGORIES = [
  "PURCHASE",
  "SIGNUP",
  "ECOMMERCE_TRANSACTION",
];

class GoogleAdsConversionNormalizer {
  /**
   * Normalizes raw conversion actions and calculates primary result count
   */
  normalizeConversions({ conversionData = [], objective = "LEADS", totalCost = 0 }) {
    const cleanObjective = String(objective || "LEADS").toUpperCase();
    const breakdown = [];
    let primaryResultCount = 0;
    let hasResolvedPrimaryCategory = false;

    for (const item of conversionData) {
      const category = (item.category || "UNKNOWN").toUpperCase();
      const actionName = item.actionName || "Google Ads Conversion";
      const count = Number(item.count || item.conversions || 0);

      let isPrimary = false;
      if (cleanObjective.includes("LEAD")) {
        isPrimary = APPROVED_LEAD_CATEGORIES.includes(category);
      } else if (cleanObjective.includes("SALE") || cleanObjective.includes("PURCHASE")) {
        isPrimary = APPROVED_SALE_CATEGORIES.includes(category);
      }

      if (isPrimary) {
        primaryResultCount += count;
        hasResolvedPrimaryCategory = true;
      }

      breakdown.push({
        actionName,
        category,
        count,
        isPrimary,
      });
    }

    const primaryResult = hasResolvedPrimaryCategory ? cleanObjective : null;
    const costPerPrimaryResult =
      primaryResultCount > 0 && totalCost > 0 ? Number((totalCost / primaryResultCount).toFixed(2)) : null;

    return {
      primaryResult,
      primaryResultCount,
      costPerPrimaryResult,
      conversionBreakdown: breakdown,
    };
  }
}

module.exports = new GoogleAdsConversionNormalizer();
