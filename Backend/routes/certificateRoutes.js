const express = require("express");
const router = express.Router();

const {
  getCertificates,
  getCertificateById,
  verifyCertificatePublic,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  toggleCertificateStatus,
} = require("../controllers/certificateController");

const { protect } = require("../middleware/authMiddleware");
const certificateUpload = require("../middleware/certificateUpload");

// Public verification route (accessible by candidates, HR, employers, website)
router.get("/verify/:certificateId", verifyCertificatePublic);

// Admin / Manager protected routes
router.get("/", protect, getCertificates);
router.post("/", protect, certificateUpload.single("file"), createCertificate);
router.get("/:id", protect, getCertificateById);
router.put("/:id", protect, certificateUpload.single("file"), updateCertificate);
router.delete("/:id", protect, deleteCertificate);
router.patch("/:id/status", protect, toggleCertificateStatus);

module.exports = router;

