const RecruitmentJob = require("../models/RecruitmentJob.js");
const RecruitmentCandidate = require("../models/RecruitmentCandidate.js");
const Notification = require("../models/Notification");

const ADMIN_ROLES = ["Admin", "admin", "Operational Manager"];

const getUserId = (user) => user?._id || user?.id || user;

const canManageRecruitment = (user) => {
  return ADMIN_ROLES.includes(user?.role);
};

const createNotificationSafe = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error("Recruitment notification error:", error.message);
  }
};

const normalizeCandidatePayload = (body = {}) => {
  const data = { ...body };

  if (!data.jobId || data.jobId === "none" || data.jobId === "") {
    data.jobId = null;
  }

  if (!data.interviewDate || data.interviewDate === "") {
    data.interviewDate = null;
  }

  if (data.email) {
    data.email = String(data.email).trim().toLowerCase();
  }

  return data;
};

exports.createJob = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can create jobs",
      });
    }

    const {
      title,
      department,
      location,
      jobType,
      experience,
      openings,
      salaryRange,
      description,
      requirements,
      status,
    } = req.body;

    if (!title || !department || !description) {
      return res.status(400).json({
        success: false,
        message: "Job title, department and description are required",
      });
    }

    const job = await RecruitmentJob.create({
      title,
      department,
      location,
      jobType,
      experience,
      openings: Number(openings) || 1,
      salaryRange,
      description,
      requirements,
      status: status || "Open",
      createdBy: getUserId(req.user),
      updatedBy: getUserId(req.user),
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.log("Create job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { status, department, search, public: isPublic } = req.query;

    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (department && department !== "All") filter.department = department;

    if (isPublic === "true") {
      filter.status = "Open";
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const jobs = await RecruitmentJob.find(filter)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.log("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await RecruitmentJob.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can update jobs",
      });
    }

    const updates = { ...req.body };

    delete updates._id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    if (updates.openings !== undefined) {
      updates.openings = Number(updates.openings) || 1;
    }

    updates.updatedBy = getUserId(req.user);

    const job = await RecruitmentJob.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    console.log("Update job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can delete jobs",
      });
    }

    const job = await RecruitmentJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.log("Delete job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

exports.createCandidate = async (req, res) => {
  try {
    const data = normalizeCandidatePayload(req.body);

    if (!data.name || !data.email || !data.phone) {
      return res.status(400).json({
        success: false,
        message: "Candidate name, email and phone are required",
      });
    }

    if (data.jobId) {
      const job = await RecruitmentJob.findById(data.jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Selected job not found",
        });
      }
    }

    const candidate = await RecruitmentCandidate.create({
      ...data,
      createdBy: getUserId(req.user),
      updatedBy: getUserId(req.user),
    });

    await createNotificationSafe({
      title: "New Candidate Application",
      message: `${candidate.name} applied for a job`,
      type: "system",
      moduleId: candidate._id,
      moduleModel: "RecruitmentCandidate",
      recipient: getUserId(req.user),
      createdBy: getUserId(req.user),
      link: "/recruitment",
    });

    res.status(201).json({
      success: true,
      message: "Candidate added successfully",
      data: candidate,
    });
  } catch (error) {
    console.log("Create candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add candidate",
      error: error.message,
    });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { status, jobId, search } = req.query;

    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (jobId && jobId !== "All") filter.jobId = jobId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const candidates = await RecruitmentCandidate.find(filter)
      .populate("jobId", "title department location jobType")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.log("Get candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error.message,
    });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await RecruitmentCandidate.findById(req.params.id)
      .populate("jobId", "title department location jobType")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidate",
      error: error.message,
    });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can update candidates",
      });
    }

    const updates = normalizeCandidatePayload(req.body);

    delete updates._id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    updates.updatedBy = getUserId(req.user);

    const candidate = await RecruitmentCandidate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.log("Update candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update candidate",
      error: error.message,
    });
  }
};

exports.updateCandidateStatus = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can update candidate status",
      });
    }

    const { status, hrNotes, interviewDate } = req.body;

    const allowedStatuses = [
      "Applied",
      "Under Review",
      "Shortlisted",
      "Interview Scheduled",
      "Selected",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate status",
      });
    }

    const updateData = {
      status,
      updatedBy: getUserId(req.user),
    };

    if (hrNotes !== undefined) updateData.hrNotes = hrNotes;
    if (interviewDate !== undefined) {
      updateData.interviewDate = interviewDate || null;
    }

    const candidate = await RecruitmentCandidate.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).populate("jobId", "title department location jobType");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate status updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.log("Update candidate status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update candidate status",
      error: error.message,
    });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    if (!canManageRecruitment(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can delete candidates",
      });
    }

    const candidate = await RecruitmentCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    await candidate.deleteOne();

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.log("Delete candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete candidate",
      error: error.message,
    });
  }
};