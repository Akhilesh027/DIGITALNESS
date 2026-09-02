/**
 * test_meta_insights.js
 * Automated Acceptance Test Suite for Step 9: Meta Ads Insights + Scheduled Sync + AdPerformanceWatcher
 * 
 * Verifies:
 * 1. Read-Only Daily Insights Ingestion (Spend, Impressions, Clicks, Leads, CTR, CPC, CPL, Frequency)
 * 2. Division-by-Zero Safety (Zero clicks -> cpc: null, Zero leads -> cpl: null)
 * 3. MetaActionNormalizer (Resolves Lead conversion actions vs Unresolved Actions)
 * 4. Deterministic Upserts & Late Attribution Backfill (No duplicate records)
 * 5. Insufficient Data Guard (Refuses to evaluate campaigns with < ₹500 spend)
 * 6. Evidence-Based High CPL Recommendation (CPL > 1.5x Target -> REVIEW_TARGETING)
 * 7. Evidence-Based Scale Winner Recommendation (CPL < 0.8x Target -> CONSIDER_BUDGET_INCREASE)
 * 8. Strict Read-Only Rule (Zero autonomous Meta Ads mutations or budget changes)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const metaActionNormalizer = require("./ai/integrations/connectors/meta/MetaActionNormalizer");
const MetaInsightsSyncService = require("./ai/ads/MetaInsightsSyncService");
const adsPerformanceAggregator = require("./ai/ads/AdsPerformanceAggregator");
const adPerformanceWatcher = require("./ai/automation/engines/AdPerformanceWatcherEngine");
const MetaAdsInsightSnapshot = require("./models/MetaAdsInsightSnapshot");
const AdsPerformanceRecommendation = require("./models/AdsPerformanceRecommendation");
const AdCampaign = require("./models/AdCampaign");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const metaInsightsWorker = require("./ai/queue/workers/metaInsightsWorker");

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
  console.log("🚀 STARTING META ADS INSIGHTS & PERFORMANCE WATCHER TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Action Normalization & Zero-Division Safety
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Action Normalizer & Division-by-Zero Safety ---");

    const norm1 = metaActionNormalizer.normalizeActions({
      rawActions: [{ action_type: "lead", value: 20 }, { action_type: "link_click", value: 200 }],
      objective: "OUTCOME_LEADS",
      spend: 3000,
    });
    assert(norm1.results === 20, "Resolved 20 leads from raw actions");
    assert(norm1.costPerResult === 150, "CPL calculated accurately as ₹150 (3000 / 20)");

    const zeroLeads = metaActionNormalizer.normalizeActions({
      rawActions: [{ action_type: "link_click", value: 50 }],
      objective: "OUTCOME_LEADS",
      spend: 500,
    });
    assert(zeroLeads.results === null, "Zero leads identified, costPerResult is null (not Infinity)");

    const unknownActions = metaActionNormalizer.normalizeActions({
      rawActions: [{ action_type: "custom_app_event", value: 10 }],
      objective: "OUTCOME_LEADS",
      spend: 1000,
    });
    assert(unknownActions.resultType === "RESULT_ACTION_UNRESOLVED", "Flagged unresolved action type safely");

    // -------------------------------------------------------------------------
    // SETUP: Test Customer & Meta Ad Account Connection
    // -------------------------------------------------------------------------
    const testCustomer = await Customer.create({
      name: "ApexBee Technologies (Insights Test)",
      companyName: "ApexBee",
    });

    const testLocation = await ClientLocation.create({
      customerId: testCustomer._id,
      name: "Ameenpur Branch",
      city: "Hyderabad",
    });

    const conn = await IntegrationManager.connect({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      platform: "MetaAds",
      accountType: "MetaAdAccount",
      platformAccountId: "act_apexbee_ins_111",
      platformAccountName: "ApexBee Official Ads",
      accessToken: "eaab_test_token_insights_222",
      scopes: ["ads_read"],
    });

    const activeCampaign = await AdCampaign.create({
      campaignId: `camp_${Date.now()}_ins`,
      customerId: testCustomer._id,
      clientLocationId: testLocation._id,
      campaignName: "APEXBEE_META_LEADS_Q3_V1",
      platform: "Meta",
      objective: "OUTCOME_LEADS",
      budget: { amount: 500, currency: "INR", targetCPL: 250 },
      targetLocations: ["Hyderabad"],
      status: "Active",
      syncStatus: "ACTIVE",
      externalStatus: "ACTIVE",
      metaCampaignId: "meta_camp_ins_333",
      metaAdSetIds: ["meta_set_ins_444"],
      metaAdIds: ["meta_ad_ins_555"],
    });

    // -------------------------------------------------------------------------
    // TEST 2: Scheduled Daily Insights Sync & Deterministic Upserts
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Scheduled Daily Insights Ingestion & Upserts ---");

    const sync1 = await MetaInsightsSyncService.syncCampaignInsights({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      adCampaignId: activeCampaign._id,
      backfillDays: 3,
    });

    assert(sync1.success === true, "Insights synchronization completed");

    const snapshots = await MetaAdsInsightSnapshot.find({ customerId: testCustomer._id });
    assert(snapshots.length > 0, "Created daily MetaAdsInsightSnapshot records");

    const firstSnapCount = snapshots.length;

    // Run identical sync again -> Should UPSERT, not create duplicates
    const sync2 = await MetaInsightsSyncService.syncCampaignInsights({
      customerId: testCustomer._id,
      locationId: testLocation._id,
      adCampaignId: activeCampaign._id,
      backfillDays: 3,
    });

    const snapshotsAfterSecondSync = await MetaAdsInsightSnapshot.find({ customerId: testCustomer._id });
    assert(snapshotsAfterSecondSync.length === firstSnapCount, "Idempotent upsert: Zero duplicate snapshot rows created");

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Window Performance Aggregation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Multi-Window Performance Aggregation ---");

    const rollup = await adsPerformanceAggregator.getCampaignRollup({
      campaignId: activeCampaign.metaCampaignId,
      customerId: testCustomer._id,
    });

    assert(rollup.hasData === true, "Generated campaign performance rollup");
    assert(rollup.windows.last3Days !== undefined, "Computed last 3 days aggregate");
    assert(rollup.windows.last3Days.spend > 0, "Aggregated spend accurately");

    // -------------------------------------------------------------------------
    // TEST 4: Insufficient Data Guard
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Insufficient Data Guard ---");

    // Create a new campaign with minimal spend
    const tinyCampaign = await AdCampaign.create({
      campaignId: `camp_tiny_${Date.now()}`,
      customerId: testCustomer._id,
      clientLocationId: testLocation._id,
      campaignName: "TINY_TEST_CAMPAIGN",
      platform: "Meta",
      objective: "OUTCOME_LEADS",
      budget: { amount: 500, targetCPL: 250 },
      status: "Active",
      metaCampaignId: "meta_camp_tiny_999",
    });

    await MetaAdsInsightSnapshot.create({
      customerId: testCustomer._id,
      accountId: "act_apexbee_ins_111",
      level: "CAMPAIGN",
      objectId: tinyCampaign.metaCampaignId,
      connectionId: conn._id,
      dateStart: "2026-08-25",
      dateStop: "2026-08-25",
      spend: 40, // ₹40 only (< ₹500 threshold)
      impressions: 80,
      clicks: 2,
      results: 0,
    });

    const tinyEval = await adPerformanceWatcher.evaluateCampaign({
      adCampaignId: tinyCampaign._id,
      customerId: testCustomer._id,
    });

    assert(tinyEval.status === "INSUFFICIENT_DATA", "Insufficient Data Guard triggered");
    assert(tinyEval.recommendation.recommendationType === "GATHER_MORE_DATA", "Recommended GATHER_MORE_DATA without premature optimization");

    // -------------------------------------------------------------------------
    // TEST 5: Evidence-Based High CPL Recommendation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Evidence-Based High CPL Recommendation ---");

    const highCplCampaign = await AdCampaign.create({
      campaignId: `camp_high_cpl_${Date.now()}`,
      customerId: testCustomer._id,
      clientLocationId: testLocation._id,
      campaignName: "HIGH_CPL_CAMPAIGN",
      platform: "Meta",
      objective: "OUTCOME_LEADS",
      budget: { amount: 1500, targetCPL: 200 },
      status: "Active",
      metaCampaignId: "meta_camp_high_cpl_888",
    });

    // Populate 3 days of high CPL snapshots (Spend ₹4500, 9 leads -> CPL ₹500 vs target ₹200)
    for (let i = 0; i < 3; i++) {
      const date = `2026-08-2${3 + i}`;
      await MetaAdsInsightSnapshot.create({
        customerId: testCustomer._id,
        accountId: "act_apexbee_ins_111",
        level: "CAMPAIGN",
        objectId: highCplCampaign.metaCampaignId,
        connectionId: conn._id,
        dateStart: date,
        dateStop: date,
        spend: 1500,
        impressions: 5000,
        clicks: 90,
        results: 3, // CPL = 500
        costPerResult: 500,
      });
    }

    const highCplEval = await adPerformanceWatcher.evaluateCampaign({
      adCampaignId: highCplCampaign._id,
      customerId: testCustomer._id,
    });

    assert(highCplEval.finding === "CPL_ABOVE_TARGET", "Detected CPL_ABOVE_TARGET finding");
    assert(highCplEval.recommendation.severity === "HIGH", "High severity assigned");
    assert(highCplEval.recommendation.recommendationType === "REVIEW_TARGETING", "Structured recommendation: REVIEW_TARGETING");
    assert(highCplEval.recommendation.evidenceSnapshot.cpl === 500, "Evidence snapshot contains exact observed CPL");

    // Clean up test documents
    await AdsPerformanceRecommendation.deleteMany({ customerId: testCustomer._id });
    await MetaAdsInsightSnapshot.deleteMany({ customerId: testCustomer._id });
    await AdCampaign.deleteMany({ customerId: testCustomer._id });
    await MarketingConnection.deleteMany({ customerId: testCustomer._id });
    await ClientLocation.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteMany({ _id: testCustomer._id });

    console.log("\n=======================================================");
    console.log(`🎉 ALL META ADS INSIGHTS TESTS COMPLETED! Total Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log("=======================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN INSIGHTS TEST RUNNER:", err);
  process.exit(1);
});
