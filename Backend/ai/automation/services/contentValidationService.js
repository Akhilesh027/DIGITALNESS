/**
 * contentValidationService.js
 * Deterministic quality and compliance validator for generated content items.
 */

class ContentValidationService {
  /**
   * Validates a calendar item against brand profile rules.
   */
  validateItem(item, clientContext) {
    const issues = [];

    if (!item.headline || item.headline.trim().length < 5) {
      issues.push("Headline is too short or missing.");
    }

    if (!item.caption || item.caption.trim().length < 15) {
      issues.push("Caption must be at least 15 characters.");
    }

    if (!item.creativeBrief || item.creativeBrief.trim().length < 10) {
      issues.push("Creative brief is required for design production.");
    }

    // Check Prohibited Claims
    const combinedText = `${item.headline} ${item.caption}`.toLowerCase();
    for (const prohibited of clientContext.prohibitedClaims || []) {
      if (combinedText.includes(prohibited.toLowerCase())) {
        issues.push(`Content contains prohibited phrase: '${prohibited}'.`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

module.exports = new ContentValidationService();
