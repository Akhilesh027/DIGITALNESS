/**
 * googleAds.js
 * Centralized Configuration for Google Ads API v25
 */

module.exports = {
  apiVersion: process.env.GOOGLE_ADS_API_VERSION || "v25",
  clientId: process.env.GOOGLE_ADS_CLIENT_ID || "google_ads_client_id_placeholder",
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "google_ads_client_secret_placeholder",
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "google_ads_dev_token_placeholder",
  redirectUri:
    process.env.GOOGLE_ADS_REDIRECT_URI ||
    "http://localhost:5000/api/integrations/google-ads/callback",
  scope: "https://www.googleapis.com/auth/adwords",
  managerCustomerId: process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID || null,
  realTestMaxDailyBudget: Number(process.env.GOOGLE_ADS_REAL_TEST_MAX_DAILY_BUDGET || 1000), // ₹1,000 max for tests
};
