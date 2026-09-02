

const AgentRun = require("../../models/AgentRun");
const { classifyIntent, resolveClientAndLocation } = require("./intentRouter");
const { calculateCustomerReadiness, buildAgentContext } = require("../../services/agentContextService");
const ToolRegistry = require("../tools/ToolRegistry");
const { generateStructured } = require("../providers/AIProvider");

exports.processAIRequest = async ({ prompt, userId, customerIdOverride = null, locationIdOverride = null }) => {
  // 1. Resolve Client & Location
  let targetCustomer = null;
  let targetLocation = null;

  if (customerIdOverride) {
    const Customer = require("../../models/Customer");
    targetCustomer = await Customer.findById(customerIdOverride).lean();
    if (locationIdOverride) {
      const ClientLocation = require("../../models/ClientLocation");
      targetLocation = await ClientLocation.findById(locationIdOverride).lean();
    } else if (targetCustomer) {
      const ClientLocation = require("../../models/ClientLocation");
      const locations = await ClientLocation.find({ customerId: targetCustomer._id, status: "Active" }).lean();
      const lowerPrompt = prompt.toLowerCase();
      for (const loc of locations) {
        if (lowerPrompt.includes(loc.name.toLowerCase()) || lowerPrompt.includes((loc.city || "").toLowerCase())) {
          targetLocation = loc;
          break;
        }
      }
      if (!targetLocation && locations.length > 0) {
        targetLocation = locations[0];
      }
    }
  } else {
    const resolution = await resolveClientAndLocation(prompt);
    targetCustomer = resolution.customer;
    targetLocation = resolution.location;

    if (resolution.isAmbiguous) {
      const ClientLocation = require("../../models/ClientLocation");
      const candidateLocations = await ClientLocation.find({ customerId: targetCustomer._id, status: "Active" }).lean();
      return {
        status: "LOCATION_REQUIRED",
        message: `Multiple locations found for ${targetCustomer.name}. Please select target location.`,
        customerId: targetCustomer._id,
        customerName: targetCustomer.name,
        candidateLocations: candidateLocations.map((l) => ({ id: l._id, name: l.name, city: l.city })),
      };
    }
  }

  if (!targetCustomer) {
    throw new Error("Could not resolve target client from request. Please select a client explicitly.");
  }

  // 2. Classify Intent
  const intent = classifyIntent(prompt);

  // Map intent to required agents
  let requiredAgents = ["SocialAgent", "CreativeAgent"];
  if (intent === "CREATE_AD_PLAN" || intent === "ADS_CAMPAIGN_CREATE") requiredAgents = ["AdsAgent", "SocialAgent"];
  if (intent === "CREATE_GBP_POST" || intent === "CREATE_GBP_REPLY") requiredAgents = ["GBPAgent"];
  if (intent === "CREATE_SEO_PLAN") requiredAgents = ["SEOAgent"];
  if (intent === "CREATE_LEAD_FOLLOWUP") requiredAgents = ["LeadAgent"];
  if (intent === "CREATE_REPORT") requiredAgents = ["ReportingAgent"];

  // 3. Check Agent Readiness
  const readiness = await calculateCustomerReadiness(targetCustomer._id);

  // Readiness enforcement check based on REQUIRED fields
  const agentKeyMap = {
    SocialAgent: "social",
    CreativeAgent: "creative",
    AdsAgent: "ads",
    GBPAgent: "gbp",
    SEOAgent: "seo",
    LeadAgent: "lead",
    ReportingAgent: "reporting",
  };

  const missingRequired = [];
  let isReadyToProceed = true;

  requiredAgents.forEach((agent) => {
    const key = agentKeyMap[agent];
    const agentReadiness = readiness.agents?.[key];
    if (agentReadiness && !agentReadiness.ready) {
      isReadyToProceed = false;
      missingRequired.push(...(agentReadiness.missingRequired || []));
    }
  });

  if (!isReadyToProceed) {
    return {
      status: "NEEDS_PROFILE_DATA",
      message: `Cannot safely proceed. Missing required client profile data: ${missingRequired.join(", ")}`,
      missingFields: missingRequired,
      readiness,
    };
  }

  // 4. Load Sanitized Context
  const parentContext = await buildAgentContext({
    customerId: targetCustomer._id,
    locationId: targetLocation?._id || null,
    agentType: "Parent",
  });

  // 5. Dynamic LLM Plan Extraction (Gemini API Driven)
  const lowerPrompt = prompt.toLowerCase();

  let detectedTopic = "Service Promotion";
  let detectedService = "Beauty Services";
  let detectedObjective = "Appointment Bookings / Lead Generation";
  let defaultCta = "Book Appointment";
  let defaultHeadline = "ELEVATE YOUR STYLE";
  let defaultSubject = "High-end salon model showcasing premium beauty services.";

  // Multi-Format Offer Extraction: Only extract offer if present or explicitly requested
  let detectedOffer = "None (Brand Awareness)";
  let offerSource = "None (No Offer Specified)";
  const hasExplicitOfferKeyword = lowerPrompt.includes("offer") || lowerPrompt.includes("discount") || lowerPrompt.includes("deal") || lowerPrompt.includes("sale") || lowerPrompt.includes("promo");

  const bogoMatch = prompt.match(/\b(buy\s*\d+\s*get\s*\d+\s*(?:free)?)\b/i);
  const flatMatch = prompt.match(/\b(flat\s*(?:rs\.?|\$|\₹)?\s*\d+\s*(?:off|discount)?)\b/i);
  const percentMatch = prompt.match(/\b(\d+%\s*(?:off|discount|cashback|off\s*selected\s*services)?)\b/i);
  const freeMatch = prompt.match(/\b(free\s+[a-z0-9\s]{3,25}|complimentary\s+[a-z0-9\s]{3,25})\b/i);

  if (bogoMatch) {
    detectedOffer = bogoMatch[1].toUpperCase();
    offerSource = "User Request";
  } else if (flatMatch) {
    detectedOffer = flatMatch[1].toUpperCase();
    offerSource = "User Request";
  } else if (percentMatch) {
    detectedOffer = percentMatch[1].toUpperCase();
    if (!detectedOffer.toLowerCase().includes("selected") && !detectedOffer.toLowerCase().includes("online") && !detectedOffer.toLowerCase().includes("off")) {
      detectedOffer += " OFF";
    }
    offerSource = "User Request";
  } else if (freeMatch) {
    detectedOffer = freeMatch[1].toUpperCase();
    offerSource = "User Request";
  } else if (hasExplicitOfferKeyword && targetLocation?.activeOffers?.[0]?.title) {
    detectedOffer = targetLocation.activeOffers[0].title;
    offerSource = "CRM Active Location Offer";
  }

  // Ask Gemini API to dynamically analyze the user request and extract campaign details
  const planExtractionPrompt = `Analyze this marketing request for ${targetCustomer.name} (${targetLocation?.name || "Main Location"}):
Request: "${prompt}"

Context:
- Client: ${targetCustomer.name} (${targetCustomer.businessType || "Salon"})
- Services: ${(targetCustomer.businessProfile?.services || ["Haircut", "Hair Colour", "Facial"]).join(", ")}
- Detected Offer from Prompt: ${detectedOffer}
- Website: ${targetLocation?.website || targetCustomer.website || "https://glownest.com"}

IMPORTANT RULE: Only include a promotional offer if explicitly stated in the user request "${prompt}". If no offer is requested, set offer to "None (Brand Awareness)".

Return JSON matching:
{
  "campaignName": "Short descriptive campaign title e.g. GlowNest Salon - Hair Styling Poster",
  "topic": "e.g. Service Promotion / BOGO Offer / Website Launch / Brand Campaign",
  "service": "Target service mentioned in request e.g. Haircut & Styling",
  "offer": "EXACT promotional offer explicitly stated in request, or 'None (Brand Awareness)' if no offer requested",
  "objective": "Campaign marketing objective",
  "cta": "Call to action button e.g. Book Appointment / Claim Offer / Visit Website",
  "headline": "Catchy headline e.g. STYLED TO PERFECTION",
  "supportingOfferLine": "Supporting copy line emphasizing service or offer",
  "mainSubject": "Visual hero description for poster"
}`;

  let geminiPlan = null;
  try {
    geminiPlan = await generateStructured({
      prompt: planExtractionPrompt,
      systemPrompt: "You are an expert AI Marketing Campaign Strategist. Analyze the user prompt and generate dynamic structured campaign plan JSON.",
      schemaName: "campaign_plan",
    });
  } catch (err) {
    console.warn("Gemini plan parsing fallback:", err.message);
  }

  if (geminiPlan) {
    if (geminiPlan.topic) detectedTopic = geminiPlan.topic;
    if (geminiPlan.service) detectedService = geminiPlan.service;
    if (geminiPlan.offer && geminiPlan.offer !== "None (Brand Awareness)") {
      detectedOffer = geminiPlan.offer;
      offerSource = (bogoMatch || flatMatch || percentMatch || freeMatch) ? "User Request" : "Gemini Strategy";
    } else if (!bogoMatch && !flatMatch && !percentMatch && !freeMatch && !hasExplicitOfferKeyword) {
      detectedOffer = "None (Brand Awareness)";
      offerSource = "No Offer Specified";
    }
    if (geminiPlan.objective) detectedObjective = geminiPlan.objective;
    if (geminiPlan.cta) defaultCta = geminiPlan.cta;
    if (geminiPlan.headline) defaultHeadline = geminiPlan.headline;
    if (geminiPlan.mainSubject) defaultSubject = geminiPlan.mainSubject;
  } else {
    // Keyword Fallback Engine if offline
    if (lowerPrompt.includes("website") || lowerPrompt.includes("site launch") || lowerPrompt.includes("online booking")) {
      detectedTopic = "Website Launch";
      detectedService = "Website Launch";
      detectedObjective = "Website Traffic & Online Appointment Bookings";
      defaultCta = "Visit Website";
      defaultHeadline = "WE ARE NOW ONLINE";
      defaultSubject = "Sleek smartphone display showing official GlowNest Salon website UI with elegant luxury salon backdrop.";
      if (!bogoMatch && !flatMatch && !percentMatch && !freeMatch && hasExplicitOfferKeyword) {
        detectedOffer = "15% OFF First Online Booking";
        offerSource = "Website Launch Special";
      }
    } else if (lowerPrompt.includes("grand opening") || lowerPrompt.includes("new branch") || lowerPrompt.includes("branch launch")) {
      detectedTopic = "Grand Opening";
      detectedService = "Grand Opening";
      detectedObjective = "Store Footfall & Local Awareness";
      defaultCta = "Visit Us Today";
      defaultHeadline = "GRAND OPENING";
      defaultSubject = "Ribbon cutting celebration graphic with luxury salon interior and welcoming reception area.";
    } else if (lowerPrompt.includes("hair colour") || lowerPrompt.includes("hair color")) {
      detectedTopic = "Service Promotion";
      detectedService = "Hair Colour";
      defaultHeadline = "COLOUR YOUR CONFIDENCE";
      defaultSubject = "High-end female salon model with professionally styled, glossy hair colour.";
    } else if (lowerPrompt.includes("keratin")) {
      detectedTopic = "Service Promotion";
      detectedService = "Keratin Treatment";
      defaultHeadline = "SMOOTH & SHINE HAIR";
      defaultSubject = "Model with silky smooth keratin-treated hair.";
    } else if (lowerPrompt.includes("haircut") || lowerPrompt.includes("hair cut")) {
      detectedTopic = "Service Promotion";
      detectedService = "Hair Styling & Cut";
      defaultHeadline = "PRECISION CUTS";
      defaultSubject = "Trendy model with modern haircut styled by top salon artist.";
    }
  }

  const clientInfo = {
    name: targetCustomer.name,
    brandName: targetCustomer.brandProfile?.brandName || targetCustomer.name,
    companyName: targetCustomer.companyName || targetCustomer.name,
    businessType: targetCustomer.businessType || "Salon & Beauty Services",
    industry: targetCustomer.businessProfile?.industry || "Beauty & Wellness",
    website: targetLocation?.website || targetCustomer.website || targetCustomer.seoProfile?.website || "https://glownest.com",
  };

  const locationInfo = {
    name: targetLocation?.name || "Kukatpally",
    address: targetLocation?.address || targetCustomer.address || "Plot 18, KPHB Main Road, Kukatpally",
    city: targetLocation?.city || targetCustomer.city || "Hyderabad",
    phone: targetLocation?.phone || targetCustomer.phone || "9000012346",
    openingHours: targetLocation?.openingHours || "10:00 AM - 9:00 PM",
  };

  const commandBreakdown = {
    rawCommand: prompt,
    intent: intent,
    client: clientInfo.name,
    location: locationInfo.name,
    serviceOrTopic: detectedService,
    hasOffer: Boolean(bogoMatch || flatMatch || percentMatch || freeMatch || (geminiPlan?.offer && geminiPlan.offer !== "None (Brand Awareness)")),
    detectedOffer: detectedOffer,
    offerSource: offerSource,
  };

  const campaignInfo = {
    name: geminiPlan?.campaignName || `${clientInfo.name} - ${detectedService}`,
    topic: detectedTopic,
    service: detectedService,
    offer: detectedOffer,
    offerSource,
    objective: detectedObjective,
    cta: defaultCta,
    websiteUrl: clientInfo.website,
  };

  const formatInfo = {
    platforms: targetCustomer.socialProfile?.primaryPlatforms || ["Instagram", "Facebook"],
    creativeType: intent === "CREATE_POSTER" ? "Poster" : "Social Post",
    dimensions: "1080 × 1080",
    aspectRatio: "1:1",
    contentRatio: targetCustomer.creativePreferences?.contentRatio || "80% Visual / 20% Content",
    language: targetCustomer.socialProfile?.contentLanguages?.[0] || "English",
  };

  const brandContextInfo = {
    primaryColor: targetCustomer.brandProfile?.brandColors?.[0] || "#1A1A1A",
    secondaryColor: targetCustomer.brandProfile?.secondaryColors?.[0] || "#F7F2ED",
    accentColor: targetCustomer.brandProfile?.additionalColors?.[0] || "#C79A6B",
    fonts: targetCustomer.brandProfile?.fonts || ["Poppins", "Playfair Display"],
    tone: Array.isArray(targetCustomer.socialProfile?.toneOfVoice)
      ? targetCustomer.socialProfile.toneOfVoice
      : [targetCustomer.socialProfile?.toneOfVoice || "Premium", "Friendly", "Modern"],
    visualStyle: targetCustomer.brandProfile?.visualStyle || "Modern Luxury Editorial",
    preferredImageStyle: targetCustomer.creativePreferences?.preferredImageStyle || "Premium realistic salon photography",
    logoUrl: targetCustomer.brandProfile?.logoUrl || "https://glownest.com/assets/logo-glownest.png",
    logoPreferences: targetCustomer.brandProfile?.logoPreferences || "Place official logo in top header corner. Maintain original aspect ratio.",
    doNotRules: [
      "Do not overcrowd poster layout",
      "Do not modify or distort logo",
      "Do not use restricted words (Cheap, Guaranteed)",
    ],
  };

  const audienceInfo = {
    targetAudience: targetCustomer.businessProfile?.targetAudience || ["Women 20–45", "Men 20–45", "Working Professionals", "College Students"],
    targetArea: targetCustomer.businessProfile?.serviceAreas || [locationInfo.name, "Miyapur"],
  };

  const contentPlanInfo = {
    headline: defaultHeadline,
    supportingOfferLine: detectedTopic === "Website Launch"
      ? `Book online at ${clientInfo.website} & enjoy ${detectedOffer}!`
      : `${detectedOffer} - Premium care personalized to you.`,
    cta: campaignInfo.cta,
    captionPreview: detectedTopic === "Website Launch"
      ? `🎉 Exciting news! ${clientInfo.name} ${locationInfo.name} is officially ONLINE! Book appointments anytime at ${clientInfo.website} and enjoy ${detectedOffer}.\n\n📍 ${locationInfo.address}\n📞 Call: ${locationInfo.phone}`
      : `✨ Experience premium ${detectedService} at ${clientInfo.name} ${locationInfo.name}! Get ${detectedOffer}.\n\n📍 ${locationInfo.address}\n📞 Call: ${locationInfo.phone}`,
    hashtags: ["#GlowNestSalon", `#${detectedService.replace(/\s+/g, "")}`, `#${locationInfo.name}`, "#WebsiteLaunch", "#HyderabadSalons"],
  };

  const creativePlanInfo = {
    objective: detectedTopic === "Website Launch"
      ? `Create a high-impact website launch announcement poster promoting online bookings.`
      : `Create a premium ${detectedService.toLowerCase()} promotional poster.`,
    mainSubject: defaultSubject,
    compositionApproach: `${formatInfo.contentRatio} layout with hero model/device right-center and clean typography.`,
    mood: "Luxury, modern, digital, editorial.",
    offerEmphasis: `${detectedOffer} clearly visible with high-contrast accent badge.`,
    brandTreatment: "Use clean layouts, premium visuals, minimal text and consistent brand colors.",
  };

  const deliverables = [
    "✓ Social Copy",
    "✓ Poster Headline",
    "✓ CTA",
    "✓ Caption",
    "✓ Hashtags",
    "✓ Creative Concept",
    "✓ Visual Direction",
    "✓ Complete Poster Prompt",
    "✓ CreativeProject V1",
    "✓ Work Record",
    "✓ ContentItem",
    "✓ WorkApproval",
  ];

  const agentExecution = [
    { agent: "Social Agent", description: "Creates campaign copy and social variations" },
    { agent: "Creative Agent", description: "Creates visual concept, layout and complete poster prompt" },
  ];

  // 5. Build Structured Manager-Facing Execution Plan
  const plan = {
    campaignName: campaignInfo.name,
    intent,
    customerId: targetCustomer._id,
    clientName: clientInfo.name,
    companyName: clientInfo.companyName,
    locationId: targetLocation?._id || null,
    locationName: locationInfo.name,
    requiredAgents,
    readinessScore: readiness.overallScore,

    // Rich Business & Campaign Plan Objects
    client: clientInfo,
    location: locationInfo,
    campaign: campaignInfo,
    format: formatInfo,
    brandContext: brandContextInfo,
    audience: audienceInfo,
    contentPlan: contentPlanInfo,
    creativePlan: creativePlanInfo,
    deliverables,
    agentExecution,
    approvalRequired: true,

    // Legacy compatibility fields
    deliverablesSpec: [
      {
        type: formatInfo.creativeType,
        dimensions: formatInfo.dimensions,
        platforms: formatInfo.platforms,
      },
    ],
    brandDirection: brandContextInfo.visualStyle,
    toneOfVoice: brandContextInfo.tone.join(", "),
    executionSteps: agentExecution.map((a, idx) => `${idx + 1}. ${a.agent}: ${a.description}`),
  };

  // 6. Create Persistent AgentRun Record
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const User = require("../../models/User");
    let adminUser = await User.findOne({ role: { $in: ["Admin", "Operational Manager", "Branch Manager"] } }).lean();
    if (!adminUser) {
      adminUser = await User.findOne().lean();
    }
    effectiveUserId = adminUser?._id || null;
  }

  const agentRun = await AgentRun.create({
    requestId: `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    requestedBy: effectiveUserId,
    customerId: targetCustomer._id,
    clientLocationId: targetLocation?._id || null,
    originalRequest: prompt,
    intent,
    requiredAgents,
    readiness: readiness.overallScore,
    plan,
    planStatus: "Awaiting Plan Approval",
    executionStatus: "Plan Ready",
    startedAt: new Date(),
  });

  return {
    success: true,
    agentRunId: agentRun._id,
    status: "Plan Ready",
    plan,
    readiness,
  };
};
