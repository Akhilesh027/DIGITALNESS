/**
 * InboxService.js
 * Core workflow and lifecycle manager for Unified Communications Inbox.
 */

const InboxItem = require("../../models/InboxItem");
const InboxInternalNote = require("../../models/InboxInternalNote");
const LeadConversation = require("../../models/LeadConversation");
const Lead = require("../../models/Lead");
const assignmentEngine = require("./AssignmentEngine");
const inboxSLAService = require("./InboxSLAService");
const inboxEventService = require("./InboxEventService");
const followUpSchedulerService = require("../leads/FollowUpSchedulerService");
const leadAgent = require("../agents/LeadAgent");

class InboxService {
  /**
   * Upserts a unified InboxItem from any domain source event (WhatsApp, GBP, Lead, etc.)
   */
  async createOrUpdateInboxItem({
    customerId,
    locationId = null,
    sourceType,
    sourceId,
    channel = "WHATSAPP",
    category = "LEAD_INQUIRY",
    priority = "NORMAL",
    title = "",
    snippet = "",
    participantName = "",
    participantPhone = "",
    unread = true,
    lastActivityAt = new Date(),
  }) {
    let item = await InboxItem.findOne({
      customerId,
      sourceType,
      sourceId,
    });

    const isNew = !item;

    if (isNew) {
      const inboxItemId = `INBOX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      item = new InboxItem({
        inboxItemId,
        customerId,
        locationId,
        sourceType,
        sourceId,
        channel,
        category,
        priority,
        title,
        snippet,
        participantName,
        participantPhone,
        status: "NEW",
        unread,
        unreadCount: 1,
        lastActivityAt,
      });

      // Initialize SLA timer
      await inboxSLAService.initializeSLA(item, lastActivityAt);

      // Auto-assign to eligible team member
      await assignmentEngine.routeAssignment({ inboxItem: item });
    } else {
      item.title = title || item.title;
      item.snippet = snippet || item.snippet;
      item.lastActivityAt = lastActivityAt;
      item.unread = unread;
      if (unread) item.unreadCount = (item.unreadCount || 0) + 1;

      // If item was resolved/closed, customer reply reopens it
      if (["RESOLVED", "CLOSED", "SNOOZED"].includes(item.status)) {
        item.status = item.assignedTo ? "ASSIGNED" : "NEW";
        // Re-initialize SLA on reopen
        await inboxSLAService.initializeSLA(item, lastActivityAt);
      } else {
        // Evaluate SLA
        const slaEval = inboxSLAService.evaluateStatus(item);
        item.slaStatus = slaEval.slaStatus;
      }
    }

    await item.save();

    // Broadcast update
    inboxEventService.emitInboxUpdate({
      eventName: isNew ? "inbox.item.created" : "inbox.item.updated",
      customerId,
      locationId,
      data: item.toObject(),
    });

    return item;
  }

  /**
   * Manually assigns or reassigns an inbox item
   */
  async assignItem({ inboxItemId, assignedTo, assignedTeam = null, actorId = null }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    item.assignedTo = assignedTo;
    if (assignedTeam) item.assignedTeam = assignedTeam;
    item.assignmentSource = "MANUAL";
    if (item.status === "NEW") item.status = "ASSIGNED";
    await item.save();

    inboxEventService.emitInboxUpdate({
      eventName: "inbox.item.assigned",
      customerId: item.customerId,
      locationId: item.locationId,
      data: { inboxItemId: item._id, assignedTo, assignedTeam },
    });

    return item;
  }

  /**
   * Updates operational status of an inbox item
   */
  async changeStatus({ inboxItemId, status, actorId = null }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    item.status = status;
    if (status === "RESOLVED") {
      item.resolvedAt = new Date();
      item.slaStatus = "COMPLETED";
    }
    await item.save();

    return item;
  }

  /**
   * Snoozes an inbox item until specified date
   */
  async snoozeItem({ inboxItemId, snoozedUntil, actorId = null }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    item.status = "SNOOZED";
    item.snoozedUntil = new Date(snoozedUntil);
    item.slaStatus = "PAUSED";
    await item.save();

    return item;
  }

  /**
   * Marks inbox item read
   */
  async markRead({ inboxItemId, userId = null }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    item.unread = false;
    item.unreadCount = 0;
    await item.save();

    return item;
  }

  /**
   * Adds an internal collaboration note
   */
  async addInternalNote({ inboxItemId, authorId, body, mentions = [], attachments = [] }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    const note = await InboxInternalNote.create({
      inboxItemId: item._id,
      customerId: item.customerId,
      locationId: item.locationId,
      authorId,
      body,
      mentions,
      attachments,
    });

    inboxEventService.emitInboxUpdate({
      eventName: "inbox.note.added",
      customerId: item.customerId,
      locationId: item.locationId,
      data: { inboxItemId: item._id, noteId: note._id, body },
    });

    return note;
  }

  /**
   * Human Takeover: Pauses automated bots and assigns the manager
   */
  async takeOverConversation({ inboxItemId, actorId }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    if (item.sourceType === "WHATSAPP_CONVERSATION") {
      const conv = await LeadConversation.findById(item.sourceId);
      if (conv) {
        conv.automationMode = "HUMAN";
        conv.state = "HUMAN_HANDOFF";
        await conv.save();

        // Pause active follow-up sequences
        await followUpSchedulerService.handleHumanOutbound(conv._id, actorId);
      }
    }

    item.status = "IN_PROGRESS";
    item.assignedTo = actorId;
    item.assignmentSource = "MANUAL";
    await item.save();

    return { success: true, item };
  }

  /**
   * Resumes conversation automation if eligible
   */
  async resumeConversationAutomation({ inboxItemId, actorId }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    if (item.sourceType === "WHATSAPP_CONVERSATION") {
      const conv = await LeadConversation.findById(item.sourceId);
      if (conv) {
        if (conv.state === "OPTED_OUT") {
          throw new Error("Cannot resume automation: Customer is OPTED_OUT.");
        }
        conv.automationMode = "AUTOMATED";
        conv.humanHandoffRequested = false;
        if (conv.state === "HUMAN_HANDOFF") {
          conv.state = "QUALIFYING";
        }
        await conv.save();
      }
    }

    return { success: true, item };
  }

  /**
   * Generates AI assist thread summary and suggested reply draft
   */
  async generateAIDraft({ inboxItemId }) {
    const item = await InboxItem.findById(inboxItemId);
    if (!item) throw new Error("Inbox item not found.");

    let draftText = "Hello! Thank you for reaching out to us. How can we assist you today?";
    let summary = item.snippet || "Customer inquiry thread";

    if (item.sourceType === "WHATSAPP_CONVERSATION") {
      const conv = await LeadConversation.findById(item.sourceId);
      const analysis = conv?.qualificationSummary || {};
      const intent = analysis.intent || "GENERAL_INQUIRY";

      if (intent === "PRICE_INQUIRY") {
        draftText = "Hello! Our pricing depends on your specific requirements. We'd love to share our catalog with you!";
      } else if (intent === "BOOK_APPOINTMENT") {
        draftText = "Hello! We would be happy to schedule an appointment for you. What date and time works best?";
      }

      summary = `Lead Intent: ${intent} | Score: ${analysis.qualificationScore || 50}/100`;
    }

    return {
      success: true,
      summary,
      suggestedDraft: draftText,
      disclaimer: "AI Generated Draft — Requires Manager Review Before Sending",
    };
  }
}

module.exports = new InboxService();
