/**
 * whatsappRoutes.js
 * Comprehensive routes for WhatsApp Cloud API Webhooks and CRM Conversation Management.
 */

const express = require("express");
const router = express.Router();
const { verifyWebhookSubscription, validateWhatsAppWebhookSignature } = require("../middleware/whatsappAuth");
const { protect } = require("../middleware/authMiddleware");
const whatsAppLeadIngestionService = require("../ai/whatsapp/WhatsAppLeadIngestionService");
const whatsAppTemplateSyncService = require("../ai/whatsapp/WhatsAppTemplateSyncService");
const whatsAppConversationWindowService = require("../ai/whatsapp/WhatsAppConversationWindowService");
const whatsappConfig = require("../config/whatsapp");
const LeadConversation = require("../models/LeadConversation");
const LeadMessage = require("../models/LeadMessage");
const WhatsAppTemplate = require("../models/WhatsAppTemplate");
const ApprovalEngine = require("../ai/approval/ApprovalEngine");
const QueueRegistry = require("../ai/queue/QueueRegistry");
const MarketingConnection = require("../models/MarketingConnection");

// =============================================================================
// PUBLIC WEBHOOK ENDPOINTS
// =============================================================================

// 1. Webhook GET Challenge Verification
router.get("/webhook", verifyWebhookSubscription);

// 2. Webhook POST Event Receiver (HMAC-SHA256 Signed)
router.post("/webhook", validateWhatsAppWebhookSignature, async (req, res) => {
  try {
    // Fast 200 OK acknowledgment to Meta before background processing
    const payload = req.body;
    
    // Process ingestion asynchronously / immediately
    setImmediate(async () => {
      try {
        await whatsAppLeadIngestionService.processWebhookEvent(payload);
      } catch (err) {
        console.error("[WhatsApp Webhook Processing Error]:", err);
      }
    });

    return res.status(200).json({ status: "EVENT_RECEIVED" });
  } catch (err) {
    console.error("[WhatsApp Webhook Handler Error]:", err);
    return res.status(200).json({ status: "ACK" }); // Always ACK to prevent Meta webhook unsubscription
  }
});

// =============================================================================
// AUTHENTICATED CRM CONVERSATION & TEMPLATE API
// =============================================================================

// 3. Status & Embedded Signup Readiness
router.get("/status", protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      graphApiVersion: whatsappConfig.graphApiVersion,
      appId: whatsappConfig.appId,
      embeddedSignupStatus: whatsappConfig.getEmbeddedSignupStatus(),
      requiredPermissions: whatsappConfig.requiredPermissions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. List Conversations with 24h Window Status
router.get("/conversations", protect, async (req, res) => {
  try {
    const { customerId, locationId, state, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;
    if (state) query.state = state;
    if (search) {
      query.participantWaId = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      LeadConversation.find(query)
        .populate("customerId", "name companyName brandName")
        .populate("locationId", "name city")
        .populate("leadId", "name contactNumber leadScore status businessType")
        .populate("assignedTo", "name email role")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LeadConversation.countDocuments(query),
    ]);

    const enriched = conversations.map((conv) => ({
      ...conv,
      windowStatus: whatsAppConversationWindowService.getWindowStatus(conv),
    }));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      conversations: enriched,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Single Conversation Details & Message History Timeline
router.get("/conversations/:id", protect, async (req, res) => {
  try {
    const conversation = await LeadConversation.findById(req.params.id)
      .populate("customerId", "name companyName brandName logoUrl")
      .populate("locationId", "name city address")
      .populate("leadId")
      .populate("assignedTo", "name email role")
      .lean();

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const messages = await LeadMessage.find({ conversationId: conversation._id })
      .populate("approvalId", "approvalId status riskLevel currentVersion")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      conversation: {
        ...conversation,
        windowStatus: whatsAppConversationWindowService.getWindowStatus(conversation),
      },
      messages,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Manager Outbound Message / Draft with R2 Approval
router.post("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const conversation = await LeadConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const { messageType = "TEXT", text = "", templateName, templateLanguage = "en_US", templateComponents = [] } = req.body;
    const windowStatus = whatsAppConversationWindowService.getWindowStatus(conversation);

    // If window is closed and user attempts free text: block upfront
    if (["TEXT", "INTERACTIVE"].includes(messageType) && !windowStatus.isOpen) {
      return res.status(400).json({
        success: false,
        code: "WHATSAPP_TEMPLATE_REQUIRED",
        message: "Customer service window is closed (24h exceeded). An approved WhatsApp template is required.",
      });
    }

    // Create R2 Approval Request for Manager Outbound
    const approval = await ApprovalEngine.createApprovalRequest({
      title: `WhatsApp Outbound: ${messageType === "TEMPLATE" ? templateName : text.slice(0, 30) + "..."}`,
      description: `Outbound WhatsApp message to ${conversation.participantWaId}`,
      domain: "WHATSAPP",
      actionType: "WHATSAPP_SEND_MESSAGE",
      riskLevel: "R2",
      customer: conversation.customerId,
      clientLocation: conversation.locationId,
      submittedByType: "USER",
      submittedBy: req.user?._id,
      blueprintPayload: {
        conversationId: conversation._id,
        recipientWaId: conversation.participantWaId,
        messageType,
        text,
        templateName,
        templateLanguage,
        templateComponents,
      },
      executionIntent: {
        connector: "WhatsAppCloudConnector",
        service: "WhatsAppSendPreflightService",
        action: "whatsapp.sendMessage",
        payload: {
          conversationId: conversation._id,
          recipientWaId: conversation.participantWaId,
          phoneNumberId: conversation.phoneNumberId,
          messageType,
          text,
          templateName,
          templateLanguage,
          templateComponents,
        },
      },
    });

    // Create DRAFT LeadMessage
    const leadMsg = await LeadMessage.create({
      conversationId: conversation._id,
      customerId: conversation.customerId,
      locationId: conversation.locationId,
      direction: "OUTBOUND",
      sender: conversation.phoneNumberId,
      recipient: conversation.participantWaId,
      messageType,
      text,
      template: templateName ? { name: templateName, language: templateLanguage, components: templateComponents } : null,
      status: "QUEUED",
      generatedBy: "USER",
      approvalId: approval._id,
    });

    return res.status(201).json({
      success: true,
      message: "Outbound message created and submitted for R2 approval.",
      approvalId: approval.approvalId,
      approvalStatus: approval.status,
      leadMessageId: leadMsg._id,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Human Takeover: Pause Automation
router.post("/conversations/:id/pause-automation", protect, async (req, res) => {
  try {
    const conversation = await LeadConversation.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          automationMode: "HUMAN",
          state: "HUMAN_HANDOFF",
          humanHandoffRequested: true,
          "metadata.pausedBy": req.user?._id,
          "metadata.pausedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Automation paused for this conversation. Human takeover enabled.",
      conversation,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Resume Automation
router.post("/conversations/:id/resume-automation", protect, async (req, res) => {
  try {
    const conversation = await LeadConversation.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          automationMode: "AUTOMATED",
          humanHandoffRequested: false,
          state: "QUALIFYING",
          "metadata.resumedBy": req.user?._id,
          "metadata.resumedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Automation resumed for this conversation.",
      conversation,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. List Synced WhatsApp Templates
router.get("/templates", protect, async (req, res) => {
  try {
    const { customerId, status, category } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;
    if (category) query.category = category;

    const templates = await WhatsAppTemplate.find(query).sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, count: templates.length, templates });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Trigger Template Sync from Meta WABA
router.post("/templates/sync", protect, async (req, res) => {
  try {
    const { customerId, locationId, wabaId } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required." });
    }

    const connection = await MarketingConnection.findOne({
      customerId,
      platform: "WhatsApp",
      status: { $in: ["CONNECTED", "Connected"] },
    }).select("+accessToken");

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "No active WhatsApp connection found for this customer.",
      });
    }

    const resolvedWabaId = wabaId || connection.metadata?.wabaId;
    if (!resolvedWabaId) {
      return res.status(400).json({
        success: false,
        message: "WABA ID not found in connection metadata.",
      });
    }

    const { decryptToken } = require("../utils/cryptoUtil");
    const accessToken = decryptToken(connection.accessToken);

    const result = await whatsAppTemplateSyncService.syncTemplatesForWaba({
      customerId,
      locationId,
      wabaId: resolvedWabaId,
      accessToken,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
