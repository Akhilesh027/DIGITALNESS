const express = require("express");
const router = express.Router();
const AdCampaign = require("../models/AdCampaign");
const { protect, scopeAds, scopeCampaign } = require('../middleware/adCampaignAccess');
const { editableUpdates, campaignError } = require('../services/adCampaignPolicy');
router.use(protect, scopeAds);
router.use('/campaigns/:id', (req, res, next) => ['scan-performance', 'synthesize', 'create-manual'].includes(req.params.id) ? next() : scopeCampaign(req, res, next));
router.use('/campaigns/:id', (req, res, next) => {
  if (['PUT', 'POST'].includes(req.method) && req.adCampaign?.dispatchLockAt) return res.status(409).json({ success: false, error: 'A platform operation is in progress. Refresh before making changes.' });
  if (['PUT', 'POST'].includes(req.method) && !['dispatch', 'toggle-status'].includes(req.path.split('/').filter(Boolean).pop()) && req.adCampaign?.metaCampaignId) {
    return res.status(409).json({ success: false, error: 'This blueprint has already been created on Meta. Create a new draft to change its configuration.' });
  }
  next();
});

/**
 * GET /api/ads/campaigns
 * List all Ad Campaigns with optional customerId or status filter
 */
router.get("/campaigns", async (req, res) => {
  try {
    const { customerId, status, platform } = req.query;
    const filter = { ...req.adsFilter };
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
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET / POST /api/ads/campaigns/scan-performance
 * Triggers 24/7 ROAS & CPL Optimization engine scan on-demand
 */
router.post("/campaigns/scan-performance", async (req, res) => {
  try {
    const adWatcher = require("../ai/automation/engines/AdPerformanceWatcherEngine");
    const campaigns = await AdCampaign.find({ ...req.adsFilter, platform: 'Meta', status: { $in: ['Active', 'Live', 'Paused'] } }).lean();
    const results = await Promise.allSettled(campaigns.map(c => adWatcher.evaluateCampaign({ adCampaignId: c._id, customerId: c.customerId })));
    res.json({ success: true, scanned: campaigns.length, evaluated: results.filter(r => r.status === 'fulfilled' && ['EVALUATED', 'HEALTHY'].includes(r.value.status)).length, noData: results.filter(r => r.status === 'fulfilled' && ['NO_DATA', 'INSUFFICIENT_DATA'].includes(r.value.status)).length, failed: results.filter(r => r.status === 'rejected').length });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
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
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
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

    const clientName = customer?.name || customer?.companyName || "Premium Brand Client";
    const industry = customer?.businessProfile?.industry || customer?.businessType || customer?.industry || "Commercial Business";
    const services = (customer?.businessProfile?.services || customer?.requirements || ["Flagship Services"]).join(", ");
    const usp = (customer?.businessProfile?.usp || ["Customer service", "Personal support"]).join(", ");
    const targetAudience = (customer?.businessProfile?.targetAudience || ["High-intent local customers"]).join(", ");
    const city = targetLocation || customer?.city || "Hyderabad";
    const phone = (customer?.contactNumbers && customer?.contactNumbers[0]) || customer?.phone || "";
    const website = customer?.website || "";

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
      "headline": "Explore ${industry} in ${city}",
      "primaryText": "🔥 Discover our services. Connect with ${clientName} directly on WhatsApp or book online in 60 seconds.",
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
      systemPrompt: "You are a paid media planner. Use only supplied client facts. Do not invent certifications, rankings, customer counts, discounts or testimonials. Return strictly valid JSON matching the requested campaign schema.",
      prompt: aiPrompt,
      schemaName: "ad_campaign_blueprint",
    });
    if (!aiData || !Array.isArray(aiData.adVariants) || !aiData.adVariants.length || !Array.isArray(aiData.audiences) || !aiData.audiences.length) {
      throw campaignError('AI did not return a valid campaign blueprint. Retry generation or use the manual builder.', 502);
    }

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
        days: Math.max(1, Math.min(365, Number(req.body.duration?.days || req.body.durationDays) || 14)),
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
        adAccountId: customer?.adsProfile?.metaAdAccountId || "",
        pageId: customer?.adsProfile?.facebookPageId || "",
        instagramActorId: customer?.adsProfile?.instagramActorId || "",
        pixelId: customer?.adsProfile?.metaPixelId || "",
        leadGenFormId: customer?.adsProfile?.leadGenFormId || "",
        destinationUrl: customer?.website ? `${customer.website}?utm_source=meta_ads&utm_medium=cpc&utm_campaign=ai_flight` : "",
        callToAction: objective === "WHATSAPP_MESSAGES" ? "WHATSAPP_MESSAGE" : "LEARN_MORE",
        placement: "ALL_PLACEMENTS",
      },
      googleSettings: {
        customerAccountId: customer?.adsProfile?.googleCustomerAccountId || "",
        conversionActionId: "",
        finalUrl: customer?.website || "",
        targetNetwork: "SEARCH_AND_DISPLAY",
      },
      qaAudit: {
        passed: false,
        checks: [],
        warnings: ["Draft requires account, creative and targeting review before platform creation."],
        checkedAt: new Date(),
      },
      status: "Pending Approval",
      createdBy: req.user._id,
    });

    const populated = await AdCampaign.findById(newCampaign._id)
      .populate("customerId", "name companyName industry city logoUrl adsProfile")
      .lean();

    console.log(`[AdCampaigns] ✓ Successfully created Ad Campaign ${campaignId} with ready AI Ad Poster in database!`);
    return res.status(201).json({ success: true, campaign: populated });
  } catch (error) {
    console.error("[AdCampaigns Synthesis Error]:", error);
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ads/campaigns/create-manual
 * Custom Manual Ad Campaign Builder with Granular Inputs
 */
router.post("/campaigns/create-manual", async (req, res) => {
  try {
    if (!Array.isArray(req.body.adVariants) || !req.body.adVariants.length || req.body.adVariants.some(v => !v.headline?.trim() || !v.primaryText?.trim())) throw campaignError('Add a headline and primary text for each ad variant.');
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
    const clientName = customer?.name || customer?.companyName || "Client Brand";
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
        days: Math.max(1, Math.min(365, Number(req.body.duration?.days || req.body.durationDays) || 14)),
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
        adAccountId: metaSettings.adAccountId || customer?.adsProfile?.metaAdAccountId || "",
        pageId: metaSettings.pageId || customer?.adsProfile?.facebookPageId || "",
        instagramActorId: metaSettings.instagramActorId || customer?.adsProfile?.instagramActorId || "",
        pixelId: metaSettings.pixelId || customer?.adsProfile?.metaPixelId || "",
        leadGenFormId: metaSettings.leadGenFormId || "",
        privacyPolicyUrl: metaSettings.privacyPolicyUrl || customer?.privacyPolicyUrl || (customer?.website ? `${customer.website}/privacy-policy` : ""),
        destinationUrl: metaSettings.destinationUrl || customer?.website || "",
        callToAction: metaSettings.callToAction || "LEARN_MORE",
        placement: metaSettings.placement || "ALL_PLACEMENTS",
        specialAdCategory: metaSettings.specialAdCategory || req.body.specialAdCategory || "NONE",
      },
      googleSettings: {
        customerAccountId: googleSettings.customerAccountId || customer?.adsProfile?.googleCustomerAccountId || "",
        conversionActionId: googleSettings.conversionActionId || "",
        finalUrl: googleSettings.finalUrl || customer?.website || "",
        targetNetwork: googleSettings.targetNetwork || "SEARCH_AND_DISPLAY",
        keywords: googleSettings.keywords || (promotedServices.length ? promotedServices : ["luxury services", "top clinic"]),
        negativeKeywords: googleSettings.negativeKeywords || ["free", "cheap", "jobs"],
        headlines: googleSettings.headlines || [adVariants[0]?.headline || "Book Exclusive Consultation", "Top Rated Experts", "Limited Offer"],
        descriptions: googleSettings.descriptions || [adVariants[0]?.primaryText || "Verified quality and premium treatments. Book online today."],
      },
      qaAudit: {
        passed: false,
        checks: [],
        warnings: ["Draft requires account, creative and targeting review before platform creation."],
        checkedAt: new Date(),
      },
      status: "Pending Approval",
      createdBy: req.user._id,
    });

    const populated = await AdCampaign.findById(newCampaign._id)
      .populate("customerId", "name companyName industry city logoUrl adsProfile")
      .lean();

    return res.status(201).json({ success: true, campaign: populated });
  } catch (error) {
    console.error("[Manual AdCampaign Creation Error]:", error);
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
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

    const clientName = campaign.customerId?.name || campaign.customerId?.companyName || "Brand Client";
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
    campaign.status = 'Pending Approval';
    campaign.version += 1;
    await campaign.save();
    return res.json({ success: true, creativePosterAsset: campaign.creativePosterAsset, campaign });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/ads/campaigns/:id
 * Update campaign details, budget, or ad copy
 */
router.put("/campaigns/:id", async (req, res) => {
  try {
    const changes = editableUpdates(req.body);
    const updated = await AdCampaign.findOneAndUpdate(
      { $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { campaignId: req.params.id }] },
      { $set: { ...changes, status: 'Pending Approval', qaAudit: { passed: false, checks: [], warnings: ['Blueprint changed; review required.'], checkedAt: new Date() } }, $inc: { version: 1 } },
      { new: true, runValidators: true }
    )
      .populate("customerId", "name companyName industry city logoUrl")
      .lean();

    if (!updated) return res.status(404).json({ success: false, error: "Campaign not found" });
    return res.json({ success: true, campaign: updated });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ads/campaigns/:id/toggle-status
 * Toggles campaign status between Active/Live and Paused
 */
router.post("/campaigns/:id/toggle-status", async (req, res) => {
  try {
    return res.json(await require('../services/safeMetaCampaignService').toggleCampaign(req.params.id, req.body));
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
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

    if (!Number.isInteger(variantIndex) || variantIndex < 0 || !campaign.adVariants?.[variantIndex]) throw campaignError('Select a valid ad variant.');
    const project = await require('../models/CreativeProject').findOne({ _id: creativeProjectId, customerId: campaign.customerId }).lean();
    if (!project) throw campaignError('Creative project not found for this customer.', 404);
    const version = project.versions?.find(v => v.versionNumber === project.currentVersion);
    if (!version?.fileUrl) throw campaignError('Creative project has no current image file.');
    if (variantIndex === 0) campaign.creativePosterAsset = { ...(campaign.creativePosterAsset?.toObject?.() || campaign.creativePosterAsset || {}), imageUrl: version.fileUrl, creativeProjectId };
    if (campaign.adVariants && campaign.adVariants[variantIndex]) {
      campaign.adVariants[variantIndex].creativeProjectId = creativeProjectId;
      if (headline) campaign.adVariants[variantIndex].headline = headline;
    }

    if (campaign.creativeRequirements && campaign.creativeRequirements[variantIndex]) {
      campaign.creativeRequirements[variantIndex].creativeProjectId = creativeProjectId;
      campaign.creativeRequirements[variantIndex].status = "Approved";
    }

    campaign.status = 'Pending Approval';
    campaign.version += 1;
    await campaign.save();
    return res.json({ success: true, message: "Creative attached. Review the updated blueprint before approval.", campaign });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
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

    if (!['Draft', 'Pending Approval', 'Approved'].includes(campaign.status)) throw campaignError('Only a draft awaiting review can be approved.', 409);
    campaign.status = "Approved";
    await campaign.save();

    return res.json({ success: true, message: "Blueprint approved. No ads have been created or activated.", campaign });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
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
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/campaigns/:id/preflight', async (req, res) => {
  try {
    res.json(await require('../services/safeMetaCampaignService').dispatchCampaign(req.params.id, { validateOnly: true }));
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, error: error.message }); }
});

module.exports = router;
