/**
 * approvalController.js
 * Express controllers for Universal Approval & Governance Engine
 */

const ApprovalEngine = require("../ai/approval/ApprovalEngine");
const ApprovalRequest = require("../models/ApprovalRequest");
const WorkApproval = require("../models/WorkApproval");

/**
 * GET /api/approvals
 * Lists approval requests with filtering, pagination, and optional legacy WorkApproval aggregation
 */
exports.getApprovals = async (req, res) => {
  try {
    const {
      status,
      domain,
      riskLevel,
      customer,
      assignedTo,
      page = 1,
      limit = 50,
      includeLegacy = "true",
    } = req.query;

    const result = await ApprovalEngine.getApprovals({
      status,
      domain,
      riskLevel,
      customer,
      assignedTo,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    let legacyItems = [];
    if (includeLegacy === "true" && (!domain || domain === "INTERNAL" || domain === "CONTENT" || domain === "CREATIVE")) {
      const legacyQuery = {};
      if (status) {
        if (status === "WAITING_APPROVAL") legacyQuery.status = "Pending Approval";
        else if (status === "APPROVED") legacyQuery.status = "Approved";
        else if (status === "REJECTED") legacyQuery.status = "Rejected";
        else if (status === "CHANGES_REQUESTED") legacyQuery.status = "Revision Requested";
      }

      legacyItems = await WorkApproval.find(legacyQuery)
        .populate("customer", "name companyName brandName")
        .populate("submittedBy", "name email role")
        .populate("reviewedBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Transform legacy to compatible shape
      legacyItems = legacyItems.map((l) => ({
        _id: l._id,
        approvalId: `LEGACY-${l._id}`,
        title: l.reviewMessage || `${l.approvalType} Review`,
        description: l.adminRemark || "",
        domain: l.approvalType ? l.approvalType.toUpperCase() : "INTERNAL",
        riskLevel: "R1",
        status:
          l.status === "Pending Approval"
            ? "WAITING_APPROVAL"
            : l.status === "Approved"
            ? "APPROVED"
            : l.status === "Rejected"
            ? "REJECTED"
            : l.status === "Revision Requested"
            ? "CHANGES_REQUESTED"
            : "WAITING_APPROVAL",
        customer: l.customer,
        submittedBy: l.submittedBy,
        decidedBy: l.reviewedBy,
        currentVersion: (l.revisionCount || 0) + 1,
        versions: [],
        isLegacy: true,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }));
    }

    return res.status(200).json({
      success: true,
      total: result.total + legacyItems.length,
      page: result.page,
      limit: result.limit,
      data: [...result.items, ...legacyItems],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/approvals/:id
 * Fetches single approval with full version snapshots and audit history
 */
exports.getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it is a legacy item
    if (id.startsWith("LEGACY-")) {
      const realId = id.replace("LEGACY-", "");
      const legacyDoc = await WorkApproval.findById(realId)
        .populate("customer", "name companyName brandName phone email")
        .populate("submittedBy", "name email role")
        .populate("reviewedBy", "name email role")
        .lean();

      if (!legacyDoc) {
        return res.status(404).json({ success: false, message: "Legacy approval not found." });
      }

      return res.status(200).json({
        success: true,
        data: {
          _id: legacyDoc._id,
          approvalId: id,
          title: legacyDoc.reviewMessage || `${legacyDoc.approvalType} Review`,
          description: legacyDoc.adminRemark || "",
          domain: legacyDoc.approvalType ? legacyDoc.approvalType.toUpperCase() : "INTERNAL",
          riskLevel: "R1",
          status:
            legacyDoc.status === "Pending Approval"
              ? "WAITING_APPROVAL"
              : legacyDoc.status === "Approved"
              ? "APPROVED"
              : legacyDoc.status === "Rejected"
              ? "REJECTED"
              : "CHANGES_REQUESTED",
          customer: legacyDoc.customer,
          submittedBy: legacyDoc.submittedBy,
          decidedBy: legacyDoc.reviewedBy,
          currentVersion: (legacyDoc.revisionCount || 0) + 1,
          versions: [],
          auditHistory: [],
          isLegacy: true,
        },
      });
    }

    const doc = await ApprovalEngine.getApprovalDetail(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Approval request not found." });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals
 * Creates a new approval request
 */
exports.createApproval = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      submittedBy: req.user?._id || req.body.submittedBy,
      submittedByType: req.body.submittedByType || (req.user ? "USER" : "AI_AGENT"),
    };

    const doc = await ApprovalEngine.createApprovalRequest(payload);
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals/:id/submit
 * Submits DRAFT or AI_GENERATED to WAITING_APPROVAL
 */
exports.submitApproval = async (req, res) => {
  try {
    const doc = await ApprovalEngine.submitForApproval({
      approvalId: req.params.id,
      actorId: req.user?._id,
      actorRole: req.user?.role || "Employee",
      remarks: req.body.remarks || "",
    });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals/:id/approve
 * Approves a request (Atomic & RBAC gated)
 */
exports.approveApproval = async (req, res) => {
  try {
    const userRole = req.user?.role || req.body.userRole || "Manager";
    const userId = req.user?._id || req.body.userId;

    const result = await ApprovalEngine.approve({
      approvalId: req.params.id,
      actorId: userId,
      actorRole: userRole,
      remarks: req.body.remarks || "",
    });

    return res.status(200).json({ success: true, data: result.doc, alreadyApproved: result.alreadyApproved });
  } catch (err) {
    const statusCode = err.code === "UNAUTHORIZED_APPROVAL" ? 403 : 400;
    return res.status(statusCode).json({ success: false, message: err.message, code: err.code });
  }
};

/**
 * POST /api/approvals/:id/reject
 * Rejects a request
 */
exports.rejectApproval = async (req, res) => {
  try {
    const userRole = req.user?.role || req.body.userRole || "Manager";
    const userId = req.user?._id || req.body.userId;

    const doc = await ApprovalEngine.reject({
      approvalId: req.params.id,
      actorId: userId,
      actorRole: userRole,
      reason: req.body.reason || req.body.remarks || "",
    });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals/:id/request-changes
 * Requests revisions from the AI agent or creator
 */
exports.requestChanges = async (req, res) => {
  try {
    const userRole = req.user?.role || req.body.userRole || "Manager";
    const userId = req.user?._id || req.body.userId;
    const feedback = req.body.feedback || req.body.remarks || req.body.reason;

    const doc = await ApprovalEngine.requestChanges({
      approvalId: req.params.id,
      actorId: userId,
      actorRole: userRole,
      feedback,
    });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals/:id/cancel
 * Cancels an active approval
 */
exports.cancelApproval = async (req, res) => {
  try {
    const userRole = req.user?.role || req.body.userRole || "Admin";
    const userId = req.user?._id || req.body.userId;

    const doc = await ApprovalEngine.cancel({
      approvalId: req.params.id,
      actorId: userId,
      actorRole: userRole,
      reason: req.body.reason || "",
    });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/approvals/:id/version
 * Triggers version creation / regeneration
 */
exports.addVersion = async (req, res) => {
  try {
    const { newBlueprintPayload, newExecutionPayload, newPreviewUrl, generatedBy } = req.body;

    const doc = await ApprovalEngine.completeRegeneration({
      approvalId: req.params.id,
      newBlueprintPayload,
      newExecutionPayload,
      newPreviewUrl,
      generatedBy: generatedBy || "CreativeAgent",
    });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/approvals/:id/history
 * Returns audit trail
 */
exports.getApprovalHistory = async (req, res) => {
  try {
    const doc = await ApprovalEngine.getApprovalDetail(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Approval not found." });
    return res.status(200).json({ success: true, data: doc.auditHistory || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
