/**
 * AssetStorageService.js
 * Tenant-Safe Asset Storage Gateway with Multi-Provider Architecture
 * 
 * Manages storage providers (Local, Cloudinary, S3), checksum computation,
 * and public reachability validation for Meta/Instagram publishing.
 */

const crypto = require("crypto");
const LocalStorageProvider = require("./providers/LocalStorageProvider");
const CloudinaryStorageProvider = require("./providers/CloudinaryStorageProvider");

class AssetStorageService {
  constructor() {
    this.localProvider = new LocalStorageProvider();
    this.cloudinaryProvider = new CloudinaryStorageProvider();
  }

  getActiveProvider() {
    const preferred = (process.env.STORAGE_PROVIDER || "").toLowerCase();
    if (preferred === "cloudinary" || process.env.CLOUDINARY_CLOUD_NAME) {
      return this.cloudinaryProvider;
    }
    return this.localProvider;
  }

  computeChecksum(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  generateStorageKey({ customerId, occasion = "general", assetId, version = 1, format = "jpg" }) {
    const year = new Date().getFullYear();
    const cleanOccasion = String(occasion || "general")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");
    const cleanCustomerId = String(customerId).replace(/[^a-zA-Z0-9_-]/g, "");
    const ext = format.toLowerCase().replace(".", "");

    return `clients/${cleanCustomerId}/creatives/${year}/${cleanOccasion}/${assetId}_v${version}.${ext}`;
  }

  /**
   * Uploads an asset buffer
   */
  async upload({
    customerId,
    occasion = "general",
    assetId,
    version = 1,
    buffer,
    format = "jpg",
    mimeType = "image/jpeg",
    forceCloud = false,
  }) {
    if (!customerId) throw new Error("customerId is required for tenant-safe storage.");
    if (!buffer) throw new Error("Buffer is required for asset storage upload.");

    const provider = forceCloud ? this.cloudinaryProvider : this.getActiveProvider();
    const storageKey = this.generateStorageKey({ customerId, occasion, assetId, version, format });
    const checksum = this.computeChecksum(buffer);

    const uploadRes = await provider.upload({
      storageKey,
      buffer,
      mimeType,
    });

    const isPublic = provider.isPublic();

    return {
      success: true,
      storageProvider: uploadRes.storageProvider,
      storageKey,
      assetUrl: uploadRes.assetUrl,
      previewUrl: uploadRes.assetUrl,
      isPublic,
      checksum,
      fileSize: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates whether an asset URL is publicly reachable over the internet by Meta/Google
   */
  isPubliclyReachable(asset) {
    if (!asset || !asset.assetUrl) return false;
    const url = asset.assetUrl.toLowerCase();
    return (
      url.startsWith("https://res.cloudinary.com") ||
      url.startsWith("https://s3.") ||
      (url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1"))
    );
  }

  async delete(storageKey) {
    const provider = this.getActiveProvider();
    return provider.delete(storageKey);
  }
}

module.exports = new AssetStorageService();
