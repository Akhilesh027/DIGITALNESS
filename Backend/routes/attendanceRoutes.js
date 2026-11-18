const express = require("express");
const router = express.Router();

const {
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  getAttendanceStats,
} = require("../controllers/attendanceController.js");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");

router.use(protect);
router.use(require('./manualAttendanceRoutes'));

router.get("/my", getMyAttendance);

router.get(
  "/today",
  authorize("Admin", "admin", "Operational Manager", "Branch Manager"),
  getTodayAttendance
);

router.get(
  "/stats",
  authorize("Admin", "admin", "Operational Manager", "Branch Manager"),
  getAttendanceStats
);

router.get(
  "/",
  authorize("Admin", "admin", "Operational Manager", "Branch Manager"),
  getAllAttendance
);

module.exports = router;
