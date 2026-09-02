/**
 * AdsStrategyEngine.js
 * Advertising Strategy & Funnel Positioning Specialist.
 */

class AdsStrategyEngine {
  generateStrategy({ customer, location, parameters = {} }) {
    const industry = customer?.businessType || customer?.businessProfile?.industry || "Local Business";
    const clientName = customer?.companyName || customer?.name || "Client";
    const city = location?.city || customer?.city || "Local City";

    const platform = parameters.platform || (customer?.adsProfile?.monthlyGoogleBudget > 0 ? "Omnichannel" : "Meta");
    const rawObjective = (parameters.objective || customer?.adsProfile?.primaryCampaignGoals?.[0] || "LEAD_GENERATION").toUpperCase();

    let objective = "LEAD_GENERATION";
    let funnelStage = "Top of Funnel (Cold Acquisition & Local Discovery)";
    let primaryKPI = "Cost Per Qualified Lead (CPL)";
    let conversionType = parameters.conversionType || "INSTANT_FORM";

    if (rawObjective.includes("WHATSAPP")) {
      objective = "WHATSAPP_MESSAGES";
      funnelStage = "Direct High-Intent Conversion";
      primaryKPI = "Cost Per WhatsApp Conversation (CPMC)";
      conversionType = "WHATSAPP";
    } else if (rawObjective.includes("CALL")) {
      objective = "CALLS";
      funnelStage = "Direct Immediate Call Booking";
      primaryKPI = "Cost Per Call Booking (CPC)";
      conversionType = "PHONE_CALL";
    } else if (rawObjective.includes("TRAFFIC") || rawObjective.includes("WEBSITE")) {
      objective = "WEBSITE_TRAFFIC";
      funnelStage = "Middle of Funnel (Website Consideration & Booking)";
      primaryKPI = "Cost Per Outbound Click (CPC)";
      conversionType = "LANDING_PAGE";
    } else if (rawObjective.includes("AWARENESS") || rawObjective.includes("REACH")) {
      objective = "AWARENESS";
      funnelStage = "Top of Funnel (Brand Reach & Local Recall)";
      primaryKPI = "Cost Per 1,000 Impressions (CPM)";
      conversionType = "INSTANT_FORM";
    }

    let services = [];
    if (Array.isArray(parameters.promotedServices)) {
      services = parameters.promotedServices;
    } else if (typeof parameters.promotedServices === "string" && parameters.promotedServices) {
      services = [parameters.promotedServices];
    } else if (Array.isArray(customer?.adsProfile?.promotedServices) && customer.adsProfile.promotedServices.length > 0) {
      services = customer.adsProfile.promotedServices;
    } else if (Array.isArray(customer?.businessProfile?.services) && customer.businessProfile.services.length > 0) {
      services = customer.businessProfile.services.slice(0, 3);
    } else {
      services = [`Premium ${industry} Services`];
    }

    const coreMessage = `Highlighting premium quality, trusted local expertise, and seamless booking for ${clientName} across ${city}.`;

    return {
      platform,
      objective,
      funnelStage,
      conversionType,
      primaryKPI,
      services,
      coreMessage,
      recommendationSummary: `Targeted ${platform} campaign focused on high-intent ${services.join(", ")} prospects in ${city} with friction-free ${conversionType.replace("_", " ")} capture.`,
    };
  }
}

module.exports = new AdsStrategyEngine();
