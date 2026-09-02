/**
 * systemQueueRoutes.js
 * Queue and Background Worker Health Monitoring Routes
 */

const express = require("express");
const router = express.Router();
const QueueRegistry = require("../ai/queue/QueueRegistry");
const { protect } = require("../middleware/authMiddleware");

// Middleware to ensure only Admin / Manager can inspect queue system health
const allowAdminManager = (req, res, next) => {
  if (!["Admin", "Operational Manager", "Manager"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only Managers and Admins can access queue health metrics.",
    });
  }
  next();
};

/**
 * GET /api/system/queues/health
 * Returns real-time health metrics and job counters for all background queues
 */
router.get("/health", protect, allowAdminManager, async (req, res) => {
  try {
    const health = await QueueRegistry.getAllQueuesHealth();
    return res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
