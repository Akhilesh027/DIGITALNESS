/**
 * executionCoordinator.js
 * Universal AI Command Execution Coordinator & State Machine Engine for Digitalness CRM V2.
 */

const crypto = require("crypto");
const AICommandExecution = require("../../models/AICommandExecution");
const commandRegistry = require("../commands/commandRegistry");
const { parseCommandRequest } = require("../orchestrator/intentRouter");
const { createBlueprint } = require("./blueprintService");
const { verifyExecution } = require("./verificationService");
const { captureBeforeState, executeRollback } = require("./rollbackService");
const { logCommandExecution } = require("./auditService");
const intakeAgent = require("../agents/IntakeAgent");

// Valid state machine transitions
const ALLOWED_TRANSITIONS = {
  DRAFT: ["COLLECTING_INPUT", "READY", "WAITING_APPROVAL", "APPROVED", "CANCELLED"],
  COLLECTING_INPUT: ["COLLECTING_INPUT", "READY", "APPROVED", "EXECUTING", "CANCELLED"],
  READY: ["EXECUTING", "APPROVED", "READY", "CANCELLED"],
  WAITING_APPROVAL: ["APPROVED", "CANCELLED"],
  APPROVED: ["EXECUTING", "COMPLETED", "CANCELLED"],
  EXECUTING: ["COMPLETED", "FAILED", "PARTIALLY_FAILED"],
  COMPLETED: ["ROLLED_BACK"],
  FAILED: ["EXECUTING", "READY", "CANCELLED"],
  PARTIALLY_FAILED: ["EXECUTING", "ROLLED_BACK", "CANCELLED"],
  CANCELLED: [],
  ROLLED_BACK: [],
};

function validateStateTransition(currentStatus, nextStatus) {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new Error(`Invalid state transition from '${currentStatus}' to '${nextStatus}'.`);
  }
}

function generateIdempotencyKey(requestId, userId, commandName, parameters = {}) {
  if (requestId && typeof requestId === "string" && requestId.trim().length > 0) {
    return requestId.trim();
  }
  const payload = `${userId || "system"}-${commandName}-${JSON.stringify(parameters)}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Creates and stages a Universal Command Execution
 */
exports.createCommandExecution = async ({
  prompt,
  userId,
  userRole = "Manager",
  explicitHints = {},
  requestId = null,
  autoExecuteIfAllowed = true,
}) => {
  // 1. Parse prompt through Intent Router & Entity Resolver
  const parsed = await parseCommandRequest({ prompt, userRole, explicitHints });

  // Handle Ambiguous Entity Guard
  if (parsed.status === "AMBIGUOUS_ENTITY") {
    return {
      status: "AMBIGUOUS_ENTITY",
      isExecutable: false,
      message: parsed.message,
      ambiguity: parsed.ambiguity,
      intent: parsed.intent,
      command: parsed.command,
    };
  }

  // Handle Policy Blocked
  if (parsed.status === "POLICY_BLOCKED") {
    return {
      status: "POLICY_BLOCKED",
      isExecutable: false,
      message: parsed.policyReason || "Command execution is blocked by policy.",
      command: parsed.command,
      riskLevel: parsed.riskLevel,
    };
  }

  // 2. Check if command is an Intake-Governed Command (e.g. lead.create, task.create, task.assign, payment.record, customer.create)
  const INTAKE_COMMANDS = [
    "lead.create",
    "task.create",
    "task.assign",
    "payment.record",
    "customer.create",
  ];

  if (INTAKE_COMMANDS.includes(parsed.command)) {
    const intakeRes = await intakeAgent.startIntakeSession({
      commandName: parsed.command,
      intent: parsed.intent,
      prompt,
      userId,
      userRole,
      explicitHints,
    });

    if (intakeRes.status === "AMBIGUOUS_ENTITY") {
      return intakeRes;
    }

    if (intakeRes.status === "COLLECTING_INPUT") {
      const executionId = `CMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const idempotencyKey = generateIdempotencyKey(requestId, userId, parsed.command, intakeRes.collectedFields);

      const executionRecord = await AICommandExecution.create({
        executionId,
        idempotencyKey,
        originalPrompt: prompt,
        intent: parsed.intent,
        command: parsed.command,
        category: parsed.category || "GENERAL",
        actionType: "WRITE",
        riskLevel: parsed.riskLevel || "LOW_RISK_WRITE",
        approvalRequired: parsed.approvalRequired || false,
        status: "COLLECTING_INPUT",
        requestedBy: userId || null,
        parameters: intakeAgent.buildParametersFromCollected(intakeRes.collectedFields),
        conversationState: intakeRes.conversationState,
        supportsRollback: true,
      });

      return {
        status: "COLLECTING_INPUT",
        executionId,
        command: parsed.command,
        intent: parsed.intent,
        currentField: intakeRes.currentField,
        currentQuestion: intakeRes.currentQuestion,
        isMinimumComplete: intakeRes.isMinimumComplete,
        conversationState: intakeRes.conversationState,
        execution: executionRecord,
        message: intakeRes.currentQuestion,
      };
    }
  }

  // 3. Request-Level Idempotency Check (Duplicate command submission protection)
  const idempotencyKey = generateIdempotencyKey(requestId, userId, parsed.command, parsed.parameters);
  const existingExecution = await AICommandExecution.findOne({
    idempotencyKey,
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // within last 15 mins
    status: { $in: ["COMPLETED", "WAITING_APPROVAL", "EXECUTING"] },
  }).lean();

  if (existingExecution) {
    console.log(`[Idempotency Guard] Duplicate command submission detected for key '${idempotencyKey}'. Returning existing execution '${existingExecution.executionId}'.`);
    const existingBlueprint = createBlueprint({
      executionId: existingExecution.executionId,
      commandName: existingExecution.command,
      intent: existingExecution.intent,
      riskLevel: existingExecution.riskLevel,
      approvalRequired: existingExecution.approvalRequired,
      parameters: existingExecution.parameters,
      resolvedEntities: existingExecution.resolvedEntities,
      originalPrompt: existingExecution.originalPrompt,
    });

    return {
      status: existingExecution.status,
      executionId: existingExecution.executionId,
      command: existingExecution.command,
      intent: existingExecution.intent,
      category: existingExecution.category,
      riskLevel: existingExecution.riskLevel,
      actionType: existingExecution.actionType,
      resolvedEntities: existingExecution.resolvedEntities,
      parameters: existingExecution.parameters,
      confidence: 0.99,
      approvalRequired: existingExecution.approvalRequired,
      supportsRollback: existingExecution.supportsRollback,
      blueprint: existingBlueprint,
      execution: existingExecution,
      result: existingExecution.result,
      verification: existingExecution.verification,
      isDuplicateSubmission: true,
      message: "Duplicate request detected. Returning existing execution result.",
    };
  }

  const executionId = `CMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 4. Build Deterministic Execution Blueprint
  const blueprint = createBlueprint({
    executionId,
    commandName: parsed.command,
    intent: parsed.intent,
    riskLevel: parsed.riskLevel,
    approvalRequired: parsed.approvalRequired,
    parameters: parsed.parameters,
    resolvedEntities: parsed.resolvedEntities,
    originalPrompt: prompt,
  });

  const initialStatus = parsed.approvalRequired ? "WAITING_APPROVAL" : "READY";

  // 5. Create persistent AICommandExecution record
  const executionRecord = await AICommandExecution.create({
    executionId,
    idempotencyKey,
    blueprintId: blueprint.blueprintId,
    originalPrompt: prompt,
    intent: parsed.intent,
    command: parsed.command,
    category: parsed.category,
    actionType: parsed.actionType,
    riskLevel: parsed.riskLevel,
    approvalRequired: parsed.approvalRequired,
    status: initialStatus,
    requestedBy: userId || null,
    parameters: parsed.parameters,
    missingParameters: parsed.missingParameters,
    resolvedEntities: parsed.resolvedEntities,
    actions: blueprint.actions.map((a, idx) => ({
      actionId: `ACT-${idx + 1}`,
      order: a.step,
      name: a.action,
      command: a.command || parsed.command,
      status: "PENDING",
    })),
    supportsRollback: blueprint.supportsRollback,
    warnings: blueprint.warnings,
  });

  // 4. Auto-execute for READ, DRAFT, and authorized LOW_RISK_WRITE commands
  if (autoExecuteIfAllowed && !parsed.approvalRequired && parsed.isExecutable) {
    const executed = await exports.executeCommandExecution({ executionId, userId, userRole });
    return {
      status: executed.status,
      executionId,
      command: parsed.command,
      intent: parsed.intent,
      category: parsed.category,
      riskLevel: parsed.riskLevel,
      actionType: parsed.actionType,
      resolvedEntities: parsed.resolvedEntities,
      parameters: parsed.parameters,
      confidence: parsed.confidence,
      approvalRequired: parsed.approvalRequired,
      supportsRollback: executed.supportsRollback,
      blueprint,
      execution: executed,
      result: executed.result,
      verification: executed.verification,
    };
  }

  return {
    status: initialStatus,
    executionId,
    command: parsed.command,
    intent: parsed.intent,
    category: parsed.category,
    riskLevel: parsed.riskLevel,
    actionType: parsed.actionType,
    resolvedEntities: parsed.resolvedEntities,
    parameters: parsed.parameters,
    confidence: parsed.confidence,
    approvalRequired: parsed.approvalRequired,
    supportsRollback: blueprint.supportsRollback,
    blueprint,
    execution: executionRecord,
    message: parsed.approvalRequired
      ? "Command staged as Execution Blueprint. Requires explicit manager approval before executing."
      : "Command staged and ready for execution.",
  };
};

/**
 * Executes an existing, validated command execution with idempotency & state machine checks
 */
exports.executeCommandExecution = async ({ executionId, userId, userRole = "Manager" }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) {
    throw new Error(`Command execution '${executionId}' not found.`);
  }

  // IDEMPOTENCY GUARD: If already completed, return existing result without re-executing
  if (execution.status === "COMPLETED") {
    console.log(`[Idempotency Guard] Execution '${executionId}' is already COMPLETED. Returning existing result.`);
    return execution;
  }

  // APPROVAL ENFORCEMENT GUARD:
  if (execution.approvalRequired && execution.status !== "APPROVED") {
    throw new Error(
      `Execution blocked: Command '${execution.command}' requires manager approval before execution. Current status: '${execution.status}'.`
    );
  }

  // Check state transition
  if (execution.status !== "APPROVED" && execution.status !== "READY" && execution.status !== "EXECUTING") {
    validateStateTransition(execution.status, "EXECUTING");
  }

  // Set EXECUTING
  execution.status = "EXECUTING";
  execution.startedAt = new Date();
  await execution.save();

  // ROLE AUTHORIZATION GUARD:
  const cmd = commandRegistry.getCommand(execution.command);
  if (!cmd) {
    execution.status = "FAILED";
    execution.error = `Command '${execution.command}' is not registered.`;
    await execution.save();
    throw new Error(execution.error);
  }

  const allowedRoles = cmd.requiredRoles || ["Admin", "Manager"];
  const isAuthorized =
    String(userRole).toLowerCase() === "admin" ||
    allowedRoles.map((r) => r.toLowerCase()).includes(String(userRole).toLowerCase());

  if (!isAuthorized) {
    execution.status = "FAILED";
    execution.error = `Permission Denied: User role '${userRole}' is not authorized to execute command '${execution.command}'. Required: ${allowedRoles.join(", ")}`;
    await execution.save();
    throw new Error(execution.error);
  }

  // 1. Capture before-state for rollback & check for concurrent modifications
  let beforeState = null;
  if (cmd.supportsRollback) {
    beforeState = await captureBeforeState(execution.command, execution.parameters, execution.resolvedEntities);
    execution.rollbackData = beforeState;
  }

  try {
    // 2. Execute deterministic handler
    const ctx = {
      userId: userId || execution.requestedBy,
      userRole,
      executionId: execution.executionId,
    };

    let result = null;
    if (cmd.handler) {
      result = await cmd.handler(execution.parameters, ctx);
    }
    execution.result = result && typeof result.toObject === "function" ? result.toObject() : result;
    execution.markModified("result");

    // 3. Run Post-Execution Database State Verification
    const verification = await verifyExecution({
      commandName: execution.command,
      parameters: execution.parameters,
      resolvedEntities: execution.resolvedEntities,
      executionResult: result,
      executionId: execution.executionId,
    });

    execution.verification = verification;

    // 4. Update Status based on verification
    if (verification.status === "FAILED") {
      execution.status = "PARTIALLY_FAILED";
      execution.error = `Verification Failed: ${verification.details}`;
    } else {
      execution.status = "COMPLETED";
      execution.completedAt = new Date();
      if (cmd.supportsRollback) {
        execution.rollbackStatus = "AVAILABLE";
      }
    }

    // Mark actions as completed
    execution.actions.forEach((a) => {
      a.status = execution.status === "COMPLETED" ? "COMPLETED" : "FAILED";
      a.executedAt = new Date();
    });

    await execution.save();

    // 5. Write Immutable Audit Log
    await logCommandExecution({
      executionId: execution.executionId,
      commandName: execution.command,
      riskLevel: execution.riskLevel,
      userId: userId || execution.requestedBy,
      userRole,
      customerId: execution.resolvedEntities?.customerId,
      clientLocationId: execution.resolvedEntities?.clientLocationId,
      inputSummary: execution.originalPrompt,
      outputSummary: execution.status === "COMPLETED" ? `Executed & ${verification.status}` : execution.error,
      before: beforeState,
      after: result,
      approvalRequired: execution.approvalRequired,
      status: execution.status === "COMPLETED" ? "Success" : "Error",
      error: execution.error || "",
    });

    return execution;
  } catch (err) {
    execution.status = "FAILED";
    execution.error = err.message;
    execution.completedAt = new Date();
    await execution.save();

    await logCommandExecution({
      executionId: execution.executionId,
      commandName: execution.command,
      riskLevel: execution.riskLevel,
      userId: userId || execution.requestedBy,
      userRole,
      customerId: execution.resolvedEntities?.customerId,
      inputSummary: execution.originalPrompt,
      status: "Error",
      error: err.message,
    });

    throw err;
  }
};

/**
 * Approves a waiting execution and triggers execution
 */
exports.approveCommandExecution = async ({ executionId, userId, userRole = "Manager" }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) throw new Error(`Command execution '${executionId}' not found.`);

  if (execution.status === "COMPLETED") {
    return execution;
  }

  if (execution.status !== "WAITING_APPROVAL" && execution.status !== "READY" && execution.status !== "APPROVED") {
    throw new Error(`Cannot approve command with status '${execution.status}'. Expected 'WAITING_APPROVAL' or 'READY'.`);
  }

  validateStateTransition(execution.status, "APPROVED");

  execution.status = "APPROVED";
  execution.approvedBy = userId;
  execution.approvedAt = new Date();
  await execution.save();

  return await exports.executeCommandExecution({ executionId, userId, userRole });
};

/**
 * Rejects a waiting execution
 */
exports.rejectCommandExecution = async ({ executionId, userId, reason = "Rejected by manager" }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) throw new Error(`Command execution '${executionId}' not found.`);

  if (execution.status !== "WAITING_APPROVAL") {
    throw new Error(`Cannot reject command with status '${execution.status}'. Expected 'WAITING_APPROVAL'.`);
  }

  validateStateTransition(execution.status, "CANCELLED");

  execution.status = "CANCELLED";
  execution.rejectedAt = new Date();
  execution.rejectionReason = reason;
  await execution.save();

  return execution;
};

/**
 * Rolls back a completed execution
 */
exports.rollbackCommandExecution = async ({ executionId, userId }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) throw new Error(`Command execution '${executionId}' not found.`);

  if (execution.status !== "COMPLETED") {
    throw new Error(`Cannot rollback execution with status '${execution.status}'. Only 'COMPLETED' executions can be rolled back.`);
  }

  validateStateTransition(execution.status, "ROLLED_BACK");

  const rollbackResult = await executeRollback({
    commandName: execution.command,
    beforeState: execution.rollbackData,
    executionResult: execution.result,
    userId,
  });

  execution.status = "ROLLED_BACK";
  execution.rollbackStatus = "ROLLED_BACK";
  await execution.save();

  await logCommandExecution({
    executionId: execution.executionId,
    commandName: `${execution.command}.ROLLBACK`,
    riskLevel: execution.riskLevel,
    userId,
    customerId: execution.resolvedEntities?.customerId,
    inputSummary: `Rollback of ${execution.executionId}`,
    outputSummary: rollbackResult.message,
    status: "Success",
  });

  return { execution, rollbackResult };
};

/**
 * Handles answering or correcting a field in a conversational intake session
 */
exports.processIntakeAnswer = async ({ executionId, answer, userId, userRole }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) throw new Error(`Command execution '${executionId}' not found.`);

  if (execution.status !== "COLLECTING_INPUT") {
    throw new Error(`Command execution '${executionId}' is in status '${execution.status}', not 'COLLECTING_INPUT'.`);
  }

  const result = await intakeAgent.processAnswer({ execution, answer, userId, userRole });

  // If intake complete, generate blueprint
  if (result.execution?.status === "READY" && !result.execution.blueprintId) {
    const blueprint = createBlueprint({
      executionId: result.execution.executionId,
      commandName: result.execution.command,
      intent: result.execution.intent,
      riskLevel: result.execution.riskLevel,
      approvalRequired: false,
      parameters: result.execution.parameters,
      resolvedEntities: result.execution.resolvedEntities,
      originalPrompt: result.execution.originalPrompt,
    });
    result.execution.blueprintId = blueprint.blueprintId;
    await result.execution.save();
    result.blueprint = blueprint;
  }

  return result;
};

/**
 * Finalizes intake early once all minimum required parameters are met
 */
exports.finishIntakeEarly = async ({ executionId, userId, userRole }) => {
  const execution = await AICommandExecution.findOne({ executionId });
  if (!execution) throw new Error(`Command execution '${executionId}' not found.`);

  const result = await intakeAgent.finishIntake({ execution, userId, userRole });

  if (result.execution?.status === "READY") {
    const blueprint = createBlueprint({
      executionId: result.execution.executionId,
      commandName: result.execution.command,
      intent: result.execution.intent,
      riskLevel: result.execution.riskLevel,
      approvalRequired: false,
      parameters: result.execution.parameters,
      resolvedEntities: result.execution.resolvedEntities,
      originalPrompt: result.execution.originalPrompt,
    });
    result.execution.blueprintId = blueprint.blueprintId;
    await result.execution.save();
    result.blueprint = blueprint;
  }

  return result;
};

