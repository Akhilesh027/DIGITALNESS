/**
 * SLAGuardianEngine.js
 * Phase 5D: Proactive SLA & Deadline Guardian Engine for Digitalness CRM.
 */

const SLAIncident = require("../../../models/SLAIncident");
const Work = require("../../../models/Work");
const Customer = require("../../../models/Customer");
const slaRiskService = require("../services/slaRiskService");
const slaRootCauseService = require("../services/slaRootCauseService");
const escalationService = require("../services/escalationService");
const workloadService = require("../services/workloadService");
const auditService = require("../AutomationAuditService");
const eventBus = require("../services/eventBus");
const notificationDispatcher = require("../../../services/notificationDispatcherService");

class SLAGuardianEngine {
  /**
   * Scans all active work records, calculates risk scores, updates incidents, and generates recovery plans.
   */
  async scan({ userId = null, runId = null } = {}) {
    const now = new Date();

    // 1. Query all active non-completed tasks
    const activeTasks = await Work.find({
      status: { $nin: ["Completed", "Failed"] },
    })
      .populate("customer", "name companyName city")
      .populate("assignedTo", "name role department")
      .lean();

    // 2. Fetch Team Capacities
    const teamCapacities = await workloadService.getTeamCapacity();
    const capacityMap = new Map();
    teamCapacities.forEach((c) => capacityMap.set(c.employeeId, c));

    const incidentsCreated = [];
    const incidentsUpdated = [];
    const incidentsResolved = [];

    let criticalCount = 0;
    let highCount = 0;
    let atRiskCount = 0;
    let overdueCount = 0;

    for (const work of activeTasks) {
      const assignedUser = work.assignedTo && work.assignedTo[0] ? work.assignedTo[0] : null;
      const assigneeCapacity = assignedUser ? capacityMap.get(String(assignedUser._id)) : null;

      // 3. Calculate Risk Score
      const riskEval = slaRiskService.evaluateWorkRisk({ work, assigneeCapacity });
      const { riskScore, riskLevel, riskFactors, responsibility } = riskEval;

      // 4. Diagnose Root Cause
      const diagnosis = slaRootCauseService.diagnoseRootCause({ work, riskFactors, assigneeCapacity });

      // Determine Incident Type & Severity
      let incidentType = "UPCOMING_DEADLINE";
      if (riskFactors.some((f) => f.key === "DEADLINE_OVERDUE")) {
        incidentType = "SLA_BREACH";
        overdueCount++;
      } else if (riskFactors.some((f) => f.key.startsWith("STALLED_REVIEW"))) {
        incidentType = "STALLED_REVIEW";
      } else if (riskFactors.some((f) => f.key === "DEPENDENCY_BLOCKED")) {
        incidentType = "DEPENDENCY_BLOCKED";
      } else if (riskFactors.some((f) => f.key === "ASSIGNEE_OVERLOADED")) {
        incidentType = "WORKLOAD_RISK";
      } else if (riskScore >= 70) {
        incidentType = "AT_RISK";
      }

      if (riskLevel === "CRITICAL") criticalCount++;
      else if (riskLevel === "HIGH") highCount++;
      else if (riskLevel === "AT_RISK") atRiskCount++;

      // 5. Generate Dynamic Recovery Recommendations
      const recommendations = [];
      if (diagnosis.primaryCause === "ASSIGNEE_OVERLOADED" || diagnosis.primaryCause === "UNASSIGNED_WORK" || diagnosis.primaryCause === "ASSIGNEE_ON_LEAVE") {
        // Find alternate assignee with low workload
        const bestCandidate = await workloadService.findBestAssignee({
          preferredRole: assignedUser ? assignedUser.role : "Graphic Designer",
          excludeEmployeeIds: assignedUser ? [String(assignedUser._id)] : [],
        });

        if (bestCandidate && (!assigneeCapacity || bestCandidate.capacityPercent < assigneeCapacity.capacityPercent)) {
          recommendations.push({
            action: "REASSIGN_WORK",
            label: `Reassign to ${bestCandidate.employeeName} (${bestCandidate.capacityPercent}% load)`,
            confidence: 0.92,
            payload: {
              targetEmployeeId: bestCandidate.employeeId,
              targetEmployeeName: bestCandidate.employeeName,
              currentCapacity: assigneeCapacity ? assigneeCapacity.capacityPercent : 0,
              targetCapacity: bestCandidate.capacityPercent,
            },
          });
        }
      }

      if (diagnosis.primaryCause === "AWAITING_MANAGER_APPROVAL") {
        recommendations.push({
          action: "REQUEST_APPROVAL",
          label: "Send Urgency Escalation to Reviewing Manager",
          confidence: 0.95,
          payload: { workId: work._id },
        });
      }

      if (riskScore >= 70) {
        recommendations.push({
          action: "EXTEND_DEADLINE",
          label: "Extend Deadline by 24h & Notify Client",
          confidence: 0.8,
          payload: { extensionHours: 24 },
        });
      }

      // 6. Create / Update / Resolve Incident
      const incidentKey = `sla:${work._id}:${incidentType}`;
      const hoursRemaining = work.dueDate
        ? (new Date(work.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60)
        : 24;

      if (riskScore >= 50) {
        let incident = await SLAIncident.findOne({ incidentKey });

        if (!incident) {
          incident = await SLAIncident.create({
            incidentKey,
            workId: work._id,
            clientId: work.customer?._id || work.customer,
            type: incidentType,
            severity: riskLevel === "CRITICAL" ? "CRITICAL" : riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
            riskScore,
            status: "OPEN",
            responsibility,
            deadline: work.dueDate,
            riskFactors,
            primaryRootCause: diagnosis.summary,
            rootCauses: diagnosis.secondaryCauses,
            recommendations,
            assignedTo: assignedUser ? assignedUser._id : null,
            automationRunId: runId || "",
          });
          incidentsCreated.push(incident);
        } else {
          incident.riskScore = riskScore;
          incident.severity = riskLevel === "CRITICAL" ? "CRITICAL" : riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
          incident.riskFactors = riskFactors;
          incident.recommendations = recommendations;
          incident.status = incident.status === "RESOLVED" ? "OPEN" : incident.status;
          await incident.save();
          incidentsUpdated.push(incident);
        }

        // Escalation Check & Critical Manager Alert Dispatch
        escalationService.evaluateEscalation({ incident, work, hoursRemaining });
        if (riskScore >= 85) {
          notificationDispatcher.dispatchSLAEscalation({ task: work, incident }).catch((e) => {});
        }

        // Update Work cached SLA state
        await Work.findByIdAndUpdate(work._id, {
          sla: {
            riskScore,
            riskLevel,
            lastEvaluatedAt: now,
            activeIncidentId: incident._id,
            responsibility,
          },
        });
      } else {
        // Healthy Task: resolve any open incidents
        const openIncident = await SLAIncident.findOneAndUpdate(
          { workId: work._id, status: { $in: ["OPEN", "REMEDIATING"] } },
          { status: "RESOLVED", resolvedAt: now, resolutionType: "AUTO_RESOLVED_HEALTHY" }
        );
        if (openIncident) incidentsResolved.push(openIncident);

        await Work.findByIdAndUpdate(work._id, {
          sla: {
            riskScore,
            riskLevel: "HEALTHY",
            lastEvaluatedAt: now,
            activeIncidentId: null,
            responsibility: "INTERNAL",
          },
        });
      }
    }

    // 7. Calculate Agency SLA Health Score (0 - 100)
    // Formula: 100 - (critical * 12) - (high * 6) - (atRisk * 3) - (overdue * 15)
    const penalty = criticalCount * 12 + highCount * 6 + atRiskCount * 3 + overdueCount * 15;
    const agencyHealthScore = Math.max(10, Math.min(100, 100 - penalty));

    const summary = `Scanned ${activeTasks.length} tasks. Agency SLA Health: ${agencyHealthScore}/100. (${criticalCount} Critical, ${highCount} High Risk, ${overdueCount} Overdue).`;

    return {
      status: "COMPLETED",
      agencyHealthScore,
      scannedCount: activeTasks.length,
      criticalCount,
      highCount,
      atRiskCount,
      overdueCount,
      incidentsCreated: incidentsCreated.length,
      incidentsUpdated: incidentsUpdated.length,
      incidentsResolved: incidentsResolved.length,
      summary,
    };
  }

  /**
   * Retrieves active at-risk and critical incidents.
   */
  async getActiveIncidents(limit = 20) {
    return await SLAIncident.find({ status: { $in: ["OPEN", "ACKNOWLEDGED", "REMEDIATING"] } })
      .populate("workId", "title workType priority dueDate status")
      .populate("clientId", "name companyName city")
      .populate("assignedTo", "name role email")
      .sort({ riskScore: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Rebalances overloaded assignees by applying recommended reassignments.
   */
  async rebalanceWorkload({ incidentIds = [], userId = null }) {
    const query = { status: { $in: ["OPEN", "ACKNOWLEDGED"] } };
    if (incidentIds.length > 0) query._id = { $in: incidentIds };

    const incidents = await SLAIncident.find(query).populate("workId");
    const remediated = [];

    for (const inc of incidents) {
      const reassignRec = inc.recommendations.find((r) => r.action === "REASSIGN_WORK");
      if (reassignRec && reassignRec.payload && reassignRec.payload.targetEmployeeId && inc.workId) {
        await Work.findByIdAndUpdate(inc.workId._id, {
          assignedTo: [reassignRec.payload.targetEmployeeId],
          $push: {
            timeline: {
              title: "SLA Workload Rebalanced",
              description: `Reassigned to ${reassignRec.payload.targetEmployeeName} to mitigate SLA risk (${inc.riskScore} Risk).`,
              createdAt: new Date(),
              createdBy: userId || null,
            },
          },
        });

        inc.status = "REMEDIATING";
        inc.resolutionType = "REASSIGNED";
        await inc.save();

        remediated.push({
          incidentId: inc._id,
          workTitle: inc.workId.title,
          newAssignee: reassignRec.payload.targetEmployeeName,
        });
      }
    }

    return {
      status: "COMPLETED",
      remediatedCount: remediated.length,
      remediated,
      message: `Rebalanced ${remediated.length} at-risk deliverables across team.`,
    };
  }

  /**
   * Applies an individual recovery action.
   */
  async applyRecovery({ incidentId, action, payload = {}, userId = null }) {
    const incident = await SLAIncident.findById(incidentId).populate("workId");
    if (!incident) throw new Error("Incident not found.");

    if (action === "REASSIGN_WORK" && payload.targetEmployeeId && incident.workId) {
      await Work.findByIdAndUpdate(incident.workId._id, {
        assignedTo: [payload.targetEmployeeId],
      });
      incident.status = "REMEDIATING";
      incident.resolutionType = "REASSIGNED";
      await incident.save();
    } else if (action === "EXTEND_DEADLINE" && incident.workId) {
      const hours = payload.extensionHours || 24;
      const currentDue = incident.workId.dueDate ? new Date(incident.workId.dueDate) : new Date();
      currentDue.setHours(currentDue.getHours() + hours);

      await Work.findByIdAndUpdate(incident.workId._id, {
        dueDate: currentDue,
      });
      incident.status = "REMEDIATING";
      incident.resolutionType = "DEADLINE_EXTENDED";
      await incident.save();
    }

    return { success: true, message: `Recovery action '${action}' applied successfully.` };
  }

  /**
   * AutomationOrchestrator execution hook.
   */
  async execute({ params = {}, policyMode = "LIVE_AUTONOMOUS", runId = null, userId = null } = {}) {
    const scanResult = await this.scan({ userId, runId });
    return {
      status: "COMPLETED",
      actionsExecuted: [
        { type: "SLA_SCAN", count: scanResult.totalScanned || 0 },
        { type: "INCIDENTS_CREATED", count: scanResult.incidentsCreated || 0 },
      ],
      summary: `Scanned active deliverables for SLA risks. Found ${scanResult.criticalCount || 0} critical, ${scanResult.highCount || 0} high risk tasks.`,
      data: scanResult,
    };
  }

  /**
   * Resolves or acknowledges an incident.
   */
  async acknowledgeIncident(incidentId) {
    return await SLAIncident.findByIdAndUpdate(
      incidentId,
      { status: "ACKNOWLEDGED" },
      { new: true }
    );
  }
}

module.exports = new SLAGuardianEngine();
