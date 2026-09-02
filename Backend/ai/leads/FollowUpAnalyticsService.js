/**
 * FollowUpAnalyticsService.js
 * Aggregates follow-up automation performance metrics without claiming false causation.
 * Tracks sent, delivered, read, responses after follow-up, and conversions after follow-up.
 */

const LeadFollowUpSequence = require("../../models/LeadFollowUpSequence");
const LeadMessage = require("../../models/LeadMessage");

class FollowUpAnalyticsService {
  /**
   * Returns aggregated follow-up metrics for a customer / branch
   */
  async getMetrics({ customerId, locationId = null, policyId = null, startDate = null, endDate = null }) {
    const query = {};
    if (customerId) query.customerId = customerId;
    if (locationId) query.locationId = locationId;
    if (policyId) query.policyId = policyId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [sequences, totalCount] = await Promise.all([
      LeadFollowUpSequence.find(query).lean(),
      LeadFollowUpSequence.countDocuments(query),
    ]);

    let totalStepsScheduled = 0;
    let totalStepsSent = 0;
    let totalStepsSkipped = 0;
    let responsesAfterFollowUp = 0;
    let conversionsAfterFollowUp = 0;
    let optOuts = 0;
    let humanHandoffs = 0;

    sequences.forEach((seq) => {
      if (seq.stopReason === "CUSTOMER_RESPONDED") responsesAfterFollowUp += 1;
      if (seq.stopReason?.includes("CONVERTED")) conversionsAfterFollowUp += 1;
      if (seq.status === "OPTED_OUT" || seq.stopReason === "OPTED_OUT") optOuts += 1;
      if (seq.status === "PAUSED_HUMAN_HANDOFF" || seq.stopReason === "HUMAN_HANDOFF") humanHandoffs += 1;

      (seq.steps || []).forEach((st) => {
        if (st.status === "SCHEDULED" || st.status === "SENT") totalStepsScheduled += 1;
        if (st.status === "SENT") totalStepsSent += 1;
        if (st.status === "SKIPPED") totalStepsSkipped += 1;
      });
    });

    const activeSequences = sequences.filter((s) => s.status === "ACTIVE").length;
    const completedSequences = sequences.filter((s) => s.status === "COMPLETED").length;

    const responseRate = totalCount > 0 ? ((responsesAfterFollowUp / totalCount) * 100).toFixed(1) : "0.0";
    const conversionRate = totalCount > 0 ? ((conversionsAfterFollowUp / totalCount) * 100).toFixed(1) : "0.0";
    const optOutRate = totalCount > 0 ? ((optOuts / totalCount) * 100).toFixed(1) : "0.0";

    return {
      totalSequences: totalCount,
      activeSequences,
      completedSequences,
      totalStepsScheduled,
      totalStepsSent,
      totalStepsSkipped,
      responsesAfterFollowUp,
      responseRate: `${responseRate}%`,
      conversionsAfterFollowUp,
      conversionRate: `${conversionRate}%`,
      optOuts,
      optOutRate: `${optOutRate}%`,
      humanHandoffs,
    };
  }
}

module.exports = new FollowUpAnalyticsService();
