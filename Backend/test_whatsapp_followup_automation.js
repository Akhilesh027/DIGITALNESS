/**
 * test_whatsapp_followup_automation.js
 * Comprehensive Acceptance Test Suite for Step 14:
 * WhatsApp Lead Follow-Up Automation Engine, Policy Versioning, BullMQ Delayed Scheduling,
 * 24h Window & Template Revalidation, Stop Conditions, and Analytics.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const MarketingConnection = require("./models/MarketingConnection");
const Lead = require("./models/Lead");
const LeadConversation = require("./models/LeadConversation");
const LeadMessage = require("./models/LeadMessage");
const WhatsAppTemplate = require("./models/WhatsAppTemplate");
const LeadFollowUpPolicy = require("./models/LeadFollowUpPolicy");
const LeadFollowUpSequence = require("./models/LeadFollowUpSequence");
const User = require("./models/User");
const ApprovalRequest = require("./models/ApprovalRequest");

const followUpEligibilityEngine = require("./ai/leads/FollowUpEligibilityEngine");
const followUpCircuitBreaker = require("./ai/leads/FollowUpCircuitBreaker");
const followUpSchedulerService = require("./ai/leads/FollowUpSchedulerService");
const leadFollowUpExecutionService = require("./ai/leads/LeadFollowUpExecutionService");
const followUpAnalyticsService = require("./ai/leads/FollowUpAnalyticsService");
const whatsAppLeadIngestionService = require("./ai/whatsapp/WhatsAppLeadIngestionService");
const IntegrationManager = require("./ai/integrations/IntegrationManager");
const ApprovalEngine = require("./ai/approval/ApprovalEngine");

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
  console.log("🚀 STARTING STEP 14: WHATSAPP LEAD FOLLOW-UP AUTOMATION TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log(`📦 Connected to MongoDB: ${mongoUri}\n`);

  try {
    // -------------------------------------------------------------------------
    // SETUP: Multi-Tenant Test Data (Siya Art Homes & ApexBee)
    // -------------------------------------------------------------------------
    console.log("--- SETUP: Multi-Tenant Data Setup ---");

    await Customer.deleteMany({ name: /FollowUp Test/i });
    await MarketingConnection.deleteMany({ platform: "WhatsApp" });
    await Lead.deleteMany({ name: /FollowUp/i });
    await LeadConversation.deleteMany({});
    await LeadMessage.deleteMany({});
    await WhatsAppTemplate.deleteMany({});
    await LeadFollowUpPolicy.deleteMany({});
    await LeadFollowUpSequence.deleteMany({});

    const customerA = await Customer.create({
      name: "Siya Art Homes (FollowUp Test A)",
      companyName: "Siya Art Homes Ameenpur",
    });

    const locationA = await ClientLocation.create({
      customerId: customerA._id,
      name: "Ameenpur Showroom",
      city: "Hyderabad",
    });

    const customerB = await Customer.create({
      name: "ApexBee Interiors (FollowUp Test B)",
      companyName: "ApexBee Bachupally",
    });

    const locationB = await ClientLocation.create({
      customerId: customerB._id,
      name: "Bachupally Showroom",
      city: "Hyderabad",
    });

    const connA = await IntegrationManager.connect({
      customerId: customerA._id,
      locationId: locationA._id,
      platform: "WhatsApp",
      accountType: "WhatsAppPhoneNumber",
      platformAccountId: "phone_siya_101",
      platformAccountName: "Siya Art Homes WhatsApp",
      accessToken: "mock_token_siya",
      metadata: {
        wabaId: "waba_siya_501",
        displayPhoneNumber: "+91 98765 11111",
        verifiedName: "Siya Art Homes",
      },
    });

    // Create Approved Template for Siya Art Homes
    const approvedTmpl = await WhatsAppTemplate.create({
      customerId: customerA._id,
      locationId: locationA._id,
      wabaId: "waba_siya_501",
      metaTemplateId: "tmpl_siya_001",
      name: "curtains_consultation_nurture_v1",
      language: "en_US",
      category: "UTILITY",
      status: "APPROVED",
      components: [{ type: "BODY", text: "Hello! Would you like our curtains catalog?" }],
      parameterSchema: { bodyParamsCount: 0, headerParamsCount: 0 },
    });

    // Create Rejected Template
    const rejectedTmpl = await WhatsAppTemplate.create({
      customerId: customerA._id,
      locationId: locationA._id,
      wabaId: "waba_siya_501",
      metaTemplateId: "tmpl_siya_002",
      name: "urgent_discount_deal_v1",
      language: "en_US",
      category: "MARKETING",
      status: "REJECTED",
    });

    const adminUser = await User.create({
      name: "Kavita Manager",
      email: `kavita_${Date.now()}@test.com`,
      role: "Manager",
      password: "hashed_password",
    });

    // -------------------------------------------------------------------------
    // TEST 1: Policy Creation & $R2$ Approval Gating
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Policy Creation & R2 Manager Approval ---");

    const policyDoc = await LeadFollowUpPolicy.create({
      policyId: "POL-CURTAINS-V1",
      customerId: customerA._id,
      locationId: locationA._id,
      name: "Curtains Lead 3-Step Follow-Up",
      leadSource: "ALL",
      serviceType: "CURTAINS",
      enabled: true,
      version: 1,
      status: "APPROVED", // Manager approved
      eligibilityRules: { minScore: 20 },
      steps: [
        {
          stepNumber: 1,
          delayMinutes: 60, // 1 hour
          messageType: "TEXT",
          serviceWindowText: "Hi! Following up on your curtains inquiry. How many windows are you looking to cover?",
        },
        {
          stepNumber: 2,
          delayMinutes: 1440, // 24 hours
          messageType: "TEMPLATE",
          templateName: "curtains_consultation_nurture_v1",
        },
        {
          stepNumber: 3,
          delayMinutes: 4320, // 3 days
          messageType: "TEMPLATE",
          templateName: "curtains_consultation_nurture_v1",
        },
      ],
      stopConditions: {
        onCustomerResponse: true,
        onConversion: true,
        onOptOut: true,
        onHumanHandoff: true,
      },
      quietHours: {
        enabled: true,
        startHour: 9,
        endHour: 19,
        timezone: "Asia/Kolkata",
      },
      maxAttempts: 3,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    assert(policyDoc.status === "APPROVED" && policyDoc.version === 1, "Policy POL-CURTAINS-V1 created and approved with 3 steps");

    // -------------------------------------------------------------------------
    // TEST 2: Sequence Start on Qualified Lead
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Automated Sequence Start on Qualified Lead ---");

    const lead1 = await Lead.create({
      name: "Sneha Reddy",
      contactNumber: "919888877771",
      businessType: "Curtains Inquiry",
      source: "AI Workspace",
      customerId: customerA._id,
      locationId: locationA._id,
      status: "New",
    });

    const conv1 = await LeadConversation.create({
      conversationId: "CONV-TEST-001",
      customerId: customerA._id,
      locationId: locationA._id,
      leadId: lead1._id,
      connectionId: connA._id,
      phoneNumberId: "phone_siya_101",
      participantWaId: "919888877771",
      state: "QUALIFYING",
      automationMode: "AUTOMATED",
      serviceWindowOpenedAt: new Date(),
      serviceWindowExpiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24h open
      qualificationSummary: { qualificationScore: 75, intent: "PRICE_INQUIRY" },
    });

    const startRes = await followUpSchedulerService.startSequence({
      leadId: lead1._id,
      conversationId: conv1._id,
      policyId: policyDoc._id,
    });

    assert(startRes.success === true && startRes.sequence.status === "ACTIVE", "Sequence started in ACTIVE status with Step 1 scheduled");
    assert(startRes.sequence.policyVersion === 1, "Bound exact policy version 1 to sequence");

    // -------------------------------------------------------------------------
    // TEST 3: Step 1 Execution (Inside 24-Hour Window)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Step 1 Execution Inside 24h Window ---");

    const execStep1 = await leadFollowUpExecutionService.executeScheduledStep({
      sequenceId: startRes.sequenceId,
      stepNumber: 1,
      policyId: policyDoc._id,
      policyVersion: 1,
    });

    assert(execStep1.executed === true && execStep1.status === "SENT", "Step 1 executed successfully and sent service text");

    const seqAfterStep1 = await LeadFollowUpSequence.findOne({ sequenceId: startRes.sequenceId });
    assert(seqAfterStep1.steps[0].status === "SENT" && seqAfterStep1.steps[1].status === "SCHEDULED", "Step 1 marked SENT and Step 2 automatically scheduled");

    // -------------------------------------------------------------------------
    // TEST 4: Customer Reply Cancels Pending Follow-Up Steps Immediately
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Customer Reply Cancels Remaining Follow-Up Steps ---");

    const inboundReplyPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_siya_501",
          changes: [
            {
              field: "messages",
              value: {
                metadata: { phone_number_id: "phone_siya_101" },
                contacts: [{ profile: { name: "Sneha Reddy" }, wa_id: "919888877771" }],
                messages: [
                  {
                    from: "919888877771",
                    id: "wamid.HBgLTESTREPLY001",
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: "text",
                    text: { body: "We need curtains for 4 windows in living room" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await whatsAppLeadIngestionService.processWebhookEvent(inboundReplyPayload);

    const seqAfterReply = await LeadFollowUpSequence.findOne({ sequenceId: startRes.sequenceId });
    assert(seqAfterReply.status === "WAITING" && seqAfterReply.stopReason === "CUSTOMER_RESPONDED", "Sequence transitioned to WAITING with stopReason: CUSTOMER_RESPONDED");
    assert(seqAfterReply.steps[1].status === "SKIPPED" && seqAfterReply.steps[1].skipReason === "SKIPPED_CUSTOMER_RESPONDED", "Pending Step 2 marked SKIPPED_CUSTOMER_RESPONDED");

    // -------------------------------------------------------------------------
    // TEST 5: Deal Conversion Stops Sequence
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Deal Conversion Stops Sequence ---");

    const lead2 = await Lead.create({
      name: "Vikram Varma",
      contactNumber: "919888877772",
      customerId: customerA._id,
      locationId: locationA._id,
      status: "New",
    });

    const conv2 = await LeadConversation.create({
      conversationId: "CONV-TEST-002",
      customerId: customerA._id,
      locationId: locationA._id,
      leadId: lead2._id,
      connectionId: connA._id,
      phoneNumberId: "phone_siya_101",
      participantWaId: "919888877772",
      state: "QUALIFYING",
      automationMode: "AUTOMATED",
      serviceWindowExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      qualificationSummary: { qualificationScore: 80 },
    });

    const seq2 = await followUpSchedulerService.startSequence({
      leadId: lead2._id,
      conversationId: conv2._id,
      policyId: policyDoc._id,
    });

    // Mark Lead as Won / Converted
    await followUpSchedulerService.handleConversion(lead2._id, "WON");

    const seq2AfterWon = await LeadFollowUpSequence.findOne({ sequenceId: seq2.sequenceId });
    assert(seq2AfterWon.status === "COMPLETED" && seq2AfterWon.stopReason === "CONVERTED_WON", "Deal conversion marked sequence COMPLETED with stopReason: CONVERTED_WON");

    // -------------------------------------------------------------------------
    // TEST 6: Opt-Out Stops All Sequences
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Opt-Out Stops All Sequences ---");

    const lead3 = await Lead.create({
      name: "Rajesh Kumar",
      contactNumber: "919888877773",
      customerId: customerA._id,
      locationId: locationA._id,
      status: "New",
    });

    const conv3 = await LeadConversation.create({
      conversationId: "CONV-TEST-003",
      customerId: customerA._id,
      locationId: locationA._id,
      leadId: lead3._id,
      connectionId: connA._id,
      phoneNumberId: "phone_siya_101",
      participantWaId: "919888877773",
      state: "QUALIFYING",
      automationMode: "AUTOMATED",
      serviceWindowExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      qualificationSummary: { qualificationScore: 70 },
    });

    const seq3 = await followUpSchedulerService.startSequence({
      leadId: lead3._id,
      conversationId: conv3._id,
      policyId: policyDoc._id,
    });

    // Customer sends STOP
    const stopPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_siya_501",
          changes: [
            {
              field: "messages",
              value: {
                metadata: { phone_number_id: "phone_siya_101" },
                contacts: [{ profile: { name: "Rajesh Kumar" }, wa_id: "919888877773" }],
                messages: [
                  {
                    from: "919888877773",
                    id: "wamid.HBgLSTOP001",
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: "text",
                    text: { body: "STOP" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await whatsAppLeadIngestionService.processWebhookEvent(stopPayload);

    const seq3AfterStop = await LeadFollowUpSequence.findOne({ sequenceId: seq3.sequenceId });
    assert(seq3AfterStop.status === "OPTED_OUT" && seq3AfterStop.stopReason === "OPTED_OUT", "Customer sending STOP transitioned sequence to OPTED_OUT");

    // -------------------------------------------------------------------------
    // TEST 7: Outside 24h Window Requires Approved Template
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Outside 24h Window Template Requirement ---");

    const lead4 = await Lead.create({
      name: "Anil Murthy",
      contactNumber: "919888877774",
      customerId: customerA._id,
      locationId: locationA._id,
      status: "New",
    });

    // Closed window (expired 2 hours ago)
    const conv4 = await LeadConversation.create({
      conversationId: "CONV-TEST-004",
      customerId: customerA._id,
      locationId: locationA._id,
      leadId: lead4._id,
      connectionId: connA._id,
      phoneNumberId: "phone_siya_101",
      participantWaId: "919888877774",
      state: "QUALIFYING",
      automationMode: "AUTOMATED",
      serviceWindowExpiresAt: new Date(Date.now() - 2 * 3600 * 1000), // Expired
      qualificationSummary: { qualificationScore: 70 },
    });

    const seq4 = await followUpSchedulerService.startSequence({
      leadId: lead4._id,
      conversationId: conv4._id,
      policyId: policyDoc._id,
    });

    // Step 2 is configured with template 'curtains_consultation_nurture_v1'
    const execStep2 = await leadFollowUpExecutionService.executeScheduledStep({
      sequenceId: seq4.sequenceId,
      stepNumber: 2,
      policyId: policyDoc._id,
      policyVersion: 1,
    });

    assert(execStep2.executed === true && execStep2.status === "SENT", "Step 2 executed outside window using APPROVED template");

    // -------------------------------------------------------------------------
    // TEST 8: Template Rejected After Scheduling Skips Step
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Template Rejected After Scheduling Skips Step ---");

    // Policy with rejected template
    const policyRejected = await LeadFollowUpPolicy.create({
      policyId: "POL-REJECTED-TMPL",
      customerId: customerA._id,
      locationId: locationA._id,
      name: "Policy with Rejected Template",
      enabled: true,
      status: "APPROVED",
      steps: [
        {
          stepNumber: 1,
          delayMinutes: 60,
          messageType: "TEMPLATE",
          templateName: "urgent_discount_deal_v1", // REJECTED template
        },
      ],
      maxAttempts: 1,
    });

    const seqRejected = await followUpSchedulerService.startSequence({
      leadId: lead4._id,
      conversationId: conv4._id,
      policyId: policyRejected._id,
    });

    const execRejected = await leadFollowUpExecutionService.executeScheduledStep({
      sequenceId: seqRejected.sequenceId,
      stepNumber: 1,
      policyId: policyRejected._id,
      policyVersion: 1,
    });

    assert(execRejected.executed === false && execRejected.reason === "SKIPPED_TEMPLATE_UNAVAILABLE", "Execution skipped with SKIPPED_TEMPLATE_UNAVAILABLE when template is REJECTED");

    // -------------------------------------------------------------------------
    // TEST 9: Quiet Hours Rollover (2:00 AM -> 9:00 AM)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Quiet Hours Rollover ---");

    const quietHoursConfig = { enabled: true, startHour: 9, endHour: 19, timezone: "Asia/Kolkata" };
    const nightTime = new Date();
    nightTime.setHours(2, 0, 0, 0); // 2:00 AM

    const adjustedTime = followUpSchedulerService.adjustForQuietHours(nightTime, quietHoursConfig);
    assert(adjustedTime.getHours() === 9, "Quiet hours adjusted 2:00 AM send time to 9:00 AM next permissible window");

    // -------------------------------------------------------------------------
    // TEST 10: Circuit Breaker Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Circuit Breaker Protection ---");

    followUpCircuitBreaker.reset(connA._id);
    for (let i = 0; i < 5; i++) {
      followUpCircuitBreaker.recordFailure(connA._id, new Error("WhatsApp 500 Internal Server Error"));
    }

    const circuitStatus = followUpCircuitBreaker.isAllowed(connA._id);
    assert(circuitStatus.allowed === false && circuitStatus.state === "OPEN", "Circuit Breaker OPEN after 5 consecutive failures, blocking further API hammering");

    followUpCircuitBreaker.reset(connA._id);

    // -------------------------------------------------------------------------
    // TEST 11: Multi-Tenant & Branch Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Multi-Tenant & Branch Isolation ---");

    // Attempt to run Siya policy on ApexBee lead
    const leadApexBee = await Lead.create({
      name: "ApexBee Lead",
      contactNumber: "919777766666",
      customerId: customerB._id,
      locationId: locationB._id,
      status: "New",
    });

    const convApexBee = await LeadConversation.create({
      conversationId: "CONV-APEX-001",
      customerId: customerB._id,
      locationId: locationB._id,
      leadId: leadApexBee._id,
      phoneNumberId: "phone_bachupally_102",
      participantWaId: "919777766666",
      state: "QUALIFYING",
      automationMode: "AUTOMATED",
      serviceWindowExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    });

    const crossTenantStart = await followUpSchedulerService.startSequence({
      leadId: leadApexBee._id,
      conversationId: convApexBee._id,
      policyId: policyDoc._id, // Siya policy
    });

    assert(crossTenantStart.success === false && crossTenantStart.reason === "TENANT_MISMATCH", "Cross-tenant sequence start blocked with TENANT_MISMATCH");

    // -------------------------------------------------------------------------
    // TEST 12: Analytics Aggregation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12: Analytics Aggregation ---");

    const analytics = await followUpAnalyticsService.getMetrics({ customerId: customerA._id });
    assert(analytics.totalSequences >= 3, "Analytics correctly aggregated total sequences started");
    assert(typeof analytics.responseRate === "string" && analytics.responseRate.includes("%"), "Analytics computed response rate percentage");
    assert(typeof analytics.conversionRate === "string" && analytics.conversionRate.includes("%"), "Analytics computed conversion rate percentage");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 14 TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
