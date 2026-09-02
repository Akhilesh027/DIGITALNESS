const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const { getAuditLogs } = require("../controllers/auditLogController");

router.use(protect);
router.get("/", authorize("Admin", "Operational Manager"), getAuditLogs);

module.exports = router;
