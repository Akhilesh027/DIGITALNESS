/**
 * GoogleBusinessDiscoverySession.js
 * Temporary Server-Side Session for Google Business Profile OAuth & Location Discovery
 */

const mongoose = require("mongoose");

const GoogleBusinessDiscoverySessionSchema = new mongoose.Schema(
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
    discoveredAccounts: [
      {
        accountId: { type: String, required: true },
        accountName: { type: String, required: true },
        accountType: { type: String, default: "PERSONAL" },
        role: { type: String, default: "OWNER" },
      },
    ],
    discoveredLocations: [
      {
        googleAccountId: { type: String, required: true },
        googleLocationId: { type: String, required: true },
        locationResourceName: { type: String, required: true },
        businessName: { type: String, required: true },
        storeCode: { type: String, default: null },
        address: { type: String, default: "" },
        phone: { type: String, default: "" },
        website: { type: String, default: "" },
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

module.exports = mongoose.model(
  "GoogleBusinessDiscoverySession",
  GoogleBusinessDiscoverySessionSchema
);
