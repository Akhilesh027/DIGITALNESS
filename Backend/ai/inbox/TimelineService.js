/**
 * TimelineService.js
 * Chronological aggregator unifying multi-source records (messages, reviews, internal notes, SLA alerts)
 * into a single operational timeline for the Unified Inbox.
 */

const LeadMessage = require("../../models/LeadMessage");
const InboxInternalNote = require("../../models/InboxInternalNote");
const GoogleBusinessReview = require("../../models/GoogleBusinessReview");

class TimelineService {
  /**
   * Builds an aggregated chronological timeline for an inbox item
   */
  async getTimelineForItem(inboxItem) {
    const timeline = [];

    // 1. WhatsApp Timeline
    if (inboxItem.sourceType === "WHATSAPP_CONVERSATION") {
      const messages = await LeadMessage.find({ conversationId: inboxItem.sourceId })
        .sort({ createdAt: 1 })
        .lean();

      messages.forEach((msg) => {
        timeline.push({
          id: `msg_${msg._id}`,
          type: msg.direction === "INBOUND" ? "CUSTOMER_MESSAGE" : "AGENT_REPLY",
          channel: "WHATSAPP",
          text: msg.text,
          messageType: msg.messageType,
          status: msg.status,
          sender: msg.sender,
          recipient: msg.recipient,
          timestamp: msg.createdAt,
          generatedBy: msg.generatedBy,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
        });
      });
    }

    // 2. GBP Review Timeline
    if (inboxItem.sourceType === "GBP_REVIEW") {
      const review = await GoogleBusinessReview.findById(inboxItem.sourceId).lean();
      if (review) {
        timeline.push({
          id: `rev_${review._id}`,
          type: "CUSTOMER_REVIEW",
          channel: "GOOGLE_BUSINESS",
          starRating: review.starRating,
          comment: review.comment,
          reviewer: review.reviewer,
          timestamp: review.reviewCreateTime || review.createdAt,
        });

        if (review.reply?.comment) {
          timeline.push({
            id: `reply_${review._id}`,
            type: "AGENT_REPLY",
            channel: "GOOGLE_BUSINESS",
            text: review.reply.comment,
            status: review.reply.status,
            timestamp: review.reply.updatedAt || review.updatedAt,
          });
        }
      }
    }

    // 3. Internal Notes
    const notes = await InboxInternalNote.find({ inboxItemId: inboxItem._id })
      .populate("authorId", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    notes.forEach((note) => {
      timeline.push({
        id: `note_${note._id}`,
        type: "INTERNAL_NOTE",
        text: note.body,
        author: note.authorId?.name || "Team Member",
        authorRole: note.authorId?.role,
        mentions: note.mentions,
        timestamp: note.createdAt,
      });
    });

    // Sort strictly by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timeline;
  }
}

module.exports = new TimelineService();
