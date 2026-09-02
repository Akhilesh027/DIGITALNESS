/**
 * ExecutionService.js
 * Atomic Execution Orchestration Service bridging ApprovalEngine to BullMQ QueueRegistry.
 */

const ExecutionJob = require("../../models/ExecutionJob");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const QueueRegistry = require("../queue/QueueRegistry");
const ExecutionGuard = require("./ExecutionGuard");

class ExecutionService {
  /**
   * Schedules an approved action into the BullMQ background queue.
   */
  async scheduleExecution({
    approvalId,
    queueName = "social-publishing",
    operation = null,
    resourceType = null,
    resourceId = null,
    resourceVersion = 1,
    payload = {},
    requestedBy = null,
    correlationId = null,
    delay = 0,
  }) {
    if (!approvalId) {
      throw new Error("approvalId is required to schedule execution.");
    }

    // 1. Fetch ApprovalRequest
    const approval = await ApprovalRequest.findById(approvalId);
    if (!approval) {
      const err = new Error(`ApprovalRequest '${approvalId}' not found.`);
      err.code = "APPROVAL_NOT_FOUND";
      throw err;
    }

    // 2. Validate using ExecutionGuard
    const targetOperation = operation || approval.executionIntent?.action || "execute";
    const guard = await ExecutionGuard.validateExecution({
      approvalId,
      operation: targetOperation,
      customerId: approval.customer,
      locationId: approval.clientLocation,
      resourceId: resourceId || approval.relatedResourceId,
      resourceVersion: resourceVersion || approval.currentVersion || 1,
      riskLevel: approval.riskLevel || "R2",
    });

    if (!guard.valid) {
      const err = new Error(`Execution scheduling blocked by guard: ${guard.message}`);
      err.code = guard.code;
      throw err;
    }

    // 3. Construct deterministic Idempotency Key
    const idempotencyKey = `exec_${approval._id}_${targetOperation}_v${approval.currentVersion || 1}`;

    // Check if an active execution already exists
    let existingJob = await ExecutionJob.findOne({ idempotencyKey });
    if (existingJob && ["QUEUED", "EXECUTING", "SUCCEEDED"].includes(existingJob.status)) {
      return {
        success: true,
        jobId: existingJob.bullJobId,
        executionId: existingJob.executionId,
        status: existingJob.status,
        message: "Job is already scheduled or completed (Idempotent replay).",
      };
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 4. Create ExecutionJob record
    const executionJobDoc = await ExecutionJob.create({
      executionId,
      queueName,
      jobType: targetOperation,
      approvalId: approval._id,
      customerId: approval.customer,
      locationId: approval.clientLocation || null,
      domain: approval.domain || "GENERAL",
      operation: targetOperation,
      resourceType: resourceType || approval.relatedResourceType,
      resourceId: resourceId || approval.relatedResourceId,
      resourceVersion: resourceVersion || approval.currentVersion || 1,
      status: "QUEUED",
      idempotencyKey,
      correlationId: correlationId || `corr_${Date.now()}`,
      requestedBy: requestedBy || approval.submittedBy,
    });

    // 5. Standard Job Envelope (NO raw tokens/secrets)
    const envelope = {
      jobId: executionId,
      executionId,
      jobType: targetOperation,
      queueName,
      approvalId: approval._id.toString(),
      customerId: approval.customer.toString(),
      locationId: approval.clientLocation ? approval.clientLocation.toString() : null,
      domain: approval.domain || "GENERAL",
      operation: targetOperation,
      resourceType: resourceType || approval.relatedResourceType,
      resourceId: resourceId || (approval.relatedResourceId ? approval.relatedResourceId.toString() : null),
      resourceVersion: resourceVersion || approval.currentVersion || 1,
      requestedBy: requestedBy ? requestedBy.toString() : null,
      correlationId: executionJobDoc.correlationId,
      idempotencyKey,
      attemptNumber: 1,
      payload,
      createdAt: new Date(),
    };

    // 6. Enqueue with Rollback Safety
    try {
      const bullJob = await QueueRegistry.enqueue(queueName, targetOperation, envelope, {
        delay: delay || 0,
      });

      // Update Bull Job ID
      executionJobDoc.bullJobId = bullJob.id;
      await executionJobDoc.save();

      // Transition ApprovalRequest to QUEUED
      await ApprovalRequest.findByIdAndUpdate(approval._id, {
        $set: {
          status: "QUEUED",
          "executionIntent.queuedAt": new Date(),
          "executionIntent.executionId": executionId,
        },
      });

      return {
        success: true,
        executionId,
        bullJobId: bullJob.id,
        status: "QUEUED",
      };
    } catch (enqueueErr) {
      // Rollback: Keep approval as APPROVED, mark execution job as FAILED
      await ExecutionJob.findByIdAndUpdate(executionJobDoc._id, {
        $set: {
          status: "FAILED",
          lastError: {
            code: enqueueErr.code || "ENQUEUE_FAILED",
            message: enqueueErr.message,
            retryable: true,
            occurredAt: new Date(),
          },
        },
      });

      const failure = new Error(`Failed to enqueue execution job: ${enqueueErr.message}`);
      failure.code = enqueueErr.code || "QUEUE_UNAVAILABLE";
      throw failure;
    }
  }
}

module.exports = new ExecutionService();
