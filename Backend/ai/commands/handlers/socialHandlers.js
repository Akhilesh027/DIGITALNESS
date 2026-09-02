/**
 * socialHandlers.js
 * Deterministic handlers for Social Media Agent commands.
 * Generates captions, hashtags, reel scripts, content plans, and social strategies.
 */

const Customer = require("../../../models/Customer");
const ContentCalendar = require("../../../models/ContentCalendar");
const SocialAgent = require("../../agents/SocialAgent");
const { buildAgentContext } = require("../../../services/agentContextService");

/**
 * 1. Generate Social Media Caption
 */
exports.generateCaption = async (params = {}, ctx = {}) => {
  const customer = params.customerId
    ? await Customer.findById(params.customerId).lean()
    : await Customer.findOne().lean();

  if (!customer) throw new Error("No customer found for caption generation.");

  let topic = params.topic || params.service;
  if (!topic && params.prompt) {
    topic = params.prompt
      .replace(/\b(generate|create|write|make|for|about|on|a|an|the|caption|post|reel|script|hashtags?|glownest|salon|client|customer)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (!topic || topic.length < 2) topic = "Hair Spa Offer";

  const offer = params.offer || "";

  const plan = {
    customerId: customer._id,
    client: { name: customer.name || customer.companyName },
    campaign: {
      service: topic,
      offer: offer || `Special ${topic} Offer`,
      cta: params.cta || "Book Now",
    },
    commandBreakdown: {
      rawCommand: params.prompt || `Generate caption about ${topic}`,
      serviceOrTopic: topic,
      detectedOffer: offer,
    },
  };

  const result = await SocialAgent.execute(plan, ctx);

  return {
    type: "social.caption",
    customerName: customer.name || customer.companyName,
    topic,
    headline: result.headline,
    supportingCopy: result.supportingCopy,
    caption: result.caption,
    ctaText: result.ctaText,
    hashtags: result.hashtags,
    platformVariants: result.platformVariants,
  };
};

/**
 * 2. Generate Hashtags
 */
exports.generateHashtags = async (params = {}, ctx = {}) => {
  const customer = params.customerId
    ? await Customer.findById(params.customerId).lean()
    : await Customer.findOne().lean();

  if (!customer) throw new Error("No customer found for hashtag generation.");

  let topic = params.topic || params.service;
  if (!topic && params.prompt) {
    topic = params.prompt
      .replace(/\b(generate|create|write|make|for|about|on|a|an|the|caption|post|reel|script|hashtags?|glownest|salon|client|customer)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (!topic || topic.length < 2) topic = "Hair & Beauty Services";

  const clientName = customer.name || customer.companyName || "Brand";
  const city = customer.city || "Hyderabad";
  const industry = customer.businessProfile?.industry || "Beauty & Wellness";

  const agentCtx = await buildAgentContext({
    customerId: customer._id,
    agentType: "Social",
  });

  const brandTags = [
    `#${clientName.replace(/\s+/g, "")}`,
    `#${clientName.replace(/\s+/g, "")}${city}`,
  ];

  const topicTags = topic.split(/\s+/).filter(w => w.length > 3).map(w => `#${w.charAt(0).toUpperCase() + w.slice(1)}`);

  const industryTags = [
    `#${industry.replace(/\s+/g, "")}`,
    `#${city}${industry.split(" ")[0]}`,
    `#${city}Salons`,
  ];

  const engagementTags = [
    "#TransformationGoals",
    "#BeforeAndAfter",
    "#GlowUp",
    "#SelfCare",
    "#SpecialOffer",
    "#BookNow",
    "#TrendingNow",
    "#ViralBeauty",
  ];

  const locationTags = [
    `#${city}`,
    `#${city}Life`,
    `#${city}Beauty`,
  ];

  const allHashtags = [
    ...brandTags,
    ...topicTags,
    ...industryTags,
    ...engagementTags.slice(0, 4),
    ...locationTags,
  ];

  const uniqueHashtags = [...new Set(allHashtags)].slice(0, 20);

  return {
    type: "social.hashtags",
    customerName: clientName,
    topic,
    hashtags: uniqueHashtags,
    categories: {
      brand: brandTags,
      topic: topicTags,
      industry: industryTags,
      engagement: engagementTags.slice(0, 4),
      location: locationTags,
    },
  };
};

/**
 * 3. Generate Reel Script
 */
exports.generateReelScript = async (params = {}, ctx = {}) => {
  const customer = params.customerId
    ? await Customer.findById(params.customerId).lean()
    : await Customer.findOne().lean();

  if (!customer) throw new Error("No customer found for reel script generation.");

  const topic = params.topic || params.service || params.query || "Hair Transformation";
  const clientName = customer.name || customer.companyName || "Brand";
  const offer = params.offer || "";
  const duration = params.duration || "30 seconds";

  const agentCtx = await buildAgentContext({
    customerId: customer._id,
    agentType: "Social",
  });

  const locationName = agentCtx.activeLocation?.name || "Kukatpally";
  const phone = agentCtx.activeLocation?.phone || customer.contactNumber || "9000012346";
  const tagline = agentCtx.brandRules?.tagline || "Style That Feels Like You";

  let reelScript;
  try {
    reelScript = await SocialAgent.generateStructured(
      `You are a viral short-form video scriptwriter for Instagram Reels and YouTube Shorts.
Generate a complete reel script for ${clientName} about "${topic}".

Context:
- Brand: ${clientName} (${customer.businessProfile?.industry || "Beauty & Wellness"})
- Location: ${locationName}
- Phone: ${phone}
- Tagline: "${tagline}"
- Offer: ${offer || "Special Offer"}
- Duration: ${duration}

Return a JSON object with:
{
  "hook": "First 3 seconds hook text (attention-grabbing question or statement)",
  "scenes": [
    { "scene": 1, "duration": "3s", "visual": "Description of what's shown", "voiceover": "What is said", "textOverlay": "On-screen text" },
    { "scene": 2, "duration": "5s", "visual": "...", "voiceover": "...", "textOverlay": "..." }
  ],
  "cta": "Final call to action with phone number",
  "musicSuggestion": "Trending audio or music style suggestion",
  "hashtags": ["#tag1", "#tag2"],
  "estimatedDuration": "${duration}",
  "platform": "Instagram Reels / YouTube Shorts"
}`,
      "You are a professional short-form video scriptwriter. Return ONLY valid JSON.",
      "reel_script"
    );
  } catch (err) {
    console.warn("[socialHandlers] Reel script AI generation error:", err.message);
  }

  if (!reelScript) {
    const lowerTopic = topic.toLowerCase();
    if (lowerTopic.includes("sunscreen") || lowerTopic.includes("myth") || lowerTopic.includes("spf")) {
      reelScript = {
        hook: `Stop believing these 3 dangerous sunscreen myths if you want healthy, youthful skin! 🚫`,
        scenes: [
          {
            scene: 1,
            duration: "3s",
            visual: "Doctor looking directly at camera holding a bottle of sunscreen and UV test card.",
            voiceover: "Stop believing these 3 dangerous sunscreen myths if you want youthful skin!",
            textOverlay: "3 SUNSCREEN MYTHS RUINING YOUR SKIN 🚫",
          },
          {
            scene: 2,
            duration: "8s",
            visual: "Dermatologist showing UV rays penetrating an office window with a UV sensor light.",
            voiceover: "Myth 1: 'I work indoors so I don't need SPF.' UVA rays penetrate glass windows all day and break down your collagen!",
            textOverlay: "Myth 1: Windows Block UV ❌ (UVA Penetrates Glass!)",
          },
          {
            scene: 3,
            duration: "10s",
            visual: "Split demonstration showing SPF 15 makeup vs 2 full finger-lengths of broad-spectrum gel sunscreen.",
            voiceover: "Myth 2: 'Makeup with SPF is enough.' You'd need 7 full layers of foundation to get real protection. Always use two full fingers of SPF 50!",
            textOverlay: "Myth 2: SPF Makeup is Enough ❌ (Apply 2 Full Fingers!)",
          },
          {
            scene: 4,
            duration: "9s",
            visual: "Doctor applying non-greasy gel sunscreen on skin with zero white cast, followed by clinic reception card.",
            voiceover: `Myth 3: 'Sunscreen causes acne.' Medical-grade gel sunscreens are non-comedogenic. Visit ${clientName} for personalized skin consultations!`,
            textOverlay: `Myth 3: Clogs Pores ❌ | Book Consultation: 📞 ${phone}`,
          },
        ],
        cta: `Book your clinical skincare consultation at ${clientName} (${locationName})! Call ${phone}`,
        musicSuggestion: "Trending Aesthetic Soft Beat (112 BPM)",
        hashtags: [`#${clientName.replace(/\s+/g, "")}`, "#SunscreenMyths", "#DermatologyTips", "#SkincareEducation", "#HyderabadAesthetics", "#SPFProtection"],
        estimatedDuration: duration,
        platform: "Instagram Reels / YouTube Shorts",
      };
    } else {
      reelScript = {
        hook: `Wait... is THIS what ${topic} looks like at ${clientName}? 😱`,
        scenes: [
          { scene: 1, duration: "3s", visual: `Close-up of ${topic} process beginning`, voiceover: `You won't believe this ${topic} transformation...`, textOverlay: `${topic.toUpperCase()} TRANSFORMATION` },
          { scene: 2, duration: "8s", visual: `Mid-process shot showing expert at work`, voiceover: `Our certified specialists at ${clientName} ${locationName} tailor every session with precision.`, textOverlay: `EXPERT CLINICAL CARE ✨` },
          { scene: 3, duration: "10s", visual: `Before vs After split screen reveal`, voiceover: `Immediate noticeable results with zero downtime!`, textOverlay: `THE REVEAL 🔥` },
          { scene: 4, duration: "9s", visual: `Happy client smiling, brand logo overlay`, voiceover: `Book your ${topic} session today! Call ${phone}`, textOverlay: `📞 ${phone} | ${offer || "BOOK CONSULTATION"}` },
        ],
        cta: `Book your ${topic} session at ${clientName} ${locationName}! Call ${phone}`,
        musicSuggestion: "Trending upbeat audio / viral transformation sound",
        hashtags: [`#${clientName.replace(/\s+/g, "")}`, `#${topic.replace(/\s+/g, "")}`, "#ReelTransformation", "#BeforeAndAfter", "#ViralBeauty"],
        estimatedDuration: duration,
        platform: "Instagram Reels / YouTube Shorts",
      };
    }
  }

  return {
    type: "social.reelScript",
    customerName: clientName,
    topic,
    script: reelScript,
  };
};

/**
 * 4. Get Content Plan (from ContentCalendar)
 */
exports.getContentPlan = async (params = {}, ctx = {}) => {
  const customer = params.customerId
    ? await Customer.findById(params.customerId).lean()
    : await Customer.findOne().lean();

  if (!customer) throw new Error("No customer found for content plan.");

  const now = new Date();
  const targetMonth = params.month || now.getMonth() + 1;
  const targetYear = params.year || now.getFullYear();
  const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  const calendar = await ContentCalendar.findOne({
    clientId: customer._id,
    "period.formatted": periodStr,
  }).lean();

  const items = calendar?.items || [];
  const upcoming = items
    .filter(item => new Date(item.plannedDate) >= new Date(now.toISOString().split("T")[0]))
    .sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));

  return {
    type: "social.contentPlan",
    customerName: customer.name || customer.companyName,
    period: periodStr,
    calendarId: calendar?._id || null,
    totalItems: items.length,
    upcomingItems: upcoming.length,
    items: upcoming.slice(0, 15).map(item => ({
      itemKey: item.itemKey,
      plannedDate: item.plannedDate,
      contentType: item.contentType,
      sourceType: item.sourceType,
      headline: item.headline,
      caption: item.caption,
      hashtags: item.hashtags,
      status: item.status,
      platformTargets: item.platformTargets,
      occasion: item.occasion,
    })),
    summary: calendar?.summary || { totalItems: 0, posters: 0, reels: 0, approved: 0, pending: 0 },
  };
};

/**
 * 5. Generate Social Media Strategy
 */
exports.generateStrategy = async (params = {}, ctx = {}) => {
  const customer = params.customerId
    ? await Customer.findById(params.customerId).lean()
    : await Customer.findOne().lean();

  if (!customer) throw new Error("No customer found for strategy generation.");

  const clientName = customer.name || customer.companyName || "Brand";
  const industry = customer.businessProfile?.industry || "Beauty & Wellness";
  const services = customer.businessProfile?.services || ["Hair Styling", "Skin Care", "Makeup"];

  const agentCtx = await buildAgentContext({
    customerId: customer._id,
    agentType: "Social",
  });

  const tone = agentCtx.socialStrategy?.toneOfVoice || "Premium, Engaging, Aspirational";
  const platforms = agentCtx.socialStrategy?.platforms || ["Instagram", "Facebook"];

  const weeklySchedule = [
    { day: "Monday", contentType: "SOCIAL_POST", theme: "Motivation / Transformation Monday", topic: services[0] || "Hair Styling", platform: "Instagram, Facebook" },
    { day: "Tuesday", contentType: "REEL", theme: "Tutorial Tuesday", topic: "Quick Tips & Hacks", platform: "Instagram Reels, YouTube Shorts" },
    { day: "Wednesday", contentType: "CAROUSEL", theme: "Service Spotlight", topic: services[1] || "Skin Care", platform: "Instagram" },
    { day: "Thursday", contentType: "SOCIAL_POST", theme: "Client Testimonial / Before-After", topic: "Client Stories", platform: "Instagram, Facebook" },
    { day: "Friday", contentType: "REEL", theme: "Trending Friday", topic: "Trending Audio + Service Showcase", platform: "Instagram Reels" },
    { day: "Saturday", contentType: "SOCIAL_POST", theme: "Weekend Offer / Flash Sale", topic: services[2] || "Special Packages", platform: "Instagram, Facebook, WhatsApp" },
    { day: "Sunday", contentType: "STORY", theme: "Behind The Scenes / Team Feature", topic: "Studio Life & Culture", platform: "Instagram Stories" },
  ];

  const contentMix = {
    posters: "40%",
    reels: "30%",
    carousels: "15%",
    stories: "15%",
  };

  return {
    type: "social.strategy",
    customerName: clientName,
    industry,
    tone,
    platforms,
    weeklySchedule,
    contentMix,
    recommendations: [
      `Post consistently 5-7 times per week across ${platforms.join(" & ")}.`,
      `Use trending audio on Reels for maximum organic reach.`,
      `Maintain ${tone.toLowerCase()} tone across all content.`,
      `Prioritize Before/After transformation content for ${industry}.`,
      `Run flash offers on weekends to boost engagement and conversions.`,
      `Use branded hashtags consistently: #${clientName.replace(/\s+/g, "")}`,
    ],
  };
};
