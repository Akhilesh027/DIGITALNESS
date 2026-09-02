/**
 * GeminiImageProvider.js
 * Google Gemini Image Generation Provider Adapter (gemini-3.1-flash-image)
 */

const ImageGenerationProvider = require("./ImageGenerationProvider");

class GeminiImageProvider extends ImageGenerationProvider {
  constructor() {
    super("Gemini");
  }

  isConfigured() {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  async generateImage({ prompt, width = 1080, height = 1080, brandContext = {} }) {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      const err = new Error("Google Gemini API key is not configured.");
      err.code = "PROVIDER_CONFIG_MISSING";
      throw err;
    }

    const model = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const brandStyle = brandContext.visualStyle || brandContext.industry || "modern commercial";
    const visualPrompt = `High-end commercial advertising poster background visual: ${prompt}. Style: ${brandStyle}. Vibrant cinematic lighting, clean composition with negative space for text layout, ultra photorealistic, 8k resolution, no messy background text.`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: visualPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "image/png",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const err = new Error(data.error?.message || "Google Gemini Image Generation API failed.");
      err.code = "PROVIDER_API_ERROR";
      err.provider = "Gemini";
      err.model = model;
      throw err;
    }

    const b64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const imageBuffer = b64Data ? Buffer.from(b64Data, "base64") : null;

    return {
      success: true,
      provider: "Google Gemini",
      providerModel: model,
      mimeType: "image/png",
      width: 1080,
      height: 1080,
      imageBuffer,
      generationId: `gemini_img_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fallback: false,
      metadata: {},
    };
  }
}

module.exports = GeminiImageProvider;
