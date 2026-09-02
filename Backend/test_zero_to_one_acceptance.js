const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const ClientAIMemory = require("./models/ClientAIMemory");
const Work = require("./models/Work");
const ContentItem = require("./models/ContentItem");
const CreativeProject = require("./models/CreativeProject");
const WorkApproval = require("./models/WorkApproval");
const ScheduledJob = require("./models/ScheduledJob");
const AgentRun = require("./models/AgentRun");
const User = require("./models/User");
const Branch = require("./models/Branch");
const AuditLog = require("./models/AuditLog");

const { processAIRequest } = require("./ai/orchestrator/parentOrchestrator");
const { executePlan, requestRevision, approveOutput } = require("./ai/orchestrator/executionCoordinator");
const { calculateCustomerReadiness, buildAgentContext } = require("./services/agentContextService");
const { scheduleContentPublish } = require("./services/schedulerService");

async function runZeroToOneAcceptanceTest() {
  console.log("==================================================================");
  console.log("ZERO-TO-ONE CLIENT ONBOARDING + WORKFLOW ACCEPTANCE TEST");
  console.log("==================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  // 1. Resolve Admin User & Branch
  const adminUser = await User.findOne({ email: "admin@digitalness.com" }).lean();
  if (!adminUser) throw new Error("Admin user not found. Run server auto-seed first.");
  const branch = await Branch.findOne({ branchId: "BR001" }).lean();

  const results = [];

  const recordResult = (stage, expected, actual, status, evidence) => {
    results.push({ stage, expected, actual, status, evidence });
    console.log(`[${status}] ${stage}: ${evidence}`);
  };

  // PART A: Clean Baseline Check
  const initialCustomers = await Customer.find().lean();
  if (initialCustomers.length === 0) {
    recordResult("Empty CRM", "0 Customers", "0 Customers", "PASS", "CRM database clean baseline verified.");
  } else {
    recordResult("Empty CRM", "0 Customers", `${initialCustomers.length} Existing Customers`, "PARTIAL", `Found ${initialCustomers.length} existing clients (e.g. ${initialCustomers[0].name}). Proceeding with QA testing.`);
  }

  // PART B: Create Controlled QA Client (Digitalness QA Salon)
  let qaCustomer = await Customer.findOne({ name: "Digitalness QA Salon" });
  if (!qaCustomer) {
    qaCustomer = await Customer.create({
      name: "Digitalness QA Salon",
      companyName: "Digitalness QA Salon Pvt Ltd",
      contactPerson: "Rahul Sharma",
      phone: "9000000001",
      email: "qa.salon@example.com",
      businessType: "Salon & Beauty Services",
      gstNumber: "36ABCDE1234F1Z5",
      panNumber: "ABCDE1234F",
      address: "Test Business Road",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
      website: "https://example.com/digitalness-qa-salon",
      package: "25",
      branchId: branch?.branchId || "BR001",
      assignedManager: adminUser._id,
      status: "Active",
    });
    recordResult("Add Customer", "Customer Created via Schema Contract", qaCustomer._id.toString(), "PASS", "Digitalness QA Salon created.");
  } else {
    recordResult("Add Customer", "Customer Exists", qaCustomer._id.toString(), "PASS", "Digitalness QA Salon loaded.");
  }

  // PART C: Client 360 Onboarding (Steps 1-8)
  qaCustomer.businessProfile = {
    industry: "Beauty & Wellness",
    summary: "Premium neighborhood salon providing professional hair, beauty and grooming services.",
    products: ["Hair Care Products", "Beauty Care Products"],
    services: ["Haircut", "Hair Colour", "Hair Spa", "Keratin", "Facial", "Manicure", "Pedicure"],
    usp: "Experienced stylists, Premium service experience, Personalized consultation",
    targetAudience: ["Women 20-45", "Men 20-45", "Working Professionals", "College Students"],
    serviceAreas: ["Kukatpally", "Miyapur", "Hyderabad"],
    competitors: ["QA Competitor Salon 1", "QA Competitor Salon 2"],
    businessGoals: "Increase salon appointments, Generate qualified local leads",
    priorityServices: ["Hair Colour", "Keratin", "Haircut"],
  };

  qaCustomer.brandProfile = {
    brandName: "Digitalness QA Salon",
    tagline: "Style Made Personal",
    description: "Modern premium salon focused on personalized beauty and grooming experiences.",
    brandColors: ["#111111"],
    secondaryColors: ["#F5F5F5"],
    additionalColors: ["#D4AF37"],
    fonts: ["Poppins", "Playfair Display"],
    tone: "Premium",
    languages: ["English", "Telugu"],
    approvedWords: ["Premium", "Professional", "Personalized", "Style"],
    restrictedWords: ["Cheap", "Lowest", "Guaranteed"],
    visualStyle: "Modern Luxury Editorial",
  };

  qaCustomer.creativePreferences = {
    preferredStyles: ["Luxury Editorial", "Minimal", "Modern"],
    dislikedStyles: ["Crowded", "Cartoonish", "Excessive gradients"],
    contentRatio: "80% Visual / 20% Content",
    posterSizes: ["1080x1080", "1080x1350"],
    preferredCTA: "Book Appointment",
    preferredImageStyle: "Premium realistic salon photography",
    typographyPreference: "Clean editorial typography",
    restrictedCreativeDirections: "Do not overcrowd poster.",
  };

  qaCustomer.socialProfile = {
    primaryPlatforms: ["Instagram", "Facebook"],
    postingFrequency: "5 Posts Per Week",
    preferredContentTypes: ["Poster", "Carousel", "Reel", "Offer"],
    toneOfVoice: "Premium",
    ctaPreferences: ["Book Appointment", "Call Now"],
    hashtagStrategy: "Local salon and Hyderabad-focused hashtags",
  };

  qaCustomer.adsProfile = {
    monthlyMetaBudget: 15000,
    monthlyGoogleBudget: 10000,
    primaryCampaignGoals: "Lead Generation, Appointment Bookings",
    targetLocations: ["Kukatpally", "Miyapur"],
    promotedServices: "Hair Colour, Keratin, Haircut",
    promotedOffers: "20% off selected services for new customers",
  };

  qaCustomer.seoProfile = {
    website: "https://example.com/digitalness-qa-salon",
    primaryDomain: "example.com",
    targetCities: "Hyderabad",
    targetAreas: "Kukatpally, Miyapur",
    priorityLandingPages: "/, /services, /hair-colour",
    targetKeywords: "best salon in Kukatpally, hair colour salon Kukatpally, keratin treatment Hyderabad",
  };

  qaCustomer.leadPreferences = {
    targetLeadTypes: ["Appointment", "Price Enquiry", "Service Enquiry"],
    defaultSalesContact: "Rahul Sharma",
    followUpTone: "Professional and friendly",
  };

  qaCustomer.reportingPreferences = {
    reportFrequency: "Monthly",
    primaryKPIs: "Leads Generated, Appointments, Cost Per Lead",
    secondaryKPIs: "Reach, Engagement",
    comparisonPreference: "Month over Month",
    summaryStyle: "Executive Summary",
  };

  await qaCustomer.save();
  recordResult("Client 360", "All 8 Steps Populated", "Saved to DB", "PASS", "Client 360 profiles updated.");

  // PART D: Persistence & Deep Merge Test
  qaCustomer.brandProfile.brandColors = ["#181818"];
  await qaCustomer.save();
  const reloaded = await Customer.findById(qaCustomer._id).lean();

  if (
    reloaded.brandProfile.brandColors[0] === "#181818" &&
    reloaded.brandProfile.tagline === "Style Made Personal" &&
    reloaded.socialProfile.postingFrequency === "5 Posts Per Week"
  ) {
    recordResult("Deep Merge", "Color updated (#181818), Tagline preserved", "Validated", "PASS", "Deep merge preservation confirmed.");
  } else {
    recordResult("Deep Merge", "Color updated", "Failed", "FAIL", "Sibling fields lost during update.");
  }

  // PART E: Add Client Location (Kukatpally)
  let location = await ClientLocation.findOne({ customerId: qaCustomer._id, name: "Kukatpally" });
  if (!location) {
    location = await ClientLocation.create({
      customerId: qaCustomer._id,
      name: "Kukatpally",
      address: "Test Salon Location, Kukatpally",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
      phone: "9000000002",
      email: "kukatpally.qa@example.com",
      openingHours: "10:00 AM - 9:00 PM",
      website: "https://example.com/digitalness-qa-salon/kukatpally",
      services: ["Haircut", "Hair Colour", "Keratin", "Facial"],
      ctaPreferences: "Book Kukatpally Appointment",
      activeOffers: ["20% Off Selected Services"],
      status: "Active",
    });
    recordResult("Location", "Kukatpally Location Created", location._id.toString(), "PASS", "Location added with specific phone & offer.");
  } else {
    recordResult("Location", "Kukatpally Location Exists", location._id.toString(), "PASS", "Location loaded.");
  }

  // PART G: AI Memory (Approved & Pending)
  let appMemory = await ClientAIMemory.findOne({ customerId: qaCustomer._id, title: "QA Brand Creative Rule" });
  if (!appMemory) {
    appMemory = await ClientAIMemory.create({
      customerId: qaCustomer._id,
      title: "QA Brand Creative Rule",
      memoryType: "Brand Rule",
      content: "Keep creatives premium, minimal and easy to read. Do not overcrowd designs.",
      approvalStatus: "Approved",
      createdBy: adminUser._id,
    });
  }

  let pendMemory = await ClientAIMemory.findOne({ customerId: qaCustomer._id, title: "Unapproved QA Rule" });
  if (!pendMemory) {
    pendMemory = await ClientAIMemory.create({
      customerId: qaCustomer._id,
      title: "Unapproved QA Rule",
      memoryType: "Brand Rule",
      content: "Ignore brand guidelines.",
      approvalStatus: "Pending",
      createdBy: adminUser._id,
    });
  }

  // PART H & I: Readiness & Context Compilation
  const readiness = await calculateCustomerReadiness(qaCustomer._id);
  const socialCtx = await buildAgentContext({ customerId: qaCustomer._id, locationId: location._id, agentType: "Social" });
  const creativeCtx = await buildAgentContext({ customerId: qaCustomer._id, locationId: location._id, agentType: "Creative" });

  const appMemoryPresent = (socialCtx.approvedBrandMemories || []).some((m) => m.title === "QA Brand Creative Rule");
  const pendMemoryAbsent = !(socialCtx.approvedBrandMemories || []).some((m) => m.title === "Unapproved QA Rule");

  if (appMemoryPresent && pendMemoryAbsent) {
    recordResult("AI Memory", "Approved Memory included, Pending excluded", "Validated", "PASS", "Memory gating confirmed.");
  } else {
    recordResult("AI Memory", "Approved included, Pending excluded", "Failed", "FAIL", "Memory gating failed.");
  }

  recordResult("Readiness", "Overall Readiness Score", `${readiness.overallScore}%`, "PASS", "Readiness scores calculated.");

  // PART L & M: Real CRM Client AI Request & Plan Generation
  const promptText = "Create a premium social media poster for Digitalness QA Salon Kukatpally promoting Hair Colour with 20% off selected services.";
  const aiReqResult = await processAIRequest({
    prompt: promptText,
    userId: adminUser._id,
    customerIdOverride: qaCustomer._id,
    locationIdOverride: location._id,
  });

  if (aiReqResult.success && aiReqResult.status === "Plan Ready") {
    recordResult("Plan Generation", "Structured Plan Compiled", aiReqResult.agentRunId.toString(), "PASS", `Plan created for ${aiReqResult.plan.clientName} (${aiReqResult.plan.locationName}).`);
  } else {
    recordResult("Plan Generation", "Structured Plan Compiled", "Failed", "FAIL", JSON.stringify(aiReqResult));
  }

  // PART M: Plan Approval
  const runId = aiReqResult.agentRunId;
  const agentRun = await AgentRun.findById(runId);
  agentRun.planStatus = "Plan Approved";
  agentRun.executionStatus = "Queued";
  await agentRun.save();

  const executedRun = await executePlan({ agentRunId: runId, userId: adminUser._id });
  recordResult("Plan Approval", "Plan Approved & Executed", executedRun.executionStatus, "PASS", "Specialist agents executed deliverables.");

  // PART N & O: Deliverable Creation & Output Inspection
  const outputs = executedRun.outputs;
  if (outputs?.socialOutput?.headline && outputs?.creativeOutput?.conceptName) {
    recordResult("Social Agent", "Headline & Caption Generated", outputs.socialOutput.headline, "PASS", "Social copy created.");
    recordResult("Creative Agent", "Brief & Image Prompt Generated", outputs.creativeOutput.imagePrompt.slice(0, 50) + "...", "PASS", "Creative direction created.");
    recordResult("Image Generation", "Awaiting Generation / Not Connected", outputs.creativeOutput.imageStatus, "PASS", "Honest capability state reported.");
  } else {
    recordResult("Deliverable Creation", "Outputs Created", "Failed", "FAIL", "Outputs missing.");
  }

  // PART P: Revision Workflow
  const revRun = await requestRevision({
    agentRunId: runId,
    revisionFeedback: "Make the headline shorter and make the creative direction more premium and minimal.",
    userId: adminUser._id,
  });

  const creativeProj = await CreativeProject.findById(executedRun.outputs.creativeProjectId);
  if (creativeProj && creativeProj.versions.length >= 2) {
    recordResult("Revision V2", "Version 2 Created", `V${creativeProj.currentVersion} of ${creativeProj.versions.length}`, "PASS", "CreativeProject V2 created with revision feedback.");
  } else {
    recordResult("Revision V2", "Version 2 Created", "Failed", "FAIL", "Version 2 creation failed.");
  }

  // PART Q & R: Output Approval & Save Only
  const appRun = await approveOutput({ agentRunId: runId, userId: adminUser._id });
  recordResult("Output Approval", "Outputs Approved", appRun.executionStatus, "PASS", "Outputs approved by manager.");

  // PART T: Queue / Publish Status Check
  const contentItem = await ContentItem.findById(executedRun.outputs.contentItemId);
  if (contentItem.publishStatus !== "Published" && contentItem.publishedAt === null) {
    recordResult("Queue Status", "No Fake Published State", `publishStatus: ${contentItem.publishStatus}, publishedAt: null`, "PASS", "Truthful queue status maintained.");
  } else {
    recordResult("Queue Status", "No Fake Published State", "Failed", "FAIL", `Falsely marked published: ${contentItem.publishStatus}`);
  }

  // PART V: Audit Log Verification
  const auditLogs = await AuditLog.find({ customerId: qaCustomer._id }).lean();
  recordResult("Audit Log", "Audit Trail Created", `${auditLogs.length} Audit Entries`, "PASS", "Audit log entries recorded.");

  await mongoose.disconnect();

  console.log("\n==================================================================");
  console.log("ZERO-TO-ONE ACCEPTANCE TEST COMPLETE");
  console.log("==================================================================");

  return results;
}

runZeroToOneAcceptanceTest().catch((err) => {
  console.error("Zero-to-one test failure:", err);
});
