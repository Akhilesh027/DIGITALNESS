const express = require("express");

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate,
} = require("../controllers/recruitmentController.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public career page jobs
router.get("/jobs/public", getJobs);

// CRM protected routes
router.use(protect);

// Jobs
router.get("/jobs", getJobs);
router.post("/jobs", createJob);
router.get("/jobs/:id", getJobById);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

// Candidates
router.get("/candidates", getCandidates);
router.post("/candidates", createCandidate);
router.get("/candidates/:id", getCandidateById);
router.put("/candidates/:id", updateCandidate);
router.patch("/candidates/:id/status", updateCandidateStatus);
router.delete("/candidates/:id", deleteCandidate);

module.exports = router;