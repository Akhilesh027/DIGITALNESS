/**
 * OpenAIImageProvider.js
 * OpenAI gpt-image-2 Image Generation Provider Adapter
 */

const ImageGenerationProvider = require("./ImageGenerationProvider");

class OpenAIImageProvider extends ImageGenerationProvider {
  constructor() {
    super("OpenAI");
  }

  isConfigured() {
    const key = process.env.OPENAI_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  async generateImage({ prompt, width = 1080, height = 1080, brandContext = {} }) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      const err = new Error("OpenAI API key is not configured.");
      err.code = "PROVIDER_CONFIG_MISSING";
      throw err;
    }

    const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

    // Clean prompt focusing strictly on high-impact commercial background/hero visual with clean negative space
    const brandStyle = brandContext.visualStyle || brandContext.industry || "modern commercial";
    const visualPrompt = `High-end commercial advertising hero visual, ${prompt}. Style: ${brandStyle}. Clean negative space suitable for typography overlay, cinematic commercial studio lighting, award-winning composition, 8k resolution, photorealistic, no messy text or watermarks in the background.`;

    const requestBody = {
      model,
      prompt: visualPrompt.slice(0, 1000),
      n: 1,
      size: "1024x1024",
    };

    if (model === "dall-e-3") {
      requestBody.quality = process.env.OPENAI_IMAGE_QUALITY || "standard";
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const err = new Error(data.error?.message || "OpenAI Image Generation API failed.");
      err.code = "PROVIDER_API_ERROR";
      err.provider = "OpenAI";
      err.model = model;
      throw err;
    }

    const imageUrl = data.data?.[0]?.url;
    const b64Data = data.data?.[0]?.b64_json;
    const imageBuffer = b64Data ? Buffer.from(b64Data, "base64") : null;

    return {
      success: true,
      provider: "OpenAI",
      providerModel: model,
      mimeType: "image/png",
      width: 1080,
      height: 1080,
      imageUrl,
      imageBuffer,
      generationId: `gpt_img_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fallback: false,
      metadata: {
        revisedPrompt: data.data?.[0]?.revised_prompt,
      },
    };
  }
}

module.exports = OpenAIImageProvider;
