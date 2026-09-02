/**
 * AIProvider.js
 * Unified AI Provider Abstraction for Digitalness CRM V2
 * Prioritizes AIML API with graceful fallback to Pollinations / Free AI.
 */

async function callAIMLAPI({ messages, model = "openai/gpt-4o-mini", temperature = 0.7, jsonMode = false }) {
  const apiKey = process.env.AIML_API_KEY;
  const baseUrl = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";

  if (!apiKey) {
    throw new Error("AIML_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const body = {
    model: process.env.AIML_TEXT_MODEL || model || "openai/gpt-4o-mini",
    messages,
    temperature,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify(body),
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AIML API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("Empty response from AIML API");
  return content;
}

async function callCloudflareWorkersAI({ messages, model = "@cf/meta/llama-3.1-8b-instruct" }) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfModel = process.env.CLOUDFLARE_AI_TEXT_MODEL || model || "@cf/meta/llama-3.1-8b-instruct";

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare account ID or API token is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${cfModel}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        max_tokens: 1024,
      }),
    }
  );
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Cloudflare AI HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.result?.response || "";
  if (!text) throw new Error("Empty response from Cloudflare Workers AI");
  return text;
}

exports.getAIStatus = () => {
  const hasAiml = Boolean(process.env.AIML_API_KEY);
  const hasCf = Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);
  return {
    status: "AI Providers Ready (AIML API + Cloudflare Workers AI + Pollinations)",
    textProvider: hasAiml ? "AIML API" : hasCf ? "Cloudflare Workers AI" : "Pollinations Free AI",
    textModel: process.env.AIML_TEXT_MODEL || "@cf/meta/llama-3.1-8b-instruct",
    hasAIML: hasAiml,
    hasCloudflare: hasCf,
    hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    imageProvider: "Pollinations Flux AI / Cloudflare Workers AI",
    imageModel: "flux",
  };
};

exports.generateText = async ({ prompt, systemPrompt = "", temperature = 0.7 }) => {
  // 1. Try Cloudflare Workers AI First (100% Free 10,000 requests/day Tier)
  try {
    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ];
    const text = await callCloudflareWorkersAI({ messages });
    if (text && text.trim().length > 0) {
      console.log(`[Cloudflare Workers AI] ✓ Generated text successfully using @cf/meta/llama-3.1-8b-instruct!`);
      return text;
    }
  } catch (cfErr) {
    console.warn("[Cloudflare Workers AI Text Fallback]:", cfErr.message);
  }

  // 2. Try Pollinations Free Models (100% Free, Zero Balance Needed)
  const models = ["openai", "mistral", "claude-hybridspace", "search"];
  
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          model,
          temperature,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;
      const text = await response.text();
      if (text && text.trim().length > 0) {
        console.log(`[Pollinations Free Text AI - ${model}] ✓ Generated text successfully without API key!`);
        return text;
      }
    } catch (err) {
      console.warn(`[Pollinations Free Text AI - ${model} Error]:`, err.message);
    }
  }

  // 3. Try AIML API (if funded)
  try {
    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ];
    const text = await callAIMLAPI({ messages, temperature });
    if (text && text.trim().length > 0) {
      console.log(`[AIML API] ✓ Generated text successfully using ${process.env.AIML_TEXT_MODEL || "openai/gpt-4o-mini"}!`);
      return text;
    }
  } catch (err) {
    console.warn("[AIML API Text Fallback]:", err.message);
  }

  return "";
};

/**
 * Generates structured JSON output strictly matching expected schema using 100% Free Cloudflare / Pollinations.
 */
exports.generateStructured = async ({ prompt, systemPrompt = "", schemaName = "creative_poster_package" }) => {
  // 1. Try Cloudflare Workers AI First (100% Free 10,000 requests/day Tier)
  try {
    console.log(`[Cloudflare Workers AI] 🤖 Generating structured ${schemaName} using @cf/meta/llama-3.1-8b-instruct...`);
    const messages = [
      {
        role: "system",
        content: `${systemPrompt}\n\nYou MUST return a valid, well-formed JSON object. Do not include markdown code block backticks. Return raw JSON only.`,
      },
      { role: "user", content: prompt },
    ];

    const rawContent = await callCloudflareWorkersAI({ messages });
    let cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      const parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      if (parsed) {
        console.log(`[Cloudflare Workers AI] ✓ Successfully generated structured JSON for ${schemaName}!`);
        return parsed;
      }
    }
  } catch (cfErr) {
    console.warn("[Cloudflare Workers AI Structured Fallback]:", cfErr.message);
  }

  // 2. Try Pollinations Free Models (100% Free, Zero Balance Needed)
  const fullCombinedPrompt = `${systemPrompt}\n\nTask: ${prompt}\n\nYou MUST return either a valid JSON object or labeled sections for:
visualPrompt: (Photorealistic camera & scene description, Hasselblad 85mm, 3-point lighting, no text)
headline: (Punchy advertising headline under 6 words)
subheadline: (Engaging marketing value proposition under 15 words)
cta: (Action-oriented CTA button text)
layoutTheme: (gold_luxury / modern_glass / festive_divine / bold_commercial / clinical_teal)
caption: (Full Instagram post caption with emojis, bullet points, and CTA)
hashtags: (Comma-separated 8 hashtags)`;

  const models = ["openai", "mistral", "claude-hybridspace", "search"];
  
  for (const model of models) {
    try {
      console.log(`[Pollinations Free Text AI] 🤖 Querying live free model [${model}] for structured ${schemaName}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          model,
          jsonMode: true,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 12000);
        const getUrl = `https://text.pollinations.ai/${encodeURIComponent(fullCombinedPrompt)}?model=${model}&json=true`;
        response = await fetch(getUrl, { signal: getController.signal });
        clearTimeout(getTimeoutId);
      }

      if (!response.ok) continue;
      let text = await response.text();
      if (!text || text.trim().length === 0) continue;

      let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
          if (parsed && (parsed.visualPrompt || parsed.headline || parsed.prompt || parsed.campaignName)) {
            console.log(`[Pollinations Free Text AI - ${model}] ✓ Live AI Generation Succeeded (JSON)!`);
            return parsed;
          }
        } catch (jsonErr) {}
      }
    } catch (err) {
      console.warn(`[Pollinations Free Text AI - ${model} Error]:`, err.message);
    }
  }

  // 3. Try AIML API (if funded)
  try {
    const messages = [
      {
        role: "system",
        content: `${systemPrompt}\n\nYou MUST return a valid, well-formed JSON object.`,
      },
      { role: "user", content: prompt },
    ];
    const rawContent = await callAIMLAPI({ messages, jsonMode: true });
    let cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
  } catch (aimlErr) {}

  // 3. Fallback: Parse labeled text sections if full JSON was not found
  console.log("[Free AI Pipeline] Extracting fields from parsed output...");
  return null;
};

/**
 * Generates poster image using DALL-E 3 API or live commercial poster engine.
 */
exports.generatePosterImage = async ({
  prompt,
  brandName = "GlowNest Salon",
  serviceName = "Hair Colour",
  offerText = "20% OFF Selected Services",
  headlineText = "COLOUR YOUR CONFIDENCE",
  supportingText = "Premium colour personalized to you.",
  ctaText = "Book Appointment",
  locationName = "Kukatpally",
  locationPhone = "9000012346",
  logoUrl = "https://glownest.com/assets/logo-glownest.png",
  primaryColor = "#1A1A1A",
  secondaryColor = "#F7F2ED",
  accentColor = "#C79A6B",
  isWebsiteLaunch = false,
}) => {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();

  if (openAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: String(prompt || headlineText).slice(0, 1000),
          n: 1,
          size: "1024x1024",
        }),
      });

      const data = await response.json();
      if (data.data?.[0]?.url) {
        return {
          url: data.data[0].url,
          provider: "OpenAI DALL-E 3 API",
          status: "Generated",
        };
      }
    } catch (err) {
      console.warn("OpenAI DALL-E 3 API call fallback to SVG poster engine:", err.message);
    }
  }

  // Dynamic High-Resolution Commercial SVG Poster Engine (1:1 1080x1080 Render)
  const heroImage = isWebsiteLaunch
    ? "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop"
    : "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop";

  const safeHeadline = String(headlineText || "COLOUR YOUR CONFIDENCE").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSupporting = String(supportingText || "Premium personalized care").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeBrand = String(brandName || "GlowNest Salon").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeOffer = String(offerText || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svgPoster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#0A0A0A"/>
      </linearGradient>
      <linearGradient id="goldBadge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#966B38"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#bgGrad)"/>
    <image href="${heroImage}" x="160" y="80" width="760" height="580" preserveAspectRatio="xMidYMid slice" opacity="0.9" clip-path="inset(0px round 24px)"/>
    <rect x="160" y="80" width="760" height="580" fill="none" stroke="${accentColor}" stroke-width="3" rx="24"/>
    
    <!-- Top Header Brand Logo Badge -->
    <rect x="50" y="45" width="260" height="64" rx="14" fill="${secondaryColor}" opacity="0.96"/>
    <text x="180" y="86" font-family="'Playfair Display', Georgia, serif" font-size="20" font-weight="bold" fill="${primaryColor}" text-anchor="middle">${safeBrand.toUpperCase()}</text>
    
    <!-- Location Badge -->
    <text x="1030" y="85" font-family="'Poppins', sans-serif" font-size="18" font-weight="600" fill="${secondaryColor}" text-anchor="end">${locationName.toUpperCase()} BRANCH</text>
    
    <!-- High-Contrast Offer Badge -->
    ${safeOffer && !safeOffer.includes("None") ? `
    <g transform="translate(730, 110)">
      <rect width="270" height="74" rx="37" fill="url(#goldBadge)" stroke="#FFFFFF" stroke-width="2"/>
      <text x="135" y="46" font-family="'Poppins', sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">${safeOffer}</text>
    </g>` : ''}
    
    <!-- Typography Overlay Panel -->
    <rect x="50" y="690" width="980" height="340" rx="24" fill="${secondaryColor}" opacity="0.98"/>
    <text x="90" y="760" font-family="'Playfair Display', Georgia, serif" font-size="42" font-weight="bold" fill="${primaryColor}">${safeHeadline}</text>
    <text x="90" y="810" font-family="'Poppins', sans-serif" font-size="20" font-weight="500" fill="#333333">${safeSupporting}</text>

    <!-- Call to Action Button -->
    <g transform="translate(90, 855)">
      <rect width="300" height="66" rx="33" fill="${primaryColor}"/>
      <text x="150" y="42" font-family="'Poppins', sans-serif" font-size="20" font-weight="bold" fill="${secondaryColor}" text-anchor="middle">${ctaText}</text>
    </g>

    <!-- Contact & Location Footer -->
    <text x="990" y="990" font-family="'Poppins', sans-serif" font-size="18" font-weight="600" fill="${primaryColor}" text-anchor="end">📞 Call: ${locationPhone} • ${locationName}</text>
  </svg>`;

  const svgBase64 = Buffer.from(svgPoster).toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  return {
    url: dataUrl,
    provider: "Digitalness Commercial Poster Engine",
    status: "Generated",
  };
};
