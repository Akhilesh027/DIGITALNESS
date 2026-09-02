/**
 * ApprovalEngine.js
 * Central Finite State Machine & Governance Authority for Digitalness CRM
 * Governs the 11-stage lifecycle of all AI-originated and operational approval requests.
 */

const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalAuditLog = require("../../models/ApprovalAuditLog");
const { RISK_LEVELS, canUserApprove, getApprovalRequirement } = require("./approvalPolicy");

// Explicit allowed state transitions
const ALLOWED_TRANSITIONS = {
  DRAFT: ["AI_GENERATED", "CANCELLED"],
  AI_GENERATED: ["WAITING_APPROVAL", "APPROVED", "CANCELLED"],
  WAITING_APPROVAL: ["APPROVED", "CHANGES_REQUESTED", "REJECTED", "CANCELLED"],
  CHANGES_REQUESTED: ["REGENERATING", "CANCELLED"],
  REGENERATING: ["AI_GENERATED", "FAILED", "CANCELLED"],
  APPROVED: ["QUEUED", "CANCELLED"],
  QUEUED: ["EXECUTING", "FAILED", "CANCELLED"],
  EXECUTING: ["EXECUTED", "FAILED"],
  EXECUTED: [], // Terminal
  REJECTED: [], // Terminal
  CANCELLED: [], // Terminal
  FAILED: ["REGENERATING", "QUEUED", "CANCELLED"], // Allows controlled retry
};

class ApprovalEngine {
  /**
   * Generates a unique readable Approval ID
   */
  generateApprovalId(domain = "GEN") {
    const prefix = String(domain).substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `APPR-${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validates if a state transition is permitted
   */
  validateTransition(fromStatus, toStatus) {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      const err = new Error(`Invalid state transition from '${fromStatus}' to '${toStatus}'.`);
      err.code = "INVALID_STATE_TRANSITION";
      err.fromStatus = fromStatus;
      err.toStatus = toStatus;
      throw err;
    }
    return true;
  }

  /**
   * Internal helper to record an audit log entry
   */
  async logTransition({
    approvalId,
    approvalRequestId,
    fromStatus,
    toStatus,
    action,
    actorType = "USER",
    actorId = null,
    actorRole = "System",
    remarks = "",
    version = 1,
    sourceAgentRunId = null,
    metadata = {},
  }) {
    try {
      await ApprovalAuditLog.create({
        approvalId,
        approvalRequestId,
        fromStatus,
        toStatus,
        action,
        actorType,
        actorId,
        actorRole,
        remarks,
        version,
        sourceAgentRunId,
        metadata,
      });
    } catch (logErr) {
      console.error("[ApprovalEngine Audit Error]", logErr.message);
    }
  }

  /**
   * Creates a new approval request in DRAFT or AI_GENERATED state
   */
  async createApprovalRequest({
    title,
    description = "",
    domain,
    actionType = "GENERATE",
    riskLevel = null,
    customer = null,
    clientLocation = null,
    sourceAgent = null,
    sourceCommand = null,
    sourceConversationId = null,
    sourceAgentRunId = null,
    resourceType = null,
    resourceId = null,
    blueprintPayload = {},
    executionPayload = {},
    previewUrl = null,
    executionIntent = {},
    submittedByType = "AI_AGENT",
    submittedBy = null,
    assignedTo = [],
    initialStatus = "AI_GENERATED",
    metadata = {},
  }) {
    const policy = getApprovalRequirement(domain, actionType, riskLevel);
    const finalRisk = riskLevel || policy.riskLevel;
    const approvalId = this.generateApprovalId(domain);

    const initialVersion = {
      versionNumber: 1,
      createdAt: new Date(),
      generatedByType: submittedByType,
      generatedBy: sourceAgent || "System",
      blueprintPayload,
      executionPayload,
      previewUrl,
      assetIds: [],
      managerFeedback: null,
      superseded: false,
    };

    // Auto-route to WAITING_APPROVAL if it requires human review
    let status = initialStatus;
    if (initialStatus === "AI_GENERATED" && (finalRisk === RISK_LEVELS.R2 || finalRisk === RISK_LEVELS.R3)) {
      status = "WAITING_APPROVAL";
    }

    const doc = new ApprovalRequest({
      approvalId,
      title,
      description,
      domain,
      actionType,
      riskLevel: finalRisk,
      status,
      customer,
      clientLocation,
      sourceAgent,
      sourceCommand,
      sourceConversationId,
      sourceAgentRunId,
      resourceType,
      resourceId,
      currentVersion: 1,
      versions: [initialVersion],
      executionIntent,
      submittedByType,
      submittedBy,
      assignedTo,
      metadata,
    });

    await doc.save();

    await this.logTransition({
      approvalId,
      approvalRequestId: doc._id,
      fromStatus: "NONE",
      toStatus: status,
      action: "CREATE_APPROVAL_REQUEST",
      actorType: submittedByType,
      actorId: submittedBy,
      actorRole: submittedByType === "AI_AGENT" ? "AI_AGENT" : "User",
      remarks: `Approval created with initial status ${status}`,
      version: 1,
      sourceAgentRunId,
    });

    return doc;
  }

  /**
   * Submits a DRAFT or AI_GENERATED item into WAITING_APPROVAL
   */
  async submitForApproval({ approvalId, actorId = null, actorRole = "User", remarks = "" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "WAITING_APPROVAL");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: doc.status },
      { $set: { status: "WAITING_APPROVAL", decisionRemarks: remarks } },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Conflict: Approval request status changed concurrently from '${doc.status}'.`);
    }

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: doc.status,
      toStatus: "WAITING_APPROVAL",
      action: "SUBMIT_FOR_APPROVAL",
      actorType: "USER",
      actorId,
      actorRole,
      remarks,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Approves a request in WAITING_APPROVAL status (Atomic)
   */
  async approve({ approvalId, actorId, actorRole = "Manager", remarks = "" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    // Idempotency check
    if (doc.status === "APPROVED") {
      return { success: true, alreadyApproved: true, doc };
    }

    this.validateTransition(doc.status, "APPROVED");

    // Check role and self-approval protection
    const check = canUserApprove({
      userRole: actorRole,
      riskLevel: doc.riskLevel,
      submittedById: doc.submittedBy,
      userId: actorId,
    });

    if (!check.allowed) {
      const err = new Error(check.reason);
      err.code = "UNAUTHORIZED_APPROVAL";
      throw err;
    }

    const now = new Date();
    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "WAITING_APPROVAL" },
      {
        $set: {
          status: "APPROVED",
          decidedBy: actorId,
          decisionRemarks: remarks,
          approvedAt: now,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Double approval conflict: Approval request '${approvalId}' was already decided or modified.`);
    }

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "WAITING_APPROVAL",
      toStatus: "APPROVED",
      action: "APPROVE",
      actorType: "USER",
      actorId,
      actorRole,
      remarks,
      version: updated.currentVersion,
    });

    return { success: true, doc: updated };
  }

  /**
   * Requests changes on a request in WAITING_APPROVAL status
   */
  async requestChanges({ approvalId, actorId, actorRole = "Manager", feedback }) {
    if (!feedback || feedback.trim().length === 0) {
      throw new Error("Manager feedback is required when requesting changes.");
    }

    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "CHANGES_REQUESTED");

    // Update active version feedback
    const activeVersionIndex = doc.versions.findIndex((v) => v.versionNumber === doc.currentVersion);
    const updateOps = {
      $set: {
        status: "CHANGES_REQUESTED",
        decidedBy: actorId,
        decisionRemarks: feedback,
      },
    };

    if (activeVersionIndex !== -1) {
      updateOps.$set[`versions.${activeVersionIndex}.managerFeedback`] = feedback;
      updateOps.$set[`versions.${activeVersionIndex}.feedbackBy`] = actorId;
      updateOps.$set[`versions.${activeVersionIndex}.feedbackAt`] = new Date();
    }

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "WAITING_APPROVAL" },
      updateOps,
      { new: true }
    );

    if (!updated) {
      throw new Error(`Conflict: Could not request changes on approval '${approvalId}'.`);
    }

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "WAITING_APPROVAL",
      toStatus: "CHANGES_REQUESTED",
      action: "REQUEST_CHANGES",
      actorType: "USER",
      actorId,
      actorRole,
      remarks: feedback,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Starts regeneration after changes are requested
   */
  async startRegeneration({ approvalId, sourceAgent = null, actorId = null }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "REGENERATING");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: doc.status },
      { $set: { status: "REGENERATING" } },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: doc.status,
      toStatus: "REGENERATING",
      action: "START_REGENERATION",
      actorType: sourceAgent ? "AI_AGENT" : "USER",
      actorId,
      actorRole: sourceAgent || "System",
      remarks: "Agent initiated regeneration with feedback.",
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Completes regeneration and adds a new immutable version snapshot (e.g. Version 2)
   */
  async completeRegeneration({
    approvalId,
    newBlueprintPayload = {},
    newExecutionPayload = {},
    newPreviewUrl = null,
    generatedBy = "CreativeAgent",
    sourceAgentRunId = null,
  }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "AI_GENERATED");

    const nextVersionNumber = (doc.currentVersion || 1) + 1;

    // Mark previous versions as superseded
    const updatedVersions = doc.versions.map((v) => ({ ...v.toObject(), superseded: true }));

    const newVersion = {
      versionNumber: nextVersionNumber,
      createdAt: new Date(),
      generatedByType: "AI_AGENT",
      generatedBy,
      blueprintPayload: newBlueprintPayload,
      executionPayload: newExecutionPayload,
      previewUrl: newPreviewUrl,
      assetIds: [],
      managerFeedback: null,
      superseded: false,
    };

    updatedVersions.push(newVersion);

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "REGENERATING" },
      {
        $set: {
          status: "WAITING_APPROVAL", // Auto-route to review for manager
          currentVersion: nextVersionNumber,
          versions: updatedVersions,
          sourceAgentRunId: sourceAgentRunId || doc.sourceAgentRunId,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Conflict: Could not complete regeneration for '${approvalId}'.`);
    }

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "REGENERATING",
      toStatus: "WAITING_APPROVAL",
      action: "COMPLETE_REGENERATION",
      actorType: "AI_AGENT",
      actorRole: generatedBy,
      remarks: `Version ${nextVersionNumber} generated successfully. Ready for review.`,
      version: nextVersionNumber,
      sourceAgentRunId,
    });

    return updated;
  }

  /**
   * Rejects an approval request in WAITING_APPROVAL status (Terminal)
   */
  async reject({ approvalId, actorId, actorRole = "Manager", reason = "" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "REJECTED");

    const now = new Date();
    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "WAITING_APPROVAL" },
      {
        $set: {
          status: "REJECTED",
          decidedBy: actorId,
          decisionRemarks: reason,
          rejectedAt: now,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Conflict: Approval request '${approvalId}' was already modified.`);
    }

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "WAITING_APPROVAL",
      toStatus: "REJECTED",
      action: "REJECT",
      actorType: "USER",
      actorId,
      actorRole,
      remarks: reason,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Cancels an approval request from any active non-terminal state (Terminal)
   */
  async cancel({ approvalId, actorId, actorRole = "Admin", reason = "" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "CANCELLED");

    const now = new Date();
    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: doc.status },
      {
        $set: {
          status: "CANCELLED",
          decidedBy: actorId,
          decisionRemarks: reason,
          cancelledAt: now,
        },
      },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: doc.status,
      toStatus: "CANCELLED",
      action: "CANCEL",
      actorType: "USER",
      actorId,
      actorRole,
      remarks: reason,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Transitions an APPROVED item into QUEUED (Used by worker dispatcher)
   */
  async markQueued({ approvalId, queueName = "default" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "QUEUED");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "APPROVED" },
      {
        $set: {
          status: "QUEUED",
          queuedAt: new Date(),
          "metadata.queueName": queueName,
        },
      },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "APPROVED",
      toStatus: "QUEUED",
      action: "QUEUE_EXECUTION",
      actorType: "SYSTEM",
      actorRole: "WorkerDispatcher",
      remarks: `Enqueued to ${queueName}`,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Transitions QUEUED into EXECUTING
   */
  async markExecuting({ approvalId, workerJobId = null }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "EXECUTING");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "QUEUED" },
      {
        $set: {
          status: "EXECUTING",
          executionStartedAt: new Date(),
          "metadata.workerJobId": workerJobId,
        },
      },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "QUEUED",
      toStatus: "EXECUTING",
      action: "START_EXECUTION",
      actorType: "SYSTEM",
      actorRole: "QueueWorker",
      remarks: `Worker began execution. Job: ${workerJobId}`,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Marks execution as EXECUTED (Terminal success)
   */
  async markExecuted({ approvalId, executionResult = {} }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "EXECUTED");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: "EXECUTING" },
      {
        $set: {
          status: "EXECUTED",
          executedAt: new Date(),
          "metadata.executionResult": executionResult,
        },
      },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: "EXECUTING",
      toStatus: "EXECUTED",
      action: "FINISH_EXECUTION",
      actorType: "SYSTEM",
      actorRole: "QueueWorker",
      remarks: "Execution completed successfully.",
      version: updated.currentVersion,
      metadata: executionResult,
    });

    return updated;
  }

  /**
   * Marks execution as FAILED
   */
  async markFailed({ approvalId, failureReason = "Unknown error" }) {
    const doc = await ApprovalRequest.findOne({ $or: [{ approvalId }, { _id: approvalId }] });
    if (!doc) throw new Error(`Approval request not found: ${approvalId}`);

    this.validateTransition(doc.status, "FAILED");

    const updated = await ApprovalRequest.findOneAndUpdate(
      { _id: doc._id, status: doc.status },
      {
        $set: {
          status: "FAILED",
          failedAt: new Date(),
          failureReason,
        },
      },
      { new: true }
    );

    await this.logTransition({
      approvalId: updated.approvalId,
      approvalRequestId: updated._id,
      fromStatus: doc.status,
      toStatus: "FAILED",
      action: "EXECUTION_FAILED",
      actorType: "SYSTEM",
      actorRole: "QueueWorker",
      remarks: failureReason,
      version: updated.currentVersion,
    });

    return updated;
  }

  /**
   * Queries approvals with rich filters and pagination
   */
  async getApprovals({
    status = null,
    domain = null,
    riskLevel = null,
    customer = null,
    assignedTo = null,
    limit = 50,
    page = 1,
  } = {}) {
    const query = {};
    if (status) query.status = status;
    if (domain) query.domain = domain;
    if (riskLevel) query.riskLevel = riskLevel;
    if (customer) query.customer = customer;
    if (assignedTo) query.assignedTo = assignedTo;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ApprovalRequest.find(query)
        .populate("customer", "name companyName brandName logoUrl")
        .populate("clientLocation", "name city")
        .populate("submittedBy", "name email role")
        .populate("decidedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ApprovalRequest.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Retrieves single approval with full version history and audit timeline
   */
  async getApprovalDetail(approvalId) {
    const doc = await ApprovalRequest.findOne({
      $or: [{ approvalId }, { _id: approvalId }],
    })
      .populate("customer", "name companyName brandName logoUrl phone email")
      .populate("clientLocation", "name city address phone")
      .populate("submittedBy", "name email role")
      .populate("decidedBy", "name email role")
      .lean();

    if (!doc) return null;

    const history = await ApprovalAuditLog.find({
      $or: [{ approvalId: doc.approvalId }, { approvalRequestId: doc._id }],
    })
      .populate("actorId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return { ...doc, auditHistory: history };
  }
}

module.exports = new ApprovalEngine();
