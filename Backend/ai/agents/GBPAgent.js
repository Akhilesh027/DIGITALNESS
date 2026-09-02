/**
 * GBPAgent.js
 * Specialist agent for Google Business Profile posts and review replies (Draft Mode Only).
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");

class GBPAgent extends BaseAgent {
  constructor() {
    super("GBPAgent");
  }

  async execute(plan, ctx = {}) {
    const gbpContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "GBP",
    });

    const locationName = gbpContext.gbpStrategy?.locationName || "Location";

    return {
      agentTarget: "Google Business Profile Agent (Draft Mode)",
      postDraft: {
        title: `Visit ${locationName} This Week!`,
        body: `We are open and ready to serve you! Stop by at ${gbpContext.gbpStrategy?.address || "our center"} or call us to reserve your slot.`,
        ctaType: "BOOK",
      },
      reviewReplyDrafts: [
        { rating: 5, draft: `Thank you so much for your 5-star review! We loved serving you at ${locationName}.` },
        { rating: 4, draft: `Thank you for your valuable feedback! We're constantly striving to deliver 5-star experiences.` },
      ],
      restrictionsNote: "Draft Mode Only: No Google Business Profile publishing performed.",
    };
  }
}

module.exports = new GBPAgent();
