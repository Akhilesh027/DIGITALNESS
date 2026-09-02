/**
 * adsWorker.js
 * Background worker for meta-ads BullMQ queue
 * 
 * Supports:
 * 1. metaAds.createCampaign (Step 8: Creation strictly in PAUSED state)
 * 2. metaAds.activateCampaign (Step 8B: Controlled activation with preflight, drift detection, and final spend guard)
 */

const BaseWorker = require("./baseWorker");
const MetaAdsConnector = require("../../integrations/connectors/MetaAdsConnector");
const MetaActivationPreflightService = require("../../ads/MetaActivationPreflightService");
const AdCampaign = require("../../../models/AdCampaign");
const ApprovalRequest = require("../../../models/ApprovalRequest");

const adsWorker = new BaseWorker({
  queueName: "meta-ads",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, operation, payload, approvalId } = envelope;
    console.log(`[AdsWorker] Claimed job '${operation}' for Customer: ${customerId}`);

    // =========================================================================
    // OPERATION 1: metaAds.createCampaign (Step 8: PAUSED creation)
    // =========================================================================
    if (operation === "metaAds.createCampaign") {
      let adCampaign = null;
      if (payload.adCampaignId) {
        adCampaign = await AdCampaign.findById(payload.adCampaignId);
      } else {
        adCampaign = await AdCampaign.findOne({ customerId, campaignName: payload.campaignName });
      }

      const partialState = {
        metaCampaignId: adCampaign?.metaCampaignId || null,
        metaAdSetId: adCampaign?.metaAdSetIds?.[0] || null,
        metaCreativeId: adCampaign?.metaCreativeIds?.[0] || null,
      };

      try {
        const result = await MetaAdsConnector.createFullCampaign({
          customerId,
          locationId,
          campaignData: payload,
          partialState,
        });

        if (adCampaign) {
          adCampaign.metaCampaignId = result.metaCampaignId;
          adCampaign.metaAdSetIds = [result.metaAdSetId];
          adCampaign.metaCreativeIds = [result.metaCreativeId];
          adCampaign.metaAdIds = [result.metaAdId];
          adCampaign.externalStatus = "PAUSED"; // STRICT SAFETY
          adCampaign.syncStatus = "CREATED_PAUSED";
          adCampaign.verifiedAt = new Date();
          adCampaign.apiVersion = result.apiVersion;
          await adCampaign.save();
        }

        return {
          success: true,
          mock: result.mock,
          metaCampaignId: result.metaCampaignId,
          metaAdSetId: result.metaAdSetId,
          metaCreativeId: result.metaCreativeId,
          metaAdId: result.metaAdId,
          status: "PAUSED",
          syncStatus: "CREATED_PAUSED",
          executedAt: new Date().toISOString(),
        };
      } catch (err) {
        if (adCampaign && err.metaCampaignId) {
          adCampaign.metaCampaignId = err.metaCampaignId;
          adCampaign.syncStatus = "PARTIAL_META_CREATION";
          await adCampaign.save();
        }
        throw err;
      }
    }

    // =========================================================================
    // OPERATION 2: metaAds.activateCampaign (Step 8B: Activation Workflow)
    // =========================================================================
    if (operation === "metaAds.activateCampaign") {
      const adCampaignId = payload.adCampaignId;
      const activationApprovalId = approvalId;

      // 1. Run Strict Preflight Validation & Drift Detection
      const preflight = await MetaActivationPreflightService.runPreflight({
        adCampaignId,
        activationApprovalId,
        customerId,
        locationId,
        currentSnapshotHash: payload.approvedSnapshotHash,
        mockBypass: payload.mockBypass || false,
      });

      const campaign = preflight.campaign;

      // 2. Define Final Spend Guard Callback (runs immediately before activating Ad)
      const finalSpendGuard = async () => {
        const currentApproval = await ApprovalRequest.findById(activationApprovalId);
        if (!currentApproval || currentApproval.status !== "APPROVED") {
          const err = new Error("FINAL_SPEND_GUARD_FAILED: Activation approval was cancelled or revoked.");
          err.code = "FINAL_SPEND_GUARD_FAILED";
          throw err;
        }
      };

      // 3. Execute Sequential Activation
      const result = await MetaAdsConnector.activateCampaignHierarchy({
        customerId,
        locationId,
        metaCampaignId: campaign.metaCampaignId,
        metaAdSetIds: campaign.metaAdSetIds,
        metaAdIds: campaign.metaAdIds,
        finalSpendGuardCallback: finalSpendGuard,
      });

      // 4. Update AdCampaign with Verified Statuses
      campaign.externalStatus = result.configuredStatus; // "ACTIVE"
      campaign.syncStatus = result.effectiveStatus === "ACTIVE" ? "ACTIVE" : "ACTIVE_PENDING_REVIEW";
      campaign.status = "Active";
      await campaign.save();

      return {
        success: true,
        mock: result.mock,
        operation: "metaAds.activateCampaign",
        metaCampaignId: campaign.metaCampaignId,
        configuredStatus: result.configuredStatus,
        effectiveStatus: result.effectiveStatus,
        syncStatus: campaign.syncStatus,
        activatedAt: new Date().toISOString(),
      };
    }

    throw new Error(`Unsupported Meta Ads operation: '${operation}'`);
  },
});

module.exports = adsWorker;
