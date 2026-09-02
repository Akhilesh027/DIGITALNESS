// routes/communicationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCustomerCommunications,
  createCustomerCommunication,
  getEmployeeCommunications,
  createEmployeeCommunication,
  createCommunication,
} = require("../controllers/communicationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// Customer endpoints
router.get("/customers/:customerId/communications", getCustomerCommunications);
router.post("/customers/:customerId/communications", createCustomerCommunication);

// Employee endpoints
router.get("/employees/:employeeId/communications", getEmployeeCommunications);
router.post("/employees/:employeeId/communications", createEmployeeCommunication);

// Legacy (optional)
router.get("/customer/:customerId", getCustomerCommunications);
router.post("/", createCommunication);

module.exports = router;