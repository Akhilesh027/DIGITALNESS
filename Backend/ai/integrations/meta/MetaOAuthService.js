/**
 * MetaOAuthService.js
 * Comprehensive Meta Business App & Facebook Login for Business OAuth Service
 * 
 * Handles:
 * 1. CSRF-signed state generation
 * 2. Server-side authorization code exchange & long-lived token conversion
 * 3. Token validation & permission introspection
 * 4. Multi-asset discovery (Facebook Pages, linked Instagram Professional, Meta Ad Accounts)
 * 5. Temporary discovery sessions & explicit client/branch confirmation
 * 6. Zero secret leakage to frontend
 */

const crypto = require("crypto");
const metaConfig = require("../../../config/meta");
const MetaDiscoverySession = require("../../../models/MetaDiscoverySession");
const IntegrationManager = require("../IntegrationManager");
const { encryptToken, decryptToken } = require("../../../utils/cryptoUtil");

class MetaOAuthService {
  constructor() {
    this.stateSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || "meta_oauth_csrf_secret";
  }

  /**
   * Generates a signed, tamper-proof CSRF state string
   */
  generateState({ customerId, locationId = null, userId }) {
    const payload = {
      customerId: customerId.toString(),
      locationId: locationId ? locationId.toString() : null,
      userId: userId.toString(),
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString("hex"),
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.stateSecret)
      .update(payloadStr)
      .digest("base64url");

    return `${payloadStr}.${signature}`;
  }

  /**
   * Validates and unpacks the CSRF state parameter
   */
  verifyState(stateParam) {
    if (!stateParam || !stateParam.includes(".")) {
      const err = new Error("META_OAUTH_STATE_INVALID: Malformed state format.");
      err.code = "META_OAUTH_STATE_INVALID";
      throw err;
    }

    const [payloadStr, signature] = stateParam.split(".");
    const expectedSignature = crypto
      .createHmac("sha256", this.stateSecret)
      .update(payloadStr)
      .digest("base64url");

    if (signature !== expectedSignature) {
      const err = new Error("META_OAUTH_STATE_INVALID: State signature verification failed.");
      err.code = "META_OAUTH_STATE_INVALID";
      throw err;
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));

      // Max validity: 15 minutes
      if (Date.now() - payload.timestamp > 15 * 60 * 1000) {
        const err = new Error("META_OAUTH_STATE_EXPIRED: State has expired.");
        err.code = "META_OAUTH_STATE_EXPIRED";
        throw err;
      }

      return payload;
    } catch (e) {
      const err = new Error("META_OAUTH_STATE_INVALID: Failed to parse state payload.");
      err.code = "META_OAUTH_STATE_INVALID";
      throw err;
    }
  }

  /**
   * Constructs the Facebook Login for Business authorization URL
   */
  generateAuthorizationUrl({ customerId, locationId = null, userId, scopes = null }) {
    const state = this.generateState({ customerId, locationId, userId });
    const requestedScopes =
      scopes || [
        ...metaConfig.permissionBundles.INSTAGRAM_PUBLISHING,
        ...metaConfig.permissionBundles.INSTAGRAM_COMMUNITY,
        ...metaConfig.permissionBundles.META_ADS_MANAGEMENT,
      ];

    const params = new URLSearchParams({
      client_id: metaConfig.appId,
      redirect_uri: metaConfig.redirectUri,
      state,
      response_type: "code",
      scope: requestedScopes.join(","),
    });

    if (metaConfig.loginConfigId) {
      params.set("config_id", metaConfig.loginConfigId);
    }

    const authUrl = `https://www.facebook.com/${metaConfig.graphApiVersion}/dialog/oauth?${params.toString()}`;

    return {
      authUrl,
      state,
    };
  }

  /**
   * Exchanges authorization code for access token server-side
   */
  async exchangeAuthorizationCode(code) {
    const params = new URLSearchParams({
      client_id: metaConfig.appId,
      client_secret: metaConfig.appSecret,
      redirect_uri: metaConfig.redirectUri,
      code,
    });

    const url = `https://graph.facebook.com/${metaConfig.graphApiVersion}/oauth/access_token?${params.toString()}`;

    try {
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();

      if (!response.ok || data.error) {
        // Safe fallback for local development or mock test credentials
        if (code.startsWith("mock_meta_code_")) {
          return {
            accessToken: `eaab_mock_token_${Date.now()}`,
            tokenType: "bearer",
            expiresIn: 5184000,
          };
        }
        const err = new Error(data.error?.message || "Meta token exchange failed.");
        err.code = "META_CODE_EXCHANGE_FAILED";
        throw err;
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      };
    } catch (err) {
      if (code.startsWith("mock_meta_code_")) {
        return {
          accessToken: `eaab_mock_token_${Date.now()}`,
          tokenType: "bearer",
          expiresIn: 5184000,
        };
      }
      throw err;
    }
  }

  /**
   * Validates access token and retrieves permissions/expiration
   */
  async validateToken(accessToken) {
    if (accessToken.startsWith("eaab_mock_token_")) {
      return {
        isValid: true,
        appId: metaConfig.appId,
        userId: "meta_user_9988",
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopes: [
          "pages_show_list",
          "pages_read_engagement",
          "instagram_basic",
          "instagram_content_publish",
          "ads_read",
          "ads_management",
        ],
      };
    }

    const appToken = `${metaConfig.appId}|${metaConfig.appSecret}`;
    const url = `https://graph.facebook.com/${metaConfig.graphApiVersion}/debug_token?input_token=${accessToken}&access_token=${appToken}`;

    const response = await fetch(url, { method: "GET" });
    const data = await response.json();

    if (!response.ok || data.error || !data.data?.is_valid) {
      const err = new Error(data.error?.message || "Invalid Meta access token.");
      err.code = "META_TOKEN_INVALID";
      throw err;
    }

    return {
      isValid: data.data.is_valid,
      appId: data.data.app_id,
      userId: data.data.user_id,
      expiresAt: data.data.expires_at ? new Date(data.data.expires_at * 1000) : null,
      scopes: data.data.scopes || [],
    };
  }

  /**
   * Discovers accessible Facebook Pages, Instagram Accounts, and Ad Accounts
   */
  async discoverAssets(accessToken) {
    if (accessToken.startsWith("eaab_mock_token_")) {
      return {
        pages: [
          {
            pageId: "page_apexbee_101",
            name: "ApexBee Technologies Official",
            category: "Software Company",
            tasks: ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE"],
            pageAccessToken: "eaab_page_token_apexbee_101",
            hasInstagram: true,
            instagramBusinessAccountId: "ig_apexbee_201",
            instagramUsername: "apexbee_official",
          },
          {
            pageId: "page_digitalness_102",
            name: "Digitalness CRM",
            category: "Marketing Agency",
            tasks: ["MANAGE", "CREATE_CONTENT"],
            pageAccessToken: "eaab_page_token_digitalness_102",
            hasInstagram: true,
            instagramBusinessAccountId: "ig_digitalness_202",
            instagramUsername: "digitalness_crm",
          },
          {
            pageId: "page_unlinked_103",
            name: "Personal Brand Page (No IG)",
            category: "Community",
            tasks: ["CREATE_CONTENT"],
            pageAccessToken: "eaab_page_token_unlinked_103",
            hasInstagram: false,
            instagramBusinessAccountId: null,
            instagramUsername: null,
          },
        ],
        adAccounts: [
          {
            adAccountId: "act_apexbee_ads_301",
            name: "ApexBee Primary Ad Account",
            accountStatus: 1, // ACTIVE
            currency: "INR",
            businessId: "biz_apexbee_401",
          },
          {
            adAccountId: "act_digitalness_ads_302",
            name: "Digitalness Growth Ad Account",
            accountStatus: 1,
            currency: "INR",
            businessId: "biz_digitalness_402",
          },
        ],
      };
    }

    // Real Graph API discovery
    const pagesUrl = `https://graph.facebook.com/${metaConfig.graphApiVersion}/me/accounts?fields=id,name,category,tasks,access_token,instagram_business_account{id,username,name}&access_token=${accessToken}`;
    const adAccountsUrl = `https://graph.facebook.com/${metaConfig.graphApiVersion}/me/adaccounts?fields=id,name,account_status,currency,business&access_token=${accessToken}`;

    const [pagesRes, adsRes] = await Promise.all([
      fetch(pagesUrl).then((r) => r.json()),
      fetch(adAccountsUrl).then((r) => r.json()).catch(() => ({ data: [] })),
    ]);

    const pages = (pagesRes.data || []).map((page) => ({
      pageId: page.id,
      name: page.name,
      category: page.category,
      tasks: page.tasks || [],
      pageAccessToken: page.access_token,
      hasInstagram: Boolean(page.instagram_business_account?.id),
      instagramBusinessAccountId: page.instagram_business_account?.id || null,
      instagramUsername: page.instagram_business_account?.username || null,
    }));

    const adAccounts = (adsRes.data || []).map((ad) => ({
      adAccountId: ad.id,
      name: ad.name,
      accountStatus: ad.account_status,
      currency: ad.currency,
      businessId: ad.business?.id || null,
    }));

    return { pages, adAccounts };
  }

  /**
   * Creates a temporary discovery session in MongoDB
   */
  async createDiscoverySession({ customerId, locationId = null, userId, tokenData, assets, scopes }) {
    const sessionId = `meta_disc_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const userAccessTokenEncrypted = encryptToken(tokenData.accessToken);

    const pagesWithEncryptedTokens = assets.pages.map((p) => ({
      ...p,
      pageAccessTokenEncrypted: p.pageAccessToken ? encryptToken(p.pageAccessToken) : null,
    }));

    const session = await MetaDiscoverySession.create({
      sessionId,
      customerId,
      locationId: locationId || null,
      userId,
      userAccessTokenEncrypted,
      grantedScopes: scopes || [],
      pages: pagesWithEncryptedTokens,
      adAccounts: assets.adAccounts,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min TTL
    });

    return session;
  }

  /**
   * Confirms manager asset selection and creates MarketingConnection records
   */
  async confirmAssetSelection({
    discoverySessionId,
    customerId,
    locationId = null,
    selectedAssets = {},
    actorId = null,
  }) {
    const session = await MetaDiscoverySession.findOne({
      sessionId: discoverySessionId,
      status: "ACTIVE",
    });

    if (!session) {
      const err = new Error("DISCOVERY_SESSION_INVALID: Session not found, expired, or already used.");
      err.code = "DISCOVERY_SESSION_INVALID";
      throw err;
    }

    if (session.customerId.toString() !== customerId.toString()) {
      const err = new Error("TENANT_MISMATCH: Discovery session does not belong to this customer.");
      err.code = "TENANT_MISMATCH";
      throw err;
    }

    const createdConnections = [];

    // 1. Connect Facebook Page
    if (selectedAssets.facebookPageId) {
      const page = session.pages.find((p) => p.pageId === selectedAssets.facebookPageId);
      if (!page) {
        const err = new Error(`ASSET_NOT_AUTHORIZED: Facebook Page '${selectedAssets.facebookPageId}' not found in discovery session.`);
        err.code = "ASSET_NOT_AUTHORIZED";
        throw err;
      }

      const pageAccessToken = page.pageAccessTokenEncrypted
        ? decryptToken(page.pageAccessTokenEncrypted)
        : decryptToken(session.userAccessTokenEncrypted);

      const fbConn = await IntegrationManager.connect({
        customerId,
        locationId,
        platform: "Facebook",
        accountType: "FacebookPage",
        platformAccountId: page.pageId,
        platformAccountName: page.name,
        accessToken: pageAccessToken,
        scopes: session.grantedScopes.filter((s) => s.startsWith("pages_")),
        metadata: {
          category: page.category,
          tasks: page.tasks,
          hasInstagram: page.hasInstagram,
          instagramBusinessAccountId: page.instagramBusinessAccountId,
        },
      });
      createdConnections.push(fbConn);
    }

    // 2. Connect Instagram Professional Account
    if (selectedAssets.instagramBusinessAccountId) {
      const pageWithIg = session.pages.find(
        (p) => p.instagramBusinessAccountId === selectedAssets.instagramBusinessAccountId
      );

      if (!pageWithIg) {
        const err = new Error(`ASSET_NOT_AUTHORIZED: Instagram Account '${selectedAssets.instagramBusinessAccountId}' not authorized.`);
        err.code = "ASSET_NOT_AUTHORIZED";
        throw err;
      }

      const igToken = pageWithIg.pageAccessTokenEncrypted
        ? decryptToken(pageWithIg.pageAccessTokenEncrypted)
        : decryptToken(session.userAccessTokenEncrypted);

      const igConn = await IntegrationManager.connect({
        customerId,
        locationId,
        platform: "Instagram",
        accountType: "InstagramBusiness",
        platformAccountId: selectedAssets.instagramBusinessAccountId,
        platformAccountName: pageWithIg.instagramUsername ? `@${pageWithIg.instagramUsername}` : pageWithIg.name,
        accessToken: igToken,
        scopes: session.grantedScopes.filter((s) => s.startsWith("instagram_") || s.startsWith("pages_")),
        metadata: {
          linkedFacebookPageId: pageWithIg.pageId,
          instagramUsername: pageWithIg.instagramUsername,
        },
      });
      createdConnections.push(igConn);
    }

    // 3. Connect Meta Ad Account
    if (selectedAssets.metaAdAccountId) {
      const ad = session.adAccounts.find((a) => a.adAccountId === selectedAssets.metaAdAccountId);
      if (!ad) {
        const err = new Error(`ASSET_NOT_AUTHORIZED: Meta Ad Account '${selectedAssets.metaAdAccountId}' not authorized.`);
        err.code = "ASSET_NOT_AUTHORIZED";
        throw err;
      }

      const userToken = decryptToken(session.userAccessTokenEncrypted);

      const adConn = await IntegrationManager.connect({
        customerId,
        locationId,
        platform: "MetaAds",
        accountType: "MetaAdAccount",
        platformAccountId: ad.adAccountId,
        platformAccountName: ad.name,
        accessToken: userToken,
        scopes: session.grantedScopes.filter((s) => s.startsWith("ads_")),
        metadata: {
          currency: ad.currency,
          businessId: ad.businessId,
          accountStatus: ad.accountStatus,
        },
      });
      createdConnections.push(adConn);
    }

    // Mark session confirmed
    session.status = "CONFIRMED";
    await session.save();

    return {
      success: true,
      connectionsCreated: createdConnections.length,
      connections: createdConnections,
    };
  }
}

module.exports = new MetaOAuthService();
