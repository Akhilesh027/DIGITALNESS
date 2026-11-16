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
router.use(async (req, res, next) => {
  try {
    const studio = require('../ai/creative/OpenAIStudioService');
    studio.customerFilter(req.user);
    if (req.method === 'POST' && req.path === '/') await studio.customerForUser(req.body.customerId, req.user);
    next();
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.message }); }
});
router.use('/:id', async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid creative project ID.' });
    const project = await require('../models/CreativeProject').findById(req.params.id).select('customerId').lean();
    if (!project) return res.status(404).json({ success: false, message: 'Creative project not found.' });
    await require('../ai/creative/OpenAIStudioService').customerForUser(project.customerId, req.user);
    next();
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.message }); }
});

router.route("/").get(getCreativeProjects).post(createCreativeProject);

router.route("/:id").get(getCreativeProjectById);

router.post("/:id/versions", addCreativeVersion);
router.post("/:id/schedule", scheduleCreativeProject);
router.post("/:id/submit-approval", submitCreativeForApproval);
router.post("/:id/approve", authorize("Admin", "Operational Manager", "Branch Manager"), approveCreative);
router.post("/:id/request-revision", authorize("Admin", "Operational Manager", "Branch Manager"), requestCreativeRevision);

module.exports = router;
