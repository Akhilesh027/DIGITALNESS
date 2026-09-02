/**
 * MetaTargetingNormalizer.js
 * Deterministic Targeting & Objective Normalizer for Meta Marketing API
 */

const OBJECTIVE_MAP = {
  LEAD_GENERATION: "OUTCOME_LEADS",
  LEADS: "OUTCOME_LEADS",
  OUTCOME_LEADS: "OUTCOME_LEADS",
  TRAFFIC: "OUTCOME_TRAFFIC",
  OUTCOME_TRAFFIC: "OUTCOME_TRAFFIC",
  BRAND_AWARENESS: "OUTCOME_AWARENESS",
  AWARENESS: "OUTCOME_AWARENESS",
  OUTCOME_AWARENESS: "OUTCOME_AWARENESS",
  ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  OUTCOME_ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  SALES: "OUTCOME_SALES",
  CONVERSIONS: "OUTCOME_SALES",
  OUTCOME_SALES: "OUTCOME_SALES",
};

// Known Meta City Keys for prominent Indian tech and commercial hubs
const CITY_KEYS = {
  hyderabad: { key: "293140", name: "Hyderabad", country_code: "IN" },
  bengaluru: { key: "292415", name: "Bengaluru", country_code: "IN" },
  bangalore: { key: "292415", name: "Bengaluru", country_code: "IN" },
  mumbai: { key: "292714", name: "Mumbai", country_code: "IN" },
  delhi: { key: "292672", name: "Delhi", country_code: "IN" },
  chennai: { key: "292437", name: "Chennai", country_code: "IN" },
  pune: { key: "292755", name: "Pune", country_code: "IN" },
  kolkata: { key: "292723", name: "Kolkata", country_code: "IN" },
};

class MetaTargetingNormalizer {
  /**
   * Maps CRM objective to official Meta Outcome-Based Objective
   */
  mapObjective(objective) {
    const clean = String(objective || "LEAD_GENERATION")
      .toUpperCase()
      .replace(/[^A-Z_]/g, "");

    const mapped = OBJECTIVE_MAP[clean];
    if (!mapped) {
      console.warn(`[MetaTargetingNormalizer] Unknown objective '${objective}', defaulting to OUTCOME_LEADS`);
      return "OUTCOME_LEADS";
    }
    return mapped;
  }

  /**
   * Normalizes AudiencePlanner targeting parameters into Meta Graph API targeting schema
   */
  normalizeTargeting({
    locations = ["Hyderabad"],
    ageRange = { min: 21, max: 55 },
    genders = ["All"],
    interests = [],
    radiusKm = 25,
  }) {
    // 1. Geo Locations
    const cities = [];
    const countries = ["IN"];

    for (const loc of locations) {
      const locKey = String(loc).toLowerCase().trim();
      const cityMatch = CITY_KEYS[locKey];
      if (cityMatch) {
        cities.push({
          key: cityMatch.key,
          name: cityMatch.name,
          radius: radiusKm,
          distance_unit: "kilometer",
        });
      }
    }

    const geo_locations = cities.length > 0 ? { cities } : { countries };

    // 2. Genders
    let genderCodes = [1, 2]; // 1 = Male, 2 = Female
    if (genders.includes("Men") && !genders.includes("Women")) {
      genderCodes = [1];
    } else if (genders.includes("Women") && !genders.includes("Men")) {
      genderCodes = [2];
    }

    // 3. Age Range
    const age_min = Math.max(18, Number(ageRange?.min) || 21);
    const age_max = Math.min(65, Number(ageRange?.max) || 55);

    if (age_min > age_max) {
      const err = new Error(`TARGETING_INVALID: Minimum age (${age_min}) cannot exceed maximum age (${age_max}).`);
      err.code = "TARGETING_INVALID";
      throw err;
    }

    return {
      geo_locations,
      age_min,
      age_max,
      genders: genderCodes,
      publisher_platforms: ["facebook", "instagram"],
      facebook_positions: ["feed", "story"],
      instagram_positions: ["stream", "story", "reels"],
      device_platforms: ["mobile", "desktop"],
    };
  }

  /**
   * Validates Special Ad Categories
   */
  resolveSpecialAdCategories(category = "NONE") {
    const valid = ["NONE", "HOUSING", "EMPLOYMENT", "CREDIT", "ISSUES_ELECTIONS_POLITICS"];
    const clean = String(category || "NONE").toUpperCase();
    return valid.includes(clean) ? [clean] : ["NONE"];
  }
}

module.exports = new MetaTargetingNormalizer();
