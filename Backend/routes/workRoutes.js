const express = require("express");
const router = express.Router();

const {
  createWork,
  getAllWorks,
  getEmployeeWorks,
  getCustomerWorks,
  updateWorkStatus,
  deleteWork,
  updateWork,
  assignWork,
  addWorkUpdate,
  addWorkComment,
  addWorkAttachment,
  deleteWorkAttachment,
  getWorkAnalytics,
  approveWork,
  revisionWork,
} = require("../controllers/workController.js");

const { protect } = require("../middleware/authMiddleware.js");

router.use(protect);

// Analytics
router.get("/analytics/summary", getWorkAnalytics);

// Create / Get all works
router.route("/")
  .get(getAllWorks)
  .post(createWork);

// Customer works
router.get("/customer/:customerId", getCustomerWorks);

// Employee works
router.get("/employee/:employeeId", getEmployeeWorks);

// Work update / daily progress
router.post("/:id/update", addWorkUpdate);

// Comments
router.post("/:id/comments", addWorkComment);

// Attachments
router.post("/:id/attachments", addWorkAttachment);
router.delete("/:id/attachments/:attachmentIndex", deleteWorkAttachment);

// Status update / review / approval / revision
router.put("/:id/status", updateWorkStatus);
router.put("/:id/approve", approveWork);
router.put("/:id/revision", revisionWork);

// Assign / reassign work
router.put("/:id/assign", assignWork);

// Update / delete work
router.route("/:id")
  .put(updateWork)
  .delete(deleteWork);

module.exports = router;