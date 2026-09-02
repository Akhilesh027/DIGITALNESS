/**
 * aiCommandController.js
 * Controller handlers for Phase 4 Universal Command Engine API Endpoints.
 */

const {
  createCommandExecution,
  executeCommandExecution,
  approveCommandExecution,
  rejectCommandExecution,
  rollbackCommandExecution,
  processIntakeAnswer,
  finishIntakeEarly,
} = require("../ai/execution/executionCoordinator");
const AICommandExecution = require("../models/AICommandExecution");
const commandRegistry = require("../ai/commands/commandRegistry");

exports.handleCommandRequest = async (req, res) => {
  try {
    const { prompt, explicitHints, autoExecute, requestId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt string is required." });
    }

    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";
    const effectiveRequestId = requestId || req.headers["x-request-id"] || null;

    const result = await createCommandExecution({
      prompt,
      userId,
      userRole,
      explicitHints: explicitHints || {},
      requestId: effectiveRequestId,
      autoExecuteIfAllowed: autoExecute !== false,
    });

    if (result.status === "AMBIGUOUS_ENTITY") {
      return res.status(200).json({
        success: false,
        status: "AMBIGUOUS_ENTITY",
        message: result.message,
        ambiguity: result.ambiguity,
        data: result,
      });
    }

    if (result.status === "POLICY_BLOCKED") {
      return res.status(403).json({
        success: false,
        status: "POLICY_BLOCKED",
        message: result.message,
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      status: result.status,
      data: result,
    });
  } catch (err) {
    console.error("[aiCommandController Error]:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleApproveCommand = async (req, res) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";

    const executed = await approveCommandExecution({ executionId, userId, userRole });

    return res.status(200).json({
      success: true,
      message: "Command approved and executed successfully.",
      data: executed,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.handleRejectCommand = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id || req.user?.id;

    const rejected = await rejectCommandExecution({ executionId, userId, reason });

    return res.status(200).json({
      success: true,
      message: "Command rejected by manager.",
      data: rejected,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.handleExecuteCommand = async (req, res) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";

    const executed = await executeCommandExecution({ executionId, userId, userRole });

    return res.status(200).json({
      success: true,
      data: executed,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.handleRollbackCommand = async (req, res) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const result = await rollbackCommandExecution({ executionId, userId });

    return res.status(200).json({
      success: true,
      message: result.rollbackResult?.message || "Execution rolled back.",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.handleIntakeAnswer = async (req, res) => {
  try {
    const { executionId } = req.params;
    const { answer } = req.body;
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";

    const result = await processIntakeAnswer({ executionId, answer, userId, userRole });

    return res.status(200).json({
      success: result.success !== false,
      status: result.status,
      message: result.message,
      data: result.execution,
      ambiguity: result.ambiguity,
      blueprint: result.blueprint,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.handleFinishIntake = async (req, res) => {
  try {
    const { executionId } = req.params;
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";

    const result = await finishIntakeEarly({ executionId, userId, userRole });

    return res.status(200).json({
      success: true,
      status: result.status,
      message: result.message,
      data: result.execution,
      blueprint: result.blueprint,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCommandExecutionById = async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await AICommandExecution.findOne({ executionId })
      .populate("requestedBy", "name email role")
      .populate("approvedBy", "name email role")
      .populate("resolvedEntities.customerId", "name companyName city")
      .populate("resolvedEntities.employeeId", "name email role")
      .lean();

    if (!execution) {
      return res.status(404).json({ success: false, message: "Command execution not found." });
    }

    return res.status(200).json({ success: true, data: execution });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCommandHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const executions = await AICommandExecution.find()
      .populate("requestedBy", "name email role")
      .populate("resolvedEntities.customerId", "name companyName")
      .populate("resolvedEntities.employeeId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, count: executions.length, data: executions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCommandRegistry = async (req, res) => {
  try {
    const list = commandRegistry.listCommands();
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
