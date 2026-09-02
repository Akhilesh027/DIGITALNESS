const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const {
  getScheduledJobs,
  cancelJob,
  retryJob,
  getQueueHealth,
  reconcileQueue,
  createOrUpdateSchedule,
} = require("../controllers/scheduledJobController");

router.use(protect);

router.get("/health", getQueueHealth);
router.post("/reconcile", authorize("Admin", "Operational Manager"), reconcileQueue);
router.post("/update-slot", createOrUpdateSchedule);
router.get("/", authorize("Admin", "Operational Manager", "Branch Manager"), getScheduledJobs);
router.post("/:id/cancel", authorize("Admin", "Operational Manager", "Branch Manager"), cancelJob);
router.post("/:id/retry", authorize("Admin", "Operational Manager", "Branch Manager"), retryJob);

module.exports = router;
