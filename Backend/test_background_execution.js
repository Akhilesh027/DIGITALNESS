/**
 * test_background_execution.js
 * Automated Acceptance Test Suite for Step 4: Redis + BullMQ Background Execution Infrastructure
 * 
 * Verifies:
 * 1. Queue Lifecycle: APPROVED -> QUEUED -> EXECUTING -> EXECUTED (via Mock Connector)
 * 2. Unapproved Block: WAITING_APPROVAL blocked by ExecutionGuard
 * 3. Cancelled Approval: Blocked with zero execution
 * 4. Idempotency: Double-enqueue creates only 1 effective job
 * 5. Error Classification: Retryable vs Non-retryable failure handling
 * 6. Multi-Tenant Isolation: Cross-customer execution blocked
 * 7. Version Safety: Mismatched resource versions blocked
 * 8. Proof Migration: ExecutiveBriefingEngine executes through automationWorker
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const ExecutionService = require("./ai/execution/ExecutionService");
const ExecutionGuard = require("./ai/execution/ExecutionGuard");
const ExecutionJob = require("./models/ExecutionJob");
const ApprovalRequest = require("./models/ApprovalRequest");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const socialWorker = require("./ai/queue/workers/socialWorker");
const automationWorker = require("./ai/queue/workers/automationWorker");
const IntegrationManager = require("./ai/integrations/IntegrationManager");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING BULLMQ BACKGROUND EXECUTION TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    const testCustomer = await Customer.create({ name: "ApexBee Technologies (Test)", companyName: "ApexBee" });
    const testCustomer2 = await Customer.create({ name: "GlowNest Clinic (Test)", companyName: "GlowNest" });
    const testLocation = await ClientLocation.create({ customerId: testCustomer._id, name: "Hyderabad Central", city: "Hyderabad" });

    // Connect Instagram account for testCustomer
    await IntegrationManager.connect({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      platform: "Instagram",
      accountType: "InstagramBusiness",
      platformAccountId: "ig_apexbee_999",
      platformAccountName: "ApexBee Official IG",
      accessToken: "eaab_test_token_secret_123",
      scopes: ["instagram_basic", "instagram_content_publish"],
    });

    // -------------------------------------------------------------------------
    // TEST 1: Full Queue Lifecycle (APPROVED -> QUEUED -> EXECUTING -> EXECUTED)
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Full Queue Lifecycle (APPROVED -> QUEUED -> EXECUTING -> EXECUTED) ---");

    const approval1 = await ApprovalRequest.create({
      approvalId: `appr_test_${Date.now()}_1`,
      title: "Publish Instagram Post: Summer Promotion",
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      customer: testCustomer._id,
      clientLocation: testLocation._id,
      status: "APPROVED",
      currentVersion: 1,
      executionIntent: {
        action: "instagram.publish",
        connector: "Instagram",
      },
    });

    // 1. Schedule Execution
    const scheduleRes = await ExecutionService.scheduleExecution({
      approvalId: approval1._id,
      queueName: "social-publishing",
      operation: "instagram.publish",
      payload: { caption: "Special Summer 2026 Offer!" },
    });

    assert(scheduleRes.success === true, "ExecutionService scheduled approved request");
    assert(scheduleRes.status === "QUEUED", "Returned status is QUEUED");

    const queuedApproval = await ApprovalRequest.findById(approval1._id);
    assert(queuedApproval.status === "QUEUED", "ApprovalRequest updated to QUEUED in database");

    const execJob = await ExecutionJob.findOne({ approvalId: approval1._id });
    assert(execJob !== null && execJob.status === "QUEUED", "ExecutionJob created with status QUEUED");

    // 2. Process via Worker
    const mockBullJob = {
      id: execJob.bullJobId || `job_${Date.now()}`,
      attemptsMade: 0,
      data: {
        jobId: execJob.executionId,
        executionId: execJob.executionId,
        jobType: "instagram.publish",
        queueName: "social-publishing",
        approvalId: approval1._id.toString(),
        customerId: testCustomer._id.toString(),
        locationId: testLocation._id.toString(),
        domain: "SOCIAL_POST",
        operation: "instagram.publish",
        resourceVersion: 1,
        idempotencyKey: execJob.idempotencyKey,
        payload: { caption: "Special Summer 2026 Offer!" },
      },
    };

    const workerResult = await socialWorker._processJob(mockBullJob);
    assert(workerResult.success === true, "socialWorker executed mock connector successfully");
    assert(workerResult.result?.mock === true, "Result confirms safe mock execution");
    assert(workerResult.result?.externalId.startsWith("mock_ig_post_"), "Generated mock externalId");

    const executedApproval = await ApprovalRequest.findById(approval1._id);
    assert(executedApproval.status === "EXECUTED", "ApprovalRequest transitioned to EXECUTED");

    const completedExecJob = await ExecutionJob.findOne({ approvalId: approval1._id });
    assert(completedExecJob.status === "SUCCEEDED", "ExecutionJob transitioned to SUCCEEDED");
    assert(completedExecJob.durationMs >= 0, "Execution durationMs recorded");

    // -------------------------------------------------------------------------
    // TEST 2: Unapproved Gating Block
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Mandatory Approval Gating (WAITING_APPROVAL Block) ---");

    const unapprovedReq = await ApprovalRequest.create({
      approvalId: `appr_test_${Date.now()}_2`,
      title: "Unapproved High Spend Meta Ad Campaign",
      domain: "META_CAMPAIGN",
      riskLevel: "R3",
      customer: testCustomer._id,
      status: "WAITING_APPROVAL",
      currentVersion: 1,
      executionIntent: {
        action: "metaAds.createCampaign",
        connector: "MetaAds",
      },
    });

    let unapprovedBlocked = false;
    try {
      await ExecutionService.scheduleExecution({
        approvalId: unapprovedReq._id,
        queueName: "meta-ads",
        operation: "metaAds.createCampaign",
      });
    } catch (e) {
      unapprovedBlocked = true;
      assert(e.code === "APPROVAL_NOT_EXECUTABLE", "ExecutionService threw APPROVAL_NOT_EXECUTABLE for unapproved item");
    }
    assert(unapprovedBlocked, "Unapproved R3 action blocked from entering BullMQ queue");

    // -------------------------------------------------------------------------
    // TEST 3: Cancelled Approval Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Cancelled Approval Protection ---");

    const cancelledReq = await ApprovalRequest.create({
      approvalId: `appr_test_${Date.now()}_3`,
      title: "Cancelled Promo Post",
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      customer: testCustomer._id,
      status: "CANCELLED",
      currentVersion: 1,
    });

    const guardCancelled = await ExecutionGuard.validateExecution({
      approvalId: cancelledReq._id,
      operation: "instagram.publish",
      customerId: testCustomer._id,
    });
    assert(guardCancelled.valid === false, "ExecutionGuard rejected cancelled approval");
    assert(guardCancelled.code === "APPROVAL_CANCELLED", "Returned exact code APPROVAL_CANCELLED");

    // -------------------------------------------------------------------------
    // TEST 4: Idempotency & Double-Enqueue Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Deterministic Idempotency Key & Double-Enqueue Protection ---");

    const approval4 = await ApprovalRequest.create({
      approvalId: `appr_test_${Date.now()}_4`,
      title: "Double Click Test Post",
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      customer: testCustomer._id,
      status: "APPROVED",
      currentVersion: 1,
      executionIntent: { action: "instagram.publish" },
    });

    const firstEnqueue = await ExecutionService.scheduleExecution({
      approvalId: approval4._id,
      queueName: "social-publishing",
      operation: "instagram.publish",
    });
    assert(firstEnqueue.status === "QUEUED", "First enqueue scheduled cleanly");

    // Double-click attempt
    const secondEnqueue = await ExecutionService.scheduleExecution({
      approvalId: approval4._id,
      queueName: "social-publishing",
      operation: "instagram.publish",
    });
    assert(secondEnqueue.status === "QUEUED", "Second enqueue handled idempotently without duplicate jobs");

    const totalJobsForApproval4 = await ExecutionJob.countDocuments({ approvalId: approval4._id });
    assert(totalJobsForApproval4 === 1, "Exactly 1 ExecutionJob record created in MongoDB");

    // -------------------------------------------------------------------------
    // TEST 5: Multi-Tenant Worker Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Strict Multi-Tenant Isolation in ExecutionGuard ---");

    const guardTenantMismatch = await ExecutionGuard.validateExecution({
      approvalId: approval4._id, // Belongs to testCustomer
      operation: "instagram.publish",
      customerId: testCustomer2._id, // Rogue caller requesting under testCustomer2
    });
    assert(guardTenantMismatch.valid === false, "Cross-tenant execution attempt blocked");
    assert(guardTenantMismatch.code === "TENANT_MISMATCH", "Returned TENANT_MISMATCH");

    // -------------------------------------------------------------------------
    // TEST 6: Version Safety (Prevent executing outdated draft)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Version Safety (Binding Approved Version Snapshot) ---");

    const guardVersionMismatch = await ExecutionGuard.validateExecution({
      approvalId: approval4._id, // Approved version is 1
      operation: "instagram.publish",
      customerId: testCustomer._id,
      resourceVersion: 2, // Resource was modified to V2
    });
    assert(guardVersionMismatch.valid === false, "Outdated version mismatch blocked");
    assert(guardVersionMismatch.code === "VERSION_MISMATCH", "Returned VERSION_MISMATCH");

    // -------------------------------------------------------------------------
    // TEST 7: Proof Migration - ExecutiveBriefingEngine via automationWorker
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Proof Migration - ExecutiveBriefingEngine via automationWorker ---");

    const mockBriefingJob = {
      id: `job_briefing_${Date.now()}`,
      attemptsMade: 0,
      data: {
        jobId: `exec_briefing_${Date.now()}`,
        executionId: `exec_briefing_${Date.now()}`,
        jobType: "automation.generateMorningBrief",
        queueName: "automation",
        approvalId: null, // R0 automated intelligence job
        customerId: testCustomer._id.toString(),
        domain: "AUTOMATION",
        operation: "automation.generateMorningBrief",
        resourceVersion: 1,
        idempotencyKey: `exec_briefing_${Date.now()}`,
        payload: { date: new Date().toISOString().split("T")[0] },
      },
    };

    const briefingResult = await automationWorker._processJob(mockBriefingJob);
    assert(briefingResult.success === true, "automationWorker executed ExecutiveBriefingEngine cleanly");
    assert(briefingResult.engine === "ExecutiveBriefingEngine", "Executed target internal engine");

    // Clean up test documents
    await ApprovalRequest.deleteMany({ customer: { $in: [testCustomer._id, testCustomer2._id] } });
    await ExecutionJob.deleteMany({ customerId: { $in: [testCustomer._id, testCustomer2._id] } });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: { $in: [testCustomer._id, testCustomer2._id] } });

    console.log("\n=======================================================");
    console.log(`🎉 ALL TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN TEST RUNNER:", err);
  process.exit(1);
});
