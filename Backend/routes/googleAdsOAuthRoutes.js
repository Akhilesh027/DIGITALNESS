/**
 * googleAdsOAuthRoutes.js
 * Express Routes for Google Ads OAuth & Customer Account Confirmation
 */

const express = require("express");
const router = express.Router();
const GoogleAdsDiscoverySession = require("../models/GoogleAdsDiscoverySession");
const googleAdsOAuthService = require("../ai/integrations/google/GoogleAdsOAuthService");

/**
 * GET /api/integrations/google-ads/connect
 */
router.get("/connect", async (req, res) => {
  try {
    const { customerId, locationId } = req.query;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required." });
    }

    const { authUrl, state } = googleAdsOAuthService.generateAuthorizationUrl({
      customerId,
      locationId: locationId || null,
      userId: req.user?._id || null,
    });

    res.json({ success: true, authUrl, state });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/integrations/google-ads/callback
 */
router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/marketing/connections?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.status(400).json({ success: false, message: "Missing code or state parameter." });
    }

    const statePayload = googleAdsOAuthService.verifyState(state);
    const tokenData = await googleAdsOAuthService.exchangeCode(code);

    const discovery = await googleAdsOAuthService.listAccessibleCustomers({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      customerId: statePayload.customerId,
      locationId: statePayload.locationId,
      userId: statePayload.userId,
    });

    res.redirect(
      `/marketing/connections?gadsDiscoverySessionId=${discovery.sessionId}&customerId=${statePayload.customerId}&locationId=${statePayload.locationId || ""}`
    );
  } catch (err) {
    res.redirect(`/marketing/connections?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/integrations/google-ads/discovery/:sessionId
 */
router.get("/discovery/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GoogleAdsDiscoverySession.findOne({ sessionId, isUsed: false });

    if (!session) {
      return res.status(404).json({ success: false, message: "Discovery session expired or not found." });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      customerId: session.customerId,
      locationId: session.locationId,
      accessibleCustomers: session.accessibleCustomers,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/integrations/google-ads/confirm-account
 */
router.post("/confirm-account", async (req, res) => {
  try {
    const { sessionId, customerId, crmLocationId, googleAdsCustomerId, managerCustomerId } = req.body;

    if (!sessionId || !customerId || !googleAdsCustomerId) {
      return res.status(400).json({
        success: false,
        message: "sessionId, customerId, and googleAdsCustomerId are required.",
      });
    }

    const result = await googleAdsOAuthService.confirmAccountSelection({
      sessionId,
      customerId,
      crmLocationId: crmLocationId || null,
      googleAdsCustomerId,
      managerCustomerId: managerCustomerId || null,
    });

    res.json({ success: true, connection: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, code: err.code });
  }
});

module.exports = router;
