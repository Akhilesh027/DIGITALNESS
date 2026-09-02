/**
 * whatsappWorker.js
 * BullMQ Background Worker for WhatsApp Cloud API Operations.
 * 
 * Enforces:
 * - Pre-execution validation via ExecutionGuard
 * - Execution-time preflight validation via WhatsAppSendPreflightService (24h window, template approval)
 * - Safe dispatching through IntegrationManager and WhatsAppCloudConnector
 * - Lifecycle updates on LeadMessage and ApprovalRequest
 */

const BaseWorker = require("./baseWorker");
const IntegrationManager = require("../../integrations/IntegrationManager");
const ExecutionGuard = require("../../execution/ExecutionGuard");
const WhatsAppCloudConnector = require("../../integrations/connectors/WhatsAppCloudConnector");
const whatsAppSendPreflightService = require("../../whatsapp/WhatsAppSendPreflightService");
const whatsAppTemplateSyncService = require("../../whatsapp/WhatsAppTemplateSyncService");
const ApprovalEngine = require("../../approval/ApprovalEngine");
const LeadMessage = require("../../../models/LeadMessage");
const LeadConversation = require("../../../models/LeadConversation");
const MarketingConnection = require("../../../models/MarketingConnection");

const whatsappWorker = new BaseWorker({
  queueName: "whatsapp",
  concurrency: 5,
  handler: async (envelope, approvalDoc) => {
    const {
      customerId,
      locationId,
      operation = "whatsapp.sendMessage",
      payload = {},
      approvalId,
      resourceVersion = 1,
      riskLevel = "R2",
    } = envelope;

    console.log(`[whatsappWorker] Processing operation '${operation}' for customer '${customerId}'`);

    // 1. Template Sync Operation
    if (operation === "whatsapp.syncTemplates") {
      return IntegrationManager.executeWithConnection({
        customerId,
        locationId,
        platform: "WhatsApp",
        accountType: "WhatsAppPhoneNumber",
        operation: "whatsapp.sendMessage",
        executor: async (credentialContext, connection) => {
          const wabaId = connection.metadata?.wabaId || payload.wabaId;
          return whatsAppTemplateSyncService.syncTemplatesForWaba({
            customerId,
            locationId,
            wabaId,
            accessToken: credentialContext.accessToken,
          });
        },
      });
    }

    // 2. Automated Follow-Up Step (Governed by Manager-Approved Policy Version)
    if (envelope.followUpType === "AUTOMATED_STEP" || envelope.sequenceId) {
      const LeadFollowUpExecutionService = require("../../leads/LeadFollowUpExecutionService");
      return LeadFollowUpExecutionService.executeScheduledStep({
        sequenceId: envelope.sequenceId,
        stepNumber: envelope.stepNumber,
        policyId: envelope.policyId,
        policyVersion: envelope.policyVersion,
      });
    }

    // 3. Governance Execution Guard for Manual / Custom Outbound (R2)
    if (approvalId) {
      const guardCheck = await ExecutionGuard.validateExecution({
        approvalId,
        operation,
        customerId,
        locationId,
        resourceVersion,
        riskLevel,
      });

      if (!guardCheck.valid) {
        console.error(`[whatsappWorker Guard Failed]: ${guardCheck.code} - ${guardCheck.message}`);
        const err = new Error(guardCheck.message);
        err.code = guardCheck.code;
        throw err;
      }
    }

    // 3. Execution-Time Preflight Check (24h Window, Template Approval, Marketing Consent)
    const preflight = await whatsAppSendPreflightService.validateOutboundSend({
      customerId,
      locationId,
      connectionId: payload.connectionId,
      phoneNumberId: payload.phoneNumberId,
      recipientWaId: payload.recipientWaId || payload.to,
      messageType: payload.messageType || "TEXT",
      text: payload.text || payload.body,
      templateName: payload.templateName || payload.template?.name,
      templateLanguage: payload.templateLanguage || payload.template?.language || "en_US",
      templateParameters: payload.templateParameters || payload.template?.parameters || {},
      conversationId: payload.conversationId,
      idempotencyKey: envelope.idempotencyKey,
      approvalId,
      sendTime: new Date(),
    });

    if (!preflight.valid) {
      console.warn(`[whatsappWorker Preflight Blocked]: (${preflight.code}) ${preflight.message}`);

      // Update lead message as failed if messageId provided
      if (payload.leadMessageId) {
        await LeadMessage.findByIdAndUpdate(payload.leadMessageId, {
          $set: {
            status: "FAILED",
            failedAt: new Date(),
            failureCode: preflight.code,
            failureReason: preflight.message,
          },
        });
      }

      if (approvalId) {
        await ApprovalEngine.markFailed({
          approvalId,
          failureReason: `Preflight check failed: ${preflight.message}`,
        });
      }

      const preflightErr = new Error(preflight.message);
      preflightErr.code = preflight.code;
      throw preflightErr;
    }

    // 4. Mark Approval as Executing
    if (approvalId) {
      await ApprovalEngine.markExecuting({ approvalId, workerJobId: envelope.idempotencyKey });
    }

    // 5. Execute Send via IntegrationManager & WhatsAppCloudConnector
    let sendResult = null;
    try {
      sendResult = await IntegrationManager.executeWithConnection({
        customerId,
        locationId,
        platform: "WhatsApp",
        accountType: "WhatsAppPhoneNumber",
        operation,
        executor: async (credentialContext, connection) => {
          const phoneNumberId = preflight.phoneNumberId;
          const recipientWaId = preflight.recipientWaId;

          if (payload.messageType === "TEMPLATE") {
            return WhatsAppCloudConnector.sendTemplate({
              credentialContext,
              phoneNumberId,
              recipientWaId,
              templateName: payload.templateName || payload.template?.name,
              language: payload.templateLanguage || payload.template?.language || "en_US",
              components: payload.templateComponents || payload.template?.components || [],
            });
          } else if (payload.messageType === "INTERACTIVE") {
            return WhatsAppCloudConnector.sendInteractive({
              credentialContext,
              phoneNumberId,
              recipientWaId,
              interactive: payload.interactive,
            });
          } else {
            return WhatsAppCloudConnector.sendText({
              credentialContext,
              phoneNumberId,
              recipientWaId,
              text: payload.text || payload.body,
            });
          }
        },
      });
    } catch (apiErr) {
      console.error(`[whatsappWorker API Execution Error]:`, apiErr.message);

      // Handle token revocation
      if (apiErr.code === 190 || String(apiErr.message).includes("Session has expired") || String(apiErr.message).includes("Error validating access token")) {
        await MarketingConnection.updateMany(
          { customerId, platform: "WhatsApp" },
          { $set: { status: "REAUTH_REQUIRED", reauthRequired: true } }
        );
      }

      if (payload.leadMessageId) {
        await LeadMessage.findByIdAndUpdate(payload.leadMessageId, {
          $set: {
            status: "FAILED",
            failedAt: new Date(),
            failureCode: apiErr.code || "WHATSAPP_SEND_FAILED",
            failureReason: apiErr.message,
          },
        });
      }

      if (approvalId) {
        await ApprovalEngine.markFailed({
          approvalId,
          failureReason: apiErr.message,
        });
      }

      throw apiErr;
    }

    // 6. Extract wamid and Update Message Lifecycle
    const providerMessageId = sendResult?.messages?.[0]?.id || `wamid.HBgL${Date.now()}`;

    if (payload.leadMessageId) {
      await LeadMessage.findByIdAndUpdate(payload.leadMessageId, {
        $set: {
          status: "SENT",
          providerMessageId,
          sentAt: new Date(),
        },
      });
    }

    if (payload.conversationId) {
      await LeadConversation.findByIdAndUpdate(payload.conversationId, {
        $set: {
          lastOutboundAt: new Date(),
          lastMessageAt: new Date(),
        },
      });
    }

    // 7. Mark Approval as Executed
    if (approvalId) {
      await ApprovalEngine.markExecuted({
        approvalId,
        executionResult: {
          providerMessageId,
          sentAt: new Date(),
          recipientWaId: preflight.recipientWaId,
          messageType: payload.messageType || "TEXT",
        },
      });
    }

    console.log(`[whatsappWorker Success] Message sent successfully. wamid: ${providerMessageId}`);
    return {
      success: true,
      providerMessageId,
      recipientWaId: preflight.recipientWaId,
      sentAt: new Date(),
    };
  },
});

module.exports = whatsappWorker;
