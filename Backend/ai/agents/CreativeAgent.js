/**
 * CreativeAgent.js
 * Specialist agent for creative visual direction, layout, and complete structured poster prompts.
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");

class CreativeAgent extends BaseAgent {
  constructor() {
    super("CreativeAgent");
  }

  async execute(plan, socialOutput = {}, ctx = {}) {
    const creativeContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "Creative",
    });

    const clientName = plan.client?.name || creativeContext.clientIdentity?.companyName || creativeContext.clientIdentity?.name || "GlowNest Salon";
    const brandName = plan.client?.brandName || creativeContext.brandRules?.brandName || clientName;
    const businessType = plan.client?.businessType || creativeContext.clientIdentity?.businessType || "Salon & Beauty Services";
    const industry = plan.client?.industry || creativeContext.businessProfile?.industry || "Beauty & Wellness";

    const locationName = plan.location?.name || creativeContext.activeLocation?.name || "Kukatpally";
    const locationAddress = plan.location?.address || creativeContext.activeLocation?.address || "Plot 18, KPHB Main Road, Kukatpally";
    const locationPhone = plan.location?.phone || creativeContext.activeLocation?.phone || "9000012346";

    const serviceName = plan.campaign?.service || "Hair Colour";
    const offerText = plan.campaign?.offer || "20% OFF Selected Services";
    const ctaText = socialOutput.ctaText || plan.campaign?.cta || "Book Appointment";
    const headlineText = socialOutput.headline || plan.contentPlan?.headline || (offerText.toUpperCase().includes("BUY") ? offerText.toUpperCase() : "COLOUR YOUR CONFIDENCE");
    const supportingText = socialOutput.supportingCopy || plan.contentPlan?.supportingOfferLine || `${offerText} - Premium care personalized to you.`;

    const primaryColor = plan.brandContext?.primaryColor || creativeContext.brandRules?.brandColors?.[0] || "#1A1A1A";
    const secondaryColor = plan.brandContext?.secondaryColor || creativeContext.brandRules?.secondaryColors?.[0] || "#F7F2ED";
    const accentColor = plan.brandContext?.accentColor || creativeContext.brandRules?.additionalColors?.[0] || "#C79A6B";
    const fonts = plan.brandContext?.fonts || creativeContext.brandRules?.fonts || ["Poppins", "Playfair Display"];
    const visualStyle = plan.brandContext?.visualStyle || creativeContext.creativeGuidelines?.visualStyle || "Modern Luxury Editorial";
    const preferredImageStyle = plan.brandContext?.preferredImageStyle || creativeContext.creativeGuidelines?.preferredImageStyle || "Premium realistic salon photography";
    const logoUrl = creativeContext.brandRules?.logoUrl || plan.brandContext?.logoUrl || "https://glownest.com/assets/logo-glownest.png";
    const logoPreferences = creativeContext.brandRules?.logoPreferences || "Place official logo in top header corner (top-left / top-right). Maintain original aspect ratio.";

    const isWebsiteLaunch = plan.campaign?.topic === "Website Launch" || serviceName === "Website Launch";
    const websiteUrl = plan.campaign?.websiteUrl || plan.client?.website || "https://glownest.com";

    // 1. Send all campaign context & brand rules to Gemini API to generate the Production Structured JSON Prompt & Long-Form Image Prompt
    const creativeGenerationPrompt = `You are a Senior Commercial Creative Director.
Generate a complete, high-converting commercial advertising poster specification and image generation prompt for ${brandName} (${locationName} Branch).

[CAMPAIGN & BRAND CONTEXT]
• Brand Name: ${brandName} (${businessType}, ${industry})
• Location: ${locationName} | Address: ${locationAddress} | Phone: ${locationPhone} | City: ${creativeContext.activeLocation?.city || "Hyderabad"}
• Campaign Topic / Service: ${serviceName}
• Promotional Offer: ${offerText}
• CTA Button: ${ctaText}
• Poster Headline: ${headlineText}
• Supporting Line: ${supportingText}
• Website URL: ${websiteUrl}
• Brand Colors: Primary ${primaryColor}, Secondary ${secondaryColor}, Accent ${accentColor}
• Brand Fonts: ${fonts.join(", ")}
• Visual Style: ${visualStyle} (${preferredImageStyle})
• Brand Logo URL: ${logoUrl}
• Brand Logo Directives: ${logoPreferences}

Generate and return JSON matching:
{
  "conceptName": "Creative concept title e.g. ${brandName} ${serviceName} Poster",
  "visualDirection": "Detailed visual creative direction description for production team",
  "heroSubject": "Exact hero visual description (model / device mockup / product styling)",
  "lighting": "Studio lighting directives e.g. Soft beauty studio lighting with warm rim highlights",
  "background": "Minimal luxury salon interior background description",
  "imagePromptText": "COMPLETE 300+ WORD PRODUCTION POSTER PROMPT FOR IMAGE GENERATION API INCLUDING PROJECT SPEC, POSTER LAYOUT & COMPOSITION, EXACT TEXT HIERARCHY, BRAND LOGO DIRECTIVES (URL & HEADER PLACEMENT), BRAND SYSTEM, RESTRICTIONS & NEGATIVE PROMPT, AND QUALITY STANDARD",
  "structuredPrompt": {
    "project_name": "${brandName}_${locationName}_${(isWebsiteLaunch ? "Website_Launch" : serviceName).replace(/\s+/g, "_")}_Poster_V1",
    "brand_name": "${brandName}",
    "business_type": "${businessType}",
    "industry": "${industry}",
    "location": {
      "name": "${locationName}",
      "address": "${locationAddress}",
      "phone": "${locationPhone}"
    },
    "campaign": {
      "name": "${serviceName} Promotion",
      "service": "${serviceName}",
      "offer": "${offerText}",
      "cta": "${ctaText}"
    },
    "canvas": {
      "dimensions": "1080x1080",
      "aspectRatio": "1:1",
      "contentRatio": "80% Visual / 20% Content"
    },
    "logo_usage": {
      "instruction": "Place official ${brandName} logo in top header corner. Maintain exact brand mark proportions. Do not distort, crop or recolor.",
      "logoUrl": "${logoUrl}",
      "logoStatus": "Available",
      "placement": "Top Header (Left/Right)"
    },
    "visual_subject": {
      "hero": "Hero visual description",
      "lighting": "Lighting description",
      "background": "Background description"
    },
    "content": {
      "brand": "${brandName}",
      "headline": "${headlineText}",
      "offer": "${offerText}",
      "supportingLine": "${supportingText}",
      "cta": "${ctaText}",
      "location": "${locationName}",
      "phone": "${locationPhone}",
      "logoUrl": "${logoUrl}"
    },
    "negative_prompt": ["cheap flyer look", "cluttered layout", "watermarks"],
    "quality_requirements": ["Commercial advertising quality 8K render"]
  }
}`;

    let geminiCreative = null;
    try {
      geminiCreative = await this.generateStructured(
        creativeGenerationPrompt,
        "You are an expert Commercial Advertising Creative Director. Generate dynamic poster prompt JSON.",
        "creative_poster_prompt"
      );
    } catch (err) {
      console.warn("CreativeAgent Gemini call fallback:", err.message);
    }

    const conceptName = geminiCreative?.conceptName || (isWebsiteLaunch
      ? `${brandName} Official Website Launch Announcement Poster`
      : `${brandName} ${serviceName} Promotional Poster`);

    const visualDirection = geminiCreative?.visualDirection || (isWebsiteLaunch
      ? `High-tech luxury website launch announcement creative featuring sleek smartphone UI mockups displaying the new ${brandName} website, clean typography using brand colors (${primaryColor}, ${secondaryColor}, ${accentColor}), and high-contrast ${offerText} badge.`
      : `Premium editorial ${serviceName.toLowerCase()} transformation creative featuring a professionally styled model, clean luxury layout using brand colors (${primaryColor}, ${secondaryColor}, ${accentColor}), and high-contrast ${offerText} badge.`);

    const heroSubject = geminiCreative?.heroSubject || (isWebsiteLaunch
      ? `Sleek modern smartphone display showcasing the official ${brandName} website interface (${websiteUrl}), floating elegantly with soft ambient lighting against a luxury salon interior background.`
      : `Premium female model with professionally styled, glossy, multi-tone ${serviceName.toLowerCase()} hair, elegant posture, smiling confidently.`);

    // 1. Production Structured JSON Prompt (Powered by Gemini LLM)
    const structuredPrompt = geminiCreative?.structuredPrompt || {
      project_name: `${brandName}_${locationName}_${(isWebsiteLaunch ? "Website_Launch" : serviceName).replace(/\s+/g, "_")}_Poster_V1`,
      brand_name: brandName,
      business_type: businessType,
      industry: industry,
      location: {
        name: locationName,
        address: locationAddress,
        phone: locationPhone,
        city: creativeContext.activeLocation?.city || "Hyderabad",
      },
      design_type: "Social Media Poster",
      objective: isWebsiteLaunch
        ? `Announce the official website launch of ${brandName} ${locationName} and drive online appointment bookings.`
        : `Promote ${serviceName} services with ${offerText} to generate appointment bookings and qualified leads.`,
      campaign: {
        name: isWebsiteLaunch ? "Official Website Launch" : `${serviceName} Promotion`,
        service: isWebsiteLaunch ? "Website Launch" : serviceName,
        offer: offerText,
        objective: isWebsiteLaunch ? "Website Traffic & Online Bookings" : "Appointment Bookings / Lead Generation",
        cta: ctaText,
        websiteUrl: websiteUrl,
      },
      canvas: {
        dimensions: "1080x1080",
        aspectRatio: "1:1",
        contentRatio: "80% Visual / 20% Content",
      },
      brand_identity: {
        primaryColors: [primaryColor],
        secondaryColors: [secondaryColor],
        accentColors: [accentColor],
        fonts: fonts,
        toneOfVoice: creativeContext.socialStrategy?.toneOfVoice || "Premium, Friendly, Modern",
        visualStyle: visualStyle,
        tagline: creativeContext.brandRules?.tagline || "Style That Feels Like You",
      },
      business_context: {
        summary: `${brandName} provides high-end ${serviceName.toLowerCase()} and beauty treatments.`,
        coreServices: creativeContext.businessProfile?.services || ["Haircut", "Hair Colour", "Hair Spa", "Keratin Treatment", "Facial"],
        priorityService: serviceName,
        targetAudience: creativeContext.businessProfile?.targetAudience || ["Women 20-45", "Men 20-45", "Working Professionals", "College Students"],
        serviceArea: creativeContext.businessProfile?.serviceAreas || [locationName, "Miyapur"],
      },
      target_audience: ["Women 20-45", "Men 20-45", "Working Professionals", "College Students"],
      creative_direction: {
        conceptName: conceptName,
        visualDirection: visualDirection,
        mood: isWebsiteLaunch ? "Luxury, modern, digital, elegant" : "Luxury, editorial, confident, elegant",
        photographyStyle: preferredImageStyle,
      },
      visual_subject: {
        hero: heroSubject,
        lighting: geminiCreative?.lighting || "Soft commercial studio beauty lighting with gold rim highlights.",
        background: geminiCreative?.background || "Minimal luxury salon interior with subtle warm gold bokeh.",
      },
      composition: {
        layout: "80% visual hero area on right/center, 20% negative space on left for typography overlay.",
        focalPoint: isWebsiteLaunch ? "Smartphone device mockup displaying website UI." : "Model hair texture and radiant face expression.",
        spacing: "Generous breathing room around typography and CTA badge.",
      },
      content: {
        brand: brandName,
        headline: headlineText,
        offer: offerText,
        supportingLine: supportingText,
        cta: ctaText,
        location: locationName,
        phone: locationPhone,
        website: websiteUrl,
      },
      cta: {
        text: ctaText,
        style: `High-contrast pill badge using accent color (${accentColor}) with bold typography.`,
      },
      logo_usage: {
        instruction: `Use the approved ${brandName} logo exactly as provided. Do not redraw, distort, recolor, crop or reinterpret the logo.`,
        logoUrl: logoUrl,
        logoStatus: logoUrl ? "Available" : "Not Available",
      },
      typography: {
        primaryFont: fonts[0] || "Poppins",
        secondaryFont: fonts[1] || "Playfair Display",
        headlineStyle: `${fonts[1] || "Playfair Display"} bold editorial uppercase`,
        offerStyle: `${fonts[0] || "Poppins"} extra-bold high contrast badge`,
        ctaStyle: `${fonts[0] || "Poppins"} semi-bold pill button`,
      },
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
      image_style: {
        style: visualStyle,
        preferredPhotography: preferredImageStyle,
      },
      location_details: {
        locationName: locationName,
        phone: locationPhone,
        address: locationAddress,
      },
      restrictions: [
        "Do not overcrowd layout",
        "Do not modify or alter brand logo",
        "Do not use cheap or discount-store graphic elements",
        "Avoid restricted words: Cheap, Guaranteed",
      ],
      quality_requirements: [
        "Premium commercial advertising quality",
        "Professional agency creative execution",
        "High resolution 8k rendering",
        "Clean, legible typography hierarchy",
        "Instagram-ready 1080x1080 1:1 composition",
        "No watermarks or third-party branding",
      ],
      negative_prompt: [
        "cheap flyer appearance",
        "cluttered layout",
        "cartoon illustration",
        "low-resolution graphics",
        "distorted device screens",
        "oversaturated colors",
        "misspelled text",
        "watermarks",
        "unrelated logos",
      ],
    };

    // 2. Poster Specification Object
    const posterSpecification = {
      brand: brandName,
      location: locationName,
      dimensions: "1080 × 1080",
      aspectRatio: "1:1",
      contentRatio: "80% Visual / 20% Content",
      colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      fonts: { primary: fonts[0] || "Poppins", secondary: fonts[1] || "Playfair Display" },
      textHierarchy: {
        brand: brandName,
        headline: headlineText,
        offer: offerText,
        supportingLine: supportingText,
        cta: ctaText,
        location: locationName,
        phone: locationPhone,
        website: websiteUrl,
      },
      logoInstruction: `Use the approved ${brandName} logo exactly as provided. Do not modify or reinterpret.`,
      quality: "Commercial Advertising Grade 8K",
    };

    // 3. Readable Long-Form Generation Prompt Text (Gemini LLM Generated)
    const imagePromptText = geminiCreative?.imagePromptText || `CREATE A COMMERCIAL MARKETING POSTER FOR ${brandName.toUpperCase()} (${locationName.toUpperCase()} BRANCH).

[PROJECT SPECIFICATION]
• Brand Name: ${brandName}
• Business Type: ${businessType} (${industry})
• Location: ${locationName} | Address: ${locationAddress} | Phone: ${locationPhone}
• Campaign Topic: ${isWebsiteLaunch ? "Official Website Launch" : serviceName}
• Website URL: ${websiteUrl}
• Promotional Offer: ${offerText}
• CTA Button: ${ctaText}

[BRAND LOGO DIRECTIVES]
• Official Logo URL: ${logoUrl}
• Logo Placement: Top Header Corner (Top-Left / Top-Right)
• Logo Instruction: Place official ${brandName} logo in top header corner. Maintain original aspect ratio and vector proportions. Do not distort, crop or recolor.

[POSTER LAYOUT & COMPOSITION]
• Canvas Size: 1080x1080 pixels (1:1 Aspect Ratio)
• Content Ratio: 80% Visual Hero Area / 20% Typography Overlay
• Hero Subject: ${heroSubject}
• Lighting: Soft commercial studio beauty lighting with warm gold reflections.
• Background: Minimalist luxury salon interior, soft bokeh depth of field.

[EXACT POSTER TEXT HIERARCHY]
1. BRAND: ${brandName} (Official Logo: ${logoUrl})
2. HEADLINE: ${headlineText}
3. OFFER: ${offerText}
4. SUPPORTING LINE: ${supportingText}
5. CALL TO ACTION: ${ctaText}
6. WEBSITE & LOCATION: ${websiteUrl} • ${locationName} • Call: ${locationPhone}

[BRAND DESIGN SYSTEM]
• Primary Color: ${primaryColor}
• Secondary Color: ${secondaryColor}
• Accent Badge Color: ${accentColor}
• Headline Font: ${fonts[1] || "Playfair Display"} (Bold Editorial)
• Body & CTA Font: ${fonts[0] || "Poppins"} (Clean Modern)
• Visual Style: ${visualStyle} (${preferredImageStyle})

[RESTRICTIONS & NEGATIVE PROMPT]
• DO NOT alter, crop, recolor or reinterpret the brand logo.
• DO NOT overcrowd the visual space. Keep generous padding and clean breathing room.
• NEGATIVE PROMPT: cheap flyer appearance, cluttered layout, cartoon graphics, low-resolution device screens, distorted hands, oversaturated colors, watermarks, misspelled text.

[QUALITY STANDARD]
Ultra-high resolution commercial grade marketing poster, flawless digital UI device render, natural salon lighting, crisp typography layout, instagram-ready 8k render.`;

    // 4. Generate Live High-Resolution Commercial Poster Image
    const { generatePosterImage } = require("../providers/AIProvider");
    let imageResult = null;
    try {
      imageResult = await generatePosterImage({
        prompt: imagePromptText,
        brandName,
        serviceName,
        offerText,
        headlineText,
        supportingText,
        ctaText,
        locationName,
        locationPhone,
        logoUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        isWebsiteLaunch,
      });
    } catch (err) {
      console.warn("Poster image generation fallback warning:", err.message);
    }

    return {
      conceptName,
      assetType: "Poster",
      dimensions: {
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
      },
      visualStyle,
      brandColors: `${primaryColor}, ${secondaryColor}, ${accentColor}`,
      logoUrl,
      visualDirection,
      headline: headlineText,
      supportingCopy: supportingText,
      cta: ctaText,
      imagePrompt: imagePromptText,
      imagePromptText: imagePromptText,
      structuredPrompt: structuredPrompt,
      posterSpecification: posterSpecification,
      imageUrl: imageResult?.url || null,
      imageProvider: imageResult?.provider || "Digitalness Commercial Poster Engine",
      imageStatus: imageResult?.url ? "Generated" : "Awaiting Generation",
    };
  }
}

module.exports = new CreativeAgent();
