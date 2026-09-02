const mongoose = require("mongoose");

const MarketingConnectionSchema = new mongoose.Schema(
  {
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
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: [
        "Meta",
        "Facebook",
        "Instagram",
        "MetaAds",
        "Google",
        "GoogleAds",
        "GoogleBusiness",
        "GoogleAnalytics",
        "GoogleSearchConsole",
        "WhatsApp",
        "Canva",
        "Razorpay",
        "LinkedIn",
      ],
      index: true,
    },
    accountType: {
      type: String,
      enum: [
        "FacebookPage",
        "InstagramBusiness",
        "MetaAdAccount",
        "GoogleAdsAccount",
        "GBPLocation",
        "GoogleAnalyticsProperty",
        "SearchConsoleProperty",
        "WhatsAppBusinessAccount",
        "WhatsAppPhoneNumber",
        "CanvaAccount",
        "CanvaTeam",
        "RazorpayAccount",
        "LinkedInPage",
      ],
      required: true,
    },
    platformAccountId: {
      type: String,
      required: true,
      index: true,
    },
    platformAccountName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Never return tokens in standard queries
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONNECTED",
        "EXPIRED",
        "REAUTH_REQUIRED",
        "ERROR",
        "DISCONNECTED",
        "REVOKED",
        "Connected",
        "Expired",
        "Error",
        "Disconnected",
      ],
      default: "CONNECTED",
      index: true,
    },
    scopes: [{ type: String }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastError: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      occurredAt: { type: Date, default: null },
    },
    lastHealthCheckAt: {
      type: Date,
      default: Date.now,
    },
    lastSuccessfulApiCallAt: {
      type: Date,
      default: null,
    },
    reauthRequired: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    disconnectedAt: {
      type: Date,
      default: null,
    },
    lastSyncAt: {
      type: Date,
      default: Date.now,
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Encrypt tokens before saving to database
MarketingConnectionSchema.pre("save", function (next) {
  const { encryptToken } = require("../utils/cryptoUtil");
  if (this.isModified("accessToken") && this.accessToken) {
    this.accessToken = encryptToken(this.accessToken);
  }
  if (this.isModified("refreshToken") && this.refreshToken) {
    this.refreshToken = encryptToken(this.refreshToken);
  }
  next();
});

// Compound index to prevent duplicate active accounts for same customer, location, and platform account
MarketingConnectionSchema.index(
  { customerId: 1, locationId: 1, platform: 1, platformAccountId: 1 },
  { unique: true }
);

module.exports = mongoose.model("MarketingConnection", MarketingConnectionSchema);
