/**
 * WhatsAppLeadIngestionService.js
 * Ingestion pipeline for WhatsApp Cloud API webhooks.
 * Resolves multi-tenant business mapping, dedupes by wamid, manages rolling 24h window,
 * sanitizes input, runs LeadAgent classification, and routes safe auto-responses.
 */

const mongoose = require("mongoose");
const MarketingConnection = require("../../models/MarketingConnection");
const LeadConversation = require("../../models/LeadConversation");
const LeadMessage = require("../../models/LeadMessage");
const Lead = require("../../models/Lead");
const WhatsAppAutomationPolicy = require("../../models/WhatsAppAutomationPolicy");
const whatsAppIdentityNormalizer = require("./WhatsAppIdentityNormalizer");
const whatsAppInputSanitizer = require("./WhatsAppInputSanitizer");
const whatsAppConversationWindowService = require("./WhatsAppConversationWindowService");
const whatsAppMenuRouter = require("./WhatsAppMenuRouter");
const leadAgent = require("../agents/LeadAgent");
const followUpSchedulerService = require("../leads/FollowUpSchedulerService");

class WhatsAppLeadIngestionService {
  /**
   * Main webhook ingestion entrypoint
   */
  async processWebhookEvent(payload) {
    if (!payload || !payload.entry || !payload.entry.length) {
      return { processed: false, reason: "EMPTY_WEBHOOK_PAYLOAD" };
    }

    const results = [];

    for (const entry of payload.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value || {};
        const metadata = value.metadata || {};
        const phoneNumberId = metadata.phone_number_id;
        const displayPhoneNumber = metadata.display_phone_number;

        // 1. Process Message Status Updates (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            const res = await this.handleStatusUpdate(statusObj);
            results.push(res);
          }
        }

        // 2. Process Inbound Customer Messages
        if (value.messages && value.messages.length > 0) {
          for (const messageObj of value.messages) {
            const contacts = value.contacts || [];
            const contact = contacts.find((c) => c.wa_id === messageObj.from) || {};
            const senderName = contact.profile?.name || "WhatsApp Prospect";

            const res = await this.handleInboundMessage({
              phoneNumberId,
              displayPhoneNumber,
              messageObj,
              senderName,
            });
            results.push(res);
          }
        }
      }
    }

    return { processed: true, resultsCount: results.length, results };
  }

  /**
   * Handles delivery, read, and failure status webhooks
   */
  async handleStatusUpdate(statusObj) {
    const providerMessageId = statusObj.id;
    const status = statusObj.status; // sent, delivered, read, failed
    const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp) * 1000) : new Date();

    const leadMsg = await LeadMessage.findOne({ providerMessageId });
    if (!leadMsg) {
      return { type: "STATUS_UPDATE", updated: false, reason: "MESSAGE_NOT_FOUND", providerMessageId };
    }

    const normalizedStatus = status.toUpperCase(); // SENT, DELIVERED, READ, FAILED
    leadMsg.status = normalizedStatus;

    if (status === "sent") leadMsg.sentAt = timestamp;
    if (status === "delivered") leadMsg.deliveredAt = timestamp;
    if (status === "read") leadMsg.readAt = timestamp;
    if (status === "failed") {
      leadMsg.failedAt = timestamp;
      const err = statusObj.errors?.[0] || {};
      leadMsg.failureCode = err.code ? String(err.code) : "DELIVERY_FAILED";
      leadMsg.failureReason = err.title || err.message || "Message delivery failed";
    }

    await leadMsg.save();
    return { type: "STATUS_UPDATE", updated: true, providerMessageId, status: normalizedStatus };
  }

  /**
   * Ingests, normalizes, dedupes, and routes an inbound customer message
   */
  async handleInboundMessage({ phoneNumberId, displayPhoneNumber, messageObj, senderName }) {
    const providerMessageId = messageObj.id;

    // 1. Inbound Idempotency Check (Duplicate wamid)
    const existingMsg = await LeadMessage.findOne({ providerMessageId });
    if (existingMsg) {
      return {
        type: "INBOUND_MESSAGE",
        duplicate: true,
        messageId: providerMessageId,
        note: "Duplicate webhook ignored.",
      };
    }

    // 2. Resolve Multi-Tenant Business & Branch Mapping
    const connection = await MarketingConnection.findOne({
      platform: "WhatsApp",
      accountType: "WhatsAppPhoneNumber",
      platformAccountId: phoneNumberId,
      status: { $in: ["CONNECTED", "Connected"] },
    });

    if (!connection) {
      console.warn(`[WhatsApp Ingestion] Unmapped phone_number_id: ${phoneNumberId}`);
      return {
        type: "INBOUND_MESSAGE",
        error: "WHATSAPP_PHONE_NUMBER_NOT_MAPPED",
        phoneNumberId,
      };
    }

    const { customerId, locationId } = connection;

    // 3. Normalize Participant WhatsApp Phone
    const norm = whatsAppIdentityNormalizer.normalize(messageObj.from);
    const participantPhone = norm.normalizedPhone || messageObj.from;

    // 4. Extract Inbound Content & Interactive Selection
    let messageType = "TEXT";
    let messageText = "";
    let interactiveData = null;

    if (messageObj.type === "text") {
      messageText = messageObj.text?.body || "";
    } else if (messageObj.type === "interactive") {
      messageType = "INTERACTIVE";
      interactiveData = messageObj.interactive;
      if (interactiveData.type === "button_reply") {
        messageText = interactiveData.button_reply?.title || "";
      } else if (interactiveData.type === "list_reply") {
        messageText = interactiveData.list_reply?.title || "";
      }
    } else if (messageObj.type === "button") {
      messageType = "INTERACTIVE";
      messageText = messageObj.button?.text || "";
    }

    const timestamp = messageObj.timestamp ? new Date(parseInt(messageObj.timestamp) * 1000) : new Date();

    // 5. Inbound Lead Matching or Creation
    let lead = await Lead.findOne({
      customerId,
      contactNumber: { $regex: new RegExp(participantPhone.slice(-10) + "$") },
    });

    if (!lead) {
      lead = await Lead.create({
        name: senderName,
        contactNumber: participantPhone,
        businessType: "Inbound Prospect",
        source: "AI Workspace",
        customerId,
        branchId: locationId ? "BRANCH_" + locationId.toString().slice(-4) : "BR001",
        status: "New",
      });
    }

    // 6. Find or Create LeadConversation
    let conversation = await LeadConversation.findOne({
      customerId,
      phoneNumberId,
      participantWaId: participantPhone,
    });

    if (!conversation) {
      const convId = `CONV-WA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      conversation = new LeadConversation({
        conversationId: convId,
        customerId,
        locationId,
        leadId: lead._id,
        connectionId: connection._id,
        wabaId: connection.metadata?.wabaId || null,
        phoneNumberId,
        participantWaId: participantPhone,
        state: "NEW",
        automationMode: "AUTOMATED",
        marketingOptIn: false,
      });
    } else {
      conversation.leadId = lead._id;
      if (locationId) conversation.locationId = locationId;
    }

    // 7. Open / Refresh Rolling 24-Hour Customer Service Window
    whatsAppConversationWindowService.openOrRefreshWindow(conversation, timestamp);

    // 8. Opt-Out Recognition (STOP, UNSUBSCRIBE, etc.)
    const isOptOut = whatsAppInputSanitizer.isExplicitOptOut(messageText);
    if (isOptOut) {
      conversation.marketingOptIn = false;
      conversation.marketingOptOutAt = new Date();
      conversation.state = "OPTED_OUT";
      await followUpSchedulerService.handleOptOut(conversation._id);
    } else {
      // Customer responded: Cancel any pending follow-up steps immediately
      await followUpSchedulerService.handleCustomerResponse(conversation._id);
    }

    // 9. Persist Inbound LeadMessage
    const inboundMessage = await LeadMessage.create({
      conversationId: conversation._id,
      customerId,
      locationId,
      providerMessageId,
      direction: "INBOUND",
      sender: participantPhone,
      recipient: phoneNumberId,
      messageType,
      text: messageText,
      interactive: interactiveData,
      status: "DELIVERED",
      sentAt: timestamp,
      deliveredAt: timestamp,
    });

    // 10. Interactive Button / List Reply Resolution
    let menuResolution = null;
    if (interactiveData?.button_reply?.id) {
      menuResolution = whatsAppMenuRouter.resolveMenuOption(interactiveData.button_reply.id);
    } else if (interactiveData?.list_reply?.id) {
      menuResolution = whatsAppMenuRouter.resolveMenuOption(interactiveData.list_reply.id);
    }

    // 11. Run LeadAgent Intent Classification & Qualification
    const agentAnalysis = await leadAgent.classifyInboundMessage({
      text: messageText,
      customerId,
      locationId,
      existingLead: lead,
      conversationState: conversation.state,
    });

    conversation.qualificationSummary = {
      intent: menuResolution?.intent || agentAnalysis.intent,
      serviceInterest: agentAnalysis.serviceInterest,
      urgency: agentAnalysis.urgency,
      purchaseTimeline: agentAnalysis.purchaseTimeline,
      qualificationScore: agentAnalysis.qualificationScore,
      humanEscalationRecommended: menuResolution?.requiresHuman || agentAnalysis.humanEscalationRecommended,
      nextRecommendedAction: agentAnalysis.nextRecommendedAction,
    };

    // 12. State Machine Transition
    if (conversation.state !== "OPTED_OUT") {
      if (menuResolution?.requiresHuman || agentAnalysis.humanEscalationRecommended) {
        conversation.state = "HUMAN_HANDOFF";
        conversation.humanHandoffRequested = true;
      } else if (conversation.state === "NEW") {
        conversation.state = "GREETING";
      } else {
        conversation.state = "QUALIFYING";
      }
    }

    await conversation.save();

    // 13. Deterministic Auto-Response Evaluation
    let autoReplyResult = { sent: false, reason: "NO_POLICY" };

    if (conversation.automationMode === "HUMAN") {
      autoReplyResult = { sent: false, reason: "AUTOMATION_PAUSED_FOR_CONVERSATION" };
    } else if (conversation.state !== "OPTED_OUT") {
      // Find matching automation policy
      let policyType = "WELCOME_MENU";
      if (conversation.humanHandoffRequested) policyType = "HUMAN_HANDOFF_ACK";
      else if (menuResolution && !menuResolution.requiresHuman) policyType = "BASIC_SERVICE_MENU";

      const policy = await WhatsAppAutomationPolicy.findOne({
        customerId,
        policyType,
        enabled: true,
      });

      if (policy && whatsAppConversationWindowService.isServiceWindowOpen(conversation)) {
        // Enqueue or execute auto-reply
        const replyText = menuResolution?.defaultReply || policy.messageDefinition?.text || "Welcome! How can we assist you today?";
        const buttons = policy.messageDefinition?.interactive || whatsAppMenuRouter.generateWelcomeButtons(replyText);

        autoReplyResult = {
          sent: true,
          policyType,
          policyId: policy._id,
          replyText,
          interactive: buttons,
        };
      }
    }

    // 14. Automated Follow-Up Sequence Trigger (Manager-Approved Policy)
    let followUpSequenceResult = null;
    if (conversation.state !== "OPTED_OUT" && conversation.state !== "HUMAN_HANDOFF" && conversation.automationMode !== "HUMAN") {
      try {
        followUpSequenceResult = await followUpSchedulerService.startSequence({
          leadId: lead._id,
          conversationId: conversation._id,
        });
      } catch (e) {
        console.warn("[WhatsApp Ingestion FollowUp Note]:", e.message);
      }
    }

    // 15. Upsert Unified InboxItem
    try {
      const inboxService = require("../inbox/InboxService");
      const priority = conversation.qualificationSummary?.qualificationScore >= 75 || conversation.humanHandoffRequested ? "HIGH" : "NORMAL";
      await inboxService.createOrUpdateInboxItem({
        customerId,
        locationId,
        sourceType: "WHATSAPP_CONVERSATION",
        sourceId: conversation._id,
        channel: "WHATSAPP",
        category: "LEAD_INQUIRY",
        priority,
        title: senderName || participantPhone,
        snippet: messageText || "Interactive option selected",
        participantName: senderName,
        participantPhone,
        unread: true,
        lastActivityAt: timestamp,
      });
    } catch (inboxErr) {
      console.warn("[WhatsApp Ingestion Inbox Note]:", inboxErr.message);
    }

    return {
      type: "INBOUND_MESSAGE",
      messageId: providerMessageId,
      customerId,
      locationId,
      conversationId: conversation.conversationId,
      leadId: lead._id,
      state: conversation.state,
      windowStatus: whatsAppConversationWindowService.getWindowStatus(conversation),
      agentAnalysis: conversation.qualificationSummary,
      menuResolution,
      autoReplyResult,
      followUpSequenceResult,
    };
  }
}

module.exports = new WhatsAppLeadIngestionService();
