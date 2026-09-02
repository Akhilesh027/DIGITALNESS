/**
 * agencyHealthService.js
 * Multi-factor Weighted Agency Health Index Calculator with Transparent Deductions.
 */

class AgencyHealthService {
  /**
   * Computes the agency-wide health score (0-100) and itemizes deductions.
   */
  calculateAgencyHealth(snapshot) {
    let score = 100;
    const deductions = [];

    // 1. DELIVERY HEALTH DEDUCTIONS (Up to 30 pts)
    const criticalDeliveryCount = snapshot.delivery?.critical || 0;
    const overdueDeliveryCount = snapshot.delivery?.overdue || 0;

    if (criticalDeliveryCount > 0) {
      const penalty = Math.min(20, criticalDeliveryCount * 8);
      score -= penalty;
      deductions.push({
        category: "DELIVERY",
        amount: penalty,
        reason: `${criticalDeliveryCount} critical SLA deliverable risks detected.`,
      });
    }

    if (overdueDeliveryCount > 0) {
      const penalty = Math.min(10, overdueDeliveryCount * 4);
      score -= penalty;
      deductions.push({
        category: "DELIVERY",
        amount: penalty,
        reason: `${overdueDeliveryCount} deliverables are currently overdue.`,
      });
    }

    // 2. CASH-FLOW & FINANCIAL DEDUCTIONS (Up to 25 pts)
    const overdueAmount = snapshot.finance?.overdueAmount || 0;
    const brokenPromises = snapshot.finance?.brokenPromises || 0;

    if (overdueAmount >= 50000) {
      score -= 15;
      deductions.push({
        category: "CASH_FLOW",
        amount: 15,
        reason: `₹${overdueAmount.toLocaleString("en-IN")} in overdue collections.`,
      });
    } else if (overdueAmount > 0) {
      score -= 8;
      deductions.push({
        category: "CASH_FLOW",
        amount: 8,
        reason: `₹${overdueAmount.toLocaleString("en-IN")} in overdue collections.`,
      });
    }

    if (brokenPromises > 0) {
      const penalty = Math.min(10, brokenPromises * 5);
      score -= penalty;
      deductions.push({
        category: "CASH_FLOW",
        amount: penalty,
        reason: `${brokenPromises} client payment commitments were missed.`,
      });
    }

    // 3. TEAM CAPACITY DEDUCTIONS (Up to 10 pts)
    const overloadedMembers = snapshot.team?.overloadedMembers || 0;
    if (overloadedMembers > 0) {
      const penalty = Math.min(10, overloadedMembers * 5);
      score -= penalty;
      deductions.push({
        category: "TEAM_CAPACITY",
        amount: penalty,
        reason: `${overloadedMembers} team members are overloaded (>85% utilization).`,
      });
    }

    // 4. CONTENT & APPROVAL BOTTLENECK DEDUCTIONS (Up to 15 pts)
    const awaitingApproval = snapshot.delivery?.awaitingApproval || snapshot.content?.awaitingApproval || 0;
    if (awaitingApproval >= 5) {
      score -= 10;
      deductions.push({
        category: "APPROVALS",
        amount: 10,
        reason: `${awaitingApproval} items are stalled waiting for manager approval.`,
      });
    } else if (awaitingApproval > 0) {
      score -= 4;
      deductions.push({
        category: "APPROVALS",
        amount: 4,
        reason: `${awaitingApproval} items awaiting manager review.`,
      });
    }

    // 5. AUTOMATION RELIABILITY (Up to 5 pts)
    const failedRuns = snapshot.automation?.failed || 0;
    if (failedRuns > 0) {
      const penalty = Math.min(5, failedRuns * 3);
      score -= penalty;
      deductions.push({
        category: "AUTOMATION",
        amount: penalty,
        reason: `${failedRuns} autonomous background jobs failed.`,
      });
    }

    const finalScore = Math.max(10, Math.min(100, Math.round(score)));

    let level = "HEALTHY";
    if (finalScore >= 90) level = "EXCELLENT";
    else if (finalScore >= 80) level = "HEALTHY";
    else if (finalScore >= 70) level = "WATCH";
    else if (finalScore >= 55) level = "AT_RISK";
    else level = "CRITICAL";

    return {
      score: finalScore,
      level,
      deductions,
    };
  }
}

module.exports = new AgencyHealthService();
