/**
 * MetaAdsConnector.js
 * Meta Marketing API Campaign, Ad Set, Ad Creative, and Ad Execution Connector
 * 
 * Strict Production Safety Rules:
 * 1. All objects (Campaign, Ad Set, Ad) are created strictly in "PAUSED" state.
 * 2. Multi-step transaction tracking prevents duplicate object creation on retry.
 * 3. Token decryption is handled in-memory strictly via IntegrationManager + CredentialVault.
 */

const metaConfig = require("../../../config/meta");
const IntegrationManager = require("../IntegrationManager");
const metaBudgetNormalizer = require("./meta/MetaBudgetNormalizer");
const metaTargetingNormalizer = require("./meta/MetaTargetingNormalizer");

class MetaAdsConnector {
  /**
   * Executes the full Campaign -> Ad Set -> Creative -> Ad creation pipeline in PAUSED status.
   */
  async createFullCampaign({
    customerId,
    locationId = null,
    campaignData,
    partialState = {},
  }) {
    return IntegrationManager.executeWithConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      operation: "metaAds.createCampaign",
      executor: async (credentials, connection) => {
        const { accessToken, platformAccountId: rawAdAccountId } = credentials;
        const adAccountId = rawAdAccountId.startsWith("act_") ? rawAdAccountId : `act_${rawAdAccountId}`;
        const apiVersion = metaConfig.marketingApiVersion || "v26.0";

        // Mock test token handling for CI
        if (accessToken.startsWith("eaab_mock_token_") || accessToken.startsWith("eaab_test_token_")) {
          const mockCampId = partialState.metaCampaignId || `mock_meta_camp_${Date.now()}`;
          const mockSetId = partialState.metaAdSetId || `mock_meta_set_${Date.now()}`;
          const mockCrtId = partialState.metaCreativeId || `mock_meta_crt_${Date.now()}`;
          const mockAdId = `mock_meta_ad_${Date.now()}`;

          return {
            success: true,
            mock: true,
            apiVersion,
            metaCampaignId: mockCampId,
            metaAdSetId: mockSetId,
            metaCreativeId: mockCrtId,
            metaAdId: mockAdId,
            status: "PAUSED",
            adAccountId,
            createdAt: new Date().toISOString(),
          };
        }

        // 1. Validate Ad Account Status
        await this.validateAdAccount({ adAccountId, accessToken, apiVersion });

        // 2. Create or Resume Campaign (PAUSED)
        let metaCampaignId = partialState.metaCampaignId;
        if (!metaCampaignId) {
          metaCampaignId = await this._createCampaignObject({
            adAccountId,
            accessToken,
            apiVersion,
            campaignData,
          });
        }

        // 3. Create or Resume Ad Set (PAUSED)
        let metaAdSetId = partialState.metaAdSetId;
        if (!metaAdSetId) {
          metaAdSetId = await this._createAdSetObject({
            adAccountId,
            accessToken,
            apiVersion,
            metaCampaignId,
            campaignData,
          });
        }

        // 4. Create or Resume Ad Creative
        let metaCreativeId = partialState.metaCreativeId;
        if (!metaCreativeId) {
          metaCreativeId = await this._createAdCreativeObject({
            adAccountId,
            accessToken,
            apiVersion,
            campaignData,
          });
        }

        // 5. Create Ad (PAUSED)
        const metaAdId = await this._createAdObject({
          adAccountId,
          accessToken,
          apiVersion,
          metaAdSetId,
          metaCreativeId,
          campaignData,
        });

        return {
          success: true,
          mock: false,
          apiVersion,
          metaCampaignId,
          metaAdSetId,
          metaCreativeId,
          metaAdId,
          status: "PAUSED",
          adAccountId,
          createdAt: new Date().toISOString(),
        };
      },
    });
  }

  /**
   * Validates that the Meta Ad Account is active and billing-ready
   */
  async validateAdAccount({ adAccountId, accessToken, apiVersion }) {
    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}?fields=id,name,account_status,currency,disable_reason&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = new Error(data.error?.message || "Failed to inspect Meta Ad Account.");
      err.code = "META_ACCOUNT_INVALID";
      throw err;
    }

    if (data.account_status === 2) {
      const err = new Error("META_ACCOUNT_DISABLED: Ad account is disabled by Meta.");
      err.code = "ACCOUNT_DISABLED";
      throw err;
    }

    return data;
  }

  async _createCampaignObject({ adAccountId, accessToken, apiVersion, campaignData }) {
    const objective = metaTargetingNormalizer.mapObjective(campaignData.objective);
    const specialCategories = metaTargetingNormalizer.resolveSpecialAdCategories(campaignData.specialAdCategory);

    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}/campaigns`;
    const params = new URLSearchParams({
      name: campaignData.campaignName,
      objective,
      status: "PAUSED", // STRICT SAFETY DEFAULT
      buying_type: "AUCTION",
      special_ad_categories: JSON.stringify(specialCategories),
      access_token: accessToken,
    });

    const res = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = new Error(data.error?.message || "Failed to create Meta Campaign.");
      err.code = "META_CAMPAIGN_CREATE_FAILED";
      err.metaError = data.error;
      throw err;
    }

    return data.id;
  }

  async _createAdSetObject({ adAccountId, accessToken, apiVersion, metaCampaignId, campaignData }) {
    const budgetInfo = metaBudgetNormalizer.normalize({
      amount: campaignData.budget?.amount || 500,
      currency: campaignData.budget?.currency || "INR",
    });

    const targeting = metaTargetingNormalizer.normalizeTargeting({
      locations: campaignData.targetLocations || ["Hyderabad"],
      ageRange: campaignData.ageRange || { min: 21, max: 55 },
      genders: campaignData.genders || ["All"],
    });

    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}/adsets`;
    const params = new URLSearchParams({
      campaign_id: metaCampaignId,
      name: `${campaignData.campaignName} - AdSet 1`,
      daily_budget: budgetInfo.apiBudgetValue.toString(),
      billing_event: "IMPRESSIONS",
      optimization_goal: campaignData.objective?.includes("LEAD") ? "LEAD_GENERATION" : "LINK_CLICKS",
      targeting: JSON.stringify(targeting),
      status: "PAUSED", // STRICT SAFETY DEFAULT
      access_token: accessToken,
    });

    const res = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = new Error(data.error?.message || "Failed to create Meta Ad Set.");
      err.code = "META_ADSET_CREATE_FAILED";
      err.metaError = data.error;
      throw err;
    }

    return data.id;
  }

  async _createAdCreativeObject({ adAccountId, accessToken, apiVersion, campaignData }) {
    const creative = campaignData.creative || {};
    const pageId = campaignData.facebookPageId || "page_default_id";
    const mediaUrl = creative.mediaUrl || "https://res.cloudinary.com/test/image/upload/sample.jpg";

    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        message: creative.primaryText || "Transform your business today with our expert services.",
        name: creative.headline || "Special Promotional Offer",
        description: creative.description || "Limited time offer. Connect with our team now.",
        picture: mediaUrl,
        link: creative.destinationUrl || "https://apexbee.in",
        call_to_action: {
          type: creative.callToAction || "LEARN_MORE",
          value: { link: creative.destinationUrl || "https://apexbee.in" },
        },
      },
    };

    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}/adcreatives`;
    const params = new URLSearchParams({
      name: `${campaignData.campaignName} - Creative 1`,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: accessToken,
    });

    const res = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = new Error(data.error?.message || "Failed to create Meta Ad Creative.");
      err.code = "META_CREATIVE_CREATE_FAILED";
      err.metaError = data.error;
      throw err;
    }

    return data.id;
  }

  async _createAdObject({ adAccountId, accessToken, apiVersion, metaAdSetId, metaCreativeId, campaignData }) {
    const url = `https://graph.facebook.com/${apiVersion}/${adAccountId}/ads`;
    const params = new URLSearchParams({
      adset_id: metaAdSetId,
      creative: JSON.stringify({ creative_id: metaCreativeId }),
      name: `${campaignData.campaignName} - Ad 1`,
      status: "PAUSED", // STRICT SAFETY DEFAULT
      access_token: accessToken,
    });

    const res = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = new Error(data.error?.message || "Failed to create Meta Ad.");
      err.code = "META_AD_CREATE_FAILED";
      err.metaError = data.error;
      throw err;
    }

    return data.id;
  }

  /**
   * Activates the Campaign -> Ad Set -> Ad hierarchy in strict sequential order.
   * Runs final spend guard before activating the Ad and captures configured vs effective status.
   */
  async activateCampaignHierarchy({
    customerId,
    locationId = null,
    metaCampaignId,
    metaAdSetIds = [],
    metaAdIds = [],
    finalSpendGuardCallback = null,
  }) {
    return IntegrationManager.executeWithConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      operation: "metaAds.activateCampaign",
      executor: async (credentials, connection) => {
        const { accessToken } = credentials;
        const apiVersion = metaConfig.marketingApiVersion || "v26.0";

        // Mock test token handling for CI
        if (accessToken.startsWith("eaab_mock_token_") || accessToken.startsWith("eaab_test_token_")) {
          if (typeof finalSpendGuardCallback === "function") {
            await finalSpendGuardCallback();
          }

          return {
            success: true,
            mock: true,
            apiVersion,
            metaCampaignId,
            campaign: { id: metaCampaignId, configuredStatus: "ACTIVE", effectiveStatus: "PENDING_REVIEW" },
            adSets: metaAdSetIds.map((id) => ({ id, configuredStatus: "ACTIVE", effectiveStatus: "PENDING_REVIEW" })),
            ads: metaAdIds.map((id) => ({ id, configuredStatus: "ACTIVE", effectiveStatus: "PENDING_REVIEW" })),
            configuredStatus: "ACTIVE",
            effectiveStatus: "PENDING_REVIEW",
            activatedAt: new Date().toISOString(),
          };
        }

        // 1. Activate Campaign
        const campUrl = `https://graph.facebook.com/${apiVersion}/${metaCampaignId}`;
        const campRes = await fetch(`${campUrl}?status=ACTIVE&access_token=${accessToken}`, { method: "POST" });
        const campData = await campRes.json();
        if (!campRes.ok || campData.error) {
          const err = new Error(campData.error?.message || "Failed to activate Meta Campaign.");
          err.code = "CAMPAIGN_ACTIVATION_FAILED";
          throw err;
        }

        // 2. Activate Ad Sets
        const activatedAdSets = [];
        try {
          for (const setId of metaAdSetIds) {
            const setUrl = `https://graph.facebook.com/${apiVersion}/${setId}`;
            const setRes = await fetch(`${setUrl}?status=ACTIVE&access_token=${accessToken}`, { method: "POST" });
            const setData = await setRes.json();
            if (!setRes.ok || setData.error) {
              throw new Error(setData.error?.message || `Failed to activate Ad Set ${setId}`);
            }
            activatedAdSets.push({ id: setId, configuredStatus: "ACTIVE", effectiveStatus: "PENDING_REVIEW" });
          }
        } catch (setErr) {
          // Failure before Ad active: Immediately re-pause Campaign via compensation
          console.warn("[MetaAdsConnector] AdSet activation failed, executing compensation pause on Campaign:", setErr.message);
          await fetch(`${campUrl}?status=PAUSED&access_token=${accessToken}`, { method: "POST" });
          const err = new Error(`ACTIVATION_FAILED_COMPENSATED: ${setErr.message}`);
          err.code = "ACTIVATION_FAILED_COMPENSATED";
          throw err;
        }

        // 3. Final Spend Guard Check
        if (typeof finalSpendGuardCallback === "function") {
          try {
            await finalSpendGuardCallback();
          } catch (guardErr) {
            console.warn("[MetaAdsConnector] Final Spend Guard failed! Rolling back to PAUSED:", guardErr.message);
            await fetch(`${campUrl}?status=PAUSED&access_token=${accessToken}`, { method: "POST" });
            for (const s of activatedAdSets) {
              await fetch(`https://graph.facebook.com/${apiVersion}/${s.id}?status=PAUSED&access_token=${accessToken}`, { method: "POST" });
            }
            throw guardErr;
          }
        }

        // 4. Activate Ads (Delivery and spend can begin here)
        const activatedAds = [];
        for (const adId of metaAdIds) {
          const adUrl = `https://graph.facebook.com/${apiVersion}/${adId}`;
          const adRes = await fetch(`${adUrl}?status=ACTIVE&access_token=${accessToken}`, { method: "POST" });
          const adData = await adRes.json();
          if (!adRes.ok || adData.error) {
            // Emergency pause on failure after partial ad activation
            await fetch(`${campUrl}?status=PAUSED&access_token=${accessToken}`, { method: "POST" });
            const err = new Error(`ACTIVATION_FAILED_COMPENSATED: Failed to activate Ad ${adId}: ${adData.error?.message}`);
            err.code = "ACTIVATION_FAILED_COMPENSATED";
            throw err;
          }

          // Fetch verified configured and effective status
          const adInspect = await fetch(`${adUrl}?fields=id,status,effective_status&access_token=${accessToken}`).then((r) => r.json());
          activatedAds.push({
            id: adId,
            configuredStatus: adInspect.status || "ACTIVE",
            effectiveStatus: adInspect.effective_status || "PENDING_REVIEW",
          });
        }

        const effectiveStatus = activatedAds[0]?.effectiveStatus || "PENDING_REVIEW";

        return {
          success: true,
          mock: false,
          apiVersion,
          metaCampaignId,
          campaign: { id: metaCampaignId, configuredStatus: "ACTIVE", effectiveStatus },
          adSets: activatedAdSets,
          ads: activatedAds,
          configuredStatus: "ACTIVE",
          effectiveStatus,
          activatedAt: new Date().toISOString(),
        };
      },
    });
  }

  /**
   * Fast, unblocked Emergency Spend Pause. Re-pauses campaign immediately.
   */
  async emergencyPauseCampaign({ customerId, locationId = null, metaCampaignId, reason = "Emergency Spend Guard" }) {
    console.warn(`[MetaAdsConnector] 🚨 EMERGENCY SPEND PAUSE TRIGGERED for Campaign: ${metaCampaignId} (Reason: ${reason})`);

    return IntegrationManager.executeWithConnection({
      customerId,
      locationId,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      operation: "metaAds.emergencyPause",
      executor: async (credentials, connection) => {
        const { accessToken } = credentials;
        const apiVersion = metaConfig.marketingApiVersion || "v26.0";

        if (accessToken.startsWith("eaab_mock_token_") || accessToken.startsWith("eaab_test_token_")) {
          return {
            success: true,
            mock: true,
            metaCampaignId,
            configuredStatus: "PAUSED",
            effectiveStatus: "CAMPAIGN_PAUSED",
            pausedAt: new Date().toISOString(),
            reason,
          };
        }

        const campUrl = `https://graph.facebook.com/${apiVersion}/${metaCampaignId}`;
        const res = await fetch(`${campUrl}?status=PAUSED&access_token=${accessToken}`, { method: "POST" });
        const data = await res.json();

        if (!res.ok || data.error) {
          const err = new Error(data.error?.message || "Emergency pause call to Meta failed.");
          err.code = "EMERGENCY_PAUSE_FAILED";
          throw err;
        }

        return {
          success: true,
          mock: false,
          metaCampaignId,
          configuredStatus: "PAUSED",
          effectiveStatus: "CAMPAIGN_PAUSED",
          pausedAt: new Date().toISOString(),
          reason,
        };
      },
    });
  }
}

module.exports = new MetaAdsConnector();
