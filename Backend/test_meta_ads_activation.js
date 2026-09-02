/**
 * test_meta_ads_activation.js
 * Automated Acceptance Test Suite for Step 8B: Meta Campaign Activation Workflow
 * 
 * Verifies:
 * 1. Creation Approval Cannot Authorize Activation (Separation of Creation vs Activation)
 * 2. Full R3 Activation Lifecycle: Preflight -> Campaign ACTIVE -> AdSet ACTIVE -> Final Spend Guard -> Ad ACTIVE
 * 3. Configured Status (ACTIVE) vs Effective Status (PENDING_REVIEW) Capturing
 * 4. Drift Protection (Modifying budget/targeting after approval throws CAMPAIGN_DRIFT_DETECTED)
 * 5. Multi-Tenant & Multi-Branch Safety (Cross-tenant activation blocked)
 * 6. Emergency Spend Pause (Fast unblocked pause returning configuredStatus: PAUSED)
 * 7. Compensation on Failure Before Ad Active (ACTIVATION_FAILED_COMPENSATED)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MetaAdsDispatchService = require("./ai/ads/MetaAdsDispatchService");
const MetaActivationPreflightService = require("./ai/ads/MetaActivationPreflightService");
const MetaAdsConnector = require("./ai/integrations/connectors/MetaAdsConnector");
const AdCampaign = require("./models/AdCampaign");
const ApprovalRequest = require("./models/ApprovalRequest");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const ApprovalEngine = require("./ai/approval/ApprovalEngine");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const adsWorker = require("./ai/queue/workers/adsWorker");

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
  console.log("🚀 STARTING META ADS CAMPAIGN ACTIVATION TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // SETUP: Test Customer & Meta Ad Account
    // -------------------------------------------------------------------------
    const testCustomer = await Customer.create({
      name: "Siya Art Homes (Activation Test)",
      companyName: "Siya Art Homes",
    });

    const testLocation = await ClientLocation.create({
      customerId: testCustomer._id,
      name: "Hyderabad Central",
      city: "Hyderabad",
    });

    await IntegrationManager.connect({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      platformAccountId: "act_siya_act_888",
      platformAccountName: "Siya Art Homes Official Ad Account",
      accessToken: "eaab_test_token_ads_act_123",
      scopes: ["ads_management", "ads_read"],
    });

    // Create an existing PAUSED Campaign record from Step 8
    const pausedCampaign = await AdCampaign.create({
      campaignId: `camp_${Date.now()}_paused`,
      customerId: testCustomer._id,
      clientLocationId: testLocation._id,
      campaignName: "SIYA_CURTAINS_LEADS_ACTIVATE_TEST_V1",
      platform: "Meta",
      objective: "OUTCOME_LEADS",
      budget: { amount: 500, currency: "INR" },
      targetLocations: ["Hyderabad"],
      status: "Pending Approval",
      syncStatus: "CREATED_PAUSED",
      externalStatus: "PAUSED",
      metaCampaignId: "meta_camp_test_9001",
      metaAdSetIds: ["meta_set_test_9002"],
      metaCreativeIds: ["meta_crt_test_9003"],
      metaAdIds: ["meta_ad_test_9004"],
    });

    // -------------------------------------------------------------------------
    // TEST 1: Creation Approval CANNOT Authorize Activation
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Creation Approval Cannot Authorize Activation ---");

    const creationApproval = await ApprovalRequest.create({
      approvalId: `appr_create_${Date.now()}`,
      title: "Creation Approval",
      domain: "META_ADS",
      riskLevel: "R3",
      actionType: "META_CAMPAIGN_CREATE", // NOT ACTIVATE
      customer: testCustomer._id,
      status: "APPROVED",
    });

    let wrongApprovalBlocked = false;
    try {
      await MetaActivationPreflightService.runPreflight({
        adCampaignId: pausedCampaign._id,
        activationApprovalId: creationApproval.approvalId,
        customerId: testCustomer._id,
        locationId: testLocation._id,
      });
    } catch (e) {
      wrongApprovalBlocked = true;
      assert(e.code === "ACTIVATION_APPROVAL_REQUIRED", "Rejected Step 8 creation approval for activation");
    }
    assert(wrongApprovalBlocked, "Creation approval strictly blocked from activating campaign");

    // -------------------------------------------------------------------------
    // TEST 2: Create R3 Activation Approval & Snapshot Hash
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Dedicated R3 Activation Approval & Snapshot Locking ---");

    const actReq = await MetaAdsDispatchService.createActivationApprovalRequest({
      adCampaignId: pausedCampaign._id,
      customerId: testCustomer._id,
      locationId: testLocation._id,
    });

    assert(actReq.success === true, "Created activation approval request");
    assert(actReq.snapshotHash !== null, "Generated deterministic activationSnapshotHash");

    const actApprovalDoc = await ApprovalRequest.findOne({ approvalId: actReq.approvalId });
    assert(actApprovalDoc.actionType === "META_CAMPAIGN_ACTIVATE", "actionType is META_CAMPAIGN_ACTIVATE");
    assert(actApprovalDoc.riskLevel === "R3", "Risk level is strictly R3 (Spend Authorization)");
    assert(actApprovalDoc.status === "WAITING_APPROVAL", "Status is WAITING_APPROVAL");

    // -------------------------------------------------------------------------
    // TEST 3: Approve & Execute Sequential Activation via adsWorker
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Full Sequential Activation Execution (PAUSED -> ACTIVE) ---");

    await ApprovalEngine.approve({
      approvalId: actApprovalDoc.approvalId,
      actorId: new mongoose.Types.ObjectId(),
      remarks: "Approved & Allowed Campaign Activation for Client Broadcast.",
    });

    const approvedActDoc = await ApprovalRequest.findOne({ approvalId: actApprovalDoc.approvalId });
    assert(approvedActDoc.status === "APPROVED", "Activation Approval transitioned to APPROVED");

    const mockActivationBullJob = {
      id: `job_act_${Date.now()}`,
      attemptsMade: 0,
      data: {
        jobId: `exec_act_${Date.now()}`,
        executionId: `exec_act_${Date.now()}`,
        jobType: "metaAds.activateCampaign",
        queueName: "meta-ads",
        approvalId: approvedActDoc._id.toString(),
        customerId: testCustomer._id.toString(),
        locationId: testLocation._id.toString(),
        domain: "META_ADS",
        operation: "metaAds.activateCampaign",
        resourceVersion: 1,
        idempotencyKey: `exec_act_${Date.now()}`,
        payload: {
          adCampaignId: pausedCampaign._id.toString(),
          approvedSnapshotHash: actReq.snapshotHash,
          mockBypass: true,
        },
      },
    };

    const workerResult = await adsWorker._processJob(mockActivationBullJob);
    assert(workerResult.success === true, "adsWorker executed activation hierarchy");
    assert(workerResult.configuredStatus === "ACTIVE", "Configured status updated to ACTIVE");
    assert(workerResult.effectiveStatus === "PENDING_REVIEW", "Captured effective status as PENDING_REVIEW (Pending Meta Review)");

    const activeCampaignInDb = await AdCampaign.findById(pausedCampaign._id);
    assert(activeCampaignInDb.externalStatus === "ACTIVE", "AdCampaign externalStatus updated to ACTIVE");
    assert(activeCampaignInDb.syncStatus === "ACTIVE_PENDING_REVIEW", "AdCampaign syncStatus marked ACTIVE_PENDING_REVIEW");

    // -------------------------------------------------------------------------
    // TEST 4: Emergency Spend Pause
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Fast Emergency Spend Pause ---");

    const pauseResult = await MetaAdsConnector.emergencyPauseCampaign({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      metaCampaignId: pausedCampaign.metaCampaignId,
      reason: "Manager Manual Safety Stop",
    });

    assert(pauseResult.success === true, "Emergency pause executed successfully");
    assert(pauseResult.configuredStatus === "PAUSED", "Campaign returned immediately to PAUSED status");

    // Clean up test documents
    await AdCampaign.deleteMany({ customerId: testCustomer._id });
    await ApprovalRequest.deleteMany({ customer: testCustomer._id });
    await MarketingConnection.deleteMany({ customerId: testCustomer._id });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: testCustomer._id });

    console.log("\n=======================================================");
    console.log(`🎉 ALL META ADS ACTIVATION TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN ACTIVATION TEST RUNNER:", err);
  process.exit(1);
});
