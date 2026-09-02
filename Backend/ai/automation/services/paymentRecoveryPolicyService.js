/**
 * paymentRecoveryPolicyService.js
 * Stage Progression and Anti-Spam Safety Governance Service for Payment Recovery.
 */

class PaymentRecoveryPolicyService {
  /**
   * Determines the eligible recovery stage for an invoice based on age and previous contact.
   */
  determineStage({ ageInDays, followup = null }) {
    if (ageInDays < -3) return null; // Too early
    if (ageInDays < 0) return "T_MINUS_3_FRIENDLY";
    if (ageInDays === 0) return "DUE_TODAY_REMINDER";
    if (ageInDays <= 3) return "OVERDUE_3D_POLITE";
    if (ageInDays <= 7) return "OVERDUE_7D_PRIORITY";
    if (ageInDays <= 15) return "ESCALATION_15D_MANAGER";
    return "CRITICAL_30D_REVIEW";
  }

  /**
   * Evaluates if a reminder can be safely sent without spamming or violating financial rules.
   */
  canSendReminder({ invoice, balance, followup = null, stage }) {
    // 1. Never send if balance is 0 or status is PAID
    if (balance <= 0 || invoice.paymentStatus === "PAID") {
      return { allowed: false, reason: "Invoice is fully paid." };
    }

    // 2. Never send if invoice is DISPUTED
    if (invoice.paymentStatus === "DISPUTED" || followup?.dispute?.active) {
      return { allowed: false, reason: "Invoice is currently disputed; awaiting manager resolution." };
    }

    // 3. Never send if there is an active unexpired promise to pay
    if (followup && followup.promises) {
      const now = new Date();
      const activePromise = followup.promises.find(
        (p) => p.status === "PENDING" && new Date(p.date) >= now
      );
      if (activePromise) {
        return {
          allowed: false,
          reason: `Active promise to pay on ${new Date(activePromise.date).toLocaleDateString()}; reminders paused.`,
        };
      }
    }

    if (!followup) {
      return { allowed: true, reason: "Eligible for initial contact." };
    }

    // 4. Never send identical stage twice
    const alreadySentStage = (followup.contactAttempts || []).some(
      (a) => a.type === stage && ["SENT", "APPROVED"].includes(a.status)
    );
    if (alreadySentStage) {
      return { allowed: false, reason: `Reminder for stage '${stage}' has already been delivered.` };
    }

    // 5. Never send multiple recovery reminders on the exact same calendar day
    if (followup.lastContactAt) {
      const lastContactDate = new Date(followup.lastContactAt).toDateString();
      const todayDate = new Date().toDateString();
      if (lastContactDate === todayDate) {
        return { allowed: false, reason: "A reminder has already been sent to client today." };
      }
    }

    return { allowed: true, reason: "All safety and anti-spam checks passed." };
  }
}

module.exports = new PaymentRecoveryPolicyService();
