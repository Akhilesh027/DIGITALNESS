/**
 * whatsappAuth.js
 * Webhook signature validation and GET challenge verification for WhatsApp Cloud API.
 * Uses Meta App Secret and raw request body with HMAC-SHA256. Fail-closed in production.
 */

const crypto = require("crypto");
const whatsappConfig = require("../config/whatsapp");

/**
 * Validates Meta Webhook GET challenge verification
 */
function verifyWebhookSubscription(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === whatsappConfig.webhookVerifyToken) {
    console.log("[WhatsApp Webhook] Subscription challenge verified successfully.");
    return res.status(200).send(challenge);
  }

  console.warn("[WhatsApp Webhook] Subscription verification failed. Token mismatch or invalid mode.");
  return res.status(403).json({
    error: "FORBIDDEN",
    message: "Invalid verify token or subscription mode.",
  });
}

/**
 * Middleware: Validates X-Hub-Signature-256 header on incoming WhatsApp webhooks
 */
function validateWhatsAppWebhookSignature(req, res, next) {
  const signatureHeader = req.headers["x-hub-signature-256"];
  const appSecret = whatsappConfig.appSecret;

  // Fail closed if app secret is not configured in production
  if (!appSecret || appSecret === "whatsapp_app_secret_placeholder") {
    if (process.env.NODE_ENV === "production") {
      console.error("[WhatsApp Auth] Missing META_APP_SECRET in production. Failing closed.");
      return res.status(500).json({
        error: "CONFIGURATION_ERROR",
        message: "Server webhook security secret is misconfigured.",
      });
    }
  }

  if (!signatureHeader) {
    console.warn("[WhatsApp Auth] Missing X-Hub-Signature-256 header.");
    return res.status(401).json({
      error: "WHATSAPP_WEBHOOK_SIGNATURE_MISSING",
      message: "Missing X-Hub-Signature-256 header.",
    });
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const expectedSignature = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    const signatureBuffer = Buffer.from(signatureHeader, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.warn("[WhatsApp Auth] Invalid HMAC-SHA256 signature detected.");
      return res.status(401).json({
        error: "WHATSAPP_WEBHOOK_SIGNATURE_INVALID",
        message: "Invalid webhook HMAC signature. Payload rejected.",
      });
    }
  } catch (err) {
    console.error("[WhatsApp Auth] Error evaluating signature:", err.message);
    return res.status(401).json({
      error: "WHATSAPP_WEBHOOK_SIGNATURE_INVALID",
      message: "Signature verification failed.",
    });
  }

  next();
}

module.exports = {
  verifyWebhookSubscription,
  validateWhatsAppWebhookSignature,
};
