/**
 * marketingConnectionController.js
 * Express controllers for Integration & Marketing Connections
 * Delegates all lifecycle and token logic to IntegrationManager.
 */

const IntegrationManager = require("../ai/integrations/IntegrationManager");
const Customer = require("../models/Customer");

/**
 * GET /api/marketing-connections
 * Lists connections for a customer (and optional branch location)
 */
exports.getConnections = async (req, res) => {
  try {
    const { customerId, locationId } = req.query;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required" });
    }

    const connections = await IntegrationManager.listConnections(customerId, locationId);
    return res.status(200).json({ success: true, data: connections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/marketing-connections/:id
 * Fetches connection details
 */
exports.getConnectionDetail = async (req, res) => {
  try {
    const connection = await IntegrationManager.getConnectionById(req.params.id);
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }
    return res.status(200).json({ success: true, data: connection });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/marketing-connections/connect
 * Connects or updates a platform connection (Legacy/Development Connect & OAuth Callback Gateway)
 */
exports.connectPlatform = async (req, res) => {
  try {
    const {
      customerId,
      locationId,
      platform,
      accountType,
      platformAccountId,
      platformAccountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scopes,
      metadata,
    } = req.body;

    if (!customerId || !platform || !platformAccountId || !platformAccountName || !accessToken) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required connection parameters (customerId, platform, platformAccountId, platformAccountName, accessToken)",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const connection = await IntegrationManager.connect({
      customerId,
      locationId: locationId || null,
      platform,
      accountType,
      platformAccountId,
      platformAccountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scopes: scopes || [],
      metadata: metadata || {},
      connectedBy: req.user?._id,
    });

    return res.status(200).json({ success: true, data: connection });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/marketing-connections/:id/disconnect
 * Disconnects a connection and revokes stored credentials via CredentialVault
 */
exports.disconnectPlatform = async (req, res) => {
  try {
    const result = await IntegrationManager.disconnect(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/marketing-connections/:id/health
 * Evaluates connection health, expiration, and required re-authorization state
 */
exports.checkHealth = async (req, res) => {
  try {
    const health = await IntegrationManager.validateHealth(req.params.id);
    if (health.status === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }
    return res.status(200).json({ success: true, data: health });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
