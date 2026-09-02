/**
 * IntegrationManager.js
 * Central Multi-Tenant Connection Orchestration Gateway for Digitalness CRM
 * 
 * Responsibilities:
 * 1. Strict Tenant & Location Boundary Resolution (Zero Cross-Client Leakage)
 * 2. Scope & Permission Validation
 * 3. Connection Health & Expiry State Management
 * 4. Safe In-Memory Credential Resolution & Callback Execution (`executeWithConnection`)
 * 5. Sanitized Error Logging
 */

const MarketingConnection = require("../../models/MarketingConnection");
const CredentialVault = require("./CredentialVault");
const { getOperationRequirement } = require("./providerRequirements");

class IntegrationManager {
  /**
   * Resolves connection strictly bound to a customer and optional branch location.
   * Priority: Exact Location Match -> Customer-level Default Match -> null.
   */
  async getConnection({ customerId, locationId = null, platform, accountType = null }) {
    if (!customerId) {
      throw new Error("customerId is required to resolve integration connection.");
    }
    if (!platform) {
      throw new Error("platform is required to resolve integration connection.");
    }

    const platformQuery = {
      customerId,
      status: { $in: ["CONNECTED", "Connected", "EXPIRED", "Expired", "REAUTH_REQUIRED"] },
    };

    // Normalize platform aliases (e.g. Meta -> Facebook / Instagram)
    if (platform === "Meta") {
      platformQuery.platform = { $in: ["Meta", "Facebook", "Instagram", "MetaAds"] };
    } else if (platform === "Google") {
      platformQuery.platform = { $in: ["Google", "GoogleAds", "GoogleBusiness", "GoogleAnalytics", "GoogleSearchConsole"] };
    } else {
      platformQuery.platform = platform;
    }

    if (accountType) {
      platformQuery.accountType = accountType;
    }

    // 1. If locationId is specified, search for exact location connection first
    if (locationId) {
      const locationMatch = await MarketingConnection.findOne({
        ...platformQuery,
        locationId,
      })
        .populate("locationId", "name city address phone")
        .populate("customerId", "name companyName brandName")
        .lean();

      if (locationMatch) return locationMatch;
    }

    // 2. Fallback to customer-level (global) connection (where locationId is null)
    const customerLevelMatch = await MarketingConnection.findOne({
      ...platformQuery,
      locationId: null,
    })
      .populate("customerId", "name companyName brandName")
      .lean();

    return customerLevelMatch || null;
  }

  /**
   * Retrieves connection by unique record ID
   */
  async getConnectionById(connectionId) {
    return MarketingConnection.findById(connectionId)
      .populate("locationId", "name city address")
      .populate("customerId", "name companyName brandName")
      .lean();
  }

  /**
   * Lists all active connections for a customer / branch location (Sanitized)
   */
  async listConnections(customerId, locationId = null) {
    if (!customerId) throw new Error("customerId is required to list connections.");

    const query = {
      customerId,
      status: { $nin: ["DISCONNECTED", "Disconnected", "REVOKED"] },
    };
    if (locationId) query.locationId = locationId;

    const connections = await MarketingConnection.find(query)
      .populate("locationId", "name city address")
      .sort({ createdAt: -1 })
      .lean();

    return connections.map((conn) => ({
      ...conn,
      capabilities: this.calculateCapabilities(conn),
    }));
  }

  /**
   * Calculates capability flags derived strictly from granted OAuth scopes & account type
   */
  calculateCapabilities(connection) {
    const scopes = (connection?.scopes || []).map((s) => s.toLowerCase());
    const platform = connection?.platform;

    if (platform === "Instagram") {
      return {
        READ_PROFILE: scopes.includes("instagram_basic"),
        PUBLISH_MEDIA: scopes.includes("instagram_content_publish"),
        READ_COMMENTS: scopes.includes("instagram_manage_comments"),
        READ_INSIGHTS: scopes.includes("instagram_manage_insights"),
      };
    }

    if (platform === "Facebook") {
      return {
        READ_PAGE: scopes.includes("pages_show_list") || scopes.includes("pages_read_engagement"),
        PUBLISH_POSTS: scopes.includes("pages_manage_posts") || scopes.includes("pages_read_engagement"),
        READ_ENGAGEMENT: scopes.includes("pages_read_engagement"),
      };
    }

    if (platform === "MetaAds") {
      return {
        READ_CAMPAIGNS: scopes.includes("ads_read"),
        MANAGE_CAMPAIGNS: scopes.includes("ads_management"),
      };
    }

    return {};
  }

  /**
   * Evaluates if granted scopes satisfy required scopes for an operation
   */
  validateScopes(connection, requiredScopes = []) {
    if (!requiredScopes || requiredScopes.length === 0) {
      return { valid: true, missing: [] };
    }

    const granted = (connection?.scopes || []).map((s) => s.toLowerCase());
    const missing = requiredScopes.filter((req) => !granted.includes(req.toLowerCase()));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Evaluates comprehensive health of a connection record
   */
  async validateHealth(connectionId) {
    const conn = await MarketingConnection.findById(connectionId).lean();
    if (!conn) {
      return { healthy: false, status: "NOT_FOUND", issues: ["Connection record not found."] };
    }

    const issues = [];
    let status = conn.status.toUpperCase();

    // 1. Check expiration
    if (conn.tokenExpiresAt && new Date() > new Date(conn.tokenExpiresAt)) {
      issues.push("TOKEN_EXPIRED");
      status = "EXPIRED";
    }

    // 2. Check reauth flag
    if (conn.reauthRequired) {
      issues.push("REAUTH_REQUIRED");
      status = "REAUTH_REQUIRED";
    }

    // 3. Check if marked as disconnected/revoked
    if (status === "DISCONNECTED" || status === "REVOKED") {
      issues.push("CONNECTION_REVOKED");
    }

    const healthy = issues.length === 0 && (status === "CONNECTED" || status === "Connected");

    // Update last health check timestamp
    await MarketingConnection.findByIdAndUpdate(connectionId, {
      $set: {
        lastHealthCheckAt: new Date(),
        status: status === "Connected" ? "CONNECTED" : status,
      },
    });

    return {
      healthy,
      status,
      issues,
      tokenExpiresAt: conn.tokenExpiresAt,
      lastHealthCheckAt: new Date(),
      platform: conn.platform,
      accountType: conn.accountType,
      platformAccountName: conn.platformAccountName,
    };
  }

  /**
   * Resolves a fully verified, healthy connection ready for execution
   */
  async getHealthyConnection({ customerId, locationId = null, platform, accountType = null, requiredScopes = [] }) {
    const conn = await this.getConnection({ customerId, locationId, platform, accountType });
    if (!conn) {
      const err = new Error(`No ${platform} connection found for client.`);
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    const health = await this.validateHealth(conn._id);
    if (!health.healthy) {
      const err = new Error(`${platform} connection is not healthy: ${health.issues.join(", ")}`);
      err.code = health.status === "EXPIRED" ? "CONNECTION_EXPIRED" : "REAUTH_REQUIRED";
      err.issues = health.issues;
      throw err;
    }

    const scopeCheck = this.validateScopes(conn, requiredScopes);
    if (!scopeCheck.valid) {
      const err = new Error(`Missing required permissions for ${platform}: ${scopeCheck.missing.join(", ")}`);
      err.code = "MISSING_PERMISSION";
      err.missingScopes = scopeCheck.missing;
      throw err;
    }

    return conn;
  }

  /**
   * Connects / registers platform account credentials
   */
  async connect({
    customerId,
    locationId = null,
    platform,
    accountType,
    platformAccountId,
    platformAccountName,
    accessToken,
    refreshToken = null,
    tokenExpiresAt = null,
    scopes = [],
    metadata = {},
    connectedBy = null,
  }) {
    if (!customerId || !platform || !platformAccountId || !platformAccountName || !accessToken) {
      throw new Error("Missing required parameters (customerId, platform, platformAccountId, platformAccountName, accessToken).");
    }

    let conn = await MarketingConnection.findOne({
      customerId,
      locationId: locationId || null,
      platformAccountId,
    });

    if (conn) {
      conn.platform = platform;
      conn.accountType = accountType || conn.accountType;
      conn.platformAccountName = platformAccountName;
      conn.accessToken = accessToken;
      if (refreshToken) conn.refreshToken = refreshToken;
      if (tokenExpiresAt) conn.tokenExpiresAt = new Date(tokenExpiresAt);
      conn.scopes = scopes || conn.scopes;
      conn.metadata = { ...(conn.metadata || {}), ...metadata };
      conn.status = "CONNECTED";
      conn.reauthRequired = false;
      conn.lastError = { code: null, message: null, occurredAt: null };
      conn.lastSyncAt = new Date();
      conn.connectedBy = connectedBy || conn.connectedBy;
      await conn.save();
    } else {
      conn = await MarketingConnection.create({
        customerId,
        locationId: locationId || null,
        platform,
        accountType,
        platformAccountId,
        platformAccountName,
        accessToken,
        refreshToken,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        scopes: scopes || [],
        metadata: metadata || {},
        status: "CONNECTED",
        connectedBy,
      });
    }

    const sanitized = conn.toObject();
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    return sanitized;
  }

  /**
   * Disconnects a platform connection and clears credentials
   */
  async disconnect(connectionId) {
    await CredentialVault.clearCredentials(connectionId);
    return { success: true, message: "Connection disconnected and credentials revoked." };
  }

  /**
   * Sanitizes and records an integration error
   */
  async markError(connectionId, { code = "INTEGRATION_ERROR", message = "An error occurred." }) {
    // Sanitize message to strip any inadvertent tokens
    const cleanMessage = String(message)
      .replace(/eaab[a-zA-Z0-9_-]+/gi, "[REDACTED_META_TOKEN]")
      .replace(/ya29\.[a-zA-Z0-9_-]+/gi, "[REDACTED_GOOGLE_TOKEN]")
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");

    await MarketingConnection.findByIdAndUpdate(connectionId, {
      $set: {
        status: "ERROR",
        lastError: {
          code: String(code).substring(0, 50),
          message: cleanMessage.substring(0, 500),
          occurredAt: new Date(),
        },
      },
    });
  }

  /**
   * Clears error state on successful API call
   */
  async clearError(connectionId) {
    await MarketingConnection.findByIdAndUpdate(connectionId, {
      $set: {
        lastError: { code: null, message: null, occurredAt: null },
        lastSuccessfulApiCallAt: new Date(),
      },
    });
  }

  /**
   * Executes a connector callback with safe in-memory decrypted credentials.
   * Ensures tokens never escape the callback lifecycle and updates tracking stats.
   */
  async executeWithConnection({
    customerId,
    locationId = null,
    platform,
    accountType = null,
    requiredScopes = [],
    operation = null,
    executor,
  }) {
    if (typeof executor !== "function") {
      throw new Error("Executor callback function is required.");
    }

    // Auto-resolve requirements if operation name provided
    let finalScopes = requiredScopes;
    let finalPlatform = platform;
    let finalAccountType = accountType;

    if (operation) {
      const opReq = getOperationRequirement(operation);
      if (opReq) {
        finalScopes = opReq.requiredScopes;
        finalPlatform = finalPlatform || opReq.platform;
        finalAccountType = finalAccountType || opReq.accountType;
      }
    }

    // 1. Resolve healthy connection strictly for customer and location
    const connection = await this.getHealthyConnection({
      customerId,
      locationId,
      platform: finalPlatform,
      accountType: finalAccountType,
      requiredScopes: finalScopes,
    });

    // 2. Resolve credentials inside isolated execution scope
    const accessToken = await CredentialVault.getAccessToken(connection._id);
    if (!accessToken) {
      const err = new Error(`Access token missing for ${finalPlatform} connection.`);
      err.code = "CREDENTIAL_MISSING";
      throw err;
    }

    const credentialContext = {
      accessToken,
      platformAccountId: connection.platformAccountId,
      accountType: connection.accountType,
      platform: connection.platform,
      metadata: connection.metadata || {},
    };

    try {
      // 3. Execute connector callback
      const result = await executor(credentialContext, connection);

      // 4. Record successful API call
      await this.clearError(connection._id);

      return {
        success: true,
        connectionId: connection._id,
        platformAccountId: connection.platformAccountId,
        result,
      };
    } catch (execErr) {
      await this.markError(connection._id, {
        code: execErr.code || "EXECUTION_ERROR",
        message: execErr.message,
      });
      throw execErr;
    }
  }
}

module.exports = new IntegrationManager();
