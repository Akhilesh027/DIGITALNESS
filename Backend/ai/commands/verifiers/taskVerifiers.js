/**
 * taskVerifiers.js
 * Post-execution database state verifiers for Task commands.
 */

const Work = require("../../../models/Work");

exports.verifyTaskAssign = async ({ taskId, expectedAssigneeId }) => {
  const task = await Work.findById(taskId).lean();
  if (!task) {
    return { verified: false, reason: `Task '${taskId}' not found during verification.` };
  }

  const assignedStr = (task.assignedTo || []).map((id) => String(id));
  const isAssigned = assignedStr.includes(String(expectedAssigneeId));

  return {
    verified: isAssigned,
    query: { taskId, field: "assignedTo" },
    expected: String(expectedAssigneeId),
    actual: assignedStr,
    reason: isAssigned
      ? `Task assignedTo verified successfully in MongoDB.`
      : `Verification failed: expected assignedTo '${expectedAssigneeId}', found '${assignedStr.join(", ")}'`,
  };
};

exports.verifyTaskCreate = async ({ taskId, expectedCustomer }) => {
  const task = await Work.findById(taskId).lean();
  if (!task) {
    return { verified: false, reason: `Created task '${taskId}' not found in MongoDB.` };
  }

  const customerMatch = !expectedCustomer || String(task.customer) === String(expectedCustomer);
  return {
    verified: customerMatch,
    query: { taskId },
    expected: { customer: String(expectedCustomer) },
    actual: { customer: String(task.customer) },
    reason: customerMatch
      ? `Task record verified exists in MongoDB.`
      : `Customer ID mismatch on created task.`,
  };
};

exports.verifyTaskComplete = async ({ taskId }) => {
  const task = await Work.findById(taskId).lean();
  if (!task) {
    return { verified: false, reason: `Task '${taskId}' not found.` };
  }

  const isCompleted = task.status === "Completed";
  return {
    verified: isCompleted,
    query: { taskId, field: "status" },
    expected: "Completed",
    actual: task.status,
    reason: isCompleted
      ? `Task status verified as 'Completed' in MongoDB.`
      : `Task status is '${task.status}', expected 'Completed'.`,
  };
};
