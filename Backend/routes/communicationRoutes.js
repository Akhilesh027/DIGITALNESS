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

// Alerts endpoint for client web and crm
const Communication = require("../models/Communication");
const Customer = require("../models/Customer");

router.get("/alerts", async (req, res) => {
  try {
    let customerId = req.query.customerId || req.query.customer;
    if (!customerId && req.client) {
      customerId = req.client.customerId?._id || req.client.customerId || req.client.customer;
      if (!customerId) {
        const cust = await Customer.findOne({
          $or: [
            { userId: req.client._id },
            { email: req.client.email },
            { clientLoginId: req.client._id },
          ],
        });
        if (cust) customerId = cust._id;
      }
    }

    const filter = {};
    if (customerId) filter.customerId = customerId;

    const alerts = await Communication.find(filter)
      .sort({ createdAt: -1 })
      .populate("by", "name email role");

    return res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;