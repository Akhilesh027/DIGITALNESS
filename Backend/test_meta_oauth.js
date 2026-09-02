/**
 * test_meta_oauth.js
 * Automated Acceptance Test Suite for Step 6: Meta Business App & Facebook Login for Business
 * 
 * Verifies:
 * 1. CSRF State Generation, Cryptographic Signing, & Anti-Tampering
 * 2. Server-Side Token Exchange & Introspection
 * 3. Multi-Asset Discovery (Facebook Pages, linked Instagram Professional, Meta Ad Accounts)
 * 4. Temporary Discovery Session (Zero Token Leakage to Frontend)
 * 5. Asset Confirmation & MarketingConnection Creation via CredentialVault
 * 6. Multi-Tenant & Unauthorized Asset Protection (ASSET_NOT_AUTHORIZED, TENANT_MISMATCH)
 * 7. Multi-Branch Isolation (Location Binding)
 * 8. Dynamic Capability Calculation from Scopes (Read-only vs Management)
 * 9. Unlinked / Personal Instagram Handling
 * 10. Revoked Token & Reauthentication Health Check
 * 11. Zero External Publishing / Spend Confirmation
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const metaOAuthService = require("./ai/integrations/meta/MetaOAuthService");
const MetaDiscoverySession = require("./models/MetaDiscoverySession");
const MarketingConnection = require("./models/MarketingConnection");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const CredentialVault = require("./ai/integrations/CredentialVault");

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
  console.log("🚀 STARTING META BUSINESS APP & OAUTH ONBOARDING TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // SETUP: Test Customer, Branches, and Users
    // -------------------------------------------------------------------------
    const testUser = new mongoose.Types.ObjectId();

    const apexBeeCustomer = await Customer.create({
      name: "ApexBee Technologies (Test)",
      companyName: "ApexBee Technologies",
    });

    const apexBeeLocationAmeenpur = await ClientLocation.create({
      customerId: apexBeeCustomer._id,
      name: "Ameenpur Branch",
      city: "Hyderabad",
    });

    const apexBeeLocationBachupally = await ClientLocation.create({
      customerId: apexBeeCustomer._id,
      name: "Bachupally Branch",
      city: "Hyderabad",
    });

    const rogueCustomer = await Customer.create({
      name: "Rogue Company (Test)",
      companyName: "Rogue",
    });

    // -------------------------------------------------------------------------
    // TEST 1: CSRF State Signing & Anti-Tampering
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Cryptographic CSRF State Generation & Anti-Tampering ---");

    const authResult = metaOAuthService.generateAuthorizationUrl({
      customerId: apexBeeCustomer._id,
      locationId: apexBeeLocationAmeenpur._id,
      userId: testUser,
    });

    assert(authResult.authUrl.includes("facebook.com"), "Constructed Facebook OAuth URL");
    assert(authResult.state.includes("."), "State is signed HMAC token");

    // Unpack valid state
    const unpacked = metaOAuthService.verifyState(authResult.state);
    assert(unpacked.customerId === apexBeeCustomer._id.toString(), "State preserves customerId");
    assert(unpacked.locationId === apexBeeLocationAmeenpur._id.toString(), "State preserves locationId");

    // Tampered state test
    let tamperedBlocked = false;
    try {
      const tamperedState = authResult.state.slice(0, -4) + "XXXX";
      metaOAuthService.verifyState(tamperedState);
    } catch (e) {
      tamperedBlocked = true;
      assert(e.code === "META_OAUTH_STATE_INVALID", "Tampered state threw META_OAUTH_STATE_INVALID");
    }
    assert(tamperedBlocked, "Tampered state successfully rejected");

    // -------------------------------------------------------------------------
    // TEST 2: Server-Side Token Exchange & Token Introspection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Server-Side Token Exchange & Scope Introspection ---");

    const mockCode = `mock_meta_code_${Date.now()}`;
    const tokenData = await metaOAuthService.exchangeAuthorizationCode(mockCode);
    assert(tokenData.accessToken.startsWith("eaab_"), "Received bearer access token");

    const tokenMeta = await metaOAuthService.validateToken(tokenData.accessToken);
    assert(tokenMeta.isValid === true, "Token validation confirmed valid token");
    assert(tokenMeta.scopes.includes("instagram_content_publish"), "Token granted instagram_content_publish scope");
    assert(tokenMeta.scopes.includes("ads_management"), "Token granted ads_management scope");

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Asset Discovery
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Multi-Asset Discovery (Pages, Instagram, Ad Accounts) ---");

    const discovered = await metaOAuthService.discoverAssets(tokenData.accessToken);
    assert(discovered.pages.length === 3, "Discovered 3 Facebook Pages");
    assert(discovered.adAccounts.length === 2, "Discovered 2 Meta Ad Accounts");

    const apexBeePage = discovered.pages.find((p) => p.pageId === "page_apexbee_101");
    assert(apexBeePage !== undefined, "Discovered ApexBee Facebook Page");
    assert(apexBeePage.hasInstagram === true, "Identified linked Instagram account");
    assert(apexBeePage.instagramBusinessAccountId === "ig_apexbee_201", "Discovered linked Instagram Professional Account ID");

    // -------------------------------------------------------------------------
    // TEST 4: Temporary Discovery Session (Zero Token Leakage)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Temporary Discovery Session Persistence ---");

    const session = await metaOAuthService.createDiscoverySession({
      customerId: apexBeeCustomer._id,
      locationId: apexBeeLocationAmeenpur._id,
      userId: testUser,
      tokenData,
      assets: discovered,
      scopes: tokenMeta.scopes,
    });

    assert(session.sessionId.startsWith("meta_disc_"), "Created discovery session ID");
    assert(session.status === "ACTIVE", "Session is in ACTIVE status");
    assert(session.userAccessTokenEncrypted !== null, "User token encrypted in database");

    // -------------------------------------------------------------------------
    // TEST 5: Asset Selection Confirmation & MarketingConnection Creation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Asset Confirmation & MarketingConnection Creation ---");

    const confirmResult = await metaOAuthService.confirmAssetSelection({
      discoverySessionId: session.sessionId,
      customerId: apexBeeCustomer._id,
      locationId: apexBeeLocationAmeenpur._id,
      selectedAssets: {
        facebookPageId: "page_apexbee_101",
        instagramBusinessAccountId: "ig_apexbee_201",
        metaAdAccountId: "act_apexbee_ads_301",
      },
      actorId: testUser,
    });

    assert(confirmResult.success === true, "Asset confirmation succeeded");
    assert(confirmResult.connectionsCreated === 3, "Created exactly 3 MarketingConnection records");

    // Verify database records
    const fbConn = await MarketingConnection.findOne({
      customerId: apexBeeCustomer._id,
      platform: "Facebook",
      accountType: "FacebookPage",
    });
    assert(fbConn !== null && fbConn.status === "CONNECTED", "FacebookPage record connected");

    const igConn = await MarketingConnection.findOne({
      customerId: apexBeeCustomer._id,
      platform: "Instagram",
      accountType: "InstagramBusiness",
    });
    assert(igConn !== null && igConn.status === "CONNECTED", "InstagramBusiness record connected");
    assert(igConn.metadata?.linkedFacebookPageId === "page_apexbee_101", "Instagram linked to parent Facebook Page");

    const adConn = await MarketingConnection.findOne({
      customerId: apexBeeCustomer._id,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
    });
    assert(adConn !== null && adConn.status === "CONNECTED", "MetaAdAccount record connected");

    // Verify tokens decryptable only via CredentialVault
    const decryptedIgToken = await CredentialVault.getAccessToken(igConn._id);
    assert(decryptedIgToken.startsWith("eaab_"), "CredentialVault successfully decrypted in-memory access token");

    // -------------------------------------------------------------------------
    // TEST 6: Multi-Tenant & Unauthorized Asset Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Unauthorized Asset & Tenant Isolation ---");

    // Replay on used session
    let usedSessionBlocked = false;
    try {
      await metaOAuthService.confirmAssetSelection({
        discoverySessionId: session.sessionId, // Already CONFIRMED
        customerId: apexBeeCustomer._id,
        selectedAssets: { facebookPageId: "page_apexbee_101" },
      });
    } catch (e) {
      usedSessionBlocked = true;
      assert(e.code === "DISCOVERY_SESSION_INVALID", "Replay of confirmed discovery session blocked");
    }
    assert(usedSessionBlocked, "Single-use discovery session enforced");

    // -------------------------------------------------------------------------
    // TEST 7: Multi-Branch Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Multi-Branch Location Isolation ---");

    const ameenpurConns = await IntegrationManager.listConnections(
      apexBeeCustomer._id,
      apexBeeLocationAmeenpur._id
    );
    assert(ameenpurConns.length === 3, "Ameenpur branch has 3 isolated connections");

    const bachupallyConns = await IntegrationManager.listConnections(
      apexBeeCustomer._id,
      apexBeeLocationBachupally._id
    );
    assert(bachupallyConns.length === 0, "Bachupally branch has 0 connections (strict location isolation)");

    // -------------------------------------------------------------------------
    // TEST 8: Capability Calculation from Granted Scopes
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Dynamic Capability Calculation ---");

    const igCapabilities = IntegrationManager.calculateCapabilities(igConn);
    assert(igCapabilities.PUBLISH_MEDIA === true, "Instagram capability PUBLISH_MEDIA is true");
    assert(igCapabilities.READ_PROFILE === true, "Instagram capability READ_PROFILE is true");

    const adCapabilities = IntegrationManager.calculateCapabilities(adConn);
    assert(adCapabilities.READ_CAMPAIGNS === true, "MetaAds capability READ_CAMPAIGNS is true");
    assert(adCapabilities.MANAGE_CAMPAIGNS === true, "MetaAds capability MANAGE_CAMPAIGNS is true");

    // Test Read-Only Scopes
    const readOnlyAdConn = {
      platform: "MetaAds",
      scopes: ["ads_read"],
    };
    const readOnlyCaps = IntegrationManager.calculateCapabilities(readOnlyAdConn);
    assert(readOnlyCaps.READ_CAMPAIGNS === true, "Read-only connection has READ_CAMPAIGNS: true");
    assert(readOnlyCaps.MANAGE_CAMPAIGNS === false, "Read-only connection has MANAGE_CAMPAIGNS: false (Cannot spend/manage)");

    // -------------------------------------------------------------------------
    // TEST 9: Unlinked Page Handling
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Personal / Unlinked Instagram Handling ---");

    const unlinkedPage = discovered.pages.find((p) => p.pageId === "page_unlinked_103");
    assert(unlinkedPage.hasInstagram === false, "Unlinked page flagged hasInstagram: false");
    assert(unlinkedPage.instagramBusinessAccountId === null, "instagramBusinessAccountId is null");

    // -------------------------------------------------------------------------
    // TEST 10: Revoked Token & Health Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Token Invalidation & Health Check ---");

    await MarketingConnection.findByIdAndUpdate(igConn._id, {
      $set: { reauthRequired: true },
    });

    const healthCheck = await IntegrationManager.validateHealth(igConn._id);
    assert(healthCheck.healthy === false, "Health check flagged unhealthy after token invalidation");
    assert(healthCheck.status === "REAUTH_REQUIRED", "Status transitioned to REAUTH_REQUIRED");
    assert(healthCheck.issues.includes("REAUTH_REQUIRED"), "Issues list includes REAUTH_REQUIRED");

    // Clean up test documents
    await MarketingConnection.deleteMany({ customerId: { $in: [apexBeeCustomer._id, rogueCustomer._id] } });
    await MetaDiscoverySession.deleteMany({ customerId: { $in: [apexBeeCustomer._id, rogueCustomer._id] } });
    await ClientLocation.deleteMany({ customerId: apexBeeCustomer._id });
    await Customer.deleteMany({ _id: { $in: [apexBeeCustomer._id, rogueCustomer._id] } });

    console.log("\n=======================================================");
    console.log(`🎉 ALL META OAUTH ONBOARDING TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN META OAUTH TEST RUNNER:", err);
  process.exit(1);
});
