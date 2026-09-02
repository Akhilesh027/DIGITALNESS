const express = require("express");
const router = express.Router();

const {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
  sendProposalMail,
  getProposalAnalytics,
  createProposalVersion,
  addProposalAttachment,
  deleteProposalAttachment,
} = require("../controllers/proposalController.js");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getProposals)
  .post(createProposal);

router.get("/analytics/summary", getProposalAnalytics);

router.patch("/:id/status", updateProposalStatus);
router.post("/:id/send-mail", sendProposalMail);
router.post("/:id/version", createProposalVersion);
router.post("/:id/attachments", addProposalAttachment);
router.delete("/:id/attachments/:attachmentIndex", deleteProposalAttachment);

router.route("/:id")
  .get(getProposalById)
  .put(updateProposal)
  .delete(deleteProposal);

module.exports = router;