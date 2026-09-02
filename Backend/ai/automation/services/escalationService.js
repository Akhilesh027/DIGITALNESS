/**
 * escalationService.js
 * Multi-Tier SLA Escalation Ladder and Notification Dispatcher.
 */

const eventBus = require("./eventBus");

class EscalationService {
  /**
   * Evaluates the appropriate escalation level and emits escalation events if needed.
   */
  evaluateEscalation({ incident, work, hoursRemaining }) {
    let targetLevel = 0;

    if (hoursRemaining < -24) {
      targetLevel = 4; // Super Admin / Director Escalation (>24h overdue)
    } else if (hoursRemaining < 0) {
      targetLevel = 3; // Manager Critical Alert (Breached)
    } else if (hoursRemaining <= 8) {
      targetLevel = 2; // Manager Notification (<8h)
    } else if (hoursRemaining <= 24) {
      targetLevel = 1; // Assignee Reminder (<24h)
    }

    const currentLevel = incident.escalationLevel || 0;
    const shouldEscalate = targetLevel > currentLevel;

    if (shouldEscalate) {
      incident.escalationLevel = targetLevel;
      eventBus.emitEvent(eventBus.EVENTS.SLA_BREACH, {
        incidentId: incident._id,
        workId: work._id,
        workTitle: work.title,
        customerId: work.customer,
        escalationLevel: targetLevel,
        riskScore: incident.riskScore,
      });
    }

    return {
      escalationLevel: targetLevel,
      escalated: shouldEscalate,
    };
  }
}

module.exports = new EscalationService();
