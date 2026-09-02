/**
 * FallbackImageProvider.js
 * Curated High-Resolution Visual Generator for Development, Testing, and Explicit Fallbacks.
 */

const ImageGenerationProvider = require("./ImageGenerationProvider");

const VISUAL_LIBRARY = {
  "vinayaka chavithi": "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080&auto=format&fit=crop",
  "ganesh": "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080&auto=format&fit=crop",
  "diwali": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1080&auto=format&fit=crop",
  "technology": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1080&auto=format&fit=crop",
  "salon": "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop",
  "beauty": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1080&auto=format&fit=crop",
  "real estate": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1080&auto=format&fit=crop",
  "generic": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop",
};

class FallbackImageProvider extends ImageGenerationProvider {
  constructor() {
    super("CuratedVisualEngine");
  }

  isConfigured() {
    return true;
  }

  async generateImage({ prompt, width = 1080, height = 1080, brandContext = {}, fallbackReason = "Explicit Fallback Mode" }) {
    const promptLower = (prompt || "").toLowerCase();
    let visualUrl = VISUAL_LIBRARY["generic"];

    for (const [key, url] of Object.entries(VISUAL_LIBRARY)) {
      if (promptLower.includes(key)) {
        visualUrl = url;
        break;
      }
    }

    return {
      success: true,
      provider: "Curated Visual Engine",
      providerModel: "curated-hero-v1",
      mimeType: "image/jpeg",
      width: 1080,
      height: 1080,
      imageUrl: visualUrl,
      imageBuffer: null,
      generationId: `curated_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fallback: true,
      fallbackReason,
      fallbackProvider: "CuratedVisualEngine",
      metadata: {
        matchedTopic: promptLower,
      },
    };
  }
}

module.exports = FallbackImageProvider;
