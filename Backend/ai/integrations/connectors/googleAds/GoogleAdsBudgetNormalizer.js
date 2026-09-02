/**
 * GoogleAdsBudgetNormalizer.js
 * Currency & Micros Normalization for Google Ads API v25
 * 
 * Google Ads uses micros: 1 Currency Unit = 1,000,000 Micros (e.g. ₹500 = 500,000,000 micros)
 */

const DEFAULT_MAX_DAILY_BUDGET = 50000; // ₹50,000 / day hard limit
const REAL_TEST_MAX_DAILY_BUDGET = Number(process.env.GOOGLE_ADS_REAL_TEST_MAX_DAILY_BUDGET || 1000);

class GoogleAdsBudgetNormalizer {
  /**
   * Normalizes display budget into Google Ads micros
   */
  normalize({ amount, currency = "INR", isRealTest = false }) {
    const cleanCurrency = String(currency || "INR").toUpperCase();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      const err = new Error(`GOOGLE_ADS_BUDGET_POLICY_VIOLATION: Invalid budget amount '${amount}'. Must be a positive number.`);
      err.code = "GOOGLE_ADS_BUDGET_POLICY_VIOLATION";
      throw err;
    }

    if (cleanCurrency === "INR" && numAmount < 100) {
      const err = new Error(`GOOGLE_ADS_BUDGET_POLICY_VIOLATION: Daily budget ₹${numAmount} is below Google Ads minimum of ₹100.`);
      err.code = "GOOGLE_ADS_BUDGET_POLICY_VIOLATION";
      throw err;
    }

    const ceiling = isRealTest ? REAL_TEST_MAX_DAILY_BUDGET : DEFAULT_MAX_DAILY_BUDGET;
    if (numAmount > ceiling) {
      const err = new Error(
        `GOOGLE_ADS_BUDGET_POLICY_VIOLATION: Requested budget ${cleanCurrency} ${numAmount} exceeds safety ceiling of ${cleanCurrency} ${ceiling}.`
      );
      err.code = "GOOGLE_ADS_BUDGET_POLICY_VIOLATION";
      throw err;
    }

    // Convert to Micros (1 unit = 1,000,000 micros)
    const amountMicros = Math.round(numAmount * 1000000);

    return {
      displayAmount: numAmount,
      currency: cleanCurrency,
      amountMicros,
      formattedDisplay: `${cleanCurrency === "INR" ? "₹" : "$"}${numAmount.toLocaleString()} / day`,
    };
  }
}

module.exports = new GoogleAdsBudgetNormalizer();
