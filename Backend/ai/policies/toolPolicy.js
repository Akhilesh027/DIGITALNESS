/**
 * toolPolicy.js
 * Tool Permission Levels & Policy Enforcement
 */

const PERMISSIONS = {
  READ: "READ",
  DRAFT: "DRAFT",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  BLOCKED: "BLOCKED",
};

const TOOL_PERMISSIONS = {
  // Read Tools
  getClientProfile: PERMISSIONS.READ,
  getClientLocations: PERMISSIONS.READ,
  getAgentContext: PERMISSIONS.READ,
  getClientAssets: PERMISSIONS.READ,
  getApprovedMemory: PERMISSIONS.READ,
  getWorks: PERMISSIONS.READ,
  getContentItems: PERMISSIONS.READ,
  getCreativeProjects: PERMISSIONS.READ,
  getApprovals: PERMISSIONS.READ,
  getReadiness: PERMISSIONS.READ,

  // Write Tools (Draft Mode)
  createWork: PERMISSIONS.DRAFT,
  updateWorkDraft: PERMISSIONS.DRAFT,
  createContentItem: PERMISSIONS.DRAFT,
  updateContentItemDraft: PERMISSIONS.DRAFT,
  createCreativeProject: PERMISSIONS.DRAFT,
  addCreativeVersion: PERMISSIONS.DRAFT,
  createWorkApproval: PERMISSIONS.DRAFT,
  createNotification: PERMISSIONS.DRAFT,
  createAuditLog: PERMISSIONS.DRAFT,

  // Actions Needing Explicit Approval
  scheduleApprovedContent: PERMISSIONS.APPROVAL_REQUIRED,

  // Strictly Blocked Tools
  changeEmployeeSalary: PERMISSIONS.BLOCKED,
  deleteCustomer: PERMISSIONS.BLOCKED,
  resetDatabase: PERMISSIONS.BLOCKED,
};

exports.PERMISSIONS = PERMISSIONS;
exports.TOOL_PERMISSIONS = TOOL_PERMISSIONS;

exports.checkToolPermission = (toolName, role = "User") => {
  const perm = TOOL_PERMISSIONS[toolName] || PERMISSIONS.BLOCKED;
  if (perm === PERMISSIONS.BLOCKED) {
    return { allowed: false, reason: `Tool '${toolName}' is strictly BLOCKED by system policy.` };
  }
  return { allowed: true, permissionLevel: perm };
};
