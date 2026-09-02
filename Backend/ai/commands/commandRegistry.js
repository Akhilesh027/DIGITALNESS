/**
 * commandRegistry.js
 * Centralized Universal Command Registry for Digitalness CRM V2
 */

const { evaluateCommandPolicy, RISK_LEVELS, ACTION_TYPES } = require("../policies/commandPolicy");
const { SCHEMAS, validateCommandParams } = require("./commandSchemas");

// Handlers
const customerHandlers = require("./handlers/customerHandlers");
const leadHandlers = require("./handlers/leadHandlers");
const taskHandlers = require("./handlers/taskHandlers");
const contentHandlers = require("./handlers/contentHandlers");
const paymentHandlers = require("./handlers/paymentHandlers");
const reportHandlers = require("./handlers/reportHandlers");
const pipelineHandlers = require("./handlers/pipelineAutomationHandlers");
const calendarHandlers = require("./handlers/contentCalendarAutomationHandlers");
const slaHandlers = require("./handlers/slaAutomationHandlers");
const recoveryHandlers = require("./handlers/paymentRecoveryAutomationHandlers");
const briefingHandlers = require("./handlers/briefingAutomationHandlers");
const socialHandlers = require("./handlers/socialHandlers");
const employeeHandlers = require("./handlers/employeeHandlers");
const adsHandlers = require("./handlers/adsHandlers");

// Verifiers
const taskVerifiers = require("./verifiers/taskVerifiers");
const leadVerifiers = require("./verifiers/leadVerifiers");
const paymentVerifiers = require("./verifiers/paymentVerifiers");

class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.registerAllCommands();
  }

  registerCommand(config) {
    if (!config.command) {
      throw new Error("Command name is required to register in CommandRegistry.");
    }
    this.commands.set(config.command, config);
  }

  getCommand(commandName) {
    return this.commands.get(commandName) || null;
  }

  hasCommand(commandName) {
    return this.commands.has(commandName);
  }

  listCommands() {
    return Array.from(this.commands.values()).map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
      category: cmd.category,
      actionType: cmd.actionType,
      riskLevel: cmd.riskLevel,
      requiredRoles: cmd.requiredRoles,
      approvalRequired: cmd.approvalRequired,
      supportsRollback: cmd.supportsRollback,
    }));
  }

  getCommandsByCategory(category) {
    return this.listCommands().filter((c) => c.category === category);
  }

  registerAllCommands() {
    // ----------------------------------------------------
    // CUSTOMER NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "customer.search",
      description: "Search and filter customers in the CRM",
      category: "CUSTOMER",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: customerHandlers.searchCustomers,
      verifier: null,
    });

    this.registerCommand({
      command: "customer.get",
      description: "Retrieve single customer profile and locations",
      category: "CUSTOMER",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: customerHandlers.getCustomer,
      verifier: null,
    });

    this.registerCommand({
      command: "customer.create",
      description: "Create a new customer account in the CRM",
      category: "CUSTOMER",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: customerHandlers.createCustomer,
      verifier: null,
    });

    this.registerCommand({
      command: "customer.update",
      description: "Update existing customer details",
      category: "CUSTOMER",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: customerHandlers.updateCustomer,
      verifier: null,
    });

    this.registerCommand({
      command: "customer.delete",
      description: "Delete a customer account (Blocked)",
      category: "CUSTOMER",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.RESTRICTED,
      requiredRoles: ["Admin"],
      approvalRequired: true,
      supportsRollback: false,
      handler: null,
      verifier: null,
    });

    // ----------------------------------------------------
    // CLIENT 360 NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "client.get360",
      description: "Get full 360 context and brand profile for a client",
      category: "CLIENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: customerHandlers.getClient360,
      verifier: null,
    });

    this.registerCommand({
      command: "client.getReadiness",
      description: "Calculate AI readiness score and missing fields for a client",
      category: "CLIENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: customerHandlers.getClientReadiness,
      verifier: null,
    });

    // ----------------------------------------------------
    // LEAD NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "lead.search",
      description: "Search and filter CRM leads",
      category: "LEAD",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: leadHandlers.searchLeads,
      verifier: null,
    });

    this.registerCommand({
      command: "lead.get",
      description: "Get full lead details and call logs",
      category: "LEAD",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: leadHandlers.getLead,
      verifier: null,
    });

    this.registerCommand({
      command: "lead.create",
      description: "Create a new sales lead",
      category: "LEAD",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: true,
      handler: leadHandlers.createLead,
      verifier: leadVerifiers.verifyLeadCreate,
    });

    this.registerCommand({
      command: "lead.assign",
      description: "Assign a lead to an executive or telecaller",
      category: "LEAD",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: leadHandlers.assignLead,
      verifier: leadVerifiers.verifyLeadAssign,
    });

    this.registerCommand({
      command: "lead.followup",
      description: "Log a follow-up or call result for a lead",
      category: "LEAD",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee", "Telecaller"],
      approvalRequired: false,
      supportsRollback: true,
      handler: leadHandlers.recordFollowUp,
      verifier: null,
    });

    this.registerCommand({
      command: "lead.convert",
      description: "Convert a sales lead to pipeline deal",
      category: "LEAD",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: leadHandlers.convertLead,
      verifier: null,
    });

    // ----------------------------------------------------
    // PROPOSAL NAMESPACE
    // ----------------------------------------------------
    const proposalHandlers = require("./handlers/proposalHandlers");

    this.registerCommand({
      command: "proposal.create",
      description: "Generate a commercial proposal for a lead or client",
      category: "PROPOSAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: true,
      supportsRollback: false,
      handler: proposalHandlers.createProposal,
      verifier: null,
    });

    this.registerCommand({
      command: "proposal.get",
      description: "Retrieve proposals and commercial quotes",
      category: "PROPOSAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: proposalHandlers.getProposals,
      verifier: null,
    });

    // ----------------------------------------------------
    // TASK / WORK NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "task.getPending",
      description: "Retrieve all pending tasks and deliverables",
      category: "TASK",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.getPendingTasks,
      verifier: null,
    });

    // EMPLOYEE / WORKFORCE COMMANDS
    this.registerCommand({
      command: "employee.create",
      description: "Create a new employee or team member",
      category: "EMPLOYEE",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Operational Manager", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: employeeHandlers.createEmployee,
      verifier: null,
    });

    this.registerCommand({
      command: "employee.get360",
      description: "Get full employee profile, workload capacity, and active deliverables",
      category: "EMPLOYEE",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Operational Manager", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: employeeHandlers.getEmployee360,
      verifier: null,
    });

    this.registerCommand({
      command: "employee.update",
      description: "Update employee role, salary, branch, or contact information",
      category: "EMPLOYEE",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Operational Manager", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: employeeHandlers.updateEmployee,
      verifier: null,
    });

    this.registerCommand({
      command: "employee.deactivate",
      description: "Deactivate employee with safe task reassignment",
      category: "EMPLOYEE",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.APPROVAL_REQUIRED,
      requiredRoles: ["Admin", "Operational Manager", "Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: employeeHandlers.deactivateEmployee,
      verifier: null,
    });

    this.registerCommand({
      command: "employee.list",
      description: "List active team members by department or branch",
      category: "EMPLOYEE",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Operational Manager", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: employeeHandlers.listEmployees,
      verifier: null,
    });

    this.registerCommand({
      command: "task.search",
      description: "Search tasks by title, customer, or assignee",
      category: "TASK",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.searchTasks,
      verifier: null,
    });

    this.registerCommand({
      command: "task.get",
      description: "Get task details by ID",
      category: "TASK",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.getTask,
      verifier: null,
    });

    this.registerCommand({
      command: "task.create",
      description: "Create a new internal task or campaign deliverable",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: true,
      handler: taskHandlers.createTask,
      verifier: taskVerifiers.verifyTaskCreate,
    });

    this.registerCommand({
      command: "task.assign",
      description: "Assign a task or poster to an employee",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: taskHandlers.assignTask,
      verifier: taskVerifiers.verifyTaskAssign,
    });

    this.registerCommand({
      command: "task.complete",
      description: "Mark a task as completed",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: true,
      handler: taskHandlers.completeTask,
      verifier: taskVerifiers.verifyTaskComplete,
    });

    this.registerCommand({
      command: "task.updateStatus",
      description: "Update task status to In Progress, Review, Revision, or Completed",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.updateTaskStatus,
      verifier: null,
    });

    this.registerCommand({
      command: "task.update",
      description: "Edit task priority, deadline, or description",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.updateTask,
      verifier: null,
    });

    this.registerCommand({
      command: "task.assignCustomer",
      description: "Assign or move tasks to a specific customer/client",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.assignCustomer,
      verifier: null,
    });

    this.registerCommand({
      command: "task.addAttachment",
      description: "Attach documents or deliverable files to a task",
      category: "TASK",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: taskHandlers.addAttachment,
      verifier: null,
    });

    // ----------------------------------------------------
    // CONTENT NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "content.getPending",
      description: "Get content items awaiting approval",
      category: "CONTENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: contentHandlers.getPendingContent,
      verifier: null,
    });

    this.registerCommand({
      command: "content.create",
      description: "Create draft social post or content item",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.DRAFT,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: true,
      handler: contentHandlers.createContent,
      verifier: null,
    });

    this.registerCommand({
      command: "content.approve",
      description: "Approve a content item for scheduling",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: contentHandlers.approveContent,
      verifier: paymentVerifiers.verifyContentApprove,
    });

    this.registerCommand({
      command: "content.reject",
      description: "Reject a content item with manager feedback",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: contentHandlers.rejectContent,
      verifier: null,
    });

    // ----------------------------------------------------
    // PAYMENT NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "payment.getDue",
      description: "List clients with pending dues",
      category: "PAYMENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: paymentHandlers.getDuePayments,
      verifier: null,
    });

    this.registerCommand({
      command: "payment.getOverdue",
      description: "List clients with overdue pending balances",
      category: "PAYMENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: paymentHandlers.getOverduePayments,
      verifier: null,
    });

    this.registerCommand({
      command: "payment.getClientHistory",
      description: "Get payment transaction history for a client",
      category: "PAYMENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: paymentHandlers.getClientHistory,
      verifier: null,
    });

    this.registerCommand({
      command: "payment.record",
      description: "Record a client payment transaction and update balance",
      category: "PAYMENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.APPROVAL_REQUIRED,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: true,
      supportsRollback: false,
      handler: paymentHandlers.recordPayment,
      verifier: paymentVerifiers.verifyPaymentRecord,
    });

    // ----------------------------------------------------
    // REPORTING NAMESPACE
    // ----------------------------------------------------
    this.registerCommand({
      command: "report.revenue",
      description: "Calculate total revenue and collections this month / all time",
      category: "REPORT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: reportHandlers.getRevenueReport,
      verifier: null,
    });

    this.registerCommand({
      command: "report.client",
      description: "Generate client performance and project delivery report",
      category: "REPORT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: reportHandlers.getClientReport,
      verifier: null,
    });

    this.registerCommand({
      command: "report.tasks",
      description: "Generate task completion and status breakdown report",
      category: "REPORT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      supportsRollback: false,
      handler: reportHandlers.getTasksReport,
      verifier: null,
    });

    this.registerCommand({
      command: "report.leads",
      description: "Generate lead funnel analytics (Hot/Warm/Cold/Converted)",
      category: "REPORT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: reportHandlers.getLeadsReport,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5B: ZERO-TOUCH CLIENT PIPELINE & WORKLOAD COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "client.previewPipeline",
      description: "Preview monthly deliverable roadmap and smart team allocation without writing to database",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: pipelineHandlers.previewPipeline,
      verifier: null,
    });

    this.registerCommand({
      command: "client.generatePipeline",
      description: "Generate and schedule full monthly deliverables roadmap for client based on service package",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: pipelineHandlers.generatePipeline,
      verifier: null,
    });

    this.registerCommand({
      command: "client.regeneratePipeline",
      description: "Clean up previous automated pipeline tasks and regenerate a fresh monthly roadmap",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: pipelineHandlers.regeneratePipeline,
      verifier: null,
    });

    this.registerCommand({
      command: "lead.convertAndOnboard",
      description: "Atomically convert lead to customer and generate monthly onboarding deliverable pipeline",
      category: "LEAD",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: pipelineHandlers.convertAndOnboardLead,
      verifier: null,
    });

    this.registerCommand({
      command: "workload.getCapacity",
      description: "Query multivariate capacity scores and active task loads across all team members",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: pipelineHandlers.getTeamCapacity,
      verifier: null,
    });

    this.registerCommand({
      command: "workload.suggestAssignee",
      description: "Intelligently recommend best available team member for a role based on workload scores",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: pipelineHandlers.suggestAssignee,
      verifier: null,
    });

    this.registerCommand({
      command: "package.list",
      description: "List all active agency service package templates and deliverable blueprints",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: pipelineHandlers.listPackages,
      verifier: null,
    });

    this.registerCommand({
      command: "package.get",
      description: "Fetch detailed deliverable blueprint and SLA rules for a specific service package",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager", "Telecaller"],
      approvalRequired: false,
      supportsRollback: false,
      handler: pipelineHandlers.getPackage,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5C: AUTONOMOUS CONTENT INTELLIGENCE & CALENDAR COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "content.previewCalendar",
      description: "Preview autonomous 30-day content calendar tailored to client 360, festivals, and package quotas",
      category: "CONTENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager", "Content Writer", "Graphic Designer"],
      approvalRequired: false,
      supportsRollback: false,
      handler: calendarHandlers.previewCalendar,
      verifier: null,
    });

    this.registerCommand({
      command: "content.generateCalendar",
      description: "Generate and stage full autonomous content calendar mapping onto Phase 5B deliverable slots",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: calendarHandlers.generateCalendar,
      verifier: null,
    });

    this.registerCommand({
      command: "content.regenerateCalendar",
      description: "Regenerate autonomous content calendar with fresh marketing angles and hooks",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: calendarHandlers.regenerateCalendar,
      verifier: null,
    });

    this.registerCommand({
      command: "content.batchApprove",
      description: "Batch approve content calendar items and trigger creative production pipeline",
      category: "CONTENT",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: false,
      handler: calendarHandlers.batchApprove,
      verifier: null,
    });

    this.registerCommand({
      command: "content.getOpportunities",
      description: "Fetch upcoming Indian festivals, commercial days, and seasonal hooks for content planning",
      category: "CONTENT",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager", "Content Writer", "Graphic Designer"],
      approvalRequired: false,
      supportsRollback: false,
      handler: calendarHandlers.getOpportunities,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5D: PROACTIVE SLA & DEADLINE GUARDIAN COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "sla.scan",
      description: "Scan all active tasks, calculate 0-100 risk scores, diagnose root causes, and update incidents",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: slaHandlers.scanSLA,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.getAtRiskTasks",
      description: "Retrieve list of all active deliverables with SLA risk score >= 50",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: slaHandlers.getAtRiskTasks,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.getCritical",
      description: "Retrieve critical deliverables with SLA risk score >= 85 requiring immediate attention",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: slaHandlers.getCriticalTasks,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.getCriticalTasks",
      description: "Retrieve critical deliverables with SLA risk score >= 85 requiring immediate attention",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: slaHandlers.getCriticalTasks,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.explainRisk",
      description: "Provide root cause diagnostics and risk factor breakdown for a specific task",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager", "Graphic Designer", "Content Writer"],
      approvalRequired: false,
      supportsRollback: false,
      handler: slaHandlers.explainRisk,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.rebalanceWorkload",
      description: "Auto-reassign overloaded tasks to lowest-capacity team members to eliminate SLA risk",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: slaHandlers.rebalanceWorkload,
      verifier: null,
    });

    this.registerCommand({
      command: "sla.extendDeadline",
      description: "Extend task deadline and reschedule client deliverable slot",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: true,
      supportsRollback: true,
      handler: slaHandlers.extendDeadline,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5E: CASH-FLOW & PAYMENT RECOVERY COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "finance.scanDues",
      description: "Scan all open/overdue invoices, calculate aging, and evaluate cash collection priority",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Accountant"],
      approvalRequired: false,
      supportsRollback: false,
      handler: recoveryHandlers.scanDues,
      verifier: null,
    });

    this.registerCommand({
      command: "finance.getAgingSummary",
      description: "Fetch aging rollup summary across 1-3d, 4-7d, 8-15d, 16-30d, 30d+ buckets",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Accountant"],
      approvalRequired: false,
      supportsRollback: false,
      handler: recoveryHandlers.getAgingSummary,
      verifier: null,
    });

    this.registerCommand({
      command: "finance.getExpectedCollections",
      description: "List all pending dues and expected collections across active client accounts",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Accountant"],
      approvalRequired: false,
      supportsRollback: false,
      handler: recoveryHandlers.getExpectedCollections,
      verifier: null,
    });

    this.registerCommand({
      command: "finance.generateReminder",
      description: "Generate compliant, non-spam payment reminder draft with verified UPI payment link",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Accountant"],
      approvalRequired: true,
      supportsRollback: false,
      handler: recoveryHandlers.generateReminder,
      verifier: null,
    });

    this.registerCommand({
      command: "finance.recordPromiseToPay",
      description: "Record client commitment to pay a specific amount by a promised date",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager", "Accountant", "Telecaller"],
      approvalRequired: false,
      supportsRollback: true,
      handler: recoveryHandlers.recordPromiseToPay,
      verifier: null,
    });

    this.registerCommand({
      command: "finance.generatePaymentLink",
      description: "Generate dynamic UPI QR URI for exact outstanding invoice balance",
      category: "FINANCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Accountant"],
      approvalRequired: false,
      supportsRollback: false,
      handler: recoveryHandlers.generatePaymentLink,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5F: EXECUTIVE MORNING BRIEFING & EOD WRAP COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "briefing.getCurrentBrief",
      description: "Get live, real-time executive operations summary, agency health, and top action items",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getCurrentBrief,
      verifier: null,
    });

    this.registerCommand({
      command: "briefing.getMorningBrief",
      description: "Fetch canonical 09:00 AM Morning Executive Briefing snapshot",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getMorningBrief,
      verifier: null,
    });

    this.registerCommand({
      command: "briefing.getEodWrap",
      description: "Fetch canonical 18:00 PM End of Day (EOD) Wrap-Up snapshot comparing accomplishments against morning baseline",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getEodWrap,
      verifier: null,
    });

    this.registerCommand({
      command: "briefing.getPriorities",
      description: "Retrieve prioritized list of manager-actionable items across delivery, collections, sales, and content",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getPriorities,
      verifier: null,
    });

    this.registerCommand({
      command: "briefing.getAgencyHealth",
      description: "Get transparent 0-100 Agency Health Score and itemized deduction breakdown",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getAgencyHealth,
      verifier: null,
    });

    this.registerCommand({
      command: "briefing.getTomorrowPlan",
      description: "Get predictive lookahead of tomorrow's scheduled deliverables, collections, and risks",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Operational Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getTomorrowPlan,
      verifier: null,
    });

    // ----------------------------------------------------
    // PHASE 5G: UNIFIED DECISION INBOX COMMANDS
    // ----------------------------------------------------
    this.registerCommand({
      command: "decision.getInbox",
      description: "Get unified queue of all pending decisions requiring manager authorization",
      category: "GENERAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: briefingHandlers.getDecisionInbox,
      verifier: null,
    });

    this.registerCommand({
      command: "decision.batchApproveSafe",
      description: "Batch approve and execute all safe low-risk operational items in a single click",
      category: "GENERAL",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: true,
      handler: briefingHandlers.batchApproveSafe,
      verifier: null,
    });

    // SOCIAL MEDIA AGENT COMMANDS
    this.registerCommand({
      command: "social.generateCaption",
      description: "Generate social media caption, headline, and platform variants for a client campaign",
      category: "SOCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: socialHandlers.generateCaption,
      verifier: null,
    });

    this.registerCommand({
      command: "social.generateHashtags",
      description: "Generate categorized hashtag set for social media posts",
      category: "SOCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: socialHandlers.generateHashtags,
      verifier: null,
    });

    this.registerCommand({
      command: "social.generateReelScript",
      description: "Generate short-form video reel script with scenes, hooks, and CTA",
      category: "SOCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: socialHandlers.generateReelScript,
      verifier: null,
    });

    this.registerCommand({
      command: "social.getContentPlan",
      description: "Fetch upcoming content calendar plan for a client",
      category: "SOCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: socialHandlers.getContentPlan,
      verifier: null,
    });

    this.registerCommand({
      command: "social.generateStrategy",
      description: "Generate a weekly social media posting strategy with content mix",
      category: "SOCIAL",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: socialHandlers.generateStrategy,
      verifier: null,
    });

    // ----------------------------------------------------
    // ADS AGENT NAMESPACE (Phase 5 - Advertising OS)
    // ----------------------------------------------------
    this.registerCommand({
      command: "ads.campaign.create",
      description: "Generate and stage a complete structured Ad Campaign draft, audiences, budgets, and creative requirements",
      category: "ADS",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.DRAFT,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: true,
      supportsRollback: true,
      handler: adsHandlers.createCampaign,
      verifier: null,
    });

    this.registerCommand({
      command: "ads.campaign.revise",
      description: "Revise an existing Ad Campaign draft parameters, budgets, or creative formats with version increment",
      category: "ADS",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.DRAFT,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: true,
      supportsRollback: true,
      handler: adsHandlers.reviseCampaign,
      verifier: null,
    });

    this.registerCommand({
      command: "ads.campaign.approve",
      description: "Approve Ad Campaign draft and trigger automated downstream Creative Agent handoff",
      category: "ADS",
      actionType: ACTION_TYPES.WRITE,
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      requiredRoles: ["Admin", "Manager"],
      approvalRequired: false,
      supportsRollback: false,
      handler: adsHandlers.approveCampaign,
      verifier: null,
    });

    this.registerCommand({
      command: "ads.strategy.create",
      description: "Generate strategic advertising objective and funnel recommendation for client",
      category: "ADS",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: adsHandlers.createStrategy,
      verifier: null,
    });

    this.registerCommand({
      command: "ads.audience.recommend",
      description: "Recommend multi-tier audience targeting matrices based on business type and geography",
      category: "ADS",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: adsHandlers.recommendAudience,
      verifier: null,
    });

    this.registerCommand({
      command: "ads.budget.recommend",
      description: "Calculate optimal daily/monthly ad budget and forecast lead volume and CPL ranges",
      category: "ADS",
      actionType: ACTION_TYPES.READ,
      riskLevel: RISK_LEVELS.READ,
      requiredRoles: ["Admin", "Manager", "Employee"],
      approvalRequired: false,
      handler: adsHandlers.recommendBudget,
      verifier: null,
    });
  }
}

const commandRegistry = new CommandRegistry();
module.exports = commandRegistry;
