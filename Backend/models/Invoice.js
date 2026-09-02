const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "DISPUTED"],
      default: "UNPAID",
      index: true,
    },
    items: [invoiceItemSchema],
    lastPaymentAt: {
      type: Date,
      default: null,
    },
    lastReminderAt: {
      type: Date,
      default: null,
    },
    disputeReason: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook: automatically sync balanceAmount and paymentStatus
invoiceSchema.pre("save", function (next) {
  this.balanceAmount = Math.max(0, this.originalAmount - (this.paidAmount || 0));

  if (this.paymentStatus !== "DISPUTED" && this.paymentStatus !== "CANCELLED") {
    if (this.balanceAmount === 0) {
      this.paymentStatus = "PAID";
    } else if (this.paidAmount > 0 && this.balanceAmount > 0) {
      this.paymentStatus = "PARTIALLY_PAID";
    } else if (this.dueDate && new Date() > new Date(this.dueDate)) {
      this.paymentStatus = "OVERDUE";
    } else {
      this.paymentStatus = "UNPAID";
    }
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
