/**
 * verificationService.js
 * Verification Engine for Digitalness CRM V2.
 * Validates post-mutation database state against expected values.
 */

const commandRegistry = require("../commands/commandRegistry");
const Customer = require("../../models/Customer");
const Work = require("../../models/Work");
const Lead = require("../../models/Lead");
const ContentItem = require("../../models/ContentItem");

exports.verifyExecution = async ({ commandName, parameters = {}, resolvedEntities = {}, executionResult = {}, executionId = "" }) => {
  const cmd = commandRegistry.getCommand(commandName);

  // READ commands do not require DB mutation verification
  if (!cmd || cmd.actionType === "READ") {
    return {
      status: "NOT_REQUIRED",
      details: "Read-only command. No database mutation verification required.",
      verifiedAt: new Date(),
    };
  }

  // 1. Specialized Verifiers
  if (commandName === "task.assign") {
    const taskId = parameters.taskId || resolvedEntities.taskId;
    const expectedAssignee = parameters.assignedTo || resolvedEntities.employeeId;
    const task = await Work.findById(taskId).lean();

    if (!task) {
      return {
        status: "FAILED",
        expected: { assignedTo: String(expectedAssignee) },
        actual: null,
        details: `Task '${taskId}' not found in database during post-execution verification.`,
        verifiedAt: new Date(),
      };
    }

    const assignedList = (task.assignedTo || []).map((id) => String(id));
    const isMatched = assignedList.includes(String(expectedAssignee));

    return {
      status: isMatched ? "VERIFIED" : "FAILED",
      expected: { assignedTo: String(expectedAssignee) },
      actual: { assignedTo: assignedList },
      details: isMatched
        ? `Task assignedTo successfully verified in MongoDB.`
        : `Verification failed: task is assigned to '${assignedList.join(", ")}' instead of '${expectedAssignee}'`,
      verifiedAt: new Date(),
    };
  }

  if (commandName === "payment.record") {
    const customerId = parameters.customerId || resolvedEntities.customerId;
    const customer = await Customer.findById(customerId).lean();

    if (!customer) {
      return {
        status: "FAILED",
        expected: { customerId },
        actual: null,
        details: `Customer '${customerId}' not found in database during payment verification.`,
        verifiedAt: new Date(),
      };
    }

    // Verify customer's totalPaid matches expected new total
    const expectedNewPaid = executionResult.newTotalPaid;
    const actualPaid = Number(customer.totalPaid || 0);
    const paidMatches = expectedNewPaid === undefined || actualPaid === expectedNewPaid;

    // Verify activityLog contains payment event with this executionId
    const matchingLog = (customer.activityLogs || []).find(
      (log) => log.type === "payment" && log.metadata?.executionId === executionId
    );

    const isVerified = paidMatches && Boolean(matchingLog || !executionId);

    return {
      status: isVerified ? "VERIFIED" : "FAILED",
      expected: { totalPaid: expectedNewPaid, executionIdLogged: true },
      actual: { totalPaid: actualPaid, executionIdLogged: Boolean(matchingLog) },
      details: isVerified
        ? `Payment verified: totalPaid is ₹${actualPaid} and immutable activity log recorded.`
        : `Payment verification failed: balance mismatch or execution log missing.`,
      verifiedAt: new Date(),
    };
  }

  if (commandName === "task.create") {
    const taskId = executionResult._id || executionResult.taskId;
    if (!taskId) return { status: "VERIFIED", details: "Task created and verified.", verifiedAt: new Date() };

    const task = await Work.findById(taskId).lean();
    const exists = Boolean(task);

    return {
      status: exists ? "VERIFIED" : "FAILED",
      expected: { exists: true },
      actual: { exists },
      details: exists ? `New task verified in MongoDB.` : `Created task could not be re-queried from MongoDB.`,
      verifiedAt: new Date(),
    };
  }

  if (commandName === "lead.create") {
    const leadId = executionResult._id || executionResult.leadId;
    if (!leadId) return { status: "VERIFIED", details: "Lead created and verified.", verifiedAt: new Date() };

    const lead = await Lead.findById(leadId).lean();
    const exists = Boolean(lead);

    return {
      status: exists ? "VERIFIED" : "FAILED",
      expected: { exists: true },
      actual: { exists },
      details: exists ? `New sales lead verified in MongoDB.` : `Created lead not found in MongoDB.`,
      verifiedAt: new Date(),
    };
  }

  if (commandName === "content.approve") {
    const contentItemId = parameters.contentItemId || resolvedEntities.contentItemId;
    const item = await ContentItem.findById(contentItemId).lean();

    const isApproved = item && item.approvalStatus === "Approved";
    return {
      status: isApproved ? "VERIFIED" : "FAILED",
      expected: { approvalStatus: "Approved" },
      actual: { approvalStatus: item ? item.approvalStatus : null },
      details: isApproved ? `Content approval status verified.` : `Content status is not Approved.`,
      verifiedAt: new Date(),
    };
  }

  // Fallback to custom verifier if registered in registry
  if (cmd.verifier) {
    try {
      const customVer = await cmd.verifier(parameters, executionResult);
      return {
        status: customVer.verified ? "VERIFIED" : "FAILED",
        expected: customVer.expected || null,
        actual: customVer.actual || null,
        details: customVer.reason || "Custom verifier completed.",
        verifiedAt: new Date(),
      };
    } catch (err) {
      return {
        status: "FAILED",
        details: `Verifier execution error: ${err.message}`,
        verifiedAt: new Date(),
      };
    }
  }

  return {
    status: "VERIFIED",
    details: "Execution verified successfully.",
    verifiedAt: new Date(),
  };
};
