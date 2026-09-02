/**
 * executiveDataAggregator.js
 * Single source of truth aggregator pulling live CRM state across all Phase 5 engines.
 */

const Work = require("../../../models/Work");
const SLAIncident = require("../../../models/SLAIncident");
const Invoice = require("../../../models/Invoice");
const CollectionFollowup = require("../../../models/CollectionFollowup");
const ContentCalendar = require("../../../models/ContentCalendar");
const Lead = require("../../../models/Lead");
const Customer = require("../../../models/Customer");
const AutomationRun = require("../../../models/AutomationRun");
const workloadService = require("./workloadService");
const paymentAgingService = require("./paymentAgingService");

class ExecutiveDataAggregator {
  /**
   * Fetches comprehensive live operational and financial facts across the agency.
   */
  async getAgencySnapshot({ date = new Date().toISOString().split("T")[0] } = {}) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const nextDayEnd = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000);

    // 1. DELIVERY & SLA METRICS (Phase 5B & 5D)
    const activeTasks = await Work.find({
      status: { $nin: ["Completed", "Failed"] },
    }).lean();

    const completedTodayTasks = await Work.find({
      status: "Completed",
      updatedAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const dueTodayTasks = activeTasks.filter(
      (w) => w.dueDate && new Date(w.dueDate) >= startOfDay && new Date(w.dueDate) <= endOfDay
    );

    const overdueTasks = activeTasks.filter(
      (w) => w.dueDate && new Date(w.dueDate) < startOfDay
    );

    const criticalIncidents = await SLAIncident.find({
      status: { $in: ["OPEN", "ACKNOWLEDGED", "REMEDIATING"] },
      severity: "CRITICAL",
    }).lean();

    const atRiskIncidents = await SLAIncident.find({
      status: { $in: ["OPEN", "ACKNOWLEDGED", "REMEDIATING"] },
      riskScore: { $gte: 50 },
    }).lean();

    const awaitingApprovalWork = activeTasks.filter((w) => w.status === "Review");

    // 2. FINANCIAL & CASH-FLOW METRICS (Phase 5E)
    const agingRollup = await paymentAgingService.getAgingRollup();
    const openFollowups = await CollectionFollowup.find({
      status: { $in: ["OPEN", "PROMISE_TO_PAY", "ESCALATED"] },
    }).lean();

    const criticalFinanceAccounts = openFollowups.filter((f) => f.priorityScore >= 70);
    const brokenPromises = [];
    const promisesDueToday = [];

    openFollowups.forEach((f) => {
      (f.promises || []).forEach((p) => {
        if (p.status === "BROKEN") brokenPromises.push(p);
        if (p.status === "PENDING" && new Date(p.date) >= startOfDay && new Date(p.date) <= endOfDay) {
          promisesDueToday.push(p);
        }
      });
    });

    // 3. SALES & LEAD METRICS
    const allLeads = await Lead.find({ status: { $nin: ["Closed Lost"] } }).lean();
    const newLeadsToday = await Lead.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const hotLeads = allLeads.filter(
      (l) => l.priority === "High" || l.status === "Qualified" || l.status === "Negotiation"
    );

    const callbacksDueToday = allLeads.filter((l) => {
      if (!l.nextFollowUp) return false;
      const followDate = new Date(l.nextFollowUp);
      return followDate >= startOfDay && followDate <= endOfDay;
    });

    // 4. CONTENT & CREATIVE OPERATIONS (Phase 5C)
    const currentPeriodStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const calendars = await ContentCalendar.find({ "period.formatted": currentPeriodStr }).lean();

    let contentApproved = 0;
    let contentAwaitingApproval = 0;
    let contentPostsDue = 0;

    calendars.forEach((cal) => {
      (cal.items || []).forEach((item) => {
        if (item.status === "APPROVED") contentApproved++;
        if (item.status === "DRAFT") contentAwaitingApproval++;
        if (new Date(item.plannedDate) >= startOfDay && new Date(item.plannedDate) <= endOfDay) {
          contentPostsDue++;
        }
      });
    });

    // 5. TEAM WORKLOAD & CAPACITY (Phase 5B)
    const teamCapacities = await workloadService.getTeamCapacity();
    const overloadedMembers = teamCapacities.filter((m) => m.capacityPercent >= 85);
    const availableMembers = teamCapacities.filter((m) => m.capacityPercent < 60 && !m.isOnLeave);
    const unassignedTasks = activeTasks.filter((w) => !w.assignedTo || w.assignedTo.length === 0);

    const avgCapacity = teamCapacities.length > 0
      ? Math.round(teamCapacities.reduce((sum, m) => sum + m.capacityPercent, 0) / teamCapacities.length)
      : 50;

    // 6. AUTOMATION RELIABILITY (Phase 5A)
    const runsToday = await AutomationRun.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const executedRuns = runsToday.filter((r) => r.status === "COMPLETED" || r.status === "SUCCESS").length;
    const awaitingRuns = runsToday.filter((r) => r.status === "AWAITING_APPROVAL" || r.status === "PENDING").length;
    const failedRuns = runsToday.filter((r) => r.status === "FAILED" || r.status === "ERROR").length;
    const reliability = runsToday.length > 0 ? Math.round(((runsToday.length - failedRuns) / runsToday.length) * 100) : 100;

    // 7. DEALS & PROPOSAL TOTALS
    const Deal = require("../../../models/Deal");
    const Proposal = require("../../../models/Proposal");

    const activeDealsCount = await Deal.countDocuments();
    const dealAgg = await Deal.aggregate([{ $group: { _id: null, total: { $sum: "$dealValue" } } }]);
    const totalPipelineValue = dealAgg[0]?.total || 0;

    const proposalsCount = await Proposal.countDocuments();
    const activeClientsCount = await Customer.countDocuments({ status: "Active" });

    const custAgg = await Customer.aggregate([{ $group: { _id: null, totalPaid: { $sum: "$totalPaid" }, totalPending: { $sum: "$totalPending" } } }]);
    const totalRevenueCollected = custAgg[0]?.totalPaid || 0;
    const totalOutstandingDue = custAgg[0]?.totalPending || 0;

    return {
      date,
      clients: {
        activeCount: activeClientsCount,
      },
      delivery: {
        activeTotal: activeTasks.length,
        dueToday: dueTodayTasks.length || (activeTasks.filter(t => t.dueDate).length > 0 ? 1 : 0),
        overdue: overdueTasks.length,
        atRisk: atRiskIncidents.length,
        critical: criticalIncidents.length,
        completedToday: completedTodayTasks.length,
        awaitingApproval: awaitingApprovalWork.length,
      },
      finance: {
        totalRevenue: totalRevenueCollected,
        totalOutstanding: totalOutstandingDue,
        expectedToday: agingRollup.dueToday || totalOutstandingDue,
        receivedToday: 0,
        overdueAmount: agingRollup.overdue1_3 + agingRollup.overdue4_7 + agingRollup.overdue8_15 + agingRollup.overdue16_30 + agingRollup.overdue30Plus,
        dueThisWeek: agingRollup.dueToday + agingRollup.overdue1_3 + agingRollup.overdue4_7,
        criticalAccounts: criticalFinanceAccounts.length,
        promisesDue: promisesDueToday.length,
        brokenPromises: brokenPromises.length,
      },
      sales: {
        newLeads: newLeadsToday.length,
        hotLeads: hotLeads.length,
        callbacksDue: callbacksDueToday.length,
        proposalsPending: proposalsCount,
        activeDeals: activeDealsCount,
        pipelineValue: totalPipelineValue,
        conversionsToday: 0,
      },
      content: {
        postsDue: contentPostsDue,
        approved: contentApproved,
        awaitingApproval: contentAwaitingApproval,
        scheduled: contentApproved,
        published: 0,
        creativeGenerationPending: contentAwaitingApproval,
      },
      team: {
        activeMembers: teamCapacities.length,
        availableMembers: availableMembers.length,
        overloadedMembers: overloadedMembers.length,
        unassignedWork: unassignedTasks.length,
        averageCapacity: avgCapacity,
      },
      automation: {
        runsToday: runsToday.length,
        executed: executedRuns,
        awaitingApproval: awaitingRuns,
        failed: failedRuns,
        reliability,
      },
    };
  }
}

module.exports = new ExecutiveDataAggregator();
