/**
 * AssignmentEngine.js
 * Deterministic multi-tier assignment router (Round-Robin, Least-Active, Branch Owner, Manual Override).
 */

const User = require("../../models/User");
const Team = require("../../models/Team");
const InboxItem = require("../../models/InboxItem");

class AssignmentEngine {
  /**
   * Routes an inbox item to an eligible team member
   */
  async routeAssignment({ inboxItem, teamId = null, strategy = "ROUND_ROBIN", actorId = null, forceManual = false }) {
    // 1. Preserve manual assignment unless explicitly overridden
    if (inboxItem.assignmentSource === "MANUAL" && !forceManual && inboxItem.assignedTo) {
      return {
        assigned: true,
        assignedTo: inboxItem.assignedTo,
        strategy: "PRESERVED_MANUAL",
      };
    }

    if (forceManual && actorId) {
      inboxItem.assignedTo = actorId;
      inboxItem.assignmentSource = "MANUAL";
      if (inboxItem.status === "NEW") inboxItem.status = "ASSIGNED";
      return {
        assigned: true,
        assignedTo: actorId,
        strategy: "MANUAL",
      };
    }

    // 2. Resolve eligible Team
    let team = null;
    if (teamId) {
      team = await Team.findById(teamId).populate("members");
    } else if (inboxItem.assignedTeam) {
      team = await Team.findById(inboxItem.assignedTeam).populate("members");
    } else {
      // Find default team matching source type
      const capability = inboxItem.sourceType === "GBP_REVIEW" ? "GBP_REVIEW" : "WHATSAPP";
      team = await Team.findOne({
        $or: [{ customerId: inboxItem.customerId }, { customerId: null }],
        capabilities: capability,
        active: true,
      }).populate("members");
    }

    const members = (team?.members || []).filter((m) => m && m.status !== "Inactive");

    if (!members || members.length === 0) {
      // Fallback: assign to active Manager or Admin
      const fallbackManager = await User.findOne({
        role: { $in: ["Manager", "Operational Manager", "Admin"] },
        status: { $ne: "Inactive" },
      });

      if (fallbackManager) {
        inboxItem.assignedTo = fallbackManager._id;
        inboxItem.assignmentSource = "AUTO";
        if (inboxItem.status === "NEW") inboxItem.status = "ASSIGNED";
        return { assigned: true, assignedTo: fallbackManager._id, strategy: "FALLBACK_MANAGER" };
      }

      return { assigned: false, reason: "NO_ELIGIBLE_ASSIGNEE" };
    }

    let selectedUser = null;

    if (strategy === "LEAST_ACTIVE") {
      // Find member with fewest active open inbox items
      let lowestCount = Infinity;
      for (const member of members) {
        const count = await InboxItem.countDocuments({
          assignedTo: member._id,
          status: { $in: ["NEW", "ASSIGNED", "IN_PROGRESS", "WAITING_CUSTOMER"] },
        });
        if (count < lowestCount) {
          lowestCount = count;
          selectedUser = member;
        }
      }
    } else {
      // ROUND_ROBIN
      const pointer = team.roundRobinPointer || 0;
      const index = pointer % members.length;
      selectedUser = members[index];

      // Advance pointer
      team.roundRobinPointer = (index + 1) % members.length;
      await team.save();
    }

    if (selectedUser) {
      inboxItem.assignedTo = selectedUser._id;
      inboxItem.assignedTeam = team._id;
      inboxItem.assignmentSource = "AUTO";
      if (inboxItem.status === "NEW") inboxItem.status = "ASSIGNED";

      return {
        assigned: true,
        assignedTo: selectedUser._id,
        assignedTeam: team._id,
        strategy,
      };
    }

    return { assigned: false, reason: "NO_ASSIGNEE_FOUND" };
  }
}

module.exports = new AssignmentEngine();
