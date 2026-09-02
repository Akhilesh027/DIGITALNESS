/**
 * test_step1_5_acceptance.js
 * Acceptance Gate Test Suite for Phase 4 Steps 1 to 5.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { parseCommandRequest, classifyUniversalIntent } = require("./ai/orchestrator/intentRouter");
const { resolveEntities } = require("./ai/context/entityResolver");
const { evaluateCommandPolicy, RISK_LEVELS } = require("./ai/policies/commandPolicy");
const commandRegistry = require("./ai/commands/commandRegistry");
const { validateCommandParams } = require("./ai/commands/commandSchemas");

const Customer = require("./models/Customer");
const User = require("./models/User");
const Work = require("./models/Work");
const Lead = require("./models/Lead");

async function runAcceptanceTests() {
  console.log("==================================================================");
  console.log("STARTING PHASE 4 STEP 1–5 ACCEPTANCE GATE VERIFICATION");
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
    // Setup Mock / Seed DB Records for Entity Resolution Testing
    // ----------------------------------------------------------------
    console.log("\n--- Seeding Test Fixtures ---");
    let testCustomer = await Customer.findOne({ name: /Toni & Guy/i });
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
      console.log("Created test customer: Toni & Guy Ameenpur");
    }

    let testUserRavi = await User.findOne({ name: "Ravi Kumar" });
    if (!testUserRavi) {
      testUserRavi = await User.create({
        name: "Ravi Kumar",
        email: "ravi.kumar.test@digitalness.in",
        password: "hashedpassword123",
        role: "Employee",
        status: "Active",
      });
      console.log("Created test employee: Ravi Kumar");
    }

    let testTask = await Work.findOne({ customer: testCustomer._id, title: /poster/i });
    if (!testTask) {
      testTask = await Work.create({
        title: "Toni & Guy Ameenpur - Tomorrow's Poster Deliverable",
        customer: testCustomer._id,
        workType: "Design",
        priority: "Medium",
        status: "In Progress",
        assignedTo: [],
        createdBy: testUserRavi._id,
      });
      console.log("Created test task: Tomorrow's Poster Deliverable");
    }

    // ----------------------------------------------------------------
    // TEST 1: Show pending tasks -> task.getPending, READ
    // ----------------------------------------------------------------
    console.log("\n--- Test 1: READ Command Parsing ---");
    const res1 = await parseCommandRequest({ prompt: "Show all pending tasks", userRole: "Manager" });
    assert(res1.command === "task.getPending", "Test 1.1: Intent correctly mapped to task.getPending", `Got: ${res1.command}`);
    assert(res1.riskLevel === RISK_LEVELS.READ, "Test 1.2: Risk level is READ", `Got: ${res1.riskLevel}`);
    assert(res1.approvalRequired === false, "Test 1.3: No approval required for READ", `Got: ${res1.approvalRequired}`);
    assert(res1.isExecutable === true, "Test 1.4: Command is immediately executable", `Got: ${res1.isExecutable}`);

    // ----------------------------------------------------------------
    // TEST 2: Create a lead for ABC Furniture -> lead.create, LOW_RISK_WRITE
    // ----------------------------------------------------------------
    console.log("\n--- Test 2: Low-Risk Write with Parameter Extraction ---");
    const res2 = await parseCommandRequest({ prompt: "Create a lead for ABC Furniture", userRole: "Manager" });
    assert(res2.command === "lead.create", "Test 2.1: Intent correctly mapped to lead.create", `Got: ${res2.command}`);
    assert(res2.riskLevel === RISK_LEVELS.LOW_RISK_WRITE, "Test 2.2: Risk level is LOW_RISK_WRITE", `Got: ${res2.riskLevel}`);
    assert(res2.parameters.name === "ABC Furniture", "Test 2.3: Extracted lead name 'ABC Furniture'", `Got: ${res2.parameters.name}`);
    assert(res2.isExecutable === true, "Test 2.4: Validated parameters and executable", `Got: ${res2.isExecutable}`);

    // ----------------------------------------------------------------
    // TEST 3: Assign Toni & Guy poster to Ravi -> task.assign with all 3 entities
    // ----------------------------------------------------------------
    console.log("\n--- Test 3: Multi-Entity Resolution (Customer + Task + Employee) ---");
    const res3 = await parseCommandRequest({ prompt: "Assign tomorrow's Toni & Guy poster to Ravi", userRole: "Manager" });
    assert(res3.command === "task.assign", "Test 3.1: Command is task.assign", `Got: ${res3.command}`);
    assert(res3.riskLevel === RISK_LEVELS.LOW_RISK_WRITE, "Test 3.2: Risk level is LOW_RISK_WRITE", `Got: ${res3.riskLevel}`);
    assert(Boolean(res3.resolvedEntities.customerId), "Test 3.3: Resolved Customer ID (Toni & Guy)", `Customer: ${res3.resolvedEntities.customerName}`);
    assert(Boolean(res3.resolvedEntities.employeeId), "Test 3.4: Resolved Employee ID (Ravi)", `Employee: ${res3.resolvedEntities.employeeName}`);
    assert(Boolean(res3.resolvedEntities.taskId), "Test 3.5: Resolved Task ID (Poster)", `Task: ${res3.resolvedEntities.taskTitle}`);
    assert(res3.isExecutable === true, "Test 3.6: All parameters satisfied and executable", `Got: ${res3.isExecutable}`);

    // ----------------------------------------------------------------
    // TEST 4: Record ₹25,000 payment for Toni & Guy -> payment.record, APPROVAL_REQUIRED, DO NOT execute
    // ----------------------------------------------------------------
    console.log("\n--- Test 4: Financial Command Policy & Parameter Extraction ---");
    const res4 = await parseCommandRequest({ prompt: "Record ₹25,000 payment for Toni & Guy", userRole: "Manager" });
    assert(res4.command === "payment.record", "Test 4.1: Command is payment.record", `Got: ${res4.command}`);
    assert(res4.riskLevel === RISK_LEVELS.APPROVAL_REQUIRED, "Test 4.2: Risk level is APPROVAL_REQUIRED", `Got: ${res4.riskLevel}`);
    assert(res4.approvalRequired === true, "Test 4.3: Approval required is TRUE", `Got: ${res4.approvalRequired}`);
    assert(res4.parameters.amount === 25000, "Test 4.4: Extracted amount ₹25,000", `Got: ${res4.parameters.amount} ${res4.parameters.currency}`);
    assert(Boolean(res4.resolvedEntities.customerId), "Test 4.5: Customer resolved for payment", `Customer: ${res4.resolvedEntities.customerName}`);

    // ----------------------------------------------------------------
    // TEST 5: Delete Toni & Guy -> customer.delete, RESTRICTED, BLOCKED
    // ----------------------------------------------------------------
    console.log("\n--- Test 5: Destructive Command Policy Enforcement ---");
    const res5 = await parseCommandRequest({ prompt: "Delete Toni & Guy", userRole: "Manager" });
    assert(res5.command === "customer.delete", "Test 5.1: Command is customer.delete", `Got: ${res5.command}`);
    assert(res5.riskLevel === RISK_LEVELS.RESTRICTED, "Test 5.2: Risk level is RESTRICTED", `Got: ${res5.riskLevel}`);
    assert(res5.status === "POLICY_BLOCKED", "Test 5.3: Status is POLICY_BLOCKED", `Got: ${res5.status}`);
    assert(res5.isExecutable === false, "Test 5.4: Execution is blocked", `Got: ${res5.isExecutable}`);

    // ----------------------------------------------------------------
    // TEST 6: Ambiguity Test (Multiple Ravis exist) -> AMBIGUOUS, Execution Blocked
    // ----------------------------------------------------------------
    console.log("\n--- Test 6: Ambiguity Detection & Safety Block ---");
    let testUserRavi2 = await User.findOne({ name: "Ravi Reddy" });
    if (!testUserRavi2) {
      testUserRavi2 = await User.create({
        name: "Ravi Reddy",
        email: "ravi.reddy.test@digitalness.in",
        password: "hashedpassword123",
        role: "Employee",
        status: "Active",
      });
      console.log("Created second test employee: Ravi Reddy");
    }

    const res6 = await parseCommandRequest({ prompt: "Assign poster to Ravi", userRole: "Manager" });
    assert(res6.status === "AMBIGUOUS_ENTITY", "Test 6.1: Status flagged as AMBIGUOUS_ENTITY", `Got: ${res6.status}`);
    assert(res6.ambiguity?.candidates?.length >= 2, "Test 6.2: Identified candidate employees", `Candidates: ${res6.ambiguity?.candidates?.map(c => c.name).join(", ")}`);
    assert(res6.isExecutable === false, "Test 6.3: Ambiguous execution is safely BLOCKED", `Got: ${res6.isExecutable}`);

    // ----------------------------------------------------------------
    // TEST 7: Revenue Report & Hot Leads Search
    // ----------------------------------------------------------------
    console.log("\n--- Test 7: Additional Queries (Revenue, Overdue, Hot Leads) ---");
    const res7a = await parseCommandRequest({ prompt: "How much revenue have we collected this month?", userRole: "Manager" });
    assert(res7a.command === "report.revenue" && res7a.riskLevel === RISK_LEVELS.READ, "Test 7.1: Revenue inquiry mapped to report.revenue [READ]", `Got: ${res7a.command}`);

    const res7b = await parseCommandRequest({ prompt: "Show overdue payments", userRole: "Manager" });
    assert(res7b.command === "payment.getOverdue" && res7b.riskLevel === RISK_LEVELS.READ, "Test 7.2: Overdue inquiry mapped to payment.getOverdue [READ]", `Got: ${res7b.command}`);

    const res7c = await parseCommandRequest({ prompt: "Show all hot leads", userRole: "Manager" });
    assert(res7c.command === "lead.search" && res7c.parameters.leadScore === "Hot", "Test 7.3: Hot leads inquiry mapped with filter [Hot]", `Got: ${res7c.command}, score: ${res7c.parameters.leadScore}`);

    // Cleanup second Ravi after test to leave clean state
    if (testUserRavi2) {
      await User.findByIdAndDelete(testUserRavi2._id);
    }

    console.log("\n==================================================================");
    console.log(`ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

  } catch (err) {
    console.error("Test Suite Error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAcceptanceTests();
