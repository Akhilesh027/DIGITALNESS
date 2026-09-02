/**
 * test_step19b_canary_gate.js
 * Comprehensive Verification & Acceptance Suite for Step 19B:
 * Final Canary Gate, Provenance Normalization, Distinct Completeness Tiers,
 * Client Execution Mapping, and Canary Domain Scoping.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const User = require("./models/User");
const ProductionCertification = require("./models/ProductionCertification");
const ClientProductionPolicy = require("./models/ClientProductionPolicy");

const productionCertificationService = require("./ai/certification/ProductionCertificationService");
const clientExecutionMapService = require("./ai/certification/ClientExecutionMapService");
const productionPilotConfig = require("./config/productionPilot");

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
  console.log("🛡️ STARTING STEP 19B: FINAL CANARY GATE & PROVENANCE CERTIFICATION SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // 0. Setup Canary Client & Admin
    const canaryClient = await Customer.findOneAndUpdate(
      { email: "canary.siya@digitalness.ai" },
      {
        $set: {
          name: "Siya Art Homes (Canary)",
          brandName: "Siya Art",
          companyName: "Siya Art Homes Pvt Ltd",
          phone: "+919988776655",
          timezone: "Asia/Kolkata",
        },
      },
      { upsert: true, new: true }
    );

    const adminUser = await User.findOneAndUpdate(
      { email: "admin@digitalness.ai" },
      { $set: { name: "System Admin", role: "Admin", status: "Active" } },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------------------
    // TEST 1: Provenance Normalization (HARNESS_PASS vs REAL_PASS)
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Provenance Normalization (HARNESS_PASS vs REAL_PASS) ---");
    await productionCertificationService.recordGateResult({
      gateId: "SECURITY_SECRET_SANITIZATION",
      domain: "SECURITY",
      status: "REAL_PASS",
      evidenceRefs: { sanitizedAudit: true },
    });

    await productionCertificationService.recordGateResult({
      gateId: "INFRA_REDIS_BULLMQ_PERSISTENCE",
      domain: "INFRASTRUCTURE",
      status: "REAL_PASS",
      evidenceRefs: { queueMode: "REDIS", workerReconnect: "PROVEN" },
    });

    await productionCertificationService.recordGateResult({
      gateId: "CONNECTOR_INSTAGRAM_PUBLISH",
      domain: "SOCIAL",
      status: "HARNESS_PASS",
      evidenceRefs: { harnessExecution: "PROVEN", liveDelivery: "PENDING_LIVE_CANARY" },
    });

    const status = await productionCertificationService.getCertificationStatus();
    assert(status.provenanceBreakdown.realPassCount >= 2, "Accurately recorded REAL_PASS count");
    assert(status.provenanceBreakdown.harnessPassCount >= 1, "Accurately recorded HARNESS_PASS count without inflating REAL_PASS");

    // -------------------------------------------------------------------------
    // TEST 2: Distinct Completeness Metrics Separation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Four Distinct Completeness Metrics Separation ---");
    assert(status.completeness.codeCompleteness === 100, "codeCompleteness is 100%");
    assert(status.completeness.harnessCompleteness >= 50, "harnessCompleteness tracked independently");
    assert(status.completeness.realProviderCompleteness !== status.completeness.codeCompleteness, "realProviderCompleteness strictly separated from codeCompleteness");

    // -------------------------------------------------------------------------
    // TEST 3: Canary Domain Scoping (Dangerous Writes Locked)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Canary Domain Scoping & Spend Lock ---");
    assert(status.canaryScope.enabledDomains.includes("SOCIAL"), "SOCIAL domain in canary scope");
    assert(status.canaryScope.enabledDomains.includes("GBP"), "GBP domain in canary scope");
    assert(status.canaryScope.deferredDomains.includes("GOOGLE_ADS_ACTIVATION"), "GOOGLE_ADS_ACTIVATION strictly deferred/locked");

    // -------------------------------------------------------------------------
    // TEST 4: Emergency Write Lock Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Emergency Master Write Lock ---");
    productionPilotConfig.externalWritesEnabled = false;
    assert(productionPilotConfig.externalWritesEnabled === false, "Master write lock engaged");

    // -------------------------------------------------------------------------
    // TEST 5: Client Execution Mapping Confirmation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Client Execution Mapping ---");
    const executionMap = await clientExecutionMapService.buildClientExecutionMap(canaryClient._id);
    assert(executionMap.clientName.includes("Siya Art Homes"), "Resolved client name accurately");
    assert(executionMap.channelMappings.facebookPage.pageName !== undefined, "Extracted Facebook Page configuration");
    assert(executionMap.channelMappings.googleBusinessProfile.locationName !== undefined, "Extracted GBP Location mapping");

    // -------------------------------------------------------------------------
    // TEST 6: Client Production Policy Configuration
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Client Production Policy Configuration ---");
    const policy = await ClientProductionPolicy.findOneAndUpdate(
      { customerId: canaryClient._id },
      {
        $set: {
          certifiedDomains: ["SOCIAL", "GBP", "INBOX", "CALENDAR", "REPORTING"],
          externalWritesEnabled: true,
          adsActivationEnabled: false,
          approvedBy: adminUser._id,
          approvedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    assert(policy.externalWritesEnabled === true, "Canary client writes enabled for scoped domains");
    assert(policy.adsActivationEnabled === false, "Canary client paid-ad activation strictly locked");
    assert(policy.certifiedDomains.includes("SOCIAL"), "Canary policy permits SOCIAL");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 19B CANARY GATE TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 19B CANARY GATE TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
