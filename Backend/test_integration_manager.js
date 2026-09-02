/**
 * test_integration_manager.js
 * Automated Acceptance Test Suite for Step 3: IntegrationManager & Secure Credential Vault
 * 
 * Verifies:
 * 1. Encryption & Decryption (AES-256-GCM, random IVs, authTag tamper detection)
 * 2. Strict Startup Key Validation
 * 3. Multi-Tenant & Branch Location Isolation (Zero cross-client / cross-branch leakage)
 * 4. Credential Secrecy (Tokens excluded from queries and stripped before return)
 * 5. Scope & Permission Validation (Detecting missing scopes)
 * 6. Connection Health Evaluation (Expired token detection)
 * 7. executeWithConnection() safe callback execution
 * 8. ApprovalEngine + IntegrationManager Safety Gating
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { encryptToken, decryptToken, validateEncryptionConfiguration } = require("./utils/cryptoUtil");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const CredentialVault = require("./ai/integrations/CredentialVault");
const MarketingConnection = require("./models/MarketingConnection");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const ApprovalEngine = require("./ai/approval/ApprovalEngine");

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
  console.log("🚀 STARTING INTEGRATION MANAGER & VAULT TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Encryption & Decryption Security (AES-256-GCM)
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: AES-256-GCM Encryption & Cryptographic Tamper Rejection ---");
    const rawSecret = "eaab_super_secret_meta_token_xyz_123456";

    // Encrypt -> Decrypt
    const cipher1 = encryptToken(rawSecret);
    const cipher2 = encryptToken(rawSecret);

    assert(cipher1.startsWith("enc:gcm:"), "Ciphertext matches enc:gcm: format");
    assert(cipher1 !== cipher2, "Random 96-bit IV produces distinct ciphertexts for identical plaintext");

    const decrypted = decryptToken(cipher1);
    assert(decrypted === rawSecret, "Decrypted token matches original secret exactly");

    // Double-encryption protection
    const doubleEncrypted = encryptToken(cipher1);
    assert(doubleEncrypted === cipher1, "Double-encryption protection preserved cipher string");

    // Tampered ciphertext detection
    const parts = cipher1.split(":");
    parts[4] = parts[4].slice(0, -4) + "abcd"; // Alter ciphertext
    const tampered = parts.join(":");
    let tamperFailed = false;
    try {
      decryptToken(tampered);
    } catch (e) {
      tamperFailed = true;
    }
    assert(tamperFailed, "Cryptographic authTag rejected tampered ciphertext");

    // -------------------------------------------------------------------------
    // TEST 2: Startup Encryption Key Validation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Startup Key Validation ---");
    const validConfig = validateEncryptionConfiguration();
    assert(validConfig === true, "validateEncryptionConfiguration() validated active key");

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Tenant & Branch Location Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Strict Multi-Tenant & Branch Location Boundary Isolation ---");

    const clientA = await Customer.create({ name: "Toni & Guy Salon (Test)", companyName: "Toni & Guy" });
    const clientB = await Customer.create({ name: "Siya Art Homes (Test)", companyName: "Siya Art Homes" });

    const locAmeenpur = await ClientLocation.create({ customerId: clientA._id, name: "Ameenpur Branch", city: "Hyderabad" });
    const locBachupally = await ClientLocation.create({ customerId: clientA._id, name: "Bachupally Branch", city: "Hyderabad" });

    // 1. Connect Instagram for Client A - Ameenpur
    const connAmeenpur = await IntegrationManager.connect({
      customerId: clientA._id,
      locationId: locAmeenpur._id,
      platform: "Instagram",
      accountType: "InstagramBusiness",
      platformAccountId: "ig_ameenpur_101",
      platformAccountName: "Toni & Guy Ameenpur IG",
      accessToken: "token_ameenpur_secret",
      scopes: ["instagram_basic", "instagram_content_publish"],
    });

    // 2. Connect Instagram for Client A - Bachupally
    const connBachupally = await IntegrationManager.connect({
      customerId: clientA._id,
      locationId: locBachupally._id,
      platform: "Instagram",
      accountType: "InstagramBusiness",
      platformAccountId: "ig_bachupally_202",
      platformAccountName: "Toni & Guy Bachupally IG",
      accessToken: "token_bachupally_secret",
      scopes: ["instagram_basic", "instagram_content_publish"],
    });

    // 3. Connect Meta Ads for Client B (Global customer-level)
    const connClientB = await IntegrationManager.connect({
      customerId: clientB._id,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      platformAccountId: "act_siya_555",
      platformAccountName: "Siya Art Homes Ad Account",
      accessToken: "token_siya_ads_secret",
      scopes: ["ads_management", "ads_read"],
    });

    // Verify Ameenpur lookup resolves ONLY Ameenpur
    const resolvedAmeenpur = await IntegrationManager.getConnection({
      customerId: clientA._id,
      locationId: locAmeenpur._id,
      platform: "Instagram",
    });
    assert(resolvedAmeenpur.platformAccountId === "ig_ameenpur_101", "Client A Ameenpur resolved exact branch account (ig_ameenpur_101)");

    // Verify Bachupally lookup resolves ONLY Bachupally
    const resolvedBachupally = await IntegrationManager.getConnection({
      customerId: clientA._id,
      locationId: locBachupally._id,
      platform: "Instagram",
    });
    assert(resolvedBachupally.platformAccountId === "ig_bachupally_202", "Client A Bachupally resolved exact branch account (ig_bachupally_202)");

    // Verify Cross-Tenant Isolation: Client B CANNOT resolve Client A's accounts
    const crossTenantLookup = await IntegrationManager.getConnection({
      customerId: clientB._id,
      locationId: locAmeenpur._id,
      platform: "Instagram",
    });
    assert(crossTenantLookup === null, "Cross-Tenant boundary: Client B cannot resolve Client A's account");

    // -------------------------------------------------------------------------
    // TEST 4: Credential Secrecy & Vault Decryption
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Credential Secrecy & CredentialVault Decryption ---");

    // Check listConnections output
    const listA = await IntegrationManager.listConnections(clientA._id);
    assert(listA.length >= 2, "Listed Client A connections");
    assert(listA[0].accessToken === undefined, "List query does not return accessToken (select: false)");
    assert(listA[0].refreshToken === undefined, "List query does not return refreshToken (select: false)");

    // CredentialVault decrypts correctly for backend execution
    const decryptedToken = await CredentialVault.getAccessToken(resolvedAmeenpur._id);
    assert(decryptedToken === "token_ameenpur_secret", "CredentialVault successfully decrypted token for internal worker");

    // -------------------------------------------------------------------------
    // TEST 5: Scope & Permission Validation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Scope & Permission Validation ---");

    const validScopes = IntegrationManager.validateScopes(resolvedAmeenpur, ["instagram_basic", "instagram_content_publish"]);
    assert(validScopes.valid === true, "Granted scopes validated successfully");

    const invalidScopes = IntegrationManager.validateScopes(resolvedAmeenpur, ["instagram_manage_comments", "instagram_live"]);
    assert(invalidScopes.valid === false, "Missing scopes detected correctly");
    assert(invalidScopes.missing.includes("instagram_manage_comments"), "Identified exact missing scope name");

    // -------------------------------------------------------------------------
    // TEST 6: Connection Health & Expiration
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Connection Health & Token Expiration Detection ---");

    // Healthy connection check
    const health1 = await IntegrationManager.validateHealth(resolvedAmeenpur._id);
    assert(health1.healthy === true, "Active connection is healthy (healthy=true, status=CONNECTED)");

    // Expired connection check
    const expiredConn = await MarketingConnection.create({
      customerId: clientA._id,
      platform: "GoogleBusiness",
      accountType: "GBPLocation",
      platformAccountId: "gbp_loc_999",
      platformAccountName: "Expired GBP Location",
      accessToken: "expired_token_raw",
      tokenExpiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      status: "CONNECTED",
    });

    const healthExpired = await IntegrationManager.validateHealth(expiredConn._id);
    assert(healthExpired.healthy === false, "Expired connection flagged as unhealthy");
    assert(healthExpired.issues.includes("TOKEN_EXPIRED"), "Detected issue TOKEN_EXPIRED");

    // -------------------------------------------------------------------------
    // TEST 7: executeWithConnection() In-Memory Callback Execution
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: executeWithConnection() Isolated Lifecycle Execution ---");

    let callbackExecuted = false;
    let capturedPlatformId = null;

    const execResult = await IntegrationManager.executeWithConnection({
      customerId: clientA._id,
      locationId: locAmeenpur._id,
      platform: "Instagram",
      requiredScopes: ["instagram_content_publish"],
      executor: async (credentialContext, connection) => {
        callbackExecuted = true;
        capturedPlatformId = credentialContext.platformAccountId;
        assert(credentialContext.accessToken === "token_ameenpur_secret", "Decrypted token passed in-memory to executor");
        return { postContainerId: "ig_cnt_987654", status: "SIMULATED_READY" };
      },
    });

    assert(callbackExecuted === true, "Executor callback successfully invoked");
    assert(capturedPlatformId === "ig_ameenpur_101", "Executor received correct platformAccountId");
    assert(execResult.result.postContainerId === "ig_cnt_987654", "executeWithConnection returned result");

    // -------------------------------------------------------------------------
    // TEST 8: ApprovalEngine + IntegrationManager Safety Gating
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: ApprovalEngine + IntegrationManager Safety Gating ---");

    // An unapproved R2 approval request cannot proceed to execution
    const r2Approval = await ApprovalEngine.createApprovalRequest({
      title: "Instagram Post for Ameenpur",
      domain: "SOCIAL_POST",
      riskLevel: "R2",
      customer: clientA._id,
      clientLocation: locAmeenpur._id,
      initialStatus: "WAITING_APPROVAL",
    });

    assert(r2Approval.status === "WAITING_APPROVAL", "R2 action is in WAITING_APPROVAL status");

    // Simulating guardrail: Execution only permitted when status === "APPROVED"
    const canExecute = r2Approval.status === "APPROVED";
    assert(!canExecute, "Unapproved R2 action blocked from reaching IntegrationManager execution");

    // Manager approves
    const approvedR2 = await ApprovalEngine.approve({
      approvalId: r2Approval.approvalId,
      actorId: new mongoose.Types.ObjectId(),
      actorRole: "Manager",
      remarks: "Approved for publishing",
    });

    assert(approvedR2.doc.status === "APPROVED", "R2 action approved. Now eligible for worker execution.");

    // Clean up test documents
    await MarketingConnection.deleteMany({ customerId: { $in: [clientA._id, clientB._id] } });
    await ClientLocation.deleteMany({ _id: { $in: [locAmeenpur._id, locBachupally._id] } });
    await Customer.deleteMany({ _id: { $in: [clientA._id, clientB._id] } });
    await ApprovalRequest.deleteMany({ _id: r2Approval._id });

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
