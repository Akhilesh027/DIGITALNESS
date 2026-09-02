const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadClientAttachment,
  getClientAttachments,
  deleteClientAttachment,
} = require("../controllers/clientAttachmentController.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/client-attachments");
  },

  filename(req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, PDF, Word, Excel, SVG and ZIP files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.post("/", protect, upload.single("file"), uploadClientAttachment);
router.get("/", protect, getClientAttachments);
router.get("/:customerId", protect, getClientAttachments);
router.delete("/:id", protect, deleteClientAttachment);

module.exports = router;