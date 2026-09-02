/**
 * paymentMessageValidationService.js
 * Deterministic compliance and financial validation service for payment communications.
 */

class PaymentMessageValidationService {
  /**
   * Validates generated reminder copy against true database values.
   */
  validateMessage({ message, invoice, balance, customer }) {
    const errors = [];

    if (!message || typeof message !== "string") {
      errors.push("Message content is missing or invalid.");
      return { isValid: false, errors };
    }

    // 1. Prohibit aggressive / threatening / legal terms unless approved contractually
    const prohibitedTerms = ["legal notice", "police", "court case", "penalty fee", "interest penalty", "threat"];
    for (const term of prohibitedTerms) {
      if (message.toLowerCase().includes(term)) {
        errors.push(`Message contains prohibited or unauthorized term: '${term}'.`);
      }
    }

    // 2. Prohibit invented late fee numbers
    if (message.match(/\+\s*₹?\s*\d+\s*(late fee|penalty)/i)) {
      errors.push("AI generated unauthorized late fee additions.");
    }

    // 3. Ensure proper balance representation
    const formattedBalance = Number(balance).toLocaleString("en-IN");
    if (!message.includes(String(balance)) && !message.includes(formattedBalance)) {
      errors.push(`Message does not state the exact confirmed outstanding balance (₹${formattedBalance}).`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new PaymentMessageValidationService();
