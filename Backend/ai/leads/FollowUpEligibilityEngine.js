/**
 * FollowUpEligibilityEngine.js
 * Pure deterministic eligibility evaluator for WhatsApp lead follow-up sequences.
 * Zero external API calls.
 */

const whatsAppConversationWindowService = require("../whatsapp/WhatsAppConversationWindowService");

class FollowUpEligibilityEngine {
  /**
   * Evaluates if a lead and conversation qualify to start or continue a follow-up sequence
   */
  evaluateEligibility({ lead, conversation, policy, stepNumber = 1, atTime = new Date() }) {
    if (!lead) {
      return { eligible: false, reason: "LEAD_NOT_FOUND" };
    }

    if (!conversation) {
      return { eligible: false, reason: "CONVERSATION_NOT_FOUND" };
    }

    if (!policy) {
      return { eligible: false, reason: "POLICY_NOT_FOUND" };
    }

    // 1. Policy Status & State
    if (!policy.enabled || policy.status !== "APPROVED") {
      return { eligible: false, reason: "POLICY_NOT_APPROVED_OR_DISABLED" };
    }

    // 2. Tenant & Branch Isolation
    if (lead.customerId?.toString() !== policy.customerId?.toString() ||
        conversation.customerId?.toString() !== policy.customerId?.toString()) {
      return { eligible: false, reason: "TENANT_MISMATCH" };
    }

    if (policy.locationId && conversation.locationId &&
        conversation.locationId.toString() !== policy.locationId.toString()) {
      return { eligible: false, reason: "LOCATION_MISMATCH" };
    }

    // 3. Human Takeover / Handoff
    if (conversation.automationMode === "HUMAN" || conversation.state === "HUMAN_HANDOFF" || conversation.humanHandoffRequested) {
      return { eligible: false, reason: "HUMAN_HANDOFF_ACTIVE", humanHandoff: true };
    }

    // 4. Opt-Out Suppression
    if (conversation.state === "OPTED_OUT" || conversation.marketingOptOutAt) {
      return { eligible: false, reason: "CUSTOMER_OPTED_OUT", optedOut: true };
    }

    // 5. Conversion / Closed Lead State
    const normalizedLeadStatus = (lead.status || "").toUpperCase();
    const terminalStates = ["WON", "CONVERTED", "CLOSED", "OWN CLOSE", "LOST", "OWN LOSS"];
    if (terminalStates.includes(normalizedLeadStatus)) {
      return { eligible: false, reason: `LEAD_TERMINAL_STATE_${normalizedLeadStatus}` };
    }

    const conversationTerminalStates = ["CONVERTED", "CLOSED", "OPTED_OUT"];
    if (conversationTerminalStates.includes((conversation.state || "").toUpperCase())) {
      return { eligible: false, reason: `CONVERSATION_TERMINAL_STATE_${conversation.state}` };
    }

    // 6. Qualification Score Check
    const leadScore = conversation.qualificationSummary?.qualificationScore || 50;
    const minScore = policy.eligibilityRules?.minScore || 0;
    if (leadScore < minScore) {
      return { eligible: false, reason: "LEAD_SCORE_BELOW_THRESHOLD", leadScore, minScore };
    }

    // 7. Max Attempts Check
    const maxAttempts = policy.maxAttempts || 3;
    if (stepNumber > maxAttempts) {
      return { eligible: false, reason: "MAX_ATTEMPTS_EXCEEDED", stepNumber, maxAttempts };
    }

    // 8. 24-Hour Window & Template Status
    const isWindowOpen = whatsAppConversationWindowService.isServiceWindowOpen(conversation, atTime);
    const requiresTemplate = !isWindowOpen;

    return {
      eligible: true,
      reason: "ELIGIBLE",
      isWindowOpen,
      requiresTemplate,
      humanHandoff: false,
      leadScore,
      currentLeadStatus: lead.status,
      conversationState: conversation.state,
    };
  }
}

module.exports = new FollowUpEligibilityEngine();
