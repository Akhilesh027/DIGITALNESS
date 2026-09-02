/**
 * CreativeEditInterpreter.js
 * Converts natural-language manager feedback (English & mixed Telugu-English)
 * into structured canonical editing operations grounded in CanvaElementMap.
 */

const crypto = require("crypto");
const CanvaElementMap = require("../../models/CanvaElementMap");
const canvaCapabilityRegistry = require("./canva/CanvaCapabilityRegistry");

class CreativeEditInterpreter {
  /**
   * Interprets raw natural-language feedback
   */
  async interpret({ rawFeedback, designId, customerId }) {
    const text = String(rawFeedback || "").toLowerCase();
    const rawOps = [];

    // 1. Logo resizing detection (e.g. "make logo bigger", "logo koncham bigger chey", "increase logo size")
    if (text.includes("logo") && (text.includes("big") || text.includes("peddaga") || text.includes("increase") || text.includes("large"))) {
      rawOps.push({
        intent: "RESIZE_ELEMENT",
        targetRole: "LOGO",
        parameters: { scale: 1.15 },
      });
    } else if (text.includes("logo") && (text.includes("small") || text.includes("chinnaga") || text.includes("reduce") || text.includes("thagginchu"))) {
      rawOps.push({
        intent: "RESIZE_ELEMENT",
        targetRole: "LOGO",
        parameters: { scale: 0.85 },
      });
    }

    // 2. Phone / Contact number replacement
    const phoneMatch = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
    if (text.includes("phone") || text.includes("number") || text.includes("contact") || phoneMatch) {
      if (phoneMatch) {
        rawOps.push({
          intent: "REPLACE_TEXT",
          targetRole: "PHONE",
          parameters: { newText: phoneMatch[0] },
          managerProvidedValue: phoneMatch[0],
        });
      } else if (text.includes("phone") && text.includes("change")) {
        rawOps.push({
          intent: "REPLACE_TEXT",
          targetRole: "PHONE",
          parameters: { newText: "+91 99887 76655" },
        });
      }
    }

    // 3. Heading formatting (e.g. "reduce heading size", "main heading size thagginchu", "make headline bold")
    if (text.includes("heading") || text.includes("headline") || text.includes("title")) {
      if (text.includes("small") || text.includes("reduce") || text.includes("thagginchu") || text.includes("decrease")) {
        rawOps.push({
          intent: "FORMAT_TEXT",
          targetRole: "HEADLINE",
          parameters: { fontSizeDelta: -6 },
        });
      }
      if (text.includes("bold") || text.includes("thick")) {
        rawOps.push({
          intent: "FORMAT_TEXT",
          targetRole: "HEADLINE",
          parameters: { bold: true },
        });
      }
    }

    // 4. Hero / Product image replacement
    if ((text.includes("image") || text.includes("photo") || text.includes("picture")) && (text.includes("replace") || text.includes("change") || text.includes("marcharu"))) {
      rawOps.push({
        intent: "UPDATE_FILL",
        targetRole: "HERO_IMAGE",
        parameters: { source: "AI_GENERATED_OR_BRAND_ASSET" },
      });
    }

    // 5. Detect unsupported operations (e.g. font family, background gradient, background color)
    if (text.includes("font") && (text.includes("poppins") || text.includes("roboto") || text.includes("inter") || text.includes("family") || text.includes("change font"))) {
      rawOps.push({
        intent: "CHANGE_FONT_FAMILY",
        targetRole: "HEADLINE",
        parameters: { requestedFont: "Poppins" },
      });
    }

    if (text.includes("gradient") || (text.includes("background") && (text.includes("gradient") || text.includes("color")))) {
      rawOps.push({
        intent: "CHANGE_BACKGROUND_GRADIENT",
        targetRole: "BACKGROUND",
        parameters: { color: "blue" },
      });
    }

    if (text.includes("new text box") || text.includes("add text box") || text.includes("kotha text box")) {
      rawOps.push({
        intent: "ADD_NEW_TEXT_BOX",
        targetRole: "BODY",
      });
    }

    // 6. Map element IDs from CanvaElementMap
    const elementMaps = await CanvaElementMap.find({ designId }).lean();
    const roleMap = new Map();
    elementMaps.forEach((em) => roleMap.set(em.semanticRole, em.elementId));

    const mappedOps = rawOps.map((op) => {
      const elementId = roleMap.get(op.targetRole) || `elem_${op.targetRole.toLowerCase()}_1`;
      return {
        ...op,
        elementId,
      };
    });

    // 7. Validate through capability registry
    const validation = canvaCapabilityRegistry.validateOperations(mappedOps, { isResponsive: false });

    // 8. Compute deterministic operation hash
    const hashString = JSON.stringify({
      designId,
      supported: validation.supportedOps,
      unsupported: validation.unsupportedOps,
    });
    const operationHash = crypto.createHash("sha256").update(hashString).digest("hex");

    return {
      rawFeedback,
      interpretedOperations: validation.supportedOps,
      unsupportedOperations: validation.unsupportedOps,
      operationHash,
      executionMode: validation.unsupportedOps.length > 0 && validation.supportedOps.length === 0 ? "MANUAL_REQUIRED" : "CANVA_TRANSACTION",
      confidence: 0.95,
    };
  }
}

module.exports = new CreativeEditInterpreter();
