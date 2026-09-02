/**
 * paymentHandlers.js
 * Deterministic handlers for Financial & Payment commands.
 * Integrates directly with Customer billing balances (totalPaid, totalPending) and activity logs.
 */

const Customer = require("../../../models/Customer");

exports.getDuePayments = async (params = {}, ctx = {}) => {
  const query = {
    status: "Active",
    totalPending: { $gt: 0 },
  };
  if (params.customerId) {
    query._id = params.customerId;
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const customersWithDues = await Customer.find(query)
    .select("name companyName city contactNumbers totalPaid totalPending package updatedAt")
    .sort({ totalPending: -1 })
    .limit(limit)
    .lean();

  const totalOutstanding = customersWithDues.reduce((sum, c) => sum + (c.totalPending || 0), 0);

  return {
    count: customersWithDues.length,
    totalOutstanding,
    currency: "INR",
    dues: customersWithDues.map((c) => ({
      customerId: c._id,
      clientName: c.name,
      companyName: c.companyName,
      totalPending: c.totalPending,
      totalPaid: c.totalPaid,
      package: c.package,
      contact: c.contactNumbers?.[0] || "",
    })),
  };
};

exports.getOverduePayments = async (params = {}, ctx = {}) => {
  return await exports.getDuePayments(params, ctx);
};

exports.getClientHistory = async (params = {}, ctx = {}) => {
  const customer = await Customer.findById(params.customerId).lean();
  if (!customer) throw new Error(`Customer with ID '${params.customerId}' not found.`);

  const paymentLogs = (customer.activityLogs || []).filter((log) => log.type === "payment");

  return {
    customerId: customer._id,
    clientName: customer.name,
    totalPaid: customer.totalPaid || 0,
    totalPending: customer.totalPending || 0,
    paymentHistory: paymentLogs,
  };
};

exports.recordPayment = async (params = {}, ctx = {}) => {
  const customer = await Customer.findById(params.customerId);
  if (!customer) throw new Error(`Customer with ID '${params.customerId}' not found.`);

  const amount = Number(params.amount);
  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const previousPaid = Number(customer.totalPaid || 0);
  const previousPending = Number(customer.totalPending || 0);

  const newTotalPaid = previousPaid + amount;
  const newTotalPending = Math.max(0, previousPending - amount);

  customer.totalPaid = newTotalPaid;
  customer.totalPending = newTotalPending;

  const paymentLog = {
    title: `Payment Received: ₹${amount.toLocaleString("en-IN")}`,
    message: `Amount: ₹${amount} | Execution: ${ctx.executionId || "Direct"} | Mode: ${params.paymentMode || "Bank Transfer"}${params.referenceNumber ? ` | Ref: ${params.referenceNumber}` : ""}${params.notes ? ` | Notes: ${params.notes}` : ""}`,
    type: "payment",
    createdBy: ctx.userId || null,
    createdAt: params.paymentDate ? new Date(params.paymentDate) : new Date(),
    metadata: {
      executionId: ctx.executionId || null,
      amount,
      currency: params.currency || "INR",
      paymentDate: params.paymentDate || new Date(),
      recordedBy: ctx.userId || null,
      previousTotalPaid: previousPaid,
      newTotalPaid,
      previousTotalPending: previousPending,
      newTotalPending,
      referenceNumber: params.referenceNumber || "",
      notes: params.notes || "",
    },
  };

  customer.activityLogs.push(paymentLog);
  await customer.save();

  return {
    customerId: customer._id,
    clientName: customer.name,
    amountRecorded: amount,
    currency: params.currency || "INR",
    newTotalPaid: customer.totalPaid,
    newTotalPending: customer.totalPending,
    previousPaid,
    previousPending,
    paymentLog,
  };
};
