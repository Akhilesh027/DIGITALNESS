/**
 * leadVerifiers.js
 * Post-execution database state verifiers for Lead commands.
 */

const Lead = require("../../../models/Lead");

exports.verifyLeadAssign = async ({ leadId, expectedAssigneeId }) => {
  const lead = await Lead.findById(leadId).lean();
  if (!lead) {
    return { verified: false, reason: `Lead '${leadId}' not found during verification.` };
  }

  const matches = String(lead.assignedTo) === String(expectedAssigneeId);
  return {
    verified: matches,
    query: { leadId, field: "assignedTo" },
    expected: String(expectedAssigneeId),
    actual: String(lead.assignedTo),
    reason: matches
      ? `Lead assignedTo verified in MongoDB.`
      : `Verification failed: expected assignedTo '${expectedAssigneeId}', found '${lead.assignedTo}'`,
  };
};

exports.verifyLeadCreate = async ({ leadId, expectedName }) => {
  const lead = await Lead.findById(leadId).lean();
  if (!lead) {
    return { verified: false, reason: `Created lead '${leadId}' not found in MongoDB.` };
  }

  const matches = !expectedName || lead.name === expectedName;
  return {
    verified: matches,
    query: { leadId },
    expected: { name: expectedName },
    actual: { name: lead.name },
    reason: matches ? "Lead verified created in MongoDB." : "Lead name mismatch.",
  };
};
