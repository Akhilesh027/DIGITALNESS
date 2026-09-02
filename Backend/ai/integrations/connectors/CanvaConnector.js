/**
 * CanvaConnector.js
 * Integration layer for Canva editing transactions, inspections, previews, commits, and exports.
 */

const crypto = require("crypto");

class CanvaConnector {
  constructor() {
    this.activeTransactions = new Map();
  }

  /**
   * Retrieves design metadata
   */
  async getDesign(designId) {
    return {
      designId,
      title: `Campaign Poster ${designId.substring(0, 6)}`,
      pageCount: 1,
      isResponsive: false,
      width: 1080,
      height: 1080,
      url: `https://www.canva.com/design/${designId}/edit`,
      lastModified: new Date(),
    };
  }

  /**
   * Inspects elements on design pages
   */
  async inspectElements(designId) {
    return {
      designId,
      pageCount: 1,
      isResponsive: false,
      pages: [
        {
          pageId: "page_1",
          pageNumber: 1,
          isResponsive: false,
          elements: [
            {
              elementId: "elem_logo_1",
              type: "IMAGE",
              semanticRole: "LOGO",
              transform: { left: 50, top: 50, width: 150, height: 60 },
            },
            {
              elementId: "elem_headline_1",
              type: "TEXT",
              semanticRole: "HEADLINE",
              text: "Glow Like Never Before — 50% Off",
              transform: { left: 50, top: 300, width: 980, height: 120 },
              style: { fontSize: 48, bold: true },
            },
            {
              elementId: "elem_phone_1",
              type: "TEXT",
              semanticRole: "PHONE",
              text: "+91 99887 76655",
              transform: { left: 50, top: 950, width: 400, height: 40 },
              style: { fontSize: 24, bold: false },
            },
            {
              elementId: "elem_hero_img_1",
              type: "IMAGE",
              semanticRole: "HERO_IMAGE",
              transform: { left: 50, top: 450, width: 980, height: 450 },
            },
          ],
        },
      ],
    };
  }

  /**
   * Starts a short-lived draft editing transaction
   */
  async startEditTransaction(designId) {
    const transactionId = `CTX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const transaction = {
      transactionId,
      designId,
      status: "OPEN",
      operationsApplied: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    };
    this.activeTransactions.set(transactionId, transaction);
    return transaction;
  }

  /**
   * Applies draft operations inside a transaction
   */
  async performOperations(transactionId, operations = []) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) throw new Error("Canva edit transaction not found or expired.");
    if (transaction.status !== "OPEN") throw new Error(`Transaction is not open (${transaction.status}).`);

    transaction.operationsApplied.push(...operations);
    return {
      success: true,
      transactionId,
      appliedCount: operations.length,
    };
  }

  /**
   * Generates a draft visual preview for the transaction
   */
  async getPreview(transactionId, baseImageUrl = "https://res.cloudinary.com/digitalness/image/upload/v1/mock_poster_v1.jpg") {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) throw new Error("Canva edit transaction not found.");

    // Generate unique preview URLs based on operations hash
    const hash = crypto.createHash("md5").update(JSON.stringify(transaction.operationsApplied)).digest("hex").substring(0, 8);
    const beforePreviewUrl = baseImageUrl;
    const afterPreviewUrl = `https://res.cloudinary.com/digitalness/image/upload/v1/canva_draft_${transaction.designId}_${hash}.jpg`;

    return {
      transactionId,
      designId: transaction.designId,
      changedPages: [1],
      beforePreviewUrl,
      afterPreviewUrl,
      generatedAt: new Date(),
    };
  }

  /**
   * Commits the Canva transaction permanently
   */
  async commitTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) throw new Error("Canva edit transaction not found or expired.");
    transaction.status = "COMMITTED";
    transaction.committedAt = new Date();
    return {
      success: true,
      transactionId,
      designId: transaction.designId,
      status: "COMMITTED",
    };
  }

  /**
   * Cancels and discards the Canva transaction
   */
  async cancelTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (transaction) {
      transaction.status = "CANCELLED";
      transaction.cancelledAt = new Date();
    }
    return {
      success: true,
      transactionId,
      status: "CANCELLED",
    };
  }

  /**
   * Exports final high-res 1080x1080 design asset
   */
  async exportDesign(designId, format = "JPEG", dimensions = { width: 1080, height: 1080 }) {
    return {
      designId,
      format,
      dimensions,
      exportedUrl: `https://res.cloudinary.com/digitalness/image/upload/v1/canva_export_${designId}.jpg`,
      exportedAt: new Date(),
    };
  }
}

module.exports = new CanvaConnector();
