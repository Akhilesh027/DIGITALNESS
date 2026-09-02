/**
 * AudiencePlanner.js
 * Generates multi-tier audience targeting strategies for ad campaigns.
 */

class AudiencePlanner {
  generateAudiences({ customer, location, parameters = {} }) {
    const city = location?.city || customer?.city || "Hyderabad";
    const area = location?.name || location?.address || city;
    const industry = (customer?.businessType || customer?.businessProfile?.industry || "Beauty & Wellness").toLowerCase();

    let targetLocations = [];
    if (Array.isArray(parameters.targetLocations) && parameters.targetLocations.length) {
      targetLocations = parameters.targetLocations;
    } else if (typeof parameters.targetLocations === "string" && parameters.targetLocations) {
      targetLocations = [parameters.targetLocations];
    } else if (customer?.adsProfile?.targetLocations?.length) {
      targetLocations = customer.adsProfile.targetLocations;
    } else {
      targetLocations = [`${area} (+7 km radius)`];
    }

    const audiences = [];

    // 1. Broad Local Reach
    audiences.push({
      name: `Audience 1 — Broad Local (${city})`,
      strategyType: "Broad Local",
      locations: targetLocations,
      ageRange: { min: 21, max: 55 },
      genders: industry.includes("salon") || industry.includes("beauty") || industry.includes("women") ? ["Women", "All"] : ["All"],
      interests: ["Local community", "Special offers", "Top-rated local services"],
      behaviors: ["Active shoppers", "Mobile device users"],
      dailyBudgetShare: 40,
      estimatedDailyReach: "3,500 - 6,800 people",
    });

    // 2. Niche Interest & Category Intent
    let nicheInterests = ["Home Improvement", "Interior Design", "Architecture"];
    if (industry.includes("salon") || industry.includes("spa") || industry.includes("beauty")) {
      nicheInterests = ["Hair care", "Keratin treatment", "Skin care", "Beauty salons", "Day spas"];
    } else if (industry.includes("real estate") || industry.includes("property")) {
      nicheInterests = ["Real estate investment", "Gated communities", "Luxury apartments", "First-time buyers"];
    } else if (industry.includes("health") || industry.includes("clinic") || industry.includes("dental")) {
      nicheInterests = ["Health & wellness", "Personal care", "Dentistry", "Medical consultation"];
    } else if (industry.includes("food") || industry.includes("restaurant") || industry.includes("cafe")) {
      nicheInterests = ["Foodies", "Restaurants", "Fine dining", "Weekend dining"];
    }

    audiences.push({
      name: `Audience 2 — High-Intent Category Lovers`,
      strategyType: "Niche Interest",
      locations: targetLocations,
      ageRange: { min: 24, max: 50 },
      genders: ["All"],
      interests: nicheInterests,
      behaviors: ["High value goods shoppers", "Engaged shoppers"],
      dailyBudgetShare: 35,
      estimatedDailyReach: "2,200 - 4,500 people",
    });

    // 3. Luxury / Premium Aspiration
    audiences.push({
      name: `Audience 3 — Premium / High Purchasing Power`,
      strategyType: "Luxury / High Intent",
      locations: targetLocations,
      ageRange: { min: 26, max: 55 },
      genders: ["All"],
      interests: ["Luxury lifestyle", "Premium brands", "Executive lifestyle", ...nicheInterests.slice(0, 2)],
      behaviors: ["Frequent international travelers", "iOS / High-end Android users"],
      dailyBudgetShare: 25,
      estimatedDailyReach: "1,500 - 3,200 people",
    });

    return audiences;
  }
}

module.exports = new AudiencePlanner();
