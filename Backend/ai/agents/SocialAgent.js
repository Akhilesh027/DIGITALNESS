/**
 * SocialAgent.js
 * Specialist agent for headlines, captions, hashtags, and social media copy.
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");

class SocialAgent extends BaseAgent {
  constructor() {
    super("SocialAgent");
  }

  async execute(plan, ctx = {}) {
    const socialContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "Social",
    });

    const clientName = plan.client?.name || plan.clientName || socialContext.clientIdentity?.companyName || socialContext.clientIdentity?.name || "GlowNest Salon";
    const locationName = plan.location?.name || socialContext.activeLocation?.name || "Kukatpally";
    const locationCity = plan.location?.city || socialContext.activeLocation?.city || "Hyderabad";
    const locationPhone = plan.location?.phone || socialContext.activeLocation?.phone || "9000012346";
    const locationAddress = plan.location?.address || socialContext.activeLocation?.address || "Plot 18, KPHB Main Road, Kukatpally";
    const serviceName = plan.campaign?.service || plan.commandBreakdown?.serviceOrTopic || "Hair Styling & Beauty";
    const offerText = plan.campaign?.offer || plan.commandBreakdown?.detectedOffer || "Exclusive Offer";
    const cta = plan.campaign?.cta || "Book Appointment";
    const userPrompt = plan.commandBreakdown?.rawCommand || plan.rawPrompt || `${serviceName} campaign with ${offerText}`;
    const tagline = socialContext.brandRules?.tagline || "Style That Feels Like You";
    const tone = socialContext.socialStrategy?.toneOfVoice || "Premium, Engaging, High-Converting";

    const prompt = `You are a world-class Social Media Copywriter and Growth Marketer.
Generate captivating social media copy, headline, full caption, and high-impact hashtags for this campaign:

Campaign Details:
- User Prompt: "${userPrompt}"
- Client Brand: ${clientName}
- Location: ${locationName}, ${locationCity}
- Address: ${locationAddress}
- Phone / WhatsApp: ${locationPhone}
- Target Service: ${serviceName}
- Promotional Offer: ${offerText}
- Call to Action: ${cta}
- Tone of Voice: ${tone}

You MUST return a JSON object with this EXACT structure:
{
  "headline": "Short punchy 3-6 word headline e.g. COLOUR YOUR CONFIDENCE — 20% OFF",
  "supportingCopy": "One sentence supporting copy line highlighting offer or customer benefit",
  "caption": "Full rich Instagram/Facebook caption (3-5 sentences) with engaging hooks, emojis, value proposition, offer details, address, phone number, and clear booking CTA",
  "ctaText": "${cta}",
  "hashtags": [
    "#${clientName.replace(/\s+/g, "")}",
    "#${serviceName.replace(/\s+/g, "")}",
    "#${locationCity}Salons",
    "#${locationName}",
    "#HairCareDaily",
    "#BeautyTransformation"
  ],
  "platformVariants": {
    "Instagram": {
      "captionText": "Instagram-tailored caption with emojis and link in bio CTA"
    },
    "Facebook": {
      "captionText": "Facebook-tailored caption with direct phone number and address"
    }
  }
}`;

    let structured = null;
    try {
      structured = await this.generateStructured(prompt, "You are a professional social media marketing copywriter. Return ONLY valid JSON.", "social_copy");
    } catch (err) {
      console.warn("[SocialAgent] Structured generation error:", err.message);
    }

    if (structured) {
      const headline = structured.headline || structured.title || `EXPERIENCE ${serviceName.toUpperCase()}`;
      const supportingCopy = structured.supportingCopy || structured.subtitle || `${offerText} — ${tagline}`;
      
      // Resolve caption from various possible keys
      let caption = structured.caption || structured.post_caption || structured.post_text || structured.body || structured.captionText;
      if (!caption) {
        caption = `✨ Special Announcement from ${clientName} (${locationName})!\n\n${headline}! Enjoy ${offerText} on ${serviceName}. Personalized consultation and expert styling by top artists.\n\n📍 ${locationAddress}\n📞 Call / WhatsApp: ${locationPhone}\n🗓️ ${cta}!`;
      }

      // Resolve and normalize hashtags
      let hashtags = structured.hashtags || structured.tags || structured.hash_tags;
      if (typeof hashtags === "string") {
        hashtags = hashtags.split(/\s+/).filter((t) => t.startsWith("#") || t.length > 0).map((t) => (t.startsWith("#") ? t : `#${t}`));
      } else if (!Array.isArray(hashtags) || hashtags.length === 0) {
        hashtags = [
          `#${clientName.replace(/\s+/g, "")}`,
          `#${serviceName.replace(/\s+/g, "")}`,
          `#${locationCity}Salons`,
          `#${locationName}`,
          "#TransformationGoals",
          "#SpecialOffer",
        ];
      }

      return {
        headline,
        supportingCopy,
        caption,
        ctaText: structured.ctaText || cta,
        hashtags,
        platformVariants: structured.platformVariants || {
          Instagram: { captionText: `✨ ${headline}! Enjoy ${offerText} on ${serviceName} at ${clientName} (${locationName}). Call ${locationPhone} to book your slot!` },
          Facebook: { captionText: `Visit ${clientName} ${locationName} for ${serviceName} with ${offerText}! Located at ${locationAddress}. Call ${locationPhone} to reserve your appointment.` },
        },
      };
    }

    // Dynamic Keyword-Driven Fallback Engine
    const fallbackHeadline = offerText.toUpperCase().includes("BUY") || offerText.toUpperCase().includes("%")
      ? `${serviceName.toUpperCase()} — ${offerText.toUpperCase()}`
      : `EXPERIENCE ${serviceName.toUpperCase()}`;

    const fallbackSupporting = `${offerText} — ${tagline}`;
    const fallbackCaption = `✨ Special Offer from ${clientName} (${locationName})!\n\n${fallbackHeadline}!\n\nEnjoy ${offerText} on our signature ${serviceName} services. Experience personalized consultation, top-tier products, and expert styling.\n\n📍 Location: ${locationAddress}\n📞 Phone / WhatsApp: ${locationPhone}\n🗓️ How to book: ${cta} today!`;

    const fallbackHashtags = [
      `#${clientName.replace(/\s+/g, "")}`,
      `#${serviceName.replace(/\s+/g, "")}`,
      `#${locationCity}Salons`,
      `#${locationName}`,
      "#BeautyTransformation",
      "#SpecialOffer",
    ];

    return {
      headline: fallbackHeadline,
      supportingCopy: fallbackSupporting,
      caption: fallbackCaption,
      ctaText: cta,
      hashtags: fallbackHashtags,
      platformVariants: {
        Instagram: { captionText: `✨ ${fallbackHeadline}! Enjoy ${offerText} at ${clientName} (${locationName}). Link in bio to book.` },
        Facebook: { captionText: `Visit ${clientName} in ${locationName} for ${serviceName} with ${offerText}! Call ${locationPhone} to reserve.` },
      },
    };
  }
}

module.exports = new SocialAgent();

