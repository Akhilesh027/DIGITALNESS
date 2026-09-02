/**
 * ImageGenerationProvider.js
 * Abstract Base Class for Visual/Image Generation Providers
 */

class ImageGenerationProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates a raw hero/background visual image buffer.
   * 
   * @param {Object} params
   * @param {string} params.prompt - Structured prompt for visual generation
   * @param {number} params.width - Target width in pixels (default: 1080)
   * @param {number} params.height - Target height in pixels (default: 1080)
   * @param {string} params.aspectRatio - Target aspect ratio (default: "1:1")
   * @param {Object} params.brandContext - Brand rules, colors, styling instructions
   * @returns {Promise<{ success: boolean, provider: string, providerModel: string, mimeType: string, width: number, height: number, imageBuffer: Buffer, imageUrl: string, generationId: string, metadata: Object }>}
   */
  async generateImage(params) {
    throw new Error("generateImage() must be implemented by provider subclass.");
  }

  /**
   * Checks if this provider is configured with required API keys
   */
  isConfigured() {
    return false;
  }
}

module.exports = ImageGenerationProvider;
