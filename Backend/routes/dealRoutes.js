const express = require("express");
const {
  getDeals,
  createDeal,
  updateDeal,
  moveDealStage,
  addDealCallLog,
  deleteDeal,
} = require("../controllers/dealController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDeals);
router.post("/", protect, createDeal);
router.put("/:id", protect, updateDeal);
router.patch("/:id/stage", protect, moveDealStage);
router.post("/:id/call-log", protect, addDealCallLog);
router.delete("/:id", protect, deleteDeal);

module.exports = router;