/**
 * auditService.js
 * Centralized Audit Logging Service for AI Command Executions.
 */

const AuditLog = require("../../models/AuditLog");

exports.logCommandExecution = async ({
  executionId,
  commandName,
  riskLevel,
  userId,
  userRole = "Manager",
  customerId = null,
  clientLocationId = null,
  inputSummary = "",
  outputSummary = "",
  before = null,
  after = null,
  approvalRequired = false,
  status = "Success",
  error = "",
}) => {
  try {
    const actorType = userRole === "Admin" ? "Admin" : userRole === "Manager" ? "Manager" : "AI Agent";

    const log = await AuditLog.create({
      actorType,
      actorId: userId || null,
      actorName: userRole || "Manager",
      agentId: "UniversalCommandEngine",
      agentRunId: executionId,
      action: `AI_COMMAND_${commandName.replace(/\./g, "_").toUpperCase()}`,
      entityType: "AICommandExecution",
      customerId: customerId || null,
      clientLocationId: clientLocationId || null,
      inputSummary: inputSummary || commandName,
      outputSummary: outputSummary || status,
      before: before || null,
      after: after || null,
      approvalRequired: Boolean(approvalRequired),
      status: status === "Success" ? "Success" : status === "Warning" ? "Warning" : status === "Pending" ? "Pending Approval" : "Error",
      error: error || "",
    });

    return log;
  } catch (err) {
    console.error("[AuditService] Failed to write audit log:", err.message);
    return null;
  }
};
