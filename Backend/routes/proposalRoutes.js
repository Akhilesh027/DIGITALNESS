const express = require("express");
const router = express.Router();

const {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
  configureProposalBilling,
  sendProposalMail,
  getProposalAnalytics,
  createProposalVersion,
  addProposalAttachment,
  deleteProposalAttachment,
} = require("../controllers/proposalController.js");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect } = require("../middleware/authMiddleware");

// Ensure proposals upload directory exists
const uploadDir = path.join(__dirname, "../uploads/proposals");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `proposal-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

router.use(protect);

// Upload document endpoint
router.post("/upload-document", upload.single("document"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No document file uploaded" });
  }
  const fileUrl = `/uploads/proposals/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    size: req.file.size,
  });
});

router.route("/")
  .get(getProposals)
  .post(upload.single("document"), createProposal);

router.get("/analytics/summary", getProposalAnalytics);

router.patch("/:id/status", updateProposalStatus);
router.post("/:id/configure-billing", configureProposalBilling);
router.patch("/:id/configure-billing", configureProposalBilling);
router.post("/:id/send-mail", sendProposalMail);
router.post("/:id/version", createProposalVersion);
router.post("/:id/attachments", addProposalAttachment);
router.delete("/:id/attachments/:attachmentIndex", deleteProposalAttachment);

router.route("/:id")
  .get(getProposalById)
  .put(updateProposal)
  .delete(deleteProposal);

module.exports = router;