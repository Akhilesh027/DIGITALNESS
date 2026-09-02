/**
 * decisionInboxService.js
 * Unified Decision Inbox & Cross-Engine Autonomous Approval Service for Digitalness CRM.
 */

const ContentCalendar = require("../../../models/ContentCalendar");
const SLAIncident = require("../../../models/SLAIncident");
const CollectionFollowup = require("../../../models/CollectionFollowup");
const AutomationRun = require("../../../models/AutomationRun");
const ApprovalRequest = require("../../../models/ApprovalRequest");
const WorkApproval = require("../../../models/WorkApproval");
const CreativeProject = require("../../../models/CreativeProject");
const DailyUpdate = require("../../../models/DailyUpdate");
const Work = require("../../../models/Work");
const Lead = require("../../../models/Lead");
const auditService = require("../AutomationAuditService");
const contentCalendarEngine = require("../engines/ContentCalendarEngine");
const slaGuardianEngine = require("../engines/SLAGuardianEngine");
const paymentRecoveryEngine = require("../engines/PaymentRecoveryEngine");
const ApprovalEngine = require("../../approval/ApprovalEngine");

class DecisionInboxService {
  /**
   * Scans all engines and collects unified pending decisions requiring manager authorization.
   */
  async getPendingDecisions() {
    const decisions = [];

    // 1. UNIVERSAL APPROVAL REQUESTS (ApprovalEngine / Multi-Domain)
    try {
      const approvalRequests = await ApprovalRequest.find({
        status: { $in: ["WAITING_APPROVAL", "CHANGES_REQUESTED", "AI_GENERATED"] },
      })
        .populate("customer", "name companyName brandName logoUrl")
        .populate("clientLocation", "name city")
        .populate("submittedBy", "name email role")
        .sort({ createdAt: -1 })
        .lean();

      for (const req of approvalRequests) {
        const isR3 = req.riskLevel === "R3";
        const isR2 = req.riskLevel === "R2";
        const isSafe = req.riskLevel === "R0" || req.riskLevel === "R1";
        const clientName =
          req.customer?.brandName ||
          req.customer?.companyName ||
          req.customer?.name ||
          (req.clientLocation ? `${req.clientLocation.name} (${req.clientLocation.city})` : "Agency Internal");

        decisions.push({
          id: `decision_approval_${req.approvalId || req._id}`,
          type: "APPROVAL_REQUEST",
          domain: req.domain || "GENERAL",
          title: req.title || `${req.domain || "Operation"} Approval Request`,
          summary:
            req.description ||
            `Pending manager authorization for ${req.domain || "operational"} action (${req.riskLevel || "R1"}).`,
          clientName,
          clientId: req.customer?._id,
          referenceId: req.approvalId || String(req._id),
          riskLevel: isSafe ? "SAFE" : isR3 ? "HIGH_IMPACT" : "MODERATE",
          urgency: isR3 ? "CRITICAL" : isR2 ? "HIGH" : "MEDIUM",
          impactScore: isR3 ? 95 : isR2 ? 80 : 55,
          payload: { approvalId: req.approvalId || String(req._id), requestId: String(req._id) },
          createdAt: req.createdAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching ApprovalRequests:", err.message);
    }

    // 2. LEGACY WORK & TASK APPROVALS (WorkApproval)
    try {
      const workApprovals = await WorkApproval.find({
        status: "Pending Approval",
      })
        .populate("customer", "name companyName brandName")
        .populate("submittedBy", "name email role")
        .populate("work", "title priority dueDate")
        .sort({ createdAt: -1 })
        .lean();

      for (const wa of workApprovals) {
        const clientName = wa.customer?.brandName || wa.customer?.companyName || wa.customer?.name || "Client";
        const submitter = wa.submittedBy?.name || "Staff Member";
        const deliverableTitle = wa.work?.title || wa.reviewMessage || "Deliverable";

        decisions.push({
          id: `decision_work_approval_${wa._id}`,
          type: "LEGACY_WORK_APPROVAL",
          domain: wa.approvalType ? wa.approvalType.toUpperCase() : "INTERNAL",
          title: wa.reviewMessage || `${wa.approvalType || "Work"} Review: ${clientName}`,
          summary:
            wa.adminRemark ||
            `Deliverable '${deliverableTitle}' submitted by ${submitter} awaiting manager review and sign-off.`,
          clientName,
          clientId: wa.customer?._id,
          referenceId: String(wa._id),
          riskLevel: "SAFE",
          urgency: "MEDIUM",
          impactScore: 60,
          payload: { workApprovalId: String(wa._id), workId: wa.work?._id ? String(wa.work._id) : null },
          createdAt: wa.createdAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching WorkApprovals:", err.message);
    }

    // 3. CREATIVE STUDIO & BANNER PROJECTS AWAITING APPROVAL
    try {
      const pendingCreatives = await CreativeProject.find({
        approvalStatus: "Pending Approval",
      })
        .populate("customerId", "name companyName brandName")
        .sort({ createdAt: -1 })
        .lean();

      for (const cp of pendingCreatives) {
        const clientName = cp.customerId?.brandName || cp.customerId?.companyName || cp.customerId?.name || "Client";
        decisions.push({
          id: `decision_creative_${cp._id}`,
          type: "CREATIVE_PROJECT_APPROVAL",
          domain: "CREATIVE",
          title: `Creative Project: ${cp.title || "Poster / Banner Design"} (${clientName})`,
          summary: `Marketing asset & copy generated and ready for client delivery sign-off.`,
          clientName,
          clientId: cp.customerId?._id,
          referenceId: String(cp._id),
          riskLevel: "SAFE",
          urgency: "MEDIUM",
          impactScore: 65,
          payload: { creativeId: String(cp._id) },
          createdAt: cp.createdAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching CreativeProjects:", err.message);
    }

    // 4. DAILY STANDUP UPDATES AWAITING REVIEW
    try {
      const pendingUpdates = await DailyUpdate.find({
        approvalStatus: "Pending",
      })
        .populate("employee", "name email role")
        .sort({ createdAt: -1 })
        .lean();

      for (const du of pendingUpdates) {
        const empName = du.employee?.name || "Employee";
        decisions.push({
          id: `decision_daily_update_${du._id}`,
          type: "DAILY_UPDATE_APPROVAL",
          domain: "INTERNAL",
          title: `Daily Update Review: ${empName}`,
          summary: `Daily log of ${du.tasksDone?.length || 0} task(s) completed (${du.hoursWorked || 0} hrs reported).`,
          clientName: "Internal Team",
          clientId: null,
          referenceId: String(du._id),
          riskLevel: "SAFE",
          urgency: "LOW",
          impactScore: 40,
          payload: { updateId: String(du._id) },
          createdAt: du.createdAt || du.date || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching DailyUpdates:", err.message);
    }

    // 5. CONTENT CALENDAR ITEMS AWAITING BATCH APPROVAL (Phase 5C)
    try {
      const pendingCalendars = await ContentCalendar.find({
        status: { $in: ["DRAFT", "PARTIALLY_APPROVED"] },
      })
        .populate("clientId", "name")
        .lean();

      for (const cal of pendingCalendars) {
        const draftItems = (cal.items || []).filter((i) => i.status === "DRAFT");
        if (draftItems.length > 0) {
          decisions.push({
            id: `decision_content_${cal._id}`,
            type: "CONTENT_CALENDAR_APPROVAL",
            domain: "CONTENT",
            title: `Content Approval: ${cal.clientId?.name || "Client"} (${draftItems.length} Posts)`,
            summary: `Monthly creative plan for ${cal.period?.formatted || "upcoming cycle"} has ${draftItems.length} post brief(s) ready for production approval.`,
            clientName: cal.clientId?.name || "Client",
            clientId: cal.clientId?._id,
            referenceId: String(cal._id),
            riskLevel: "SAFE",
            urgency: "MEDIUM",
            impactScore: 70,
            payload: { calendarId: String(cal._id), itemCount: draftItems.length },
            itemsPreview: draftItems.slice(0, 3).map((d) => ({
              title: d.title,
              pillar: d.pillar,
              plannedDate: d.plannedDate,
            })),
            createdAt: cal.createdAt || new Date(),
          });
        }
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching ContentCalendar:", err.message);
    }

    // 6. SLA GUARDIAN INCIDENT RECOVERY PROPOSALS (Phase 5D)
    try {
      const openIncidents = await SLAIncident.find({
        status: { $in: ["OPEN", "ACKNOWLEDGED"] },
        riskScore: { $gte: 65 },
      })
        .populate("workId", "title priority dueDate")
        .populate("clientId", "name")
        .lean();

      for (const inc of openIncidents) {
        const isCritical = inc.riskScore >= 85;
        const rec = inc.recommendations?.[0];

        decisions.push({
          id: `decision_sla_${inc._id}`,
          type: "SLA_RECOVERY_APPROVAL",
          domain: "DELIVERY",
          title: `SLA Remediation: ${inc.workId?.title || "Deliverable"} (${inc.riskScore}/100 Risk)`,
          summary: `AI detected root cause '${inc.primaryRootCause}'. Recommendation: ${rec?.label || "Reassign & prioritize task"}.`,
          clientName: inc.clientId?.name || "Client",
          clientId: inc.clientId?._id,
          referenceId: String(inc._id),
          riskLevel: isCritical ? "HIGH_IMPACT" : "MODERATE",
          urgency: isCritical ? "CRITICAL" : "HIGH",
          impactScore: inc.riskScore,
          payload: { incidentId: String(inc._id), action: rec?.action || "REASSIGN_WORK" },
          createdAt: inc.detectedAt || inc.createdAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching SLAIncidents:", err.message);
    }

    // 7. PAYMENT RECOVERY DISPUTES & CRITICAL FOLLOW-UPS (Phase 5E)
    try {
      const followups = await CollectionFollowup.find({
        status: { $in: ["OPEN", "PROMISE_TO_PAY", "ESCALATED"] },
        priorityScore: { $gte: 70 },
      })
        .populate("invoiceId", "invoiceNumber balanceAmount dueDate")
        .populate("clientId", "name")
        .lean();

      for (const fol of followups) {
        const isDisputed = fol.status === "DISPUTED" || fol.dispute?.active;
        const hasBroken = fol.promises?.some((p) => p.status === "BROKEN");
        const balance = fol.invoiceId?.balanceAmount || fol.balanceAtDetection || 0;
        const formattedBalance = `₹${balance.toLocaleString("en-IN")}`;

        decisions.push({
          id: `decision_finance_${fol._id}`,
          type: isDisputed ? "DISPUTED_INVOICE_REVIEW" : "PAYMENT_REMINDER_APPROVAL",
          domain: "COLLECTION",
          title: `${isDisputed ? "Dispute Review: " : "Payment Follow-up: "}${fol.clientId?.name || "Client"} (${formattedBalance})`,
          summary: isDisputed
            ? `Client requested billing review: "${fol.dispute?.reason || "Disputed amount"}". Automated reminders paused.`
            : `Invoice ${fol.invoiceId?.invoiceNumber || ""} is in ${fol.agingBucket}. ${hasBroken ? "Client missed promise to pay." : "Ready to dispatch verified WhatsApp reminder."}`,
          clientName: fol.clientId?.name || "Client",
          clientId: fol.clientId?._id,
          referenceId: String(fol._id),
          riskLevel: isDisputed ? "HIGH_IMPACT" : "SAFE",
          urgency: fol.priorityScore >= 85 ? "HIGH" : "MEDIUM",
          impactScore: fol.priorityScore,
          payload: { invoiceId: fol.invoiceId?._id ? String(fol.invoiceId._id) : null, followupId: String(fol._id) },
          createdAt: fol.updatedAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching CollectionFollowup:", err.message);
    }

    // 8. AUTOMATION RUNS AWAITING HUMAN APPROVAL (Phase 5A)
    try {
      const awaitingRuns = await AutomationRun.find({
        status: "AWAITING_APPROVAL",
      })
        .populate("customerId", "name")
        .limit(10)
        .lean();

      for (const run of awaitingRuns) {
        decisions.push({
          id: `decision_run_${run._id}`,
          type: "AUTOMATION_RUN_APPROVAL",
          domain: "AUTOMATION",
          title: `Automation Blueprint: ${run.jobName} (${run.customerId?.name || "General"})`,
          summary: run.summary || `Autonomous blueprint awaiting manager confirmation before writing changes.`,
          clientName: run.customerId?.name || "Agency",
          clientId: run.customerId?._id,
          referenceId: String(run._id),
          riskLevel: "MODERATE",
          urgency: "MEDIUM",
          impactScore: 60,
          payload: { runId: String(run._id) },
          createdAt: run.createdAt || new Date(),
        });
      }
    } catch (err) {
      console.error("[DecisionInbox] Error fetching AutomationRun:", err.message);
    }

    // Sort by impact/urgency score descending
    return decisions.sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Approves a single decision item and executes the underlying engine action.
   */
  async approveDecision({ decisionId, decisionType, payload = {}, userId = null }) {
    let result = null;

    switch (decisionType) {
      case "APPROVAL_REQUEST": {
        result = await ApprovalEngine.approve({
          approvalId: payload.approvalId,
          actorId: userId,
          actorRole: "Manager",
          remarks: payload.remarks || "Approved via Unified Decision Inbox",
        });
        break;
      }

      case "LEGACY_WORK_APPROVAL": {
        const wa = await WorkApproval.findById(payload.workApprovalId);
        if (wa) {
          wa.status = "Approved";
          wa.reviewedBy = userId || null;
          wa.reviewedAt = new Date();
          await wa.save();
          if (wa.work) {
            await Work.findByIdAndUpdate(wa.work, {
              approvalStatus: "Approved",
              status: "Completed",
            });
          }
          result = wa;
        }
        break;
      }

      case "CREATIVE_PROJECT_APPROVAL": {
        result = await CreativeProject.findByIdAndUpdate(
          payload.creativeId,
          { approvalStatus: "Approved", status: "Approved" },
          { new: true }
        );
        break;
      }

      case "DAILY_UPDATE_APPROVAL": {
        result = await DailyUpdate.findByIdAndUpdate(
          payload.updateId,
          { approvalStatus: "Approved", approvedBy: userId || null, approvedAt: new Date() },
          { new: true }
        );
        break;
      }

      case "CONTENT_CALENDAR_APPROVAL": {
        result = await contentCalendarEngine.batchApproveItems({
          calendarId: payload.calendarId,
          userId,
        });
        break;
      }

      case "SLA_RECOVERY_APPROVAL": {
        result = await slaGuardianEngine.rebalanceWorkload({
          incidentId: payload.incidentId,
          userId,
        });
        break;
      }

      case "PAYMENT_REMINDER_APPROVAL": {
        if (payload.invoiceId) {
          result = await paymentRecoveryEngine.generateReminder({
            invoiceId: payload.invoiceId,
            channel: "WHATSAPP",
            userId,
          });
        }
        break;
      }

      case "AUTOMATION_RUN_APPROVAL": {
        const run = await AutomationRun.findById(payload.runId);
        if (run) {
          run.status = "EXECUTED";
          run.completedAt = new Date();
          await run.save();
          result = run;
        }
        break;
      }

      default: {
        result = { approved: true, decisionId };
      }
    }

    return {
      success: true,
      decisionId,
      decisionType,
      result,
      message: `Decision '${decisionType}' approved and executed successfully.`,
    };
  }

  /**
   * Rejects a decision item.
   */
  async rejectDecision({ decisionId, decisionType, reason = "Rejected by manager", payload = {}, userId = null }) {
    if (decisionType === "APPROVAL_REQUEST" && payload.approvalId) {
      await ApprovalEngine.reject({
        approvalId: payload.approvalId,
        actorId: userId,
        actorRole: "Manager",
        reason,
      });
    } else if (decisionType === "LEGACY_WORK_APPROVAL" && payload.workApprovalId) {
      await WorkApproval.findByIdAndUpdate(payload.workApprovalId, {
        status: "Rejected",
        adminRemark: reason,
        reviewedBy: userId || null,
        reviewedAt: new Date(),
      });
    } else if (decisionType === "CREATIVE_PROJECT_APPROVAL" && payload.creativeId) {
      await CreativeProject.findByIdAndUpdate(payload.creativeId, {
        approvalStatus: "Revision",
        status: "Revision",
      });
    } else if (decisionType === "DAILY_UPDATE_APPROVAL" && payload.updateId) {
      await DailyUpdate.findByIdAndUpdate(payload.updateId, {
        approvalStatus: "Changes Requested",
        notes: reason,
      });
    } else if (decisionType === "AUTOMATION_RUN_APPROVAL" && payload.runId) {
      await AutomationRun.findByIdAndUpdate(payload.runId, {
        status: "SKIPPED_POLICY",
        error: reason,
      });
    }

    return {
      success: true,
      decisionId,
      decisionType,
      message: `Decision rejected: ${reason}`,
    };
  }

  /**
   * Batch approves all low-risk "SAFE" items in a single click!
   */
  async batchApproveSafe({ userId = null } = {}) {
    const allDecisions = await this.getPendingDecisions();
    const safeDecisions = allDecisions.filter((d) => d.riskLevel === "SAFE");

    const approvedResults = [];
    for (const dec of safeDecisions) {
      try {
        const res = await this.approveDecision({
          decisionId: dec.id,
          decisionType: dec.type,
          payload: dec.payload,
          userId,
        });
        approvedResults.push({ id: dec.id, type: dec.type, title: dec.title, success: true });
      } catch (err) {
        approvedResults.push({ id: dec.id, type: dec.type, title: dec.title, success: false, error: err.message });
      }
    }

    return {
      totalSafeCount: safeDecisions.length,
      approvedCount: approvedResults.filter((r) => r.success).length,
      results: approvedResults,
      message: `Successfully executed batch approval for ${approvedResults.filter((r) => r.success).length} safe operational items.`,
    };
  }
}

module.exports = new DecisionInboxService();
