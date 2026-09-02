const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const {
  getAIMemories,
  createAIMemory,
  deleteAIMemory,
} = require("../controllers/aiMemoryController");

router.use(protect);

router
  .route("/")
  .get(getAIMemories)
  .post(authorize("Admin", "Operational Manager", "Branch Manager"), createAIMemory);

router
  .route("/:id")
  .delete(authorize("Admin", "Operational Manager"), deleteAIMemory);

module.exports = router;
