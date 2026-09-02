/**
 * PollinationsImageProvider.js
 * High-Speed, Free AI Image Generation Provider via Pollinations Flux & Turbo
 */

const ImageGenerationProvider = require("./ImageGenerationProvider");

class PollinationsImageProvider extends ImageGenerationProvider {
  constructor() {
    super("Pollinations");
  }

  isConfigured() {
    // Pollinations is always available without an API key
    return true;
  }

  async generateImage({ prompt, width = 1080, height = 1080, brandContext = {} }) {
    const startTime = Date.now();

    // Enforce high-end commercial advertising visual without text/watermarks
    const brandStyle = brandContext.visualStyle || brandContext.industry || "Modern Commercial Advertising";
    const brandColors = brandContext.primaryColor ? `incorporating subtle ${brandContext.primaryColor} and ${brandContext.accentColor || "#F59E0B"} ambient lighting` : "";
    
    // Construct strong, master-tier commercial advertising prompt
    let cleanPrompt = prompt.trim();
    if (!cleanPrompt.includes("Hasselblad") && !cleanPrompt.includes("commercial advertising") && !cleanPrompt.includes("poster design")) {
      cleanPrompt = `${cleanPrompt}, ${brandColors}, commercial advertising poster design, cinematic 3-point studio lighting, golden rim highlights, 8k resolution, ultra-detailed render`;
    }

    const seed = Math.floor(Math.random() * 1000000);
    const model = process.env.POLLINATIONS_MODEL || "flux";
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`;

    console.log("══════════════════════════════════════════════════════════════════════════════");
    console.log("[PollinationsImageProvider] 🚀 FULL AI GENERATION PROMPT BEING SENT:");
    console.log(cleanPrompt);
    console.log("[PollinationsImageProvider] 🔗 COMPLETE REQUEST URL:");
    console.log(imageUrl);
    console.log("══════════════════════════════════════════════════════════════════════════════");

    // Fetch the actual image buffer
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Digitalness-CreativeStudio/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    if (!imageBuffer || imageBuffer.length < 1000) {
      throw new Error("Pollinations returned an empty or invalid image buffer.");
    }

    return {
      success: true,
      provider: "Pollinations",
      providerModel: model,
      mimeType: "image/jpeg",
      width,
      height,
      imageUrl,
      imageBuffer,
      generationId: `poll_${Date.now()}_${seed}`,
      fallback: false,
      durationMs: Date.now() - startTime,
      metadata: {
        seed,
        promptUsed: cleanPrompt,
      },
    };
  }
}

module.exports = PollinationsImageProvider;
