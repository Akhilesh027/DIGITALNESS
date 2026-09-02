/**
 * productionReadinessCheck.js
 * Pre-flight automated verification script checking environment variables,
 * database connectivity, Redis/BullMQ mode, encryption keys, and mandatory go-live blockers.
 * Zero secrets or raw passwords are printed to stdout.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function runCheck() {
  console.log("\n===============================================================================");
  console.log("🛡️ DIGITALNESS CRM — PRODUCTION PRE-FLIGHT READINESS CHECK");
  console.log("===============================================================================\n");

  let infraPassed = 0;
  let infraFailed = 0;
  const goLiveBlockers = [];

  // 1. Environment & Encryption
  console.log("--- 1. Infrastructure: Environment & Security ---");
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    console.log("  ✅ JWT_SECRET configured and valid.");
    infraPassed++;
  } else {
    console.log("  ❌ JWT_SECRET missing or too short.");
    infraFailed++;
  }

  if (process.env.ENCRYPTION_KEY || process.env.CREDENTIAL_SECRET) {
    console.log("  ✅ AES-256 Vault Encryption Key configured.");
    infraPassed++;
  } else {
    console.log("  ⚠️ AES Vault Key using default runtime fallback.");
  }

  // 2. Database Connectivity
  console.log("\n--- 2. Infrastructure: Database Connectivity ---");
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  try {
    await mongoose.connect(mongoUri);
    console.log("  ✅ MongoDB Atlas: CONNECTED (URI Redacted)");
    infraPassed++;
  } catch (err) {
    console.log(`  ❌ MongoDB Connection Error: ${err.message}`);
    infraFailed++;
  }

  // 3. Queue & Infrastructure Mode
  console.log("\n--- 3. Infrastructure: Queue & BullMQ ---");
  const queueMode = process.env.QUEUE_MODE || "REDIS";
  console.log(`  ℹ️ QUEUE_MODE configured as: ${queueMode}`);
  if (queueMode === "REDIS") {
    console.log("  ✅ BullMQ Production Queue Mode: ACTIVE");
    infraPassed++;
  } else {
    console.log("  ⚠️ Running in local fallback mode.");
  }

  // 4. Mandatory Production Go-Live Blockers
  console.log("\n--- 4. Production Go-Live Blockers Audit ---");
  const isMongoRotated = process.env.MONGODB_CREDENTIAL_ROTATION === "COMPLETED";
  if (!isMongoRotated) {
    console.log("  🛑 BLOCKER: MONGODB_CREDENTIAL_ROTATION is PENDING (Atlas password rotation required).");
    goLiveBlockers.push("MONGODB_CREDENTIAL_ROTATION_REQUIRED");
  } else {
    console.log("  ✅ MONGODB_CREDENTIAL_ROTATION: COMPLETED");
  }

  const liveMetaToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  if (!liveMetaToken) {
    console.log("  🛑 BLOCKER: LIVE_META_CREDENTIALS missing (External read-back requires live account).");
    goLiveBlockers.push("LIVE_META_CREDENTIALS_REQUIRED");
  }

  const isProductionReady = infraFailed === 0 && goLiveBlockers.length === 0;

  console.log("\n===============================================================================");
  console.log(`🏁 INFRASTRUCTURE_CHECK: ${infraFailed === 0 ? "PASS" : "FAIL"}`);
  console.log(`🔒 PRODUCTION_GO_LIVE: ${isProductionReady ? "READY" : "BLOCKED"}`);
  if (goLiveBlockers.length > 0) {
    console.log(`⚠️ ACTIVE GO-LIVE BLOCKERS (${goLiveBlockers.length}):`);
    goLiveBlockers.forEach((b) => console.log(`   - ${b}`));
  }
  console.log("===============================================================================\n");

  await mongoose.connection.close();
  return {
    infrastructureReady: infraFailed === 0,
    productionGoLiveReady: isProductionReady,
    blockers: goLiveBlockers,
  };
}

if (require.main === module) {
  runCheck().then((res) => {
    process.exit(res.productionGoLiveReady ? 0 : 1);
  });
}

module.exports = runCheck;
