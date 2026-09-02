/**
 * PaymentRecoveryEngine.js
 * Phase 5E: Cash-Flow Operations & Payment Recovery Engine for Digitalness CRM.
 */

const Invoice = require("../../../models/Invoice");
const CollectionFollowup = require("../../../models/CollectionFollowup");
const Customer = require("../../../models/Customer");
const paymentAgingService = require("../services/paymentAgingService");
const paymentPriorityService = require("../services/paymentPriorityService");
const paymentRecoveryPolicyService = require("../services/paymentRecoveryPolicyService");
const paymentMessageValidationService = require("../services/paymentMessageValidationService");
const paymentLinkService = require("../services/paymentLinkService");
const auditService = require("../AutomationAuditService");
const eventBus = require("../services/eventBus");

class PaymentRecoveryEngine {
  /**
   * Scans all open and overdue invoices, calculates aging, manages follow-ups, and prioritizes cash collection.
   */
  async scan({ userId = null, runId = null } = {}) {
    const now = new Date();

    // 1. Fetch all active non-cancelled invoices
    const openInvoices = await Invoice.find({
      paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE", "DISPUTED"] },
    })
      .populate("customer", "name companyName contactNumbers email city")
      .lean();

    const createdFollowups = [];
    const updatedFollowups = [];
    let expectedTodayTotal = 0;
    let overdueTotal = 0;
    let criticalCount = 0;
    let brokenPromisesCount = 0;

    for (const inv of openInvoices) {
      const balance = paymentAgingService.getOutstandingBalance(inv);

      // If fully paid, auto-resolve
      if (balance <= 0) {
        await Invoice.findByIdAndUpdate(inv._id, { paymentStatus: "PAID", balanceAmount: 0 });
        await CollectionFollowup.findOneAndUpdate(
          { invoiceId: inv._id },
          { status: "PAID" }
        );
        continue;
      }

      const agingBucket = paymentAgingService.getAgingBucket(inv);
      const ageInDays = paymentAgingService.calculateInvoiceAge(inv);

      if (agingBucket === "DUE_TODAY") expectedTodayTotal += balance;
      if (agingBucket.startsWith("OVERDUE")) overdueTotal += balance;

      // 2. Fetch or create CollectionFollowup
      const followupKey = `collection:${inv._id}`;
      let followup = await CollectionFollowup.findOne({ followupKey });

      // 3. Check for broken promises
      if (followup && followup.promises) {
        followup.promises.forEach((p) => {
          if (p.status === "PENDING" && new Date(p.date) < now) {
            p.status = "BROKEN";
            p.brokenAt = now;
            brokenPromisesCount++;
          }
        });
      }

      // 4. Calculate Priority Score (0-100)
      const priorityScore = paymentPriorityService.calculatePriority({
        invoice: inv,
        balance,
        agingBucket,
        followup,
      });

      if (priorityScore >= 85) criticalCount++;

      // 5. Determine Eligible Recovery Stage
      const recoveryStage = paymentRecoveryPolicyService.determineStage({ ageInDays, followup }) || "FRIENDLY_REMINDER";

      if (!followup) {
        followup = await CollectionFollowup.create({
          followupKey,
          invoiceId: inv._id,
          clientId: inv.customer?._id || inv.customer,
          status: inv.paymentStatus === "DISPUTED" ? "DISPUTED" : "OPEN",
          agingBucket,
          balanceAtDetection: balance,
          priorityScore,
          recoveryStage,
        });
        createdFollowups.push(followup);
      } else {
        followup.agingBucket = agingBucket;
        followup.balanceAtDetection = balance;
        followup.priorityScore = priorityScore;
        followup.recoveryStage = recoveryStage;
        if (inv.paymentStatus === "DISPUTED") followup.status = "DISPUTED";
        await followup.save();
        updatedFollowups.push(followup);
      }
    }

    const agingRollup = await paymentAgingService.getAgingRollup();

    const summary = `Scanned ${openInvoices.length} invoices. Total Outstanding: ₹${agingRollup.totalOutstanding.toLocaleString("en-IN")} (Due Today: ₹${expectedTodayTotal.toLocaleString("en-IN")}, Overdue: ₹${overdueTotal.toLocaleString("en-IN")}, ${criticalCount} Critical Accounts).`;

    return {
      status: "COMPLETED",
      scannedCount: openInvoices.length,
      totalOutstanding: agingRollup.totalOutstanding,
      expectedTodayTotal,
      overdueTotal,
      criticalCount,
      brokenPromisesCount,
      agingRollup,
      createdFollowups: createdFollowups.length,
      updatedFollowups: updatedFollowups.length,
      summary,
    };
  }

  /**
   * Generates a compliant payment reminder draft for an invoice.
   */
  async generateReminder({ invoiceId, channel = "WHATSAPP" }) {
    const invoice = await Invoice.findById(invoiceId).populate("customer");
    if (!invoice) throw new Error("Invoice not found.");

    const balance = paymentAgingService.getOutstandingBalance(invoice);
    if (balance <= 0) throw new Error("Invoice is already fully paid.");

    const followup = await CollectionFollowup.findOne({ invoiceId });
    const safetyCheck = paymentRecoveryPolicyService.canSendReminder({
      invoice,
      balance,
      followup,
      stage: followup ? followup.recoveryStage : "FRIENDLY_REMINDER",
    });

    if (!safetyCheck.allowed) {
      throw new Error(`Cannot generate reminder: ${safetyCheck.reason}`);
    }

    const clientName = invoice.customer?.name || "Valued Client";
    const formattedBalance = `₹${balance.toLocaleString("en-IN")}`;
    const formattedDue = new Date(invoice.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const upiUri = paymentLinkService.generateUPIPaymentUri({
      invoiceNumber: invoice.invoiceNumber,
      balance,
    });

    const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} (${formattedBalance})`;
    const message = `Dear ${clientName},\n\nThis is a polite reminder regarding Invoice ${invoice.invoiceNumber} for ${formattedBalance}, which was due on ${formattedDue}.\n\nYou can complete the payment instantly via UPI using the link below:\n${upiUri}\n\nIf you have already made the transfer, please reply with the transaction details so we can update your account.\n\nWarm regards,\nDigitalness Accounts Team`;

    // Validate generated copy
    const validation = paymentMessageValidationService.validateMessage({
      message,
      invoice,
      balance,
      customer: invoice.customer,
    });

    if (!validation.isValid) {
      throw new Error(`Reminder validation failed: ${validation.errors.join(", ")}`);
    }

    const attempt = {
      timestamp: new Date(),
      channel,
      type: followup?.recoveryStage || "REMINDER",
      status: "DRAFTED",
      subject,
      message,
      cta: "Pay via UPI",
    };

    if (followup) {
      followup.contactAttempts.push(attempt);
      await followup.save();
    }

    return {
      success: true,
      draft: attempt,
      upiUri,
      balance,
    };
  }

  /**
   * Records a client's promise to pay.
   */
  async recordPromiseToPay({ invoiceId, promisedAmount, promisedDate, notes = "", userId = null }) {
    const followup = await CollectionFollowup.findOne({ invoiceId });
    if (!followup) throw new Error("Collection followup record not found.");

    const promiseId = `promise_${Date.now()}`;
    const newPromise = {
      promiseId,
      amount: Number(promisedAmount),
      date: new Date(promisedDate),
      status: "PENDING",
      createdAt: new Date(),
      notes,
    };

    followup.promises.push(newPromise);
    followup.status = "PROMISE_TO_PAY";
    await followup.save();

    return {
      success: true,
      promise: newPromise,
      message: `Recorded promise to pay ₹${promisedAmount} on ${new Date(promisedDate).toLocaleDateString()}.`,
    };
  }

  /**
   * Marks an invoice as disputed to halt automated messaging.
   */
  async markDisputed({ invoiceId, reason, userId = null }) {
    await Invoice.findByIdAndUpdate(invoiceId, {
      paymentStatus: "DISPUTED",
      disputeReason: reason,
    });

    const followup = await CollectionFollowup.findOneAndUpdate(
      { invoiceId },
      {
        status: "DISPUTED",
        "dispute.active": true,
        "dispute.reason": reason,
        "dispute.openedAt": new Date(),
      },
      { new: true }
    );

    return {
      success: true,
      message: "Invoice marked as disputed. Automated recovery reminders paused.",
      followup,
    };
  }

  /**
   * Resolves a dispute and resumes standard collection.
   */
  async resolveDispute({ invoiceId, userId = null }) {
    await Invoice.findByIdAndUpdate(invoiceId, {
      disputeReason: "",
    });

    const followup = await CollectionFollowup.findOneAndUpdate(
      { invoiceId },
      {
        status: "OPEN",
        "dispute.active": false,
        "dispute.resolvedAt": new Date(),
      },
      { new: true }
    );

    return {
      success: true,
      message: "Dispute resolved. Standard payment recovery resumed.",
      followup,
    };
  }

  /**
   * Reconciles invoice balance after a real confirmed payment transaction.
   */
  async resolveAfterPayment({ invoiceId, amountPaid }) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return;

    const newPaid = (invoice.paidAmount || 0) + Number(amountPaid);
    const newBalance = Math.max(0, invoice.originalAmount - newPaid);

    invoice.paidAmount = newPaid;
    invoice.balanceAmount = newBalance;
    invoice.lastPaymentAt = new Date();
    invoice.paymentStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";
    await invoice.save();

    if (newBalance === 0) {
      await CollectionFollowup.findOneAndUpdate(
        { invoiceId },
        {
          status: "PAID",
          "promises.$[elem].status": "FULFILLED",
          "promises.$[elem].fulfilledAt": new Date(),
        },
        { arrayFilters: [{ "elem.status": "PENDING" }] }
      );
    }

    return {
      success: true,
      newBalance,
      paymentStatus: invoice.paymentStatus,
    };
  }

  /**
   * AutomationOrchestrator execution hook.
   */
  async execute({ params = {}, policyMode = "LIVE_AUTONOMOUS", runId = null, userId = null } = {}) {
    const scanResult = await this.scan({ userId, runId });
    return {
      status: "COMPLETED",
      actionsExecuted: [
        { type: "INVOICE_SCAN", count: scanResult?.totalScanned || 0 },
        { type: "FOLLOWUPS_UPDATED", count: scanResult?.updatedFollowups?.length || 0 },
      ],
      summary: `Evaluated open invoices. Total overdue: ₹${(scanResult?.overdueTotal || 0).toLocaleString("en-IN")}.`,
      data: scanResult,
    };
  }
}

module.exports = new PaymentRecoveryEngine();
