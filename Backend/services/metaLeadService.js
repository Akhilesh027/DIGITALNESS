/**
 * metaLeadService.js
 * Service for handling Meta (Facebook & Instagram) Lead Ads Webhooks.
 * Resolves Lead Gen Form submissions via Meta Graph API using decrypted Page Access Tokens.
 */

const MarketingConnection = require("../models/MarketingConnection");
const { decryptToken } = require("../utils/cryptoUtil");

class MetaLeadService {
  constructor() {
    this.graphVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
  }

  /**
   * Checks if payload is a Meta Lead Ads webhook event.
   */
  isMetaLeadPayload(body) {
    if (!body || !body.entry || !Array.isArray(body.entry)) return false;
    const change = body.entry[0]?.changes?.[0];
    return change?.field === "leadgen" || Boolean(change?.value?.leadgen_id);
  }

  /**
   * Resolves a valid Page Access Token for the given Page ID or connected tenant.
   */
  async resolvePageAccessToken(pageId) {
    try {
      // 1. Try finding exact page connection
      if (pageId) {
        const pageConn = await MarketingConnection.findOne({
          platformAccountId: String(pageId),
          status: { $in: ["CONNECTED", "Connected"] },
        }).select("+accessToken");

        if (pageConn?.accessToken) {
          return decryptToken(pageConn.accessToken);
        }
      }

      // 2. Try finding any active Facebook/Meta connection
      const fallbackConn = await MarketingConnection.findOne({
        platform: { $in: ["Meta", "Facebook", "MetaAds"] },
        status: { $in: ["CONNECTED", "Connected"] },
      }).select("+accessToken");

      if (fallbackConn?.accessToken) {
        return decryptToken(fallbackConn.accessToken);
      }
    } catch (dbErr) {
      console.warn("[MetaLeadService] Error querying MarketingConnection:", dbErr.message);
    }

    // 3. Fallback to environment tokens
    return (
      process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN ||
      null
    );
  }

  /**
   * Fetches the lead form details from Meta Graph API using leadgen_id.
   */
  async fetchLeadDetailsFromGraphApi(leadgenId, pageId) {
    const accessToken = await this.resolvePageAccessToken(pageId);

    // Check for Meta Developer Test Tool dummy lead ID (e.g. 444444444444)
    const isMetaTestLeadId = String(leadgenId).startsWith("444444");

    if (!accessToken) {
      console.warn(
        `[MetaLeadService] No Page Access Token found for Page ID ${pageId}. Configure META_PAGE_ACCESS_TOKEN or connect Facebook Page in CRM.`
      );

      if (isMetaTestLeadId || process.env.NODE_ENV !== "production") {
        return {
          name: "Meta Test Lead",
          phone: "+919999999999",
          email: "test_lead@meta-developer.test",
          requirement: "Meta Lead Ads Integration Test",
          budget: 25000,
          notes: `[Meta Test Event] Dummy leadgen_id: ${leadgenId}`,
        };
      }

      throw new Error(
        `Meta Graph API Page Access Token missing for page ${pageId} and leadgen_id ${leadgenId}.`
      );
    }

    const url = `https://graph.facebook.com/${this.graphVersion}/${leadgenId}?access_token=${encodeURIComponent(
      accessToken
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || response.statusText;
      console.error(`[MetaLeadService] Meta Graph API error fetching leadgen_id ${leadgenId}:`, errMsg);

      if (isMetaTestLeadId) {
        return {
          name: "Meta Test Lead",
          phone: "+919999999999",
          email: "test_lead@meta-developer.test",
          requirement: "Meta Lead Ads Integration Test",
          budget: 25000,
          notes: `[Meta Test Event - Fallback] Dummy leadgen_id: ${leadgenId}`,
        };
      }

      throw new Error(`Meta Graph API error: ${errMsg}`);
    }

    return this.parseFieldData(data);
  }

  /**
   * Extracts contact fields and form answers from Meta field_data array.
   */
  parseFieldData(metaLeadObj) {
    const fieldData = metaLeadObj.field_data || [];
    const fieldsMap = {};

    for (const item of fieldData) {
      const key = (item.name || "").toLowerCase().trim();
      const val = Array.isArray(item.values) ? item.values[0] : item.values;
      if (key && val !== undefined) {
        fieldsMap[key] = val;
      }
    }

    // Resolve Name
    let name =
      fieldsMap["full_name"] ||
      fieldsMap["name"] ||
      (fieldsMap["first_name"] && fieldsMap["last_name"]
        ? `${fieldsMap["first_name"]} ${fieldsMap["last_name"]}`
        : fieldsMap["first_name"]) ||
      "Meta Ads Lead";

    // Resolve Phone
    let phone =
      fieldsMap["phone_number"] ||
      fieldsMap["phone"] ||
      fieldsMap["contact_number"] ||
      fieldsMap["mobile_number"] ||
      "";

    // Resolve Email
    let email = fieldsMap["email"] || fieldsMap["email_address"] || "";

    // Resolve Company / Business
    let businessType =
      fieldsMap["company_name"] ||
      fieldsMap["business_name"] ||
      fieldsMap["business_type"] ||
      fieldsMap["industry"] ||
      "Meta Ad Prospect";

    // Resolve Budget
    let budget = 0;
    const rawBudget = fieldsMap["budget"] || fieldsMap["estimated_budget"] || fieldsMap["monthly_budget"];
    if (rawBudget) {
      const num = parseInt(String(rawBudget).replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num)) budget = num;
    }

    // Resolve Requirement / Custom answers
    const ignoredKeys = new Set([
      "full_name",
      "name",
      "first_name",
      "last_name",
      "phone_number",
      "phone",
      "contact_number",
      "mobile_number",
      "email",
      "email_address",
      "company_name",
      "business_name",
      "business_type",
      "industry",
      "budget",
    ]);

    const customAnswers = [];
    for (const [k, v] of Object.entries(fieldsMap)) {
      if (!ignoredKeys.has(k) && v) {
        customAnswers.push(`${k.replace(/_/g, " ")}: ${v}`);
      }
    }

    const requirement =
      customAnswers.length > 0
        ? customAnswers.join(" | ")
        : "Inbound Meta Lead Ad Form";

    return {
      name,
      phone,
      email,
      businessType,
      budget,
      requirement,
      notes: `[Meta Instant Form Lead] Form ID: ${metaLeadObj.form_id || "N/A"}, Ad ID: ${metaLeadObj.ad_id || "N/A"}`,
      adId: metaLeadObj.ad_id,
      formId: metaLeadObj.form_id,
      leadgenId: metaLeadObj.id,
      createdTime: metaLeadObj.created_time,
    };
  }
}

module.exports = new MetaLeadService();
