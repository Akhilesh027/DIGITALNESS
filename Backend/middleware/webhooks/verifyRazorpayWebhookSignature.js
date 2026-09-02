/**
 * verifyRazorpayWebhookSignature.js
 * Cryptographic HMAC SHA-256 signature verification for Razorpay Webhooks.
 */

const crypto = require("crypto");

module.exports = (req, res, next) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!webhookSecret) {
    if (isProduction) {
      return res.status(401).json({
        error: "Webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured in production.",
      });
    }
    return next(); // Dev fallback
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    return res.status(401).json({ error: "Missing required x-razorpay-signature header." });
  }

  const rawPayload = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawPayload).digest("hex");

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Razorpay webhook signature." });
    }
  } catch (sigErr) {
    return res.status(401).json({ error: "Signature validation error." });
  }

  next();
};
