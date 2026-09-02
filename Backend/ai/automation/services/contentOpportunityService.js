/**
 * contentOpportunityService.js
 * Industry & Seasonal Marketing Opportunities for dynamic autonomous content generation.
 */

const SEASONAL_OPPORTUNITIES = [
  // Salon & Beauty
  {
    slug: "monsoon-hair-care",
    title: "Monsoon Frizz Control & Hair Fall Care",
    industries: ["SALON", "SPA", "BEAUTY"],
    activeMonths: [6, 7, 8, 9],
    objective: "Educate & Drive Hair Spa Treatments",
    headlines: [
      "Say Goodbye to Monsoon Frizz with Keratin & Botoplex",
      "Rainy Days, Flawless Hair: Top 3 Monsoon Styling Secrets",
      "Don't Let Humidity Ruin Your Vibe: Book a Nourishing Hair Spa",
    ],
    ideas: ["Frizz control tips", "Humidity hair spa", "Hair fall prevention", "Balayage highlight trend"],
    preferredContentType: "SOCIAL_POST",
  },
  {
    slug: "wedding-bridal-season",
    title: "Bridal Glow & Wedding Makeover Specials",
    industries: ["SALON", "SPA", "JEWELRY", "HOSPITALITY", "BANQUET"],
    activeMonths: [10, 11, 12, 1, 2],
    objective: "Drive High-Value Bridal & Groom Packages",
    headlines: [
      "Be the Showstopper: Premium Bridal Makeover Packages Now Open",
      "From Haldi to Reception: Curated Looks for the Modern Bride",
      "Pre-Bridal Skin & Hair Transformation: Start 30 Days Early",
    ],
    ideas: ["Bridal makeup", "Groom makeover", "Pre-bridal packages", "Airbrush vs HD makeup"],
    preferredContentType: "CAROUSEL",
  },
  {
    slug: "weekend-pamper-offer",
    title: "Weekend Self-Care & Pamper Indulgence",
    industries: ["SALON", "SPA"],
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    objective: "Drive Saturday & Sunday Slot Bookings",
    headlines: [
      "Your Weekend Recharge Starts Here: Flat 20% Off Pamper Combos",
      "Weekend Glow Goals: Pedicure + Facial + Hair Spa Under One Roof",
    ],
    ideas: ["Weekend special combo", "Relaxing head massage", "Glow facial"],
    preferredContentType: "REEL",
  },

  // Furniture & Home Decor
  {
    slug: "festive-home-makeover",
    title: "Diwali & Festive Home Furniture Upgrade",
    industries: ["FURNITURE", "RETAIL", "INTERIOR"],
    activeMonths: [9, 10, 11],
    objective: "Drive Living & Dining Room Purchases",
    headlines: [
      "Welcome Guests in Style: Handcrafted Sofas & Dining Sets",
      "Festive Living Room Transformation: Up to 35% Off Luxury Recliners",
    ],
    ideas: ["Solid teakwood dining", "Space saving modular sofa", "Festive discounts"],
    preferredContentType: "SOCIAL_POST",
  },

  // Banquets & Hospitality
  {
    slug: "corporate-events-banquet",
    title: "Corporate Meets & Milestone Celebrations",
    industries: ["HOSPITALITY", "BANQUET"],
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    objective: "Generate Corporate Event Leads",
    headlines: [
      "Host Impactful Corporate Summits with World-Class Amenities",
      "Celebrate Company Milestones in Luxury: 500+ Guest Capacity",
    ],
    ideas: ["AV enabled conference halls", "Curated buffet catering", "Seamless parking"],
    preferredContentType: "SOCIAL_POST",
  },
];

class ContentOpportunityService {
  /**
   * Retrieves matching seasonal & industry opportunities for a target month and industry.
   */
  getOpportunitiesForClient({ industry = "GENERAL", month = new Date().getMonth() + 1 }) {
    const indUpper = String(industry || "").toUpperCase();

    return SEASONAL_OPPORTUNITIES.filter((opp) => {
      const monthMatch = opp.activeMonths.includes(month);
      const indMatch =
        opp.industries.includes("ALL") ||
        opp.industries.includes(indUpper) ||
        (indUpper.includes("SALON") && opp.industries.includes("SALON")) ||
        (indUpper.includes("FURNITURE") && opp.industries.includes("FURNITURE")) ||
        (indUpper.includes("BANQUET") && opp.industries.includes("BANQUET"));

      return monthMatch && indMatch;
    });
  }
}

module.exports = new ContentOpportunityService();
