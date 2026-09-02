/**
 * GoogleAdsDiscoverySession.js
 * Temporary Server-Side Session for Google Ads OAuth & Account Hierarchy Discovery
 */

const mongoose = require("mongoose");

const GoogleAdsDiscoverySessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    encryptedTokens: {
      accessToken: { type: String, required: true },
      refreshToken: { type: String, default: null },
      tokenExpiresAt: { type: Date, default: null },
    },
    accessibleCustomers: [
      {
        resourceName: { type: String, required: true },
        customerId: { type: String, required: true },
        descriptiveName: { type: String, default: "" },
        currencyCode: { type: String, default: "INR" },
        timeZone: { type: String, default: "Asia/Kolkata" },
        canManageClients: { type: Boolean, default: false },
      },
    ],
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "15m" }, // 15-minute TTL auto-purge
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoogleAdsDiscoverySession", GoogleAdsDiscoverySessionSchema);
