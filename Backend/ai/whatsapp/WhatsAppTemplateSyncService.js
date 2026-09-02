/**
 * WhatsAppTemplateSyncService.js
 * Syncs message templates from Meta Graph API and validates template parameters and approval statuses.
 */

const WhatsAppTemplate = require("../../models/WhatsAppTemplate");
const whatsappConfig = require("../../config/whatsapp");

class WhatsAppTemplateSyncService {
  /**
   * Syncs and upserts templates for a connected WABA
   */
  async syncTemplatesForWaba({ customerId, locationId = null, wabaId, accessToken }) {
    if (!wabaId || !accessToken) {
      throw new Error("wabaId and accessToken are required to sync WhatsApp templates.");
    }

    const version = whatsappConfig.graphApiVersion;
    const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates?limit=100`;

    let templatesData = [];
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }
      templatesData = data?.data || [];
    } catch (err) {
      const msg = err.message;
      console.error(`[WhatsApp Template Sync Error]: ${msg}`);
      throw new Error(`Failed to sync templates from Meta: ${msg}`);
    }

    const syncedResults = [];

    for (const t of templatesData) {
      const metaTemplateId = t.id;
      const name = t.name;
      const language = t.language;
      const category = (t.category || "UTILITY").toUpperCase();
      const status = (t.status || "PENDING").toUpperCase();
      const components = t.components || [];

      // Extract parameter count/schema from components
      const parameterSchema = this.extractParameterSchema(components);

      const updated = await WhatsAppTemplate.findOneAndUpdate(
        { wabaId, name, language },
        {
          $set: {
            customerId,
            locationId,
            metaTemplateId,
            name,
            language,
            category,
            status,
            components,
            parameterSchema,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      syncedResults.push(updated);
    }

    return {
      success: true,
      wabaId,
      syncedCount: syncedResults.length,
      templates: syncedResults,
    };
  }

  /**
   * Extracts expected parameter structure from Meta template components
   */
  extractParameterSchema(components = []) {
    let bodyParamsCount = 0;
    let headerParamsCount = 0;

    for (const comp of components) {
      if (comp.type === "BODY" && comp.text) {
        const matches = comp.text.match(/\{\{\d+\}\}/g) || [];
        bodyParamsCount = matches.length;
      }
      if (comp.type === "HEADER" && comp.format === "TEXT" && comp.text) {
        const matches = comp.text.match(/\{\{\d+\}\}/g) || [];
        headerParamsCount = matches.length;
      }
    }

    return {
      bodyParamsCount,
      headerParamsCount,
      totalExpectedParams: bodyParamsCount + headerParamsCount,
    };
  }

  /**
   * Validates template existence, Meta approval status, language, and parameters before send
   */
  async validateTemplateForSend({ customerId, wabaId, templateName, language = "en_US", parameters = {} }) {
    const template = await WhatsAppTemplate.findOne({
      customerId,
      wabaId,
      name: templateName,
      language,
    });

    if (!template) {
      return {
        valid: false,
        code: "WHATSAPP_TEMPLATE_NOT_FOUND",
        message: `Template '${templateName}' (${language}) not found for customer.`,
      };
    }

    if (template.status !== "APPROVED") {
      return {
        valid: false,
        code: "WHATSAPP_TEMPLATE_NOT_APPROVED",
        message: `Template '${templateName}' status is '${template.status}'. Only APPROVED templates can be sent.`,
      };
    }

    // Validate parameters count
    const providedBodyParams = parameters.body || [];
    const expectedBodyCount = template.parameterSchema?.bodyParamsCount || 0;

    if (providedBodyParams.length !== expectedBodyCount) {
      return {
        valid: false,
        code: "WHATSAPP_TEMPLATE_PARAMETER_INVALID",
        message: `Parameter count mismatch for '${templateName}'. Expected ${expectedBodyCount}, received ${providedBodyParams.length}.`,
      };
    }

    return {
      valid: true,
      template,
    };
  }
}

module.exports = new WhatsAppTemplateSyncService();
