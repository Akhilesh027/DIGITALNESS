/**
 * AdsAgent.js
 * Master Advertising Specialist Agent for Digitalness AI Marketing OS.
 * Coordinates strategy, audience segmentation, budget optimization, copy variants,
 * campaign blueprint assembly, QA audits, and creative requirement handoffs.
 */

const BaseAgent = require("./BaseAgent");
const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const strategyEngine = require("./ads/AdsStrategyEngine");
const audiencePlanner = require("./ads/AudiencePlanner");
const budgetCalculator = require("./ads/BudgetCalculator");
const adsCopyEngine = require("./ads/AdsCopyEngine");
const campaignBuilder = require("./ads/CampaignBuilder");
const adsQAGuardian = require("./ads/AdsQAGuardian");

class AdsAgent extends BaseAgent {
  constructor() {
    super("AdsAgent");
  }

  /**
   * Generates complete structured Campaign Blueprint.
   */
  async generateCampaignPlan({ customerId, locationId = null, parameters = {}, userId = null }) {
    if (!customerId) {
      throw new Error("Customer ID is required to generate Ad Campaign.");
    }

    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      throw new Error(`Customer not found with ID: ${customerId}`);
    }

    let location = null;
    if (locationId) {
      location = await ClientLocation.findById(locationId).lean();
    } else {
      const locations = await ClientLocation.find({ customerId: customer._id, status: "Active" }).lean();
      if (locations.length > 0) location = locations[0];
    }

    // 1. Generate Strategy & Funnel Positioning
    const strategy = strategyEngine.generateStrategy({ customer, location, parameters });

    // 2. Generate Audience Targeting Tiers
    const audiences = audiencePlanner.generateAudiences({ customer, location, parameters });

    // 3. Calculate Budgets & Lead Projections
    const budget = budgetCalculator.calculateBudget({ customer, parameters });

    // 4. Generate Ad Copy Variants & Lead Form Specs
    const copyOutput = adsCopyEngine.generateCopyVariants({ customer, location, strategy, parameters });

    // 5. Assemble Full Campaign Blueprint
    const blueprint = campaignBuilder.buildBlueprint({
      customer,
      location,
      strategy,
      audiences,
      budget,
      copyOutput,
      parameters,
    });

    // 6. Run Pre-flight QA Checks
    const qaAudit = adsQAGuardian.validateCampaign(blueprint);
    blueprint.qaAudit = qaAudit;

    return blueprint;
  }

  /**
   * Legacy Phase 3 Agent execute wrapper for backward compatibility.
   */
  async execute(plan, ctx = {}) {
    const customerId = plan.customerId || ctx.customerId;
    const locationId = plan.locationId || ctx.locationId;
    return this.generateCampaignPlan({
      customerId,
      locationId,
      parameters: plan,
      userId: ctx.userId,
    });
  }
}

module.exports = new AdsAgent();
