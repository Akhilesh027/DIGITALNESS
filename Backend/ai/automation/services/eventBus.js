/**
 * eventBus.js
 * Lightweight Pub/Sub event bus for triggering real-time agency automations.
 */

const EventEmitter = require("events");

class AutomationEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emits an automation event with standardized payload structure.
   */
  emitEvent(eventName, payload = {}) {
    const eventPayload = {
      event: eventName,
      timestamp: new Date(),
      ...payload,
    };
    console.log(`[AutomationEventBus] Event emitted: ${eventName}`);
    this.emit(eventName, eventPayload);
    this.emit("*", eventPayload);
  }
}

const eventBus = new AutomationEventBus();

// Standard System Events Definition
eventBus.EVENTS = {
  LEAD_CREATED: "lead.created",
  LEAD_CONVERTED: "lead.converted",
  CUSTOMER_CREATED: "customer.created",
  TASK_CREATED: "task.created",
  TASK_OVERDUE: "task.overdue",
  TASK_COMPLETED: "task.completed",
  CONTENT_APPROVED: "content.approved",
  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_OVERDUE: "payment.overdue",
  SLA_BREACH: "sla.breach",
};

module.exports = eventBus;
