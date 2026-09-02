const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const {
  getCreativeProjects,
  getCreativeProjectById,
  createCreativeProject,
  addCreativeVersion,
  submitCreativeForApproval,
  approveCreative,
  requestCreativeRevision,
  scheduleCreativeProject,
} = require("../controllers/creativeProjectController");

router.use(protect);

router.route("/").get(getCreativeProjects).post(createCreativeProject);

router.route("/:id").get(getCreativeProjectById);

router.post("/:id/versions", addCreativeVersion);
router.post("/:id/schedule", scheduleCreativeProject);
router.post("/:id/submit-approval", submitCreativeForApproval);
router.post("/:id/approve", authorize("Admin", "Operational Manager", "Branch Manager"), approveCreative);
router.post("/:id/request-revision", authorize("Admin", "Operational Manager", "Branch Manager"), requestCreativeRevision);

module.exports = router;
