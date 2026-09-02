const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getConnections,
  connectPlatform,
  disconnectPlatform,
  checkHealth,
} = require("../controllers/marketingConnectionController");

router.use(protect);

router.get("/", getConnections);
router.post("/connect", connectPlatform);
router.post("/:id/disconnect", disconnectPlatform);
router.get("/:id/health", checkHealth);

module.exports = router;
