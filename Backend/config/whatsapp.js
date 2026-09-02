/**
 * whatsapp.js
 * Centralized Configuration for WhatsApp Cloud API, Embedded Signup & Webhooks
 */

const WHATSAPP_GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || process.env.META_GRAPH_API_VERSION || "v26.0";
const WHATSAPP_APP_ID = process.env.WHATSAPP_APP_ID || process.env.META_APP_ID || "123456789012345";
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || "whatsapp_app_secret_placeholder";
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "digitalness_whatsapp_verify_token_2026";
const WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID = process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || null;
const WHATSAPP_WEBHOOK_PATH = process.env.WHATSAPP_WEBHOOK_PATH || "/webhook/whatsapp";

// Optional test configuration for sandbox / test number
const WHATSAPP_TEST_WABA_ID = process.env.WHATSAPP_TEST_WABA_ID || null;
const WHATSAPP_TEST_PHONE_NUMBER_ID = process.env.WHATSAPP_TEST_PHONE_NUMBER_ID || null;

/**
 * Returns current status of Embedded Signup readiness
 */
function getEmbeddedSignupStatus() {
  if (WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID && process.env.META_APP_REVIEW_APPROVED === "true") {
    return "IMPLEMENTED";
  }
  if (WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID) {
    return "APP_REVIEW_REQUIRED";
  }
  if (WHATSAPP_TEST_PHONE_NUMBER_ID || WHATSAPP_TEST_WABA_ID) {
    return "TEST_MODE";
  }
  return "NOT_CONFIGURED";
}

module.exports = {
  graphApiVersion: WHATSAPP_GRAPH_API_VERSION,
  appId: WHATSAPP_APP_ID,
  appSecret: WHATSAPP_APP_SECRET,
  webhookVerifyToken: WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  embeddedSignupConfigId: WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID,
  webhookPath: WHATSAPP_WEBHOOK_PATH,
  testWabaId: WHATSAPP_TEST_WABA_ID,
  testPhoneNumberId: WHATSAPP_TEST_PHONE_NUMBER_ID,

  // Required Cloud API Permissions
  requiredPermissions: [
    "whatsapp_business_management",
    "whatsapp_business_messaging",
  ],

  // Status & Health
  getEmbeddedSignupStatus,
};
