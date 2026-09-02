/**
 * googleBusinessOAuthRoutes.js
 * Express Routes for Google Business Profile OAuth & Location Confirmation
 */

const express = require("express");
const router = express.Router();
const GoogleBusinessDiscoverySession = require("../models/GoogleBusinessDiscoverySession");
const googleBusinessOAuthService = require("../ai/integrations/google/GoogleBusinessOAuthService");

/**
 * GET /api/integrations/google-business/connect
 */
router.get("/connect", async (req, res) => {
  try {
    const { customerId, locationId } = req.query;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required." });
    }

    const { authUrl, state } = googleBusinessOAuthService.generateAuthorizationUrl({
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
 * GET /api/integrations/google-business/callback
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

    const statePayload = googleBusinessOAuthService.verifyState(state);
    const tokenData = await googleBusinessOAuthService.exchangeCode(code);

    const discovery = await googleBusinessOAuthService.discoverAccountsAndLocations({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      customerId: statePayload.customerId,
      locationId: statePayload.locationId,
      userId: statePayload.userId,
    });

    res.redirect(
      `/marketing/connections?gbpDiscoverySessionId=${discovery.sessionId}&customerId=${statePayload.customerId}&locationId=${statePayload.locationId || ""}`
    );
  } catch (err) {
    res.redirect(`/marketing/connections?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/integrations/google-business/discovery/:sessionId
 */
router.get("/discovery/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GoogleBusinessDiscoverySession.findOne({ sessionId, isUsed: false });

    if (!session) {
      return res.status(404).json({ success: false, message: "Discovery session expired or not found." });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      customerId: session.customerId,
      locationId: session.locationId,
      accounts: session.discoveredAccounts,
      locations: session.discoveredLocations,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/integrations/google-business/confirm-location
 */
router.post("/confirm-location", async (req, res) => {
  try {
    const { sessionId, customerId, crmLocationId, googleAccountId, googleLocationId } = req.body;

    if (!sessionId || !customerId || !googleLocationId) {
      return res.status(400).json({
        success: false,
        message: "sessionId, customerId, and googleLocationId are required.",
      });
    }

    const result = await googleBusinessOAuthService.confirmLocationSelection({
      sessionId,
      customerId,
      crmLocationId: crmLocationId || null,
      googleAccountId,
      googleLocationId,
    });

    res.json({ success: true, connection: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, code: err.code });
  }
});

module.exports = router;
