/**
 * CredentialVault.js
 * Secure Decoupled Credential Access Gateway for Digitalness CRM
 * The single approved internal path for decrypting and storing integration credentials.
 * 
 * Access Policy:
 * - Strictly internal to backend connectors and IntegrationManager.
 * - NEVER exposed to REST endpoints, AI agents, or frontend responses.
 */

const MarketingConnection = require("../../models/MarketingConnection");
const { decryptToken, encryptToken } = require("../../utils/cryptoUtil");

class CredentialVault {
  /**
   * Internal helper to load connection with token fields selected
   */
  async _loadConnectionWithTokens(connectionId) {
    const conn = await MarketingConnection.findById(connectionId)
      .select("+accessToken +refreshToken")
      .lean();

    if (!conn) {
      const err = new Error(`Connection not found: ${connectionId}`);
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }
    return conn;
  }

  /**
   * Retrieves and decrypts the active access token for a connection.
   */
  async getAccessToken(connectionId) {
    const conn = await this._loadConnectionWithTokens(connectionId);
    if (!conn.accessToken) return null;

    try {
      return decryptToken(conn.accessToken);
    } catch (err) {
      const error = new Error(`Failed to decrypt access token for connection ${connectionId}: ${err.message}`);
      error.code = "DECRYPTION_ERROR";
      throw error;
    }
  }

  /**
   * Retrieves and decrypts the refresh token for a connection.
   */
  async getRefreshToken(connectionId) {
    const conn = await this._loadConnectionWithTokens(connectionId);
    if (!conn.refreshToken) return null;

    try {
      return decryptToken(conn.refreshToken);
    } catch (err) {
      const error = new Error(`Failed to decrypt refresh token for connection ${connectionId}: ${err.message}`);
      error.code = "DECRYPTION_ERROR";
      throw error;
    }
  }

  /**
   * Stores / updates encrypted credentials on an existing connection.
   */
  async storeCredentials(connectionId, { accessToken, refreshToken = null, tokenExpiresAt = null }) {
    if (!accessToken) {
      throw new Error("accessToken is required to store credentials.");
    }

    const encryptedAccess = encryptToken(accessToken);
    const update = {
      accessToken: encryptedAccess,
      status: "CONNECTED",
      reauthRequired: false,
      lastSyncAt: new Date(),
    };

    if (refreshToken) {
      update.refreshToken = encryptToken(refreshToken);
    }
    if (tokenExpiresAt) {
      update.tokenExpiresAt = new Date(tokenExpiresAt);
    }

    const updated = await MarketingConnection.findByIdAndUpdate(connectionId, { $set: update }, { new: true });
    return Boolean(updated);
  }

  /**
   * Atomically rotates credentials upon OAuth token refresh.
   */
  async rotateCredentials(connectionId, { newAccessToken, newRefreshToken = null, tokenExpiresAt = null }) {
    return this.storeCredentials(connectionId, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt,
    });
  }

  /**
   * Revokes and clears tokens from a connection upon disconnection.
   */
  async clearCredentials(connectionId) {
    const updated = await MarketingConnection.findByIdAndUpdate(
      connectionId,
      {
        $set: {
          accessToken: "REVOKED",
          refreshToken: "REVOKED",
          status: "DISCONNECTED",
          disconnectedAt: new Date(),
          revokedAt: new Date(),
        },
      },
      { new: true }
    );
    return Boolean(updated);
  }

  /**
   * Checks whether valid credentials exist for a connection without decrypting.
   */
  async hasCredentials(connectionId) {
    const conn = await MarketingConnection.findById(connectionId).select("+accessToken").lean();
    return Boolean(conn && conn.accessToken && conn.accessToken !== "REVOKED");
  }
}

module.exports = new CredentialVault();
