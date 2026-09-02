/**
 * ImageProviderRouter.js
 * Intelligent Provider Selection, Multi-Provider Failover, and Explicit Fallback Modes
 * 
 * Modes:
 * - IMAGE_FALLBACK_MODE="disabled" (Production Default - Throws error if real providers fail)
 * - IMAGE_FALLBACK_MODE="curated" (Development/Testing - Uses curated high-res visual explicitly stamped as fallback)
 */

const OpenAIImageProvider = require("./providers/OpenAIImageProvider");
const GeminiImageProvider = require("./providers/GeminiImageProvider");
const PollinationsImageProvider = require("./providers/PollinationsImageProvider");
const FallbackImageProvider = require("./providers/FallbackImageProvider");

class ImageProviderRouter {
  constructor() {
    this.pollinations = new PollinationsImageProvider();
    this.openAI = new OpenAIImageProvider();
    this.gemini = new GeminiImageProvider();
    this.fallback = new FallbackImageProvider();
  }

  /**
   * Returns list of configured real AI image providers in priority order
   */
  getConfiguredRealProviders() {
    const preferred = (process.env.IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER || "pollinations").toLowerCase();
    const providers = [];

    if (preferred === "openai" && this.openAI.isConfigured()) {
      providers.push(this.openAI);
      providers.push(this.pollinations);
    } else if (preferred === "gemini" && this.gemini.isConfigured()) {
      providers.push(this.gemini);
      providers.push(this.pollinations);
    } else {
      // Default: Pollinations Flux (Fast & Free) -> OpenAI -> Gemini
      providers.push(this.pollinations);
      if (this.openAI.isConfigured()) providers.push(this.openAI);
      if (this.gemini.isConfigured()) providers.push(this.gemini);
    }

    return providers;
  }

  /**
   * Generates hero visual with multi-provider failover and explicit fallback handling
   */
  async generateHeroVisual({ prompt, width = 1080, height = 1080, brandContext = {} }) {
    const realProviders = this.getConfiguredRealProviders();
    const startTime = Date.now();
    const fallbackMode = process.env.IMAGE_FALLBACK_MODE || (process.env.NODE_ENV === "production" ? "disabled" : "curated");

    // 1. Try real configured providers with automatic failover
    const providerErrors = [];
    console.log("══════════════════════════════════════════════════════════════════════════════");
    console.log(`[ImageProviderRouter] 🎯 MASTER PRODUCTION PROMPT (${prompt.length} chars):`);
    console.log(prompt);
    console.log("══════════════════════════════════════════════════════════════════════════════");

    for (const provider of realProviders) {
      console.log(`[ImageProviderRouter] Attempting generation via [${provider.name}]...`);
      try {
        const result = await provider.generateImage({
          prompt,
          width,
          height,
          brandContext,
        });

        const durationMs = Date.now() - startTime;
        return {
          ...result,
          durationMs,
          fallback: false,
        };
      } catch (err) {
        console.warn(`[ImageProviderRouter] ${provider.name} attempt failed: ${err.message}`);
        providerErrors.push(`${provider.name}: ${err.message}`);
      }
    }

    // 2. If all real providers failed or none are configured:
    if (fallbackMode === "disabled") {
      const err = new Error(
        `IMAGE_GENERATION_FAILED: No real image provider succeeded. (${providerErrors.join("; ") || "No API key configured"}).`
      );
      err.code = "IMAGE_GENERATION_FAILED";
      err.providerErrors = providerErrors;
      throw err;
    }

    // 3. Explicit Curated Fallback (for local development/testing)
    console.warn(`[ImageProviderRouter] Using explicit curated fallback (IMAGE_FALLBACK_MODE=${fallbackMode})`);
    const fallbackReason = providerErrors.length > 0 ? providerErrors.join("; ") : "No live image API keys configured in environment";

    const fallbackResult = await this.fallback.generateImage({
      prompt,
      width,
      height,
      brandContext,
      fallbackReason,
    });

    return {
      ...fallbackResult,
      durationMs: Date.now() - startTime,
      fallback: true,
      fallbackReason,
    };
  }
}

module.exports = new ImageProviderRouter();
