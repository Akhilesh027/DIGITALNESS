/**
 * StorageProvider.js
 * Abstract Interface for Asset Storage Providers
 */

class StorageProvider {
  constructor(name) {
    this.name = name;
  }

  async upload(params) {
    throw new Error("upload() must be implemented by storage provider.");
  }

  async delete(storageKey) {
    throw new Error("delete() must be implemented by storage provider.");
  }

  async exists(storageKey) {
    throw new Error("exists() must be implemented by storage provider.");
  }

  getUrl(storageKey) {
    throw new Error("getUrl() must be implemented by storage provider.");
  }

  isPublic() {
    return false;
  }
}

module.exports = StorageProvider;
