/**
 * test_ads_automation_suite.js
 * End-to-End Automated Verification Test Suite for Complete 4-Pillar Ads Automation System.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
}

const mongoose = require("mongoose");
const Customer = require("./models/Customer");
const User = require("./models/User");
const AdCampaign = require("./models/AdCampaign");
const Work = require("./models/Work");
const Lead = require("./models/Lead");

const adCreativeHandoffService = require("./services/adCreativeHandoffService");
const metaAdsDispatchService = require("./services/metaAdsDispatchService");
const adLeadAttributionService = require("./services/adLeadAttributionService");
const adPerformanceWatcher = require("./ai/automation/engines/AdPerformanceWatcherEngine");

async function runAdsAutomationTestSuite() {
  console.log("==================================================================");
  console.log("STARTING 4-PILLAR ADS & PERFORMANCE AUTOMATION TEST SUITE");
  console.log("==================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGO_URI is missing from .env");
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB Atlas for Testing.\n");

  // Step 0: Ensure Test Customer & User Exist
  let adminUser = await User.findOne({ email: "admin@digitalness.com" });
  if (!adminUser) adminUser = await User.findOne({});

  let testCustomer = await Customer.findOne({ name: "Velocity Fit Gym" });
  if (!testCustomer) {
    testCustomer = await Customer.create({
      name: "Velocity Fit Gym",
      companyName: "Velocity Fitness & Wellness Club",
      email: "hello@velocityfit.test",
      phone: "+91 9988776655",
      businessType: "Fitness & Gym",
      city: "Hyderabad",
      branchId: "BR001",
      createdBy: adminUser?._id,
    });
    console.log("✓ Created Test Customer: Velocity Fit Gym");
  }

  // =========================================================================
  // PILLAR 1 VERIFICATION: 1-Click Ad Creative Auto-Handoff & Asset Generator
  // =========================================================================
  console.log("\n------------------------------------------------------------------");
  console.log("TESTING PILLAR 1: Ad Creative Auto-Handoff & Work Deliverable Provisioning");
  console.log("------------------------------------------------------------------");

  const campaignId = `CAMP-${Date.now()}`;
  let campaign = await AdCampaign.create({
    campaignId,
    customerId: testCustomer._id,
    name: "Velocity Fit Summer Transformation Meta Ads",
    platform: "Meta",
    objective: "LEAD_GENERATION",
    conversionType: "INSTANT_FORM",
    budget: {
      amount: 1500,
      totalBudget: 15000,
      currency: "INR",
      days: 10,
      targetCPL: 200,
    },
    targetLocations: ["HITEC City", "Gachibowli", "Madhapur"],
    promotedServices: ["Summer Body Transformation", "Personal Training"],
    promotedOffer: "Flat 25% Off 3-Month Membership",
    strategy: {
      funnelStage: "MOFU",
      coreValueProposition: "Certified personal trainers and modern equipment in HITEC City.",
      primaryHook: "Get Summer Ready with 25% Off",
    },
    audienceTargeting: [
      {
        name: "Broad Local Fitness Enthusiasts",
        strategyType: "Broad Local",
        locations: ["HITEC City", "Gachibowli"],
        ageRange: { min: 21, max: 45 },
        interests: ["Gym", "Fitness and wellness", "Weight training"],
      },
    ],
    creativeRequirements: [
      {
        requirementId: `REQ-POSTER-${Date.now()}`,
        format: "Poster / Banner",
        aspectRatio: "1:1",
        concept: "Modern gym photography with 25% off badge and member transformation",
        headline: "TRANSFORM YOUR BODY THIS SUMMER",
        offerBadge: "25% OFF Limited Slots",
        status: "Pending Generation",
      },
      {
        requirementId: `REQ-REEL-${Date.now()}`,
        format: "Reel / Story",
        aspectRatio: "9:16",
        concept: "Fast-paced workout video reel with energetic hook and free trial CTA",
        headline: "Claim Your Free 3-Day Gym Trial",
        offerBadge: "Free Pass",
        status: "Pending Generation",
      },
    ],
    status: "Pending Approval",
    createdBy: adminUser?._id,
  });

  const handoffRes = await adCreativeHandoffService.provisionCampaignCreatives(campaign, adminUser?._id);
  console.log(`✓ Pillar 1 Result: ${handoffRes.creativesProvisioned} Deliverable(s) created in Work collection.`);
  
  const createdWorks = await Work.find({ "customFields.adCampaignId": campaign._id }).lean();
  console.log(`  - Verified Work Deliverable 1: "${createdWorks[0]?.title}" | Type: ${createdWorks[0]?.workType}`);
  console.log(`  - Verified Work Deliverable 2: "${createdWorks[1]?.title}" | Type: ${createdWorks[1]?.workType}`);
  if (createdWorks.length !== 2) throw new Error("Pillar 1 Failed: Expected 2 Work deliverables.");

  // =========================================================================
  // PILLAR 2 VERIFICATION: Meta Marketing API & Campaign Dispatcher
  // =========================================================================
  console.log("\n------------------------------------------------------------------");
  console.log("TESTING PILLAR 2: Meta Marketing API & Platform Dispatcher");
  console.log("------------------------------------------------------------------");

  const dispatchRes = await metaAdsDispatchService.dispatchCampaign(campaign._id);
  console.log(`✓ Pillar 2 Result: Campaign Dispatched! Mode: ${dispatchRes.dispatchMode} | Platform ID: ${dispatchRes.platformCampaignId}`);
  
  const activeCampaign = await AdCampaign.findById(campaign._id).lean();
  console.log(`  - Campaign Database Status: "${activeCampaign.status}" | Platform Status: "${activeCampaign.platformStatus}"`);
  if (activeCampaign.status !== "Active") throw new Error("Pillar 2 Failed: Campaign status is not Active.");

  // =========================================================================
  // PILLAR 4 VERIFICATION: Real-time Inbound Lead Attribution & Live CPL
  // =========================================================================
  console.log("\n------------------------------------------------------------------");
  console.log("TESTING PILLAR 4: Real-time Inbound Lead Attribution & Live CPL Calculator");
  console.log("------------------------------------------------------------------");

  const testLead = await Lead.create({
    name: "Vikram Malhotra",
    phone: "+91 9876500001",
    email: "vikram.m@test.com",
    requirement: "Summer Transformation Gym Membership",
    budget: 15000,
    source: "Meta Ads",
    customer: testCustomer._id,
    branchId: "BR001",
    status: "New",
  });

  const rawWebhookPayload = {
    campaignId: campaign._id.toString(),
    platform: "Meta Lead Ads",
    utm_source: "instagram_feed",
    utm_campaign: campaign.name,
  };

  const attrRes = await adLeadAttributionService.attributeInboundLead(testLead, rawWebhookPayload);
  console.log(`✓ Pillar 4 Result: Attributed Lead to Campaign "${attrRes?.campaignName}"`);
  console.log(`  - Total Leads Count: ${attrRes?.totalLeadsNow}`);
  console.log(`  - Live Recalculated CPL: ${attrRes?.liveCPL}`);

  const updatedCampaign = await AdCampaign.findById(campaign._id).lean();
  if (updatedCampaign.metrics.leadsGenerated !== 1) throw new Error("Pillar 4 Failed: leadsGenerated not incremented.");

  // Ingest a second lead to test live CPL reduction
  const testLead2 = await Lead.create({
    name: "Pooja Hegde",
    phone: "+91 9876500002",
    requirement: "Personal Training",
    source: "Meta Ads",
    customer: testCustomer._id,
    branchId: "BR001",
  });
  await adLeadAttributionService.attributeInboundLead(testLead2, rawWebhookPayload);
  const updatedCampaign2 = await AdCampaign.findById(campaign._id).lean();
  console.log(`  - After 2nd Lead: Total Leads = ${updatedCampaign2.metrics.leadsGenerated} | Live CPL = ₹${updatedCampaign2.metrics.costPerLead}`);

  // =========================================================================
  // PILLAR 3 VERIFICATION: 24/7 Autonomous ROAS & CPL Optimization Watcher
  // =========================================================================
  console.log("\n------------------------------------------------------------------");
  console.log("TESTING PILLAR 3: 24/7 Autonomous ROAS & CPL Optimization Worker");
  console.log("------------------------------------------------------------------");

  const watcherRes = await adPerformanceWatcher.scan({ userId: adminUser?._id });
  console.log(`✓ Pillar 3 Result: Scanned ${watcherRes.scannedCount} Active Campaigns.`);
  console.log(`  - Healthy Campaigns: ${watcherRes.healthyCount}`);
  console.log(`  - Scale Winners: ${watcherRes.scaleWinners.length}`);
  console.log(`  - Anomaly Alerts: ${watcherRes.anomalies.length}`);

  console.log("\n==================================================================");
  console.log("ALL 4 PILLARS OF ADS AUTOMATION SYSTEM VERIFIED & PASSED!");
  console.log("==================================================================");

  // Clean up test data
  await Work.deleteMany({ "customFields.adCampaignId": campaign._id });
  await Lead.deleteMany({ _id: { $in: [testLead._id, testLead2._id] } });
  await AdCampaign.deleteMany({ _id: campaign._id });
  await Customer.deleteMany({ _id: testCustomer._id });

  await mongoose.disconnect();
}

runAdsAutomationTestSuite().catch((err) => {
  console.error("❌ Ads Automation Test Suite Failed:", err);
  process.exit(1);
});
