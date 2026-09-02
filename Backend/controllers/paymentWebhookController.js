/**
 * paymentWebhookController.js
 * Universal Payment Gateway Webhook & Instant Reconciliation Controller.
 * Supports Razorpay, Stripe, and generic ERP / Banking payment notifications.
 */

const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const CollectionFollowup = require("../models/CollectionFollowup");
const AuditLog = require("../models/AuditLog");
const Communication = require("../models/Communication");

/**
 * Normalizes payment payload from Razorpay, Stripe, or generic JSON format.
 */
function normalizePaymentPayload(body) {
  // 1. Razorpay Webhook
  if (body.event && body.payload?.payment?.entity) {
    const payment = body.payload.payment.entity;
    return {
      invoiceNumber: payment.notes?.invoiceNumber || payment.notes?.invoice_id || payment.description,
      invoiceId: payment.notes?.invoiceId,
      amount: payment.amount ? payment.amount / 100 : 0, // convert paise to INR
      transactionId: payment.id,
      paymentMethod: payment.method || "Razorpay Online",
      gateway: "Razorpay",
      status: payment.status === "captured" ? "SUCCESS" : payment.status,
    };
  }

  // 2. Stripe Webhook
  if (body.type && body.data?.object) {
    const obj = body.data.object;
    return {
      invoiceNumber: obj.metadata?.invoiceNumber || obj.description,
      invoiceId: obj.metadata?.invoiceId,
      amount: obj.amount_total ? obj.amount_total / 100 : obj.amount ? obj.amount / 100 : 0,
      transactionId: obj.id,
      paymentMethod: obj.payment_method_types?.[0] || "Stripe Card",
      gateway: "Stripe",
      status: obj.payment_status === "paid" || body.type === "payment_intent.succeeded" ? "SUCCESS" : "PENDING",
    };
  }

  // 3. Standard / Generic Webhook
  return {
    invoiceNumber: body.invoiceNumber || body.invoice_no || body.invoiceId,
    invoiceId: body.invoiceId,
    amount: Number(body.amount || body.paidAmount || body.totalPaid || 0),
    transactionId: body.transactionId || body.txnId || body.referenceId || `TXN-${Date.now()}`,
    paymentMethod: body.paymentMethod || body.method || "Bank Transfer / UPI",
    gateway: body.gateway || "Manual / Webhook",
    status: body.status || "SUCCESS",
  };
}

exports.handlePaymentWebhook = async (req, res) => {
  try {
    const payment = normalizePaymentPayload(req.body);

    if (!payment.invoiceNumber && !payment.invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment payload. 'invoiceNumber' or 'invoiceId' is required.",
        received: req.body,
      });
    }

    // 1. Resolve Invoice
    let invoice = null;
    if (payment.invoiceId) {
      invoice = await Invoice.findById(payment.invoiceId);
    }
    if (!invoice && payment.invoiceNumber) {
      invoice = await Invoice.findOne({ invoiceNumber: payment.invoiceNumber });
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: `Invoice '${payment.invoiceNumber || payment.invoiceId}' not found.`,
      });
    }

    const amountPaid = payment.amount > 0 ? payment.amount : invoice.balanceAmount;

    // 2. Reconcile Invoice Balances
    const previousBalance = invoice.balanceAmount;
    invoice.paidAmount = (invoice.paidAmount || 0) + amountPaid;
    invoice.balanceAmount = Math.max(0, invoice.originalAmount - invoice.paidAmount);
    invoice.lastPaymentAt = new Date();

    if (invoice.balanceAmount === 0) {
      invoice.paymentStatus = "PAID";
    } else {
      invoice.paymentStatus = "PARTIALLY_PAID";
    }

    invoice.notes = `${invoice.notes || ""}\n[Auto-Reconciled via ${payment.gateway}] Txn: ${payment.transactionId}, Method: ${payment.paymentMethod}, Amount: ₹${amountPaid}`.trim();
    await invoice.save();

    // 3. Update Customer Balance
    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      customer.totalPaid = (customer.totalPaid || 0) + amountPaid;
      customer.totalPending = Math.max(0, (customer.totalPending || 0) - amountPaid);
      await customer.save();
    }

    // 4. Resolve / Close any Active Payment Recovery Followups
    try {
      await CollectionFollowup.updateMany(
        { invoice: invoice._id, status: { $in: ["PENDING", "SENT"] } },
        { status: "RESOLVED", notes: `Payment received via ${payment.gateway} (${payment.transactionId}).` }
      );
    } catch (followErr) {}

    // 5. Generate Payment Receipt Communication Record
    let receiptComm = null;
    try {
      receiptComm = await Communication.create({
        recipientType: "Customer",
        recipientId: invoice.customer,
        recipientName: customer ? customer.name : "Client",
        channel: "WhatsApp",
        direction: "Outbound",
        status: "Sent",
        subject: `Payment Received: Invoice ${invoice.invoiceNumber}`,
        content: `Hi ${customer ? customer.name : "Client"}, we have successfully received your payment of ₹${amountPaid.toLocaleString("en-IN")} for Invoice ${invoice.invoiceNumber}. Thank you for your partnership!`,
        metadata: {
          autoTriggered: true,
          trigger: "PAYMENT_RECEIPT_AUTOREPLY",
          transactionId: payment.transactionId,
        },
      });
    } catch (commErr) {}

    // 6. Audit Trail
    try {
      await AuditLog.create({
        actorType: "AI Agent",
        actorName: "Autonomous Payment Reconciliation Engine",
        action: "INVOICE_PAYMENT_RECONCILED",
        entityType: "Invoice",
        entityId: invoice._id,
        details: `Reconciled ₹${amountPaid} for invoice ${invoice.invoiceNumber}. Status: ${invoice.paymentStatus}. Customer balance updated.`,
      });
    } catch (auditErr) {}

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${amountPaid} successfully reconciled for invoice ${invoice.invoiceNumber}.`,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        originalAmount: invoice.originalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        paymentStatus: invoice.paymentStatus,
        transactionId: payment.transactionId,
        customerTotalPending: customer ? customer.totalPending : 0,
      },
    });
  } catch (error) {
    console.error("[Payment Webhook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reconcile payment webhook.",
      error: error.message,
    });
  }
};
