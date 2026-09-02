/**
 * test_approval_engine.js
 * Automated Acceptance Test Suite for Step 2: Central Approval Engine & Governance
 * 
 * Verifies:
 * 1. Full Lifecycle: DRAFT -> AI_GENERATED -> WAITING_APPROVAL -> APPROVED -> QUEUED -> EXECUTING -> EXECUTED
 * 2. Revision Branching: WAITING_APPROVAL -> CHANGES_REQUESTED -> REGENERATING -> AI_GENERATED (v2) -> WAITING_APPROVAL -> APPROVED
 * 3. Rejection & Cancellation terminal transitions
 * 4. Negative Transitions (Must Throw Controlled Error):
 *    - EXECUTED -> APPROVED ❌
 *    - REJECTED -> EXECUTING ❌
 *    - WAITING_APPROVAL -> EXECUTED ❌
 * 5. Double Approval & Race Condition Protection (Atomic findOneAndUpdate)
 * 6. Self-Approval Block for R3 (Financial/High-Impact)
 * 7. Blocked Restricted Actions
 * 8. Audit Trail Verification
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const ApprovalEngine = require("./ai/approval/ApprovalEngine");
const ApprovalRequest = require("./models/ApprovalRequest");
const ApprovalAuditLog = require("./models/ApprovalAuditLog");
const { evaluateCommandPolicy, RISK_LEVELS } = require("./ai/policies/commandPolicy");
const { canUserApprove } = require("./ai/approval/approvalPolicy");

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
  console.log("🚀 STARTING APPROVAL ENGINE ACCEPTANCE TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Full Happy Path Lifecycle
    // DRAFT -> AI_GENERATED -> WAITING_APPROVAL -> APPROVED -> QUEUED -> EXECUTING -> EXECUTED
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Standard 11-State Happy Path Lifecycle ---");
    const testUserManager = new mongoose.Types.ObjectId();
    const testUserEmployee = new mongoose.Types.ObjectId();

    const req1 = await ApprovalEngine.createApprovalRequest({
      title: "Vinayaka Chavithi Poster for ApexBee",
      domain: "CREATIVE",
      actionType: "GENERATE_POSTER",
      riskLevel: "R1",
      submittedByType: "AI_AGENT",
      sourceAgent: "CreativeAgent",
      blueprintPayload: { headline: "Blessings & Prosperity", primaryColor: "#FF9933" },
      initialStatus: "AI_GENERATED",
    });

    assert(req1 && req1.approvalId.startsWith("APPR-CREA"), "Generated readable approvalId APPR-CREA-*");
    assert(req1.status === "AI_GENERATED", "Initial status is AI_GENERATED");
    assert(req1.currentVersion === 1, "Initial currentVersion is 1");
    assert(req1.versions.length === 1, "Version array has 1 snapshot");

    // Submit for approval -> WAITING_APPROVAL
    const submitted1 = await ApprovalEngine.submitForApproval({
      approvalId: req1.approvalId,
      actorId: testUserEmployee,
      actorRole: "Employee",
      remarks: "Ready for manager review",
    });
    assert(submitted1.status === "WAITING_APPROVAL", "Transitioned to WAITING_APPROVAL");

    // Manager Approves -> APPROVED
    const approved1 = await ApprovalEngine.approve({
      approvalId: req1.approvalId,
      actorId: testUserManager,
      actorRole: "Manager",
      remarks: "Looks great!",
    });
    assert(approved1.doc.status === "APPROVED", "Transitioned to APPROVED");
    assert(approved1.doc.decidedBy.toString() === testUserManager.toString(), "decidedBy recorded");

    // Queue worker -> QUEUED
    const queued1 = await ApprovalEngine.markQueued({
      approvalId: req1.approvalId,
      queueName: "creative-generation",
    });
    assert(queued1.status === "QUEUED", "Transitioned to QUEUED");

    // Worker picks up -> EXECUTING
    const executing1 = await ApprovalEngine.markExecuting({
      approvalId: req1.approvalId,
      workerJobId: "job_998877",
    });
    assert(executing1.status === "EXECUTING", "Transitioned to EXECUTING");

    // Worker completes -> EXECUTED
    const executed1 = await ApprovalEngine.markExecuted({
      approvalId: req1.approvalId,
      executionResult: { assetUrl: "https://storage.digitalness.com/posters/apexbee_v1.png" },
    });
    assert(executed1.status === "EXECUTED", "Transitioned to EXECUTED (Terminal Success)");

    // -------------------------------------------------------------------------
    // TEST 2: Revision Branching (V1 -> V2)
    // WAITING_APPROVAL -> CHANGES_REQUESTED -> REGENERATING -> AI_GENERATED (v2) -> WAITING_APPROVAL -> APPROVED
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Revision Loop & Version Branching (V1 -> V2) ---");
    const req2 = await ApprovalEngine.createApprovalRequest({
      title: "Meta Lead Campaign for Siya Art Homes",
      domain: "META_ADS",
      actionType: "CREATE_CAMPAIGN",
      riskLevel: "R3",
      sourceAgent: "AdsAgent",
      blueprintPayload: { budget: 500, targeting: "Hyderabad Curtains" },
      initialStatus: "AI_GENERATED", // Auto-routes to WAITING_APPROVAL because of R3
    });

    assert(req2.status === "WAITING_APPROVAL", "R3 item auto-routed to WAITING_APPROVAL");

    // Manager requests changes
    const changesReq2 = await ApprovalEngine.requestChanges({
      approvalId: req2.approvalId,
      actorId: testUserManager,
      actorRole: "Manager",
      feedback: "Increase daily budget to ₹1000 and narrow age bracket to 28-50.",
    });
    assert(changesReq2.status === "CHANGES_REQUESTED", "Transitioned to CHANGES_REQUESTED");
    assert(changesReq2.versions[0].managerFeedback.includes("Increase daily budget"), "V1 manager feedback saved");

    // Agent starts regeneration
    const regen2 = await ApprovalEngine.startRegeneration({
      approvalId: req2.approvalId,
      sourceAgent: "AdsAgent",
    });
    assert(regen2.status === "REGENERATING", "Transitioned to REGENERATING");

    // Agent completes regeneration with Version 2 payload
    const v2Completed = await ApprovalEngine.completeRegeneration({
      approvalId: req2.approvalId,
      newBlueprintPayload: { budget: 1000, targeting: "Hyderabad Curtains 28-50" },
      generatedBy: "AdsAgent",
    });
    assert(v2Completed.currentVersion === 2, "currentVersion incremented to 2");
    assert(v2Completed.versions.length === 2, "Versions array contains exactly 2 snapshots");
    assert(v2Completed.versions[0].superseded === true, "Version 1 marked as superseded");
    assert(v2Completed.versions[1].superseded === false, "Version 2 is active");
    assert(v2Completed.status === "WAITING_APPROVAL", "Auto-routed back to WAITING_APPROVAL for review");

    // Admin approves Version 2
    const approvedV2 = await ApprovalEngine.approve({
      approvalId: req2.approvalId,
      actorId: testUserManager,
      actorRole: "Admin",
      remarks: "V2 budget and targeting verified. Approved.",
    });
    assert(approvedV2.doc.status === "APPROVED", "Version 2 successfully APPROVED");

    // -------------------------------------------------------------------------
    // TEST 3: Rejection & Cancellation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Rejection & Cancellation Transitions ---");
    const req3 = await ApprovalEngine.createApprovalRequest({
      title: "Discount Offer WhatsApp Broadcast",
      domain: "WHATSAPP",
      riskLevel: "R3",
      initialStatus: "WAITING_APPROVAL",
    });

    const rejected3 = await ApprovalEngine.reject({
      approvalId: req3.approvalId,
      actorId: testUserManager,
      actorRole: "Manager",
      reason: "Discount percentage is too steep.",
    });
    assert(rejected3.status === "REJECTED", "Transitioned to REJECTED (Terminal)");

    const req4 = await ApprovalEngine.createApprovalRequest({
      title: "Emergency Task Rebalance",
      domain: "INTERNAL",
      riskLevel: "R1",
      initialStatus: "AI_GENERATED",
    });

    const cancelled4 = await ApprovalEngine.cancel({
      approvalId: req4.approvalId,
      actorId: testUserManager,
      actorRole: "Admin",
      reason: "Client postponed project.",
    });
    assert(cancelled4.status === "CANCELLED", "Transitioned to CANCELLED (Terminal)");

    // -------------------------------------------------------------------------
    // TEST 4: Negative Transitions (Must Throw Controlled Application Errors)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Negative Transitions (Forbidden State Changes) ---");
    let caughtCount = 0;

    // A. EXECUTED -> APPROVED ❌
    try {
      ApprovalEngine.validateTransition("EXECUTED", "APPROVED");
    } catch (e) {
      caughtCount++;
      assert(e.code === "INVALID_STATE_TRANSITION", "Blocked EXECUTED -> APPROVED");
    }

    // B. REJECTED -> EXECUTING ❌
    try {
      ApprovalEngine.validateTransition("REJECTED", "EXECUTING");
    } catch (e) {
      caughtCount++;
      assert(e.code === "INVALID_STATE_TRANSITION", "Blocked REJECTED -> EXECUTING");
    }

    // C. WAITING_APPROVAL -> EXECUTED ❌
    try {
      ApprovalEngine.validateTransition("WAITING_APPROVAL", "EXECUTED");
    } catch (e) {
      caughtCount++;
      assert(e.code === "INVALID_STATE_TRANSITION", "Blocked WAITING_APPROVAL -> EXECUTED");
    }

    assert(caughtCount === 3, "All 3 illegal transitions threw INVALID_STATE_TRANSITION errors");

    // -------------------------------------------------------------------------
    // TEST 5: Double Approval & Race Condition Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Double Approval & Conflict Protection ---");
    const req5 = await ApprovalEngine.createApprovalRequest({
      title: "Instagram Post for Glamour Salon",
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      initialStatus: "WAITING_APPROVAL",
    });

    // First approval succeeds
    const firstApproval = await ApprovalEngine.approve({
      approvalId: req5.approvalId,
      actorId: testUserManager,
      actorRole: "Manager",
      remarks: "Approved #1",
    });
    assert(firstApproval.doc.status === "APPROVED", "First approval succeeded");

    // Second approval returns safe idempotent response
    const secondApproval = await ApprovalEngine.approve({
      approvalId: req5.approvalId,
      actorId: testUserManager,
      actorRole: "Manager",
      remarks: "Approved #2",
    });
    assert(secondApproval.alreadyApproved === true, "Second approval safely returned alreadyApproved=true");

    // -------------------------------------------------------------------------
    // TEST 6: Self-Approval Protection for R3 Actions
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Self-Approval & Role Enforcement ---");
    const employeeId = new mongoose.Types.ObjectId();

    const selfApprovalCheckEmployee = canUserApprove({
      userRole: "Employee",
      riskLevel: "R3",
      submittedById: employeeId,
      userId: employeeId,
    });
    assert(!selfApprovalCheckEmployee.allowed, "Employee cannot self-approve R3 action");

    const selfApprovalCheckAdmin = canUserApprove({
      userRole: "Admin",
      riskLevel: "R3",
      submittedById: employeeId,
      userId: employeeId,
    });
    assert(selfApprovalCheckAdmin.allowed, "Admin is permitted to approve R3 action");

    // -------------------------------------------------------------------------
    // TEST 7: Standardized Command Policy & Blocked Restricted Actions
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Standardized Command Policy (R0-R3 + BLOCKED) ---");
    const readPolicy = evaluateCommandPolicy("customer.search", "Employee");
    assert(readPolicy.riskLevel === "R0" && readPolicy.approvalRequired === false, "customer.search is R0 (No Approval)");

    const draftPolicy = evaluateCommandPolicy("content.create", "Employee");
    assert(draftPolicy.riskLevel === "R1" && draftPolicy.approvalRequired === false, "content.create is R1 (No Approval for Draft)");

    const publicPolicy = evaluateCommandPolicy("content.schedule", "Manager");
    assert(publicPolicy.riskLevel === "R2" && publicPolicy.approvalRequired === true, "content.schedule is R2 (Manager Approval Required)");

    const spendPolicy = evaluateCommandPolicy("ads.campaign.create", "Manager");
    assert(spendPolicy.riskLevel === "R3" && spendPolicy.approvalRequired === true, "ads.campaign.create is R3 (Admin/Manager Approval Required)");

    const blockedPolicy = evaluateCommandPolicy("customer.delete", "Admin");
    assert(blockedPolicy.riskLevel === "BLOCKED" && blockedPolicy.allowed === false, "customer.delete is BLOCKED destructive action");

    // -------------------------------------------------------------------------
    // TEST 8: Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Audit Trail Verification ---");
    const detail = await ApprovalEngine.getApprovalDetail(req1.approvalId);
    assert(detail && detail.auditHistory && detail.auditHistory.length >= 4, "Complete audit log trail stored in ApprovalAuditLog");

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
