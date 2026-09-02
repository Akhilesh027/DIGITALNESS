/**
 * BudgetCalculator.js
 * Advertising Budget Allocation, Split Calculator & Performance Forecaster.
 */

class BudgetCalculator {
  calculateBudget({ customer, parameters = {} }) {
    let dailyBudget = 1000;
    const rawBudget = parameters.dailyBudget !== undefined ? parameters.dailyBudget : parameters.budget;

    if (typeof rawBudget === "number" && rawBudget > 0) {
      dailyBudget = rawBudget;
    } else if (typeof rawBudget === "string") {
      const match = rawBudget.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      if (match && Number(match[1]) > 0) {
        dailyBudget = Number(match[1]);
      }
    } else if (customer?.adsProfile?.monthlyMetaBudget && customer.adsProfile.monthlyMetaBudget > 0) {
      dailyBudget = Math.round(customer.adsProfile.monthlyMetaBudget / 30);
    }

    let days = 10;
    if (parameters.durationDays && !isNaN(Number(parameters.durationDays)) && Number(parameters.durationDays) > 0) {
      days = Number(parameters.durationDays);
    } else if (typeof rawBudget === "string") {
      const dayMatch = rawBudget.match(/(\d+)\s*Days?/i);
      if (dayMatch) days = Number(dayMatch[1]);
    }

    const totalBudget = dailyBudget * days;
    const platform = parameters.platform || "Meta";

    let recommendedMetaSplit = totalBudget;
    let recommendedGoogleSplit = 0;

    if (platform === "Omnichannel") {
      recommendedMetaSplit = Math.round(totalBudget * 0.65);
      recommendedGoogleSplit = totalBudget - recommendedMetaSplit;
    } else if (platform === "Google") {
      recommendedGoogleSplit = totalBudget;
      recommendedMetaSplit = 0;
    }

    // Benchmark Indian local business CPL calculations
    let avgCplMin = 180;
    let avgCplMax = 320;

    if (dailyBudget >= 2000) {
      avgCplMin = 150;
      avgCplMax = 280;
    }

    const estimatedDailyLeadsMin = Math.max(1, Math.round(dailyBudget / avgCplMax));
    const estimatedDailyLeadsMax = Math.max(2, Math.round(dailyBudget / avgCplMin));
    const estimatedTotalLeadsMin = estimatedDailyLeadsMin * days;
    const estimatedTotalLeadsMax = estimatedDailyLeadsMax * days;

    return {
      budgetType: "Daily",
      amount: dailyBudget,
      currency: "INR",
      days,
      totalBudget,
      recommendedMetaSplit,
      recommendedGoogleSplit,
      estimatedCPL: `₹${avgCplMin} - ₹${avgCplMax}`,
      estimatedDailyLeads: `${estimatedDailyLeadsMin} - ${estimatedDailyLeadsMax} leads / day`,
      estimatedTotalLeads: `${estimatedTotalLeadsMin} - ${estimatedTotalLeadsMax} qualified enquiries`,
      estimatedMonthlyLeads: `${estimatedDailyLeadsMin * 30} - ${estimatedDailyLeadsMax * 30} leads / month`,
    };
  }
}

module.exports = new BudgetCalculator();
