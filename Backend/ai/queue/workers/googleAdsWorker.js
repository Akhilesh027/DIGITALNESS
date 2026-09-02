/**
 * googleAdsWorker.js
 * Background worker for google-ads BullMQ queue
 * 
 * Supports:
 * 1. googleAds.createSearchCampaign (Step 11: Creation in PAUSED status)
 * 2. googleAds.activateCampaign (Step 11B: Preflight drift checks + sequential activation to ENABLED)
 */

const BaseWorker = require("./baseWorker");
const GoogleAdsConnector = require("../../integrations/connectors/GoogleAdsConnector");
const GoogleAdsActivationPreflightService = require("../../ads/GoogleAdsActivationPreflightService");
const AdCampaign = require("../../../models/AdCampaign");

const googleAdsWorker = new BaseWorker({
  queueName: "google-ads",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, operation, payload, approvalId } = envelope;
    console.log(`[GoogleAdsWorker] Executing operation '${operation}' for Customer: ${customerId}`);

    // =========================================================================
    // OPERATION 1: googleAds.createSearchCampaign (Step 11)
    // =========================================================================
    if (operation === "googleAds.createSearchCampaign") {
      let adCampaign = null;
      if (payload.adCampaignId) {
        adCampaign = await AdCampaign.findById(payload.adCampaignId);
      } else {
        adCampaign = await AdCampaign.findOne({ customerId, campaignName: payload.campaignName });
      }

      const partialState = {
        googleBudgetId: adCampaign?.googleBudgetId || null,
        googleCampaignId: adCampaign?.googleCampaignId || null,
        googleAdGroupId: adCampaign?.googleAdGroupId || null,
      };

      try {
        const result = await GoogleAdsConnector.createSearchCampaignHierarchy({
          customerId,
          locationId,
          campaignData: payload,
          partialState,
        });

        if (adCampaign) {
          adCampaign.googleCampaignId = result.campaignResourceName;
          adCampaign.googleBudgetId = result.campaignBudgetResourceName;
          adCampaign.googleAdGroupId = result.adGroupResourceName;
          adCampaign.googleAdGroupAdId = result.adGroupAdResourceName;
          adCampaign.externalStatus = "PAUSED";
          adCampaign.syncStatus = "CREATED_PAUSED";
          adCampaign.verifiedAt = new Date();
          adCampaign.apiVersion = result.apiVersion;
          await adCampaign.save();
        }

        return {
          success: true,
          mock: result.mock,
          operation: "googleAds.createSearchCampaign",
          googleCampaignId: result.campaignResourceName,
          status: "PAUSED",
          syncStatus: "CREATED_PAUSED",
          executedAt: new Date().toISOString(),
        };
      } catch (err) {
        if (adCampaign && err.googleCampaignId) {
          adCampaign.googleCampaignId = err.googleCampaignId;
          adCampaign.syncStatus = "PARTIAL_GOOGLE_ADS_CREATION";
          await adCampaign.save();
        }
        throw err;
      }
    }

    // =========================================================================
    // OPERATION 2: googleAds.activateCampaign (Step 11B)
    // =========================================================================
    if (operation === "googleAds.activateCampaign") {
      // 1. Run Preflight & Live Drift Checks
      const preflight = await GoogleAdsActivationPreflightService.runPreflight({
        customerId,
        locationId,
        approvalId,
        payload,
      });

      // 2. Execute Sequential Activation
      const result = await GoogleAdsConnector.activateCampaignHierarchy({
        customerId,
        locationId,
        snapshot: preflight.snapshot,
      });

      // 3. Update AdCampaign Record
      if (payload.adCampaignId) {
        await AdCampaign.findByIdAndUpdate(payload.adCampaignId, {
          $set: {
            externalStatus: "ENABLED",
            syncStatus: result.campaign?.primaryStatus === "ELIGIBLE" ? "ENABLED_ELIGIBLE" : "ENABLED_PENDING",
            servingStatus: result.campaign?.servingStatus || "SERVING",
            primaryStatus: result.campaign?.primaryStatus || "ELIGIBLE",
            primaryStatusReasons: result.campaign?.primaryStatusReasons || [],
            activatedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        mock: result.mock,
        operation: "googleAds.activateCampaign",
        campaignResourceName: result.campaignResourceName,
        status: "ENABLED",
        servingStatus: result.campaign?.servingStatus || "SERVING",
        primaryStatus: result.campaign?.primaryStatus || "ELIGIBLE",
        activatedAt: result.activatedAt,
      };
    }

    throw new Error(`Unsupported Google Ads operation: '${operation}'`);
  },
});

module.exports = googleAdsWorker;
