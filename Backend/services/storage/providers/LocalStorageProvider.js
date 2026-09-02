/**
 * LocalStorageProvider.js
 * Local filesystem storage provider adapter
 */

const fs = require("fs");
const path = require("path");
const StorageProvider = require("./StorageProvider");

class LocalStorageProvider extends StorageProvider {
  constructor() {
    super("Local");
    this.uploadsDir = path.join(__dirname, "../../../uploads/creatives");
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async upload({ storageKey, buffer, mimeType }) {
    const filename = path.basename(storageKey);
    const filePath = path.join(this.uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const assetUrl = `/uploads/creatives/${filename}`;
    return {
      storageProvider: "Local",
      storageKey,
      assetUrl,
      isPublic: this.isPublic(),
    };
  }

  async delete(storageKey) {
    const filePath = path.join(this.uploadsDir, path.basename(storageKey));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  async exists(storageKey) {
    const filePath = path.join(this.uploadsDir, path.basename(storageKey));
    return fs.existsSync(filePath);
  }

  getUrl(storageKey) {
    return `/uploads/creatives/${path.basename(storageKey)}`;
  }

  isPublic() {
    // Local server URLs are not internet-routable to Meta Graph API without tunneling
    return Boolean(process.env.PUBLIC_CDN_BASE_URL);
  }
}

module.exports = LocalStorageProvider;
