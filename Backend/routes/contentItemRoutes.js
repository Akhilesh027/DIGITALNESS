const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authRole");
const {
  getContentItems,
  getContentItemById,
  createContentItem,
  updateContentItem,
  submitContentForApproval,
  approveContentItem,
  requestContentRevision,
  scheduleContent,
  cancelContentSchedule,
} = require("../controllers/contentItemController");

router.use(protect);

router.route("/").get(getContentItems).post(createContentItem);

router.route("/:id").get(getContentItemById).put(updateContentItem);

router.post("/:id/submit-approval", submitContentForApproval);
router.post("/:id/approve", authorize("Admin", "Operational Manager", "Branch Manager"), approveContentItem);
router.post("/:id/request-revision", authorize("Admin", "Operational Manager", "Branch Manager"), requestContentRevision);
router.post("/:id/schedule", authorize("Admin", "Operational Manager", "Branch Manager"), scheduleContent);
router.post("/:id/cancel-schedule", authorize("Admin", "Operational Manager", "Branch Manager"), cancelContentSchedule);

module.exports = router;
