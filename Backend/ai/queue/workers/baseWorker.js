/**
 * baseWorker.js
 * Standard BullMQ Base Worker Framework for Digitalness CRM
 * 
 * Pipeline:
 * 1. Claims Job Envelope
 * 2. Idempotency Check
 * 3. ExecutionGuard Verification (Tenant, Version, Approval Status)
 * 4. Atomic Transition: QUEUED -> EXECUTING
 * 5. Connector Execution Callback
 * 6. Atomic Transition: EXECUTING -> EXECUTED / FAILED
 * 7. Retry Strategy (Exponential backoff for retryable errors; immediate halt for unrecoverable)
 */

let Worker = null;
let UnrecoverableError = null;
try {
  const bullmq = require("bullmq");
  Worker = bullmq.Worker;
  UnrecoverableError = bullmq.UnrecoverableError;
} catch (e) {
  console.warn("bullmq not found, worker running in mock/fallback mode");
}

const { getRedisConnection } = require("../../../config/redis");
const ExecutionJob = require("../../../models/ExecutionJob");
const ApprovalRequest = require("../../../models/ApprovalRequest");
const ExecutionGuard = require("../../execution/ExecutionGuard");

const NON_RETRYABLE_CODES = [
  "APPROVAL_ID_REQUIRED",
  "APPROVAL_NOT_FOUND",
  "APPROVAL_CANCELLED",
  "APPROVAL_REJECTED",
  "ALREADY_EXECUTED",
  "APPROVAL_NOT_EXECUTABLE",
  "TENANT_MISMATCH",
  "LOCATION_MISMATCH",
  "OPERATION_MISMATCH",
  "VERSION_MISMATCH",
  "MISSING_PERMISSION",
  "INVALID_CUSTOMER",
  "CREDENTIAL_MISSING",
  "DECRYPTION_ERROR",
];

class BaseWorker {
  constructor({ queueName, concurrency = 5, handler }) {
    this.queueName = queueName;
    this.concurrency = concurrency;
    this.handler = handler;
    this.worker = null;
  }

  /**
   * Starts the BullMQ worker instance
   */
  start() {
    if (!Worker) return null;
    const connection = getRedisConnection();
    if (!connection) return null;

    try {
      this.worker = new Worker(
        this.queueName,
        async (job) => {
          return this._processJob(job);
        },
        {
          connection,
          concurrency: this.concurrency,
        }
      );

      this.worker.on("completed", (job) => {
        console.log(`✓ [Worker:${this.queueName}] Job ${job.id} completed successfully.`);
      });

      this.worker.on("failed", (job, err) => {
        console.error(`❌ [Worker:${this.queueName}] Job ${job?.id} failed: ${err.message}`);
      });

      this.worker.on("error", (err) => {
        // Prevent unhandled error crashes when Redis connection is reconnecting
        if (process.env.NODE_ENV === "production") {
          console.error(`❌ [Worker:${this.queueName}] Connection Error: ${err.message}`);
        }
      });

      console.log(`✓ [Worker:${this.queueName}] Initialized with concurrency: ${this.concurrency}`);
      return this.worker;
    } catch (err) {
      console.warn(`Worker init error on '${this.queueName}':`, err.message);
      return null;
    }
  }

  /**
   * Core execution pipeline
   */
  async _processJob(job) {
    const envelope = job.data;
    const startTime = Date.now();
    const { approvalId, executionId, idempotencyKey, customerId, locationId, operation, resourceId, resourceVersion } =
      envelope;

    // 1. Idempotency Check on MongoDB ExecutionJob
    let execJob = await ExecutionJob.findOne({ idempotencyKey });
    if (execJob && execJob.status === "SUCCEEDED") {
      console.log(`[Worker] Idempotent skip for already succeeded job: ${idempotencyKey}`);
      return execJob.result;
    }

    // 2. ExecutionGuard Verification
    const guard = await ExecutionGuard.validateExecution({
      approvalId,
      operation,
      customerId,
      locationId,
      resourceId,
      resourceVersion,
      riskLevel: envelope.domain === "R3" ? "R3" : "R2",
    });

    if (!guard.valid) {
      const isNonRetryable = NON_RETRYABLE_CODES.includes(guard.code);
      await this._handleFailure({
        executionId,
        approvalId,
        error: { code: guard.code, message: guard.message, retryable: !isNonRetryable },
        attempt: job.attemptsMade + 1,
      });

      if (isNonRetryable && UnrecoverableError) {
        throw new UnrecoverableError(`Non-retryable execution guard block: ${guard.message}`);
      }
      throw new Error(guard.message);
    }

    // 3. Mark EXECUTING atomically
    if (execJob) {
      execJob.status = "EXECUTING";
      execJob.startedAt = new Date();
      execJob.attempts = (execJob.attempts || 0) + 1;
      await execJob.save();
    }

    if (approvalId) {
      await ApprovalRequest.findByIdAndUpdate(approvalId, {
        $set: {
          status: "EXECUTING",
          "executionIntent.executingAt": new Date(),
        },
      });
    }

    // 4. Dispatch to domain connector handler
    try {
      const result = await this.handler(envelope, guard.approvalDoc);

      const durationMs = Date.now() - startTime;

      // 5. Mark SUCCEEDED / EXECUTED atomically
      if (execJob) {
        execJob.status = "SUCCEEDED";
        execJob.completedAt = new Date();
        execJob.durationMs = durationMs;
        execJob.result = result;
        await execJob.save();
      }

      if (approvalId) {
        await ApprovalRequest.findByIdAndUpdate(approvalId, {
          $set: {
            status: "EXECUTED",
            "executionIntent.executedAt": new Date(),
            "executionIntent.externalReceipt": result,
          },
        });
      }

      return result;
    } catch (handlerErr) {
      const isNonRetryable = NON_RETRYABLE_CODES.includes(handlerErr.code);
      await this._handleFailure({
        executionId,
        approvalId,
        error: {
          code: handlerErr.code || "HANDLER_ERROR",
          message: handlerErr.message,
          retryable: !isNonRetryable,
        },
        attempt: job.attemptsMade + 1,
      });

      if (isNonRetryable && UnrecoverableError) {
        throw new UnrecoverableError(`Non-retryable error: ${handlerErr.message}`);
      }
      throw handlerErr;
    }
  }

  async _handleFailure({ executionId, approvalId, error, attempt }) {
    // Sanitize error message to prevent secret leaking
    const cleanMsg = String(error.message || "Execution failed")
      .replace(/eaab[a-zA-Z0-9_-]+/gi, "[REDACTED_TOKEN]")
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");

    await ExecutionJob.findOneAndUpdate(
      { executionId },
      {
        $set: {
          status: "FAILED",
          failedAt: new Date(),
          lastError: {
            code: error.code || "EXECUTION_FAILED",
            message: cleanMsg,
            retryable: Boolean(error.retryable),
            occurredAt: new Date(),
          },
        },
      }
    );

    if (approvalId && !error.retryable) {
      await ApprovalRequest.findByIdAndUpdate(approvalId, {
        $set: {
          status: "FAILED",
          "executionIntent.failedAt": new Date(),
          "executionIntent.lastError": cleanMsg,
        },
      });
    }
  }

  /**
   * Closes the worker gracefully
   */
  async close() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}

module.exports = BaseWorker;
