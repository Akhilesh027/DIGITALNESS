const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    branchId: {
      type: String,
      default: "BR001",
      index: true,
    },
    category: {
      type: String,
      enum: ["Software & Tools", "Office Rent", "Salaries & Payroll", "Marketing & Ads", "Utilities", "Travel", "Misc"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "UPI", "Credit Card", "Cash", "Corporate Account"],
      default: "Bank Transfer",
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Approved", "Pending Review", "Rejected"],
      default: "Approved",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
