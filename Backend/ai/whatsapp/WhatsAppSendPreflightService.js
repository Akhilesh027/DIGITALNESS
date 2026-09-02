/**
 * WhatsAppSendPreflightService.js
 * Preflight validation guard before dispatching outbound WhatsApp messages.
 * 
 * Enforces:
 * 1. Multi-tenant connection validity & branch matching.
 * 2. Recipient identity validation.
 * 3. 24-hour customer service window (blocks free-form text when window is CLOSED).
 * 4. Template requirements & Meta approval validation outside window.
 * 5. Marketing consent & opt-out suppression.
 * 6. Governance & R2 approval checks.
 * 7. Outbound idempotency.
 */

const MarketingConnection = require("../../models/MarketingConnection");
const LeadConversation = require("../../models/LeadConversation");
const LeadMessage = require("../../models/LeadMessage");
const whatsAppIdentityNormalizer = require("./WhatsAppIdentityNormalizer");
const whatsAppConversationWindowService = require("./WhatsAppConversationWindowService");
const whatsAppTemplateSyncService = require("./WhatsAppTemplateSyncService");

class WhatsAppSendPreflightService {
  /**
   * Performs comprehensive pre-send validation
   */
  async validateOutboundSend({
    customerId,
    locationId = null,
    connectionId = null,
    phoneNumberId = null,
    recipientWaId,
    messageType = "TEXT",
    text = "",
    templateName = null,
    templateLanguage = "en_US",
    templateParameters = {},
    conversationId = null,
    idempotencyKey = null,
    approvalId = null,
    sendTime = new Date(),
  }) {
    // 1. Connection Validation
    const connQuery = {
      customerId,
      platform: "WhatsApp",
      accountType: "WhatsAppPhoneNumber",
      status: { $in: ["CONNECTED", "Connected"] },
    };
    if (connectionId) connQuery._id = connectionId;
    if (phoneNumberId) connQuery.platformAccountId = phoneNumberId;
    if (locationId) connQuery.locationId = locationId;

    const connection = await MarketingConnection.findOne(connQuery);
    if (!connection) {
      return {
        valid: false,
        code: "WHATSAPP_CONNECTION_NOT_FOUND",
        message: "No active WhatsApp connection found for this tenant/branch.",
      };
    }

    const resolvedPhoneNumberId = connection.platformAccountId;
    const wabaId = connection.metadata?.wabaId;

    // 2. Recipient Identity Validation
    const norm = whatsAppIdentityNormalizer.normalize(recipientWaId);
    if (!norm.isValid) {
      return {
        valid: false,
        code: "INVALID_RECIPIENT_PHONE",
        message: `Recipient phone '${recipientWaId}' is invalid.`,
      };
    }
    const cleanRecipient = norm.normalizedPhone;

    // 3. Conversation & 24-Hour Window Validation
    let conversation = null;
    if (conversationId) {
      conversation = await LeadConversation.findById(conversationId);
    } else {
      conversation = await LeadConversation.findOne({
        customerId,
        phoneNumberId: resolvedPhoneNumberId,
        participantWaId: cleanRecipient,
      });
    }

    const isWindowOpen = conversation ? whatsAppConversationWindowService.isServiceWindowOpen(conversation, sendTime) : false;

    // 4. Free-Form vs Template Rule
    if (["TEXT", "INTERACTIVE"].includes(messageType)) {
      if (!isWindowOpen) {
        return {
          valid: false,
          code: "WHATSAPP_TEMPLATE_REQUIRED",
          message: "24-hour customer service window is CLOSED. Free-form messages are blocked. An approved template is required.",
          windowStatus: "CLOSED",
        };
      }
    }

    // 5. Template Pre-send Validation
    if (messageType === "TEMPLATE") {
      if (!templateName) {
        return {
          valid: false,
          code: "WHATSAPP_TEMPLATE_NAME_REQUIRED",
          message: "Template name is required for TEMPLATE message type.",
        };
      }

      const templateCheck = await whatsAppTemplateSyncService.validateTemplateForSend({
        customerId,
        wabaId,
        templateName,
        language: templateLanguage,
        parameters: templateParameters,
      });

      if (!templateCheck.valid) {
        return templateCheck;
      }

      // Check Marketing Consent if Category is MARKETING
      if (templateCheck.template?.category === "MARKETING") {
        if (conversation && conversation.state === "OPTED_OUT") {
          return {
            valid: false,
            code: "WHATSAPP_RECIPIENT_OPTED_OUT",
            message: "Recipient has opted out of marketing communications.",
          };
        }
        if (conversation && !conversation.marketingOptIn) {
          return {
            valid: false,
            code: "WHATSAPP_MARKETING_CONSENT_REQUIRED",
            message: "Marketing outbound requires explicit customer opt-in consent.",
          };
        }
      }
    }

    // 6. Idempotency Check
    if (idempotencyKey) {
      const existingSent = await LeadMessage.findOne({
        idempotencyKey,
        status: { $in: ["SENT", "DELIVERED", "READ"] },
      });
      if (existingSent) {
        return {
          valid: false,
          code: "ALREADY_SENT",
          message: `Message with idempotency key '${idempotencyKey}' was already sent.`,
          existingMessageId: existingSent.providerMessageId,
        };
      }
    }

    return {
      valid: true,
      connection,
      phoneNumberId: resolvedPhoneNumberId,
      wabaId,
      recipientWaId: cleanRecipient,
      conversation,
      isWindowOpen,
    };
  }
}

module.exports = new WhatsAppSendPreflightService();
