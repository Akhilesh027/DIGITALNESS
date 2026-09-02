const Expense = require("../models/Expense");

// @desc    Get all agency expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { branchId, category } = req.query;
    const query = {};
    if (branchId) query.branchId = branchId;
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ expenseDate: -1 }).lean();
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new agency expense
// @route   POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const { category, description, amount, expenseDate, paymentMethod, referenceNumber } = req.body;
    if (!category || !description || !amount) {
      return res.status(400).json({ success: false, message: "Category, description, and amount are required." });
    }

    const branchId = req.user?.branchId || "BR001";
    const expense = await Expense.create({
      branchId,
      category,
      description,
      amount: Number(amount),
      expenseDate: expenseDate || new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      referenceNumber: referenceNumber || "",
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete/Deactivate expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }
    res.status(200).json({ success: true, message: "Expense record deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
