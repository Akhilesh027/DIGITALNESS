/**
 * paymentRoutes.js
 * Comprehensive Payment Management, Manual Payment Recording & Reconciliation
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");
const Communication = require("../models/Communication");
const { protect } = require("../middleware/authMiddleware");

// Ensure receipts directory exists
const receiptDir = path.join(__dirname, "../uploads/receipts");
if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, receiptDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// GET all payments with optional filtering
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};

    // Filter by customer if passed
    if (req.query.customerId || req.query.customer) {
      filter.customer = req.query.customerId || req.query.customer;
    }

    // Filter by invoice if passed
    if (req.query.invoiceId || req.query.invoice) {
      filter.invoice = req.query.invoiceId || req.query.invoice;
    }

    // Filter by status if passed
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Client scope enforcement
    if (req.client) {
      let clientCustomerId = req.client.customerId?._id || req.client.customerId || req.client.customer;
      if (!clientCustomerId) {
        const cust = await Customer.findOne({
          $or: [
            { userId: req.client._id },
            { email: req.client.email },
            { clientLoginId: req.client._id },
          ],
        });
        if (cust) clientCustomerId = cust._id;
      }
      if (clientCustomerId) {
        filter.customer = clientCustomerId;
      }
    }

    const payments = await Payment.find(filter)
      .populate("customer", "name companyName email contactNumbers")
      .populate("invoice", "invoiceNumber originalAmount paidAmount balanceAmount paymentStatus documentUrl documentName")
      .populate("recordedBy", "name email role")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("[Payments GET Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET payments for a specific customer
router.get("/customer/:customerId", protect, async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await Payment.find({ customer: customerId })
      .populate("customer", "name companyName email contactNumbers")
      .populate("invoice", "invoiceNumber originalAmount paidAmount balanceAmount paymentStatus documentUrl documentName")
      .populate("recordedBy", "name email role")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("[Payments Customer GET Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET single payment by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("customer", "name companyName email contactNumbers")
      .populate("invoice", "invoiceNumber originalAmount paidAmount balanceAmount paymentStatus documentUrl documentName")
      .populate("recordedBy", "name email role");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Record Manual Payment (supports document/receipt attachment)
router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) console.warn("Receipt upload notice:", err.message);
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        customerId,
        customer,
        invoiceId,
        invoice,
        amount,
        paidAmount,
        date,
        paymentDate,
        method,
        reference,
        referenceId,
        status,
        notes,
        receiptUrl,
        receiptName,
      } = req.body;

      let resolvedCustomerId = customerId || customer;
      if (!resolvedCustomerId && req.client) {
        resolvedCustomerId = req.client.customerId?._id || req.client.customerId || req.client.customer;
      }

      const numAmount = Number(amount || paidAmount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid payment amount greater than 0 is required.",
        });
      }

      // Verify Customer exists
      let customerDoc = null;
      if (resolvedCustomerId) {
        try {
          customerDoc = await Customer.findById(resolvedCustomerId);
        } catch (e) {}
      }

      if (!customerDoc && req.client) {
        customerDoc = await Customer.findOne({
          $or: [
            { userId: req.client._id },
            { email: req.client.email },
            { clientLoginId: req.client._id },
            { _id: req.client.customerId },
          ],
        });
        if (customerDoc) {
          resolvedCustomerId = customerDoc._id;
        }
      }

      if (!resolvedCustomerId || !customerDoc) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required to record a payment.",
        });
      }

      const resolvedDate = date || paymentDate || new Date();
      const resolvedMethod = method || "UPI";
      const resolvedRef = reference || referenceId || `REC-${Date.now().toString().slice(-6)}`;
      const resolvedInvoiceId = invoiceId || invoice || null;
      const isClientRole = Boolean(req.client || req.user?.role === "Client");
      const resolvedStatus = status || (isClientRole ? "Pending" : "Completed");

      let uploadedReceiptUrl = receiptUrl || "";
      let uploadedReceiptName = receiptName || "";
      if (req.file) {
        uploadedReceiptUrl = `/uploads/receipts/${req.file.filename}`;
        uploadedReceiptName = req.file.originalname;
      }

      // 1. Create Payment Record
      const newPayment = await Payment.create({
        customer: resolvedCustomerId,
        invoice: resolvedInvoiceId || undefined,
        amount: numAmount,
        paidAmount: numAmount,
        date: resolvedDate,
        paymentDate: resolvedDate,
        method: resolvedMethod,
        reference: resolvedRef,
        referenceId: resolvedRef,
        status: resolvedStatus,
        notes: notes || "",
        receiptUrl: uploadedReceiptUrl,
        receiptName: uploadedReceiptName,
        recordedBy: req.user?._id || null,
      });

      // 2. Reconcile with Invoice if specified or find open invoice
      let updatedInvoice = null;
      if (resolvedInvoiceId) {
        updatedInvoice = await Invoice.findById(resolvedInvoiceId);
      } else {
        // Find oldest unpaid invoice for this customer
        updatedInvoice = await Invoice.findOne({
          customer: resolvedCustomerId,
          paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
        }).sort({ createdAt: 1 });
      }

      if (updatedInvoice && resolvedStatus === "Completed") {
        updatedInvoice.paidAmount = (updatedInvoice.paidAmount || 0) + numAmount;
        updatedInvoice.balanceAmount = Math.max(0, updatedInvoice.originalAmount - updatedInvoice.paidAmount);
        updatedInvoice.lastPaymentAt = resolvedDate;

        if (updatedInvoice.balanceAmount === 0) {
          updatedInvoice.paymentStatus = "PAID";
        } else {
          updatedInvoice.paymentStatus = "PARTIALLY_PAID";
        }

        const noteEntry = `[Manual Payment] ₹${numAmount} via ${resolvedMethod} (Ref: ${resolvedRef})`;
        updatedInvoice.notes = updatedInvoice.notes
          ? `${updatedInvoice.notes}\n${noteEntry}`
          : noteEntry;

        // If invoice doesn't have an uploaded document yet, copy receipt
        if (!updatedInvoice.documentUrl && uploadedReceiptUrl) {
          updatedInvoice.documentUrl = uploadedReceiptUrl;
          updatedInvoice.documentName = uploadedReceiptName;
        }

        await updatedInvoice.save();

        if (!newPayment.invoice) {
          newPayment.invoice = updatedInvoice._id;
          await newPayment.save();
        }
      }

      // 3. Update Customer's totalPaid & totalPending balances
      if (resolvedStatus === "Completed") {
        customerDoc.totalPaid = (customerDoc.totalPaid || 0) + numAmount;
        customerDoc.totalPending = Math.max(0, (customerDoc.totalPending || 0) - numAmount);
        await customerDoc.save();
      }

      // 4. Audit Log
      try {
        await AuditLog.create({
          actorType: req.user?.role && ["Admin", "Manager", "Operational Manager", "Branch Manager", "Account Executive", "Employee"].includes(req.user.role)
            ? req.user.role
            : "Admin",
          actorId: req.user?._id || null,
          actorName: req.user?.name || "CRM Administrator",
          action: "MANUAL_PAYMENT_RECORDED",
          entityType: "Payment",
          entityId: newPayment._id,
          details: `Recorded manual payment of ₹${numAmount.toLocaleString("en-IN")} via ${resolvedMethod} (Ref: ${resolvedRef}) for customer ${customerDoc.name}.`,
        });
      } catch (auditErr) {
        console.warn("Audit log creation warning:", auditErr.message);
      }

      // 5. Automated or Custom Receipt & Confirmation Alert Communication
      let createdAlert = null;
      const shouldSendAlert = req.body.sendAlert !== false && req.body.sendAlert !== "false";
      if (shouldSendAlert) {
        try {
          const targetChannel = req.body.alertChannel || "WhatsApp";
          const targetPhone = customerDoc.contactNumbers?.[0] || customerDoc.phone || "";
          const targetEmail = customerDoc.email || "";
          const remainingBalance = Math.max(0, Number(customerDoc.totalPending || 0));

          const defaultMsg = `Dear ${customerDoc.name},\n\nWe have successfully received and verified your payment of ₹${numAmount.toLocaleString("en-IN")} via ${resolvedMethod} (Reference: ${resolvedRef}).${updatedInvoice ? ` Linked to Invoice ${updatedInvoice.invoiceNumber}.` : ""}${remainingBalance > 0 ? ` Your remaining balance due is ₹${remainingBalance.toLocaleString("en-IN")}.` : " All outstanding dues are now fully cleared!"}\n\nThank you for choosing Digitalness!\n- Finance Team`;
          const finalMsg = (req.body.alertMessage && String(req.body.alertMessage).trim()) || defaultMsg;

          createdAlert = await Communication.create({
            customerId: customerDoc._id,
            recipientType: "Customer",
            recipientId: customerDoc._id,
            recipientName: customerDoc.name,
            channel: targetChannel,
            direction: "Outbound",
            status: "Sent",
            subject: `Payment Confirmed: ₹${numAmount.toLocaleString("en-IN")} Received`,
            message: finalMsg,
            content: finalMsg,
            by: req.user?._id || null,
            byName: req.user?.name || "Finance Admin",
            metadata: {
              autoTriggered: false,
              trigger: "PAYMENT_CONFIRMATION_ALERT",
              paymentId: newPayment._id,
              paymentReference: resolvedRef,
              amount: numAmount,
              method: resolvedMethod,
              invoiceId: updatedInvoice?._id || null,
              invoiceNumber: updatedInvoice?.invoiceNumber || null,
              recipientPhone: targetPhone,
              recipientEmail: targetEmail,
              sentBy: req.user?.name || "Finance Admin",
            },
          });
        } catch (commErr) {
          console.warn("[Payment Alert Notice]:", commErr.message);
        }
      }

      const populatedPayment = await Payment.findById(newPayment._id)
        .populate("customer", "name companyName email contactNumbers")
        .populate("invoice", "invoiceNumber originalAmount paidAmount balanceAmount paymentStatus documentUrl documentName")
        .populate("recordedBy", "name email role");

      return res.status(201).json({
        success: true,
        message: createdAlert
          ? `Payment recorded and confirmation alert dispatched via ${createdAlert.channel}.`
          : "Payment successfully recorded and reconciled.",
        data: populatedPayment,
        payment: populatedPayment,
        invoice: updatedInvoice,
        alert: createdAlert,
      });

    } catch (error) {
      console.error("[Payments POST Error]:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

// SEND PAYMENT DUE ALERT TO CLIENT
router.post("/send-alert", protect, async (req, res) => {
  try {
    const {
      customerId,
      invoiceId,
      dueAmount,
      dueDate,
      channel,
      customMessage,
      recipientName,
      recipientPhone,
      recipientEmail,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.lastReminderAt = new Date();
        await invoice.save();
      }
    }

    const targetChannel = channel || "WhatsApp";
    const targetName = recipientName || customer.name || "Client";
    const targetPhone = recipientPhone || customer.contactNumbers?.[0] || customer.phone || "";
    const targetEmail = recipientEmail || customer.email || "";

    const messageContent =
      customMessage && customMessage.trim()
        ? customMessage.trim()
        : `Dear ${targetName}, gentle reminder that your payment of ₹${Number(dueAmount || customer.totalPending || 0).toLocaleString("en-IN")}${invoice ? ` (Invoice ${invoice.invoiceNumber})` : ""} is due on ${dueDate || "schedule"}. Kindly clear the dues. Thank you! - Digitalness Media`;

    const commRecord = await Communication.create({
      customerId: customer._id,
      recipientType: "Customer",
      recipientId: customer._id,
      recipientName: targetName,
      channel: targetChannel,
      direction: "Outbound",
      status: "Sent",
      subject: `Payment Due Alert: ₹${Number(dueAmount || 0).toLocaleString("en-IN")}`,
      message: messageContent,
      content: messageContent,
      by: req.user?._id || null,
      byName: req.user?.name || "Finance Admin",
      metadata: {
        autoTriggered: false,
        trigger: "MANUAL_PAYMENT_DUE_ALERT",
        invoiceId: invoice?._id || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        dueAmount: Number(dueAmount || customer.totalPending || 0),
        dueDate: dueDate || null,
        recipientPhone: targetPhone,
        recipientEmail: targetEmail,
        sentBy: req.user?.name || "Admin",
      },
    });

    try {
      await AuditLog.create({
        actorType: req.user?.role || "Admin",
        actorId: req.user?._id || null,
        actorName: req.user?.name || "Admin",
        action: "PAYMENT_DUE_ALERT_SENT",
        entityType: "Communication",
        entityId: commRecord._id,
        details: `Sent payment due alert to ${targetName} via ${targetChannel} (Due: ₹${Number(dueAmount || 0).toLocaleString("en-IN")}).`,
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Payment due alert sent via ${targetChannel} to ${targetName}.`,
      data: commRecord,
    });
  } catch (error) {
    console.error("[Send Payment Alert Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE a payment record
router.delete("/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status === "Completed") {
      const customer = await Customer.findById(payment.customer);
      if (customer) {
        customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - payment.amount);
        customer.totalPending = (customer.totalPending || 0) + payment.amount;
        await customer.save();
      }

      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
          invoice.balanceAmount = Math.min(invoice.originalAmount, invoice.balanceAmount + payment.amount);
          invoice.paymentStatus = invoice.paidAmount === 0 ? "UNPAID" : "PARTIALLY_PAID";
          await invoice.save();
        }
      }
    }

    await Payment.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Payment record deleted and balances adjusted.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// VERIFY & RECONCILE A MANUAL PAYMENT (Admin review)
router.patch("/:id/verify", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status === "Completed") {
      return res.status(400).json({ success: false, message: "Payment has already been verified and completed." });
    }

    payment.status = "Completed";
    payment.notes = payment.notes
      ? `${payment.notes}\n[Verified by Admin on ${new Date().toLocaleDateString("en-IN")}]`
      : `[Verified by Admin on ${new Date().toLocaleDateString("en-IN")}]`;
    await payment.save();

    const numAmount = Number(payment.amount || payment.paidAmount || 0);

    // Reconcile with Invoice
    let updatedInvoice = null;
    if (payment.invoice) {
      updatedInvoice = await Invoice.findById(payment.invoice);
    } else {
      updatedInvoice = await Invoice.findOne({
        customer: payment.customer,
        paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
      }).sort({ createdAt: 1 });
    }

    if (updatedInvoice) {
      updatedInvoice.paidAmount = (updatedInvoice.paidAmount || 0) + numAmount;
      updatedInvoice.balanceAmount = Math.max(0, updatedInvoice.originalAmount - updatedInvoice.paidAmount);
      updatedInvoice.lastPaymentAt = new Date();

      if (updatedInvoice.balanceAmount === 0) {
        updatedInvoice.paymentStatus = "PAID";
      } else {
        updatedInvoice.paymentStatus = "PARTIALLY_PAID";
      }

      const noteEntry = `[Admin Verified] ₹${numAmount} via ${payment.method} (Ref: ${payment.reference || "N/A"})`;
      updatedInvoice.notes = updatedInvoice.notes
        ? `${updatedInvoice.notes}\n${noteEntry}`
        : noteEntry;

      if (!updatedInvoice.documentUrl && payment.receiptUrl) {
        updatedInvoice.documentUrl = payment.receiptUrl;
        updatedInvoice.documentName = payment.receiptName;
      }

      await updatedInvoice.save();

      if (!payment.invoice) {
        payment.invoice = updatedInvoice._id;
        await payment.save();
      }
    }

    // Reconcile customer totals
    const customerDoc = await Customer.findById(payment.customer);
    if (customerDoc) {
      customerDoc.totalPaid = (customerDoc.totalPaid || 0) + numAmount;
      customerDoc.totalPending = Math.max(0, (customerDoc.totalPending || 0) - numAmount);
      await customerDoc.save();
    }

    // Audit log
    try {
      await AuditLog.create({
        actorType: req.user?.role || "Admin",
        actorId: req.user?._id || null,
        actorName: req.user?.name || "Admin",
        action: "MANUAL_PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: payment._id,
        details: `Verified manual payment of ₹${numAmount.toLocaleString("en-IN")} (Ref: ${payment.reference}) for ${customerDoc?.name || "Customer"}.`,
      });
    } catch (e) {}

    // Send confirmation alert
    try {
      if (customerDoc) {
        const remainingBal = Math.max(0, Number(customerDoc.totalPending || 0));
        const confirmMsg = `Dear ${customerDoc.name},\n\nYour payment of ₹${numAmount.toLocaleString("en-IN")} via ${payment.method} (Ref: ${payment.reference}) has been verified and approved.${updatedInvoice ? ` Linked to Invoice ${updatedInvoice.invoiceNumber}.` : ""}${remainingBal > 0 ? ` Remaining balance: ₹${remainingBal.toLocaleString("en-IN")}.` : " All outstanding dues are cleared!"}\n\nThank you!\n- Digitalness Finance`;

        await Communication.create({
          customerId: customerDoc._id,
          recipientType: "Customer",
          recipientId: customerDoc._id,
          recipientName: customerDoc.name,
          channel: "WhatsApp",
          direction: "Outbound",
          status: "Sent",
          subject: `Payment Verified: ₹${numAmount.toLocaleString("en-IN")}`,
          message: confirmMsg,
          content: confirmMsg,
          by: req.user?._id || null,
          byName: req.user?.name || "Finance Admin",
        });
      }
    } catch (e) {}

    const populatedPayment = await Payment.findById(payment._id)
      .populate("customer", "name companyName email contactNumbers")
      .populate("invoice", "invoiceNumber originalAmount paidAmount balanceAmount paymentStatus documentUrl documentName")
      .populate("recordedBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and reconciled with invoice.",
      data: populatedPayment,
      payment: populatedPayment,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("[Payment Verify Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// REJECT A SUBMITTED MANUAL PAYMENT
router.patch("/:id/reject", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const { reason } = req.body;
    payment.status = "Rejected";
    payment.notes = payment.notes
      ? `${payment.notes}\n[Rejected by Admin: ${reason || "Invalid proof or reference"}]`
      : `[Rejected by Admin: ${reason || "Invalid proof or reference"}]`;
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment marked as rejected.",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
