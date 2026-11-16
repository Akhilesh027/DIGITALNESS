/**
 * metaOAuthRoutes.js
 * Express Routes for Meta Business App & Facebook Login for Business
 */

const express = require("express");
const router = express.Router();
const metaOAuthService = require("../ai/integrations/meta/MetaOAuthService");
const MetaDiscoverySession = require("../models/MetaDiscoverySession");
const Customer = require("../models/Customer");
const ClientLocation = require("../models/ClientLocation");
const { protect } = require("../middleware/authMiddleware");
const { metaDiscoveryRedirect } = require('../utils/metaRedirect');
const { fetchMetaPage } = require('../ai/integrations/meta/metaDiscoveryClient');
const { decryptToken, encryptToken } = require('../utils/cryptoUtil');
const metaConfig = require('../config/meta');

/**
 * GET /api/integrations/meta/connect
 * Initiates Meta OAuth flow with cryptographically signed CSRF state
 */
router.get("/connect", protect, async (req, res) => {
  try {
    const { customerId, locationId, scopes } = req.query;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (locationId) {
      const location = await ClientLocation.findOne({ _id: locationId, customerId });
      if (!location) {
        return res.status(400).json({ success: false, message: "Location does not belong to this customer" });
      }
    }

    const requestedScopes = scopes ? scopes.split(",") : null;
    const authData = metaOAuthService.generateAuthorizationUrl({
      customerId,
      locationId,
      userId: req.user._id,
      scopes: requestedScopes,
    });

    return res.status(200).json({ success: true, data: authData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/integrations/meta/callback
 * Handles Meta OAuth redirect callback, token exchange, and asset discovery
 */
router.get("/callback", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        code: "META_OAUTH_DENIED",
        message: error_description || error,
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        code: "META_OAUTH_PARAMS_MISSING",
        message: "Authorization code and state are required.",
      });
    }

    // 1. Verify CSRF State
    const statePayload = metaOAuthService.verifyState(state);

    // 2. Exchange Code Server-Side
    const tokenData = await metaOAuthService.exchangeAuthorizationCode(code);

    // 3. Validate Token & Permissions
    const tokenMeta = await metaOAuthService.validateToken(tokenData.accessToken);

    // 4. Discover Permitted Assets
    const assets = await metaOAuthService.discoverAssets(tokenData.accessToken);

    // 5. Create Temporary Discovery Session
    const session = await metaOAuthService.createDiscoverySession({
      customerId: statePayload.customerId,
      locationId: statePayload.locationId,
      userId: statePayload.userId,
      tokenData,
      assets,
      scopes: tokenMeta.scopes,
    });

    // If request accepts JSON or is API test:
    if (req.headers.accept?.includes("application/json") || req.query.format === "json") {
      return res.status(200).json({
        success: true,
        discoverySessionId: session.sessionId,
        customerId: session.customerId,
        locationId: session.locationId,
        pagesCount: assets.pages.length,
        adAccountsCount: assets.adAccounts.length,
      });
    }

    // Redirect to frontend asset selection screen
    const clientRedirectUrl = metaDiscoveryRedirect(session);
    return res.redirect(clientRedirectUrl);
  } catch (err) {
    return res.status(err.code === "META_OAUTH_STATE_INVALID" ? 401 : 500).json({
      success: false,
      code: err.code || "META_CALLBACK_FAILED",
      message: err.message,
    });
  }
});

/**
 * GET /api/integrations/meta/discovery/:sessionId
 * Retrieves sanitized discovered assets for UI asset selection
 */
router.post('/discovery/:sessionId/page', protect, async (req, res) => {
  try {
    if (!req.user?._id || String(req.user.role || '').toLowerCase() === 'client') return res.status(403).json({ success: false, message: 'Staff access required.' });
    const { pageId } = req.body;
    if (!/^\d+$/.test(String(pageId || ''))) return res.status(400).json({ success: false, message: 'Enter a numeric Facebook Page ID.' });
    const session = await MetaDiscoverySession.findOne({ sessionId: req.params.sessionId, userId: req.user._id, status: 'ACTIVE', expiresAt: { $gt: new Date() } });
    if (!session) return res.status(404).json({ success: false, message: 'Discovery session expired or unavailable. Reconnect Meta.' });
    const page = await fetchMetaPage({ pageId, accessToken: decryptToken(session.userAccessTokenEncrypted), version: metaConfig.graphApiVersion });
    const entry = {
      pageId: page.id, name: page.name, category: page.category || '',
      pageAccessTokenEncrypted: page.access_token ? encryptToken(page.access_token) : null,
      hasInstagram: Boolean(page.instagram_business_account?.id),
      instagramBusinessAccountId: page.instagram_business_account?.id || null,
      instagramUsername: page.instagram_business_account?.username || null,
    };
    const previous = session.pages.find(p => p.pageId === page.id);
    if (previous) Object.assign(previous, entry); else session.pages.push(entry);
    await session.save();
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/discovery/:sessionId", protect, async (req, res) => {
  try {
    const session = await MetaDiscoverySession.findOne({
      sessionId: req.params.sessionId,
      status: "ACTIVE",
    })
      .populate("customerId", "name companyName")
      .populate("locationId", "name city")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        code: "DISCOVERY_SESSION_NOT_FOUND",
        message: "Discovery session not found or expired.",
      });
    }

    // Strip out all encrypted tokens from response
    const sanitizedPages = (session.pages || []).map((p) => ({
      pageId: p.pageId,
      name: p.name,
      category: p.category,
      tasks: p.tasks,
      hasInstagram: p.hasInstagram,
      instagramBusinessAccountId: p.instagramBusinessAccountId,
      instagramUsername: p.instagramUsername,
    }));

    const sanitizedAdAccounts = (session.adAccounts || []).map((a) => ({
      adAccountId: a.adAccountId,
      name: a.name,
      accountStatus: a.accountStatus,
      currency: a.currency,
      businessId: a.businessId,
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        customerId: session.customerId,
        locationId: session.locationId,
        grantedScopes: session.grantedScopes,
        discoveryWarnings: session.discoveryWarnings || [],
        pages: sanitizedPages,
        adAccounts: sanitizedAdAccounts,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/integrations/meta/confirm-assets
 * Confirms manager selection and creates MarketingConnection records via CredentialVault
 */
router.post("/confirm-assets", protect, async (req, res) => {
  try {
    const { discoverySessionId, customerId, locationId, selectedAssets } = req.body;

    if (!discoverySessionId || !customerId || !selectedAssets) {
      return res.status(400).json({
        success: false,
        message: "discoverySessionId, customerId, and selectedAssets are required.",
      });
    }

    const result = await metaOAuthService.confirmAssetSelection({
      discoverySessionId,
      customerId,
      locationId: locationId || null,
      selectedAssets,
      actorId: req.user._id,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.code === 'META_ASSET_SELECTION_REQUIRED' ? 400 : error.code === "ASSET_NOT_AUTHORIZED" || error.code === "TENANT_MISMATCH" ? 403 : 500;
    return res.status(status).json({
      success: false,
      code: error.code || "CONFIRM_ASSETS_FAILED",
      message: error.message,
    });
  }
});

module.exports = router;
