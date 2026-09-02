/**
 * blueprintService.js
 * Deterministic Execution Blueprint Generation Engine for Digitalness CRM V2.
 */

const commandRegistry = require("../commands/commandRegistry");

function generateBlueprintActions(commandName, params = {}, resolvedEntities = {}) {
  const clientName = resolvedEntities.customerName || "Client";
  const employeeName = resolvedEntities.employeeName || "Assigned Employee";
  const taskTitle = resolvedEntities.taskTitle || params.title || "Task";

  switch (commandName) {
    case "task.assign":
      return [
        { step: 1, action: `Assign task '${taskTitle}' to employee ${employeeName}`, command: "task.assign" },
        { step: 2, action: `Append assignment event to work timeline`, command: "task.update" },
        { step: 3, action: `Verify assignedTo in database`, command: "verification" },
      ];

    case "task.create":
      return [
        { step: 1, action: `Create new task deliverable '${params.title || "New Task"}' for ${clientName}`, command: "task.create" },
        { step: 2, action: `Set priority to '${params.priority || "Medium"}' with due date`, command: "task.update" },
        { step: 3, action: `Verify task creation in database`, command: "verification" },
      ];

    case "task.complete":
      return [
        { step: 1, action: `Update task status to 'Completed'`, command: "task.complete" },
        { step: 2, action: `Log completion note in work timeline`, command: "task.update" },
        { step: 3, action: `Verify completed status in database`, command: "verification" },
      ];

    case "payment.record":
      return [
        { step: 1, action: `Record payment of ₹${Number(params.amount || 0).toLocaleString("en-IN")} for ${clientName}`, command: "payment.record" },
        { step: 2, action: `Update customer total paid and pending balances`, command: "customer.update" },
        { step: 3, action: `Create immutable payment audit activity entry with executionId`, command: "activity.log" },
        { step: 4, action: `Verify updated balances in customer record`, command: "verification" },
      ];

    case "lead.create":
      return [
        { step: 1, action: `Create sales lead for '${params.name || "New Lead"}'`, command: "lead.create" },
        { step: 2, action: `Assign initial lead score (${params.leadScore || "Warm"}) and contact info`, command: "lead.update" },
        { step: 3, action: `Verify lead creation in database`, command: "verification" },
      ];

    case "lead.assign":
      return [
        { step: 1, action: `Assign lead '${resolvedEntities.leadName || "Lead"}' to ${employeeName}`, command: "lead.assign" },
        { step: 2, action: `Log assignment note in lead timeline`, command: "lead.update" },
        { step: 3, action: `Verify assigned executive in database`, command: "verification" },
      ];

    case "content.approve":
      return [
        { step: 1, action: `Approve content deliverable for scheduling`, command: "content.approve" },
        { step: 2, action: `Update attached creative project approval status`, command: "creative.approve" },
        { step: 3, action: `Verify approved status in database`, command: "verification" },
      ];

    case "customer.create":
      return [
        { step: 1, action: `Create customer record for '${params.name}'`, command: "customer.create" },
        { step: 2, action: `Initialize Client 360 profile and branch association`, command: "client.update360" },
        { step: 3, action: `Verify customer creation in database`, command: "verification" },
      ];

    case "client.generatePipeline":
      return [
        { step: 1, action: `Resolve service package template and target period (${params.month || "Current"}/${params.year || "2026"})`, command: "package.get" },
        { step: 2, action: `Calculate distributed due dates across working days (skipping Sundays)`, command: "schedule.calculate" },
        { step: 3, action: `Allocate tasks across team members based on multivariate capacity scores`, command: "workload.balance" },
        { step: 4, action: `Batch create deliverable Work records with pipelineSource provenance`, command: "client.generatePipeline" },
        { step: 5, action: `Update customer total task counters and emit pipeline.generated event`, command: "verification" },
      ];

    case "lead.convertAndOnboard":
      return [
        { step: 1, action: `Convert sales lead to active customer record`, command: "lead.convert" },
        { step: 2, action: `Detect and attach matching ServicePackageTemplate`, command: "package.match" },
        { step: 3, action: `Generate monthly deliverable roadmap with capacity-balanced team allocation`, command: "client.generatePipeline" },
        { step: 4, action: `Record immutable onboarding AutomationRun in audit ledger`, command: "audit.log" },
        { step: 5, action: `Verify customer and tasks in MongoDB`, command: "verification" },
      ];

    default:
      if (commandName.startsWith("report.") || commandName.endsWith(".search") || commandName.endsWith(".get") || commandName.endsWith(".getPending") || commandName.endsWith(".getDue") || commandName.endsWith(".getOverdue")) {
        return [{ step: 1, action: `Execute deterministic read query for ${commandName}`, command: commandName }];
      }
      return [{ step: 1, action: `Execute CRM action for ${commandName}`, command: commandName }];
  }
}

function generateWarnings(commandName, params = {}, resolvedEntities = {}) {
  const warnings = [];

  if (commandName === "payment.record") {
    warnings.push("Financial action: Updates billing balance. This mutation is not automatically reversible.");
    const amount = Number(params.amount || 0);
    const totalPending = resolvedEntities.totalPending !== null && resolvedEntities.totalPending !== undefined ? Number(resolvedEntities.totalPending) : null;
    if (totalPending !== null && amount > totalPending) {
      const excess = amount - totalPending;
      warnings.push(
        `Excess Payment Warning: Entered payment (₹${amount.toLocaleString("en-IN")}) exceeds current outstanding dues (₹${totalPending.toLocaleString("en-IN")}). Excess amount: ₹${excess.toLocaleString("en-IN")} (Advance balance).`
      );
    }
  }
  if (commandName === "task.assign" && !resolvedEntities.employeeId) {
    warnings.push("No employee specified. Task will be unassigned.");
  }
  if (commandName === "customer.delete" || commandName.endsWith(".delete")) {
    warnings.push("CRITICAL: Destructive action requested. Blocked by CRM policy.");
  }

  return warnings;
}

exports.createBlueprint = ({
  executionId,
  commandName,
  intent,
  riskLevel,
  approvalRequired,
  parameters = {},
  resolvedEntities = {},
  originalPrompt = "",
}) => {
  const cmd = commandRegistry.getCommand(commandName);
  const actions = generateBlueprintActions(commandName, parameters, resolvedEntities);
  const warnings = generateWarnings(commandName, parameters, resolvedEntities);
  const blueprintId = `BP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const supportsRollback = cmd ? Boolean(cmd.supportsRollback) : false;

  let initialStatus = "READY";
  if (riskLevel === "RESTRICTED") {
    initialStatus = "FAILED";
  } else if (approvalRequired) {
    initialStatus = "WAITING_APPROVAL";
  }

  return {
    blueprintId,
    executionId,
    originalPrompt,
    intent,
    command: commandName,
    category: cmd ? cmd.category : "GENERAL",
    actionType: cmd ? cmd.actionType : "READ",
    riskLevel,
    approvalRequired,
    supportsRollback,
    parameters,
    resolvedEntities,
    actions,
    warnings,
    status: initialStatus,
  };
};
