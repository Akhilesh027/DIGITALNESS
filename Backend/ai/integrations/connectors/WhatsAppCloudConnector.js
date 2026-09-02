/**
 * WhatsAppCloudConnector.js
 * Standardized Meta Graph API v26.0 Connector for WhatsApp Cloud API.
 * Dispatches text, template, and interactive messages, syncs templates, and manages WABA subscriptions.
 */

const whatsappConfig = require("../../../config/whatsapp");

class WhatsAppCloudConnector {
  /**
   * Dispatches free-form text message via Graph API
   */
  async sendText({ credentialContext, phoneNumberId, recipientWaId, text }) {
    if (!phoneNumberId || !recipientWaId || !text) {
      throw new Error("phoneNumberId, recipientWaId, and text are required for sendText.");
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientWaId,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };

    return this.executeMessagesPost({ credentialContext, phoneNumberId, payload });
  }

  /**
   * Dispatches approved Meta WhatsApp Template
   */
  async sendTemplate({
    credentialContext,
    phoneNumberId,
    recipientWaId,
    templateName,
    language = "en_US",
    components = [],
  }) {
    if (!phoneNumberId || !recipientWaId || !templateName) {
      throw new Error("phoneNumberId, recipientWaId, and templateName are required for sendTemplate.");
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientWaId,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: components.length ? components : undefined,
      },
    };

    return this.executeMessagesPost({ credentialContext, phoneNumberId, payload });
  }

  /**
   * Dispatches interactive buttons or list message
   */
  async sendInteractive({ credentialContext, phoneNumberId, recipientWaId, interactive }) {
    if (!phoneNumberId || !recipientWaId || !interactive) {
      throw new Error("phoneNumberId, recipientWaId, and interactive payload are required for sendInteractive.");
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientWaId,
      type: "interactive",
      interactive,
    };

    return this.executeMessagesPost({ credentialContext, phoneNumberId, payload });
  }

  /**
   * Marks an incoming message as read
   */
  async markAsRead({ credentialContext, phoneNumberId, messageId }) {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };

    return this.executeMessagesPost({ credentialContext, phoneNumberId, payload });
  }

  /**
   * Subscribes Meta App to client's WABA
   */
  async subscribeAppToWaba({ credentialContext, wabaId }) {
    const version = whatsappConfig.graphApiVersion;
    const url = `https://graph.facebook.com/${version}/${wabaId}/subscribed_apps`;

    if (this.isMockOrTest(credentialContext.accessToken)) {
      return { success: true, subscribed: true, wabaId, mock: true };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${credentialContext.accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }
      return data;
    } catch (err) {
      const msg = err.message;
      throw new Error(`Failed to subscribe app to WABA: ${msg}`);
    }
  }

  /**
   * Retrieves phone number health, display name, and quality rating
   */
  async getPhoneNumberHealth({ credentialContext, phoneNumberId }) {
    const version = whatsappConfig.graphApiVersion;
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`;

    if (this.isMockOrTest(credentialContext.accessToken)) {
      return {
        id: phoneNumberId,
        display_phone_number: "+91 98765 43210",
        verified_name: "Digitalness Client Test",
        quality_rating: "GREEN",
        messaging_limit_tier: "TIER_1K",
        mock: true,
      };
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${credentialContext.accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }
      return data;
    } catch (err) {
      const msg = err.message;
      throw new Error(`Failed to get phone number health: ${msg}`);
    }
  }

  /**
   * Internal dispatcher for /{PHONE_NUMBER_ID}/messages
   */
  async executeMessagesPost({ credentialContext, phoneNumberId, payload }) {
    const version = whatsappConfig.graphApiVersion;
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    if (this.isMockOrTest(credentialContext.accessToken)) {
      const mockWamid = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return {
        messaging_product: "whatsapp",
        contacts: [{ input: payload.to, wa_id: payload.to }],
        messages: [{ id: mockWamid }],
        mock: true,
      };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentialContext.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        const errData = data?.error || {};
        const msg = errData.message || `HTTP ${response.status}`;
        const code = errData.code || "WHATSAPP_API_ERROR";
        console.error(`[WhatsApp API Error]: (${code}) ${msg}`);
        const apiErr = new Error(`WhatsApp API error: ${msg}`);
        apiErr.code = code;
        apiErr.details = errData;
        throw apiErr;
      }
      return data;
    } catch (err) {
      console.error(`[WhatsApp API Execution Error]:`, err.message);
      throw err;
    }
  }

  isMockOrTest(token) {
    if (!token) return true;
    if (token.startsWith("mock_") || token.startsWith("test_") || token.includes("placeholder")) return true;
    return false;
  }
}

module.exports = new WhatsAppCloudConnector();
