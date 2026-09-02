/**
 * slaRootCauseService.js
 * Root-Cause Diagnostics Service for SLA Delays & Risk Escalations.
 */

class SLARootCauseService {
  /**
   * Diagnoses the root cause behind a task's SLA risk score.
   */
  diagnoseRootCause({ work, riskFactors = [], assigneeCapacity = null }) {
    const factorKeys = new Set(riskFactors.map((f) => f.key));
    let primaryCause = "WORK_NOT_STARTED";
    let confidence = 0.85;
    const secondaryCauses = [];

    if (factorKeys.has("UNASSIGNED_TASK")) {
      primaryCause = "UNASSIGNED_WORK";
      confidence = 0.95;
    } else if (factorKeys.has("ASSIGNEE_ON_LEAVE")) {
      primaryCause = "ASSIGNEE_ON_LEAVE";
      confidence = 0.98;
    } else if (factorKeys.has("DEPENDENCY_BLOCKED")) {
      primaryCause = work.blockedBy?.type === "CLIENT_INPUT" ? "AWAITING_CLIENT_APPROVAL" : "DEPENDENCY_INCOMPLETE";
      confidence = 0.92;
    } else if (factorKeys.has("STALLED_REVIEW_48H") || factorKeys.has("REVIEW_PENDING_24H")) {
      primaryCause = "AWAITING_MANAGER_APPROVAL";
      confidence = 0.94;
    } else if (factorKeys.has("ASSIGNEE_OVERLOADED")) {
      primaryCause = "ASSIGNEE_OVERLOADED";
      confidence = 0.91;
      if (factorKeys.has("WORK_NOT_STARTED")) secondaryCauses.push("LATE_START");
    } else if (factorKeys.has("DEADLINE_OVERDUE")) {
      primaryCause = "LATE_START";
      confidence = 0.88;
    } else if (factorKeys.has("REVISION_LOOP")) {
      primaryCause = "CREATIVE_REVISION_LOOP";
      confidence = 0.86;
    }

    return {
      primaryCause,
      confidence,
      secondaryCauses,
      summary: this.getHumanReadableCause(primaryCause, assigneeCapacity),
    };
  }

  getHumanReadableCause(cause, assigneeCapacity) {
    switch (cause) {
      case "ASSIGNEE_OVERLOADED":
        return `Assignee (${assigneeCapacity?.employeeName || "Member"}) is overloaded at ${assigneeCapacity?.capacityPercent || 85}% capacity with ${assigneeCapacity?.activeTasks || 4}+ tasks.`;
      case "UNASSIGNED_WORK":
        return "No team member has been assigned to this deliverable.";
      case "AWAITING_MANAGER_APPROVAL":
        return "Deliverable has been completed by designer and is stalled awaiting manager review.";
      case "AWAITING_CLIENT_APPROVAL":
        return "Waiting on client inputs, assets, or feedback.";
      case "ASSIGNEE_ON_LEAVE":
        return "Assigned team member is currently marked as on leave.";
      case "CREATIVE_REVISION_LOOP":
        return "Deliverable is undergoing multiple creative revisions.";
      default:
        return "Task has not started and deadline is approaching.";
    }
  }
}

module.exports = new SLARootCauseService();
