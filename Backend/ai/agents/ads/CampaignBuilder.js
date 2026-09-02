/**
 * CampaignBuilder.js
 * Assembles unified Campaign Blueprints from Strategy, Audience, Budget, Copy, and Creative specs.
 */

class CampaignBuilder {
  buildBlueprint({ customer, location, strategy, audiences, budget, copyOutput, parameters = {} }) {
    const clientName = customer?.companyName || customer?.name || "Client";
    const campaignId = `camp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const platform = strategy.platform;
    const campaignName = `${clientName} — ${platform} ${strategy.objective.replace(/_/g, " ")} (${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })})`;

    // Generate Creative Requirements
    const rawFormats = parameters.creativeFormats;
    const requestedFormats = Array.isArray(rawFormats) && rawFormats.length
      ? rawFormats
      : typeof rawFormats === "string" && rawFormats
      ? [rawFormats]
      : ["Poster / Banner (1:1)", "Reel / Story (9:16)"];

    const creativeRequirements = [];

    if (requestedFormats.some((f) => f.includes("Poster") || f.includes("Banner") || f.includes("1:1"))) {
      creativeRequirements.push({
        requirementId: `req_poster_${Date.now()}`,
        format: "Poster / Banner",
        aspectRatio: "1:1",
        concept: `${clientName} Signature Service Promotional Banner`,
        headline: copyOutput.variants[0]?.headline || `Experience Premium Care at ${clientName}`,
        offerBadge: parameters.offerDetails || "Special Offer",
        status: "Pending Generation",
      });
    }

    if (requestedFormats.some((f) => f.includes("Reel") || f.includes("Story") || f.includes("9:16") || f.includes("Video"))) {
      creativeRequirements.push({
        requirementId: `req_reel_${Date.now()}`,
        format: "Reel / Story",
        aspectRatio: "9:16",
        concept: `${clientName} 3-Second Hook Video Reel with Sound Cue`,
        headline: copyOutput.variants[1]?.headline || `Top-Rated Care at ${clientName}`,
        offerBadge: parameters.offerDetails || "Limited Time Offer",
        status: "Pending Generation",
      });
    }

    if (requestedFormats.some((f) => f.includes("Carousel"))) {
      creativeRequirements.push({
        requirementId: `req_carousel_${Date.now()}`,
        format: "Carousel",
        aspectRatio: "1:1",
        concept: `Multi-Slide Service Breakdown for ${clientName}`,
        headline: `Explore All Services at ${clientName}`,
        offerBadge: "Swipe to Explore",
        status: "Pending Generation",
      });
    }

    return {
      campaignId,
      customerId: customer?._id,
      customerName: clientName,
      locationId: location?._id || null,
      locationName: location?.name || customer?.city || "Primary Branch",
      campaignName,
      platform,
      objective: strategy.objective,
      conversionType: strategy.conversionType,
      strategy: {
        funnelStage: strategy.funnelStage,
        coreMessage: strategy.coreMessage,
        primaryKPI: strategy.primaryKPI,
        recommendationSummary: strategy.recommendationSummary,
      },
      budget,
      audiences,
      adVariants: copyOutput.variants,
      leadFormSpec: copyOutput.leadFormSpec,
      creativeRequirements,
      status: "Pending Approval",
      version: 1,
      createdAt: new Date(),
    };
  }
}

module.exports = new CampaignBuilder();
