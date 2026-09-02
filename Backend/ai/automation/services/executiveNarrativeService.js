/**
 * executiveNarrativeService.js
 * Generates concise, executive briefing narratives from deterministic CRM facts.
 */

class ExecutiveNarrativeService {
  /**
   * Builds human-readable morning briefing narrative.
   */
  generateMorningNarrative({ snapshot, health, priorities }) {
    const criticalCount = priorities.filter((p) => p.severity === "CRITICAL").length;
    const headline = `Good Morning — Agency Health is ${health.score}/100 (${health.level})`;

    const focusPoints = [];
    if (snapshot.delivery.critical > 0) {
      focusPoints.push(`${snapshot.delivery.critical} deliverable(s) are at critical SLA risk and need immediate rebalancing.`);
    }
    if (snapshot.finance.expectedToday > 0) {
      focusPoints.push(`₹${snapshot.finance.expectedToday.toLocaleString("en-IN")} in client collections is scheduled for today.`);
    }
    if (snapshot.sales.hotLeads > 0) {
      focusPoints.push(`${snapshot.sales.hotLeads} hot lead(s) require sales follow-up.`);
    }
    if (snapshot.content.awaitingApproval > 0) {
      focusPoints.push(`${snapshot.content.awaitingApproval} content brief(s) are awaiting manager batch approval.`);
    }

    const summary = `Agency operations are ${health.level.toLowerCase()} with ${priorities.length} key action item(s). ${snapshot.delivery.dueToday} task(s) due today, ₹${snapshot.finance.overdueAmount.toLocaleString("en-IN")} total overdue, and ${snapshot.team.activeMembers} active team members.`;

    return {
      headline,
      summary,
      focusPoints,
    };
  }

  /**
   * Builds human-readable EOD wrap narrative.
   */
  generateEodNarrative({ snapshot, morningSnapshot, accomplishments }) {
    const headline = `End of Day Wrap — ${snapshot.delivery.completedToday} Deliverables Completed`;
    const summary = `The agency completed ${snapshot.delivery.completedToday} task(s) today. ${snapshot.delivery.critical} critical item(s) remain open, and ₹${snapshot.finance.overdueAmount.toLocaleString("en-IN")} remains in overdue collections heading into tomorrow.`;

    return {
      headline,
      summary,
      focusPoints: accomplishments,
    };
  }
}

module.exports = new ExecutiveNarrativeService();
