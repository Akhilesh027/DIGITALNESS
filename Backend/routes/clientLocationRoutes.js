const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const {
  getClientLocations,
  getClientLocationById,
  createClientLocation,
  updateClientLocation,
  deleteClientLocation,
} = require("../controllers/clientLocationController");

router.use(protect);

router
  .route("/")
  .get(getClientLocations)
  .post(authorize("Admin", "Operational Manager", "Branch Manager"), createClientLocation);

router
  .route("/:id")
  .get(getClientLocationById)
  .put(authorize("Admin", "Operational Manager", "Branch Manager"), updateClientLocation)
  .delete(authorize("Admin"), deleteClientLocation);

module.exports = router;
