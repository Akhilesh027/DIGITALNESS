const express = require("express");
const router = express.Router();

const {
  submitDailyUpdate,
  getAllUpdates,
  getMyUpdates,
  getCalendarUpdates,
  getDailyUpdateStats,
  getEmployeeProductivity,
  sendReminder,
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  reviewDailyUpdate,
  deleteDailyUpdate,
} = require("../controllers/dailyUpdateController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole.js");
const upload = require("../middleware/uploadMiddleware.js");

router.use(protect);

router.post("/", upload.array("attachments", 10), submitDailyUpdate);

router.get("/my", getMyUpdates);

router.get(
  "/calendar",
  authorize("Admin", "Operational Manager"),
  getCalendarUpdates
);

router.get(
  "/stats",
  authorize("Admin", "Operational Manager"),
  getDailyUpdateStats
);

router.get(
  "/productivity",
  authorize("Admin", "Operational Manager"),
  getEmployeeProductivity
);

router.post(
  "/reminder/:employeeId",
  authorize("Admin", "Operational Manager"),
  sendReminder
);

router.get(
  "/report/daily/:employeeId",
  authorize("Admin", "Operational Manager"),
  generateDailyReport
);

router.get(
  "/report/weekly/:employeeId",
  authorize("Admin", "Operational Manager"),
  generateWeeklyReport
);

router.get(
  "/report/monthly/:employeeId",
  authorize("Admin", "Operational Manager"),
  generateMonthlyReport
);

router.get(
  "/",
  authorize("Admin", "Operational Manager"),
  getAllUpdates
);

router.put(
  "/:id/review",
  authorize("Admin", "Operational Manager"),
  reviewDailyUpdate
);

router.delete("/:id", authorize("Admin"), deleteDailyUpdate);

module.exports = router;