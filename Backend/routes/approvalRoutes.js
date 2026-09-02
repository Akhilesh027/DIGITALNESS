const express = require("express");
const router = express.Router();

const {
  getApprovals,
  getApprovalById,
  createApproval,
  submitApproval,
  approveApproval,
  rejectApproval,
  requestChanges,
  cancelApproval,
  addVersion,
  getApprovalHistory,
} = require("../controllers/approvalController");

const { protect } = require("../middleware/authMiddleware");

// All approval operations require authentication
router.use(protect);

router.get("/", getApprovals);
router.post("/", createApproval);

router.get("/:id", getApprovalById);
router.get("/:id/history", getApprovalHistory);

router.post("/:id/submit", submitApproval);
router.post("/:id/approve", approveApproval);
router.post("/:id/reject", rejectApproval);
router.post("/:id/request-changes", requestChanges);
router.post("/:id/cancel", cancelApproval);
router.post("/:id/version", addVersion);

module.exports = router;
