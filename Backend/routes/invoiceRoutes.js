/**
 * invoiceRoutes.js
 * Invoices, Document Uploads, Automated Recurring Billing & Payment Due Alerts
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");
const Communication = require("../models/Communication");
const { protect } = require("../middleware/authMiddleware");
const recurringInvoiceService = require("../services/recurringInvoiceService");
const { handlePaymentWebhook } = require("../controllers/paymentWebhookController");
const verifyRazorpayWebhookSignature = require("../middleware/webhooks/verifyRazorpayWebhookSignature");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/invoices");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `invoice-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPEG, PNG, WEBP and DOC files are supported"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Public Webhook for Payment Gateways (Razorpay, Stripe, UPI, Bank transfers)
router.post("/webhook/payment", verifyRazorpayWebhookSignature, handlePaymentWebhook);

// Trigger Monthly Recurring Billing run
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
    if (req.query.customerId || req.query.customer) {
      filter.customer = req.query.customerId || req.query.customer;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

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

// CREATE manual invoice with optional document upload
router.post("/", protect, (req, res, next) => {
  upload.single("document")(req, res, (err) => {
    if (err) {
      // If multer error or file type error
      console.warn("Multer upload error:", err.message);
    }
    next();
  });
}, async (req, res) => {
  try {
    const {
      customerId,
      customer,
      invoiceNumber,
      amount,
      items,
      dueDate,
      notes,
      documentUrl,
      documentName,
    } = req.body;

    const resolvedCustomerId = customerId || customer;
    if (!resolvedCustomerId) {
      return res.status(400).json({ message: "Customer ID is required to create an invoice." });
    }

    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      } catch {
        parsedItems = [];
      }
    }

    const numAmount =
      Number(amount) ||
      (parsedItems.length > 0
        ? parsedItems.reduce((sum, i) => sum + (i.total || i.unitPrice * (i.quantity || 1)), 0)
        : 0);

    let uploadedDocUrl = documentUrl || "";
    let uploadedDocName = documentName || "";

    if (req.file) {
      uploadedDocUrl = `/uploads/invoices/${req.file.filename}`;
      uploadedDocName = req.file.originalname;
    }

    const generatedNumber = invoiceNumber && invoiceNumber.trim()
      ? invoiceNumber.trim()
      : `INV-${Date.now().toString().slice(-6)}`;

    const isPaid =
      req.body.paymentStatus === "PAID" ||
      req.body.paymentStatus === "Paid" ||
      req.body.isPaid === true ||
      req.body.isPaid === "true" ||
      Number(req.body.paidAmount) >= numAmount;

    const initialPaidAmount = isPaid
      ? numAmount
      : Number(req.body.paidAmount || 0);

    const initialBalance = Math.max(0, numAmount - initialPaidAmount);
    const resolvedPaymentStatus = initialBalance === 0 ? "PAID" : (initialPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID");

    const invoice = await Invoice.create({
      invoiceNumber: generatedNumber,
      customer: resolvedCustomerId,
      originalAmount: numAmount,
      paidAmount: initialPaidAmount,
      balanceAmount: initialBalance,
      paymentStatus: resolvedPaymentStatus,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items:
        parsedItems && parsedItems.length > 0
          ? parsedItems
          : [
              {
                description: notes || "Agency Retainer & Marketing Services",
                quantity: 1,
                unitPrice: numAmount,
                total: numAmount,
              },
            ],
      notes: notes || "",
      documentUrl: uploadedDocUrl,
      documentName: uploadedDocName,
      createdBy: req.user?._id || null,
    });

    // Update Customer's totalPaid and totalPending
    const customerDoc = await Customer.findById(resolvedCustomerId);
    if (customerDoc) {
      if (initialPaidAmount > 0) {
        customerDoc.totalPaid = (customerDoc.totalPaid || 0) + initialPaidAmount;
      }
      if (initialBalance > 0) {
        customerDoc.totalPending = (customerDoc.totalPending || 0) + initialBalance;
      }
      await customerDoc.save();
    }

    // Automatically record corresponding Payment ledger entry if invoice is paid
    if (initialPaidAmount > 0) {
      try {
        const Payment = require("../models/Payment");
        await Payment.create({
          customer: resolvedCustomerId,
          invoice: invoice._id,
          amount: initialPaidAmount,
          paidAmount: initialPaidAmount,
          date: new Date(),
          method: req.body.paymentMethod || "Bank Transfer",
          reference: req.body.reference || `REC-${Date.now().toString().slice(-6)}`,
          status: "Completed",
          notes: `Settlement recorded on invoice creation (${invoice.invoiceNumber})`,
          receiptUrl: uploadedDocUrl,
          receiptName: uploadedDocName,
          recordedBy: req.user?._id || null,
        });
      } catch (payErr) {
        console.warn("Auto payment record warning:", payErr.message);
      }
    }

    // Audit log
    try {
      await AuditLog.create({
        actorType: req.user?.role || "Admin",
        actorId: req.user?._id || null,
        actorName: req.user?.name || "System Admin",
        action: "INVOICE_CREATED",
        entityType: "Invoice",
        entityId: invoice._id,
        details: `Created invoice ${invoice.invoiceNumber} for ₹${numAmount.toLocaleString("en-IN")}${uploadedDocName ? ` with document (${uploadedDocName})` : ""}.`,
      });
    } catch (auditErr) {}

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customer", "name companyName email contactNumbers")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully with attached details.",
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("[Invoice Create Error]:", error);
    return res.status(500).json({ message: error.message });
  }
});

// SEND PAYMENT DUE ALERT / REMINDER TO CLIENT
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
      return res.status(400).json({ success: false, message: "Customer ID is required to send alert." });
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
        : `Hi ${targetName}, this is a gentle reminder that a payment of ₹${Number(dueAmount || customer.totalPending || 0).toLocaleString("en-IN")}${invoice ? ` for Invoice ${invoice.invoiceNumber}` : ""} is due on ${dueDate || "schedule"}. Kindly clear the balance to ensure uninterrupted services. Regards, Digitalness Media.`;

    const commRecord = await Communication.create({
      customerId: customer._id,
      recipientType: "Customer",
      recipientId: customer._id,
      recipientName: targetName,
      channel: targetChannel,
      direction: "Outbound",
      status: "Sent",
      subject: `Payment Reminder: ₹${Number(dueAmount || customer.totalPending || 0).toLocaleString("en-IN")} Due`,
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

    // Create Audit Log
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

// MARK INVOICE AS PAID & CLEARED
router.patch("/:id/mark-paid", protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const previousBalance = invoice.balanceAmount !== undefined
      ? invoice.balanceAmount
      : Math.max(0, invoice.originalAmount - (invoice.paidAmount || 0));
    const settleAmount = previousBalance > 0 ? previousBalance : invoice.originalAmount;

    invoice.paidAmount = invoice.originalAmount;
    invoice.balanceAmount = 0;
    invoice.paymentStatus = "PAID";
    invoice.lastPaymentAt = new Date();
    await invoice.save();

    // Update customer doc
    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      if (previousBalance > 0) {
        customer.totalPending = Math.max(0, (customer.totalPending || 0) - previousBalance);
        customer.totalPaid = (customer.totalPaid || 0) + previousBalance;
        await customer.save();
      }
    }

    // Auto-record payment ledger entry
    try {
      const Payment = require("../models/Payment");
      await Payment.create({
        customer: invoice.customer,
        invoice: invoice._id,
        amount: settleAmount,
        paidAmount: settleAmount,
        date: new Date(),
        method: req.body.method || "Bank Transfer",
        reference: req.body.reference || `SETTLE-${Date.now().toString().slice(-6)}`,
        status: "Completed",
        notes: `Settled and marked as Paid from Client Portal (${invoice.invoiceNumber})`,
        receiptUrl: invoice.documentUrl,
        receiptName: invoice.documentName,
        recordedBy: req.user?._id || null,
      });
    } catch (e) {
      console.warn("Payment entry warning on mark-paid:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} marked as fully paid and cleared.`,
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

