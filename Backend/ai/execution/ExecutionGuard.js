/**
 * ExecutionGuard.js
 * Mandatory safety and governance barrier before background execution.
 * 
 * Verifies:
 * 1. ApprovalRequest exists and has status APPROVED or QUEUED.
 * 2. Tenant isolation (customerId matches).
 * 3. Branch isolation (locationId matches if branch-specific).
 * 4. Operation matching (executionIntent matches operation).
 * 5. Version binding (approved version snapshot matches current resource version).
 * 6. Protection against cancelled, rejected, or duplicate/already executed requests.
 */

const ApprovalRequest = require("../../models/ApprovalRequest");

class ExecutionGuard {
  /**
   * Validates whether an execution job is authorized to proceed.
   */
  async validateExecution({
    approvalId,
    operation,
    customerId,
    locationId = null,
    resourceId = null,
    resourceVersion = 1,
    riskLevel = "R2",
  }) {
    // 1. R2 and R3 actions strictly require an approvalId
    if (["R2", "R3"].includes(riskLevel) && !approvalId) {
      return {
        valid: false,
        code: "APPROVAL_ID_REQUIRED",
        message: `Operation '${operation}' is classified as ${riskLevel} and requires an explicit approvalId.`,
      };
    }

    if (!approvalId) {
      // R0 / R1 internal automated tasks without approval
      return { valid: true, approvalDoc: null };
    }

    // 2. Load ApprovalRequest
    const approval = await ApprovalRequest.findById(approvalId);
    if (!approval) {
      return {
        valid: false,
        code: "APPROVAL_NOT_FOUND",
        message: `ApprovalRequest with ID '${approvalId}' does not exist.`,
      };
    }

    // 3. Status Validation
    if (approval.status === "CANCELLED") {
      return {
        valid: false,
        code: "APPROVAL_CANCELLED",
        message: `Approval '${approval.approvalId}' was cancelled and cannot be executed.`,
      };
    }

    if (approval.status === "REJECTED") {
      return {
        valid: false,
        code: "APPROVAL_REJECTED",
        message: `Approval '${approval.approvalId}' was rejected and cannot be executed.`,
      };
    }

    if (approval.status === "EXECUTED") {
      return {
        valid: false,
        code: "ALREADY_EXECUTED",
        message: `Approval '${approval.approvalId}' has already been executed. Duplicate execution blocked.`,
      };
    }

    if (!["APPROVED", "QUEUED", "EXECUTING"].includes(approval.status)) {
      return {
        valid: false,
        code: "APPROVAL_NOT_EXECUTABLE",
        message: `Approval '${approval.approvalId}' is in status '${approval.status}'. Must be APPROVED or QUEUED.`,
      };
    }

    // 4. Multi-Tenant Validation
    if (customerId && approval.customer && approval.customer.toString() !== customerId.toString()) {
      return {
        valid: false,
        code: "TENANT_MISMATCH",
        message: `Customer mismatch. Job customer '${customerId}' does not match approval customer '${approval.customer}'.`,
      };
    }

    // 5. Branch Location Validation
    if (locationId && approval.clientLocation && approval.clientLocation.toString() !== locationId.toString()) {
      return {
        valid: false,
        code: "LOCATION_MISMATCH",
        message: `Location mismatch. Job location '${locationId}' does not match approval location '${approval.clientLocation}'.`,
      };
    }

    // 6. Operation Matching
    if (operation && approval.executionIntent?.action) {
      const normalizedOp = operation.toLowerCase();
      const normalizedIntent = approval.executionIntent.action.toLowerCase();
      if (normalizedOp !== normalizedIntent && !normalizedIntent.includes(normalizedOp) && !normalizedOp.includes(normalizedIntent)) {
        return {
          valid: false,
          code: "OPERATION_MISMATCH",
          message: `Operation '${operation}' does not match approved execution intent '${approval.executionIntent.action}'.`,
        };
      }
    }

    // 7. Version Binding Validation
    // Ensure that if the resource was modified (e.g. V2), it does not execute under a V1 approval
    const approvedVersionNumber = approval.currentVersion || 1;
    if (resourceVersion && resourceVersion !== approvedVersionNumber) {
      return {
        valid: false,
        code: "VERSION_MISMATCH",
        message: `Resource version ${resourceVersion} does not match approved version snapshot V${approvedVersionNumber}.`,
      };
    }

    return {
      valid: true,
      approvalDoc: approval,
    };
  }
}

module.exports = new ExecutionGuard();
