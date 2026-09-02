/**
 * GoogleAdsDispatchService.js
 * Google Ads Search Campaign Assembly, Budget Validation, and R3 Approval Dispatcher
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const AdCampaign = require("../../models/AdCampaign");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const ExecutionService = require("../execution/ExecutionService");
const googleAdsBudgetNormalizer = require("../integrations/connectors/googleAds/GoogleAdsBudgetNormalizer");
const googleAdsCreativeQAGuardian = require("../integrations/connectors/googleAds/GoogleAdsCreativeQAGuardian");

class GoogleAdsDispatchService {
  /**
   * Assembles a Search Campaign Blueprint into an execution-ready AdCampaign record and R3 ApprovalRequest
   */
  async createSearchCampaignExecutionRequest({
    customerId,
    locationId = null,
    campaignBlueprint,
    requestedBy = null,
  }) {
    if (!customerId || !campaignBlueprint) {
      throw new Error("customerId and campaignBlueprint are required.");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    // 1. Budget Policy & Safety Check (Micros Conversion)
    const budgetAmount = campaignBlueprint.budget?.amount || 500;
    const currency = campaignBlueprint.budget?.currency || "INR";
    const budgetInfo = googleAdsBudgetNormalizer.normalize({ amount: budgetAmount, currency });

    // 2. Creative QA Validation (Headlines, Descriptions, Final URLs)
    const rsa = campaignBlueprint.responsiveSearchAd || {};
    googleAdsCreativeQAGuardian.validateResponsiveSearchAd({
      headlines: rsa.headlines || [
        "Luxury Curtains Hyderabad",
        "Custom Drapery Studio",
        "Book Free Consultation",
      ],
      descriptions: rsa.descriptions || [
        "Transform your living space with bespoke custom curtains.",
        "Visit our Hyderabad showroom or book a free measurement today.",
      ],
      finalUrls: rsa.finalUrls || [campaignBlueprint.destinationUrl || "https://siyaarthomes.com"],
    });

    const campaignName =
      campaignBlueprint.campaignName ||
      `${customer.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_GOOGLE_SEARCH_${Date.now()}`;

    // 3. Create AdCampaign record
    const adCampaign = await AdCampaign.create({
      campaignId: `camp_gads_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      customerId: customer._id,
      clientLocationId: locationId || null,
      campaignName,
      platform: "Google",
      objective: "SEARCH",
      budget: {
        amount: budgetInfo.displayAmount,
        currency: budgetInfo.currency,
      },
      targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
      status: "Pending Approval",
      syncStatus: "PENDING_EXECUTION",
      externalStatus: "PAUSED",
    });

    // 4. Create R3 ApprovalRequest
    const title = `Google Search Campaign: ${campaignName} (${budgetInfo.formattedDisplay})`;

    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "GOOGLE_ADS",
      riskLevel: "R3",
      actionType: "GOOGLE_ADS_CREATE_SEARCH_CAMPAIGN",
      customer: customer._id,
      clientLocation: locationId || null,
      relatedResourceType: "AdCampaign",
      relatedResourceId: adCampaign._id,
      executionIntent: {
        action: "googleAds.createSearchCampaign",
        connector: "GoogleAdsConnector",
        adCampaignId: adCampaign._id,
        campaignName,
        budget: budgetInfo,
        targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
        keywords: campaignBlueprint.keywords || [{ text: "custom curtains hyderabad", matchType: "PHRASE" }],
        responsiveSearchAd: rsa,
        destinationUrl: campaignBlueprint.destinationUrl || "https://siyaarthomes.com",
      },
      initialPayload: {
        adCampaignId: adCampaign._id,
        campaignName,
        budget: budgetInfo,
        targetLocations: campaignBlueprint.targetLocations || ["Hyderabad"],
        keywords: campaignBlueprint.keywords || [{ text: "custom curtains hyderabad", matchType: "PHRASE" }],
        responsiveSearchAd: rsa,
      },
      initialStatus: "WAITING_APPROVAL",
      submittedBy: requestedBy,
    });

    return {
      success: true,
      adCampaign,
      approvalId: approval.approvalId,
      budget: budgetInfo,
    };
  }

  /**
   * Dispatches approved Google Ads campaign to BullMQ google-ads queue
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

    const payload = approval.executionIntent || approval.currentSnapshot?.blueprintPayload || {};

    return ExecutionService.scheduleExecution({
      approvalId: approval._id,
      queueName: "google-ads",
      operation: "googleAds.createSearchCampaign",
      payload,
    });
  }
}

module.exports = new GoogleAdsDispatchService();
