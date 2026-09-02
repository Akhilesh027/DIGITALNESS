/**
 * SEOAgent.js
 * Specialist agent for Search Engine Optimization strategy and keyword ideas (Draft Mode Only).
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");

class SEOAgent extends BaseAgent {
  constructor() {
    super("SEOAgent");
  }

  async execute(plan, ctx = {}) {
    const seoContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "SEO",
    });

    const clientName = seoContext.clientIdentity?.companyName || seoContext.clientIdentity?.name || "Client";
    const city = seoContext.clientIdentity?.city || "Hyderabad";

    return {
      agentTarget: "SEO Agent (Draft Mode)",
      seoStrategy: `Local SEO Optimization Plan for ${clientName}`,
      website: seoContext.seoStrategy?.website || "Not Configured",
      recommendedKeywords: [
        `Best Salon in ${city}`,
        `Top Haircut ${city}`,
        `Luxury Beauty Services ${city}`,
        `${clientName} Ameenpur`,
      ],
      landingPageRecommendations: [
        `Create dedicated landing page for Hair Services in ${city}`,
        `Optimize GMB listing with primary category and service areas`,
      ],
      restrictionsNote: "Draft Mode Only: No Search Console or website edits performed.",
    };
  }
}

module.exports = new SEOAgent();
