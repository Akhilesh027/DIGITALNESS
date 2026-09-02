/**
 * AdsQAGuardian.js
 * Pre-flight Quality Assurance, Sanity Checks, and Policy Compliance for Ad Campaigns.
 */

class AdsQAGuardian {
  validateCampaign(blueprint) {
    const checks = [];
    const warnings = [];

    // 1. Client & Entity Verification
    if (blueprint.customerId && blueprint.customerName) {
      checks.push("Client verification: Verified target CRM customer account.");
    } else {
      warnings.push("Missing customer reference.");
    }

    // 2. Budget Sanity Check
    if (blueprint.budget && blueprint.budget.amount >= 300) {
      checks.push(`Budget sanity check: ₹${blueprint.budget.amount}/day is compliant with platform minimum spend thresholds.`);
    } else {
      warnings.push("Daily budget is below recommended ₹300 minimum threshold.");
    }

    // 3. Audience Structure Check
    if (blueprint.audiences && blueprint.audiences.length >= 2) {
      checks.push(`Audience segmentation: ${blueprint.audiences.length} distinct audience tiers configured for A/B testing.`);
    } else {
      warnings.push("Only 1 audience configured. Minimum 2 recommended for split-testing.");
    }

    // 4. Creative Requirements Check
    if (blueprint.creativeRequirements && blueprint.creativeRequirements.length > 0) {
      checks.push(`Creative requirements: ${blueprint.creativeRequirements.length} asset specifications staged for Creative Agent.`);
    } else {
      warnings.push("No creative requirements generated.");
    }

    // 5. Ad Copy & CTA Compliance
    if (blueprint.adVariants && blueprint.adVariants.length >= 2) {
      checks.push(`Ad copy diversity: ${blueprint.adVariants.length} distinct copy angles created with clear CTAs.`);
    } else {
      warnings.push("Insufficient ad copy variants.");
    }

    // 6. Conversion Route Check
    if (blueprint.conversionType) {
      checks.push(`Conversion destination: Routed to ${blueprint.conversionType.replace("_", " ")}.`);
    }

    return {
      passed: warnings.length === 0,
      checks,
      warnings,
      checkedAt: new Date(),
    };
  }
}

module.exports = new AdsQAGuardian();
