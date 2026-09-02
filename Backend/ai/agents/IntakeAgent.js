/**
 * IntakeAgent.js
 * Conversational Intake & Clarification Agent for Phase 4.1.
 * Governs multi-turn parameter collection, schema-driven question sequencing,
 * skip/correction handling, and persistent conversation state management.
 */

const { SCHEMAS } = require("../commands/commandSchemas");
const {
  extractUniversalFields,
  extractPhone,
  extractBudget,
  extractEmail,
  extractServices,
  extractLocation,
  detectCorrection,
  isSkipIntent,
} = require("../orchestrator/universalFieldExtractor");
const { resolveEntities } = require("../context/entityResolver");
const { createBlueprint } = require("../execution/blueprintService");

class IntakeAgent {
  /**
   * Retrieves schema definition for a command.
   */
  getCommandSchema(commandName) {
    return SCHEMAS[commandName] || null;
  }

  /**
   * Evaluates the intake state against schema definitions.
   * Enforces REQUIRED fields before RECOMMENDED / OPTIONAL fields.
   */
  evaluateIntakeState({ commandName, collectedFields = {}, skippedFields = [] }) {
    const schema = this.getCommandSchema(commandName);
    if (!schema || !schema.fields) {
      return {
        isComplete: true,
        isMinimumComplete: true,
        missingRequiredFields: [],
        recommendedRemaining: [],
        currentField: null,
        currentQuestion: null,
        mode: "READY_FOR_CONFIRMATION",
      };
    }

    const fieldEntries = Object.entries(schema.fields).sort(
      ([, a], [, b]) => (a.priority || 99) - (b.priority || 99)
    );

    const requiredFields = [];
    const missingRequired = [];
    const recommendedRemaining = [];
    const optionalRemaining = [];

    for (const [key, conf] of fieldEntries) {
      const isCollected = collectedFields[key] !== undefined && collectedFields[key] !== null;
      const isSkipped = skippedFields.includes(key);

      if (conf.required || conf.category === "REQUIRED") {
        requiredFields.push(key);
        if (!isCollected) {
          missingRequired.push(key);
        }
      } else if (conf.category === "RECOMMENDED" || conf.recommended) {
        if (!isCollected && !isSkipped) {
          recommendedRemaining.push(key);
        }
      } else {
        if (!isCollected && !isSkipped) {
          optionalRemaining.push(key);
        }
      }
    }

    const isMinimumComplete = missingRequired.length === 0;

    // 1. If any REQUIRED field is missing, ask it FIRST
    if (!isMinimumComplete) {
      const nextRequiredKey = missingRequired[0];
      const nextConf = schema.fields[nextRequiredKey];
      return {
        isComplete: false,
        isMinimumComplete: false,
        missingRequiredFields: missingRequired,
        recommendedRemaining,
        optionalRemaining,
        currentField: nextRequiredKey,
        currentQuestion: nextConf?.question || `Please provide ${nextConf?.label || nextRequiredKey}.`,
        currentFieldCategory: "REQUIRED",
        currentFieldLabel: nextConf?.label || nextRequiredKey,
        mode: "COLLECTING_INPUT",
      };
    }

    // 2. Next, ask RECOMMENDED fields if not yet collected/skipped
    if (recommendedRemaining.length > 0) {
      const nextRecKey = recommendedRemaining[0];
      const nextConf = schema.fields[nextRecKey];
      return {
        isComplete: false,
        isMinimumComplete: true,
        missingRequiredFields: [],
        recommendedRemaining,
        optionalRemaining,
        currentField: nextRecKey,
        currentQuestion: nextConf?.question || `What is the ${nextConf?.label || nextRecKey}?`,
        currentFieldCategory: "RECOMMENDED",
        currentFieldLabel: nextConf?.label || nextRecKey,
        mode: "COLLECTING_INPUT",
      };
    }

    // 3. Next, ask OPTIONAL fields if not yet collected/skipped
    if (optionalRemaining.length > 0) {
      const nextOptKey = optionalRemaining[0];
      const nextConf = schema.fields[nextOptKey];
      return {
        isComplete: false,
        isMinimumComplete: true,
        missingRequiredFields: [],
        recommendedRemaining: [],
        optionalRemaining,
        currentField: nextOptKey,
        currentQuestion: nextConf?.question || `What is the ${nextConf?.label || nextOptKey}?`,
        currentFieldCategory: "OPTIONAL",
        currentFieldLabel: nextConf?.label || nextOptKey,
        mode: "COLLECTING_INPUT",
      };
    }

    // 4. All fields either collected or skipped!
    return {
      isComplete: true,
      isMinimumComplete: true,
      missingRequiredFields: [],
      recommendedRemaining: [],
      optionalRemaining: [],
      currentField: null,
      currentQuestion: null,
      mode: "READY_FOR_CONFIRMATION",
    };
  }

  /**
   * Initializes a new Conversational Intake Session from manager's initial prompt.
   */
  async startIntakeSession({
    commandName,
    intent,
    prompt,
    userId,
    userRole,
    explicitHints = {},
  }) {
    const { collected, assigneeRef } = extractUniversalFields(prompt);

    // If explicit hints provided, override extracted
    if (explicitHints) {
      for (const [k, v] of Object.entries(explicitHints)) {
        if (v) {
          collected[k] = { value: v, raw: v, source: "explicit_hints", confidence: 1.0 };
        }
      }
    }

    // Resolve assigned employee if present
    let resolvedAssignee = null;
    if (assigneeRef || explicitHints?.employeeName || explicitHints?.employeeId) {
      const entityRes = await resolveEntities(prompt, {
        employeeName: assigneeRef || explicitHints?.employeeName,
        employeeId: explicitHints?.employeeId,
      });

      if (entityRes.isAmbiguous && entityRes.ambiguityDetails?.entityType === "Employee") {
        return {
          status: "AMBIGUOUS_ENTITY",
          ambiguity: entityRes.ambiguityDetails,
          message: entityRes.ambiguityDetails?.message,
          command: commandName,
          intent,
        };
      }

      if (entityRes.employee?._id) {
        resolvedAssignee = String(entityRes.employee._id);
        collected.assignedTo = {
          value: String(entityRes.employee._id),
          raw: assigneeRef,
          confidence: 0.99,
          source: "entity_resolver",
        };
      }
    }

    const state = this.evaluateIntakeState({
      commandName,
      collectedFields: collected,
      skippedFields: [],
    });

    return {
      status: state.mode === "READY_FOR_CONFIRMATION" ? "READY" : "COLLECTING_INPUT",
      collectedFields: collected,
      skippedFields: [],
      missingRequiredFields: state.missingRequiredFields,
      recommendedRemaining: state.recommendedRemaining,
      currentField: state.currentField,
      currentQuestion: state.currentQuestion,
      isMinimumComplete: state.isMinimumComplete,
      conversationState: {
        mode: state.mode,
        collectedFields: collected,
        skippedFields: [],
        missingRequiredFields: state.missingRequiredFields,
        recommendedRemaining: state.recommendedRemaining,
        currentField: state.currentField,
        currentQuestion: state.currentQuestion,
        questionHistory: state.currentQuestion
          ? [
              {
                field: state.currentField,
                question: state.currentQuestion,
                status: "ANSWERED",
                askedAt: new Date(),
              },
            ]
          : [],
        correctionHistory: [],
        startedAt: new Date(),
        lastInteractionAt: new Date(),
      },
    };
  }

  /**
   * Processes a manager answer, handles corrections, skips, and parses answers.
   */
  async processAnswer({ execution, answer, userId, userRole }) {
    if (!execution) {
      throw new Error("Execution document is required to process intake answer.");
    }

    // Access Control Check: User must be owner, Admin, Manager, or authorized employee
    const executionOwnerId = execution.requestedBy?._id || execution.requestedBy;
    const isOwner = !executionOwnerId || (userId && executionOwnerId.toString() === userId.toString());
    const roleStr = String(userRole || "").toLowerCase();
    const isAuthorizedRole = roleStr.includes("admin") || roleStr.includes("manager") || roleStr.includes("telecaller") || roleStr.includes("employee") || !userRole;

    if (!isOwner && !isAuthorizedRole) {
      throw new Error("Unauthorized: You do not have permission to modify this intake session.");
    }

    const convState = execution.conversationState || {
      mode: "COLLECTING_INPUT",
      collectedFields: {},
      skippedFields: [],
      questionHistory: [],
      correctionHistory: [],
    };

    const collectedFields = { ...(convState.collectedFields || {}) };
    const skippedFields = [...(convState.skippedFields || [])];
    const correctionHistory = [...(convState.correctionHistory || [])];
    const questionHistory = [...(convState.questionHistory || [])];

    const currentField = convState.currentField;
    const cleanAnswer = (answer || "").trim();

    // -------------------------------------------------------------
    // 1. CORRECTION DETECTION (e.g. "Actually change mobile to...")
    // -------------------------------------------------------------
    const correction = detectCorrection(cleanAnswer);
    if (correction) {
      const fieldKey = correction.field;
      const oldValue = collectedFields[fieldKey]?.value || collectedFields[fieldKey] || null;

      collectedFields[fieldKey] = {
        value: correction.value,
        raw: correction.raw,
        source: "correction",
        confidence: 0.99,
      };

      correctionHistory.push({
        field: fieldKey,
        oldValue,
        newValue: correction.value,
        rawStatement: cleanAnswer,
        timestamp: new Date(),
      });

      const nextState = this.evaluateIntakeState({
        commandName: execution.command,
        collectedFields,
        skippedFields,
      });

      execution.conversationState = {
        ...convState,
        collectedFields,
        skippedFields,
        correctionHistory,
        missingRequiredFields: nextState.missingRequiredFields,
        recommendedRemaining: nextState.recommendedRemaining,
        currentField: nextState.currentField,
        currentQuestion: nextState.currentQuestion,
        mode: nextState.mode,
        lastInteractionAt: new Date(),
      };

      if (nextState.mode === "READY_FOR_CONFIRMATION") {
        execution.status = "READY";
        execution.parameters = this.buildParametersFromCollected(collectedFields);
      }

      await execution.save();

      return {
        success: true,
        status: execution.status,
        message: `✓ Updated ${fieldKey} to ${correction.value}.`,
        execution,
      };
    }

    // -------------------------------------------------------------
    // 2. SKIP HANDLING (e.g. "skip", "don't know", "not available")
    // -------------------------------------------------------------
    if (isSkipIntent(cleanAnswer)) {
      const schema = this.getCommandSchema(execution.command);
      const fieldConf = schema?.fields?.[currentField];

      // Block skipping REQUIRED fields
      if (fieldConf?.required || fieldConf?.category === "REQUIRED") {
        return {
          success: false,
          status: "COLLECTING_INPUT",
          message: `The '${fieldConf?.label || currentField}' is required to create this lead. Please provide a value or type cancel.`,
          execution,
        };
      }

      // Valid Skip on Recommended / Optional field
      if (currentField && !skippedFields.includes(currentField)) {
        skippedFields.push(currentField);
      }

      questionHistory.push({
        field: currentField,
        question: convState.currentQuestion,
        answer: cleanAnswer,
        status: "SKIPPED",
        askedAt: new Date(),
      });

      const nextState = this.evaluateIntakeState({
        commandName: execution.command,
        collectedFields,
        skippedFields,
      });

      execution.conversationState = {
        ...convState,
        collectedFields,
        skippedFields,
        questionHistory,
        correctionHistory,
        missingRequiredFields: nextState.missingRequiredFields,
        recommendedRemaining: nextState.recommendedRemaining,
        currentField: nextState.currentField,
        currentQuestion: nextState.currentQuestion,
        mode: nextState.mode,
        lastInteractionAt: new Date(),
      };

      if (nextState.mode === "READY_FOR_CONFIRMATION") {
        execution.status = "READY";
        execution.parameters = this.buildParametersFromCollected(collectedFields);
      }

      await execution.save();

      return {
        success: true,
        status: execution.status,
        message: `Skipped ${fieldConf?.label || currentField}.`,
        execution,
      };
    }

    // -------------------------------------------------------------
    // 3. REGULAR FIELD EXTRACTION & PARSING
    // -------------------------------------------------------------
    if (currentField) {
      const schema = this.getCommandSchema(execution.command);
      const fieldConf = schema?.fields?.[currentField] || {};
      let parsedVal = cleanAnswer;

      if (fieldConf.parser === "phone" || currentField === "phone" || currentField === "contactNumber" || currentField === "contactNumbers") {
        const phoneExt = extractPhone(cleanAnswer);
        parsedVal = phoneExt ? phoneExt.value : cleanAnswer.replace(/\D/g, "");
      } else if (fieldConf.parser === "services" || currentField === "requirements") {
        const found = extractServices(cleanAnswer);
        parsedVal = found.length > 0 ? found : [cleanAnswer];
      } else if (fieldConf.parser === "email" || currentField === "email") {
        const emailExt = extractEmail(cleanAnswer);
        parsedVal = emailExt ? emailExt.value : cleanAnswer;
      } else if (fieldConf.parser === "budget" || currentField === "budget" || currentField === "amount") {
        const budgetExt = extractBudget(cleanAnswer);
        parsedVal = budgetExt ? budgetExt.value : Number(cleanAnswer.replace(/[^0-9]/g, "")) || 0;
      } else if (fieldConf.parser === "customer" || currentField === "customer" || currentField === "customerId") {
        const entityRes = await resolveEntities(cleanAnswer, { customerName: cleanAnswer });
        if (entityRes.isAmbiguous && entityRes.ambiguityDetails?.entityType === "Customer") {
          return {
            status: "AMBIGUOUS_ENTITY",
            ambiguity: entityRes.ambiguityDetails,
            message: entityRes.ambiguityDetails?.message,
            execution,
          };
        }
        if (entityRes.customer?._id) {
          parsedVal = String(entityRes.customer._id);
        }
      } else if (fieldConf.parser === "employee" || currentField === "assignedTo") {
        const entityRes = await resolveEntities(cleanAnswer, { employeeName: cleanAnswer });

        if (entityRes.isAmbiguous && entityRes.ambiguityDetails?.entityType === "Employee") {
          return {
            status: "AMBIGUOUS_ENTITY",
            ambiguity: entityRes.ambiguityDetails,
            message: entityRes.ambiguityDetails?.message,
            execution,
          };
        }

        if (entityRes.employee?._id) {
          parsedVal = String(entityRes.employee._id);
        }
      } else if (fieldConf.parser === "task" || currentField === "taskId") {
        const entityRes = await resolveEntities(cleanAnswer, { taskTitle: cleanAnswer });
        if (entityRes.task?._id) {
          parsedVal = String(entityRes.task._id);
        }
      } else if (fieldConf.parser === "date" || currentField === "dueDate" || currentField === "paymentDate") {
        const lower = cleanAnswer.toLowerCase();
        const now = new Date();
        if (lower.includes("tomorrow")) {
          now.setDate(now.getDate() + 1);
          parsedVal = now;
        } else if (lower.includes("friday")) {
          const day = now.getDay();
          const diff = (5 - day + 7) % 7 || 7;
          now.setDate(now.getDate() + diff);
          parsedVal = now;
        } else {
          const d = new Date(cleanAnswer);
          parsedVal = isNaN(d.getTime()) ? now : d;
        }
      }

      collectedFields[currentField] = {
        value: parsedVal,
        raw: cleanAnswer,
        source: "answer",
        confidence: 0.98,
      };

      questionHistory.push({
        field: currentField,
        question: convState.currentQuestion,
        answer: cleanAnswer,
        extractedValue: parsedVal,
        status: "ANSWERED",
        askedAt: new Date(),
      });
    }

    // -------------------------------------------------------------
    // 4. ADVANCE STATE MACHINE
    // -------------------------------------------------------------
    const nextState = this.evaluateIntakeState({
      commandName: execution.command,
      collectedFields,
      skippedFields,
    });

    execution.conversationState = {
      ...convState,
      collectedFields,
      skippedFields,
      questionHistory,
      correctionHistory,
      missingRequiredFields: nextState.missingRequiredFields,
      recommendedRemaining: nextState.recommendedRemaining,
      currentField: nextState.currentField,
      currentQuestion: nextState.currentQuestion,
      mode: nextState.mode,
      lastInteractionAt: new Date(),
    };

    if (nextState.mode === "READY_FOR_CONFIRMATION") {
      execution.status = "READY";
      execution.parameters = this.buildParametersFromCollected(collectedFields);
    }

    await execution.save();

    return {
      success: true,
      status: execution.status,
      message: `Saved ${currentField}.`,
      execution,
    };
  }

  /**
   * Finishes intake early once minimum required fields are fulfilled.
   */
  async finishIntake({ execution, userId, userRole }) {
    if (!execution) {
      throw new Error("Execution document is required to finish intake.");
    }

    // Access Control Check: User must be owner, Admin, Manager, or authorized employee
    const executionOwnerId = execution.requestedBy?._id || execution.requestedBy;
    const isOwner = !executionOwnerId || (userId && executionOwnerId.toString() === userId.toString());
    const roleStr = String(userRole || "").toLowerCase();
    const isAuthorizedRole = roleStr.includes("admin") || roleStr.includes("manager") || roleStr.includes("telecaller") || roleStr.includes("employee") || !userRole;

    if (!isOwner && !isAuthorizedRole) {
      throw new Error("Unauthorized: You do not have permission to finalize this intake.");
    }

    const collectedFields = execution.conversationState?.collectedFields || {};
    const state = this.evaluateIntakeState({
      commandName: execution.command,
      collectedFields,
      skippedFields: execution.conversationState?.skippedFields || [],
    });

    if (!state.isMinimumComplete) {
      throw new Error(`Cannot finish intake early: Required field(s) '${state.missingRequiredFields.join(", ")}' are still missing.`);
    }

    execution.status = "READY";
    execution.conversationState = {
      ...execution.conversationState,
      mode: "READY_FOR_CONFIRMATION",
      currentField: null,
      currentQuestion: null,
      lastInteractionAt: new Date(),
    };

    execution.parameters = this.buildParametersFromCollected(collectedFields);
    await execution.save();

    return {
      success: true,
      status: "READY",
      message: "Lead intake complete and ready for confirmation.",
      execution,
    };
  }

  /**
   * Formats raw collected fields dictionary into a clean parameter object for CRM commands.
   */
  buildParametersFromCollected(collectedFields = {}) {
    const params = {};
    for (const [k, obj] of Object.entries(collectedFields)) {
      if (obj && typeof obj === "object" && "value" in obj) {
        params[k] = obj.value;
      } else {
        params[k] = obj;
      }
    }

    // Lead & Customer parameter aliases
    if (params.phone && !params.contactNumber) {
      params.contactNumber = params.phone;
    }
    if (params.contactNumbers && !Array.isArray(params.contactNumbers)) {
      params.contactNumbers = [params.contactNumbers];
    }
    if (params.requirements && !Array.isArray(params.requirements)) {
      params.requirements = [params.requirements];
    }
    if (params.assignedTo && !Array.isArray(params.assignedTo) && (params.customer || params.title)) {
      params.assignedTo = [params.assignedTo];
    }

    return params;
  }
}

module.exports = new IntakeAgent();
