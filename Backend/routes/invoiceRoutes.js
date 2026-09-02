/**
 * invoiceRoutes.js
 * Invoices, Automated Recurring Billing & Payment Gateway Webhook routes.
 */

const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const { protect } = require("../middleware/authMiddleware");
const recurringInvoiceService = require("../services/recurringInvoiceService");
const { handlePaymentWebhook } = require("../controllers/paymentWebhookController");
const verifyRazorpayWebhookSignature = require("../middleware/webhooks/verifyRazorpayWebhookSignature");

// Public Webhook for Payment Gateways (Razorpay, Stripe, UPI, Bank transfers)
router.post("/webhook/payment", verifyRazorpayWebhookSignature, handlePaymentWebhook);

// Trigger Monthly Recurring Billing run (Admin/Manager or Scheduled Cron)
router.post("/recurring/trigger", protect, async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await recurringInvoiceService.generateMonthlyRecurringInvoices({
      month,
      year,
      createdBy: req.user?._id,
    });
    return res.status(200).json({
      success: true,
      message: `Recurring billing run completed for ${result.period}.`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET all invoices
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.customerId) {
      filter.customer = req.query.customerId;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "name companyName email contactNumbers")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(invoices);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET single invoice
router.get("/:id", protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer", "name companyName email contactNumbers address")
      .populate("createdBy", "name email role");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CREATE manual invoice
router.post("/", protect, async (req, res) => {
  try {
    const { customerId, amount, items, dueDate, notes } = req.body;
    const numAmount = Number(amount) || (items ? items.reduce((sum, i) => sum + (i.total || i.rate * (i.quantity || 1)), 0) : 0);

    const invoice = await Invoice.create({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customer: customerId,
      originalAmount: numAmount,
      paidAmount: 0,
      balanceAmount: numAmount,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: items && items.length > 0 ? items : [{ description: "Agency Marketing Services", quantity: 1, unitPrice: numAmount, total: numAmount }],
      notes: notes || "",
      createdBy: req.user?._id,
    });

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
