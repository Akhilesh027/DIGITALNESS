/**
 * LeadFollowUpExecutionService.js
 * Execution handler for scheduled follow-up steps.
 * Revalidates all safety conditions at execution time (24h window, template approval, opt-out, race conditions).
 */

const LeadFollowUpSequence = require("../../models/LeadFollowUpSequence");
const LeadFollowUpPolicy = require("../../models/LeadFollowUpPolicy");
const LeadConversation = require("../../models/LeadConversation");
const Lead = require("../../models/Lead");
const LeadMessage = require("../../models/LeadMessage");
const WhatsAppTemplate = require("../../models/WhatsAppTemplate");
const followUpEligibilityEngine = require("./FollowUpEligibilityEngine");
const followUpCircuitBreaker = require("./FollowUpCircuitBreaker");
const followUpSchedulerService = require("./FollowUpSchedulerService");
const whatsAppConversationWindowService = require("../whatsapp/WhatsAppConversationWindowService");
const IntegrationManager = require("../integrations/IntegrationManager");
const WhatsAppCloudConnector = require("../integrations/connectors/WhatsAppCloudConnector");

class LeadFollowUpExecutionService {
  /**
   * Executes a scheduled follow-up step
   */
  async executeScheduledStep({ sequenceId, stepNumber, policyId, policyVersion }) {
    console.log(`[LeadFollowUpExecution] Executing Step ${stepNumber} for Sequence '${sequenceId}'`);

    const sequence = await LeadFollowUpSequence.findOne({ sequenceId });
    if (!sequence) {
      return { executed: false, reason: "SEQUENCE_NOT_FOUND" };
    }

    if (sequence.status !== "ACTIVE") {
      return { executed: false, reason: `SEQUENCE_STATUS_${sequence.status}` };
    }

    const policy = await LeadFollowUpPolicy.findById(sequence.policyId);
    if (!policy || !policy.enabled) {
      sequence.status = "STOPPED";
      sequence.stopReason = "POLICY_DISABLED";
      await sequence.save();
      return { executed: false, reason: "SKIPPED_POLICY_DISABLED" };
    }

    const stepIndex = sequence.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex === -1) {
      return { executed: false, reason: "STEP_NOT_IN_SEQUENCE" };
    }

    const currentStepDef = sequence.steps[stepIndex];
    if (["SENT", "DELIVERED", "READ"].includes(currentStepDef.status)) {
      return { executed: false, reason: "ALREADY_EXECUTED" };
    }

    const lead = await Lead.findById(sequence.leadId);
    const conversation = await LeadConversation.findById(sequence.conversationId);

    // 1. Circuit Breaker Check
    const circuit = followUpCircuitBreaker.isAllowed(conversation?.connectionId);
    if (!circuit.allowed) {
      console.warn(`[LeadFollowUpExecution] Dispatch blocked by Circuit Breaker for connection '${conversation?.connectionId}'`);
      return { executed: false, reason: circuit.reason };
    }

    // 2. Execution-Time Eligibility Revalidation (Race condition & response check)
    const eligibility = followUpEligibilityEngine.evaluateEligibility({
      lead,
      conversation,
      policy,
      stepNumber,
      atTime: new Date(),
    });

    if (!eligibility.eligible) {
      currentStepDef.status = "SKIPPED";
      currentStepDef.skipReason = `SKIPPED_${eligibility.reason}`;
      sequence.status = eligibility.reason.includes("TERMINAL") ? "COMPLETED" : "WAITING";
      sequence.stopReason = eligibility.reason;
      await sequence.save();
      return { executed: false, reason: currentStepDef.skipReason };
    }

    // 3. Max Staleness Check
    const maxAgeHours = policy.maxFollowupStepAgeHours || 48;
    const stepScheduledTime = new Date(currentStepDef.scheduledFor);
    const now = new Date();
    if (now.getTime() - stepScheduledTime.getTime() > maxAgeHours * 3600 * 1000) {
      currentStepDef.status = "SKIPPED";
      currentStepDef.skipReason = "SKIPPED_STALE";
      await sequence.save();
      return { executed: false, reason: "SKIPPED_STALE" };
    }

    // 4. 24-Hour Support Window & Template Decision
    const isWindowOpen = whatsAppConversationWindowService.isServiceWindowOpen(conversation, now);
    let messageType = currentStepDef.messageType || "TEXT";
    let textToSend = currentStepDef.serviceWindowText;
    let templateNameToUse = currentStepDef.templateName;

    if (!isWindowOpen) {
      // Outside 24h window: Template is MANDATORY
      messageType = "TEMPLATE";
      if (!templateNameToUse) {
        currentStepDef.status = "SKIPPED";
        currentStepDef.skipReason = "SKIPPED_TEMPLATE_REQUIRED_BUT_UNSPECIFIED";
        await sequence.save();
        return { executed: false, reason: "SKIPPED_TEMPLATE_REQUIRED_BUT_UNSPECIFIED" };
      }

      // Revalidate template approval status
      const templateDoc = await WhatsAppTemplate.findOne({
        customerId: sequence.customerId,
        name: templateNameToUse,
      });

      if (!templateDoc || templateDoc.status !== "APPROVED") {
        currentStepDef.status = "SKIPPED";
        currentStepDef.skipReason = "SKIPPED_TEMPLATE_UNAVAILABLE";
        await sequence.save();
        return { executed: false, reason: "SKIPPED_TEMPLATE_UNAVAILABLE" };
      }
    }

    // 5. Dispatch via IntegrationManager & WhatsAppCloudConnector
    let sendResult = null;
    try {
      sendResult = await IntegrationManager.executeWithConnection({
        customerId: sequence.customerId,
        locationId: sequence.locationId,
        platform: "WhatsApp",
        accountType: "WhatsAppPhoneNumber",
        operation: "whatsapp.sendMessage",
        executor: async (credentialContext, connection) => {
          const phoneNumberId = connection.platformAccountId;
          const recipientWaId = conversation.participantWaId;

          if (messageType === "TEMPLATE") {
            return WhatsAppCloudConnector.sendTemplate({
              credentialContext,
              phoneNumberId,
              recipientWaId,
              templateName: templateNameToUse,
              language: "en_US",
            });
          } else {
            return WhatsAppCloudConnector.sendText({
              credentialContext,
              phoneNumberId,
              recipientWaId,
              text: textToSend || "Hello! We are following up regarding your inquiry. Would you like assistance?",
            });
          }
        },
      });

      followUpCircuitBreaker.recordSuccess(conversation.connectionId);
    } catch (err) {
      followUpCircuitBreaker.recordFailure(conversation.connectionId, err);
      currentStepDef.deliveryAttempts += 1;
      currentStepDef.status = "FAILED";
      currentStepDef.skipReason = err.message;
      await sequence.save();
      throw err;
    }

    // 6. Record Success & LeadMessage
    const providerMessageId = sendResult?.messages?.[0]?.id || `wamid.HBgL${Date.now()}`;

    const leadMsg = await LeadMessage.create({
      conversationId: conversation._id,
      customerId: sequence.customerId,
      locationId: sequence.locationId,
      providerMessageId,
      direction: "OUTBOUND",
      sender: conversation.phoneNumberId,
      recipient: conversation.participantWaId,
      messageType,
      text: textToSend || `Template: ${templateNameToUse}`,
      status: "SENT",
      generatedBy: "AUTOMATION_POLICY",
      metadata: { sequenceId: sequence.sequenceId, stepNumber, policyVersion: sequence.policyVersion },
    });

    currentStepDef.status = "SENT";
    currentStepDef.sentAt = new Date();
    currentStepDef.executedAt = new Date();
    currentStepDef.providerMessageId = providerMessageId;
    currentStepDef.leadMessageId = leadMsg._id;
    sequence.lastExecutionAt = new Date();

    // 7. Schedule Next Step or Mark Sequence Complete
    const nextStepNum = stepNumber + 1;
    const hasNextStep = sequence.steps.some((s) => s.stepNumber === nextStepNum);

    if (hasNextStep && nextStepNum <= (policy.maxAttempts || 3)) {
      await followUpSchedulerService.scheduleStep({
        sequence,
        stepNumber: nextStepNum,
        policy,
      });
    } else {
      sequence.status = "COMPLETED";
      sequence.completedAt = new Date();
      sequence.nextScheduledAt = null;
    }

    await sequence.save();
    console.log(`[LeadFollowUpExecution] Successfully sent Step ${stepNumber} for Sequence '${sequenceId}'. wamid: ${providerMessageId}`);

    return {
      executed: true,
      sequenceId: sequence.sequenceId,
      stepNumber,
      providerMessageId,
      status: "SENT",
      isCompleted: sequence.status === "COMPLETED",
    };
  }
}

module.exports = new LeadFollowUpExecutionService();
