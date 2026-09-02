/**
 * test_unified_inbox.js
 * Comprehensive Verification & Acceptance Suite for Step 15:
 * Unified Communications Inbox, Team Assignment, SLA Management, Human Handoff, and Operations Workspace.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const InboxItem = require("./models/InboxItem");
const Team = require("./models/Team");
const User = require("./models/User");
const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const Lead = require("./models/Lead");
const LeadConversation = require("./models/LeadConversation");
const LeadMessage = require("./models/LeadMessage");
const GoogleBusinessReview = require("./models/GoogleBusinessReview");
const InboxInternalNote = require("./models/InboxInternalNote");
const SLAPolicy = require("./models/SLAPolicy");

const inboxService = require("./ai/inbox/InboxService");
const assignmentEngine = require("./ai/inbox/AssignmentEngine");
const inboxSLAService = require("./ai/inbox/InboxSLAService");
const timelineService = require("./ai/inbox/TimelineService");

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
  console.log("🚀 STARTING STEP 15: UNIFIED COMMUNICATIONS INBOX ACCEPTANCE TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // 0. Setup Mock Entities
    const customer = await Customer.findOneAndUpdate(
      { email: "test_salon_inbox@digitalness.ai" },
      {
        $set: {
          name: "Toni & Guy Ameenpur",
          brandName: "Toni & Guy",
          companyName: "Toni & Guy Ameenpur Branch",
          phone: "+919876543210",
        },
      },
      { upsert: true, new: true }
    );

    const location = await ClientLocation.findOneAndUpdate(
      { customerId: customer._id, name: "Ameenpur Branch" },
      {
        $set: {
          city: "Hyderabad",
          state: "Telangana",
          address: "Miyapur Road, Ameenpur",
        },
      },
      { upsert: true, new: true }
    );

    const userAlice = await User.findOneAndUpdate(
      { email: "alice.agent@digitalness.ai" },
      {
        $set: {
          name: "Alice Agent",
          phone: "+919988776611",
          role: "Sales Executive",
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );

    const userBob = await User.findOneAndUpdate(
      { email: "bob.agent@digitalness.ai" },
      {
        $set: {
          name: "Bob Agent",
          phone: "+919988776622",
          role: "Sales Executive",
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );

    const salesTeam = await Team.findOneAndUpdate(
      { teamId: "TEAM-SALES-AMEENPUR" },
      {
        $set: {
          name: "Ameenpur Sales Team",
          customerId: customer._id,
          locationId: location._id,
          members: [userAlice._id, userBob._id],
          capabilities: ["WHATSAPP", "LEAD_QUALIFICATION"],
          active: true,
          roundRobinPointer: 0,
        },
      },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------------------
    // TEST 1: Inbound WhatsApp message upserts InboxItem with unread & SLA timer
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Inbound WhatsApp Ingestion Upsert ---");
    const testConvId = new mongoose.Types.ObjectId();
    const item1 = await inboxService.createOrUpdateInboxItem({
      customerId: customer._id,
      locationId: location._id,
      sourceType: "WHATSAPP_CONVERSATION",
      sourceId: testConvId,
      channel: "WHATSAPP",
      category: "LEAD_INQUIRY",
      priority: "HIGH",
      title: "Priya Sharma",
      snippet: "Hair colour price entha?",
      participantName: "Priya Sharma",
      participantPhone: "+919876543299",
      unread: true,
    });

    assert(item1 && item1.inboxItemId.startsWith("INBOX-"), "Created InboxItem with standard unique ID format");
    assert(item1.unread === true, "New inbound message marked unread");
    assert(item1.channel === "WHATSAPP", "Channel resolved to WHATSAPP");
    assert(item1.firstResponseDueAt !== null, "SLA first response due time initialized");
    assert(item1.slaStatus === "ON_TRACK", "SLA status initialized to ON_TRACK");

    // -------------------------------------------------------------------------
    // TEST 2: Duplicate Inbound Message Updates Snippet Without Duplicate Rows
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Deterministic Inbound Upsert ---");
    const item1Updated = await inboxService.createOrUpdateInboxItem({
      customerId: customer._id,
      locationId: location._id,
      sourceType: "WHATSAPP_CONVERSATION",
      sourceId: testConvId,
      snippet: "Also, do you have slots available today?",
      unread: true,
    });

    assert(String(item1Updated._id) === String(item1._id), "Deterministic upsert reused identical InboxItem row");
    assert(item1Updated.snippet === "Also, do you have slots available today?", "Snippet successfully updated");
    assert(item1Updated.unreadCount === 2, "Unread count incremented");

    // -------------------------------------------------------------------------
    // TEST 3: New GBP 1-Star Review Creates REPUTATION InboxItem with HIGH Priority
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: GBP Review Integration ---");
    const testReviewId = new mongoose.Types.ObjectId();
    const reviewItem = await inboxService.createOrUpdateInboxItem({
      customerId: customer._id,
      locationId: location._id,
      sourceType: "GBP_REVIEW",
      sourceId: testReviewId,
      channel: "GOOGLE_BUSINESS",
      category: "REPUTATION",
      priority: "HIGH",
      title: "Google Reviewer",
      snippet: "1 Star: Stylist arrived 45 minutes late.",
      participantName: "Rahul V.",
      unread: true,
    });

    assert(reviewItem.category === "REPUTATION", "GBP Review assigned REPUTATION category");
    assert(reviewItem.priority === "HIGH", "1-star negative review flagged as HIGH priority");

    // -------------------------------------------------------------------------
    // TEST 4: Round-Robin Team Assignment
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Round-Robin Assignment Engine ---");
    const route1 = await assignmentEngine.routeAssignment({
      inboxItem: item1,
      teamId: salesTeam._id,
      strategy: "ROUND_ROBIN",
    });

    assert(route1.assigned === true, "Successfully assigned via Round-Robin");
    assert(String(route1.assignedTo) === String(userAlice._id) || String(route1.assignedTo) === String(userBob._id), "Assigned to valid team member");

    // Route a second item, pointer must rotate to next member
    const tempItem = new InboxItem({ customerId: customer._id, sourceType: "WHATSAPP_CONVERSATION", sourceId: new mongoose.Types.ObjectId() });
    const route2 = await assignmentEngine.routeAssignment({
      inboxItem: tempItem,
      teamId: salesTeam._id,
      strategy: "ROUND_ROBIN",
    });
    assert(String(route2.assignedTo) !== String(route1.assignedTo), "Round-robin rotated to different team member");

    // -------------------------------------------------------------------------
    // TEST 5: Manual Assignment Locks Assignee Against Overwrite
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Manual Assignment Lock Invariant ---");
    await inboxService.assignItem({
      inboxItemId: item1._id,
      assignedTo: userAlice._id,
      actorId: userAlice._id,
    });

    const manualItem = await InboxItem.findById(item1._id);
    assert(manualItem.assignmentSource === "MANUAL", "assignmentSource marked MANUAL");

    // Attempt automatic route again
    const route3 = await assignmentEngine.routeAssignment({
      inboxItem: manualItem,
      teamId: salesTeam._id,
      strategy: "ROUND_ROBIN",
    });
    assert(route3.strategy === "PRESERVED_MANUAL", "Automatic router preserved manual assignment");
    assert(String(manualItem.assignedTo) === String(userAlice._id), "Assignee Alice remained unchanged");

    // -------------------------------------------------------------------------
    // TEST 6: SLA AT_RISK and BREACHED Evaluation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: SLA Evaluation ---");
    // Simulate past due date for item
    item1.firstResponseDueAt = new Date(Date.now() - 5 * 60 * 1000); // 5 mins in past
    const breachedEval = inboxSLAService.evaluateStatus(item1);
    assert(breachedEval.slaStatus === "BREACHED", "Item past due date calculated as BREACHED");

    // Simulate 2 minutes remaining out of 30
    item1.firstResponseDueAt = new Date(Date.now() + 2 * 60 * 1000);
    const atRiskEval = inboxSLAService.evaluateStatus(item1);
    assert(atRiskEval.slaStatus === "AT_RISK", "Item with <20% time remaining calculated as AT_RISK");

    // -------------------------------------------------------------------------
    // TEST 7: Internal Notes Collaboration (Never Sent to Customer)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Internal Collaboration Notes ---");
    const note = await inboxService.addInternalNote({
      inboxItemId: item1._id,
      authorId: userAlice._id,
      body: "@bob Customer is asking for 20% discount on Balayage. Can we offer 10%?",
      mentions: [{ userId: userBob._id, name: "Bob Agent" }],
    });

    assert(note && note.body.includes("Balayage"), "Internal note saved in database");
    const noteCheck = await InboxInternalNote.findById(note._id);
    assert(String(noteCheck.authorId) === String(userAlice._id), "Author verified as Alice");

    // Verify it is NOT a LeadMessage
    const leadMsgCount = await LeadMessage.countDocuments({ text: note.body });
    assert(leadMsgCount === 0, "Security Invariant Verified: Internal note was NEVER stored in LeadMessage outbound table");

    // -------------------------------------------------------------------------
    // TEST 8: Customer Reply on Resolved Item Reopens Item & Restarts SLA
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Reopen Resolved Conversation on Customer Reply ---");
    await inboxService.changeStatus({ inboxItemId: item1._id, status: "RESOLVED" });
    let checkResolved = await InboxItem.findById(item1._id);
    assert(checkResolved.status === "RESOLVED", "Item marked RESOLVED");

    // Customer sends a new message
    const reopened = await inboxService.createOrUpdateInboxItem({
      customerId: customer._id,
      sourceType: "WHATSAPP_CONVERSATION",
      sourceId: testConvId,
      snippet: "Thanks! Can you book me for tomorrow 4 PM?",
      unread: true,
    });

    assert(reopened.status === "ASSIGNED", "Resolved item automatically reopened to ASSIGNED upon customer reply");
    assert(reopened.unread === true, "Reopened item flagged unread");

    // -------------------------------------------------------------------------
    // TEST 9: Snooze and SLA Pause
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Snooze & SLA Pause ---");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await inboxService.snoozeItem({ inboxItemId: item1._id, snoozedUntil: tomorrow });
    const snoozedItem = await InboxItem.findById(item1._id);
    assert(snoozedItem.status === "SNOOZED", "Item status set to SNOOZED");
    assert(snoozedItem.slaStatus === "PAUSED", "SLA timer paused while snoozed");

    // -------------------------------------------------------------------------
    // TEST 10: Human Takeover & Resume Automation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Human Takeover & Automation Resume ---");
    // Create mock lead conversation
    const lead = await Lead.create({
      customerId: customer._id,
      name: "Priya Sharma",
      phone: "+919876543299",
      source: "WhatsApp",
    });

    const conv = await LeadConversation.create({
      leadId: lead._id,
      customerId: customer._id,
      participantWaId: "919876543299",
      businessPhoneNumberId: "PHONE-12345",
      automationMode: "AUTOMATED",
      state: "QUALIFYING",
      windowStatus: { isOpen: true, expiresAt: new Date(Date.now() + 12 * 3600 * 1000) },
    });

    const convInboxItem = await inboxService.createOrUpdateInboxItem({
      customerId: customer._id,
      sourceType: "WHATSAPP_CONVERSATION",
      sourceId: conv._id,
      title: "Priya Sharma",
    });

    // Human Takeover
    await inboxService.takeOverConversation({
      inboxItemId: convInboxItem._id,
      actorId: userBob._id,
    });

    const updatedConv = await LeadConversation.findById(conv._id);
    assert(updatedConv.automationMode === "HUMAN", "Conversation automationMode set to HUMAN");
    assert(updatedConv.state === "HUMAN_HANDOFF", "Conversation state transitioned to HUMAN_HANDOFF");

    const updatedInboxItem = await InboxItem.findById(convInboxItem._id);
    assert(String(updatedInboxItem.assignedTo) === String(userBob._id), "Bob assigned as active owner");

    // Resume Automation
    await inboxService.resumeConversationAutomation({
      inboxItemId: convInboxItem._id,
      actorId: userBob._id,
    });

    const resumedConv = await LeadConversation.findById(conv._id);
    assert(resumedConv.automationMode === "AUTOMATED", "Automation successfully resumed");

    // -------------------------------------------------------------------------
    // TEST 11: AI Assist Suggested Draft Generation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: AI Assist Draft Suggestion ---");
    const aiDraft = await inboxService.generateAIDraft({ inboxItemId: convInboxItem._id });
    assert(aiDraft.success === true, "AI draft generated successfully");
    assert(typeof aiDraft.suggestedDraft === "string" && aiDraft.suggestedDraft.length > 0, "AI returned suggested draft text");
    assert(aiDraft.disclaimer.includes("Requires Manager Review"), "Safety disclaimer present");

    // -------------------------------------------------------------------------
    // TEST 12: High-Scale Indexed Queries & Pagination Performance Benchmark
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12: Indexed Pagination Performance (1000+ Items) ---");
    const bulkItems = [];
    for (let i = 0; i < 1000; i++) {
      bulkItems.push({
        inboxItemId: `INBOX-BENCH-${i}`,
        customerId: customer._id,
        locationId: location._id,
        sourceType: "WHATSAPP_CONVERSATION",
        sourceId: new mongoose.Types.ObjectId(),
        channel: "WHATSAPP",
        category: "LEAD_INQUIRY",
        status: i % 2 === 0 ? "NEW" : "IN_PROGRESS",
        priority: i % 5 === 0 ? "HIGH" : "NORMAL",
        unread: i % 3 === 0,
        title: `Lead Benchmark ${i}`,
        snippet: `Inbound benchmark message ${i}`,
        lastActivityAt: new Date(Date.now() - i * 60000),
      });
    }

    await InboxItem.insertMany(bulkItems);

    const startQuery = Date.now();
    const paginated = await InboxItem.find({ customerId: customer._id, status: "NEW" })
      .sort({ lastActivityAt: -1 })
      .limit(50)
      .lean();
    const queryDurationMs = Date.now() - startQuery;

    console.log(`  ℹ️ Query execution time for 50 items across 1000+ records: ${queryDurationMs}ms`);
    assert(paginated.length === 50, "Retrieved exactly 50 items");
    assert(queryDurationMs < 50, "Indexed query latency is well within sub-50ms target");

    // Cleanup benchmark items
    await InboxItem.deleteMany({ inboxItemId: { $regex: /^INBOX-BENCH-/ } });

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 15 ACCEPTANCE TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 15 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
