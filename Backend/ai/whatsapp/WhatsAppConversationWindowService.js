/**
 * WhatsAppConversationWindowService.js
 * Tracks and enforces Meta's 24-hour rolling Customer Service Window.
 * Free-form replies are allowed only when the window is OPEN.
 * Outside this window, WhatsApp requires an approved template.
 */

const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

class WhatsAppConversationWindowService {
  /**
   * Opens or refreshes the 24-hour customer service window upon inbound message
   */
  openOrRefreshWindow(conversation, inboundTimestamp = new Date()) {
    const timestamp = inboundTimestamp instanceof Date ? inboundTimestamp : new Date(inboundTimestamp);
    const expiresAt = new Date(timestamp.getTime() + WINDOW_DURATION_MS);

    const isFirstOpen = !conversation.serviceWindowOpenedAt || !this.isServiceWindowOpen(conversation, timestamp);

    conversation.lastInboundAt = timestamp;
    conversation.lastMessageAt = timestamp;
    if (isFirstOpen) {
      conversation.serviceWindowOpenedAt = timestamp;
    }
    conversation.serviceWindowExpiresAt = expiresAt;

    return {
      openedAt: conversation.serviceWindowOpenedAt,
      expiresAt: conversation.serviceWindowExpiresAt,
      isOpen: true,
      refreshed: !isFirstOpen,
    };
  }

  /**
   * Checks if the 24-hour support window is currently open
   */
  isServiceWindowOpen(conversation, atTime = new Date()) {
    if (!conversation || !conversation.serviceWindowExpiresAt) {
      return false;
    }
    const checkTime = atTime instanceof Date ? atTime : new Date(atTime);
    const expiresAt = new Date(conversation.serviceWindowExpiresAt);
    return expiresAt.getTime() > checkTime.getTime();
  }

  /**
   * Checks if an outbound message requires an approved WhatsApp template
   */
  requiresTemplate(conversation, atTime = new Date()) {
    return !this.isServiceWindowOpen(conversation, atTime);
  }

  /**
   * Returns rich window diagnostics
   */
  getWindowStatus(conversation, atTime = new Date()) {
    const checkTime = atTime instanceof Date ? atTime : new Date(atTime);
    const isOpen = this.isServiceWindowOpen(conversation, checkTime);
    const expiresAt = conversation?.serviceWindowExpiresAt ? new Date(conversation.serviceWindowExpiresAt) : null;
    const remainingMs = isOpen && expiresAt ? Math.max(0, expiresAt.getTime() - checkTime.getTime()) : 0;

    return {
      isOpen,
      windowStatus: isOpen ? "OPEN" : "CLOSED",
      expiresAt,
      remainingMs,
      remainingMinutes: Math.floor(remainingMs / 60000),
      requiresTemplate: !isOpen,
    };
  }
}

module.exports = new WhatsAppConversationWindowService();
