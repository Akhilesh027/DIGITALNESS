/**
 * ReportingAgent.js
 * Specialist agent for operational CRM performance summaries (Draft Mode Only).
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");

class ReportingAgent extends BaseAgent {
  constructor() {
    super("ReportingAgent");
  }

  async execute(plan, ctx = {}) {
    const reportingContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "Reporting",
    });

    const clientName = reportingContext.clientIdentity?.companyName || reportingContext.clientIdentity?.name || "Client";

    return {
      agentTarget: "Reporting Agent (Draft Mode)",
      summaryPeriod: "Monthly",
      kpiSummary: {
        primaryKPIs: reportingContext.reportingStrategy?.primaryKPIs || ["Leads Generated", "Reach"],
        status: "Data Compiled from Internal CRM Records",
      },
      executiveSummary: `Operational Activity Summary for ${clientName}: Approved content items and active work deliverables are progressing on schedule.`,
      restrictionsNote: "Draft Mode Only: Exclusively summarizes internal CRM records. Does not fabricate external metrics.",
    };
  }
}

module.exports = new ReportingAgent();
