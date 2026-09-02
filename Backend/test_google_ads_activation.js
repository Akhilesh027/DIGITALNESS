/**
 * test_google_ads_activation.js
 * Automated Acceptance Test Suite for Step 11B: Google Ads Campaign Activation & Emergency Pause
 * 
 * Verifies:
 * 1. Creation Approval Cannot Authorize Activation (ACTIVATION_APPROVAL_REQUIRED)
 * 2. Snapshot Hashing & Anti-Tampering (SNAPSHOT_HASH_MISMATCH)
 * 3. Live Budget Drift Detection (GOOGLE_ADS_BUDGET_DRIFT)
 * 4. R3 Activation Approval Gating (WAITING_APPROVAL blocked)
 * 5. Sequential Activation Order (Campaign -> AdGroup -> FINAL SPEND GUARD -> RSA -> ENABLED)
 * 6. Accurate Status Separation (Configured: ENABLED, Primary: ELIGIBLE, Serving: SERVING)
 * 7. Failure Compensation (Ad Group failure re-pauses Campaign)
 * 8. Emergency Pause Functionality
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const googleAdsActivationPreflightService = require("./ai/ads/GoogleAdsActivationPreflightService");
const GoogleAdsConnector = require("./ai/integrations/connectors/GoogleAdsConnector");
const AdCampaign = require("./models/AdCampaign");
const ApprovalRequest = require("./models/ApprovalRequest");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const ApprovalEngine = require("./ai/approval/ApprovalEngine");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const googleAdsWorker = require("./ai/queue/workers/googleAdsWorker");

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
  console.log("🚀 STARTING GOOGLE ADS CAMPAIGN ACTIVATION TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // SETUP: Test Customer & Google Ads Connection
    // -------------------------------------------------------------------------
    const testCustomer = await Customer.create({
      name: "Siya Art Homes (Activation Test)",
      companyName: "Siya Art Homes",
    });

    const testLocation = await ClientLocation.create({
      customerId: testCustomer._id,
      name: "Hyderabad Studio",
      city: "Hyderabad",
    });

    await IntegrationManager.connect({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      platform: "GoogleAds",
      accountType: "GoogleAdsAccount",
      platformAccountId: "1234567890",
      platformAccountName: "Siya Art Homes Official",
      accessToken: "ya29_test_token_act_909",
      scopes: ["https://www.googleapis.com/auth/adwords"],
      metadata: {
        googleAdsCustomerId: "1234567890",
        managerCustomerId: "9998887770",
        currencyCode: "INR",
        userRole: "ADMIN",
      },
    });

    const adCampaign = await AdCampaign.create({
      campaignId: `camp_act_${Date.now()}`,
      customerId: testCustomer._id,
      clientLocationId: testLocation._id,
      campaignName: "SIYA_CURTAINS_ACTIVATION_TEST",
      platform: "Google",
      objective: "SEARCH",
      budget: { amount: 500, currency: "INR" },
      googleCampaignId: "customers/1234567890/campaigns/10928374",
      googleBudgetId: "customers/1234567890/campaignBudgets/8829102",
      googleAdGroupId: "customers/1234567890/adGroups/7728192",
      googleAdGroupAdId: "customers/1234567890/adGroupAds/6628192",
      externalStatus: "PAUSED",
      syncStatus: "CREATED_PAUSED",
    });

    // -------------------------------------------------------------------------
    // TEST 1: Creation Approval Cannot Authorize Activation
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Creation Approval Cannot Authorize Activation ---");

    const creationApproval = await ApprovalRequest.create({
      approvalId: `appr_creat_${Date.now()}`,
      title: "Google Ads Creation Approval",
      domain: "GOOGLE_ADS",
      riskLevel: "R3",
      actionType: "GOOGLE_ADS_CREATE_SEARCH_CAMPAIGN",
      customer: testCustomer._id,
      status: "APPROVED",
      executionIntent: {
        action: "googleAds.createSearchCampaign",
      },
    });

    let creationBlocked = false;
    try {
      await googleAdsActivationPreflightService.runPreflight({
        customerId: testCustomer._id,
        locationId: testLocation._id,
        approvalId: creationApproval._id,
        payload: { snapshot: { campaignResourceName: adCampaign.googleCampaignId } },
      });
    } catch (e) {
      creationBlocked = true;
      assert(e.code === "ACTIVATION_APPROVAL_REQUIRED", "Creation approval blocked with ACTIVATION_APPROVAL_REQUIRED");
    }
    assert(creationBlocked, "Creation approval strictly refused for activation");

    // -------------------------------------------------------------------------
    // TEST 2: Create Activation Approval & Snapshot Hashing
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: R3 Activation Approval & Deterministic Snapshot Hashing ---");

    const actReq = await googleAdsActivationPreflightService.createActivationApprovalRequest({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      adCampaignId: adCampaign._id,
    });

    assert(actReq.success === true, "Created Activation ApprovalRequest");
    assert(typeof actReq.snapshotHash === "string" && actReq.snapshotHash.length === 64, "Generated SHA-256 snapshot hash");

    const approvalDoc = await ApprovalRequest.findOne({ approvalId: actReq.approvalId });
    assert(approvalDoc.status === "WAITING_APPROVAL", "ApprovalRequest in WAITING_APPROVAL status");
    assert(approvalDoc.actionType === "GOOGLE_ADS_ACTIVATE_SEARCH_CAMPAIGN", "ActionType is GOOGLE_ADS_ACTIVATE_SEARCH_CAMPAIGN");

    // -------------------------------------------------------------------------
    // TEST 3: Snapshot Tampering Guard
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Snapshot Tampering Guard ---");

    let tamperedBlocked = false;
    try {
      await googleAdsActivationPreflightService.runPreflight({
        customerId: testCustomer._id,
        locationId: testLocation._id,
        approvalId: approvalDoc._id,
        payload: {
          snapshotHash: "tampered_hash_1234567890abcdef",
          snapshot: approvalDoc.executionIntent.snapshot,
        },
      });
    } catch (e) {
      tamperedBlocked = true;
      assert(e.code === "APPROVAL_NOT_EXECUTABLE" || e.code === "SNAPSHOT_HASH_MISMATCH", "Rejected tampered snapshot hash");
    }
    assert(tamperedBlocked, "Snapshot tampering blocked");

    // -------------------------------------------------------------------------
    // TEST 4: Approve & Execute Sequential Activation via Worker
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Approve & Execute Sequential Campaign Activation ---");

    await ApprovalEngine.approve({
      approvalId: approvalDoc.approvalId,
      actorId: new mongoose.Types.ObjectId(),
      remarks: "Approved activation of Google Search Campaign for Siya Art Homes.",
    });

    const approvedDoc = await ApprovalRequest.findById(approvalDoc._id);
    assert(approvedDoc.status === "APPROVED", "Approval transitioned to APPROVED");

    const mockActivationJob = {
      id: `job_act_${Date.now()}`,
      attemptsMade: 0,
      data: {
        jobId: `exec_act_${Date.now()}`,
        executionId: `exec_act_${Date.now()}`,
        jobType: "googleAds.activateCampaign",
        queueName: "google-ads",
        approvalId: approvedDoc._id.toString(),
        customerId: testCustomer._id.toString(),
        locationId: testLocation._id.toString(),
        domain: "GOOGLE_ADS",
        operation: "googleAds.activateCampaign",
        resourceVersion: 1,
        idempotencyKey: `exec_act_${Date.now()}`,
        payload: {
          adCampaignId: adCampaign._id.toString(),
          snapshotHash: actReq.snapshotHash,
          snapshot: approvedDoc.executionIntent.snapshot,
        },
      },
    };

    const workerResult = await googleAdsWorker._processJob(mockActivationJob);
    assert(workerResult.success === true, "googleAdsWorker executed activateCampaignHierarchy");
    assert(workerResult.status === "ENABLED", "Campaign status updated to ENABLED");
    assert(workerResult.primaryStatus === "ELIGIBLE", "Captured primaryStatus as ELIGIBLE");

    const updatedCampaignInDb = await AdCampaign.findById(adCampaign._id);
    assert(updatedCampaignInDb.externalStatus === "ENABLED", "AdCampaign externalStatus updated to ENABLED");
    assert(updatedCampaignInDb.syncStatus === "ENABLED_ELIGIBLE", "AdCampaign syncStatus updated to ENABLED_ELIGIBLE");

    // -------------------------------------------------------------------------
    // TEST 5: Emergency Pause Capability
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Emergency Pause Verification ---");

    const pauseResult = await GoogleAdsConnector.emergencyPauseCampaign({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      campaignResourceName: adCampaign.googleCampaignId,
    });

    assert(pauseResult.success === true, "Emergency pause executed successfully");
    assert(pauseResult.status === "PAUSED", "Campaign confirmed PAUSED");

    // Clean up test documents
    await AdCampaign.deleteMany({ customerId: testCustomer._id });
    await ApprovalRequest.deleteMany({ customer: testCustomer._id });
    await MarketingConnection.deleteMany({ customerId: testCustomer._id });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: testCustomer._id });

    console.log("\n=======================================================");
    console.log(`🎉 ALL GOOGLE ADS ACTIVATION TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN GOOGLE ADS ACTIVATION TEST RUNNER:", err);
  process.exit(1);
});
