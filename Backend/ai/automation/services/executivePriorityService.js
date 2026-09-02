/**
 * executivePriorityService.js
 * Multi-Domain Executive Priority Queue Engine for Manager Decisions.
 */

const SLAIncident = require("../../../models/SLAIncident");
const CollectionFollowup = require("../../../models/CollectionFollowup");
const Work = require("../../../models/Work");
const Lead = require("../../../models/Lead");
const ContentCalendar = require("../../../models/ContentCalendar");

class ExecutivePriorityService {
  /**
   * Evaluates all active CRM bottlenecks and produces a prioritized executive action queue.
   */
  async getExecutivePriorities() {
    const priorities = [];
    const now = new Date();

    // 1. CRITICAL & HIGH-RISK SLA INCIDENTS
    const incidents = await SLAIncident.find({
      status: { $in: ["OPEN", "ACKNOWLEDGED"] },
      riskScore: { $gte: 50 },
    })
      .populate("workId", "title priority dueDate")
      .populate("clientId", "name")
      .sort({ riskScore: -1 })
      .limit(10)
      .lean();

    for (const inc of incidents) {
      const isCritical = inc.riskScore >= 85;
      const rec = inc.recommendations?.[0];

      priorities.push({
        id: `sla_${inc._id}`,
        category: "DELIVERY",
        title: `SLA Risk: ${inc.workId?.title || "Deliverable"} (${inc.riskScore}/100 Risk)`,
        description: inc.primaryRootCause || "Task at risk of missing client SLA deadline.",
        clientId: inc.clientId?._id,
        clientName: inc.clientId?.name || "Client",
        referenceType: "SLAIncident",
        referenceId: String(inc._id),
        score: Math.min(100, inc.riskScore + (isCritical ? 10 : 0)),
        severity: isCritical ? "CRITICAL" : "HIGH",
        reason: inc.primaryRootCause,
        recommendedAction: {
          command: rec?.action === "REASSIGN_WORK" ? "sla.rebalanceWorkload" : "sla.explainRisk",
          label: rec?.label || "Fix SLA Risk",
          payload: { incidentId: inc._id },
        },
        deadline: inc.deadline,
      });
    }

    // 2. FINANCIAL DUES & BROKEN PROMISES
    const followups = await CollectionFollowup.find({
      status: { $in: ["OPEN", "PROMISE_TO_PAY", "ESCALATED"] },
      priorityScore: { $gte: 60 },
    })
      .populate("invoiceId", "invoiceNumber balanceAmount dueDate")
      .populate("clientId", "name")
      .sort({ priorityScore: -1 })
      .limit(10)
      .lean();

    for (const fol of followups) {
      const hasBroken = fol.promises?.some((p) => p.status === "BROKEN");
      const balance = fol.invoiceId?.balanceAmount || fol.balanceAtDetection;
      const formattedBalance = `₹${balance.toLocaleString("en-IN")}`;

      priorities.push({
        id: `finance_${fol._id}`,
        category: "COLLECTION",
        title: `${hasBroken ? "Broken Payment Promise: " : "Collection Priority: "}${fol.clientId?.name || "Client"} (${formattedBalance})`,
        description: hasBroken
          ? `Client promised to pay ${formattedBalance} but missed commitment date.`
          : `Invoice ${fol.invoiceId?.invoiceNumber || ""} has ${formattedBalance} outstanding in ${fol.agingBucket}.`,
        clientId: fol.clientId?._id,
        clientName: fol.clientId?.name || "Client",
        referenceType: "CollectionFollowup",
        referenceId: String(fol._id),
        score: Math.min(100, fol.priorityScore + (hasBroken ? 12 : 0)),
        severity: fol.priorityScore >= 85 || hasBroken ? "CRITICAL" : "HIGH",
        reason: hasBroken ? "Missed Promise to Pay" : "Overdue Aging",
        recommendedAction: {
          command: "finance.generateReminder",
          label: "Draft WhatsApp Reminder",
          payload: { invoiceId: fol.invoiceId?._id },
        },
        deadline: fol.invoiceId?.dueDate,
      });
    }

    // 3. SALES HOT LEADS & CALLS DUE TODAY
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const hotLeads = await Lead.find({
      status: { $in: ["Qualified", "Negotiation", "Contacted"] },
      $or: [
        { priority: "High" },
        { nextFollowUp: { $gte: startOfDay, $lte: endOfDay } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    for (const lead of hotLeads) {
      priorities.push({
        id: `lead_${lead._id}`,
        category: "SALES",
        title: `Hot Lead Follow-up: ${lead.name} (${lead.companyName || "High Value"})`,
        description: `Lead status is '${lead.status}' with high conversion potential.`,
        clientName: lead.companyName || lead.name,
        referenceType: "Lead",
        referenceId: String(lead._id),
        score: lead.priority === "High" ? 82 : 72,
        severity: lead.priority === "High" ? "HIGH" : "WATCH",
        reason: "Lead conversion opportunity",
        recommendedAction: {
          command: "lead.view",
          label: "View & Call Lead",
          payload: { leadId: lead._id },
        },
        deadline: lead.nextFollowUp || null,
      });
    }

    // 4. MANAGER-BLOCKING CONTENT & CREATIVE APPROVALS
    const currentPeriodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const calendars = await ContentCalendar.find({
      "period.formatted": currentPeriodStr,
      status: { $in: ["DRAFT", "PARTIALLY_APPROVED"] },
    })
      .populate("clientId", "name")
      .limit(5)
      .lean();

    for (const cal of calendars) {
      const draftItems = (cal.items || []).filter((i) => i.status === "DRAFT");
      if (draftItems.length > 0) {
        priorities.push({
          id: `content_${cal._id}`,
          category: "CONTENT",
          title: `Content Approval Blocking: ${cal.clientId?.name || "Client"} (${draftItems.length} Posts)`,
          description: `Manager approval is blocking creative generation and production for ${draftItems.length} scheduled deliverable slots.`,
          clientId: cal.clientId?._id,
          clientName: cal.clientId?.name || "Client",
          referenceType: "ContentCalendar",
          referenceId: String(cal._id),
          score: 75,
          severity: "HIGH",
          reason: "Production Blocked",
          recommendedAction: {
            command: "content.batchApprove",
            label: `Approve ${draftItems.length} Posts`,
            payload: { calendarId: cal._id },
          },
        });
      }
    }

    // Sort by priority score descending
    return priorities.sort((a, b) => b.score - a.score);
  }
}

module.exports = new ExecutivePriorityService();
