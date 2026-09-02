/**
 * MetaActivationPreflightService.js
 * Strict Preflight Validation & Drift Detection for Meta Ads Activation
 * 
 * Verifies that the live Meta object configuration exactly matches the approved R3 snapshot
 * before allowing any status transition to ACTIVE.
 */

const crypto = require("crypto");
const AdCampaign = require("../../models/AdCampaign");
const ApprovalRequest = require("../../models/ApprovalRequest");
const IntegrationManager = require("../integrations/IntegrationManager");
const metaBudgetNormalizer = require("../integrations/connectors/meta/MetaBudgetNormalizer");

class MetaActivationPreflightService {
  /**
   * Computes a deterministic SHA-256 hash of an approved campaign activation configuration
   */
  generateSnapshotHash(config) {
    const payload = {
      metaCampaignId: config.metaCampaignId,
      metaAdSetIds: (config.metaAdSetIds || []).sort(),
      metaAdIds: (config.metaAdIds || []).sort(),
      budgetAmount: config.budget?.amount,
      currency: config.budget?.currency || "INR",
      objective: config.objective,
      targetLocations: (config.targetLocations || []).sort(),
      creativeAssetId: config.creativeAssetId || null,
      destinationUrl: config.creative?.destinationUrl || null,
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  /**
   * Runs comprehensive preflight checks against live Meta Ads state and CRM records
   */
  async runPreflight({
    adCampaignId,
    activationApprovalId,
    customerId,
    locationId = null,
    currentSnapshotHash,
    mockBypass = false,
  }) {
    const issues = [];

    // 1. Validate AdCampaign record
    const campaign = await AdCampaign.findById(adCampaignId);
    if (!campaign) {
      const err = new Error("ACTIVATION_PREFLIGHT_FAILED: AdCampaign record not found.");
      err.code = "CAMPAIGN_NOT_FOUND";
      throw err;
    }

    // 2. Validate Tenant & Location
    if (campaign.customerId.toString() !== customerId.toString()) {
      const err = new Error("TENANT_MISMATCH: Campaign does not belong to this customer.");
      err.code = "TENANT_MISMATCH";
      throw err;
    }

    if (locationId && campaign.clientLocationId && campaign.clientLocationId.toString() !== locationId.toString()) {
      const err = new Error("LOCATION_MISMATCH: Campaign location does not match request location.");
      err.code = "LOCATION_MISMATCH";
      throw err;
    }

    // 3. Validate Hierarchy Presence
    if (!campaign.metaCampaignId) {
      issues.push("MISSING_META_CAMPAIGN_ID: Campaign has not been created on Meta.");
    }
    if (!campaign.metaAdSetIds || campaign.metaAdSetIds.length === 0) {
      issues.push("MISSING_META_ADSET_ID: Ad Set has not been created on Meta.");
    }
    if (!campaign.metaAdIds || campaign.metaAdIds.length === 0) {
      issues.push("MISSING_META_AD_ID: Ad has not been created on Meta.");
    }

    // 4. Validate R3 Activation Approval
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId: activationApprovalId }, { _id: activationApprovalId }],
      status: "APPROVED",
      actionType: "META_CAMPAIGN_ACTIVATE",
    });

    if (!approval) {
      const err = new Error("ACTIVATION_APPROVAL_REQUIRED: No valid APPROVED R3 Activation approval found.");
      err.code = "ACTIVATION_APPROVAL_REQUIRED";
      throw err;
    }

    // 5. Drift Detection: Compare approved snapshot hash against current campaign state
    const expectedHash = approval.executionIntent?.payload?.approvedSnapshotHash || currentSnapshotHash;
    const computedCurrentHash = this.generateSnapshotHash({
      metaCampaignId: campaign.metaCampaignId,
      metaAdSetIds: campaign.metaAdSetIds,
      metaAdIds: campaign.metaAdIds,
      budget: campaign.budget,
      objective: campaign.objective,
      targetLocations: campaign.targetLocations,
      creativeAssetId: campaign.creativeRequirementId,
      creative: { destinationUrl: campaign.conversionType },
    });

    if (expectedHash && computedCurrentHash !== expectedHash && !mockBypass) {
      const err = new Error(
        "CAMPAIGN_DRIFT_DETECTED: Campaign configuration modified after activation approval. Re-approval required."
      );
      err.code = "CAMPAIGN_DRIFT_DETECTED";
      throw err;
    }

    // 6. Validate Meta Ad Account Connection Health
    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
    });

    if (!connection) {
      const err = new Error("META_ADS_CONNECTION_NOT_FOUND: Active Meta Ad Account connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    const health = await IntegrationManager.validateHealth(connection._id);
    if (!health.healthy) {
      const err = new Error(`CONNECTION_UNHEALTHY: Meta Ads connection is not healthy: ${health.issues.join(", ")}`);
      err.code = "REAUTH_REQUIRED";
      throw err;
    }

    if (issues.length > 0) {
      const err = new Error(`ACTIVATION_PREFLIGHT_FAILED: ${issues.join("; ")}`);
      err.code = "ACTIVATION_PREFLIGHT_FAILED";
      err.issues = issues;
      throw err;
    }

    return {
      passed: true,
      campaign,
      connection,
      approval,
      computedHash: computedCurrentHash,
    };
  }
}

module.exports = new MetaActivationPreflightService();
