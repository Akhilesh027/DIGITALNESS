/**
 * googleBusiness.js
 * Centralized Configuration for Google Business Profile (GBP) Integration
 */

module.exports = {
  clientId: process.env.GOOGLE_CLIENT_ID || "google_client_id_placeholder",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google_client_secret_placeholder",
  redirectUri:
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    "http://localhost:5000/api/integrations/google-business/callback",
  scope:
    process.env.GOOGLE_BUSINESS_SCOPE ||
    "https://www.googleapis.com/auth/business.manage",

  // Modern Google Business Profile APIs (Split Architecture)
  endpoints: {
    accountManagement: "https://mybusinessaccountmanagement.googleapis.com/v1",
    businessInformation: "https://mybusinessbusinessinformation.googleapis.com/v1",
    localPosts: "https://mybusiness.googleapis.com/v4",
    performance: "https://businessprofileperformance.googleapis.com/v1",
  },
};
