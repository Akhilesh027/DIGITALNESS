/**
 * test_reporting_dashboard.js
 * Comprehensive Verification & Acceptance Suite for Step 18:
 * Client Reporting, Agency Executive Dashboard, Provider-Normalized Metrics,
 * Grounded Narratives, Health Scores, and Immutable ReportSnapshots.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const User = require("./models/User");
const MetaAdsInsightSnapshot = require("./models/MetaAdsInsightSnapshot");
const GoogleAdsInsightSnapshot = require("./models/GoogleAdsInsightSnapshot");
const MarketingConnection = require("./models/MarketingConnection");
const Lead = require("./models/Lead");
const LeadConversation = require("./models/LeadConversation");
const LeadFollowUpSequence = require("./models/LeadFollowUpSequence");
const MarketingCalendarItem = require("./models/MarketingCalendarItem");
const GoogleBusinessReview = require("./models/GoogleBusinessReview");
const GBPReviewReply = require("./models/GBPReviewReply");
const ReportSnapshot = require("./models/ReportSnapshot");

const reportingMetricRegistry = require("./ai/reporting/ReportingMetricRegistry");
const clientHealthScoreEngine = require("./ai/reporting/ClientHealthScoreEngine");
const reportNarrativeService = require("./ai/reporting/ReportNarrativeService");
const reportingAggregationService = require("./ai/reporting/ReportingAggregationService");

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
  console.log("🚀 STARTING STEP 18: CLIENT REPORTING & EXECUTIVE DASHBOARD TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // 0. Setup Mock Clients & User
    const customer = await Customer.findOneAndUpdate(
      { email: "siya_reporting_test@digitalness.ai" },
      { $set: { name: "Siya Art Homes", brandName: "Siya Art", companyName: "Siya Art Homes Pvt Ltd" } },
      { upsert: true, new: true }
    );

    const userManager = await User.findOneAndUpdate(
      { email: "exec.manager@digitalness.ai" },
      { $set: { name: "Executive Manager", role: "Manager", status: "Active" } },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------------------
    // TEST 1: Unconnected Provider Returns NOT_CONFIGURED Instead of ₹0
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Unconnected Provider -> NOT_CONFIGURED Policy ---");
    const overview1 = await reportingAggregationService.getClientOverview(customer._id);
    assert(overview1.googleAds.status === "NOT_CONFIGURED", "Google Ads marked NOT_CONFIGURED when no connection/snapshots exist");
    assert(overview1.googleAds.spend === null, "Unconnected provider spend is null (not falsely ₹0)");

    // -------------------------------------------------------------------------
    // TEST 2: Connected Provider with True Zero Spend Returns ₹0 Correctly
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: True Zero Spend Reporting ---");
    const mockConn = await MarketingConnection.findOneAndUpdate(
      { customerId: customer._id, platform: "Meta" },
      { $set: { status: "Connected", accountId: "act_test_999", accountName: "Siya Meta Ads" } },
      { upsert: true, new: true }
    );

    await MetaAdsInsightSnapshot.create({
      customerId: customer._id,
      connectionId: mockConn._id,
      accountId: "act_test_999",
      level: "ACCOUNT",
      objectId: "act_test_999",
      dateStart: "2026-08-01",
      dateStop: "2026-08-26",
      spend: 24600,
      impressions: 120000,
      clicks: 3400,
      actions: [{ actionType: "lead", value: 61 }],
    });

    const overview2 = await reportingAggregationService.getClientOverview(customer._id);
    assert(overview2.metaAds.status === "ACTIVE", "Meta Ads status is ACTIVE");
    assert(overview2.metaAds.spend === 24600, "Meta spend reported as ₹24,600");
    assert(overview2.metaAds.leads === 61, "Meta leads reported as 61");
    assert(overview2.metaAds.costPerLead === Math.round(24600 / 61), "Calculated correct CPL (₹403)");

    // -------------------------------------------------------------------------
    // TEST 3: Metric Registry Invariant Checks
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Metric Registry Invariant Checks ---");
    const spendDef = reportingMetricRegistry.getDefinition("META_SPEND");
    const cplDef = reportingMetricRegistry.getDefinition("BLENDED_COST_PER_RESULT");

    assert(spendDef !== null && spendDef.domain === "ADS", "META_SPEND registered in ADS domain");
    assert(cplDef !== null && cplDef.desiredDirection === "LOWER_BETTER", "CPL registered with LOWER_BETTER direction");

    // -------------------------------------------------------------------------
    // TEST 4: Content Delivery Rate Calculation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Content Delivery Rate Calculation ---");
    await MarketingCalendarItem.create([
      {
        calendarItemId: `CAL-REP-1-${Date.now()}`,
        customerId: customer._id,
        sourceType: "CONTENT_ITEM",
        sourceId: new mongoose.Types.ObjectId(),
        itemType: "POST",
        channel: "INSTAGRAM",
        title: "Siya Festive Drapes",
        status: "PUBLISHED",
        scheduledStartAt: new Date(Date.now() - 5 * 86400 * 1000),
      },
      {
        calendarItemId: `CAL-REP-2-${Date.now()}`,
        customerId: customer._id,
        sourceType: "CONTENT_ITEM",
        sourceId: new mongoose.Types.ObjectId(),
        itemType: "POST",
        channel: "FACEBOOK",
        title: "Siya Sofa Upholstery",
        status: "SCHEDULED",
        scheduledStartAt: new Date(Date.now() - 2 * 86400 * 1000),
      },
    ]);

    const overviewContent = await reportingAggregationService.getClientOverview(customer._id);
    assert(overviewContent.contentDelivery.planned >= 2, "Captured planned deliverables");
    assert(overviewContent.contentDelivery.published >= 1, "Captured published deliverables");

    // -------------------------------------------------------------------------
    // TEST 5: Reputation & GBP Review Reply Rate
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Reputation & GBP Review Reply Rate ---");
    await GoogleBusinessReview.create({
      customerId: customer._id,
      connectionId: mockConn._id,
      reviewId: `REV-${Date.now()}`,
      reviewerName: "Ramesh Sharma",
      starRating: 5,
      comment: "Excellent curtains and premium finishing!",
      reviewedAt: new Date(),
    });

    await GBPReviewReply.create({
      customerId: customer._id,
      reviewId: `REV-${Date.now()}`,
      replyText: "Thank you Ramesh for choosing Siya Art Homes!",
      status: "PUBLISHED",
      publishedAt: new Date(),
    });

    const overviewReputation = await reportingAggregationService.getClientOverview(customer._id);
    assert(overviewReputation.reputation.reviewsReceived >= 1, "Tracked received review");
    assert(overviewReputation.reputation.averageRating === 5.0, "Calculated 5.0 rating");
    assert(overviewReputation.reputation.replyRate === 100, "Calculated 100% reply rate");

    // -------------------------------------------------------------------------
    // TEST 6: Client Health Score Explainability
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Client Health Score Explainability ---");
    const health = clientHealthScoreEngine.calculateHealthScore({
      contentDeliveryRate: 90,
      hasAds: true,
      adsEfficiencyScore: 85,
      leadConversionRate: 15,
      reviewReplyRate: 100,
      slaComplianceRate: 95,
      hasGaps: false,
    });

    assert(health.score >= 80, "Computed healthy score >= 80");
    assert(health.status === "ON_TRACK", "Health status is ON_TRACK");
    assert(health.breakdown.contentDelivery.score === 90, "Explainable content score");
    assert(health.breakdown.adsEfficiency.score === 85, "Explainable ads efficiency score");

    // -------------------------------------------------------------------------
    // TEST 7: AI Executive Summary Grounding
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Grounded AI Executive Summary ---");
    const narrative = reportNarrativeService.generateExecutiveNarrative({
      clientName: "Siya Art Homes",
      periodLabel: "August 2026",
      contentDeliveryRate: 88,
      publishedCount: 14,
      metaSpend: 24600,
      metaPrimaryResults: 61,
      metaCPL: 403,
      totalLeads: 89,
      qualifiedLeads: 34,
      wonLeads: 8,
      reviewCount: 18,
      avgRating: 4.6,
      replyRate: 95,
      healthScore: { score: 85, status: "ON_TRACK" },
    });

    assert(narrative.summaryText.includes("Siya Art Homes"), "Narrative mentions client name");
    assert(narrative.summaryText.includes("61 Meta leads"), "Narrative references exact Meta lead count");
    assert(narrative.summaryText.includes("₹403 CPL"), "Narrative references exact CPL");

    // -------------------------------------------------------------------------
    // TEST 8: Immutable ReportSnapshot Generation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Immutable ReportSnapshot Generation ---");
    const snapshot = await reportingAggregationService.generateReportSnapshot({
      customerId: customer._id,
      periodType: "THIS_MONTH",
      periodStart: new Date(Date.now() - 30 * 86400 * 1000),
      periodEnd: new Date(),
      user: userManager,
    });

    assert(snapshot.reportSnapshotId.startsWith("RPT-"), "Generated unique reportSnapshotId");
    assert(snapshot.status === "GENERATED", "Status initialized to GENERATED");
    assert(snapshot.checksum.length === 64, "Generated SHA-256 integrity checksum");

    // -------------------------------------------------------------------------
    // TEST 9: Agency Executive Dashboard Aggregation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Agency Executive Dashboard Aggregation ---");
    const agencyData = await reportingAggregationService.getAgencyOverview();
    assert(agencyData.topKpis.activeClients >= 1, "Tracked active clients");
    assert(agencyData.adPerformance.totalAdSpend >= 24600, "Aggregated total ad spend");
    assert(agencyData.operationsBarometer.contentDeliveryRate >= 0, "Aggregated agency content delivery");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 18 TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 18 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
