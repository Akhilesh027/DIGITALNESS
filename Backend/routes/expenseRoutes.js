const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getExpenses, createExpense, deleteExpense } = require("../controllers/expenseController");

router.use(protect);

router.get("/", getExpenses);
router.post("/", createExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
