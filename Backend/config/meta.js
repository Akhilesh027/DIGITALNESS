/**
 * meta.js
 * Centralized Configuration for Meta Business App, Facebook Login for Business, & Graph API
 */

module.exports = {
  appId: process.env.META_APP_ID || "123456789012345",
  appSecret: process.env.META_APP_SECRET || "meta_app_secret_placeholder",
  redirectUri:
    process.env.META_REDIRECT_URI || "http://localhost:5000/api/integrations/meta/callback",
  graphApiVersion: process.env.META_GRAPH_API_VERSION || "v20.0",
  marketingApiVersion: process.env.META_MARKETING_API_VERSION || "v20.0",
  loginConfigId: process.env.META_LOGIN_CONFIG_ID || null,

  // Permission Bundles for Facebook Login for Business (Least Privilege)
  permissionBundles: {
    DISCOVERY_DEFAULT: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
    ],
    INSTAGRAM_PUBLISHING: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
    ],
    INSTAGRAM_COMMUNITY: [
      "instagram_manage_comments",
    ],
    META_ADS_READ: [
      "ads_read",
    ],
    META_ADS_MANAGEMENT: [
      "ads_read",
      "ads_management",
    ],
    BUSINESS_MANAGEMENT: [
      "business_management",
    ],
  },
};
