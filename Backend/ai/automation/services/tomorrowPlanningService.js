/**
 * tomorrowPlanningService.js
 * Next-Day Predictive Lookahead Engine for EOD Wraps and Morning Planning.
 */

const Work = require("../../../models/Work");
const Invoice = require("../../../models/Invoice");
const CollectionFollowup = require("../../../models/CollectionFollowup");

class TomorrowPlanningService {
  /**
   * Predicts critical operational and financial requirements for tomorrow.
   */
  async getTomorrowPlan() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const [tasksDueTomorrow, followups] = await Promise.all([
      Work.find({
        status: { $nin: ["Completed", "Failed"] },
        dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow },
      })
        .populate("customer", "name")
        .lean(),
      CollectionFollowup.find({
        status: { $in: ["OPEN", "PROMISE_TO_PAY"] },
      })
        .populate("invoiceId", "balanceAmount dueDate")
        .populate("clientId", "name")
        .lean(),
    ]);

    const tomorrowRisks = [];

    if (tasksDueTomorrow.length > 0) {
      tomorrowRisks.push(`${tasksDueTomorrow.length} client deliverables are scheduled for delivery tomorrow.`);
    }

    const promisesTomorrow = [];
    followups.forEach((f) => {
      (f.promises || []).forEach((p) => {
        if (p.status === "PENDING" && new Date(p.date) >= startOfTomorrow && new Date(p.date) <= endOfTomorrow) {
          promisesTomorrow.push({
            client: f.clientId?.name || "Client",
            amount: p.amount,
          });
        }
      });
    });

    if (promisesTomorrow.length > 0) {
      const totalPromiseAmt = promisesTomorrow.reduce((sum, p) => sum + p.amount, 0);
      tomorrowRisks.push(`₹${totalPromiseAmt.toLocaleString("en-IN")} across ${promisesTomorrow.length} client payment commitments expected tomorrow.`);
    }

    return {
      date: tomorrow.toISOString().split("T")[0],
      tasksDueTomorrowCount: tasksDueTomorrow.length,
      promisesTomorrowCount: promisesTomorrow.length,
      tomorrowRisks,
    };
  }
}

module.exports = new TomorrowPlanningService();
