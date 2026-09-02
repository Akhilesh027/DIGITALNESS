const ScheduledJob = require("../models/ScheduledJob");
const ContentItem = require("../models/ContentItem");
const CreativeProject = require("../models/CreativeProject");
const AuditLog = require("../models/AuditLog");
const createNotification = require("../utils/createNotification");
const { getQueue } = require("../queues/queueRegistry");

exports.scheduleContentPublish = async ({ contentItemId, scheduledFor, user, timezone = "Asia/Kolkata" }) => {
  const contentItem = await ContentItem.findById(contentItemId);

  if (!contentItem) {
    throw new Error("Content item not found");
  }

  // Auto-approve content item for scheduling if pending
  if (contentItem.approvalStatus !== "Approved") {
    contentItem.approvalStatus = "Approved";
    await contentItem.save();
  }

  // Auto-approve attached creative project if present
  if (contentItem.creativeProjectId) {
    await CreativeProject.findByIdAndUpdate(contentItem.creativeProjectId, { approvalStatus: "Approved" });
  }

  const scheduledDate = new Date(scheduledFor);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid schedule date/time");
  }

  // Prevent past dates
  if (scheduledDate < new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  // Check for existing scheduled job for this content item
  let scheduledJob = await ScheduledJob.findOne({
    entityId: contentItemId,
    status: { $in: ["Pending", "Queued"] },
  });

  const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
  let bullJobId = "";

  let queueCreated = false;
  try {
    const queue = getQueue("scheduled-content");
    if (queue) {
      const bullJob = await queue.add(
        "publish-content-job",
        { contentItemId: String(contentItemId), scheduledJobId: "" },
        { delay: delayMs, jobId: `content_${contentItemId}_${scheduledDate.getTime()}` }
      );
      bullJobId = bullJob.id;
      queueCreated = Boolean(bullJobId);
    }
  } catch (queueErr) {
    console.log("BullMQ queue error (Fallback mode active):", queueErr.message);
  }

  const initialStatus = queueCreated ? "Queued" : "Pending";
  const failureReason = queueCreated ? "" : "Redis/BullMQ unavailable";

  if (scheduledJob) {
    scheduledJob.scheduledFor = scheduledDate;
    scheduledJob.status = initialStatus;
    scheduledJob.bullJobId = bullJobId;
    scheduledJob.failureReason = failureReason;
    scheduledJob.approvedBy = user?._id;
    await scheduledJob.save();
  } else {
    scheduledJob = await ScheduledJob.create({
      jobType: "ContentPublish",
      queueName: "scheduled-content",
      customerId: contentItem.customerId,
      clientLocationId: contentItem.clientLocationId,
      entityType: "ContentItem",
      entityId: contentItem._id,
      scheduledFor: scheduledDate,
      timezone,
      bullJobId,
      payload: {
        contentItemId: contentItem._id,
        title: contentItem.title,
        headline: contentItem.headline,
        caption: contentItem.caption,
        hashtags: contentItem.hashtags,
        supportingCopy: contentItem.supportingCopy,
        imageUrl: contentItem.mediaUrl || contentItem.imageUrl,
      },
      status: initialStatus,
      failureReason,
      createdBy: user?._id,
      approvedBy: user?._id,
    });
  }

  // Update ContentItem state
  contentItem.scheduledFor = scheduledDate;
  contentItem.status = "Scheduled";
  contentItem.publishStatus = queueCreated ? "Scheduled" : "Queued";
  await contentItem.save();

  // Record AuditLog safely
  try {
    await AuditLog.create({
      actorType: user?.role || "Manager",
      actorId: user?._id || null,
      actorName: user?.name || "Manager",
      action: queueCreated ? "schedule_created" : "schedule_persisted_fallback",
      entityType: "ContentItem",
      entityId: contentItem._id,
      customerId: contentItem.customerId,
      clientLocationId: contentItem.clientLocationId,
      inputSummary: queueCreated
        ? `Scheduled "${contentItem.title}" for ${scheduledDate.toISOString()}`
        : `Persisted schedule for "${contentItem.title}" (Queue unavailable)`,
      status: queueCreated ? "Success" : "Warning",
    });
  } catch (auditErr) {
    console.warn("AuditLog creation warning:", auditErr.message);
  }

  // Notify assigned users & admin safely
  if (contentItem.assignedTo?.length) {
    for (const recipientId of contentItem.assignedTo) {
      try {
        await createNotification({
          title: "Content Scheduled",
          message: `Content "${contentItem.title}" has been scheduled for ${scheduledDate.toLocaleString()}`,
          type: "task",
          moduleId: contentItem._id,
          moduleModel: "Work",
          recipient: recipientId,
          createdBy: user?._id || null,
          link: "/content-calendar",
        });
      } catch (notifErr) {
        console.warn("Notification creation warning:", notifErr.message);
      }
    }
  }

  return {
    contentItem,
    scheduledJob,
    schedulePersisted: true,
    queueCreated,
    schedulerAvailable: queueCreated,
  };
};

exports.cancelScheduledContent = async ({ contentItemId, user }) => {
  const contentItem = await ContentItem.findById(contentItemId);
  if (!contentItem) throw new Error("Content item not found");

  const scheduledJob = await ScheduledJob.findOne({
    entityId: contentItemId,
    status: { $in: ["Pending", "Queued"] },
  });

  if (scheduledJob) {
    try {
      const queue = getQueue("scheduled-content");
      if (queue && scheduledJob.bullJobId) {
        const job = await queue.getJob(scheduledJob.bullJobId);
        if (job) await job.remove();
      }
    } catch (err) {
      console.log("Error removing BullMQ job:", err.message);
    }

    scheduledJob.status = "Cancelled";
    await scheduledJob.save();
  }

  contentItem.status = "Content Ready";
  contentItem.publishStatus = "Cancelled";
  contentItem.scheduledFor = null;
  await contentItem.save();

  await AuditLog.create({
    actorType: user?.role || "Manager",
    actorId: user?._id,
    actorName: user?.name || "Manager",
    action: "schedule_cancelled",
    entityType: "ContentItem",
    entityId: contentItem._id,
    customerId: contentItem.customerId,
    inputSummary: `Cancelled schedule for "${contentItem.title}"`,
    status: "Success",
  });

  return { contentItem, scheduledJob };
};

exports.reconcilePendingSchedules = async () => {
  try {
    const pendingJobs = await ScheduledJob.find({
      status: "Pending",
      scheduledFor: { $gt: new Date() },
    });

    let queueCount = 0;

    for (const job of pendingJobs) {
      const contentItem = await ContentItem.findById(job.entityId);
      if (contentItem && contentItem.approvalStatus === "Approved") {
        const delayMs = Math.max(0, new Date(job.scheduledFor).getTime() - Date.now());
        try {
          const queue = getQueue("scheduled-content");
          if (queue) {
            const bullJob = await queue.add(
              "publish-content-job",
              { contentItemId: String(contentItem._id), scheduledJobId: String(job._id) },
              { delay: delayMs, jobId: `content_${contentItem._id}_${new Date(job.scheduledFor).getTime()}` }
            );
            job.bullJobId = bullJob.id;
            job.status = "Queued";
            job.failureReason = "";
            await job.save();

            contentItem.publishStatus = "Scheduled";
            await contentItem.save();
            queueCount++;
          }
        } catch (err) {
          console.log(`Reconciliation failed for job ${job._id}:`, err.message);
        }
      }
    }

    return { reconciled: queueCount, totalPending: pendingJobs.length };
  } catch (error) {
    console.error("Reconciliation error:", error.message);
    return { reconciled: 0, error: error.message };
  }
};
