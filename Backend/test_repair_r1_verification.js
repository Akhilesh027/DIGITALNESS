const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { encryptToken, decryptToken } = require("./utils/cryptoUtil");
const MarketingConnection = require("./models/MarketingConnection");
const Customer = require("./models/Customer");
const User = require("./models/User");
const ToolRegistry = require("./ai/tools/ToolRegistry");
const { buildAgentContext } = require("./services/agentContextService");
const AuditLog = require("./models/AuditLog");

async function runVerification() {
  console.log("==================================================");
  console.log("REPAIR R1.1 — SECURITY & DATA INTEGRITY VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let total = 6;

  // TEST 1: AES-256-GCM Authenticated Encryption
  console.log("\n[TEST 1] Testing AES-256-GCM Token Encryption...");
  const rawToken = "TEST_TOKEN_PLAINTEXT_12345";
  const encrypted = encryptToken(rawToken);
  const decrypted = decryptToken(encrypted);

  if (encrypted.startsWith("enc:gcm:") && decrypted === rawToken) {
    console.log("  ✓ AES-256-GCM Encryption & Decryption PASSED.");
    console.log(`    Encrypted Format: ${encrypted.slice(0, 35)}...`);
    passed++;
  } else {
    console.error("  ❌ AES-256-GCM Encryption FAILED.");
  }

  // TEST 2: Double Encryption Prevention
  console.log("\n[TEST 2] Testing Double-Encryption Protection...");
  const reEncrypted = encryptToken(encrypted);
  if (reEncrypted === encrypted) {
    console.log("  ✓ Double Encryption Protection PASSED (Token remained intact).");
    passed++;
  } else {
    console.error("  ❌ Double Encryption Protection FAILED.");
  }

  // Connect to DB for remaining tests
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);

    // TEST 3: Database Encryption & Token Leak Prevention
    console.log("\n[TEST 3] Testing Database Token Encryption & Exclusion...");
    let testCustomer = await Customer.findOne().lean();
    if (!testCustomer) {
      testCustomer = await Customer.create({
        name: "Test Audit Client",
        companyName: "Audit Co",
        email: "audit@test.com",
        phone: "9000000000",
      });
    }

    const conn = await MarketingConnection.create({
      customerId: testCustomer._id,
      platform: "Meta",
      accountType: "FacebookPage",
      platformAccountId: "test_acc_" + Date.now(),
      platformAccountName: "Test Page",
      accessToken: "TEST_SECRET_TOKEN_9999",
    });

    // Query directly from DB
    const rawDBRecord = await MarketingConnection.findById(conn._id).select("+accessToken").lean();
    if (rawDBRecord.accessToken.startsWith("enc:gcm:") && !rawDBRecord.accessToken.includes("TEST_SECRET_TOKEN_9999")) {
      console.log("  ✓ Database Token Encryption PASSED (Stored as enc:gcm ciphertext).");
      passed++;
    } else {
      console.error("  ❌ Database Token Encryption FAILED.");
    }

    // TEST 4: Sanitized AI Context Leak Prevention
    console.log("\n[TEST 4] Testing AI Context Sanitization (Zero Token Material)...");
    const aiContext = await buildAgentContext({
      customerId: testCustomer._id,
      agentType: "Social",
    });
    const serializedContext = JSON.stringify(aiContext);

    if (
      !serializedContext.includes("TEST_SECRET_TOKEN_9999") &&
      !serializedContext.includes("enc:gcm:")
    ) {
      console.log("  ✓ AI Context Leak Prevention PASSED (Zero tokens/ciphertexts in context).");
      passed++;
    } else {
      console.error("  ❌ AI Context Leak Prevention FAILED.");
    }

    // TEST 5: Branch Authorization Policy Enforcement
    console.log("\n[TEST 5] Testing Branch Authorization Enforcement...");
    try {
      await ToolRegistry.executeTool(
        "createWork",
        { title: "Test Branch Work", customerId: testCustomer._id, branchId: "BR002" },
        { userId: null, userRole: "Operational Manager", branchId: "BR001" }
      );
      console.error("  ❌ Branch Authorization Policy FAILED (Unauthorized cross-branch write permitted).");
    } catch (branchErr) {
      if (branchErr.message.includes("Unauthorized branch access") || branchErr.message.includes("Branch authorization required")) {
        console.log("  ✓ Branch Authorization Policy PASSED (Unauthorized cross-branch write blocked).");
        console.log(`    Caught Error: "${branchErr.message}"`);
        passed++;
      } else {
        console.error(`  ❌ Branch Authorization FAILED with unexpected error: ${branchErr.message}`);
      }
    }

    // TEST 6: Audit Log Token Leak Check
    console.log("\n[TEST 6] Testing Audit Log Token Leak Prevention...");
    const auditLogs = await AuditLog.find({ customerId: testCustomer._id }).lean();
    const serializedAudit = JSON.stringify(auditLogs);
    if (!serializedAudit.includes("TEST_SECRET_TOKEN_9999") && !serializedAudit.includes("enc:gcm:")) {
      console.log("  ✓ Audit Log Token Leak Prevention PASSED.");
      passed++;
    } else {
      console.error("  ❌ Audit Log Token Leak Prevention FAILED.");
    }

    // Cleanup test connection
    await MarketingConnection.findByIdAndDelete(conn._id);
    await mongoose.disconnect();
  } else {
    console.log("\n[Skipped DB tests: MONGO_URI not found]");
  }

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  if (passed === total) {
    console.log("RESULT: R1 VERIFIED & LOCKED 🔒");
  } else {
    console.log("RESULT: R1 IMPLEMENTED — VERIFICATION FAILURES REMAIN ⚠️");
  }
  console.log("==================================================");
}

runVerification().catch((err) => console.error("Verification error:", err));
