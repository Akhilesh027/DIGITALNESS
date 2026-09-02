/**
 * verifyMetaWebhookSignature.js
 * Cryptographic HMAC SHA-256 signature verification for Meta & WhatsApp Webhooks.
 */

const crypto = require("crypto");

module.exports = (req, res, next) => {
  // Support Meta webhook verification handshake (GET challenge)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
      console.log("✓ Meta Webhook Handshake verified successfully.");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Webhook verification token mismatch." });
  }

  // Allow bypass only in development mode if app secret is not configured
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!appSecret) {
    if (isProduction) {
      return res.status(401).json({
        error: "Webhook rejected: META_APP_SECRET is not configured in production.",
      });
    }
    return next(); // Dev fallback
  }

  const signatureHeader = req.headers["x-hub-signature-256"];
  if (!signatureHeader) {
    return res.status(401).json({ error: "Missing required X-Hub-Signature-256 header." });
  }

  const rawPayload = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  const expectedSignature = `sha256=${crypto.createHmac("sha256", appSecret).update(rawPayload).digest("hex")}`;

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Meta webhook cryptographic signature." });
    }
  } catch (sigErr) {
    return res.status(401).json({ error: "Signature validation error." });
  }

  next();
};
