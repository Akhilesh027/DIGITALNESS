/**
 * leadWebhookController.js
 * Universal Webhook Inbound Controller for Leads.
 * Supports:
 *  1. Meta Lead Generation Ads (Facebook & Instagram Instant Forms) via Graph API resolution.
 *  2. Google Ads Lead Form Webhooks (user_column_data).
 *  3. Standard Website / Landing Page / Zapier / Custom CRM Form payloads.
 */

const leadAutoAssignService = require("../services/leadAutoAssignService");
const adLeadAttributionService = require("../services/adLeadAttributionService");
const metaLeadService = require("../services/metaLeadService");

/**
 * Normalizes Google Ads Lead Form webhook payloads
 */
function normalizeGoogleAdsPayload(body) {
  const columnData = body.user_column_data || [];
  const fieldMap = {};

  for (const col of columnData) {
    const id = (col.column_id || "").toUpperCase();
    const val = col.string_value || "";
    fieldMap[id] = val;
  }

  return {
    name: fieldMap["FULL_NAME"] || `${fieldMap["FIRST_NAME"] || ""} ${fieldMap["LAST_NAME"] || ""}`.trim() || "Google Ads Lead",
    phone: fieldMap["PHONE_NUMBER"] || fieldMap["CONTACT_NUMBER"] || "",
    email: fieldMap["EMAIL"] || "",
    businessType: fieldMap["COMPANY_NAME"] || "Google Ad Prospect",
    requirement: fieldMap["WORK_EMAIL"] || "Google Ads Lead Form Submission",
    budget: 0,
    source: "Google Ads",
    platform: "Google Ads",
    adCampaignId: body.campaign_id || body.adCampaignId,
    notes: `[Google Ads Lead Form] Form ID: ${body.lead_form_id || "N/A"}, Lead ID: ${body.lead_id || "N/A"}`,
  };
}

/**
 * Normalizes standard JSON / Website form payloads
 */
function normalizeStandardPayload(body) {
  return {
    name: body.name || body.fullName || body.contactName || body.clientName,
    phone: body.phone || body.contactNumber || body.mobile || body.phoneNumber,
    email: body.email || "",
    businessType: body.businessType || body.company || body.industry || "General Business",
    requirement: body.requirement || body.service || body.message || body.notes || "General Inbound",
    budget: body.budget || body.estimatedBudget || 0,
    timeline: body.timeline || body.urgency || "Normal",
    source: body.source || body.leadSource || "Website Form Webhook",
    notes: body.notes || body.message || "",
    branchId: body.branchId || "BR001",
    adCampaignId: body.adCampaignId || body.campaignId,
    utm_source: body.utm_source || body.source,
    utm_campaign: body.utm_campaign || body.campaignName,
  };
}

exports.handleInboundWebhook = async (req, res) => {
  try {
    let payload = null;

    // 1. Meta Lead Ads Webhook (Facebook / Instagram)
    if (metaLeadService.isMetaLeadPayload(req.body)) {
      const change = req.body.entry[0]?.changes?.[0];
      const val = change?.value || {};
      const leadgenId = val.leadgen_id;
      const pageId = val.page_id || req.body.entry[0]?.id;

      // If payload already includes direct mock/simulated fields (e.g. testing)
      if (val.name || val.full_name || val.phone_number || val.phone) {
        payload = {
          name: val.name || val.full_name || "Meta Lead",
          phone: val.phone_number || val.phone || "",
          email: val.email || "",
          requirement: val.service_needed || val.requirement || "Meta Ads Lead",
          budget: val.budget || 0,
          source: "Facebook / Instagram Ads",
          adCampaignId: val.campaign_id || val.ad_id || req.body.adCampaignId,
          platform: "Meta Ads",
          notes: `[Meta Lead Webhook] Leadgen ID: ${leadgenId || "Direct"}`,
        };
      } else if (leadgenId) {
        // Fetch full field data from Meta Graph API using decrypted Page Access Token
        console.log(`[LeadWebhookController] Resolving Meta leadgen_id: ${leadgenId} for page: ${pageId}...`);
        const metaLeadDetails = await metaLeadService.fetchLeadDetailsFromGraphApi(leadgenId, pageId);

        payload = {
          name: metaLeadDetails.name,
          phone: metaLeadDetails.phone,
          email: metaLeadDetails.email,
          businessType: metaLeadDetails.businessType,
          requirement: metaLeadDetails.requirement,
          budget: metaLeadDetails.budget,
          source: "Facebook / Instagram Ads",
          platform: "Meta Ads",
          adCampaignId: metaLeadDetails.adId || val.ad_id || req.body.adCampaignId,
          notes: metaLeadDetails.notes,
        };
      }
    }
    // 2. Google Ads Lead Form Webhook
    else if (req.body.user_column_data && Array.isArray(req.body.user_column_data)) {
      payload = normalizeGoogleAdsPayload(req.body);
    }
    // 3. Standard Website / Landing Page / Zapier Webhook
    else {
      payload = normalizeStandardPayload(req.body);
    }

    if (!payload || !payload.name || !payload.phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload. 'name' and 'phone' (or 'contactNumber') are required.",
        received: req.body,
      });
    }

    // Ingest, automated lead score, and assign to best available sales rep
    const result = await leadAutoAssignService.ingestAndAssignLead(payload);

    // Real-time Inbound Lead Attribution to active Ad Campaign
    let attribution = null;
    try {
      attribution = await adLeadAttributionService.attributeInboundLead(result.lead, req.body);
    } catch (attrErr) {
      console.warn("[LeadWebhookController] Attribution note:", attrErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Lead successfully ingested, scored, and assigned.",
      data: {
        ...result,
        attribution,
      },
    });
  } catch (error) {
    console.error("[Lead Webhook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process inbound lead webhook.",
      error: error.message,
    });
  }
};
