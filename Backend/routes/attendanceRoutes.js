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

router.get("/my", getMyAttendance);

router.get(
  "/today",
  authorize("Admin", "Operational Manager"),
  getTodayAttendance
);

router.get(
  "/stats",
  authorize("Admin", "Operational Manager"),
  getAttendanceStats
);

router.get(
  "/",
  authorize("Admin", "Operational Manager"),
  getAllAttendance
);

module.exports = router;