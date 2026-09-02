const ScheduledJob = require("../models/ScheduledJob");
const ContentItem = require("../models/ContentItem");
const AuditLog = require("../models/AuditLog");
const { getQueue } = require("../queues/queueRegistry");

exports.getScheduledJobs = async (req, res) => {
  try {
    const { status, customerId, jobType } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (jobType) filter.jobType = jobType;

    const jobs = await ScheduledJob.find(filter)
      .populate("customerId", "name companyName brandProfile socialIntegrations")
      .populate("clientLocationId", "name city address phone")
      .populate({
        path: "entityId",
        populate: { path: "creativeProjectId" },
      })
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ scheduledFor: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const job = await ScheduledJob.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Scheduled job not found" });

    try {
      const queue = getQueue(job.queueName || "scheduled-content");
      if (queue && job.bullJobId) {
        const bullJob = await queue.getJob(job.bullJobId);
        if (bullJob) await bullJob.remove();
      }
    } catch (err) {
      console.log("Error removing BullMQ job:", err.message);
    }

    job.status = "Cancelled";
    await job.save();

    if (job.entityType === "ContentItem" && job.entityId) {
      await ContentItem.updateOne(
        { _id: job.entityId },
        { $set: { status: "Content Ready", publishStatus: "Cancelled", scheduledFor: null } }
      );
    }

    await AuditLog.create({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "job_cancelled",
      entityType: job.entityType,
      entityId: job.entityId,
      customerId: job.customerId,
      inputSummary: `Cancelled scheduled job ${job._id}`,
      status: "Success",
    });

    res.status(200).json({
      success: true,
      message: "Scheduled job cancelled",
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.retryJob = async (req, res) => {
  try {
    const job = await ScheduledJob.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Scheduled job not found" });

    if (job.retryCount >= job.maxRetries) {
      return res.status(400).json({
        success: false,
        message: `Maximum retries (${job.maxRetries}) reached for this job`,
      });
    }

    job.retryCount += 1;
    job.status = "Retrying";
    job.lastAttemptAt = new Date();
    await job.save();

    try {
      const queue = getQueue(job.queueName || "scheduled-content");
      if (queue) {
        await queue.add(
          "publish-content-job",
          { contentItemId: String(job.entityId), scheduledJobId: String(job._id) },
          { delay: 1000 }
        );
      }
    } catch (queueErr) {
      console.log("BullMQ queue error on retry:", queueErr.message);
    }

    await AuditLog.create({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "job_retry_triggered",
      entityType: job.entityType,
      entityId: job.entityId,
      customerId: job.customerId,
      inputSummary: `Triggered retry attempt ${job.retryCount} for job ${job._id}`,
      status: "Warning",
    });

    res.status(200).json({
      success: true,
      message: `Retry attempt ${job.retryCount} triggered`,
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQueueHealth = async (req, res) => {
  try {
    const { getIsRedisConnected } = require("../queues/connection");
    const isRedisConnected = getIsRedisConnected();

    if (isRedisConnected) {
      return res.status(200).json({
        success: true,
        scheduler: "available",
        redis: "connected",
        bullmq: "ready",
        worker: "running",
        message: "Scheduler queue infrastructure is online.",
      });
    } else {
      return res.status(200).json({
        success: true,
        scheduler: "unavailable",
        redis: "disconnected",
        bullmq: "fallback",
        worker: "stopped",
        message: "Scheduler in graceful fallback mode. Redis is offline.",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reconcileQueue = async (req, res) => {
  try {
    const { reconcilePendingSchedules } = require("../services/schedulerService");
    const result = await reconcilePendingSchedules();
    res.status(200).json({
      success: true,
      message: `Reconciled ${result.reconciled} pending jobs`,
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrUpdateSchedule = async (req, res) => {
  try {
    const { creativeRunId, contentItemId, scheduledFor, slot, platforms, notes } = req.body;

    let targetDate = new Date();
    if (scheduledFor) {
      targetDate = new Date(scheduledFor);
    } else if (slot && slot.includes("5:30 PM")) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(17, 30, 0, 0);
    } else if (slot && slot.includes("Saturday")) {
      const day = targetDate.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + diff);
      targetDate.setHours(11, 30, 0, 0);
    } else {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(10, 0, 0, 0);
    }

    let job = null;
    if (contentItemId) {
      job = await ScheduledJob.findOne({ entityId: contentItemId });
    }
    if (!job && creativeRunId) {
      const AgentRun = require("../models/AgentRun");
      const run = await AgentRun.findById(creativeRunId);
      if (run?.outputs?.contentItemId) {
        job = await ScheduledJob.findOne({ entityId: run.outputs.contentItemId });
      }
    }

    if (job) {
      job.scheduledFor = targetDate;
      if (platforms) job.payload.platforms = platforms;
      if (notes) job.payload.notes = notes;
      job.status = "Pending";
      await job.save();

      const ContentItem = require("../models/ContentItem");
      await ContentItem.findByIdAndUpdate(job.entityId, {
        scheduledFor: targetDate,
        status: "Scheduled",
        platforms: platforms || ["Instagram", "Facebook"],
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule synchronized successfully",
      scheduledFor: targetDate,
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
