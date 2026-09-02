/**
 * WhatsAppIdentityNormalizer.js
 * Normalizes WhatsApp phone numbers and wa_ids into canonical formats without guessing missing country codes.
 */

class WhatsAppIdentityNormalizer {
  /**
   * Normalizes incoming or outgoing WhatsApp phone identifier
   */
  normalize(rawIdentifier) {
    if (!rawIdentifier || typeof rawIdentifier !== "string") {
      return {
        rawWaId: rawIdentifier || null,
        normalizedPhone: null,
        isValid: false,
      };
    }

    const trimmed = rawIdentifier.trim();
    // Remove '+' and any whitespace, dashes, parens
    const cleaned = trimmed.replace(/[^\d]/g, "");

    // Valid E.164 phone length typically 10 to 15 digits
    const isValid = cleaned.length >= 10 && cleaned.length <= 15;

    return {
      rawWaId: trimmed,
      normalizedPhone: cleaned,
      displayPhone: cleaned.length === 12 && cleaned.startsWith("91")
        ? `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
        : `+${cleaned}`,
      isValid,
    };
  }

  /**
   * Evaluates if two phone representations refer to the same participant
   */
  isSameParticipant(phoneA, phoneB) {
    const normA = this.normalize(phoneA);
    const normB = this.normalize(phoneB);
    return normA.isValid && normB.isValid && normA.normalizedPhone === normB.normalizedPhone;
  }
}

module.exports = new WhatsAppIdentityNormalizer();
