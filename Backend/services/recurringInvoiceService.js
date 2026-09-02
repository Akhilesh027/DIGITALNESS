/**
 * recurringInvoiceService.js
 * Automated Monthly Recurring Invoice Generation Engine.
 * Automatically scans active clients, checks if current month retainer is billed,
 * and generates standard recurring invoices.
 */

const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");

class RecurringInvoiceService {
  /**
   * Generates monthly recurring retainer invoices for all active clients.
   */
  async generateMonthlyRecurringInvoices({ month = null, year = null, createdBy = null } = {}) {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString("default", { month: "long" });
    const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

    console.log(`[RecurringInvoiceService] Running monthly billing run for ${periodStr} (${monthName})...`);

    // 1. Fetch active customers with defined retainers/packages
    const customers = await Customer.find({
      status: { $in: ["Active", "active"] },
    });

    const results = {
      period: periodStr,
      monthName,
      totalCustomers: customers.length,
      generated: [],
      skipped: [],
      errors: [],
    };

    for (const customer of customers) {
      try {
        // Resolve monthly retainer amount
        let retainer = 0;
        if (customer.package) {
          const num = Number(customer.package);
          retainer = num > 1000 ? num : (num * 1000) || 25000;
        } else {
          retainer = 25000; // Standard starter baseline
        }

        // Idempotency: Check if an invoice for this client & month already exists
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const existingInvoice = await Invoice.findOne({
          customer: customer._id,
          invoiceDate: { $gte: startOfMonth, $lte: endOfMonth },
        });

        if (existingInvoice) {
          results.skipped.push({
            customerId: customer._id,
            customerName: customer.name,
            reason: `Invoice '${existingInvoice.invoiceNumber}' already billed for ${monthName} ${targetYear}.`,
          });
          continue;
        }

        // Generate Due Date: 10th of the month or 7 days from today
        const dueDate = new Date(targetYear, targetMonth - 1, 10);
        if (dueDate < new Date()) {
          dueDate.setDate(new Date().getDate() + 7);
        }

        const invoiceNumber = `INV-${targetYear}${String(targetMonth).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

        const invoice = await Invoice.create({
          invoiceNumber,
          customer: customer._id,
          originalAmount: retainer,
          paidAmount: 0,
          balanceAmount: retainer,
          currency: "INR",
          invoiceDate: new Date(),
          dueDate,
          paymentStatus: "UNPAID",
          items: [
            {
              description: `Monthly Digital Marketing & Agency Retainer - ${monthName} ${targetYear}`,
              quantity: 1,
              unitPrice: retainer,
              total: retainer,
            },
          ],
          notes: `Automated recurring retainer invoice for ${monthName} ${targetYear}.`,
          createdBy: createdBy || null,
        });

        // Update Customer Ledger
        customer.totalPending = (customer.totalPending || 0) + retainer;
        await customer.save();

        results.generated.push({
          customerId: customer._id,
          customerName: customer.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: retainer,
          dueDate: invoice.dueDate,
        });
      } catch (err) {
        console.error(`[Recurring Billing Error for ${customer.name}]:`, err.message);
        results.errors.push({
          customerId: customer._id,
          customerName: customer.name,
          error: err.message,
        });
      }
    }

    // Audit Logging
    if (results.generated.length > 0) {
      try {
        await AuditLog.create({
          actorType: "AI Agent",
          actorName: "Autonomous Recurring Billing Engine",
          action: "RECURRING_INVOICES_GENERATED",
          entityType: "Invoice",
          details: `Generated ${results.generated.length} recurring invoices for period ${periodStr}. Total billed: ₹${results.generated.reduce((sum, i) => sum + i.amount, 0).toLocaleString("en-IN")}.`,
        });
      } catch (auditErr) {}
    }

    return results;
  }
}

module.exports = new RecurringInvoiceService();
