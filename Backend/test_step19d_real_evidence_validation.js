/**
 * test_step19d_real_evidence_validation.js
 * Verification test suite for Step 19D:
 * Anti-Harness Gate Validator, Provider Read-Back Enforcement, and Go-Live Blockers.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const productionCertificationService = require("./ai/certification/ProductionCertificationService");
const providerReadBackValidator = require("./ai/integrations/validators/ProviderReadBackValidator");
const runReadinessCheck = require("./scripts/productionReadinessCheck");

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
  console.log("🛡️ STARTING STEP 19D: ANTI-HARNESS EVIDENCE VALIDATOR TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Reject Fake REAL_PASS Attempt with Fixture ID
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Anti-Harness Validator Rejects Fixture ID ---");
    const fakeCert = await productionCertificationService.recordGateResult({
      gateId: "CONNECTOR_INSTAGRAM_PUBLISH",
      domain: "SOCIAL",
      status: "REAL_PASS",
      evidenceRefs: {
        evidenceType: "REAL_PROVIDER",
        readBackVerified: true,
        providerMediaId: "179823412093847", // Fixture ID!
      },
    });

    const igGate = fakeCert.gates.find((g) => g.gateId === "CONNECTOR_INSTAGRAM_PUBLISH");
    assert(igGate.status === "HARNESS_PASS", "Validator downgraded fixture REAL_PASS to HARNESS_PASS");
    assert(igGate.failureReason.includes("REAL_CERTIFICATION_EVIDENCE_INSUFFICIENT"), "Recorded correct failureReason");

    // -------------------------------------------------------------------------
    // TEST 2: Reject REAL_PASS when readBackVerified is False
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Reject REAL_PASS when readBackVerified is False ---");
    const unverifiedCert = await productionCertificationService.recordGateResult({
      gateId: "CONNECTOR_FACEBOOK_PUBLISH",
      domain: "SOCIAL",
      status: "REAL_PASS",
      evidenceRefs: {
        evidenceType: "REAL_PROVIDER",
        readBackVerified: false,
        providerPostId: "real_post_999",
      },
    });

    const fbGate = unverifiedCert.gates.find((g) => g.gateId === "CONNECTOR_FACEBOOK_PUBLISH");
    assert(fbGate.status === "HARNESS_PASS", "Validator downgraded unverified REAL_PASS to HARNESS_PASS");

    // -------------------------------------------------------------------------
    // TEST 3: ProviderReadBackValidator Detects Missing Live Access Token
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: ProviderReadBackValidator Guard ---");
    const igReadBack = await providerReadBackValidator.verifyInstagramMedia({
      connectionId: new mongoose.Types.ObjectId(),
      providerMediaId: "179823412093847",
    });
    assert(igReadBack.verified === false, "Read-back failed on fixture ID");
    assert(igReadBack.reason === "FIXTURE_OR_MOCK_ID_DETECTED", "Flagged FIXTURE_OR_MOCK_ID_DETECTED");

    // -------------------------------------------------------------------------
    // TEST 4: Production Readiness Check Decoupling
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Production Readiness Check Decoupling ---");
    const readiness = await runReadinessCheck();
    assert(readiness.infrastructureReady === true, "Infrastructure check is PASS");
    assert(readiness.productionGoLiveReady === false, "Production go-live is BLOCKED while MongoDB rotation is pending");
    assert(readiness.blockers.includes("MONGODB_CREDENTIAL_ROTATION_REQUIRED"), "Flagged MONGODB_CREDENTIAL_ROTATION_REQUIRED");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 19D TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 19D TEST SUITE ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
