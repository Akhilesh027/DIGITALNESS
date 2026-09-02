const express = require("express");
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  addCallLog,
  pushToPipeline,
  convertLeadToCustomer,
} = require("../controllers/leadController.js");
const { handleInboundWebhook } = require("../controllers/leadWebhookController.js");
const verifyMetaWebhookSignature = require("../middleware/webhooks/verifyMetaWebhookSignature.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public Webhook for Meta Ads, WhatsApp, Google Ads & Website Lead Capture
router.get("/webhook/inbound", verifyMetaWebhookSignature);
router.post("/webhook/inbound", verifyMetaWebhookSignature, handleInboundWebhook);

const allowAdminManager = (req, res, next) => {
  if (!["Admin", "Operational Manager"].includes(req.user?.role)) {
    return res.status(403).json({
      message: "Access denied. Only Admin and Operational Manager allowed.",
    });
  }

  next();
};

router.post("/", protect, allowAdminManager, createLead);

router.get("/", protect, getLeads);
router.get("/:id", protect, getLeadById);

router.patch("/:id", protect, allowAdminManager, updateLead);
router.delete("/:id", protect, allowAdminManager, deleteLead);

router.patch("/:id/assign", protect, allowAdminManager, assignLead);

router.post("/:id/call-log", protect, addCallLog);

router.post("/:id/push-to-pipeline", protect, allowAdminManager, pushToPipeline);

router.post("/:id/convert", protect, allowAdminManager, convertLeadToCustomer);

module.exports = router;