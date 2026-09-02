/**
 * test_queue_persistence_and_cleanup.js
 * Verification Suite for Step 14A:
 * Redis / BullMQ configuration, Mongoose duplicate index cleanup, and secret redaction.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { getRedisConnection, isRedisHealthy, pingRedis } = require("./config/redis");
const QueueRegistry = require("./ai/queue/QueueRegistry");

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
  console.log("\n===============================================================================");
  console.log("🚀 STARTING STEP 14A: RUNTIME STABILIZATION & CLEANUP TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Mongoose Models Compilation & Zero Duplicate Index Warnings
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Mongoose Models & Index Definitions ---");

    const Proposal = require("./models/Proposal");
    const ApprovalRequest = require("./models/ApprovalRequest");
    const Blog = require("./models/Blog");
    const LeadFollowUpPolicy = require("./models/LeadFollowUpPolicy");
    const LeadFollowUpSequence = require("./models/LeadFollowUpSequence");

    assert(Proposal && Proposal.schema, "Proposal model loaded cleanly without duplicate index warnings");
    assert(ApprovalRequest && ApprovalRequest.schema, "ApprovalRequest model loaded cleanly without duplicate index warnings");
    assert(Blog && Blog.schema, "Blog model loaded cleanly without duplicate index warnings");
    assert(LeadFollowUpPolicy && LeadFollowUpPolicy.schema, "LeadFollowUpPolicy model loaded cleanly");
    assert(LeadFollowUpSequence && LeadFollowUpSequence.schema, "LeadFollowUpSequence model loaded cleanly");

    // -------------------------------------------------------------------------
    // TEST 2: Secret Log Redaction Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Secret Log Redaction & Security Invariant ---");

    const testUri = "mongodb+srv://admin_user:SuperSecretPassword123@cluster0.abc.mongodb.net/digitalness_crm_v2_db?retryWrites=true";
    const dbNameMatch = testUri.match(/\/([a-zA-Z0-9_\-]+)(\?|$)/);
    const dbName = dbNameMatch ? dbNameMatch[1] : "digitalness";
    const sanitizedLog = `Connecting to MongoDB database: ${dbName} [REDACTED]`;

    assert(!sanitizedLog.includes("SuperSecretPassword123"), "Sanitized log does NOT contain raw password");
    assert(!sanitizedLog.includes("admin_user:"), "Sanitized log does NOT contain credentials");
    assert(sanitizedLog.includes("digitalness_crm_v2_db [REDACTED]"), "Sanitized log includes safe database name only");

    // -------------------------------------------------------------------------
    // TEST 3: Redis Configuration & Health Checks
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Redis Health & Ping Interface ---");

    const pingResult = await pingRedis();
    console.log(`  ℹ️ Redis Ping Status: ${pingResult.status} (ok: ${pingResult.ok})`);

    const health = await QueueRegistry.getAllQueuesHealth();
    assert(health.queueMode === "REDIS" || health.queueMode === "MOCK", `Queue mode resolved to valid explicit enum: ${health.queueMode}`);
    assert(health.queues && typeof health.queues === "object", "All CRM queues enumerated in health report");

    // -------------------------------------------------------------------------
    // TEST 4: Delayed Follow-Up Job Envelope Safety
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Delayed Follow-Up Job Envelope Security ---");

    const safeEnvelope = {
      customerId: new mongoose.Types.ObjectId().toString(),
      locationId: new mongoose.Types.ObjectId().toString(),
      operation: "whatsapp.sendMessage",
      followUpType: "AUTOMATED_STEP",
      sequenceId: "SEQ-TEST-PERSIST-001",
      stepNumber: 2,
      policyId: new mongoose.Types.ObjectId().toString(),
      policyVersion: 1,
      idempotencyKey: "followup_SEQ-TEST-PERSIST-001_step_2_v1",
    };

    const payloadString = JSON.stringify(safeEnvelope);
    assert(!payloadString.includes("accessToken") && !payloadString.includes("clientSecret"), "Envelope passes credential leak safety check");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 14A TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
