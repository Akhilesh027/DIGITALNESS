/**
 * commandPolicy.js
 * Standardized 4-Tier Risk & Policy Engine for Digitalness CRM
 * Standard Tiers:
 * R0 = Read / Analysis (No approval required)
 * R1 = Draft / Internal Generation (Instant creation, optional review)
 * R2 = Public External Communication (Manager approval required)
 * R3 = Financial / High-Impact (Mandatory Admin/Manager approval)
 * BLOCKED = Strictly restricted destructive operations
 */

const RISK_LEVELS = {
  R0: "R0",
  R1: "R1",
  R2: "R2",
  R3: "R3",
  BLOCKED: "BLOCKED",

  // Backward compatibility aliases
  READ: "R0",
  DRAFT: "R1",
  LOW_RISK_WRITE: "R1",
  APPROVAL_REQUIRED: "R2",
  RESTRICTED: "BLOCKED",
};

const ACTION_TYPES = {
  READ: "READ",
  WRITE: "WRITE",
};

// Standardized command risk and role requirements
const COMMAND_RISK_MAP = {
  // Customer Namespace
  "customer.search": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "customer.get": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "customer.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "customer.update": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "customer.delete": { riskLevel: RISK_LEVELS.BLOCKED, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin"], blocked: true },

  // Client 360 Namespace
  "client.get360": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "client.update360": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "client.getReadiness": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },

  // Lead Namespace
  "lead.search": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "lead.get": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "lead.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "lead.update": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "lead.assign": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "lead.followup": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "lead.convert": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "lead.delete": { riskLevel: RISK_LEVELS.BLOCKED, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin"], blocked: true },

  // Employee / Workforce Namespace
  "employee.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Operational Manager", "Manager"] },
  "employee.get360": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Operational Manager", "Manager", "Employee"] },
  "employee.update": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Operational Manager", "Manager"] },
  "employee.deactivate": { riskLevel: RISK_LEVELS.R3, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Operational Manager", "Manager"] },
  "employee.list": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Operational Manager", "Manager", "Employee"] },
  "employee.search": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "employee.get": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "employee.delete": { riskLevel: RISK_LEVELS.BLOCKED, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin"], blocked: true },

  // Task / Work Namespace
  "task.getPending": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.search": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.get": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.assign": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "task.assignCustomer": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.update": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.updateStatus": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.complete": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "task.delete": { riskLevel: RISK_LEVELS.BLOCKED, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin"], blocked: true },

  // Content Namespace
  "content.getPending": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "content.search": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "content.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "content.update": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "content.approve": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "content.reject": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "content.schedule": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "content.batchApprove": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "content.generateCalendar": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },

  // Creative Namespace
  "creative.create": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "creative.generate": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "creative.revise": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "creative.regenerate": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "creative.approve": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "creative.reject": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },

  // Payment Namespace
  "payment.getDue": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "payment.getOverdue": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "payment.getClientHistory": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "payment.record": { riskLevel: RISK_LEVELS.R3, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "payment.delete": { riskLevel: RISK_LEVELS.BLOCKED, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin"], blocked: true },

  // Scheduler Namespace
  "scheduler.getUpcoming": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "scheduler.create": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "scheduler.update": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "scheduler.cancel": { riskLevel: RISK_LEVELS.R2, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },

  // Reporting Namespace
  "report.revenue": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "report.client": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "report.tasks": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "report.leads": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Telecaller"] },
  "report.content": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "report.payments": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "report.employee": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },

  // Briefing Namespace
  "briefing.getMorningBrief": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "briefing.getCurrentBrief": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "briefing.getEodWrap": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "briefing.getPriorities": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "briefing.getAgencyHealth": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },
  "briefing.getTomorrowPlan": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"] },

  // Decision Inbox Namespace
  "decision.getInbox": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "decision.batchApproveSafe": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "decision.approve": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "decision.reject": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },

  // SLA Guardian Namespace
  "sla.getCritical": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "sla.getSummary": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "sla.rebalance": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "sla.rebalanceWorkload": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "sla.explainRisk": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },

  // Finance & Cash-Flow Namespace
  "finance.getSummary": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "finance.getAging": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "finance.getOverdue": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },
  "finance.generateReminder": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "finance.recordPromiseToPay": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Telecaller"] },
  "finance.generatePaymentLink": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager"] },

  // Ads Agent Namespace
  "ads.campaign.create": { riskLevel: RISK_LEVELS.R3, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "ads.campaign.revise": { riskLevel: RISK_LEVELS.R1, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager", "Employee"] },
  "ads.campaign.approve": { riskLevel: RISK_LEVELS.R3, actionType: ACTION_TYPES.WRITE, requiredRoles: ["Admin", "Manager"] },
  "ads.strategy.create": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "ads.audience.recommend": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
  "ads.budget.recommend": { riskLevel: RISK_LEVELS.R0, actionType: ACTION_TYPES.READ, requiredRoles: ["Admin", "Manager", "Employee"] },
};

/**
 * Evaluate permission and risk for a command and user role
 */
exports.evaluateCommandPolicy = (commandName, userRole = "Manager") => {
  const normalizedRole = String(userRole || "Manager").trim();
  const normalizedRoleCapitalized = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1).toLowerCase();

  const commandInfo = COMMAND_RISK_MAP[commandName];
  if (!commandInfo) {
    if (
      commandName.includes("get") ||
      commandName.includes("search") ||
      commandName.includes("report") ||
      commandName.includes("summary") ||
      commandName.includes("brief")
    ) {
      return {
        allowed: true,
        riskLevel: RISK_LEVELS.R0,
        actionType: ACTION_TYPES.READ,
        approvalRequired: false,
        requiredRoles: ["Admin", "Manager", "Employee"],
      };
    }

    return {
      allowed: false,
      riskLevel: RISK_LEVELS.BLOCKED,
      actionType: ACTION_TYPES.WRITE,
      approvalRequired: true,
      reason: `Command '${commandName}' is not registered in the CRM policy registry.`,
    };
  }

  // 1. Check if strictly restricted / blocked
  if (commandInfo.riskLevel === RISK_LEVELS.BLOCKED || commandInfo.blocked) {
    return {
      allowed: false,
      riskLevel: RISK_LEVELS.BLOCKED,
      actionType: commandInfo.actionType,
      approvalRequired: true,
      reason: `Command '${commandName}' is RESTRICTED (BLOCKED) and cannot be executed automatically.`,
    };
  }

  // 2. Check role authorization
  const allowedRoles = commandInfo.requiredRoles || ["Admin", "Manager"];
  const isAuthorizedRole =
    normalizedRoleCapitalized === "Admin" ||
    allowedRoles.map((r) => r.toLowerCase()).includes(normalizedRole.toLowerCase());

  if (!isAuthorizedRole) {
    return {
      allowed: false,
      riskLevel: commandInfo.riskLevel,
      actionType: commandInfo.actionType,
      approvalRequired: true,
      reason: `User role '${userRole}' is not authorized to execute command '${commandName}'. Required: ${allowedRoles.join(", ")}`,
    };
  }

  // 3. Determine if human approval is required before external execution
  const approvalRequired =
    commandInfo.riskLevel === RISK_LEVELS.R2 || commandInfo.riskLevel === RISK_LEVELS.R3;

  return {
    allowed: true,
    riskLevel: commandInfo.riskLevel,
    actionType: commandInfo.actionType,
    approvalRequired,
    requiredRoles: commandInfo.requiredRoles,
    reason: approvalRequired
      ? `Command '${commandName}' requires explicit ${commandInfo.riskLevel === RISK_LEVELS.R3 ? "Admin" : "Manager"} approval before execution.`
      : `Command '${commandName}' is authorized for direct execution under risk policy ${commandInfo.riskLevel}.`,
  };
};

exports.RISK_LEVELS = RISK_LEVELS;
exports.ACTION_TYPES = ACTION_TYPES;
exports.COMMAND_RISK_MAP = COMMAND_RISK_MAP;
