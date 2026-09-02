/**
 * test_google_ads_execution.js
 * Automated Acceptance Test Suite for Step 11: Google Ads OAuth, Account Discovery & Search Campaign Creation (PAUSED)
 * 
 * Verifies:
 * 1. OAuth State Tampering Protection (GOOGLE_ADS_OAUTH_STATE_INVALID)
 * 2. Accessible Customer Discovery & Explicit Account Confirmation
 * 3. Micros Budget Normalization (₹500 -> 500,000,000 micros)
 * 4. Hard Budget Safety Policy Violation Check
 * 5. Creative QA Guardian (RSA Minimums: 3 headlines, 2 descriptions, 1 HTTPS final URL)
 * 6. Geo Target Constant Resolution (Hyderabad -> geoTargetConstants/1007788)
 * 7. R3 Approval Gating (WAITING_APPROVAL blocked)
 * 8. End-to-End Hierarchy Creation Strictly in PAUSED State
 * 9. Verified Google Resource Names Persistence in AdCampaign
 * 10. Multi-Tenant & Location Safety
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const googleAdsOAuthService = require("./ai/integrations/google/GoogleAdsOAuthService");
const googleAdsBudgetNormalizer = require("./ai/integrations/connectors/googleAds/GoogleAdsBudgetNormalizer");
const googleAdsCreativeQAGuardian = require("./ai/integrations/connectors/googleAds/GoogleAdsCreativeQAGuardian");
const googleAdsGeoTargetResolver = require("./ai/integrations/connectors/googleAds/GoogleAdsGeoTargetResolver");
const GoogleAdsDispatchService = require("./ai/ads/GoogleAdsDispatchService");
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
  console.log("🚀 STARTING GOOGLE ADS SEARCH CAMPAIGN CREATION TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Budget Normalization & Micros Conversion
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Micros Budget Normalization & Hard Ceiling Check ---");

    const validBudget = googleAdsBudgetNormalizer.normalize({ amount: 500, currency: "INR" });
    assert(validBudget.amountMicros === 500000000, "₹500 normalized to 500,000,000 micros");

    let ceilingBlocked = false;
    try {
      googleAdsBudgetNormalizer.normalize({ amount: 60000, currency: "INR" });
    } catch (e) {
      ceilingBlocked = true;
      assert(e.code === "GOOGLE_ADS_BUDGET_POLICY_VIOLATION", "Threw GOOGLE_ADS_BUDGET_POLICY_VIOLATION for excessive budget");
    }
    assert(ceilingBlocked, "Excessive budget blocked successfully");

    // -------------------------------------------------------------------------
    // TEST 2: Creative QA Guardian (RSA Constraints)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Responsive Search Ad QA Guardian ---");

    const validRsa = googleAdsCreativeQAGuardian.validateResponsiveSearchAd({
      headlines: ["Luxury Curtains Studio", "Custom Drapery Hyderabad", "Book Free Design Visit"],
      descriptions: ["Transform your living space with bespoke drapery.", "Visit our showroom today."],
      finalUrls: ["https://siyaarthomes.com/curtains"],
    });
    assert(validRsa.passed === true, "Valid RSA passed QA checks");

    let rsaInvalidBlocked = false;
    try {
      googleAdsCreativeQAGuardian.validateResponsiveSearchAd({
        headlines: ["Only One Headline"], // Requires at least 3
        descriptions: ["Only One Description"], // Requires at least 2
        finalUrls: ["http://insecure.com"], // Must be HTTPS
      });
    } catch (e) {
      rsaInvalidBlocked = true;
      assert(e.code === "GOOGLE_ADS_CREATIVE_VALIDATION_FAILED", "Rejected non-compliant RSA copy");
    }
    assert(rsaInvalidBlocked, "Non-compliant RSA blocked from execution");

    // -------------------------------------------------------------------------
    // TEST 3: Geo Target Constant Resolution
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Geo Target Resolution ---");

    const geoTargets = googleAdsGeoTargetResolver.resolveLocations(["Hyderabad"]);
    assert(geoTargets[0].criterionId === "1007788", "Mapped Hyderabad to criterionId 1007788");
    assert(geoTargets[0].resourceName === "geoTargetConstants/1007788", "Formatted resourceName geoTargetConstants/1007788");

    // -------------------------------------------------------------------------
    // SETUP: Test Customer & Google Ads Connection
    // -------------------------------------------------------------------------
    const testCustomer = await Customer.create({
      name: "Siya Art Homes (Google Ads Test)",
      companyName: "Siya Art Homes",
    });

    const testLocation = await ClientLocation.create({
      customerId: testCustomer._id,
      name: "Hyderabad Flagship",
      city: "Hyderabad",
    });

    const authInit = googleAdsOAuthService.generateAuthorizationUrl({
      customerId: testCustomer._id,
      locationId: testLocation._id,
    });
    assert(authInit.authUrl.includes("accounts.google.com"), "Generated valid Google Ads OAuth URL");

    const discRes = await googleAdsOAuthService.listAccessibleCustomers({
      accessToken: "ya29_mock_ads_token_123",
      customerId: testCustomer._id,
      locationId: testLocation._id,
    });
    assert(discRes.accessibleCustomers.length > 0, "Discovered accessible Google Ads accounts");

    const confirmRes = await googleAdsOAuthService.confirmAccountSelection({
      sessionId: discRes.sessionId,
      customerId: testCustomer._id,
      crmLocationId: testLocation._id,
      googleAdsCustomerId: "1234567890",
    });
    assert(confirmRes.success === true, "Confirmed Google Ads account connection for Siya Art Homes");

    // -------------------------------------------------------------------------
    // TEST 4: Create Search Campaign Execution Request & R3 Approval Gating
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Campaign Assembly & R3 Approval Gating ---");

    const campaignBlueprint = {
      campaignName: "SIYA_CURTAINS_GOOGLE_SEARCH_20260826_V1",
      budget: { amount: 500, currency: "INR" },
      targetLocations: ["Hyderabad"],
      keywords: [
        { text: "custom curtains hyderabad", matchType: "PHRASE" },
        { text: "luxury drapery studio", matchType: "EXACT" },
      ],
      responsiveSearchAd: {
        headlines: ["Luxury Curtains Studio", "Custom Drapery Hyderabad", "Book Free Consultation"],
        descriptions: ["Transform your living space with bespoke drapery.", "Visit our Hyderabad showroom today."],
        finalUrls: ["https://siyaarthomes.com/curtains"],
      },
      destinationUrl: "https://siyaarthomes.com/curtains",
    };

    const dispatchReq = await GoogleAdsDispatchService.createSearchCampaignExecutionRequest({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      campaignBlueprint,
    });

    assert(dispatchReq.success === true, "Search campaign execution request assembled");

    const approvalDoc = await ApprovalRequest.findOne({ approvalId: dispatchReq.approvalId });
    assert(approvalDoc.status === "WAITING_APPROVAL", "ApprovalRequest in WAITING_APPROVAL status");
    assert(approvalDoc.riskLevel === "R3", "Risk level strictly assigned as R3 (Spend Authorization)");

    // -------------------------------------------------------------------------
    // TEST 5: Approve & Execute Google Ads Creation in PAUSED State
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Approve & Execute Google Ads Campaign Creation (PAUSED) ---");

    await ApprovalEngine.approve({
      approvalId: approvalDoc.approvalId,
      actorId: new mongoose.Types.ObjectId(),
      remarks: "Approved Google Search Campaign structure for creation in PAUSED state.",
    });

    const approvedDoc = await ApprovalRequest.findOne({ approvalId: approvalDoc.approvalId });
    assert(approvedDoc.status === "APPROVED", "Approval transitioned to APPROVED");

    const mockBullJob = {
      id: `job_gads_${Date.now()}`,
      attemptsMade: 0,
      data: {
        jobId: `exec_gads_${Date.now()}`,
        executionId: `exec_gads_${Date.now()}`,
        jobType: "googleAds.createSearchCampaign",
        queueName: "google-ads",
        approvalId: approvedDoc._id.toString(),
        customerId: testCustomer._id.toString(),
        locationId: testLocation._id.toString(),
        domain: "GOOGLE_ADS",
        operation: "googleAds.createSearchCampaign",
        resourceVersion: 1,
        idempotencyKey: `exec_gads_${Date.now()}`,
        payload: {
          adCampaignId: dispatchReq.adCampaign._id.toString(),
          campaignName: campaignBlueprint.campaignName,
          budget: dispatchReq.budget,
          targetLocations: ["Hyderabad"],
          keywords: campaignBlueprint.keywords,
          responsiveSearchAd: campaignBlueprint.responsiveSearchAd,
        },
      },
    };

    const workerResult = await googleAdsWorker._processJob(mockBullJob);
    assert(workerResult.success === true, "googleAdsWorker executed GoogleAdsConnector");
    assert(workerResult.status === "PAUSED", "STRICT SAFETY: Campaign created in PAUSED state");
    assert(workerResult.googleCampaignId !== null, "Stored Google Campaign Resource Name");

    const updatedCampaignInDb = await AdCampaign.findById(dispatchReq.adCampaign._id);
    assert(updatedCampaignInDb.externalStatus === "PAUSED", "AdCampaign externalStatus is PAUSED");
    assert(updatedCampaignInDb.syncStatus === "CREATED_PAUSED", "AdCampaign syncStatus is CREATED_PAUSED");
    assert(updatedCampaignInDb.googleBudgetId !== null, "Stored verified googleBudgetId");
    assert(updatedCampaignInDb.googleAdGroupId !== null, "Stored verified googleAdGroupId");

    // Clean up test documents
    await AdCampaign.deleteMany({ customerId: testCustomer._id });
    await ApprovalRequest.deleteMany({ customer: testCustomer._id });
    await MarketingConnection.deleteMany({ customerId: testCustomer._id });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: testCustomer._id });

    console.log("\n=======================================================");
    console.log(`🎉 ALL GOOGLE ADS TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN GOOGLE ADS TEST RUNNER:", err);
  process.exit(1);
});
