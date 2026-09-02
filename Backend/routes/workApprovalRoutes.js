const express = require("express");

const router = express.Router();

const {
  getApprovals,
  getApprovalById,
  reviewApproval,
  approveWorkApproval,
  requestRevisionApproval,
  rejectWorkApproval,
  getApprovalStats,
} = require("../controllers/workApprovalController.js");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getApprovals);
router.get("/stats/summary", getApprovalStats);

router.get("/:id", getApprovalById);

router.put("/:id/review", reviewApproval);
router.put("/:id/approve", approveWorkApproval);
router.put("/:id/revision", requestRevisionApproval);
router.put("/:id/reject", rejectWorkApproval);

module.exports = router;