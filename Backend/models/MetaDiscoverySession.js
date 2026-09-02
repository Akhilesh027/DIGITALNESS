/**
 * MetaDiscoverySession.js
 * Temporary Server-Side Discovery Session for Meta Assets
 * 
 * Stores discovered Facebook Pages, Instagram Accounts, and Ad Accounts
 * until the manager confirms which assets belong to the specific client/branch.
 * Expires automatically after 15 minutes.
 */

const mongoose = require("mongoose");

const MetaDiscoverySessionSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userAccessTokenEncrypted: {
      type: String,
      required: true,
    },
    grantedScopes: [{ type: String }],
    pages: [
      {
        pageId: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, default: "" },
        tasks: [{ type: String }],
        pageAccessTokenEncrypted: { type: String, default: null },
        hasInstagram: { type: Boolean, default: false },
        instagramBusinessAccountId: { type: String, default: null },
        instagramUsername: { type: String, default: null },
      },
    ],
    adAccounts: [
      {
        adAccountId: { type: String, required: true },
        name: { type: String, required: true },
        accountStatus: { type: Number, default: 1 },
        currency: { type: String, default: "INR" },
        businessId: { type: String, default: null },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "CONFIRMED", "EXPIRED"],
      default: "ACTIVE",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "15m" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MetaDiscoverySession", MetaDiscoverySessionSchema);
