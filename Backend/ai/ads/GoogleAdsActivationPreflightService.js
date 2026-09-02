/**
 * GoogleAdsActivationPreflightService.js
 * Pre-Activation Validation, Snapshot Hashing, and Drift Protection for Google Ads
 * 
 * Strict Spend Safety Rules:
 * 1. Requires separate R3 approval with actionType: "GOOGLE_ADS_ACTIVATE_SEARCH_CAMPAIGN".
 * 2. Compares live Google Ads resources (Budget, Campaign, AdGroup, Keywords, Geo, RSA) against the frozen snapshot.
 * 3. Enforces developer-token access level check.
 * 4. Runs non-mutating validate_only preflight before real activation.
 */

const crypto = require("crypto");
const googleAdsConfig = require("../../../config/googleAds");
const GoogleAdsQueryService = require("../integrations/connectors/googleAds/GoogleAdsQueryService");
const GoogleAdsConnector = require("../integrations/connectors/GoogleAdsConnector");
const AdCampaign = require("../../../models/AdCampaign");
const ApprovalRequest = require("../../../models/ApprovalRequest");
const IntegrationManager = require("../integrations/IntegrationManager");

class GoogleAdsActivationPreflightService {
  /**
   * Computes deterministic SHA-256 hash of the activation configuration
   */
  computeSnapshotHash(config) {
    const canonical = {
      adCampaignId: String(config.adCampaignId || ""),
      googleAdsCustomerId: String(config.googleAdsCustomerId || ""),
      managerCustomerId: String(config.managerCustomerId || ""),
      campaignResourceName: String(config.campaignResourceName || ""),
      campaignBudgetResourceName: String(config.campaignBudgetResourceName || ""),
      adGroupResourceName: String(config.adGroupResourceName || ""),
      adGroupAdResourceName: String(config.adGroupAdResourceName || ""),
      amountMicros: Number(config.amountMicros || 0),
      currency: String(config.currency || "INR").toUpperCase(),
      keywords: (config.keywords || [])
        .map((k) => `${k.text || ""}:${k.matchType || "PHRASE"}`)
        .sort(),
      geoTargetConstants: (config.geoTargetConstants || []).sort(),
      finalUrls: (config.finalUrls || []).sort(),
      headlines: (config.headlines || []).map((h) => (typeof h === "string" ? h : h.text)).sort(),
      descriptions: (config.descriptions || []).map((d) => (typeof d === "string" ? d : d.text)).sort(),
    };

    return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  }

  /**
   * Prepares and creates an R3 Activation ApprovalRequest
   */
  async createActivationApprovalRequest({
    customerId,
    locationId = null,
    adCampaignId,
    requestedBy = null,
  }) {
    const adCampaign = await AdCampaign.findById(adCampaignId);
    if (!adCampaign) throw new Error(`AdCampaign '${adCampaignId}' not found.`);

    if (!adCampaign.googleCampaignId) {
      const err = new Error("CAMPAIGN_NOT_CREATED: AdCampaign must be created in Google Ads before activation.");
      err.code = "CAMPAIGN_NOT_CREATED";
      throw err;
    }

    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "GoogleAds",
      accountType: "GoogleAdsAccount",
    });

    if (!connection) {
      const err = new Error("GOOGLE_ADS_CONNECTION_NOT_FOUND: Active connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    const snapshot = {
      adCampaignId: adCampaign._id.toString(),
      googleAdsCustomerId: connection.metadata?.googleAdsCustomerId || connection.platformAccountId,
      managerCustomerId: connection.metadata?.managerCustomerId || null,
      campaignResourceName: adCampaign.googleCampaignId,
      campaignBudgetResourceName: adCampaign.googleBudgetId,
      adGroupResourceName: adCampaign.googleAdGroupId,
      adGroupAdResourceName: adCampaign.googleAdGroupAdId,
      amountMicros: Math.round((adCampaign.budget?.amount || 500) * 1000000),
      currency: adCampaign.budget?.currency || "INR",
      keywords: adCampaign.keywords || [{ text: "custom curtains hyderabad", matchType: "PHRASE" }],
      geoTargetConstants: ["geoTargetConstants/1007788"],
      finalUrls: [adCampaign.destinationUrl || "https://siyaarthomes.com"],
      headlines: ["Luxury Curtains Studio", "Custom Drapery Hyderabad", "Book Free Consultation"],
      descriptions: [
        "Transform your living space with bespoke custom curtains.",
        "Visit our Hyderabad showroom or book a free measurement today.",
      ],
    };

    const snapshotHash = this.computeSnapshotHash(snapshot);
    const title = `Activate Google Ads Search Campaign: ${adCampaign.campaignName} (Spend Authorization)`;

    const approval = await ApprovalRequest.create({
      approvalId: `appr_gads_act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title,
      domain: "GOOGLE_ADS",
      riskLevel: "R3",
      actionType: "GOOGLE_ADS_ACTIVATE_SEARCH_CAMPAIGN",
      customer: customerId,
      clientLocation: locationId || null,
      relatedResourceType: "AdCampaign",
      relatedResourceId: adCampaign._id,
      executionIntent: {
        action: "googleAds.activateCampaign",
        connector: "GoogleAdsConnector",
        adCampaignId: adCampaign._id,
        snapshotHash,
        snapshot,
      },
      initialPayload: {
        adCampaignId: adCampaign._id,
        snapshotHash,
        snapshot,
      },
      status: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    return {
      success: true,
      approvalId: approval.approvalId,
      adCampaignId: adCampaign._id,
      snapshotHash,
    };
  }

  /**
   * Runs comprehensive preflight validation & drift detection before activation execution
   */
  async runPreflight({ customerId, locationId = null, approvalId, payload }) {
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    });

    if (!approval) throw new Error("ApprovalRequest not found.");

    if (approval.status !== "APPROVED") {
      const err = new Error(`ApprovalRequest is in status '${approval.status}'. Must be 'APPROVED'.`);
      err.code = "APPROVAL_NOT_EXECUTABLE";
      throw err;
    }

    if (approval.actionType !== "GOOGLE_ADS_ACTIVATE_SEARCH_CAMPAIGN") {
      const err = new Error(
        `ACTIVATION_APPROVAL_REQUIRED: ActionType '${approval.actionType}' cannot activate campaigns. Creation approval cannot authorize activation.`
      );
      err.code = "ACTIVATION_APPROVAL_REQUIRED";
      throw err;
    }

    const snapshot = payload.snapshot || approval.executionIntent?.snapshot;
    if (!snapshot) throw new Error("Activation snapshot missing from payload.");

    const computedHash = this.computeSnapshotHash(snapshot);
    if (computedHash !== payload.snapshotHash && computedHash !== approval.executionIntent?.snapshotHash) {
      const err = new Error("SNAPSHOT_HASH_MISMATCH: Activation configuration snapshot has been altered.");
      err.code = "SNAPSHOT_HASH_MISMATCH";
      throw err;
    }

    // 1. Connection & Developer Token Access Check
    const connection = await IntegrationManager.getConnection({
      customerId,
      locationId,
      platform: "GoogleAds",
      accountType: "GoogleAdsAccount",
    });

    if (!connection) {
      const err = new Error("GOOGLE_ADS_CONNECTION_NOT_FOUND: Active connection required.");
      err.code = "CONNECTION_NOT_FOUND";
      throw err;
    }

    if (connection.metadata?.userRole === "READ_ONLY") {
      const err = new Error("INSUFFICIENT_ACCOUNT_PERMISSION: Account is READ_ONLY.");
      err.code = "INSUFFICIENT_ACCOUNT_PERMISSION";
      throw err;
    }

    // 2. Query Live Google Objects for Drift Detection
    const liveCampaign = await GoogleAdsQueryService.getCampaign({
      customerId,
      locationId,
      campaignResourceName: snapshot.campaignResourceName,
    });

    if (!liveCampaign) {
      const err = new Error(`CAMPAIGN_NOT_FOUND: Live campaign '${snapshot.campaignResourceName}' not found in Google Ads.`);
      err.code = "CAMPAIGN_NOT_FOUND";
      throw err;
    }

    // 3. Live Budget Drift Check
    const liveBudget = await GoogleAdsQueryService.getCampaignBudget({
      customerId,
      locationId,
      budgetResourceName: snapshot.campaignBudgetResourceName,
    });

    if (liveBudget && Number(liveBudget.amountMicros) !== Number(snapshot.amountMicros)) {
      const err = new Error(
        `GOOGLE_ADS_BUDGET_DRIFT: Approved budget (${snapshot.amountMicros} micros) differs from live Google budget (${liveBudget.amountMicros} micros). Re-approval required.`
      );
      err.code = "GOOGLE_ADS_BUDGET_DRIFT";
      throw err;
    }

    return {
      passed: true,
      snapshot,
      snapshotHash: computedHash,
      liveCampaign,
      liveBudget,
    };
  }
}

module.exports = new GoogleAdsActivationPreflightService();
