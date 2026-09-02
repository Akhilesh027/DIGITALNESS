/**
 * ExecutiveBriefingEngine.js
 * Phase 5F: Daily Morning Executive Briefing & EOD Intelligence Engine for Digitalness CRM.
 */

const BriefingSnapshot = require("../../../models/BriefingSnapshot");
const executiveDataAggregator = require("../services/executiveDataAggregator");
const agencyHealthService = require("../services/agencyHealthService");
const executivePriorityService = require("../services/executivePriorityService");
const tomorrowPlanningService = require("../services/tomorrowPlanningService");
const executiveNarrativeService = require("../services/executiveNarrativeService");
const auditService = require("../AutomationAuditService");
const notificationDispatcher = require("../../../services/notificationDispatcherService");

class ExecutiveBriefingEngine {
  /**
   * Generates or refreshes the canonical Morning Briefing Snapshot.
   */
  async generateMorningBrief({ date = new Date().toISOString().split("T")[0], userId = null } = {}) {
    const briefingId = `briefing:morning:${date}`;

    // 1. Aggregate CRM state
    const dataSnapshot = await executiveDataAggregator.getAgencySnapshot({ date });

    // 2. Compute Agency Health
    const health = agencyHealthService.calculateAgencyHealth(dataSnapshot);

    // 3. Rank Executive Priorities
    const priorities = await executivePriorityService.getExecutivePriorities();

    // 4. Generate Structured Narrative
    const narrative = executiveNarrativeService.generateMorningNarrative({
      snapshot: dataSnapshot,
      health,
      priorities,
    });

    // 5. Lookahead for Tomorrow
    const tomorrowPlan = await tomorrowPlanningService.getTomorrowPlan();

    // 6. Upsert Frozen Morning Briefing Snapshot
    let snapshot = await BriefingSnapshot.findOne({ briefingId });
    if (!snapshot) {
      snapshot = await BriefingSnapshot.create({
        briefingId,
        type: "MORNING",
        date,
        period: {
          start: new Date(`${date}T00:00:00.000Z`),
          end: new Date(`${date}T23:59:59.999Z`),
        },
        agencyHealth: health,
        clients: dataSnapshot.clients,
        delivery: dataSnapshot.delivery,
        finance: dataSnapshot.finance,
        sales: dataSnapshot.sales,
        content: dataSnapshot.content,
        team: dataSnapshot.team,
        automation: dataSnapshot.automation,
        narrative,
        priorities,
        tomorrowRisks: tomorrowPlan.tomorrowRisks,
      });
    } else {
      snapshot.agencyHealth = health;
      snapshot.clients = dataSnapshot.clients;
      snapshot.delivery = dataSnapshot.delivery;
      snapshot.finance = dataSnapshot.finance;
      snapshot.sales = dataSnapshot.sales;
      snapshot.content = dataSnapshot.content;
      snapshot.team = dataSnapshot.team;
      snapshot.automation = dataSnapshot.automation;
      snapshot.narrative = narrative;
      snapshot.priorities = priorities;
      snapshot.tomorrowRisks = tomorrowPlan.tomorrowRisks;
      await snapshot.save();
    }

    // Auto-Dispatch Briefing to WhatsApp / Communication Hub
    notificationDispatcher.dispatchExecutiveBriefing({
      briefingData: snapshot,
      type: "MORNING",
    }).catch((e) => {});

    return snapshot;
  }

  /**
   * Generates the End-of-Day (EOD) Wrap Snapshot comparing against morning baseline.
   */
  async generateEodWrap({ date = new Date().toISOString().split("T")[0], userId = null } = {}) {
    const briefingId = `briefing:eod:${date}`;
    const morningBriefingId = `briefing:morning:${date}`;

    // 1. Fetch Morning Baseline
    const morningSnapshot = await BriefingSnapshot.findOne({ briefingId: morningBriefingId }).lean();

    // 2. Aggregate Evening CRM state
    const dataSnapshot = await executiveDataAggregator.getAgencySnapshot({ date });
    const health = agencyHealthService.calculateAgencyHealth(dataSnapshot);
    const priorities = await executivePriorityService.getExecutivePriorities();
    const tomorrowPlan = await tomorrowPlanningService.getTomorrowPlan();

    // 3. Compute Accomplishments
    const accomplishments = [
      `${dataSnapshot.delivery.completedToday} client deliverable(s) completed and delivered today.`,
      `${dataSnapshot.content.approved} content post(s) approved for upcoming production.`,
    ];

    if (morningSnapshot && morningSnapshot.delivery.critical > dataSnapshot.delivery.critical) {
      const resolved = morningSnapshot.delivery.critical - dataSnapshot.delivery.critical;
      accomplishments.push(`${resolved} critical SLA deliverable bottleneck(s) resolved.`);
    }

    const narrative = executiveNarrativeService.generateEodNarrative({
      snapshot: dataSnapshot,
      morningSnapshot,
      accomplishments,
    });

    let snapshot = await BriefingSnapshot.findOne({ briefingId });
    if (!snapshot) {
      snapshot = await BriefingSnapshot.create({
        briefingId,
        type: "EOD",
        date,
        period: {
          start: new Date(`${date}T00:00:00.000Z`),
          end: new Date(`${date}T23:59:59.999Z`),
        },
        agencyHealth: health,
        delivery: dataSnapshot.delivery,
        finance: dataSnapshot.finance,
        sales: dataSnapshot.sales,
        content: dataSnapshot.content,
        team: dataSnapshot.team,
        automation: dataSnapshot.automation,
        narrative,
        priorities,
        accomplishments,
        tomorrowRisks: tomorrowPlan.tomorrowRisks,
      });
    } else {
      snapshot.agencyHealth = health;
      snapshot.delivery = dataSnapshot.delivery;
      snapshot.finance = dataSnapshot.finance;
      snapshot.sales = dataSnapshot.sales;
      snapshot.content = dataSnapshot.content;
      snapshot.team = dataSnapshot.team;
      snapshot.automation = dataSnapshot.automation;
      snapshot.narrative = narrative;
      snapshot.priorities = priorities;
      snapshot.accomplishments = accomplishments;
      snapshot.tomorrowRisks = tomorrowPlan.tomorrowRisks;
      await snapshot.save();
    }

    return snapshot;
  }

  /**
   * Retrieves live, dynamic executive state (never stale).
   */
  async getLiveExecutiveView() {
    const today = new Date().toISOString().split("T")[0];
    const dataSnapshot = await executiveDataAggregator.getAgencySnapshot({ date: today });
    const health = agencyHealthService.calculateAgencyHealth(dataSnapshot);
    const priorities = await executivePriorityService.getExecutivePriorities();
    const tomorrowPlan = await tomorrowPlanningService.getTomorrowPlan();
    const narrative = executiveNarrativeService.generateMorningNarrative({
      snapshot: dataSnapshot,
      health,
      priorities,
    });

    return {
      timestamp: new Date(),
      date: today,
      agencyHealth: health,
      metrics: dataSnapshot,
      priorities,
      narrative,
      tomorrowPlan,
    };
  }

  /**
   * AutomationOrchestrator execution hook.
   */
  async execute({ params = {}, policyMode = "LIVE_AUTONOMOUS", runId = null, userId = null } = {}) {
    const brief = await this.generateMorningBrief({ userId });
    return {
      status: "COMPLETED",
      actionsExecuted: [
        { type: "BRIEFING_GENERATED", briefingId: brief?.briefingId },
      ],
      summary: `Generated Daily Morning Executive Briefing. Agency Health Score: ${brief?.agencyHealth?.score}/100.`,
      data: brief,
    };
  }

  /**
   * Fetches latest frozen brief.
   */
  async getLatestBrief(type = "MORNING") {
    return await BriefingSnapshot.findOne({ type }).sort({ date: -1 }).lean();
  }

  /**
   * Fetches brief history.
   */
  async getBriefHistory(limit = 14) {
    return await BriefingSnapshot.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
}

module.exports = new ExecutiveBriefingEngine();
