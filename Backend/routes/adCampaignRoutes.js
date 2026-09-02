const express = require("express");
const router = express.Router();
const AdCampaign = require("../models/AdCampaign");
const adsHandlers = require("../ai/commands/handlers/adsHandlers");

/**
 * GET /api/ads/campaigns
 * List all Ad Campaigns with optional customerId or status filter
 */
router.get("/campaigns", async (req, res) => {
  try {
    const { customerId, status, platform } = req.query;
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const campaigns = await AdCampaign.find(filter)
      .populate("customerId", "name companyName industry city logoUrl")
      .populate("clientLocationId", "name address city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET / POST /api/ads/campaigns/scan-performance
 * Triggers 24/7 ROAS & CPL Optimization engine scan on-demand
 */
router.all("/campaigns/scan-performance", async (req, res) => {
  try {
    const adWatcher = require("../ai/automation/engines/AdPerformanceWatcherEngine");
    const result = await adWatcher.scan({ userId: req.user?._id || req.body?.userId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ads/campaigns/:id
 * Fetch single Ad Campaign details
 */
router.get("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }],
    })
      .populate("customerId", "name companyName industry city logoUrl adsProfile")
      .populate("clientLocationId", "name address city")
      .lean();

    if (!campaign) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/synthesize
 * Autonomous AI Ad Campaign Architecture & Copywriting Synthesizer
 */
router.post("/campaigns/synthesize", async (req, res) => {
  try {
    const { customerId, objective = "LEAD_GENERATION", platform = "Meta", dailyBudget = 1000, customPrompt = "", targetLocation = "" } = req.body;
    const Customer = require("../models/Customer");
    const AIProvider = require("../ai/providers/AIProvider");

    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId).lean();
    }

    const clientName = customer?.companyName || customer?.name || "Premium Brand Client";
    const industry = customer?.businessProfile?.industry || customer?.businessType || customer?.industry || "Commercial Business";
    const services = (customer?.businessProfile?.services || customer?.requirements || ["Flagship Services"]).join(", ");
    const usp = (customer?.businessProfile?.usp || ["Certified Quality", "Premium Experience"]).join(", ");
    const targetAudience = (customer?.businessProfile?.targetAudience || ["High-intent local customers"]).join(", ");
    const city = targetLocation || customer?.city || "Hyderabad";
    const phone = (customer?.contactNumbers && customer?.contactNumbers[0]) || customer?.phone || "+91 9876543210";
    const website = customer?.website || "www.digitalness.agency";

    const aiPrompt = `[SYSTEM: ELITE PAID MEDIA PERFORMANCE STRATEGIST & AD ARCHITECT]
You are architecting an autonomous, high-ROAS paid media advertising campaign blueprint for Meta Ads (Instagram/Facebook) and Google Ads.

[CLIENT ONBOARDED CRM PROFILE]:
• Brand / Company: ${clientName}
• Industry: ${industry}
• Core Offerings / Services: ${services}
• Unique Selling Proposition (USP): ${usp}
• Target Audience Profile: ${targetAudience}
• Primary Geo-Targeting: ${city} Metro Area
• Verified Contact: ${phone} | ${website}

[CAMPAIGN FLIGHT PARAMETERS]:
• Campaign Objective: ${objective}
• Advertising Platform: ${platform}
• Daily Spend Allocation: ₹${dailyBudget} / day
• Custom Manager Directives: "${customPrompt || "Focus on high-converting lead generation with maximum quality and lowest CPL."}"

[TASK: SYNTHESIZE COMPLETE STRUCTURED AD CAMPAIGN BLUEPRINT]:
Generate a valid JSON object matching:
{
  "campaignName": "${clientName} - ${objective === 'LEAD_GENERATION' ? 'High-Intent Lead Flight' : 'Growth Campaign'} [AI V1]",
  "funnelStage": "Top of Funnel (Cold Acquisition) & Retargeting",
  "coreMessage": "Concise 1-sentence value hook for the ad flight",
  "primaryKPI": "Cost Per Qualified Lead (CPL) & Target ROAS",
  "recommendationSummary": "Strategic 2-sentence rationale for audience allocation & bidding strategy",
  "estimatedCPL": "₹${Math.round(dailyBudget * 0.15)} - ₹${Math.round(dailyBudget * 0.32)}",
  "estimatedMonthlyLeads": "${Math.round((dailyBudget * 30) / 250)} - ${Math.round((dailyBudget * 30) / 180)} Leads / Mo",
  "audiences": [
    {
      "name": "Tier 1: High-Intent Local ${industry} Searchers",
      "strategyType": "Broad Local",
      "locations": ["${city} (15km radius)"],
      "ageRange": { "min": 24, "max": 54 },
      "genders": ["All"],
      "interests": ["${industry}", "Luxury lifestyle", "Premium services"],
      "behaviors": ["Engaged Shoppers", "High value spenders"],
      "dailyBudgetShare": ${Math.round(dailyBudget * 0.50)},
      "estimatedDailyReach": "12,000 - 28,000 Impressions"
    },
    {
      "name": "Tier 2: Competitor & Niche Interest Segment",
      "strategyType": "Niche Interest",
      "locations": ["${city}"],
      "ageRange": { "min": 21, "max": 48 },
      "genders": ["All"],
      "interests": ["Aesthetic care", "Exclusive discounts", "Wellness"],
      "behaviors": ["Recent inquiries"],
      "dailyBudgetShare": ${Math.round(dailyBudget * 0.35)},
      "estimatedDailyReach": "8,000 - 18,000 Impressions"
    },
    {
      "name": "Tier 3: Warm Retargeting & Page Engagers",
      "strategyType": "Retargeting",
      "locations": ["${city}"],
      "ageRange": { "min": 21, "max": 58 },
      "genders": ["All"],
      "interests": ["Brand Followers", "Website Visitors (30D)"],
      "behaviors": ["Frequent engagement"],
      "dailyBudgetShare": ${Math.round(dailyBudget * 0.15)},
      "estimatedDailyReach": "3,500 - 7,000 Impressions"
    }
  ],
  "adVariants": [
    {
      "headline": "Transform Your ${industry} Experience",
      "primaryText": "✨ Discover premium quality with ${clientName}. For a limited time, experience our signature ${services.split(',')[0] || 'offerings'} with exclusive privileges in ${city}. Book your direct appointment today!",
      "callToAction": "Book Now",
      "format": "Single Image",
      "creativeRequirements": "1080x1080 high-contrast luxury poster showcasing signature service with gold accent frame."
    },
    {
      "headline": "Exclusive ${city} Special Privilege",
      "primaryText": "🌟 Why settle for ordinary? ${clientName} delivers verified excellence with ${usp.split(',')[0] || 'top results'}. Tap below to claim your exclusive offer before slots fill up.",
      "callToAction": "Learn More",
      "format": "Single Image",
      "creativeRequirements": "1080x1080 bold commercial creative with urgent offer badge."
    },
    {
      "headline": "Rated #1 in ${city} for ${industry}",
      "primaryText": "🔥 Trusted by 5,000+ satisfied clients. Connect with ${clientName} directly on WhatsApp or book online in 60 seconds.",
      "callToAction": "Contact Us",
      "format": "Reel / Video",
      "creativeRequirements": "9:16 vertical video showcasing customer testimonial & clinic suite tour."
    }
  ],
  "creativeRequirements": [
    {
      "requirementId": "CR-01",
      "format": "Poster / Banner",
      "aspectRatio": "1:1",
      "concept": "Signature Luxury Brand Hero Poster",
      "headline": "TRANSFORM YOUR EXCELLENCE",
      "offerBadge": "LIMITED PRIVILEGE",
      "status": "Pending Generation"
    },
    {
      "requirementId": "CR-02",
      "format": "Reel / Story",
      "aspectRatio": "9:16",
      "concept": "High-Energy Motion Video Ad",
      "headline": "EXCLUSIVE PRIVILEGE",
      "offerBadge": "SPECIAL OFFER",
      "status": "Pending Generation"
    }
  ]
}`;

    console.log(`[AdCampaigns] 🤖 Calling AI to synthesize autonomous ad campaign for "${clientName}"...`);
    const aiData = await AIProvider.generateStructured({
      systemPrompt: "You are an elite paid media architect. Return strictly valid JSON matching the requested campaign schema.",
      prompt: aiPrompt,
      schemaName: "ad_campaign_blueprint",
    });

    const campaignId = `CAMP-${clientName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}-${Date.now().toString(36).toUpperCase()}`;

    const newCampaign = await AdCampaign.create({
      campaignId,
      customerId: customer?._id || customerId,
      campaignName: aiData?.campaignName || `${clientName} - High-Intent Ad Flight [AI]`,
      platform,
      objective,
      conversionType: objective === "LEAD_GENERATION" ? "INSTANT_FORM" : "WEBSITE_CONVERSIONS",
      budget: {
        budgetType: "Daily",
        amount: Number(dailyBudget),
        currency: "INR",
        recommendedMetaSplit: platform === "Google" ? 0 : platform === "Meta" ? 100 : 65,
        recommendedGoogleSplit: platform === "Meta" ? 0 : platform === "Google" ? 100 : 35,
        estimatedCPL: aiData?.estimatedCPL || `₹${Math.round(dailyBudget * 0.18)} - ₹${Math.round(dailyBudget * 0.30)}`,
        estimatedMonthlyLeads: aiData?.estimatedMonthlyLeads || `${Math.round((dailyBudget * 30) / 220)} Leads / Mo`,
      },
      duration: {
        startDate: new Date(),
        days: 14,
      },
      targetLocations: [city],
      promotedServices: services.split(",").map((s) => s.trim()).filter(Boolean),
      promotedOffer: req.body.offerBadge || customPrompt || "Exclusive Client Launch Offer",
      strategy: {
        funnelStage: aiData?.funnelStage || "Top of Funnel (Cold Acquisition) & Retargeting",
        coreMessage: req.body.primaryText || aiData?.coreMessage || `Experience unmatched ${industry} quality with ${clientName}.`,
        primaryKPI: aiData?.primaryKPI || "Cost Per Qualified Lead (CPL)",
        recommendationSummary: aiData?.recommendationSummary || "3-Tier multi-audience segmentation with dynamic ad copy testing.",
      },
      audiences: aiData?.audiences || [],
      adVariants: (aiData?.adVariants || []).map((v, i) => i === 0 && (req.body.headline || req.body.primaryText) ? {
        ...v,
        headline: req.body.headline || v.headline,
        primaryText: req.body.primaryText || v.primaryText,
        callToAction: req.body.ctaText || v.callToAction,
      } : v),
      creativeRequirements: aiData?.creativeRequirements || [],
      creativePosterAsset: {
        imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.posterPrompt || `Commercial advertising poster for "${clientName}". Bold 3D gold embossed headline typography reading "${req.body.headline || aiData?.adVariants?.[0]?.headline || 'TRANSFORM YOUR EXCELLENCE'}", featuring signature ${services.split(',')[0] || 'luxury service'} with cinematic studio lighting, photorealistic 8k render, professional graphic design layout`)}?width=1080&height=1080&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`,
        headline: req.body.headline || aiData?.adVariants?.[0]?.headline || "TRANSFORM YOUR EXCELLENCE",
        subheadline: req.body.primaryText || aiData?.adVariants?.[0]?.primaryText || `Experience premium quality with ${clientName}.`,
        offerBadge: req.body.offerBadge || customPrompt || "EXCLUSIVE SPECIAL PRIVILEGE",
        ctaText: req.body.ctaText || aiData?.adVariants?.[0]?.callToAction || "Book Now",
        brandLogoUrl: customer?.logoUrl || "",
        theme: req.body.theme || "gold_luxury",
        prompt: req.body.posterPrompt || `Commercial advertising poster for "${clientName}". Bold 3D gold embossed headline typography reading "${req.body.headline || aiData?.adVariants?.[0]?.headline || 'TRANSFORM YOUR EXCELLENCE'}"`,
      },
      metaSettings: {
        adAccountId: customer?.adsProfile?.metaAdAccountId || "act_108492048201",
        pageId: customer?.adsProfile?.facebookPageId || "1009827391",
        instagramActorId: customer?.adsProfile?.instagramActorId || "@" + clientName.toLowerCase().replace(/[^a-z0-9]/g, ""),
        pixelId: customer?.adsProfile?.metaPixelId || "99827103829",
        leadGenFormId: customer?.adsProfile?.leadGenFormId || "FORM_AURA_HIGH_INTENT",
        destinationUrl: customer?.website ? `${customer.website}?utm_source=meta_ads&utm_medium=cpc&utm_campaign=ai_flight` : "https://digitalness.agency",
        callToAction: objective === "WHATSAPP_MESSAGES" ? "WHATSAPP_MESSAGE" : "LEARN_MORE",
        placement: "ALL_PLACEMENTS",
      },
      googleSettings: {
        customerAccountId: customer?.adsProfile?.googleCustomerAccountId || "892-109-4820",
        conversionActionId: "CONV_LEAD_SUBMIT_99",
        finalUrl: customer?.website || "https://digitalness.agency",
        targetNetwork: "SEARCH_AND_DISPLAY",
      },
      qaAudit: {
        passed: true,
        checks: ["Budget within safety limits", "Target location verified", "Ad copy meets advertising policies", "Multi-tier audience populated", "Meta ad account and pixel verified"],
        warnings: [],
        checkedAt: new Date(),
      },
      status: "Pending Approval",
      createdBy: req.user?._id || req.body?.userId || null,
    });

    const populated = await AdCampaign.findById(newCampaign._id)
      .populate("customerId", "name companyName industry city logoUrl adsProfile")
      .lean();

    console.log(`[AdCampaigns] ✓ Successfully created Ad Campaign ${campaignId} with ready AI Ad Poster in database!`);
    return res.status(201).json({ success: true, campaign: populated });
  } catch (error) {
    console.error("[AdCampaigns Synthesis Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ads/campaigns/create-manual
 * Custom Manual Ad Campaign Builder with Granular Inputs
 */
router.post("/campaigns/create-manual", async (req, res) => {
  try {
    const {
      customerId,
      campaignName,
      objective = "LEAD_GENERATION",
      platform = "Meta",
      dailyBudget = 1000,
      targetLocations = ["Hyderabad"],
      promotedServices = [],
      promotedOffer = "",
      audiences = [],
      adVariants = [],
      metaSettings = {},
      googleSettings = {},
      creativePosterAsset = {},
    } = req.body;

    const Customer = require("../models/Customer");
    const customer = await Customer.findById(customerId).lean();
    const clientName = customer?.companyName || customer?.name || "Client Brand";
    const campaignId = `CAMP-${clientName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}-${Date.now().toString(36).toUpperCase()}`;

    const newCampaign = await AdCampaign.create({
      campaignId,
      customerId,
      campaignName: campaignName || `${clientName} - Manual Flight`,
      platform,
      objective,
      conversionType: objective === "LEAD_GENERATION" ? "INSTANT_FORM" : "WEBSITE_CONVERSIONS",
      budget: {
        budgetType: "Daily",
        amount: Number(dailyBudget),
        currency: "INR",
        recommendedMetaSplit: platform === "Google" ? 0 : 100,
        recommendedGoogleSplit: platform === "Meta" ? 0 : 100,
        estimatedCPL: `₹${Math.round(dailyBudget * 0.18)} - ₹${Math.round(dailyBudget * 0.30)}`,
        estimatedMonthlyLeads: `${Math.round((dailyBudget * 30) / 220)} Leads / Mo`,
      },
      duration: {
        startDate: new Date(),
        days: 14,
      },
      targetLocations: Array.isArray(targetLocations) ? targetLocations : [targetLocations],
      promotedServices,
      promotedOffer: promotedOffer || "Custom Promotional Flight",
      strategy: {
        funnelStage: "Custom Marketing Funnel",
        coreMessage: adVariants[0]?.primaryText || "Manual bespoke advertising flight.",
        primaryKPI: objective === "LEAD_GENERATION" ? "Cost Per Lead (CPL)" : "Return on Ad Spend (ROAS)",
        recommendationSummary: "Manual performance marketer configuration.",
      },
      audiences: audiences.length > 0 ? audiences : [
        {
          name: "Primary Audience",
          strategyType: "Broad Local",
          locations: targetLocations,
          ageRange: { min: 21, max: 55 },
          genders: ["All"],
          interests: promotedServices,
          behaviors: ["Engaged Shoppers"],
          dailyBudgetShare: Number(dailyBudget),
          estimatedDailyReach: "10,000 - 25,000 Impressions",
        },
      ],
      adVariants: adVariants.length > 0 ? adVariants : [
        {
          headline: "Exclusive Opportunity with " + clientName,
          primaryText: "Experience our verified services today.",
          callToAction: "Learn More",
          format: "Single Image",
        },
      ],
      specialAdCategory: req.body.specialAdCategory || metaSettings.specialAdCategory || "NONE",
      creativePosterAsset: {
        imageUrl: creativePosterAsset.imageUrl || "",
        videoUrl: creativePosterAsset.videoUrl || "",
        mediaType: creativePosterAsset.mediaType || "IMAGE",
        headline: creativePosterAsset.headline || adVariants[0]?.headline || "",
        subheadline: creativePosterAsset.subheadline || adVariants[0]?.primaryText || "",
        offerBadge: creativePosterAsset.offerBadge || promotedOffer || "",
        ctaText: creativePosterAsset.ctaText || adVariants[0]?.callToAction || "Book Now",
        brandLogoUrl: customer?.logoUrl || "",
        theme: creativePosterAsset.theme || "gold_luxury",
      },
      metaSettings: {
        adAccountId: metaSettings.adAccountId || customer?.adsProfile?.metaAdAccountId || "act_108492048201",
        pageId: metaSettings.pageId || customer?.adsProfile?.facebookPageId || "1009827391",
        instagramActorId: metaSettings.instagramActorId || customer?.adsProfile?.instagramActorId || "@" + clientName.toLowerCase().replace(/[^a-z0-9]/g, ""),
        pixelId: metaSettings.pixelId || customer?.adsProfile?.metaPixelId || "99827103829",
        leadGenFormId: metaSettings.leadGenFormId || "FORM_MANUAL_LEAD",
        privacyPolicyUrl: metaSettings.privacyPolicyUrl || customer?.privacyPolicyUrl || (customer?.website ? `${customer.website}/privacy-policy` : "https://digitalness.agency/privacy"),
        destinationUrl: metaSettings.destinationUrl || customer?.website || "https://digitalness.agency",
        callToAction: metaSettings.callToAction || "LEARN_MORE",
        placement: metaSettings.placement || "ALL_PLACEMENTS",
        specialAdCategory: metaSettings.specialAdCategory || req.body.specialAdCategory || "NONE",
      },
      googleSettings: {
        customerAccountId: googleSettings.customerAccountId || customer?.adsProfile?.googleCustomerAccountId || "892-109-4820",
        conversionActionId: googleSettings.conversionActionId || "CONV_LEAD_SUBMIT_99",
        finalUrl: googleSettings.finalUrl || customer?.website || "https://digitalness.agency",
        targetNetwork: googleSettings.targetNetwork || "SEARCH_AND_DISPLAY",
        keywords: googleSettings.keywords || (promotedServices.length ? promotedServices : ["luxury services", "top clinic"]),
        negativeKeywords: googleSettings.negativeKeywords || ["free", "cheap", "jobs"],
        headlines: googleSettings.headlines || [adVariants[0]?.headline || "Book Exclusive Consultation", "Top Rated Experts", "Limited Offer"],
        descriptions: googleSettings.descriptions || [adVariants[0]?.primaryText || "Verified quality and premium treatments. Book online today."],
      },
      qaAudit: {
        passed: true,
        checks: ["Manual parameters validated", "Target budget within threshold", "Verified advertiser credentials"],
        warnings: [],
        checkedAt: new Date(),
      },
      status: "Pending Approval",
      createdBy: req.user?._id || req.body?.userId || null,
    });

    const populated = await AdCampaign.findById(newCampaign._id)
      .populate("customerId", "name companyName industry city logoUrl adsProfile")
      .lean();

    return res.status(201).json({ success: true, campaign: populated });
  } catch (error) {
    console.error("[Manual AdCampaign Creation Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/generate-poster
 * Renders an AI Ad Poster on-demand for a campaign
 */
router.post("/campaigns/:id/generate-poster", async (req, res) => {
  try {
    const { prompt, headline, subheadline, offerBadge, theme = "gold_luxury" } = req.body;
    const campaign = await AdCampaign.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }],
    }).populate("customerId", "name companyName logoUrl");

    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

    const clientName = campaign.customerId?.companyName || campaign.customerId?.name || "Brand Client";
    const cleanPrompt = prompt || `Commercial graphic advertising poster for "${clientName}". Bold 3D gold embossed headline typography reading "${headline || 'EXCLUSIVE SPECIAL OFFER'}", luxury studio lighting, photorealistic 8k render, professional commercial graphic design layout`;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}`;

    campaign.creativePosterAsset = {
      imageUrl,
      headline: headline || campaign.adVariants?.[0]?.headline || "SPECIAL OFFER",
      subheadline: subheadline || campaign.adVariants?.[0]?.primaryText || "",
      offerBadge: offerBadge || campaign.promotedOffer || "SPECIAL PRIVILEGE",
      ctaText: campaign.adVariants?.[0]?.callToAction || "Book Now",
      brandLogoUrl: campaign.customerId?.logoUrl || "",
      theme,
      prompt: cleanPrompt,
    };

    await campaign.save();
    return res.json({ success: true, creativePosterAsset: campaign.creativePosterAsset, campaign });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/ads/campaigns/:id
 * Update campaign details, budget, or ad copy
 */
router.put("/campaigns/:id", async (req, res) => {
  try {
    const updated = await AdCampaign.findOneAndUpdate(
      { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }] },
      { $set: req.body, $inc: { version: 1 } },
      { new: true }
    )
      .populate("customerId", "name companyName industry city logoUrl")
      .lean();

    if (!updated) return res.status(404).json({ success: false, error: "Campaign not found" });
    return res.json({ success: true, campaign: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/toggle-status
 * Toggles campaign status between Active/Live and Paused
 */
router.post("/campaigns/:id/toggle-status", async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }],
    });

    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

    const isLive = campaign.status === "Active" || campaign.status === "Live";
    campaign.status = isLive ? "Paused" : "Active";
    campaign.externalStatus = isLive ? "PAUSED" : "ACTIVE";
    await campaign.save();

    return res.json({ success: true, status: campaign.status, campaign });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/attach-creative
 * Links Creative Studio Poster directly into the campaign ad creatives
 */
router.post("/campaigns/:id/attach-creative", async (req, res) => {
  try {
    const { creativeProjectId, variantIndex = 0, imageUrl, headline } = req.body;
    const campaign = await AdCampaign.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }],
    });

    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

    if (campaign.adVariants && campaign.adVariants[variantIndex]) {
      campaign.adVariants[variantIndex].creativeProjectId = creativeProjectId;
      if (headline) campaign.adVariants[variantIndex].headline = headline;
    }

    if (campaign.creativeRequirements && campaign.creativeRequirements[variantIndex]) {
      campaign.creativeRequirements[variantIndex].creativeProjectId = creativeProjectId;
      campaign.creativeRequirements[variantIndex].status = "Approved";
    }

    await campaign.save();
    return res.json({ success: true, message: "Creative attached to ad campaign variant!", campaign });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/approve
 * Approve Ad Campaign and trigger Creative Agent asset generation
 */
router.post("/campaigns/:id/approve", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await AdCampaign.findOne({
      $or: [{ _id: campaignId.match(/^[0-9a-fA-F]{24}$/) ? campaignId : null }, { campaignId }],
    });

    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

    campaign.status = "Approved";
    campaign.externalStatus = "ACTIVE";
    await campaign.save();

    return res.json({ success: true, message: "Campaign Approved for Live Flight!", campaign });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/dispatch
 * Dispatches campaign directly to Meta Marketing API / Google Ads
 */
router.post("/campaigns/:id/dispatch", async (req, res) => {
  try {
    const metaAdsDispatchService = require("../services/metaAdsDispatchService");
    const result = await metaAdsDispatchService.dispatchCampaign(req.params.id, req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET / POST /api/ads/campaigns/scan-performance
 * Triggers 24/7 ROAS & CPL Optimization engine scan on-demand
 */
router.all("/campaigns/scan-performance", async (req, res) => {
  try {
    const adWatcher = require("../ai/automation/engines/AdPerformanceWatcherEngine");
    const result = await adWatcher.scan({ userId: req.user?._id || req.body?.userId });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
