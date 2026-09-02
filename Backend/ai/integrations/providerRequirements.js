/**
 * providerRequirements.js
 * Registry mapping integration operations to platforms, account types, risk levels, and required OAuth scopes.
 */

const PROVIDER_REQUIREMENTS = {
  // Instagram
  "instagram.publish": {
    platform: "Instagram",
    accountType: "InstagramBusiness",
    riskLevel: "R2",
    label: "Publish Instagram Post / Reel / Carousel",
    requiredScopes: ["instagram_basic", "instagram_content_publish"],
  },
  "instagram.insights": {
    platform: "Instagram",
    accountType: "InstagramBusiness",
    riskLevel: "R0",
    label: "Read Instagram Analytics",
    requiredScopes: ["instagram_basic", "instagram_manage_insights"],
  },

  // Facebook
  "facebook.publish": {
    platform: "Facebook",
    accountType: "FacebookPage",
    riskLevel: "R2",
    label: "Publish Facebook Page Post",
    requiredScopes: ["pages_manage_posts", "pages_read_engagement"],
  },
  "facebook.insights": {
    platform: "Facebook",
    accountType: "FacebookPage",
    riskLevel: "R0",
    label: "Read Facebook Page Analytics",
    requiredScopes: ["pages_read_engagement", "read_insights"],
  },

  // Meta Ads
  "metaAds.createCampaign": {
    platform: "MetaAds",
    accountType: "MetaAdAccount",
    riskLevel: "R3",
    label: "Create Meta Ad Campaign",
    requiredScopes: ["ads_management", "ads_read"],
  },
  "metaAds.readInsights": {
    platform: "MetaAds",
    accountType: "MetaAdAccount",
    riskLevel: "R0",
    label: "Read Meta Ad Performance Insights",
    requiredScopes: ["ads_read"],
  },

  // Google Business Profile
  "gbp.publishPost": {
    platform: "GoogleBusiness",
    accountType: "GBPLocation",
    riskLevel: "R2",
    label: "Publish Google Business Local Post",
    requiredScopes: ["https://www.googleapis.com/auth/business.manage"],
  },
  "gbp.replyReview": {
    platform: "GoogleBusiness",
    accountType: "GBPLocation",
    riskLevel: "R2",
    label: "Reply to Google Customer Review",
    requiredScopes: ["https://www.googleapis.com/auth/business.manage"],
  },

  // Google Ads
  "googleAds.createCampaign": {
    platform: "GoogleAds",
    accountType: "GoogleAdsAccount",
    riskLevel: "R3",
    label: "Create Google Ads Campaign (PAUSED)",
    requiredScopes: ["https://www.googleapis.com/auth/adwords"],
  },

  // WhatsApp Cloud API
  "whatsapp.sendMessage": {
    platform: "WhatsApp",
    accountType: "WhatsAppPhoneNumber",
    riskLevel: "R2",
    label: "Send WhatsApp Direct Message / Reply",
    requiredScopes: ["whatsapp_business_messaging"],
  },
  "whatsapp.sendTemplate": {
    platform: "WhatsApp",
    accountType: "WhatsAppPhoneNumber",
    riskLevel: "R2",
    label: "Send Approved WhatsApp Template",
    requiredScopes: ["whatsapp_business_messaging"],
  },
  "whatsapp.sendInteractive": {
    platform: "WhatsApp",
    accountType: "WhatsAppPhoneNumber",
    riskLevel: "R2",
    label: "Send WhatsApp Interactive Menu",
    requiredScopes: ["whatsapp_business_messaging"],
  },
  "whatsapp.broadcast": {
    platform: "WhatsApp",
    accountType: "WhatsAppPhoneNumber",
    riskLevel: "R3",
    label: "Send WhatsApp Marketing Broadcast",
    requiredScopes: ["whatsapp_business_messaging"],
  },

  // Canva Connect API
  "canva.autofill": {
    platform: "Canva",
    accountType: "CanvaAccount",
    riskLevel: "R1",
    label: "Canva Design Template Autofill",
    requiredScopes: ["design:content:read", "design:content:write"],
  },

  // Razorpay
  "razorpay.generatePaymentLink": {
    platform: "Razorpay",
    accountType: "RazorpayAccount",
    riskLevel: "R3",
    label: "Generate Dynamic Payment Link / Smart QR",
    requiredScopes: ["payment_links:write"],
  },
};

/**
 * Returns requirements specification for an operation
 */
exports.getOperationRequirement = (operationKey) => {
  return PROVIDER_REQUIREMENTS[operationKey] || null;
};

exports.PROVIDER_REQUIREMENTS = PROVIDER_REQUIREMENTS;
