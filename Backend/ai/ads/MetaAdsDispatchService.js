/**
 * MetaAdsDispatchService.js
 * Meta Ads Campaign Creation & Activation Approval Orchestrator
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const AdCampaign = require("../../models/AdCampaign");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const ExecutionService = require("../execution/ExecutionService");
const metaBudgetNormalizer = require("../integrations/connectors/meta/MetaBudgetNormalizer");
const metaTargetingNormalizer = require("../integrations/connectors/meta/MetaTargetingNormalizer");
const metaActivationPreflight = require("./MetaActivationPreflightService");

class MetaAdsDispatchService {
  /**
   * Assembles a Campaign Blueprint into an execution-ready AdCampaign record and R3 Creation ApprovalRequest
   */
  async createCampaignExecutionRequest({
    customerId,
    locationId = null,
    campaignBlueprint,
    creativeAssetId = null,
    requestedBy = null,
  }) {
    if (!customerId || !campaignBlueprint) {
      throw new Error("customerId and campaignBlueprint are required.");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    // 1. Budget Policy & Safety Check
    const budgetAmount = campaignBlueprint.budget?.amount || 500;
    const currency = campaignBlueprint.budget?.currency || "INR";
    const budgetInfo = metaBudgetNormalizer.normalize({ amount: budgetAmount, currency });

    // 2. Objective Mapping
    const rawObjective = campaignBlueprint.objective || "LEAD_GENERATION";
    const metaObjective = metaTargetingNormalizer.mapObjective(rawObjective);

    const campaignName =
      campaignBlueprint.campaignName ||
      `${customer.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_META_LEADS_${Date.now()}`;

    // 3. Create/Update AdCampaign record
    let adCampaign = await AdCampaign.findOne({
      customerId: customer._id,
      campaignName,
    });

    if (!adCampaign) {
      adCampaign = await AdCampaign.create({
        campaignId: `camp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        customerId: customer._id,
        clientLocationId: locationId || null,
        campaignName,
        platform: "Meta",
        objective: metaObjective,
        budget: {
          amount: budgetInfo.displayBudget,
          currency: budgetInfo.currency,
        },
        targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
        status: "Pending Approval",
        syncStatus: "PENDING_EXECUTION",
        externalStatus: "PAUSED",
      });
    }

    // 4. Create R3 Creation ApprovalRequest
    const title = `Meta Ad Campaign Creation: ${campaignName} (${budgetInfo.formattedDisplay})`;

    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "META_ADS",
      riskLevel: "R3",
      actionType: "META_CAMPAIGN_CREATE",
      customer: customer._id,
      clientLocation: locationId || null,
      relatedResourceType: "AdCampaign",
      relatedResourceId: adCampaign._id,
      executionIntent: {
        action: "metaAds.createCampaign",
        connector: "MetaAdsConnector",
        adCampaignId: adCampaign._id,
        campaignName,
        objective: metaObjective,
        budget: budgetInfo,
        targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
        creativeAssetId,
        creative: campaignBlueprint.creative || {},
      },
      initialPayload: {
        adCampaignId: adCampaign._id,
        campaignName,
        objective: metaObjective,
        budget: budgetInfo,
        targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
        creativeAssetId,
        creative: campaignBlueprint.creative || {},
      },
      initialStatus: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    return {
      success: true,
      adCampaign,
      approvalId: approval.approvalId,
      budget: budgetInfo,
      objective: metaObjective,
    };
  }

  /**
   * Creates a dedicated R3 Activation ApprovalRequest for an existing PAUSED campaign
   */
  async createActivationApprovalRequest({ adCampaignId, customerId, locationId = null, requestedBy = null }) {
    const campaign = await AdCampaign.findById(adCampaignId);
    if (!campaign) throw new Error("AdCampaign not found.");

    if (!campaign.metaCampaignId) {
      throw new Error("Cannot request activation: Campaign has not been created on Meta yet.");
    }

    // Generate snapshot hash to lock the exact approved configuration
    const snapshotHash = metaActivationPreflight.generateSnapshotHash({
      metaCampaignId: campaign.metaCampaignId,
      metaAdSetIds: campaign.metaAdSetIds,
      metaAdIds: campaign.metaAdIds,
      budget: campaign.budget,
      objective: campaign.objective,
      targetLocations: campaign.targetLocations,
      creativeAssetId: campaign.creativeRequirementId,
      creative: { destinationUrl: campaign.conversionType },
    });

    const title = `[SPEND AUTHORIZATION] Activate Meta Campaign: ${campaign.campaignName}`;

    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "META_ADS",
      riskLevel: "R3",
      actionType: "META_CAMPAIGN_ACTIVATE",
      customer: customerId || campaign.customerId,
      clientLocation: locationId || campaign.clientLocationId || null,
      relatedResourceType: "AdCampaign",
      relatedResourceId: campaign._id,
      executionIntent: {
        action: "metaAds.activateCampaign",
        connector: "MetaAdsConnector",
        payload: {
          adCampaignId: campaign._id,
          metaCampaignId: campaign.metaCampaignId,
          metaAdSetIds: campaign.metaAdSetIds,
          metaAdIds: campaign.metaAdIds,
          approvedSnapshotHash: snapshotHash,
        },
      },
      initialPayload: {
        adCampaignId: campaign._id,
        metaCampaignId: campaign.metaCampaignId,
        approvedSnapshotHash: snapshotHash,
      },
      initialStatus: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    campaign.syncStatus = "ACTIVATION_PENDING_APPROVAL";
    await campaign.save();

    return {
      success: true,
      approvalId: approval.approvalId,
      snapshotHash,
      campaignName: campaign.campaignName,
    };
  }

  /**
   * Dispatches approved campaign creation or activation to BullMQ
   */
  async dispatchApprovedCampaign({ approvalId, actorId = null }) {
    const approval = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    });

    if (!approval) throw new Error("ApprovalRequest not found.");

    if (approval.status !== "APPROVED") {
      const err = new Error(`Cannot execute: ApprovalRequest status is '${approval.status}'. Must be 'APPROVED'.`);
      err.code = "APPROVAL_NOT_EXECUTABLE";
      throw err;
    }

    const isActivation = approval.actionType === "META_CAMPAIGN_ACTIVATE";
    const operation = isActivation ? "metaAds.activateCampaign" : "metaAds.createCampaign";
    const payload = approval.executionIntent?.payload || approval.currentSnapshot?.blueprintPayload || {};

    return ExecutionService.scheduleExecution({
      approvalId: approval._id,
      queueName: "meta-ads",
      operation,
      payload,
    });
  }
}

module.exports = new MetaAdsDispatchService();
