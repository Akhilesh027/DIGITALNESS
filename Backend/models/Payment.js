const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: function () {
        return this.amount;
      },
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: [
        "UPI",
        "Bank Transfer",
        "Cash",
        "Cheque",
        "Card",
        "Net Banking",
        "Razorpay",
        "Other",
      ],
      default: "UPI",
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    referenceId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Pending Verification", "Failed", "Refunded", "Rejected"],
      default: "Completed",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    receiptName: {
      type: String,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals to support both customerId and customer, reference and referenceId
paymentSchema.virtual("customerId").get(function () {
  return this.customer;
});

paymentSchema.virtual("invoiceId").get(function () {
  return this.invoice;
});

// Pre-save hook: sync reference and referenceId, date and paymentDate
paymentSchema.pre("save", function () {
  if (this.reference && !this.referenceId) {
    this.referenceId = this.reference;
  } else if (this.referenceId && !this.reference) {
    this.reference = this.referenceId;
  }

  if (this.date && !this.paymentDate) {
    this.paymentDate = this.date;
  } else if (this.paymentDate && !this.date) {
    this.date = this.paymentDate;
  }

  if (!this.paidAmount && this.amount) {
    this.paidAmount = this.amount;
  }
});

let PaymentModel;
try {
  PaymentModel = mongoose.model("Payment");
} catch (e) {
  PaymentModel = mongoose.model("Payment", paymentSchema);
}

module.exports = PaymentModel;
