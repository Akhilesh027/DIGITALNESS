/**
 * paymentPriorityService.js
 * Multivariate 0-100 Collection Priority Scoring Service.
 */

class PaymentPriorityService {
  /**
   * Calculates a 0-100 collection priority score for an invoice/follow-up.
   */
  calculatePriority({ invoice, balance, agingBucket, followup = null }) {
    if (invoice.paymentStatus === "PAID" || balance <= 0) {
      return 0;
    }

    let score = 0;

    // 1. AGING SEVERITY (0 - 30 Points)
    switch (agingBucket) {
      case "OVERDUE_30_PLUS":
        score += 30;
        break;
      case "OVERDUE_16_30":
        score += 25;
        break;
      case "OVERDUE_8_15":
        score += 20;
        break;
      case "OVERDUE_4_7":
        score += 15;
        break;
      case "OVERDUE_1_3":
        score += 10;
        break;
      case "DUE_TODAY":
        score += 8;
        break;
      default:
        score += 4;
        break;
    }

    // 2. OUTSTANDING BALANCE WEIGHT (0 - 20 Points)
    if (balance >= 50000) {
      score += 20;
    } else if (balance >= 25000) {
      score += 15;
    } else if (balance >= 10000) {
      score += 10;
    } else {
      score += 5;
    }

    // 3. BROKEN PROMISE PENALTY (0 - 20 Points)
    if (followup && followup.promises) {
      const hasBrokenPromise = followup.promises.some((p) => p.status === "BROKEN");
      if (hasBrokenPromise) {
        score += 20;
      }
    }

    // 4. PREVIOUS FOLLOW-UP ATTEMPTS (0 - 10 Points)
    if (followup && followup.contactAttempts) {
      const attemptsCount = followup.contactAttempts.length;
      if (attemptsCount >= 3) score += 10;
      else if (attemptsCount >= 1) score += 5;
    }

    // 5. DISPUTED STATUS CHECK
    if (invoice.paymentStatus === "DISPUTED" || followup?.dispute?.active) {
      // Disputed accounts require manager intervention rather than algorithmic priority
      return 15;
    }

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new PaymentPriorityService();
