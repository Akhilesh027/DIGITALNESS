/**
 * InboxEventService.js
 * Domain event dispatcher for Unified Inbox.
 * Emits internal domain events and securely notifies connected WebSocket clients.
 */

const EventEmitter = require("events");

class InboxEventService extends EventEmitter {
  constructor() {
    super();
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Emits a real-time event to customer/branch room
   */
  emitInboxUpdate({ eventName, customerId, locationId = null, data = {} }) {
    this.emit(eventName, { customerId, locationId, data });

    if (this.io) {
      // Broadcast to specific customer room
      const safeData = this.sanitizeForSocket(data);
      this.io.to(`customer_${customerId}`).emit(eventName, safeData);
      this.io.emit(eventName, safeData); // Global agency dashboard room
    }
  }

  /**
   * Sanitizes payloads to guarantee ZERO tokens or database credentials are broadcast
   */
  sanitizeForSocket(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const clean = { ...obj };
    delete clean.accessToken;
    delete clean.refreshToken;
    delete clean.clientSecret;
    delete clean.appSecret;
    delete clean.password;
    delete clean.encryptedData;
    return clean;
  }
}

module.exports = new InboxEventService();
