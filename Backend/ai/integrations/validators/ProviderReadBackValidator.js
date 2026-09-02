/**
 * ProviderReadBackValidator.js
 * Performs live network read-backs against external provider APIs (Meta Graph API & Google My Business)
 * to verify that claimed published resources genuinely exist on real accounts before awarding REAL_PASS.
 */

const MarketingConnection = require("../../../models/MarketingConnection");
const { decryptToken } = require("../../security/CredentialVault");

class ProviderReadBackValidator {
  /**
   * Verifies an Instagram media resource via Meta Graph API
   */
  async verifyInstagramMedia({ connectionId, providerMediaId, expectedAccountId }) {
    if (!providerMediaId || providerMediaId.startsWith("179823412093847")) {
      return {
        verified: false,
        reason: "FIXTURE_OR_MOCK_ID_DETECTED",
        evidence: null,
      };
    }

    const conn = await MarketingConnection.findById(connectionId);
    if (!conn || conn.status !== "Connected") {
      return {
        verified: false,
        reason: "MARKETING_CONNECTION_NOT_ACTIVE",
        evidence: null,
      };
    }

    const token = decryptToken(conn.encryptedAccessToken);
    if (!token || token.startsWith("mock_")) {
      return {
        verified: false,
        reason: "NO_LIVE_ACCESS_TOKEN",
        evidence: null,
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${providerMediaId}?fields=id,caption,media_type,timestamp,username,owner&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        return {
          verified: false,
          reason: data.error.message,
          errorCode: data.error.code,
          evidence: null,
        };
      }

      const isAccountMatch = !expectedAccountId || data.owner?.id === expectedAccountId || data.username === expectedAccountId;

      return {
        verified: isAccountMatch,
        reason: isAccountMatch ? "VERIFIED_ON_META_SERVERS" : "ACCOUNT_MISMATCH",
        evidence: {
          providerMediaId: data.id,
          providerTimestamp: data.timestamp,
          mediaType: data.media_type,
          username: data.username,
          verifiedAt: new Date(),
        },
      };
    } catch (err) {
      return {
        verified: false,
        reason: `NETWORK_ERROR: ${err.message}`,
        evidence: null,
      };
    }
  }

  /**
   * Verifies a Facebook Page post via Meta Graph API
   */
  async verifyFacebookPagePost({ connectionId, providerPostId, expectedPageId }) {
    if (!providerPostId || providerPostId.includes("82736450192")) {
      return {
        verified: false,
        reason: "FIXTURE_OR_MOCK_ID_DETECTED",
        evidence: null,
      };
    }

    const conn = await MarketingConnection.findById(connectionId);
    if (!conn || conn.status !== "Connected") {
      return {
        verified: false,
        reason: "MARKETING_CONNECTION_NOT_ACTIVE",
        evidence: null,
      };
    }

    const token = decryptToken(conn.encryptedAccessToken);
    if (!token || token.startsWith("mock_")) {
      return {
        verified: false,
        reason: "NO_LIVE_ACCESS_TOKEN",
        evidence: null,
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${providerPostId}?fields=id,created_time,message,from&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        return {
          verified: false,
          reason: data.error.message,
          errorCode: data.error.code,
          evidence: null,
        };
      }

      const isPageMatch = !expectedPageId || data.from?.id === expectedPageId || data.id.startsWith(expectedPageId);

      return {
        verified: isPageMatch,
        reason: isPageMatch ? "VERIFIED_ON_META_SERVERS" : "PAGE_MISMATCH",
        evidence: {
          providerPostId: data.id,
          createdTime: data.created_time,
          pageId: data.from?.id,
          verifiedAt: new Date(),
        },
      };
    } catch (err) {
      return {
        verified: false,
        reason: `NETWORK_ERROR: ${err.message}`,
        evidence: null,
      };
    }
  }

  /**
   * Verifies a Google Business Profile LocalPost resource
   */
  async verifyGBPLocalPost({ connectionId, localPostName, expectedLocationId }) {
    if (!localPostName || localPostName.includes("7619283049")) {
      return {
        verified: false,
        reason: "FIXTURE_OR_MOCK_ID_DETECTED",
        evidence: null,
      };
    }

    const conn = await MarketingConnection.findById(connectionId);
    if (!conn || conn.status !== "Connected") {
      return {
        verified: false,
        reason: "MARKETING_CONNECTION_NOT_ACTIVE",
        evidence: null,
      };
    }

    const token = decryptToken(conn.encryptedAccessToken);
    if (!token || token.startsWith("mock_")) {
      return {
        verified: false,
        reason: "NO_LIVE_ACCESS_TOKEN",
        evidence: null,
      };
    }

    try {
      const url = `https://mybusiness.googleapis.com/v4/${localPostName}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        return {
          verified: false,
          reason: data.error.message,
          errorCode: data.error.code,
          evidence: null,
        };
      }

      return {
        verified: true,
        reason: "VERIFIED_ON_GOOGLE_SERVERS",
        evidence: {
          name: data.name,
          state: data.state,
          createTime: data.createTime,
          verifiedAt: new Date(),
        },
      };
    } catch (err) {
      return {
        verified: false,
        reason: `NETWORK_ERROR: ${err.message}`,
        evidence: null,
      };
    }
  }
}

module.exports = new ProviderReadBackValidator();
