const express = require("express");
const router = express.Router();

const {
  getCustomerDashboardReport,
  getCustomerProjectsReport,
  getCustomerDailyReport,
  getCustomerMonthlyReport,
  getCustomerEmployeeReport,
  getCustomerPaymentReport,
  getCustomerFullReport,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/customer/:customerId/dashboard", getCustomerDashboardReport);
router.get("/customer/:customerId/projects", getCustomerProjectsReport);
router.get("/customer/:customerId/daily", getCustomerDailyReport);
router.get("/customer/:customerId/monthly", getCustomerMonthlyReport);
router.get("/customer/:customerId/employees", getCustomerEmployeeReport);
router.get("/customer/:customerId/payments", getCustomerPaymentReport);
router.get("/customer/:customerId/pdf", getCustomerFullReport);

module.exports = router;