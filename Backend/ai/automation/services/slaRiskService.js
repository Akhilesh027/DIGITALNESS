/**
 * slaRiskService.js
 * Multivariate 0-100 SLA Risk Scoring and Risk Factor Decomposition Service.
 */

class SLARiskService {
  /**
   * Evaluates a work record and calculates a comprehensive risk score (0-100).
   */
  evaluateWorkRisk({ work, assigneeCapacity = null }) {
    // Exclude completed or cancelled work
    if (["Completed", "Failed"].includes(work.status)) {
      return {
        riskScore: 0,
        riskLevel: "HEALTHY",
        riskFactors: [],
        responsibility: "INTERNAL",
      };
    }

    const now = new Date();
    const dueDate = work.dueDate ? new Date(work.dueDate) : null;
    const riskFactors = [];
    let riskScore = 0;
    let responsibility = "INTERNAL";

    // 1. DEADLINE PROXIMITY (0 - 30 Points)
    if (dueDate) {
      const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        // OVERDUE / SLA BREACH
        const overdueHours = Math.abs(Math.round(diffHours));
        riskScore += 30;
        riskFactors.push({
          key: "DEADLINE_OVERDUE",
          label: "Deadline Overdue",
          scoreContribution: 30,
          details: `Task is currently overdue by ${overdueHours} hours.`,
        });
      } else if (diffHours <= 8) {
        // CRITICAL PROXIMITY (< 8 Hours)
        riskScore += 25;
        riskFactors.push({
          key: "DEADLINE_IMMINENT",
          label: "Imminent Deadline (<8h)",
          scoreContribution: 25,
          details: `Due in ${Math.round(diffHours)} hours.`,
        });
      } else if (diffHours <= 24) {
        // PROXIMITY (< 24 Hours)
        riskScore += 18;
        riskFactors.push({
          key: "DEADLINE_APPROACHING",
          label: "Deadline Approaching (<24h)",
          scoreContribution: 18,
          details: `Due tomorrow (${Math.round(diffHours)}h remaining).`,
        });
      } else if (diffHours <= 48) {
        riskScore += 10;
        riskFactors.push({
          key: "DEADLINE_48H",
          label: "Due within 48 Hours",
          scoreContribution: 10,
          details: `Due within 2 days.`,
        });
      }
    }

    // 2. STATUS RISK (0 - 15 Points)
    if (["Pending", "Not Started"].includes(work.status)) {
      const isUrgent = dueDate && (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60) <= 24;
      const points = isUrgent ? 15 : 8;
      riskScore += points;
      riskFactors.push({
        key: "WORK_NOT_STARTED",
        label: "Work Not Started",
        scoreContribution: points,
        details: `Task remains in '${work.status}' state.`,
      });
    } else if (work.status === "Revision") {
      riskScore += 10;
      riskFactors.push({
        key: "REVISION_LOOP",
        label: "Under Revision",
        scoreContribution: 10,
        details: "Task is undergoing client/manager revisions.",
      });
    }

    // 3. ASSIGNEE WORKLOAD & AVAILABILITY (0 - 20 Points)
    const hasAssignee = work.assignedTo && work.assignedTo.length > 0;
    if (!hasAssignee) {
      riskScore += 20;
      riskFactors.push({
        key: "UNASSIGNED_TASK",
        label: "Unassigned Deliverable",
        scoreContribution: 20,
        details: "No team member has been assigned to this deliverable.",
      });
    } else if (assigneeCapacity) {
      if (assigneeCapacity.isOnLeave) {
        riskScore += 20;
        riskFactors.push({
          key: "ASSIGNEE_ON_LEAVE",
          label: "Assignee On Leave",
          scoreContribution: 20,
          details: `${assigneeCapacity.employeeName} is currently on leave.`,
        });
      } else if (assigneeCapacity.capacityPercent >= 85) {
        riskScore += 18;
        riskFactors.push({
          key: "ASSIGNEE_OVERLOADED",
          label: "Assignee Overloaded (>85%)",
          scoreContribution: 18,
          details: `${assigneeCapacity.employeeName} is at ${assigneeCapacity.capacityPercent}% capacity with ${assigneeCapacity.activeTasks} active tasks.`,
        });
      } else if (assigneeCapacity.capacityPercent >= 60) {
        riskScore += 10;
        riskFactors.push({
          key: "ASSIGNEE_HIGH_LOAD",
          label: "Assignee High Load",
          scoreContribution: 10,
          details: `${assigneeCapacity.employeeName} is at ${assigneeCapacity.capacityPercent}% capacity.`,
        });
      }
    }

    // 4. APPROVAL & REVIEW DELAYS (0 - 15 Points)
    if (work.status === "Review") {
      const reviewAgeHours = work.updatedAt
        ? (now.getTime() - new Date(work.updatedAt).getTime()) / (1000 * 60 * 60)
        : 24;

      if (reviewAgeHours >= 48) {
        riskScore += 15;
        responsibility = "MANAGER";
        riskFactors.push({
          key: "STALLED_REVIEW_48H",
          label: "Stalled in Review (>48h)",
          scoreContribution: 15,
          details: `Awaiting review/approval for ${Math.round(reviewAgeHours)} hours.`,
        });
      } else if (reviewAgeHours >= 24) {
        riskScore += 10;
        responsibility = "MANAGER";
        riskFactors.push({
          key: "REVIEW_PENDING_24H",
          label: "Review Pending (>24h)",
          scoreContribution: 10,
          details: `Awaiting review for ${Math.round(reviewAgeHours)} hours.`,
        });
      }
    }

    // 5. DEPENDENCY & BLOCKER FLAGS (0 - 10 Points)
    if (work.blockedBy && work.blockedBy.isBlocked) {
      riskScore += 10;
      if (work.blockedBy.type === "CLIENT_INPUT") {
        responsibility = "CLIENT";
      } else if (work.blockedBy.type === "MANAGER_APPROVAL") {
        responsibility = "MANAGER";
      } else {
        responsibility = "EXTERNAL";
      }

      riskFactors.push({
        key: "DEPENDENCY_BLOCKED",
        label: `Blocked: ${work.blockedBy.type || "External"}`,
        scoreContribution: 10,
        details: work.blockedBy.note || "Task is waiting on external dependency or client asset.",
      });
    }

    // Final Normalized Score (0 - 100)
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel = "HEALTHY";
    if (riskScore >= 85) riskLevel = "CRITICAL";
    else if (riskScore >= 70) riskLevel = "HIGH";
    else if (riskScore >= 50) riskLevel = "AT_RISK";
    else if (riskScore >= 30) riskLevel = "WATCH";

    return {
      riskScore,
      riskLevel,
      riskFactors,
      responsibility,
    };
  }
}

module.exports = new SLARiskService();
