const express = require("express");
const router = express.Router();

const {
  createClientLogin,
  loginClient,
} = require("../controllers/clientController.js");

const { protect } = require("../middleware/authMiddleware");

router.post("/create-login", protect, createClientLogin);
router.post("/login", loginClient);

module.exports = router;