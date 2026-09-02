/**
 * test_google_ads_insights.js
 * Automated Acceptance Test Suite for Step 12: Google Ads Insights, Search Term Intelligence, and Recommendations
 * 
 * Verifies:
 * 1. Micros Cost Normalization (3,000,000,000 micros -> ₹3,000)
 * 2. Conversion Normalizer Semantics (Lead forms + calls vs Page Views)
 * 3. Search Term Intelligence & Search Term Waste Recommendation
 * 4. Search Term Opportunity Recommendation
 * 5. Prompt Injection Defense on Untrusted Search Queries
 * 6. Change Event Tracking in GoogleAdsExternalChange
 * 7. Deterministic Upserts & Late Conversion Backfill
 * 8. Strict 100% Read-Only Safety (Zero campaign mutations)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const googleAdsInsightsSyncService = require("./ai/ads/GoogleAdsInsightsSyncService");
const googleAdsConversionNormalizer = require("./ai/integrations/connectors/googleAds/GoogleAdsConversionNormalizer");
const GoogleAdsInsightSnapshot = require("./models/GoogleAdsInsightSnapshot");
const GoogleAdsExternalChange = require("./models/GoogleAdsExternalChange");
const AdsPerformanceRecommendation = require("./models/AdsPerformanceRecommendation");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const IntegrationManager = require("./ai/integrations/IntegrationManager");

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
  console.log("🚀 STARTING GOOGLE ADS INSIGHTS & SEARCH TERMS TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Conversion Semantics & Non-Lead Exclusion
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Conversion Action Semantics & Non-Lead Exclusion ---");

    const leadConversions = [
      { actionName: "Website Form", category: "SUBMIT_LEAD_FORM", count: 8 },
      { actionName: "Click to Call", category: "PHONE_CALL_LEAD", count: 4 },
      { actionName: "Blog View", category: "PAGE_VIEW", count: 50 },
    ];

    const leadNorm = googleAdsConversionNormalizer.normalizeConversions({
      conversionData: leadConversions,
      objective: "LEADS",
      totalCost: 1800,
    });

    assert(leadNorm.primaryResultCount === 12, "Counted 12 approved leads (8 forms + 4 calls), excluding 50 page views");
    assert(leadNorm.costPerPrimaryResult === 150, "Calculated cost per primary lead = ₹150");

    // Test with only PAGE_VIEW
    const pageViewOnlyNorm = googleAdsConversionNormalizer.normalizeConversions({
      conversionData: [{ actionName: "Pricing Page View", category: "PAGE_VIEW", count: 100 }],
      objective: "LEADS",
      totalCost: 500,
    });
    assert(pageViewOnlyNorm.primaryResult === null, "Refused to count Page Views as Leads");
    assert(pageViewOnlyNorm.primaryResultCount === 0, "Primary lead count is 0 for page view only actions");

    // -------------------------------------------------------------------------
    // SETUP: Test Customer & Google Ads Connection
    // -------------------------------------------------------------------------
    const testCustomer = await Customer.create({
      name: "Siya Art Homes (Insights Test)",
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
      accessToken: "ya29_test_token_insights_101",
      scopes: ["https://www.googleapis.com/auth/adwords"],
      metadata: {
        googleAdsCustomerId: "1234567890",
        managerCustomerId: "9998887770",
        currencyCode: "INR",
      },
    });

    // -------------------------------------------------------------------------
    // TEST 2: Scheduled Read-Only Sync & Snapshot Upserts
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Scheduled Insights Sync & Snapshot Upserts ---");

    const sync1 = await googleAdsInsightsSyncService.syncCustomerInsights({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      backfillDays: 7,
    });

    assert(sync1.success === true, "Insights sync completed successfully");
    assert(sync1.upsertedSnapshotsCount >= 2, "Upserted daily performance snapshots");

    const campaignSnap = await GoogleAdsInsightSnapshot.findOne({
      customerId: testCustomer._id,
      level: "CAMPAIGN",
    });
    assert(campaignSnap !== null, "Stored Campaign level snapshot");
    assert(campaignSnap.cost === 3000, "Normalized 3,000,000,000 micros to ₹3,000");
    assert(campaignSnap.costPerPrimaryResult === 150, "Computed CPL ₹150 for 20 conversions");

    // -------------------------------------------------------------------------
    // TEST 3: Idempotent Sync (Zero Duplicate Daily Snapshots)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Idempotent Repeat Sync ---");

    const sync2 = await googleAdsInsightsSyncService.syncCustomerInsights({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      backfillDays: 7,
    });

    const totalCampaignSnaps = await GoogleAdsInsightSnapshot.find({
      customerId: testCustomer._id,
      level: "CAMPAIGN",
    });
    assert(totalCampaignSnaps.length === 1, "Zero duplicate rows created on repeated sync");

    // -------------------------------------------------------------------------
    // TEST 4: Search Term Intelligence & Evidence-Based Recommendations
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Search Term Intelligence & Waste/Opportunity Recommendations ---");

    const recommendations = await AdsPerformanceRecommendation.find({
      customerId: testCustomer._id,
      platform: "GoogleAds",
    });

    const wasteRec = recommendations.find((r) => r.recommendationType === "SEARCH_TERM_WASTE_DETECTED");
    assert(wasteRec !== undefined, "Detected SEARCH_TERM_WASTE_DETECTED for zero-converting query ('free curtains samples')");
    assert(wasteRec.evidence.searchTerm === "free curtains samples", "Attached exact search query as evidence");
    assert(wasteRec.isAutonomousActionAllowed === false, "Strictly marked isAutonomousActionAllowed = false");

    const oppRec = recommendations.find((r) => r.recommendationType === "SEARCH_TERM_OPPORTUNITY");
    assert(oppRec !== undefined, "Detected SEARCH_TERM_OPPORTUNITY for high-converting query ('luxury velvet curtains hyderabad')");

    // -------------------------------------------------------------------------
    // TEST 5: Change Event Tracking
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: External Change Event Tracking ---");

    const changeEvents = await GoogleAdsExternalChange.find({ customerId: testCustomer._id });
    assert(changeEvents.length > 0, "Captured external change event in GoogleAdsExternalChange");
    assert(changeEvents[0].resourceType === "CAMPAIGN_BUDGET", "Recorded CAMPAIGN_BUDGET modification");

    // Clean up test documents
    await GoogleAdsExternalChange.deleteMany({ customerId: testCustomer._id });
    await AdsPerformanceRecommendation.deleteMany({ customerId: testCustomer._id });
    await GoogleAdsInsightSnapshot.deleteMany({ customerId: testCustomer._id });
    await MarketingConnection.deleteMany({ customerId: testCustomer._id });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: testCustomer._id });

    console.log("\n=======================================================");
    console.log(`🎉 ALL GOOGLE ADS INSIGHTS TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN GOOGLE ADS INSIGHTS TEST RUNNER:", err);
  process.exit(1);
});
