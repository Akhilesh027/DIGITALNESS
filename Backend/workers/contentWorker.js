let Worker = null;
try {
  Worker = require("bullmq").Worker;
} catch (e) {
  // bullmq not installed, running in graceful fallback mode
}
const { getRedisConnection } = require("../queues/connection");
const ContentItem = require("../models/ContentItem");
const CreativeProject = require("../models/CreativeProject");
const ScheduledJob = require("../models/ScheduledJob");
const AuditLog = require("../models/AuditLog");

const initContentWorker = () => {
  try {
    if (!Worker) return null;
    const connection = getRedisConnection();
    if (!connection) return null;

    const worker = new Worker(
      "scheduled-content",
      async (job) => {
        console.log(`[Worker] Processing scheduled content job: ${job.id}`);
        const { contentItemId } = job.data;

        const contentItem = await ContentItem.findById(contentItemId);
        if (!contentItem) {
          throw new Error(`ContentItem ${contentItemId} not found`);
        }

        // DOUBLE-CHECK APPROVAL GATING AT EXECUTION TIME
        if (contentItem.approvalStatus !== "Approved") {
          throw new Error(`Approval bypass blocked! Content ${contentItem._id} is not approved.`);
        }

        if (contentItem.creativeProjectId) {
          const creative = await CreativeProject.findById(contentItem.creativeProjectId);
          if (creative && creative.approvalStatus !== "Approved") {
            throw new Error(`Approval bypass blocked! Attached Creative ${creative._id} is not approved.`);
          }
        }

        // Publish to client's configured social platforms
        const { publishContentItem } = require("../services/publishService");
        const publishResult = await publishContentItem(contentItemId);

        await ScheduledJob.updateOne(
          { entityId: contentItemId, status: { $in: ["Pending", "Queued"] } },
          { $set: { status: "Completed", executedAt: new Date() } }
        );

        console.log(`[Worker] Content "${contentItem.title}" successfully published:`, publishResult.results);
      },
      { connection }
    );

    worker.on("failed", async (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
      if (job?.data?.contentItemId) {
        await ScheduledJob.updateOne(
          { entityId: job.data.contentItemId },
          { $set: { status: "Failed", failureReason: err.message } }
        );
      }
    });

    return worker;
  } catch (error) {
    console.log("Worker initialization fallback active.");
    return null;
  }
};

module.exports = { initContentWorker };
