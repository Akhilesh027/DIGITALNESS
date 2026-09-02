/**
 * InboxSLAService.js
 * Manages first-response and resolution SLA timers, AT_RISK thresholds, and breach escalations.
 */

const SLAPolicy = require("../../models/SLAPolicy");
const InboxItem = require("../../models/InboxItem");

class InboxSLAService {
  /**
   * Calculates due dates for an inbox item based on applicable SLA policy
   */
  async initializeSLA(inboxItem, startTime = new Date()) {
    const policy = await this.resolvePolicy(inboxItem);
    const start = new Date(startTime);

    const firstResponseMins = policy?.firstResponseMinutes || 30;
    const resolutionMins = policy?.resolutionMinutes || 1440;

    const firstResponseDueAt = new Date(start.getTime() + firstResponseMins * 60 * 1000);
    const resolutionDueAt = new Date(start.getTime() + resolutionMins * 60 * 1000);

    inboxItem.firstResponseDueAt = firstResponseDueAt;
    inboxItem.resolutionDueAt = resolutionDueAt;
    inboxItem.slaStatus = "ON_TRACK";
    inboxItem.escalationLevel = "NONE";

    return inboxItem;
  }

  /**
   * Evaluates current SLA status for an inbox item
   */
  evaluateStatus(inboxItem, now = new Date()) {
    if (inboxItem.status === "RESOLVED" || inboxItem.status === "CLOSED") {
      return { slaStatus: "COMPLETED", remainingMinutes: 0, percentConsumed: 100 };
    }

    if (inboxItem.status === "SNOOZED" || inboxItem.status === "WAITING_CUSTOMER") {
      return { slaStatus: "PAUSED", remainingMinutes: null };
    }

    const dueAt = inboxItem.firstResponseHandledAt ? inboxItem.resolutionDueAt : inboxItem.firstResponseDueAt;
    if (!dueAt) {
      return { slaStatus: "ON_TRACK", remainingMinutes: null };
    }

    const remainingMs = new Date(dueAt).getTime() - new Date(now).getTime();
    const remainingMinutes = Math.round(remainingMs / (60 * 1000));

    if (remainingMs <= 0) {
      return {
        slaStatus: "BREACHED",
        remainingMinutes: 0,
        escalationLevel: "LEVEL_1",
      };
    }

    // Check AT_RISK threshold (e.g. less than 20% time remaining)
    const totalMinutes = 30; // standard baseline
    if (remainingMinutes <= totalMinutes * 0.2) {
      return {
        slaStatus: "AT_RISK",
        remainingMinutes,
        escalationLevel: "NONE",
      };
    }

    return {
      slaStatus: "ON_TRACK",
      remainingMinutes,
      escalationLevel: "NONE",
    };
  }

  /**
   * Marks first response handled
   */
  async markFirstResponse(inboxItem) {
    if (!inboxItem.firstResponseHandledAt) {
      inboxItem.firstResponseHandledAt = new Date();
      if (inboxItem.status === "NEW") {
        inboxItem.status = "IN_PROGRESS";
      }
      const evalRes = this.evaluateStatus(inboxItem);
      inboxItem.slaStatus = evalRes.slaStatus;
    }
    return inboxItem;
  }

  async resolvePolicy(inboxItem) {
    let policy = await SLAPolicy.findOne({
      customerId: inboxItem.customerId,
      sourceType: { $in: [inboxItem.sourceType, "ALL"] },
      priority: { $in: [inboxItem.priority, "ALL"] },
      enabled: true,
    }).sort({ priority: -1, createdAt: -1 });

    if (!policy) {
      policy = await SLAPolicy.findOne({ customerId: null, enabled: true }).sort({ createdAt: -1 });
    }

    return policy;
  }
}

module.exports = new InboxSLAService();
