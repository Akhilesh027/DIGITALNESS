/**
 * CanvaCapabilityRegistry.js
 * Deterministic capability matrix validating supported vs unsupported Canva editing operations.
 * Strictly prevents hallucinated success on unsupported API operations.
 */

const SUPPORTED_OPERATIONS = new Set([
  "REPLACE_TEXT",
  "FIND_AND_REPLACE_TEXT",
  "FORMAT_TEXT",
  "UPDATE_FILL",
  "INSERT_FILL",
  "DELETE_ELEMENT",
  "POSITION_ELEMENT",
  "RESIZE_ELEMENT",
]);

const UNSUPPORTED_REASONS = {
  CHANGE_FONT_FAMILY: {
    code: "FONT_FAMILY_CHANGE_NOT_SUPPORTED",
    explanation: "Changing font family/typeface is not supported through current Canva editing API.",
    suggestedManualAction: "Open design in Canva editor and select desired typeface from font picker.",
  },
  ADD_NEW_TEXT_BOX: {
    code: "ADD_TEXT_BOX_NOT_SUPPORTED",
    explanation: "Adding arbitrary new text boxes is not supported. Use existing text element replacement.",
    suggestedManualAction: "Add text box manually in Canva editor or use a template with pre-existing text slots.",
  },
  CHANGE_BACKGROUND_COLOR: {
    code: "BACKGROUND_COLOR_CHANGE_NOT_SUPPORTED",
    explanation: "Direct background color mutations are not supported through editing API.",
    suggestedManualAction: "Change background color in Canva editor directly.",
  },
  CHANGE_BACKGROUND_GRADIENT: {
    code: "BACKGROUND_GRADIENT_CHANGE_NOT_SUPPORTED",
    explanation: "Background gradient changes are not supported through Canva editing API.",
    suggestedManualAction: "Apply gradient background in Canva editor.",
  },
  ADD_PAGE: {
    code: "PAGE_CREATION_NOT_SUPPORTED",
    explanation: "Adding new pages dynamically is not supported through Canva editing API.",
    suggestedManualAction: "Duplicate or add page in Canva.",
  },
  REMOVE_PAGE: {
    code: "PAGE_REMOVAL_NOT_SUPPORTED",
    explanation: "Page deletion is not supported through Canva editing API.",
    suggestedManualAction: "Delete page in Canva editor.",
  },
  CHANGE_ANIMATION: {
    code: "ANIMATION_CHANGE_NOT_SUPPORTED",
    explanation: "Animation and transition changes are not supported through Canva editing API.",
    suggestedManualAction: "Configure animations in Canva editor.",
  },
  GROUP_ELEMENTS: {
    code: "GROUPING_NOT_SUPPORTED",
    explanation: "Grouping and ungrouping operations are not supported.",
    suggestedManualAction: "Group elements manually in Canva editor.",
  },
};

class CanvaCapabilityRegistry {
  isSupported(intent) {
    return SUPPORTED_OPERATIONS.has(intent);
  }

  getUnsupportedReason(intent) {
    return (
      UNSUPPORTED_REASONS[intent] || {
        code: "CANVA_OPERATION_UNSUPPORTED",
        explanation: `Operation '${intent}' is not supported through Canva editing API.`,
        suggestedManualAction: "Perform this operation manually in Canva editor.",
      }
    );
  }

  /**
   * Validates a batch of requested operations against Canva capabilities & page constraints
   */
  validateOperations(operations = [], pageContext = { isResponsive: false }) {
    const supportedOps = [];
    const unsupportedOps = [];

    for (const op of operations) {
      // 1. Check if intent is supported
      if (!this.isSupported(op.intent)) {
        const reason = this.getUnsupportedReason(op.intent);
        unsupportedOps.push({
          intent: op.intent,
          requestedText: op.managerProvidedValue || op.targetRole || "",
          reasonCode: reason.code,
          explanation: reason.explanation,
          suggestedManualAction: reason.suggestedManualAction,
        });
        continue;
      }

      // 2. Check responsive canvas restrictions (Position & Resize restricted on responsive layouts)
      if (pageContext.isResponsive && (op.intent === "POSITION_ELEMENT" || op.intent === "RESIZE_ELEMENT")) {
        unsupportedOps.push({
          intent: op.intent,
          requestedText: op.targetRole,
          reasonCode: "CANVA_RESPONSIVE_OPERATION_UNSUPPORTED",
          explanation: `Operation '${op.intent}' is not supported on responsive Canva page layouts.`,
          suggestedManualAction: "Adjust layout manually in Canva editor or convert to fixed-size canvas.",
        });
        continue;
      }

      // 3. Supported operation
      supportedOps.push(op);
    }

    return {
      valid: unsupportedOps.length === 0,
      supportedOps,
      unsupportedOps,
    };
  }
}

module.exports = new CanvaCapabilityRegistry();
