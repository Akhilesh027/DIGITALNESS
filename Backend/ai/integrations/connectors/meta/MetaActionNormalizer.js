/**
 * MetaActionNormalizer.js
 * Parses Meta Marketing API actions arrays and maps primary business results
 */

class MetaActionNormalizer {
  /**
   * Normalizes raw actions array and resolves campaign-specific result counts
   */
  normalizeActions({ rawActions = [], objective = "OUTCOME_LEADS", spend = 0 }) {
    const actionsByType = {};

    if (Array.isArray(rawActions)) {
      for (const item of rawActions) {
        if (item && item.action_type) {
          const val = Number(item.value) || 0;
          actionsByType[item.action_type] = val;
        }
      }
    }

    let results = null;
    let resultType = null;
    let costPerResult = null;

    const cleanObjective = String(objective || "OUTCOME_LEADS").toUpperCase();

    if (cleanObjective.includes("LEAD")) {
      // Prioritize explicit Meta Lead action types
      const leadTypes = [
        "lead",
        "onsite_conversion.lead_grouped",
        "leadgen_grouped",
        "contact",
        "submit_application",
      ];

      for (const type of leadTypes) {
        if (actionsByType[type] !== undefined) {
          results = actionsByType[type];
          resultType = type;
          break;
        }
      }

      if (results === null) {
        // Check if actions exist but none matched lead types
        if (Object.keys(actionsByType).length > 0) {
          resultType = "RESULT_ACTION_UNRESOLVED";
          results = null;
        } else {
          // Zero actions recorded by Meta
          results = 0;
          resultType = "lead";
        }
      }
    } else if (cleanObjective.includes("TRAFFIC")) {
      const trafficTypes = ["link_click", "landing_page_view", "post_engagement"];
      for (const type of trafficTypes) {
        if (actionsByType[type] !== undefined) {
          results = actionsByType[type];
          resultType = type;
          break;
        }
      }
      if (results === null) {
        results = actionsByType["link_click"] !== undefined ? actionsByType["link_click"] : 0;
        resultType = "link_click";
      }
    } else {
      resultType = "RESULT_ACTION_UNRESOLVED";
      results = null;
    }

    // Calculate safe Cost Per Result without division by zero
    if (results !== null && results > 0 && spend > 0) {
      costPerResult = Math.round(spend / results);
    }

    return {
      actionsByType,
      rawActions,
      results,
      resultType,
      costPerResult,
    };
  }
}

module.exports = new MetaActionNormalizer();
