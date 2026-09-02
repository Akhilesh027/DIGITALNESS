/**
 * workloadService.js
 * Multivariate Employee Capacity Score & Intelligent Task Assignment Service.
 */

const User = require("../../../models/User");
const Work = require("../../../models/Work");

class WorkloadService {
  /**
   * Calculates a granular capacity score for a specific employee.
   * Lower score = higher availability and better candidate.
   */
  async getEmployeeCapacity(employeeId) {
    const user = await User.findById(employeeId).lean();
    if (!user) return null;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Query active works assigned to this employee
    const activeTasks = await Work.find({
      assignedTo: employeeId,
      status: { $in: ["Pending", "Not Started", "In Progress", "Review", "Revision"] },
    }).lean();

    const activeCount = activeTasks.length;
    const urgentCount = activeTasks.filter((t) => t.priority === "Urgent" || t.priority === "High").length;
    const overdueCount = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfToday).length;
    const todayDueCount = activeTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday
    ).length;

    // Leave / Availability Penalty
    const leavePenalty = user.isOnLeave ? 1000 : 0;

    // Capacity formula: active * 10 + urgent * 20 + overdue * 30 + today * 15 + leave
    const capacityScore =
      activeCount * 10 +
      urgentCount * 20 +
      overdueCount * 30 +
      todayDueCount * 15 +
      leavePenalty;

    // Estimate capacity percentage (0-100%, where 100% = overloaded)
    const capacityPercent = Math.min(100, Math.round((activeCount / 10) * 100));

    return {
      employeeId: String(user._id),
      employeeName: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      activeTasks: activeCount,
      urgentTasks: urgentCount,
      overdueTasks: overdueCount,
      todayDueTasks: todayDueCount,
      isOnLeave: Boolean(user.isOnLeave),
      capacityPercent,
      score: capacityScore,
    };
  }

  /**
   * Retrieves capacity metrics for the entire team or department.
   */
  async getTeamCapacity(department = null) {
    const query = {};
    if (department) query.department = department;

    const users = await User.find(query).lean();
    const capacities = await Promise.all(
      users.map((u) => this.getEmployeeCapacity(u._id))
    );

    return capacities.filter(Boolean).sort((a, b) => a.score - b.score);
  }

  /**
   * Finds the best candidate for a task given a preferred role and target due date.
   */
  async findBestAssignee({ preferredRole = "Graphic Designer", excludeEmployeeIds = [] }) {
    const allUsers = await User.find({}).lean();
    if (allUsers.length === 0) return null;

    // Calculate capacity for all users
    const allCapacities = await Promise.all(
      allUsers.map((u) => this.getEmployeeCapacity(u._id))
    );

    const validCapacities = allCapacities
      .filter((c) => c && !c.isOnLeave)
      .filter((c) => !excludeEmployeeIds.includes(c.employeeId));

    if (validCapacities.length === 0) {
      return allCapacities[0] || null;
    }

    // Role matching: check exact role match first, then department match, then general
    const exactRoleMatches = validCapacities.filter(
      (c) => c.role.toLowerCase() === preferredRole.toLowerCase()
    );

    if (exactRoleMatches.length > 0) {
      exactRoleMatches.sort((a, b) => a.score - b.score);
      return { ...exactRoleMatches[0], matchType: "EXACT_ROLE" };
    }

    // Fallback: Creative/Marketing department match
    const deptMatches = validCapacities.filter((c) =>
      preferredRole.toLowerCase().includes("design") || preferredRole.toLowerCase().includes("video")
        ? c.department === "Creative" || c.role.toLowerCase().includes("design")
        : c.department === "Marketing" || c.role.toLowerCase().includes("marketer")
    );

    if (deptMatches.length > 0) {
      deptMatches.sort((a, b) => a.score - b.score);
      return { ...deptMatches[0], matchType: "DEPARTMENT_MATCH" };
    }

    // Default fallback: team member with the lowest workload score
    validCapacities.sort((a, b) => a.score - b.score);
    return { ...validCapacities[0], matchType: "GENERAL_CAPACITY" };
  }

  /**
   * Distributes a list of deliverables across the team based on capacity scores.
   */
  async suggestTaskDistribution(deliverables = []) {
    const teamCapacities = await this.getTeamCapacity();
    const assignments = [];

    for (const item of deliverables) {
      const bestAssignee = await this.findBestAssignee({
        preferredRole: item.preferredRole || "Graphic Designer",
      });

      assignments.push({
        deliverableId: item._id || item.type,
        title: item.title,
        type: item.type,
        dueDate: item.dueDate,
        assignedTo: bestAssignee ? bestAssignee.employeeId : null,
        assignedToName: bestAssignee ? bestAssignee.employeeName : "Unassigned",
        assignedToRole: bestAssignee ? bestAssignee.role : "N/A",
        capacityScore: bestAssignee ? bestAssignee.score : 0,
        capacityPercent: bestAssignee ? bestAssignee.capacityPercent : 0,
      });
    }

    return assignments;
  }
}

module.exports = new WorkloadService();
