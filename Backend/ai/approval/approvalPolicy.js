/**
 * approvalPolicy.js
 * Centralized Risk Standard & Role-Based Approval Policy for Digitalness CRM
 */

const RISK_LEVELS = {
  R0: "R0", // Read / Analysis (No approval required)
  R1: "R1", // Draft / Internal Generation (Instant creation, optional review)
  R2: "R2", // Public External Communication (Manager approval required)
  R3: "R3", // Financial / High-Impact (Mandatory Admin/Manager approval)
  BLOCKED: "BLOCKED", // Restricted destructive actions
};

const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  OPERATIONAL_MANAGER: "Operational Manager",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  TELECALLER: "Telecaller",
  CLIENT_POC: "ClientPOC",
};

/**
 * Checks whether an actor can approve a given risk level.
 */
exports.canUserApprove = ({ userRole, riskLevel, submittedById = null, userId = null }) => {
  if (!userRole) return { allowed: false, reason: "User role not provided." };

  const role = String(userRole).trim();
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isManager = role === ROLES.MANAGER || role === ROLES.OPERATIONAL_MANAGER || isAdmin;

  // Self-approval protection for R3
  if (riskLevel === RISK_LEVELS.R3) {
    if (submittedById && userId && String(submittedById) === String(userId)) {
      if (!isAdmin) {
        return {
          allowed: false,
          reason: "Self-approval for R3 (Financial/High-Impact) actions is restricted. An independent manager/admin must approve.",
        };
      }
    }
  }

  switch (riskLevel) {
    case RISK_LEVELS.R0:
    case RISK_LEVELS.R1:
      return { allowed: true };

    case RISK_LEVELS.R2:
      if (!isManager) {
        return {
          allowed: false,
          reason: "R2 Public Communication actions require Manager or Admin approval.",
        };
      }
      return { allowed: true };

    case RISK_LEVELS.R3:
      if (!isManager) {
        return {
          allowed: false,
          reason: "R3 Financial/High-Impact actions require Admin or authorized Manager approval.",
        };
      }
      return { allowed: true };

    case RISK_LEVELS.BLOCKED:
      return {
        allowed: false,
        reason: "This action is strictly restricted by system security policy and cannot be approved.",
      };

    default:
      return { allowed: false, reason: `Unknown risk level: ${riskLevel}` };
  }
};

/**
 * Evaluates whether a domain and action combination requires approval before execution.
 */
exports.getApprovalRequirement = (domain, actionType = "GENERATE", riskLevelOverride = null) => {
  if (riskLevelOverride && Object.values(RISK_LEVELS).includes(riskLevelOverride)) {
    return {
      riskLevel: riskLevelOverride,
      requiresApproval: riskLevelOverride === RISK_LEVELS.R2 || riskLevelOverride === RISK_LEVELS.R3,
      requiredRole: riskLevelOverride === RISK_LEVELS.R3 ? "Admin" : "Manager",
    };
  }

  switch (domain) {
    case "CREATIVE":
    case "CONTENT":
      return {
        riskLevel: RISK_LEVELS.R1,
        requiresApproval: false, // generation itself is R1; publishing becomes R2
        requiredRole: "Manager",
      };

    case "SOCIAL_POST":
    case "GBP":
      return {
        riskLevel: RISK_LEVELS.R2,
        requiresApproval: true,
        requiredRole: "Manager",
      };

    case "WHATSAPP":
      if (actionType === "BROADCAST" || actionType === "WHATSAPP_BROADCAST") {
        return {
          riskLevel: RISK_LEVELS.R3,
          requiresApproval: true,
          requiredRole: "Admin",
        };
      }
      return {
        riskLevel: RISK_LEVELS.R2,
        requiresApproval: true,
        requiredRole: "Manager",
      };

    case "META_ADS":
    case "GOOGLE_ADS":
    case "PAYMENT":
      return {
        riskLevel: RISK_LEVELS.R3,
        requiresApproval: true,
        requiredRole: "Admin",
      };

    case "LEAD":
    case "INTERNAL":
    default:
      return {
        riskLevel: RISK_LEVELS.R1,
        requiresApproval: false,
        requiredRole: "Manager",
      };
  }
};

exports.RISK_LEVELS = RISK_LEVELS;
exports.ROLES = ROLES;
