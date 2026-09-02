/**
 * FollowUpSchedulerService.js
 * Manages the lifecycle of lead follow-up sequences, quiet hours scheduling,
 * BullMQ delayed jobs, and immediate cancellation upon customer reply or conversion.
 */

const LeadFollowUpPolicy = require("../../models/LeadFollowUpPolicy");
const LeadFollowUpSequence = require("../../models/LeadFollowUpSequence");
const Lead = require("../../models/Lead");
const LeadConversation = require("../../models/LeadConversation");
const followUpEligibilityEngine = require("./FollowUpEligibilityEngine");
const QueueRegistry = require("../queue/QueueRegistry");

class FollowUpSchedulerService {
  /**
   * Starts a new automated follow-up sequence for a qualified lead
   */
  async startSequence({ leadId, conversationId, policyId = null, customerId = null, locationId = null }) {
    const lead = await Lead.findById(leadId);
    const conversation = await LeadConversation.findById(conversationId);

    if (!lead || !conversation) {
      return { success: false, reason: "LEAD_OR_CONVERSATION_NOT_FOUND" };
    }

    // Resolve matching approved policy if not explicitly passed
    let policy = null;
    if (policyId) {
      policy = await LeadFollowUpPolicy.findById(policyId);
    } else {
      policy = await LeadFollowUpPolicy.findOne({
        customerId: lead.customerId,
        enabled: true,
        status: "APPROVED",
      }).sort({ updatedAt: -1 });
    }

    if (!policy) {
      return { success: false, reason: "NO_ACTIVE_APPROVED_POLICY" };
    }

    // Eligibility check
    const eligibility = followUpEligibilityEngine.evaluateEligibility({
      lead,
      conversation,
      policy,
      stepNumber: 1,
    });

    if (!eligibility.eligible) {
      return { success: false, reason: eligibility.reason };
    }

    // Check if an active sequence already exists for this conversation
    const existingSeq = await LeadFollowUpSequence.findOne({
      conversationId: conversation._id,
      status: { $in: ["ACTIVE", "WAITING"] },
    });

    if (existingSeq) {
      return {
        success: true,
        alreadyActive: true,
        sequenceId: existingSeq.sequenceId,
        sequence: existingSeq,
      };
    }

    const sequenceId = `SEQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build initial steps definition from policy
    const policySteps = policy.steps || [];
    if (policySteps.length === 0) {
      return { success: false, reason: "POLICY_HAS_NO_STEPS" };
    }

    const sequenceSteps = policySteps.map((s, idx) => ({
      stepNumber: s.stepNumber || idx + 1,
      scheduledFor: new Date(), // will be calculated for step 1
      messageType: s.messageType,
      templateName: s.templateName,
      serviceWindowText: s.serviceWindowText,
      status: "PENDING",
    }));

    const sequence = new LeadFollowUpSequence({
      sequenceId,
      customerId: lead.customerId,
      locationId: lead.locationId || conversation.locationId,
      leadId: lead._id,
      conversationId: conversation._id,
      policyId: policy._id,
      policyVersion: policy.version || 1,
      status: "ACTIVE",
      currentStep: 1,
      startedAt: new Date(),
      steps: sequenceSteps,
    });

    // Schedule Step 1
    await this.scheduleStep({ sequence, stepNumber: 1, policy });
    await sequence.save();

    console.log(`[FollowUpScheduler] Sequence '${sequenceId}' started for lead '${lead._id}' under Policy V${policy.version}`);
    return {
      success: true,
      sequenceId,
      policyVersion: policy.version,
      nextScheduledAt: sequence.nextScheduledAt,
      sequence,
    };
  }

  /**
   * Schedules a specific step using BullMQ delayed jobs
   */
  async scheduleStep({ sequence, stepNumber, policy }) {
    const stepIndex = sequence.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex === -1) return null;

    const policyStep = policy.steps.find((s) => s.stepNumber === stepNumber);
    if (!policyStep) return null;

    const delayMinutes = policyStep.delayMinutes || 120;
    const baseTime = sequence.lastExecutionAt || sequence.startedAt || new Date();
    let scheduledTime = new Date(baseTime.getTime() + delayMinutes * 60 * 1000);

    // Apply Quiet Hours adjustment
    if (policy.quietHours?.enabled) {
      scheduledTime = this.adjustForQuietHours(scheduledTime, policy.quietHours);
    }

    const now = new Date();
    const delayMs = Math.max(0, scheduledTime.getTime() - now.getTime());

    const idempotencyKey = `followup_${sequence.sequenceId}_step_${stepNumber}_v${sequence.policyVersion}`;

    // BullMQ delayed job envelope
    const envelope = {
      customerId: sequence.customerId.toString(),
      locationId: sequence.locationId ? sequence.locationId.toString() : null,
      operation: "whatsapp.sendMessage",
      followUpType: "AUTOMATED_STEP",
      sequenceId: sequence.sequenceId,
      stepNumber,
      policyId: policy._id.toString(),
      policyVersion: sequence.policyVersion,
      conversationId: sequence.conversationId.toString(),
      leadId: sequence.leadId.toString(),
      idempotencyKey,
    };

    let jobId = null;
    try {
      const queue = QueueRegistry.getQueue("whatsapp");
      if (queue) {
        const job = await QueueRegistry.enqueue("whatsapp", "whatsapp.followup.execute", envelope, {
          delay: delayMs,
          jobId: idempotencyKey,
        });
        jobId = job?.id || idempotencyKey;
      }
    } catch (e) {
      console.warn("[FollowUpScheduler BullMQ Queue Note]:", e.message);
      jobId = idempotencyKey;
    }

    sequence.steps[stepIndex].scheduledFor = scheduledTime;
    sequence.steps[stepIndex].status = "SCHEDULED";
    sequence.steps[stepIndex].bullmqJobId = jobId;
    sequence.nextScheduledAt = scheduledTime;
    sequence.currentStep = stepNumber;

    return sequence;
  }

  /**
   * Adjusts scheduled time to respect client quiet hours (e.g. 09:00 - 19:00)
   */
  adjustForQuietHours(targetDate, quietHours) {
    const startHour = quietHours.startHour ?? 9;
    const endHour = quietHours.endHour ?? 19;

    const adjusted = new Date(targetDate);
    const hour = adjusted.getHours();

    if (hour < startHour) {
      // Too early: push to startHour today
      adjusted.setHours(startHour, 0, 0, 0);
    } else if (hour >= endHour) {
      // Too late: push to startHour tomorrow
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(startHour, 0, 0, 0);
    }

    return adjusted;
  }

  /**
   * Stops/cancels pending follow-ups immediately upon customer reply
   */
  async handleCustomerResponse(conversationId) {
    const sequences = await LeadFollowUpSequence.find({
      conversationId,
      status: { $in: ["ACTIVE", "WAITING"] },
    });

    for (const seq of sequences) {
      seq.status = "WAITING";
      seq.stoppedAt = new Date();
      seq.stopReason = "CUSTOMER_RESPONDED";
      seq.nextScheduledAt = null;

      // Mark unexecuted steps as skipped
      seq.steps.forEach((st) => {
        if (["PENDING", "SCHEDULED"].includes(st.status)) {
          st.status = "SKIPPED";
          st.skipReason = "SKIPPED_CUSTOMER_RESPONDED";
        }
      });

      await seq.save();
      console.log(`[FollowUpScheduler] Sequence '${seq.sequenceId}' stopped: Customer responded.`);
    }

    return { stoppedCount: sequences.length };
  }

  /**
   * Pauses automation when a human manager takes over or sends a message
   */
  async handleHumanOutbound(conversationId, actorId = null) {
    const sequences = await LeadFollowUpSequence.find({
      conversationId,
      status: "ACTIVE",
    });

    for (const seq of sequences) {
      seq.status = "PAUSED_HUMAN_HANDOFF";
      seq.stoppedAt = new Date();
      seq.stopReason = "HUMAN_HANDOFF";
      seq.nextScheduledAt = null;

      seq.steps.forEach((st) => {
        if (["PENDING", "SCHEDULED"].includes(st.status)) {
          st.status = "SKIPPED";
          st.skipReason = "SKIPPED_HUMAN_HANDOFF";
        }
      });

      await seq.save();
    }

    return { pausedCount: sequences.length };
  }

  /**
   * Stops sequence on deal conversion (WON, APPOINTMENT_BOOKED)
   */
  async handleConversion(leadId, conversionState = "WON") {
    const sequences = await LeadFollowUpSequence.find({
      leadId,
      status: { $in: ["ACTIVE", "WAITING"] },
    });

    for (const seq of sequences) {
      seq.status = "COMPLETED";
      seq.completedAt = new Date();
      seq.stopReason = `CONVERTED_${conversionState.toUpperCase()}`;
      seq.nextScheduledAt = null;

      seq.steps.forEach((st) => {
        if (["PENDING", "SCHEDULED"].includes(st.status)) {
          st.status = "SKIPPED";
          st.skipReason = "SKIPPED_CONVERTED";
        }
      });

      await seq.save();
    }

    return { completedCount: sequences.length };
  }

  /**
   * Stops sequence on explicit opt-out (STOP, UNSUBSCRIBE)
   */
  async handleOptOut(conversationId) {
    const sequences = await LeadFollowUpSequence.find({
      conversationId,
      status: { $in: ["ACTIVE", "WAITING"] },
    });

    for (const seq of sequences) {
      seq.status = "OPTED_OUT";
      seq.stoppedAt = new Date();
      seq.stopReason = "OPTED_OUT";
      seq.nextScheduledAt = null;

      seq.steps.forEach((st) => {
        if (["PENDING", "SCHEDULED"].includes(st.status)) {
          st.status = "SKIPPED";
          st.skipReason = "SKIPPED_OPTED_OUT";
        }
      });

      await seq.save();
    }

    return { optedOutCount: sequences.length };
  }
}

module.exports = new FollowUpSchedulerService();
