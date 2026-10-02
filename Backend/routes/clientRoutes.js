const express = require("express");
const router = express.Router();

const {
  createClientLogin,
  loginClient,
  getClientMe,
  updateClientProfile,
  changeClientPassword,
  forgotPasswordClient,
} = require("../controllers/clientController.js");

const { protect } = require("../middleware/authMiddleware");

router.post("/create-login", protect, createClientLogin);
router.post("/login", loginClient);
router.post("/forgot-password", forgotPasswordClient);
router.get("/me", protect, getClientMe);
router.put("/profile", protect, updateClientProfile);
router.put("/change-password", protect, changeClientPassword);

module.exports = router;