/**
 * rollbackService.js
 * Rollback & Undo Engine for Digitalness CRM V2.
 * Safely restores pre-mutation database state for supported operations.
 */

const Work = require("../../models/Work");
const Lead = require("../../models/Lead");
const Customer = require("../../models/Customer");
const ContentItem = require("../../models/ContentItem");

const ROLLBACK_CLASSIFICATION = {
  // Safe to rollback
  "task.assign": "SAFE",
  "task.create": "SAFE",
  "lead.assign": "SAFE",
  "content.create": "SAFE",

  // Conditional rollback (checks for dependent child records)
  "customer.create": "CONDITIONAL",
  "lead.create": "CONDITIONAL",
  "task.complete": "CONDITIONAL",
  "content.reject": "CONDITIONAL",

  // Never auto-rollback
  "payment.record": "BLOCKED",
  "content.schedule": "BLOCKED",
  "customer.delete": "BLOCKED",
};

/**
 * Capture before-state before executing a mutation
 */
exports.captureBeforeState = async (commandName, params = {}, resolvedEntities = {}) => {
  const classification = ROLLBACK_CLASSIFICATION[commandName];
  if (!classification || classification === "BLOCKED") {
    return null;
  }

  try {
    if (commandName === "task.assign") {
      const taskId = params.taskId || resolvedEntities.taskId;
      if (!taskId) return null;
      const task = await Work.findById(taskId).lean();
      return {
        taskId,
        previousAssignedTo: (task?.assignedTo || []).map((id) => String(id)),
      };
    }

    if (commandName === "lead.assign") {
      const leadId = params.leadId || resolvedEntities.leadId;
      if (!leadId) return null;
      const lead = await Lead.findById(leadId).lean();
      return {
        leadId,
        previousAssignedTo: lead?.assignedTo ? String(lead.assignedTo) : null,
      };
    }

    if (commandName === "task.complete") {
      const taskId = params.taskId || resolvedEntities.taskId;
      if (!taskId) return null;
      const task = await Work.findById(taskId).lean();
      return {
        taskId,
        previousStatus: task?.status || "In Progress",
      };
    }
  } catch (err) {
    console.warn(`[RollbackService] Failed to capture before-state for ${commandName}:`, err.message);
  }

  return null;
};

/**
 * Execute rollback based on captured before-state and execution result
 */
exports.executeRollback = async ({ commandName, beforeState, executionResult, userId }) => {
  const classification = ROLLBACK_CLASSIFICATION[commandName];

  if (classification === "BLOCKED" || commandName === "payment.record") {
    throw new Error(`Automatic rollback is NOT permitted for '${commandName}'. Financial and external mutations require manual reversal.`);
  }

  if (commandName === "task.assign") {
    if (!beforeState || !beforeState.taskId) {
      throw new Error("Missing before-state data for task assignment rollback.");
    }
    const task = await Work.findById(beforeState.taskId);
    if (!task) throw new Error("Target task not found during rollback.");

    task.assignedTo = beforeState.previousAssignedTo || [];
    task.timeline.push({
      title: "Task Assignment Rolled Back",
      description: `Reverted assignment via AI Rollback by user ${userId || "Manager"}`,
      createdBy: userId || null,
      createdAt: new Date(),
    });

    await task.save();
    return {
      success: true,
      message: `Task assignment successfully rolled back to previous owner.`,
      restoredState: { assignedTo: task.assignedTo },
    };
  }

  if (commandName === "task.create") {
    const taskId = executionResult?._id || executionResult?.taskId;
    if (taskId) {
      await Work.findByIdAndDelete(taskId);
      return { success: true, message: `Created task '${taskId}' successfully deleted (rolled back).` };
    }
  }

  if (commandName === "lead.assign") {
    if (!beforeState || !beforeState.leadId) {
      throw new Error("Missing before-state data for lead assignment rollback.");
    }
    const lead = await Lead.findById(beforeState.leadId);
    if (!lead) throw new Error("Target lead not found during rollback.");

    lead.assignedTo = beforeState.previousAssignedTo || null;
    lead.notes.push(`Lead assignment rolled back on ${new Date().toLocaleDateString()}`);
    await lead.save();

    return {
      success: true,
      message: `Lead assignment rolled back to previous assignee.`,
      restoredState: { assignedTo: lead.assignedTo },
    };
  }

  // CONDITIONAL ROLLBACK: lead.create (check for dependent proposals, deals, callLogs)
  if (commandName === "lead.create") {
    const leadId = executionResult?._id || executionResult?.leadId;
    if (!leadId) throw new Error("Lead ID missing from execution result.");

    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error("Target lead not found for rollback.");

    if (lead.convertedToCustomer || lead.proposalCreated || (lead.callLogs && lead.callLogs.length > 1)) {
      throw new Error("Automatic rollback blocked: Lead has converted to customer, proposal, or multiple follow-up logs. Manual cleanup required.");
    }

    await Lead.findByIdAndDelete(leadId);
    return { success: true, message: `Created lead '${leadId}' successfully removed.` };
  }

  // CONDITIONAL ROLLBACK: customer.create (check for dependent works, locations, invoices)
  if (commandName === "customer.create") {
    const custId = executionResult?._id || executionResult?.customerId;
    if (!custId) throw new Error("Customer ID missing from execution result.");

    const dependentTasksCount = await Work.countDocuments({ customer: custId });
    if (dependentTasksCount > 0) {
      throw new Error(`Automatic rollback blocked: Customer has ${dependentTasksCount} active dependent tasks. Manual resolution required.`);
    }

    await Customer.findByIdAndDelete(custId);
    return { success: true, message: `Created customer '${custId}' successfully removed.` };
  }

  throw new Error(`Rollback handler not implemented for command '${commandName}'.`);
};

exports.ROLLBACK_CLASSIFICATION = ROLLBACK_CLASSIFICATION;
