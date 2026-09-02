/**
 * test_marketing_calendar.js
 * Comprehensive Verification & Acceptance Suite for Step 17:
 * Client Content Calendar, Campaign Operations Workspace, Multi-Client Scheduling,
 * Approval Visibility, Execution Readiness, and Calendar Safety.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const User = require("./models/User");
const CreativeAsset = require("./models/CreativeAsset");
const ApprovalRequest = require("./models/ApprovalRequest");
const MarketingCalendarItem = require("./models/MarketingCalendarItem");
const MarketingCampaignGroup = require("./models/MarketingCampaignGroup");
const ContentOperationsPolicy = require("./models/ContentOperationsPolicy");

const calendarReadinessEngine = require("./ai/calendar/CalendarReadinessEngine");
const contentGapDetector = require("./ai/calendar/ContentGapDetector");
const marketingCalendarService = require("./ai/calendar/MarketingCalendarService");

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
  console.log("🚀 STARTING STEP 17: CLIENT CONTENT CALENDAR & OPERATIONS WORKSPACE TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // 0. Setup Mock Clients & Manager
    const apexCustomer = await Customer.findOneAndUpdate(
      { email: "apexbee_cal_test@digitalness.ai" },
      { $set: { name: "ApexBee IT", brandName: "ApexBee", companyName: "ApexBee Technologies" } },
      { upsert: true, new: true }
    );

    const siyaCustomer = await Customer.findOneAndUpdate(
      { email: "siya_cal_test@digitalness.ai" },
      { $set: { name: "Siya Art Homes", brandName: "Siya Art", companyName: "Siya Art Homes Pvt Ltd" } },
      { upsert: true, new: true }
    );

    const userManager = await User.findOneAndUpdate(
      { email: "ops.manager@digitalness.ai" },
      { $set: { name: "Operations Manager", role: "Manager", status: "Active" } },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------------------
    // TEST 1: Creative Missing Blocker
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Creative Missing Blocker ---");
    const item1 = await marketingCalendarService.createCalendarItem({
      customerId: apexCustomer._id,
      sourceType: "CONTENT_ITEM",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "POST",
      channel: "INSTAGRAM",
      title: "ApexBee Cloud Migration Offer",
      caption: "Transform your legacy infrastructure today!",
      scheduledStartAt: new Date(Date.now() + 24 * 3600 * 1000),
      ownerId: userManager._id,
    });

    assert(item1.readinessState === "CREATIVE_REQUIRED", "Flagged CREATIVE_REQUIRED state");
    assert(item1.blockers.some((b) => b.code === "CREATIVE_MISSING"), "Identified CREATIVE_MISSING blocker");

    // -------------------------------------------------------------------------
    // TEST 2: Canva Draft Not Publish-Ready Blocker
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Canva Draft Not Publish-Ready Blocker ---");
    const unreadyAsset = await CreativeAsset.create({
      assetId: `AST-UNREADY-${Date.now()}`,
      customerId: apexCustomer._id,
      title: "Draft Poster",
      version: 1,
      status: "GENERATING",
      storageKey: "draft_key",
      assetUrl: "https://example.com/draft.jpg",
      publishReady: false, // Draft / Not ready
    });

    const item2 = await marketingCalendarService.createCalendarItem({
      customerId: apexCustomer._id,
      sourceType: "CONTENT_ITEM",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "POST",
      channel: "INSTAGRAM",
      title: "ApexBee AI Showcase",
      caption: "AI automation for enterprise.",
      scheduledStartAt: new Date(Date.now() + 24 * 3600 * 1000),
      creativeAssetId: unreadyAsset._id,
      ownerId: userManager._id,
    });

    assert(item2.readinessState === "CREATIVE_REQUIRED" || item2.readinessState === "BLOCKED", "Blocked unready creative");
    assert(item2.blockers.some((b) => b.code === "CREATIVE_NOT_PUBLISH_READY"), "Identified CREATIVE_NOT_PUBLISH_READY blocker");

    // -------------------------------------------------------------------------
    // TEST 3: Approval Pending Blocker
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Approval Pending Blocker ---");
    const readyAsset = await CreativeAsset.create({
      assetId: `AST-READY-${Date.now()}`,
      customerId: siyaCustomer._id,
      title: "Siya Luxury Curtains Promo",
      version: 1,
      status: "READY",
      storageKey: "ready_key",
      assetUrl: "https://res.cloudinary.com/digitalness/image/upload/v1/curtains.jpg",
      publishReady: true,
    });

    const approvalPending = await ApprovalRequest.create({
      approvalId: `APR-SOC-${Date.now()}`,
      title: "Social Post Approval: Siya Curtains",
      domain: "SOCIAL",
      actionType: "INSTAGRAM_FEED_POST",
      riskLevel: "R2",
      status: "WAITING_APPROVAL",
      customer: siyaCustomer._id,
    });

    const item3 = await marketingCalendarService.createCalendarItem({
      customerId: siyaCustomer._id,
      sourceType: "CONTENT_ITEM",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "POST",
      channel: "INSTAGRAM",
      title: "Siya Living Room Drapes",
      caption: "Elevate your home aesthetics with custom textures.",
      scheduledStartAt: new Date(Date.now() + 36 * 3600 * 1000),
      creativeAssetId: readyAsset._id,
      approvalId: approvalPending._id,
      ownerId: userManager._id,
    });

    assert(item3.readinessState === "APPROVAL_REQUIRED", "Flagged APPROVAL_REQUIRED state");
    assert(item3.blockers.some((b) => b.code === "APPROVAL_PENDING"), "Identified APPROVAL_PENDING blocker");

    // -------------------------------------------------------------------------
    // TEST 4: Approved & Ready-To-Schedule State
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Approved & Ready-To-Schedule State ---");
    const approvalGranted = await ApprovalRequest.create({
      approvalId: `APR-SOC-OK-${Date.now()}`,
      title: "Social Post Approval: Siya Curtains Approved",
      domain: "SOCIAL",
      actionType: "INSTAGRAM_FEED_POST",
      riskLevel: "R2",
      status: "APPROVED",
      customer: siyaCustomer._id,
    });

    const item4 = await marketingCalendarService.createCalendarItem({
      customerId: siyaCustomer._id,
      sourceType: "CONTENT_ITEM",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "POST",
      channel: "INSTAGRAM",
      title: "Siya Living Room Drapes Final",
      caption: "Elevate your home aesthetics with custom textures.",
      scheduledStartAt: new Date(Date.now() + 48 * 3600 * 1000),
      creativeAssetId: readyAsset._id,
      approvalId: approvalGranted._id,
      ownerId: userManager._id,
    });

    assert(item4.readinessState === "READY_TO_SCHEDULE", "Item reached READY_TO_SCHEDULE");
    assert(item4.readinessScorePercent === 100, "Readiness score is 100%");
    assert(item4.blockers.length === 0, "Zero blockers remain");

    // -------------------------------------------------------------------------
    // TEST 5: Material Reschedule Approval Invalidation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Material Reschedule Approval Invalidation ---");
    const rescheduledItem = await marketingCalendarService.rescheduleItem({
      calendarItemId: item4._id,
      newStartAt: new Date(Date.now() + 72 * 3600 * 1000), // +24 hours
      timezone: "Asia/Kolkata",
      actorId: userManager._id,
    });

    assert(rescheduledItem.approvalId === null, "Approval invalidated upon material schedule shift");
    assert(rescheduledItem.status === "NEEDS_APPROVAL", "Status transitioned to NEEDS_APPROVAL");
    assert(rescheduledItem.readinessState === "APPROVAL_REQUIRED", "Readiness state moved back to APPROVAL_REQUIRED");

    // -------------------------------------------------------------------------
    // TEST 6: Creative Version Changed Invalidation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Creative Version Changed Invalidation ---");
    // Re-attach approval
    item4.approvalId = approvalGranted._id;
    await item4.save();

    const newVersionAsset = await CreativeAsset.create({
      assetId: `AST-READY-V2-${Date.now()}`,
      customerId: siyaCustomer._id,
      title: "Siya Luxury Curtains Promo V2",
      version: 2,
      status: "READY",
      storageKey: "ready_v2_key",
      assetUrl: "https://res.cloudinary.com/digitalness/image/upload/v1/curtains_v2.jpg",
      publishReady: true,
    });

    const versionChangedItem = await marketingCalendarService.attachCreative({
      calendarItemId: item4._id,
      creativeAssetId: newVersionAsset._id,
      pinnedVersion: 2,
      actorId: userManager._id,
    });

    assert(versionChangedItem.pinnedCreativeVersion === 2, "Pinned creative version updated to V2");
    assert(versionChangedItem.approvalId === null, "Previous approval invalidated upon creative change");
    assert(versionChangedItem.status === "NEEDS_APPROVAL", "Status marked NEEDS_APPROVAL");

    // -------------------------------------------------------------------------
    // TEST 7: Google Ads Production Activation Lock
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Google Ads Production Activation Lock ---");
    const googleAdItem = await marketingCalendarService.createCalendarItem({
      customerId: apexCustomer._id,
      sourceType: "GOOGLE_AD_CAMPAIGN",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "GOOGLE_CAMPAIGN_LAUNCH",
      channel: "GOOGLE_ADS",
      title: "ApexBee Q3 Search Ads",
      scheduledStartAt: new Date(Date.now() + 12 * 3600 * 1000),
      approvalId: approvalGranted._id,
      ownerId: userManager._id,
    });

    assert(googleAdItem.blockers.some((b) => b.code === "PRODUCTION_ACTIVATION_LOCKED"), "Enforced Google Ads production activation lock");

    // -------------------------------------------------------------------------
    // TEST 8: Content Gap Detection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Content Gap Detection ---");
    await ContentOperationsPolicy.findOneAndUpdate(
      { customerId: apexCustomer._id },
      { $set: { requiredPostsPerWeek: 5, requiredGBPPostsPerWeek: 2, enabled: true } },
      { upsert: true, new: true }
    );

    const gapReport = await contentGapDetector.detectGapsForCustomer(apexCustomer._id);
    assert(gapReport.hasGaps === true, "Detected content gap against commitment");
    assert(gapReport.gaps.some((g) => g.type === "POSTS_GAP"), "Identified POSTS_GAP");

    // -------------------------------------------------------------------------
    // TEST 9: Campaign Group Progress Calculation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Campaign Group Progress Calculation ---");
    const campaignGroup = await MarketingCampaignGroup.create({
      campaignGroupId: `CMP-FEST-${Date.now()}`,
      customerId: siyaCustomer._id,
      name: "Diwali 2026 Home Renovation Campaign",
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 86400 * 1000),
      status: "IN_PRODUCTION",
      ownerId: userManager._id,
    });

    // Attach items to group
    await marketingCalendarService.createCalendarItem({
      customerId: siyaCustomer._id,
      sourceType: "CONTENT_ITEM",
      sourceId: new mongoose.Types.ObjectId(),
      itemType: "POST",
      channel: "INSTAGRAM",
      title: "Diwali Poster",
      scheduledStartAt: new Date(),
      campaignGroupId: campaignGroup._id,
      ownerId: userManager._id,
    });

    const progress = await marketingCalendarService.getCampaignGroupProgress(campaignGroup._id);
    assert(progress.totalDeliverables === 1, "Tracked 1 deliverable in campaign group");
    assert(progress.group.name === "Diwali 2026 Home Renovation Campaign", "Matched campaign name");

    // -------------------------------------------------------------------------
    // TEST 10: 7-Lane Daily Operations Dashboard
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: 7-Lane Daily Operations Dashboard ---");
    const dailyBoard = await marketingCalendarService.getDailyOperations(new Date());
    assert(dailyBoard.lanes.OVERDUE !== undefined, "Contains OVERDUE lane");
    assert(dailyBoard.lanes.NEEDS_CREATIVE !== undefined, "Contains NEEDS_CREATIVE lane");
    assert(dailyBoard.lanes.NEEDS_APPROVAL !== undefined, "Contains NEEDS_APPROVAL lane");
    assert(dailyBoard.lanes.READY !== undefined, "Contains READY lane");
    assert(dailyBoard.lanes.SCHEDULED !== undefined, "Contains SCHEDULED lane");
    assert(dailyBoard.lanes.PUBLISHED !== undefined, "Contains PUBLISHED lane");
    assert(dailyBoard.lanes.FAILED !== undefined, "Contains FAILED lane");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 17 TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 17 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
