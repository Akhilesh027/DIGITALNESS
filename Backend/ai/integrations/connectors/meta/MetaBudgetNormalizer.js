/**
 * MetaBudgetNormalizer.js
 * Deterministic Currency & Budget Normalization for Meta Marketing API
 * 
 * Converts display daily/lifetime budgets into exact Meta minor currency units (e.g. paise / cents)
 * and enforces strict CRM budget ceilings to prevent accidental over-spend.
 */

const CURRENCY_MULTIPLIERS = {
  INR: 100, // 1 INR = 100 Paise
  USD: 100, // 1 USD = 100 Cents
  EUR: 100,
  GBP: 100,
  AED: 100,
  SGD: 100,
  AUD: 100,
  CAD: 100,
  JPY: 1,   // Zero-decimal currency
};

// Hard guardrail: Max daily budget ceiling per campaign unless overridden by agency admin
const DEFAULT_MAX_DAILY_BUDGET = 50000; // ₹50,000 / day hard limit
const REAL_TEST_MAX_DAILY_BUDGET = Number(process.env.META_REAL_TEST_MAX_DAILY_BUDGET || 1000); // ₹1,000 max for tests

class MetaBudgetNormalizer {
  /**
   * Normalizes display budget to Meta API minor currency units
   */
  normalize({ amount, currency = "INR", budgetType = "Daily", isRealTest = false }) {
    const cleanCurrency = String(currency || "INR").toUpperCase();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      const err = new Error(`BUDGET_POLICY_VIOLATION: Invalid budget amount '${amount}'. Must be a positive number.`);
      err.code = "BUDGET_POLICY_VIOLATION";
      throw err;
    }

    // Check minimum threshold
    if (cleanCurrency === "INR" && numAmount < 100) {
      const err = new Error(`BUDGET_POLICY_VIOLATION: Daily budget ₹${numAmount} is below Meta's minimum of ₹100.`);
      err.code = "BUDGET_POLICY_VIOLATION";
      throw err;
    }

    // Check maximum hard ceiling
    const ceiling = isRealTest ? REAL_TEST_MAX_DAILY_BUDGET : DEFAULT_MAX_DAILY_BUDGET;
    if (numAmount > ceiling) {
      const err = new Error(
        `BUDGET_POLICY_VIOLATION: Requested budget ${cleanCurrency} ${numAmount} exceeds safety ceiling of ${cleanCurrency} ${ceiling}.`
      );
      err.code = "BUDGET_POLICY_VIOLATION";
      throw err;
    }

    const multiplier = CURRENCY_MULTIPLIERS[cleanCurrency] || 100;
    const apiBudgetValue = Math.round(numAmount * multiplier);

    return {
      displayBudget: numAmount,
      apiBudgetValue,
      currency: cleanCurrency,
      multiplier,
      budgetType,
      formattedDisplay: `${cleanCurrency === "INR" ? "₹" : "$"}${numAmount.toLocaleString()} / day`,
    };
  }
}

module.exports = new MetaBudgetNormalizer();
