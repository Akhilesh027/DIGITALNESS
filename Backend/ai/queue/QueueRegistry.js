/**
 * QueueRegistry.js
 * Centralized Queue Management for Digitalness CRM
 */

let Queue = null;
try {
  Queue = require("bullmq").Queue;
} catch (e) {
  console.warn("bullmq not found, fallback active");
}

const { getRedisConnection, isRedisHealthy } = require("../../config/redis");

const STANDARD_QUEUES = [
  "creative-generation",
  "social-publishing",
  "meta-ads",
  "google-ads",
  "gbp-publishing",
  "whatsapp",
  "lead-followup",
  "payments",
  "analytics-sync",
  "reports",
  "notifications",
  "automation",
];

class QueueRegistry {
  constructor() {
    this.queues = {};
  }

  /**
   * Returns or lazily instantiates a BullMQ Queue instance
   */
  getQueue(queueName) {
    if (this.queues[queueName]) {
      return this.queues[queueName];
    }

    if (!Queue) return null;

    try {
      const connection = getRedisConnection();
      if (!connection) return null;

      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: {
            age: 86400, // keep for 24h
            count: 1000,
          },
          removeOnFail: {
            age: 604800, // keep for 7 days
            count: 5000,
          },
        },
      });

      this.queues[queueName] = queue;
      return queue;
    } catch (err) {
      console.warn(`Failed to initialize queue '${queueName}':`, err.message);
      return null;
    }
  }

  /**
   * Enqueues a standardized job envelope into the designated BullMQ queue.
   * Strictly validates that no raw credentials are contained in payload.
   */
  async enqueue(queueName, jobName, envelope, options = {}) {
    if (!envelope.customerId) {
      throw new Error("Job envelope requires customerId for multi-tenant safety.");
    }
    if (!envelope.operation) {
      throw new Error("Job envelope requires an operation identifier.");
    }

    // Security Check: Verify NO raw tokens or secret keys in payload
    const payloadString = JSON.stringify(envelope);
    if (
      payloadString.includes("accessToken") ||
      payloadString.includes("refreshToken") ||
      payloadString.includes("clientSecret") ||
      payloadString.includes("ENCRYPTION_KEY")
    ) {
      throw new Error("Security Violation: Raw credentials or secrets detected in job payload.");
    }

    const queue = this.getQueue(queueName);
    if (!queue) {
      const err = new Error(`Queue '${queueName}' is unavailable (Redis connection not ready).`);
      err.code = "QUEUE_UNAVAILABLE";
      throw err;
    }

    const jobOptions = {
      jobId: envelope.idempotencyKey || `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...options,
    };

    if (options.delay) {
      jobOptions.delay = options.delay;
    }

    const job = await queue.add(jobName, envelope, jobOptions);
    return job;
  }

  /**
   * Pauses a specific queue
   */
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (queue) await queue.pause();
  }

  /**
   * Resumes a paused queue
   */
  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (queue) await queue.resume();
  }

  /**
   * Retrieves health and job count metrics for a single queue
   */
  async getQueueHealth(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return { status: "OFFLINE", waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }

    try {
      const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
        queue.getWaitingCount().catch(() => 0),
        queue.getActiveCount().catch(() => 0),
        queue.getCompletedCount().catch(() => 0),
        queue.getFailedCount().catch(() => 0),
        queue.getDelayedCount().catch(() => 0),
        queue.isPaused().catch(() => false),
      ]);

      return {
        status: isPaused ? "PAUSED" : "ACTIVE",
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (err) {
      return { status: "ERROR", error: err.message };
    }
  }

  /**
   * Retrieves health status across all standard CRM queues
   */
  async getAllQueuesHealth() {
    const redisHealthy = isRedisHealthy();
    const queueMode = (process.env.QUEUE_MODE || (process.env.NODE_ENV === "production" ? "REDIS" : "MOCK")).toUpperCase();

    const health = {
      queueMode,
      redisStatus: redisHealthy ? "CONNECTED" : "DISCONNECTED",
      timestamp: new Date(),
      queues: {},
    };

    for (const qName of STANDARD_QUEUES) {
      health.queues[qName] = await this.getQueueHealth(qName);
    }

    return health;
  }

  /**
   * Gracefully shuts down all active queue instances
   */
  async closeAll() {
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.close();
      } catch (e) {}
    }
    this.queues = {};
  }
}

module.exports = new QueueRegistry();
