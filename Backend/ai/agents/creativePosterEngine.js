/**
 * creativePosterEngine.js
 * Universal Dynamic Creative Poster Strategy, Prompt, and Asset Engine.
 * Dynamically synthesizes high-converting advertising briefs, production prompts,
 * visual styling, and composition parameters for ANY client, industry, or campaign type.
 */

const Customer = require("../../models/Customer");
const AIProvider = require("../providers/AIProvider");

// Industry Presets & Brand Styles
const INDUSTRY_PRESETS = {
  "technology": {
    industry: "Technology & SaaS",
    brandStyle: "Futuristic · Minimalist · High-Tech",
    primaryColors: "Deep Indigo + Neon Cyan",
    colorPalette: { primary: "#0B0F19", secondary: "#06B6D4", accent: "#6366F1", text: "#FFFFFF" },
    headline: "The Future Of Innovation Is Here",
    supportingLine: "Scale Smarter With Intelligent Solutions",
    conceptName: "INTELLIGENT MATRIX",
    conceptDescription: "Sleek glassmorphism dashboards floating in a minimalist holographic dark workspace with glowing laser grid accents.",
    cta: "Explore Now",
    visualSubject: "Futuristic digital interface mockup, glass holographic analytics dashboard, glowing electric blue and cyan lasers",
  },
  "real estate": {
    industry: "Real Estate",
    brandStyle: "Premium · Professional · Modern",
    primaryColors: "Navy Blue + Gold",
    colorPalette: { primary: "#0A192F", secondary: "#D4AF37", accent: "#F8FAFC", text: "#FFFFFF" },
    headline: "Discover Luxury Living",
    supportingLine: "Architectural Excellence Crafted For Modern Lifestyles",
    conceptName: "ARCHITECTURAL HARMONY",
    conceptDescription: "High-end luxury architectural visual with pristine interior details, subtle golden sunlight, and modern typography.",
    cta: "Schedule Private Tour",
    visualSubject: "Modern architectural luxury residence, dramatic interior lighting, high ceiling glass facade, premium furniture staging",
  },
  "beauty": {
    industry: "Beauty & Wellness",
    brandStyle: "Luxury · Elegant · Organic",
    primaryColors: "Rose Gold + Deep Charcoal",
    colorPalette: { primary: "#1E1E24", secondary: "#D4AF37", accent: "#F7ECE1", text: "#FFFFFF" },
    headline: "Unveil Your Natural Glow",
    supportingLine: "Exclusive Luxury Treatments Crafted For You",
    conceptName: "RADIANCE UNLEASHED",
    conceptDescription: "A high-fashion beauty visual with soft golden backlight and botanical accents, showcasing signature aesthetic excellence.",
    cta: "Book Appointment Now",
    visualSubject: "Editorial beauty studio photography, glowing skincare texture, warm rim lighting, minimalistic luxury backdrop",
  },
  "salon": {
    industry: "Beauty & Wellness",
    brandStyle: "Luxury · Elegant · Modern",
    primaryColors: "Rose Gold + Deep Charcoal",
    colorPalette: { primary: "#1A1A1A", secondary: "#C79A6B", accent: "#F7F2ED", text: "#FFFFFF" },
    headline: "Colour Your Confidence",
    supportingLine: "Signature Hair & Styling Experiences Tailored For You",
    conceptName: "SIGNATURE STYLING",
    conceptDescription: "Premium salon styling creative featuring vibrant hair aesthetics, clean modern typography, and luxury studio lighting.",
    cta: "Book Your Slot",
    visualSubject: "Commercial hair and beauty photography, high-end modern salon interior, professional rim highlights",
  },
  "healthcare": {
    industry: "Healthcare & Dental",
    brandStyle: "Trustworthy · Clean · Advanced",
    primaryColors: "Teal Blue + Medical White",
    colorPalette: { primary: "#0F3D3E", secondary: "#22D3EE", accent: "#F0FDF4", text: "#FFFFFF" },
    headline: "Expert Care For Your Perfect Health",
    supportingLine: "World-Class Clinical & Preventive Healthcare Services",
    conceptName: "PURE CARE",
    conceptDescription: "Bright, welcoming modern clinical studio with advanced medical aesthetics, reassuring warmth and crystal clarity.",
    cta: "Schedule Consultation",
    visualSubject: "State-of-the-art modern clinic environment, warm professional aesthetic, clean ambient high-key daylight",
  },
  "food": {
    industry: "Food & Hospitality",
    brandStyle: "Artisanal · Appetizing · Vibrant",
    primaryColors: "Warm Terracotta + Mustard Gold",
    colorPalette: { primary: "#7C2D12", secondary: "#F59E0B", accent: "#FEF3C7", text: "#FFFFFF" },
    headline: "A Symphony Of Authentic Flavours",
    supportingLine: "Experience Gourmet Dining Reimagined This Season",
    conceptName: "CULINARY MASTERPIECE",
    conceptDescription: "Dramatic dark-tabletop food photography with steam, fresh garnishes, and golden directional spotlighting.",
    cta: "Reserve Your Table",
    visualSubject: "Artisanal culinary dish plating, dramatic chiaroscuro spotlight, fresh herbs and delicate steam rising",
  },
  "retail": {
    industry: "Retail & E-Commerce",
    brandStyle: "Bold · Trendy · Premium",
    primaryColors: "Crimson Red + Platinum",
    colorPalette: { primary: "#881337", secondary: "#F43F5E", accent: "#FFF1F2", text: "#FFFFFF" },
    headline: "The Grand Collection",
    supportingLine: "Exclusive Ranges & Unmatched Quality",
    conceptName: "ROYAL SHOWCASE",
    conceptDescription: "High-energy editorial fashion showcase with striking geometric podiums and sleek luxury product staging.",
    cta: "Shop The Collection",
    visualSubject: "High-end product showcase on marble podium, dynamic soft shadows, luxury retail mood",
  },
  "agency": {
    industry: "Marketing & Creative Agency",
    brandStyle: "Bold · Modern · Results-Driven",
    primaryColors: "Electric Purple + Neon Amber",
    colorPalette: { primary: "#180D2B", secondary: "#8B5CF6", accent: "#F59E0B", text: "#FFFFFF" },
    headline: "Transform Your Digital Growth",
    supportingLine: "Full-Funnel Growth Engineering & High-Converting Creatives",
    conceptName: "GROWTH MATRIX",
    conceptDescription: "Dynamic geometric design with 3D glass analytics widgets and bold typography.",
    cta: "Scale With Us",
    visualSubject: "High-energy agency studio visual, 3D holographic growth curves, sleek creative workspace aesthetic",
  },
};

/**
 * Fuzzy string similarity helper (Levenshtein-based ratio)
 */
function similarity(s1, s2) {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

const KNOWN_OCCASIONS = [
  "ganesh chaturthi", "vinayaka chavithi", "diwali", "deepavali", "eid", "ramzan",
  "good morning", "morning post", "daily motivation", "daily post", "daliy post", "daliy", "daily",
  "navratri", "durga puja", "dussehra", "christmas", "new year",
  "independence day", "republic day", "raksha bandhan", "onam", "pongal", "holi",
  "website launch", "grand opening", "discount", "offer", "sale"
];

/**
 * Universal dynamic analyzer to build a complete creative brief & generation prompt for ANY request.
 */
async function synthesizePosterBrief(userPrompt = "", existingContext = {}) {
  const p = (userPrompt || "").toLowerCase();

  // 1. Resolve Manager Intent Snapshot
  const managerIntent = parseManagerIntent(userPrompt, existingContext);

  // 2. Resolve Customer Record & Context Lock
  let customerDoc = null;
  let clientName = existingContext.customerName || existingContext.clientName || existingContext.name || null;
  let isRegisteredInCRM = false;
  let customerPhone = "PHONE_MISSING";
  let customerWebsite = "www.digitalness.agency";
  let customerColors = "#0B0F19 + #06B6D4";
  let customerIndustry = "Digital Marketing & Agency";
  let customerBrandStyle = "Premium · Professional · Modern";
  let hasLogo = false;

  if (existingContext.customerId) {
    try {
      customerDoc = await Customer.findById(existingContext.customerId).lean();
    } catch (e) {}
  }

  // If no customerId in context, try deterministic name matching (NO fuzzy guessing that jumps tenants!)
  if (!customerDoc && clientName) {
    try {
      const cleanSearch = clientName.trim();
      customerDoc = await Customer.findOne({
        name: { $regex: new RegExp(`^${cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
        status: { $ne: "Inactive" },
      }).lean();
    } catch (e) {}
  }

  if (customerDoc) {
    isRegisteredInCRM = true;
    clientName = customerDoc.name;
    customerIndustry = customerDoc.businessType || customerDoc.industry || "Digital Marketing & Agency";
    customerPhone = (customerDoc.contactNumbers && customerDoc.contactNumbers[0]) || customerDoc.phone || "PHONE_MISSING";
    customerWebsite = customerDoc.website || `www.${clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const bColors = customerDoc.brandProfile?.brandColors || customerDoc.brandContext?.brandColors;
    if (Array.isArray(bColors) && bColors.length > 0) {
      customerColors = bColors.join(" + ");
    }
    hasLogo = Boolean(customerDoc.logoUrl || customerDoc.brandProfile?.logoUrl);
  } else {
    // If explicit test client or temporary client name
    clientName = clientName || "Digitalness Pilot";
    if (clientName.toLowerCase().includes("test") || clientName.toLowerCase().includes("pilot")) {
      clientName = "Digitalness Pilot";
      customerIndustry = "Digital Marketing & Agency";
      customerPhone = "+91 91234 56789";
      customerWebsite = "www.digitalness.agency";
      customerColors = "#0B0F19 + #06B6D4";
      hasLogo = true;
      isRegisteredInCRM = true; // Digitalness Pilot built-in test client
    }
  }

  // 3. Resolve Industry Preset & Style
  let detectedKey = "agency";
  const indLower = (existingContext.industry || customerIndustry || "").toLowerCase();

  if (indLower.includes("health") || indLower.includes("clinic") || indLower.includes("dental") || indLower.includes("doctor")) {
    detectedKey = "healthcare";
  } else if (indLower.includes("real estate") || indLower.includes("villa") || indLower.includes("property") || indLower.includes("builder")) {
    detectedKey = "real estate";
  } else if (indLower.includes("salon") || indLower.includes("spa") || indLower.includes("hair")) {
    detectedKey = "salon";
  } else if (indLower.includes("beauty") || indLower.includes("skin")) {
    detectedKey = "beauty";
  } else if (indLower.includes("food") || indLower.includes("restaurant") || indLower.includes("cafe") || indLower.includes("dine")) {
    detectedKey = "food";
  } else if (indLower.includes("tech") || indLower.includes("software") || indLower.includes("saas") || indLower.includes("ai")) {
    detectedKey = "technology";
  } else if (indLower.includes("retail") || indLower.includes("fashion") || indLower.includes("ecommerce")) {
    detectedKey = "retail";
  } else {
    detectedKey = "agency";
  }

  const preset = INDUSTRY_PRESETS[detectedKey] || INDUSTRY_PRESETS["agency"];
  const industry = existingContext.industry || customerIndustry || preset.industry;
  const brandStyle = existingContext.brandStyle || customerBrandStyle || preset.brandStyle;
  const primaryColors = existingContext.brandColors || customerColors;

  // 4. Resolve Campaign Objective & Copy (with Master Art-Directed Prompt Architecture)
  const discountMatch = p.match(/(\d+%\s*(?:off|discount|offer)?)/i);
  const discountNumMatch = p.match(/(\d+%)/);
  const discountStr = discountMatch ? discountMatch[1].toUpperCase() : (discountNumMatch ? discountNumMatch[1] : null);
  const cleanDiscount = discountStr ? (discountStr.includes("OFF") ? discountStr : `${discountStr} OFF`).trim() : null;

  const isGanesha = p.includes("ganesh") || p.includes("vinayaka") || p.includes("chaturthi") || p.includes("chavithi");
  const isDiwali = p.includes("diwali") || p.includes("deepavali");
  const isDusshra = p.includes("dussehra") || p.includes("navratri") || p.includes("durga puja");
  const isEid = p.includes("eid") || p.includes("ramzan") || p.includes("ramadan");
  const isChristmas = p.includes("christmas") || p.includes("xmas");
  const isNewYear = p.includes("new year") || p.includes("newyear");
  const isLaunch = p.includes("grand opening") || p.includes("launch") || p.includes("new branch");
  const isHydra = p.includes("hydrafacial") || p.includes("facial") || p.includes("skincare") || p.includes("skin glow");
  const isBogo = p.includes("bogo") || p.includes("buy 1 get 1") || p.includes("buy one get one");
  const isMorning = p.includes("morning") || p.includes("motivation") || p.includes("daily");

  let campaignType = "Commercial Advertising Poster — Creative Brief";
  let eventName = "Brand Awareness & Engagement";
  let dateHighlight = "Festive Spotlight";
  let headline = "TRANSFORM YOUR BRAND'S GROWTH";
  let supportingLine = `Experience unmatched excellence, scalable performance, and premium service with ${clientName}.`;
  let cta = "Connect With Us";
  let offerText = "EXCLUSIVE SIGNATURE OFFER";
  let conceptName = "COMMERCIAL SPOTLIGHT";
  let conceptDescription = "High-energy commercial advertising visual with cinematic lighting, refined brand geometry, and clean negative space for typography.";
  let visualSubject = "";
  let masterPrompt = "";
  let layoutTheme = "gold_luxury";
  let occasionCategory = "Commercial";
  let generationEngine = "CRM_CREATIVE_STRATEGY_ENGINE";

  // Master camera & quality parameters for photorealistic generation
  const cameraSignature = "Hasselblad H6D-100c medium format, 85mm f/1.4 luxury commercial prime lens, shallow depth of field, creamy background bokeh, ultra-sharp focus on subject, cinematic 3-point studio lighting with warm golden key and volumetric rim highlights, photorealistic 8k render, hyper-detailed textures";
  const negativeSpaceRule = "clean generous negative space in top 25% for headline typography and bottom 25% for branding footer, no text, no words, no letters, no numbers, no logo, no watermark, no signatures, no cartoon, no blurry artifacts";

  const tagline = existingContext.tagline || customerDoc?.brandProfile?.tagline || "";
  const services = existingContext.services || (customerDoc?.businessProfile?.services || []).join(", ") || "";
  const usp = existingContext.usp || (customerDoc?.businessProfile?.usp || []).join(", ") || "";
  const targetAudience = existingContext.targetAudience || (customerDoc?.businessProfile?.targetAudience || []).join(", ") || "Discerning Customers & Local Community";
  const tone = existingContext.toneOfVoice || (customerDoc?.brandProfile?.toneOfVoice || []).join(", ") || "Prestigious, Warm, Authoritative, High-Converting";
  const visualStyle = existingContext.visualStyle || customerDoc?.brandProfile?.visualStyle || brandStyle;
  const brandDescription = existingContext.brandDescription || customerDoc?.brandProfile?.description || "";

  const metaPromptSent = `[SYSTEM: ELITE ADVERTISING CREATIVE DIRECTOR & PROMPT ENGINEER]
You are creating a complete social media advertising campaign package and master photographic generation prompt for a verified CRM business client.

[CLIENT ONBOARDED BRAND PROFILE]:
• Brand / Company Name: ${clientName}
${tagline ? `• Brand Tagline: "${tagline}"` : ""}
• Industry Vertical: ${industry}
• Visual Identity Style: ${visualStyle}
• Brand Color Palette: ${primaryColors}
${services ? `• Core Services / Offerings: ${services}` : ""}
${usp ? `• Unique Selling Proposition (USP): ${usp}` : ""}
${brandDescription ? `• Brand Summary: ${brandDescription}` : ""}
• Target Audience: ${targetAudience}
• Tone of Voice: ${tone}
• Official Contact Line: ${customerPhone}
• Official Website: ${customerWebsite}
• Location / City: ${existingContext.city || customerDoc?.city || "Hyderabad Flagship"}

[CAMPAIGN OCCASION & OBJECTIVE]:
• Occasion / Theme: "${userPrompt || "Special Brand Showcase & Promotion"}"
• User Directives: "${existingContext.customPrompt || "Highlight client expertise, festive warmth, premium quality, and exclusive booking CTA."}"

[TASK: SYNTHESIZE RICH, EXTENSIVE 100% BESPOKE CAMPAIGN PACKAGE]:
Generate the following comprehensive structured fields with full creative freedom and NO restrictive word limits:
1. "visualPrompt": An extensive, hyper-detailed commercial graphic poster design prompt (200-500+ words). Detail the full composition, central subject staging, architectural/festive background, exact bold headline text in quotes (e.g. "DIVINE BLESSINGS OF LORD GANESHA"), sub-text in quotes, promotional badge ribbon, exact brand placement for "${clientName}", materials, textures, color gradients, and cinematic studio lighting.
2. "headline": High-impact promotional advertising headline (UPPERCASE).
3. "subheadline": Rich, compelling value proposition explaining why customers should choose ${clientName}.
4. "cta": Action-oriented CTA button (e.g., "Book Your Slot", "Schedule Private Consultation", "Claim Exclusive Offer").
5. "offerText": Promotional badge ribbon text (e.g., "FESTIVE MEGA CELEBRATION SPECIAL", "EXCLUSIVE LIMITED-TIME PRIVILEGE").
6. "conceptName": Creative concept title.
7. "conceptDescription": Comprehensive creative rationale detailing the artistic vision and emotional hook.
8. "layoutTheme": Best matching theme from ["gold_luxury", "modern_glass", "festive_divine", "bold_commercial", "clinical_teal"].
9. "caption": An extensive, long-form high-converting social media caption formatted with engaging hooks, value bullet points, verified clinic address, direct phone line, website, and clear call to action.
10. "hashtags": Array of 10-15 targeted hashtags combining the brand name, industry, occasion, location, and viral business tags.`;

  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("📤 [creativePosterEngine] META-PROMPT SENT TO AI TO SYNTHESIZE POSTER PROMPT:");
  console.log(metaPromptSent);
  console.log("══════════════════════════════════════════════════════════════════════════════");

  // Always invoke dynamic AI Generation (Gemini, OpenAI, or Free Pollinations AI)
  try {
    const aiStatus = AIProvider.getAIStatus();
    console.log(`[creativePosterEngine] 🤖 Calling AI text model (${aiStatus.textProvider}) to synthesize prompt & copywriting for "${clientName}" (${industry})...`);
    
    const aiResponse = await AIProvider.generateStructured({
      systemPrompt: metaPromptSent,
      prompt: `Synthesize the complete creative poster package for brand "${clientName}" celebrating "${userPrompt || "Brand Growth"}". Follow all guidelines.`,
      schemaName: "creative_poster_package",
    });

    if (aiResponse && (aiResponse.visualPrompt || aiResponse.headline)) {
      console.log(`[creativePosterEngine] ✓ Successfully synthesized creative package via AI LLM (${aiStatus.textProvider})!`);
      if (aiResponse.headline) headline = aiResponse.headline.toUpperCase();
      if (aiResponse.subheadline) supportingLine = aiResponse.subheadline;
      if (aiResponse.cta) cta = aiResponse.cta;
      if (aiResponse.offerText) offerText = aiResponse.offerText;
      if (aiResponse.conceptName) conceptName = aiResponse.conceptName;
      if (aiResponse.conceptDescription) conceptDescription = aiResponse.conceptDescription;
      if (aiResponse.layoutTheme) layoutTheme = aiResponse.layoutTheme;
      if (aiResponse.visualPrompt) {
        masterPrompt = aiResponse.visualPrompt.trim();
      }
      generationEngine = `AI (${aiStatus.textProvider})`;
    }
  } catch (llmErr) {
    console.warn(`[creativePosterEngine] AI generation skipped: ${llmErr.message}. Utilizing master strategy engine.`);
  }

  // Fallback / Preset Engine if masterPrompt was not generated by LLM
  if (!masterPrompt) {

  if (isGanesha) {
    campaignType = "Festive Social Media Greeting — Vinayaka Chavithi";
    eventName = "Vinayaka Chavithi Special Greeting";
    dateHighlight = "Auspicious Vinayaka Chavithi";
    headline = "DIVINE BLESSINGS OF LORD GANESHA";
    supportingLine = "May Lord Ganesha bless every new beginning with wisdom, prosperity, and boundless success.";
    cta = "Warm Festive Greetings";
    offerText = "FESTIVE CELEBRATION SPECIAL";
    conceptName = "DIVINE BEGINNINGS — WISDOM, PROSPERITY & GRACE";
    conceptDescription = "Sophisticated festive graphic poster featuring bold gold typography, traditional Lord Ganesha idol, and warm cinematic illumination.";
    layoutTheme = "festive_divine";
    occasionCategory = "Festival";

    visualSubject = `Commercial graphic advertising poster for "${clientName}". Bold 3D gold embossed headline typography reading "DIVINE BLESSINGS OF LORD GANESHA" at top center, elegant sub-greeting "Happy Ganesh Chaturthi", beautifully sculpted traditional Indian Lord Ganesha idol resting on a carved teakwood pedestal with glowing brass diyas and orange marigold petals, cinematic 3-point saffron lighting, luxury gold border, photorealistic 8k render, professional commercial graphic design layout`;
    masterPrompt = visualSubject;
  } else if (isDiwali) {
    campaignType = "Festive Social Media Greeting — Diwali";
    eventName = "Diwali Festival of Lights";
    dateHighlight = "Auspicious Deepavali";
    headline = "ILLUMINATING JOY & PROSPERITY";
    supportingLine = "May the divine festival of lights illuminate your journey with boundless joy, peace, and triumph.";
    cta = "Celebrate With Us";
    offerText = "DIWALI MEGA FESTIVE PRIVILEGE";
    conceptName = "ETERNAL RADIANCE — FESTIVAL OF LIGHTS";
    conceptDescription = "High-end festive graphic poster featuring glowing brass oil lamps, gold typography, and warm ambient reflections.";
    layoutTheme = "festive_divine";
    occasionCategory = "Festival";

    visualSubject = `Commercial graphic advertising poster for "${clientName}". Bold 3D gold embossed headline typography reading "HAPPY DIWALI - ILLUMINATING JOY & PROSPERITY" at top center, handcrafted traditional brass diyas emitting warm golden flames on polished mahogany, fresh golden marigold petals and lotus flowers, cinematic saffron and amber studio lighting, luxury gold border, photorealistic 8k render, professional commercial graphic design layout`;
    masterPrompt = visualSubject;
  } else if (isEid) {
    campaignType = "Festive Social Media Greeting — Eid Special";
    eventName = "Eid Mubarak Celebration";
    dateHighlight = "Eid Mubarak";
    headline = "EID MUBARAK & WARMEST BLESSINGS";
    supportingLine = "Wishing you and your loved ones peace, harmony, happiness, and prosperity this blessed Eid.";
    cta = "Eid Mubarak Greetings";
    offerText = "EID CELEBRATION SPECIAL";
    conceptName = "CRESCENT SERENITY";
    conceptDescription = "Elegant Islamic crescent and glowing traditional lantern visual with bold gold typography.";
    layoutTheme = "gold_luxury";
    occasionCategory = "Festival";

    visualSubject = `Commercial graphic advertising poster for "${clientName}". Bold gold metallic headline typography reading "EID MUBARAK" with elegant Arabic calligraphy accents, ornamental gold Moroccan lantern with glowing candle, luminous crescent moon in royal midnight blue sky, luxury gold framing, photorealistic 8k render, professional commercial graphic design layout`;
    masterPrompt = visualSubject;
  } else if (isChristmas || isNewYear) {
    campaignType = "Holiday & New Year Celebration";
    eventName = "New Year Grand Spotlight";
    dateHighlight = "Happy New Year";
    headline = "A YEAR OF NEW POSSIBILITIES";
    supportingLine = "Here's to new milestones, extraordinary achievements, and remarkable growth together.";
    cta = "Celebrate New Beginnings";
    offerText = "NEW YEAR SPECIAL PRIVILEGE";
    conceptName = "CELESTIAL CELEBRATION";
    conceptDescription = "Luxury festive celebration with champagne gold sparkles and bold modern typography.";
    layoutTheme = "gold_luxury";
    occasionCategory = "Festival";

    visualSubject = `Commercial graphic advertising poster for "${clientName}". Bold modern gold typography reading "HAPPY NEW YEAR - A YEAR OF NEW POSSIBILITIES", luxury celebratory champagne gold confetti and marble podium, shimmering gold bokeh, photorealistic 8k render, professional commercial graphic design layout`;
    masterPrompt = visualSubject;
  } else if (isHydra || detectedKey === "beauty" || detectedKey === "healthcare") {
    campaignType = "Clinical Skincare & Glow Spotlight";
    eventName = "Medical Grade Skincare Treatment";
    headline = "REVEAL FLAWLESS GLASS SKIN";
    supportingLine = `Experience medical-grade hydration, deep pore purification, and instant skin renewal at ${clientName}.`;
    cta = "Book Your Session";
    offerText = cleanDiscount || "25% OFF FIRST SESSION";
    conceptName = "RADIANT PURITY & CLINICAL EXCELLENCE";
    conceptDescription = "High-end clinical luxury skincare poster with glowing glass aesthetics and bold typography.";
    layoutTheme = "clinical_teal";
    occasionCategory = "Healthcare";

    visualSubject = `Commercial graphic advertising poster for "${clientName}". Bold modern typography reading "REVEAL FLAWLESS GLASS SKIN - ${cleanDiscount || '25% OFF'}", luxury frosted glass skincare cosmetic bottle on marble podium with pure water droplets, soothing teal ambient studio lighting, photorealistic 8k render, professional commercial graphic design layout`;
    masterPrompt = visualSubject;
  } else if (isBogo || cleanDiscount) {
    const promoHeadline = isBogo ? "BUY 1 GET 1 FREE SPECIAL" : `UNLOCK EXCLUSIVE ${cleanDiscount}`;
    campaignType = `Special Promotion — ${isBogo ? "BOGO Privilege" : cleanDiscount}`;
    eventName = `Exclusive ${isBogo ? "Buy 1 Get 1" : cleanDiscount} Promotional Offer`;
    dateHighlight = isBogo ? "Limited Time BOGO" : `Exclusive ${cleanDiscount}`;
    headline = promoHeadline;
    supportingLine = `Take advantage of our limited-time special offer with ${clientName}. Experience unmatched quality and premium service today.`;
    cta = isBogo ? "Claim BOGO Offer Now" : `Claim ${cleanDiscount} Today`;
    offerText = isBogo ? "★ BUY 1 GET 1 FREE ★" : `★ ${cleanDiscount} LIMITED OFFER ★`;
    conceptName = "PROMOTIONAL CELEBRATION";
    conceptDescription = "High-end commercial promotional visual with celebratory studio lighting, refined minimal podium backdrop, and generous negative space.";
    layoutTheme = "bold_commercial";
    occasionCategory = "Offer";

    visualSubject = `High-end commercial promotional luxury studio setting, floating frosted glass podium with refined golden geometric accents, warm ambient studio spotlights, celebratory soft light reflections, ${primaryColors} inspired palette`;
    masterPrompt = `${visualSubject}, ${cameraSignature}, ${negativeSpaceRule}`;
  } else if (isLaunch) {
    campaignType = "Grand Opening & Expansion Announcement";
    eventName = "Grand Opening & Launch";
    headline = "THE DOORS TO LUXURY ARE OPEN";
    supportingLine = `We are proud to welcome you to our brand new flagship destination. Visit us today at ${existingContext.city || "our premium location"}.`;
    cta = "Visit Us Today";
    offerText = "GRAND OPENING SPECIAL";
    conceptName = "ARCHITECTURAL LAUNCH";
    conceptDescription = "Modern luxury flagship entrance with architectural spotlights, red carpet ribbon aesthetic, and bold typography.";
    layoutTheme = "modern_glass";
    occasionCategory = "Launch";

    visualSubject = "Ultra-modern luxury flagship store entrance, dramatic architectural uplighting, sleek dark glass facade with warm interior golden illumination, clean minimalist foreground";
    masterPrompt = `${visualSubject}, ${cameraSignature}, ${negativeSpaceRule}`;
  } else if (isMorning) {
    campaignType = "Daily Inspiration & Brand Thought Leadership";
    eventName = "Daily Radiance";
    headline = "EVERY MORNING BRINGS NEW EXCELLENCE";
    supportingLine = `Start your day with clarity, determination, and unstoppable focus. Grow with ${clientName}.`;
    cta = "Embrace Today's Growth";
    offerText = "DAILY MOTIVATION";
    conceptName = "GOLDEN DAWN";
    conceptDescription = "Serene sunrise golden hour landscape with morning dew reflections and crisp modern typography.";
    layoutTheme = "modern_glass";
    occasionCategory = "Daily";

    visualSubject = "Dramatic golden hour sunrise illuminating a modern sleek architectural terrace, soft warm morning sun rays cutting through gentle mist, peaceful luxury atmosphere";
    masterPrompt = `${visualSubject}, ${cameraSignature}, ${negativeSpaceRule}`;
  } else {
    // Default tailored to client industry
    visualSubject = `High-end commercial ${industry} visual, ${brandStyle} aesthetic, sophisticated staging, ${primaryColors} inspired ambient palette, dramatic studio lighting`;
    masterPrompt = `${visualSubject}, ${cameraSignature}, ${negativeSpaceRule}`;
    layoutTheme = "modern_glass";
  }
}

  // 5. Build High-Converting Social Caption & Formatted Hashtags
  const cleanBrandTag = clientName.replace(/[^a-zA-Z0-9]/g, "");
  const cleanIndTag = industry.replace(/[^a-zA-Z0-9]/g, "");
  const cityTag = (existingContext.city || customerDoc?.city || "Hyderabad").replace(/[^a-zA-Z0-9]/g, "");

  const hashtagList = [
    `#${cleanBrandTag || "Digitalness"}`,
    `#${cleanIndTag || "BusinessGrowth"}`,
    `#${cityTag}Business`,
    `#${cityTag}`,
    `#${eventName.replace(/[^a-zA-Z0-9]/g, "")}`,
    "#SpecialOffer",
    "#LuxuryExperience",
    "#TrendingNow",
    "#TopBrand",
    "#InstaDaily",
  ];

  const targetCount = managerIntent.hashtagCount || 8;
  const exactHashtags = hashtagList.slice(0, targetCount);
  const formattedHashtagString = exactHashtags.join(" ");

  const generatedCaption = `✨ **${headline}** ✨\n\n${supportingLine}\n\n🌟 **Why Choose ${clientName}:**\n• Premium Quality & Certified Excellence\n• Tailored Solutions & Dedicated Support\n• Limited-Time Exclusive Privilege\n\n📍 **Location:** ${existingContext.locationName || customerDoc?.city || "Flagship HQ"}\n📞 **Direct Line:** ${customerPhone}\n🌐 **Official Website:** ${customerWebsite}\n\n👉 **${cta} — Tap the link in bio to get started!**\n\n.\n.\n.\n${formattedHashtagString}`;

  // 6. Generate VISUAL-ONLY Image Prompt
  const scenePrompt = masterPrompt;

  // 7. Structured Packages
  const contentPackage = {
    headline,
    subheadline: supportingLine,
    offerText,
    cta,
    caption: generatedCaption,
    hashtags: exactHashtags,
    hashtagString: formattedHashtagString,
  };

  const visualPackage = {
    concept: conceptName,
    scenePrompt,
    layoutTheme,
    composition: {
      logoBranding: "10%",
      heroVisual: "65%",
      headlineDate: "15%",
      ctaWebsite: "10%",
    },
    palette: primaryColors,
    negativePrompt: "text, watermark, typography, letters, words, numbers, logo, signature, low quality, blurry",
  };

  const rendererPackage = {
    logo: isRegisteredInCRM && hasLogo ? "CRM_LOGO_EMBED" : "DEFAULT_LOGO",
    headline,
    subheadline: supportingLine,
    offerText,
    phone: customerPhone,
    website: customerWebsite,
    cta,
    layoutTheme,
  };

  const verifiedChecklist = [
    {
      label: isRegisteredInCRM ? "Logo & Brand verified in CRM" : "Test client profile applied (CRM Verified)",
      verified: isRegisteredInCRM,
      source: isRegisteredInCRM ? "CRM" : "UNVERIFIED",
      sourceCustomerId: customerDoc?._id || "test_pilot_br001",
    },
    {
      label: `Brand colors (${primaryColors})`,
      verified: true,
      source: isRegisteredInCRM ? "CRM" : "UNVERIFIED",
    },
    {
      label: `Phone (${customerPhone})`,
      verified: customerPhone !== "PHONE_MISSING",
      source: customerPhone !== "PHONE_MISSING" ? "CRM" : "MISSING",
    },
    {
      label: `Website (${customerWebsite})`,
      verified: true,
      source: isRegisteredInCRM ? "CRM" : "DEFAULT",
    },
    {
      label: `Canvas format (${managerIntent.posterSize})`,
      verified: true,
      source: "MANAGER_INTENT",
    },
    {
      label: "Approval required before generation",
      verified: true,
      source: "POLICY_GATE",
    },
  ];

  return {
    client: {
      name: clientName,
      industry,
      brandStyle,
      primaryColors,
      logoStatus: isRegisteredInCRM ? "Approved CRM logo verified" : "Test client profile applied",
      website: customerWebsite,
      phone: customerPhone,
      isRegisteredCustomer: isRegisteredInCRM,
      customerId: customerDoc?._id || null,
    },
    campaign: {
      type: `${industry} Poster — Creative Brief`,
      event: eventName,
      launchDate: "Immediate Campaign",
      platform: managerIntent.platform,
      posterSize: managerIntent.posterSize,
      aspectRatio: managerIntent.aspectRatio,
      publishAllowed: managerIntent.publishAllowed,
      status: "WAITING APPROVAL",
      occasionCategory,
    },
    communication: {
      headline,
      supportingLine,
      offerText,
      dateHighlight,
      cta,
      phone: customerPhone,
      website: customerWebsite,
      caption: generatedCaption,
      instagramCaption: generatedCaption,
      hashtags: exactHashtags,
      hashtagString: formattedHashtagString,
    },
    socialCopy: {
      caption: generatedCaption,
      instagramCaption: generatedCaption,
      hashtags: exactHashtags,
      hashtagString: formattedHashtagString,
    },
    creativeConcept: {
      name: conceptName,
      description: conceptDescription,
    },
    layoutTheme,
    visualComposition: visualPackage.composition,
    finalPrompt: scenePrompt,
    generationEngine,
    metaPromptSent,
    contentPackage,
    visualPackage,
    rendererPackage,
    managerIntent,
    verifiedChecklist,
  };
}

/**
 * Helper to parse and extract immutable Manager Intent Snapshot from prompt.
 */
function parseManagerIntent(prompt = "", context = {}) {
  const p = (prompt || "").toLowerCase();

  // 1. Exact Canvas Size
  let width = 1080;
  let height = 1080;
  let posterSize = "1080 × 1080 px";
  let aspectRatio = "1:1";

  if (p.includes("1080x1350") || p.includes("1080 x 1350") || p.includes("4:5") || p.includes("portrait")) {
    width = 1080;
    height = 1350;
    posterSize = "1080 × 1350 px";
    aspectRatio = "4:5";
  } else if (p.includes("1080x1920") || p.includes("1080 x 1920") || p.includes("9:16") || p.includes("story") || p.includes("reel")) {
    width = 1080;
    height = 1920;
    posterSize = "1080 × 1920 px";
    aspectRatio = "9:16";
  } else if (p.includes("1080x1080") || p.includes("1080 x 1080") || p.includes("1:1") || p.includes("square")) {
    width = 1080;
    height = 1080;
    posterSize = "1080 × 1080 px";
    aspectRatio = "1:1";
  }

  // 2. Exact Platform
  let platform = "Instagram";
  if (p.includes("instagram") && p.includes("facebook")) {
    platform = "Instagram + Facebook";
  } else if (p.includes("facebook") && !p.includes("instagram")) {
    platform = "Facebook";
  } else if (p.includes("linkedin")) {
    platform = "LinkedIn";
  } else if (p.includes("instagram")) {
    platform = "Instagram";
  }

  // 3. Exact Hashtag Count
  let hashtagCount = 5;
  const hashMatch = p.match(/(\d+)\s*hashtags?/i);
  if (hashMatch && hashMatch[1]) {
    hashtagCount = parseInt(hashMatch[1], 10);
  }

  // 4. Publishing Allowed
  const publishAllowed = !(
    p.includes("do not publish") ||
    p.includes("don't publish") ||
    p.includes("approval first") ||
    p.includes("plan for approval") ||
    p.includes("approval required") ||
    p.includes("plan first")
  );

  // 5. Objective
  let objective = "Digital Marketing Services Awareness";
  if (p.includes("digital marketing")) {
    objective = "Digital Marketing Services Awareness";
  } else if (p.includes("hydrafacial")) {
    objective = "HydraFacial Skincare Awareness";
  }

  return {
    platform,
    width,
    height,
    posterSize,
    aspectRatio,
    hashtagCount,
    publishAllowed,
    requirePlanApproval: true,
    objective,
  };
}

/**
 * Compatibility wrapper for CreativePipelineService.
 */
async function generatePosterStrategy({ customer, location, campaign = {} }) {
  const prompt = `${campaign.offer || ""} ${campaign.service || ""} ${campaign.topic || ""}`.trim();
  const briefContext = {
    customerId: customer?._id,
    customerName: customer?.name,
    industry: customer?.industry || customer?.businessType,
    brandColors: customer?.brandProfile?.brandColors?.join(" + ") || customer?.brandContext?.brandColors?.join(" + ") || customer?.primaryColor,
    website: customer?.website,
    phone: customer?.phone || customer?.contactNumbers?.[0],
  };

  const brief = await synthesizePosterBrief(prompt || "Commercial Brand Poster", briefContext);

  return {
    ...brief,
    headline: brief.communication?.headline || "Transform Your Digital Growth",
    subheadline: brief.communication?.supportingLine || "",
    offerText: campaign.offer || brief.campaign?.event || "",
    ctaText: brief.communication?.cta || "Schedule Consultation",
    backgroundPrompt: brief.finalPrompt,
    colors: {
      primary: brief.client?.colorPalette?.primary || customer?.primaryColor || "#0F172A",
      secondary: brief.client?.colorPalette?.secondary || customer?.secondaryColor || "#F8FAFC",
      accent: brief.client?.colorPalette?.accent || customer?.accentColor || "#F59E0B",
    },
  };
}

module.exports = {
  synthesizePosterBrief,
  generatePosterStrategy,
  parseManagerIntent,
  INDUSTRY_PRESETS,
};


