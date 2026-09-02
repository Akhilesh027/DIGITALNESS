/**
 * paymentRecoveryAutomationHandlers.js
 * Deterministic command handlers for Phase 5E Cash-Flow Operations & Payment Recovery.
 */

const paymentRecoveryEngine = require("../../automation/engines/PaymentRecoveryEngine");
const paymentAgingService = require("../../automation/services/paymentAgingService");
const paymentLinkService = require("../../automation/services/paymentLinkService");
const Invoice = require("../../../models/Invoice");
const CollectionFollowup = require("../../../models/CollectionFollowup");

exports.scanDues = async (params = {}, ctx = {}) => {
  const result = await paymentRecoveryEngine.scan({
    userId: ctx.userId,
    runId: ctx.runId,
  });
  return result;
};

exports.getAgingSummary = async (params = {}, ctx = {}) => {
  const rollup = await paymentAgingService.getAgingRollup();
  return {
    currency: "INR",
    aging: rollup,
  };
};

exports.getExpectedCollections = async (params = {}, ctx = {}) => {
  const invoices = await Invoice.find({
    paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
  })
    .populate("customer", "name companyName contactNumbers city")
    .sort({ dueDate: 1 })
    .lean();

  const dues = invoices.map((inv) => ({
    invoiceId: inv._id,
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer?.name || "Client",
    originalAmount: inv.originalAmount,
    paidAmount: inv.paidAmount,
    balance: paymentAgingService.getOutstandingBalance(inv),
    dueDate: inv.dueDate,
    paymentStatus: inv.paymentStatus,
    agingBucket: paymentAgingService.getAgingBucket(inv),
  }));

  const totalOutstanding = dues.reduce((sum, d) => sum + d.balance, 0);

  return {
    count: dues.length,
    totalOutstanding,
    currency: "INR",
    dues,
  };
};

exports.getOverdueInvoices = async (params = {}, ctx = {}) => {
  const followups = await CollectionFollowup.find({
    status: { $in: ["OPEN", "PROMISE_TO_PAY", "ESCALATED"] },
    agingBucket: { $regex: /^OVERDUE/ },
  })
    .populate({
      path: "invoiceId",
      populate: { path: "customer" },
    })
    .populate("clientId", "name companyName contactNumbers")
    .sort({ priorityScore: -1 })
    .lean();

  return {
    count: followups.length,
    overdueAccounts: followups,
  };
};

exports.getCriticalCollections = async (params = {}, ctx = {}) => {
  const followups = await CollectionFollowup.find({
    status: { $in: ["OPEN", "PROMISE_TO_PAY", "ESCALATED"] },
    priorityScore: { $gte: 70 },
  })
    .populate({
      path: "invoiceId",
      populate: { path: "customer" },
    })
    .populate("clientId", "name companyName contactNumbers")
    .sort({ priorityScore: -1 })
    .lean();

  return {
    count: followups.length,
    criticalAccounts: followups,
  };
};

exports.generateReminder = async (params = {}, ctx = {}) => {
  const invoiceId = params.invoiceId;
  if (!invoiceId) throw new Error("invoiceId is required.");

  const channel = params.channel || "WHATSAPP";
  const result = await paymentRecoveryEngine.generateReminder({ invoiceId, channel });
  return result;
};

exports.recordPromiseToPay = async (params = {}, ctx = {}) => {
  const { invoiceId, promisedAmount, promisedDate, notes } = params;
  if (!invoiceId || !promisedAmount || !promisedDate) {
    throw new Error("invoiceId, promisedAmount, and promisedDate are required.");
  }

  const result = await paymentRecoveryEngine.recordPromiseToPay({
    invoiceId,
    promisedAmount,
    promisedDate,
    notes,
    userId: ctx.userId,
  });

  return result;
};

exports.markDisputed = async (params = {}, ctx = {}) => {
  const { invoiceId, reason } = params;
  if (!invoiceId || !reason) throw new Error("invoiceId and reason are required.");

  const result = await paymentRecoveryEngine.markDisputed({
    invoiceId,
    reason,
    userId: ctx.userId,
  });

  return result;
};

exports.resolveDispute = async (params = {}, ctx = {}) => {
  const { invoiceId } = params;
  if (!invoiceId) throw new Error("invoiceId is required.");

  const result = await paymentRecoveryEngine.resolveDispute({
    invoiceId,
    userId: ctx.userId,
  });

  return result;
};

exports.generatePaymentLink = async (params = {}, ctx = {}) => {
  const invoiceId = params.invoiceId;
  if (!invoiceId) throw new Error("invoiceId is required.");

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error("Invoice not found.");

  const balance = paymentAgingService.getOutstandingBalance(invoice);
  const upiUri = paymentLinkService.generateUPIPaymentUri({
    invoiceNumber: invoice.invoiceNumber,
    balance,
  });

  return {
    invoiceNumber: invoice.invoiceNumber,
    balance,
    currency: "INR",
    upiUri,
  };
};
