/**
 * test_step6_10_acceptance.js
 * End-to-End Acceptance Test Suite for Phase 4 Steps 6–10 (Universal Command Lifecycle Engine).
 */

require("dotenv").config();
const mongoose = require("mongoose");
const {
  createCommandExecution,
  executeCommandExecution,
  approveCommandExecution,
  rejectCommandExecution,
  rollbackCommandExecution,
} = require("./ai/execution/executionCoordinator");
const AICommandExecution = require("./models/AICommandExecution");
const Customer = require("./models/Customer");
const User = require("./models/User");
const Work = require("./models/Work");
const AuditLog = require("./models/AuditLog");

async function runStep6To10Tests() {
  console.log("==================================================================");
  console.log("STARTING PHASE 4 STEP 6–10 ACCEPTANCE TEST SUITE");
  console.log("==================================================================\n");

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/digitalness";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------------------
    // Setup Test Fixtures
    // ----------------------------------------------------------------
    console.log("\n--- Setting up Test Fixtures ---");
    let testCustomer = await Customer.findOne({ name: /Toni & Guy Ameenpur/i });
    if (!testCustomer) {
      testCustomer = await Customer.create({
        name: "Toni & Guy Ameenpur",
        companyName: "Toni & Guy Ameenpur",
        businessType: "Salon & Spa",
        contactNumbers: ["9000000001"],
        branchId: "BR001",
        status: "Active",
        totalPaid: 50000,
        totalPending: 25000,
        createdBy: new mongoose.Types.ObjectId(),
      });
    }

    let employeeA = await User.findOne({ name: "Ananya Sharma" });
    if (!employeeA) {
      employeeA = await User.create({
        name: "Ananya Sharma",
        email: "ananya.sharma.test@digitalness.in",
        password: "hashedpassword123",
        role: "Employee",
        status: "Active",
      });
    }

    let employeeRavi = await User.findOne({ name: "Ravi Kumar" });
    if (!employeeRavi) {
      employeeRavi = await User.create({
        name: "Ravi Kumar",
        email: "ravi.kumar.test@digitalness.in",
        password: "hashedpassword123",
        role: "Employee",
        status: "Active",
      });
    }

    let testTask = await Work.findOne({ customer: testCustomer._id, title: /poster/i });
    if (!testTask) {
      testTask = await Work.create({
        title: "Toni & Guy Ameenpur - Tomorrow's Poster Deliverable",
        customer: testCustomer._id,
        workType: "Design",
        priority: "Medium",
        status: "In Progress",
        assignedTo: [employeeA._id],
        createdBy: employeeA._id,
      });
    } else {
      testTask.assignedTo = [employeeA._id];
      await testTask.save();
    }

    const managerUserId = new mongoose.Types.ObjectId();

    // ----------------------------------------------------------------
    // TEST A: READ Command ("Show pending tasks")
    // ----------------------------------------------------------------
    console.log("\n--- Test A: READ Command Lifecycle ---");
    const testA = await createCommandExecution({
      prompt: "Show all pending tasks",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(testA.status === "COMPLETED", "Test A.1: READ command auto-executes to COMPLETED", `Status: ${testA.status}`);
    assert(testA.blueprint?.approvalRequired === false, "Test A.2: No approval required for READ");
    assert(testA.result?.tasks !== undefined, "Test A.3: Returned tasks list directly", `Count: ${testA.result?.count}`);

    // ----------------------------------------------------------------
    // TEST B: Low-Risk Mutation ("Assign Toni & Guy poster to Ravi")
    // ----------------------------------------------------------------
    console.log("\n--- Test B: Low-Risk Mutation with Verification & Audit ---");
    const testB = await createCommandExecution({
      prompt: "Assign tomorrow's Toni & Guy poster to Ravi",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(testB.status === "COMPLETED", "Test B.1: LOW_RISK_WRITE auto-executes to COMPLETED", `Status: ${testB.status}`);
    assert(testB.verification?.status === "VERIFIED", "Test B.2: Post-execution DB verification status is VERIFIED", `Details: ${testB.verification?.details}`);

    const refreshedTaskB = await Work.findById(testTask._id).lean();
    const isAssignedToRavi = (refreshedTaskB.assignedTo || []).some((id) => String(id) === String(employeeRavi._id));
    assert(isAssignedToRavi, "Test B.3: DB state confirms task assigned to Ravi in MongoDB");

    const auditLogB = await AuditLog.findOne({ agentRunId: testB.executionId }).lean();
    assert(Boolean(auditLogB), "Test B.4: Audit log created for command execution", `Action: ${auditLogB?.action}`);

    // ----------------------------------------------------------------
    // TEST C: Payment Approval Workflow ("Record ₹25,000 payment for Toni & Guy")
    // ----------------------------------------------------------------
    console.log("\n--- Test C: Payment Command Lifecycle & Approval Enforcement ---");
    const custInitial = await Customer.findById(testCustomer._id).lean();
    const initialPaid = custInitial.totalPaid;
    const initialPending = custInitial.totalPending;

    // Stage Payment
    const testC = await createCommandExecution({
      prompt: "Record ₹25,000 payment for Toni & Guy",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(testC.status === "WAITING_APPROVAL", "Test C.1: Staged in WAITING_APPROVAL", `Status: ${testC.status}`);
    assert(testC.blueprint?.approvalRequired === true, "Test C.2: Blueprint confirms approvalRequired is TRUE");

    // Verify DB DID NOT CHANGE yet
    const custAfterStage = await Customer.findById(testCustomer._id).lean();
    assert(custAfterStage.totalPaid === initialPaid, "Test C.3: Database totalPaid unchanged prior to approval", `totalPaid: ${custAfterStage.totalPaid}`);

    // Approve Payment
    const approvedC = await approveCommandExecution({
      executionId: testC.executionId,
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(approvedC.status === "COMPLETED", "Test C.4: Approval executes command to COMPLETED", `Status: ${approvedC.status}`);
    assert(approvedC.verification?.status === "VERIFIED", "Test C.5: Financial verification status is VERIFIED", `Details: ${approvedC.verification?.details}`);

    const custFinal = await Customer.findById(testCustomer._id).lean();
    assert(custFinal.totalPaid === initialPaid + 25000, "Test C.6: Database totalPaid incremented by ₹25,000", `New totalPaid: ${custFinal.totalPaid}`);
    assert(custFinal.totalPending === Math.max(0, initialPending - 25000), "Test C.7: Database totalPending decremented", `New totalPending: ${custFinal.totalPending}`);

    // ----------------------------------------------------------------
    // TEST D: Approval Bypass Attack
    // ----------------------------------------------------------------
    console.log("\n--- Test D: Approval Bypass Attack Protection ---");
    const stagedPayment = await createCommandExecution({
      prompt: "Record ₹10,000 payment for Toni & Guy",
      userId: managerUserId,
      userRole: "Manager",
    });

    let bypassBlocked = false;
    try {
      // Attempt to execute directly without approval
      await executeCommandExecution({ executionId: stagedPayment.executionId, userId: managerUserId });
    } catch (err) {
      bypassBlocked = true;
      assert(err.message.includes("requires manager approval"), "Test D.1: Unauthorized execution rejected with policy guard", `Error: ${err.message}`);
    }
    assert(bypassBlocked, "Test D.2: Direct execution without approval strictly BLOCKED");

    // Clean up staged payment
    await AICommandExecution.deleteOne({ executionId: stagedPayment.executionId });

    // ----------------------------------------------------------------
    // TEST E: Double Execution / Idempotency Test
    // ----------------------------------------------------------------
    console.log("\n--- Test E: Double Execution & Idempotency Guard ---");
    const custPaidBeforeDouble = (await Customer.findById(testCustomer._id).lean()).totalPaid;

    // Call execute on already completed payment from Test C
    const doubleExecRes = await executeCommandExecution({
      executionId: testC.executionId,
      userId: managerUserId,
    });
    assert(doubleExecRes.status === "COMPLETED", "Test E.1: Idempotency returned existing COMPLETED execution");

    const custPaidAfterDouble = (await Customer.findById(testCustomer._id).lean()).totalPaid;
    assert(custPaidAfterDouble === custPaidBeforeDouble, "Test E.2: Database NOT mutated twice on duplicate execute", `Paid remained: ${custPaidAfterDouble}`);

    // ----------------------------------------------------------------
    // TEST F: Restricted Command ("Delete Toni & Guy")
    // ----------------------------------------------------------------
    console.log("\n--- Test F: Restricted Command Safety Guard ---");
    const testF = await createCommandExecution({
      prompt: "Delete Toni & Guy",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(testF.status === "POLICY_BLOCKED", "Test F.1: Restricted command returns POLICY_BLOCKED", `Status: ${testF.status}`);
    assert(testF.isExecutable === false, "Test F.2: Command marked isExecutable: false");

    // ----------------------------------------------------------------
    // TEST G: Verification Failure Simulation
    // ----------------------------------------------------------------
    console.log("\n--- Test G: Verification Failure Handling ---");
    // Create an execution with an invalid taskId that won't exist
    const fakeTaskId = new mongoose.Types.ObjectId();
    const fakeExec = await AICommandExecution.create({
      executionId: `CMD-VERIF-FAIL-${Date.now()}`,
      originalPrompt: "Assign fake task to Ravi",
      intent: "TASK_ASSIGNMENT",
      command: "task.assign",
      status: "READY",
      parameters: { taskId: fakeTaskId, assignedTo: employeeRavi._id },
    });

    let verifFailed = false;
    try {
      await executeCommandExecution({ executionId: fakeExec.executionId, userId: managerUserId });
    } catch (err) {
      verifFailed = true;
    }
    const finalFakeExec = await AICommandExecution.findOne({ executionId: fakeExec.executionId }).lean();
    assert(finalFakeExec.status !== "COMPLETED", "Test G.1: Execution with failure did NOT transition to COMPLETED", `Status: ${finalFakeExec.status}`);
    await AICommandExecution.deleteOne({ executionId: fakeExec.executionId });

    // ----------------------------------------------------------------
    // TEST H: Rollback (Assign task A -> Ravi -> Rollback to A)
    // ----------------------------------------------------------------
    console.log("\n--- Test H: Rollback & Pre-State Restoration ---");
    // Set task back to Employee A
    testTask.assignedTo = [employeeA._id];
    await testTask.save();

    // Assign to Ravi via AI
    const assignForRollback = await createCommandExecution({
      prompt: "Assign tomorrow's Toni & Guy poster to Ravi",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(assignForRollback.status === "COMPLETED", "Test H.1: Assigned to Ravi successfully");

    // Perform Rollback
    const rollbackRes = await rollbackCommandExecution({
      executionId: assignForRollback.executionId,
      userId: managerUserId,
    });
    assert(rollbackRes.execution.status === "ROLLED_BACK", "Test H.2: Execution status set to ROLLED_BACK", `Status: ${rollbackRes.execution.status}`);

    const rolledBackTask = await Work.findById(testTask._id).lean();
    const isRestoredToA = (rolledBackTask.assignedTo || []).some((id) => String(id) === String(employeeA._id));
    assert(isRestoredToA, "Test H.3: Task assignedTo successfully restored to Employee A in MongoDB");

    // Verify financial rollback is strictly blocked
    let finRollbackBlocked = false;
    try {
      await rollbackCommandExecution({ executionId: testC.executionId, userId: managerUserId });
    } catch (err) {
      finRollbackBlocked = true;
      assert(err.message.includes("NOT permitted"), "Test H.4: Financial rollback rejected with security message", `Error: ${err.message}`);
    }
    assert(finRollbackBlocked, "Test H.5: Automatic payment rollback is strictly blocked");

    // ----------------------------------------------------------------
    // TEST I: Ambiguous Entity Detection
    // ----------------------------------------------------------------
    console.log("\n--- Test I: Ambiguity Guard with 2 Matching Employees ---");
    let employeeRavi2 = await User.findOne({ name: "Ravi Reddy" });
    if (!employeeRavi2) {
      employeeRavi2 = await User.create({
        name: "Ravi Reddy",
        email: "ravi.reddy.test@digitalness.in",
        password: "hashedpassword123",
        role: "Employee",
        status: "Active",
      });
    }

    const testI = await createCommandExecution({
      prompt: "Assign poster to Ravi",
      userId: managerUserId,
      userRole: "Manager",
    });
    assert(testI.status === "AMBIGUOUS_ENTITY", "Test I.1: Status is AMBIGUOUS_ENTITY", `Status: ${testI.status}`);
    assert(testI.isExecutable === false, "Test I.2: Ambiguous execution is not executable");
    assert(testI.ambiguity?.candidates?.length >= 2, "Test I.3: Candidate list returned to manager", `Candidates: ${testI.ambiguity?.candidates?.map(c => c.name).join(", ")}`);

    // Clean up second Ravi
    await User.findByIdAndDelete(employeeRavi2._id);

    // ----------------------------------------------------------------
    // TEST J: Invalid State Transition Protection
    // ----------------------------------------------------------------
    console.log("\n--- Test J: State Machine Transition Enforcement ---");
    const testJExec = await AICommandExecution.create({
      executionId: `CMD-STATE-TEST-${Date.now()}`,
      originalPrompt: "State test prompt",
      intent: "PAYMENT_RECORD",
      command: "payment.record",
      approvalRequired: true,
      status: "WAITING_APPROVAL",
    });

    let stateBlocked = false;
    try {
      // Direct illegal transition attempt
      await executeCommandExecution({ executionId: testJExec.executionId, userId: managerUserId });
    } catch (err) {
      stateBlocked = true;
      assert(err.message.includes("requires manager approval"), "Test J.1: Direct WAITING_APPROVAL -> EXECUTING blocked without approval", `Error: ${err.message}`);
    }
    assert(stateBlocked, "Test J.2: State machine transition successfully protected");

    await AICommandExecution.deleteOne({ executionId: testJExec.executionId });

    console.log("\n==================================================================");
    console.log(`STEP 6–10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

  } catch (err) {
    console.error("Test Suite Error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runStep6To10Tests();
