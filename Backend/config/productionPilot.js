/**
 * productionPilot.js
 * Persisted configuration for Digitalness Controlled Pilot Environment & Feature Flags.
 * Contains ZERO secrets or credentials.
 */

module.exports = {
  environment: process.env.NODE_ENV || "development",

  pilotCustomer: {
    name: "DIGITALNESS TEST / INTERNAL PILOT",
    email: "pilot@digitalness.ai",
    brandName: "Digitalness Pilot",
    companyName: "Digitalness Technologies India Pvt Ltd",
    industry: "AI Marketing & Growth Infrastructure",
    phone: "+919988776655",
    website: "https://digitalness.ai",
    timezone: "Asia/Kolkata",
  },

  // Global Kill Switch (When false, blocks all external mutations while allowing read-only reporting)
  externalWritesEnabled: process.env.EXTERNAL_WRITES_ENABLED !== "false", // Enabled for scoped canary

  // Domain Kill Switches
  domainWrites: {
    metaSocial: true, // Canary Domain (Instagram + Facebook)
    gbpPublishing: true, // Canary Domain (GBP LocalPosts)
    whatsappCloud: false, // Deferred until live WABA proof
    metaAds: false, // Locked for canary
    googleAdsCreation: false, // Locked for canary
    googleAdsActivation: false, // Production safety lock (LOCKED)
    canvaCommit: false, // Native AI poster renderer active
  },

  // Feature Flags
  featureFlags: {
    enableBullMQPersistence: true,
    enableStrictIdempotencyGuards: true,
    enableApprovalSnapshotVerification: true,
    enableTenantIsolationGuards: true,
    enableBranchIsolationGuards: true,
    enableGroundedReportNarratives: true,
  },

  // Production Pilot Health Thresholds
  thresholds: {
    metaInsightsStaleMinutes: 60,
    googleAdsStaleMinutes: 60,
    gbpSyncStaleMinutes: 120,
    maxSlaFirstResponseMinutes: 15,
  },
};
