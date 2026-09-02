/**
 * paymentAgingService.js
 * Deterministic invoice aging and outstanding balance calculation service.
 */

const Invoice = require("../../../models/Invoice");
const Customer = require("../../../models/Customer");

class PaymentAgingService {
  /**
   * Deterministically calculates the days overdue or days until due.
   */
  calculateInvoiceAge(invoice) {
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Assigns an invoice to a standard financial aging bucket.
   */
  getAgingBucket(invoice) {
    const diffDays = this.calculateInvoiceAge(invoice);

    if (diffDays < 0) return "UPCOMING";
    if (diffDays === 0) return "DUE_TODAY";
    if (diffDays <= 3) return "OVERDUE_1_3";
    if (diffDays <= 7) return "OVERDUE_4_7";
    if (diffDays <= 15) return "OVERDUE_8_15";
    if (diffDays <= 30) return "OVERDUE_16_30";
    return "OVERDUE_30_PLUS";
  }

  /**
   * Canonical single source of truth for outstanding balance.
   */
  getOutstandingBalance(invoice) {
    if (!invoice) return 0;
    const original = Number(invoice.originalAmount) || 0;
    const paid = Number(invoice.paidAmount) || 0;
    return Math.max(0, original - paid);
  }

  /**
   * Computes an agency-wide financial aging rollup across all active invoices.
   */
  async getAgingRollup() {
    const invoices = await Invoice.find({
      paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
    }).lean();

    const rollup = {
      totalOutstanding: 0,
      upcoming: 0,
      dueToday: 0,
      overdue1_3: 0,
      overdue4_7: 0,
      overdue8_15: 0,
      overdue16_30: 0,
      overdue30Plus: 0,
      count: invoices.length,
    };

    invoices.forEach((inv) => {
      const balance = this.getOutstandingBalance(inv);
      rollup.totalOutstanding += balance;
      const bucket = this.getAgingBucket(inv);

      switch (bucket) {
        case "UPCOMING":
          rollup.upcoming += balance;
          break;
        case "DUE_TODAY":
          rollup.dueToday += balance;
          break;
        case "OVERDUE_1_3":
          rollup.overdue1_3 += balance;
          break;
        case "OVERDUE_4_7":
          rollup.overdue4_7 += balance;
          break;
        case "OVERDUE_8_15":
          rollup.overdue8_15 += balance;
          break;
        case "OVERDUE_16_30":
          rollup.overdue16_30 += balance;
          break;
        case "OVERDUE_30_PLUS":
          rollup.overdue30Plus += balance;
          break;
      }
    });

    return rollup;
  }
}

module.exports = new PaymentAgingService();
