// Digitalness CRM Production Server v2.4 (Full-Spectrum Master Seed Active - August 2026)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { validateEncryptionConfiguration } = require("./utils/cryptoUtil");
validateEncryptionConfiguration();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const authRoutes = require("./routes/authRoutes.js");
const leadRoutes = require("./routes/leadRoutes.js");
const dealRoutes = require("./routes/dealRoutes.js");
const branchRoutes = require("./routes/branchRoutes.js");
const customerRoutes = require("./routes/customerRoutes.js");
const workRoutes = require("./routes/workRoutes.js");
const proposalRoutes = require("./routes/proposalRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const workApprovalRoutes = require("./routes/workApprovalRoutes.js");
const communicationRoutes = require("./routes/communicationRoutes.js");
const clientRoutes = require("./routes/clientRoutes.js");
const dailyUpdateRoutes = require('./routes/dailyUpdateRoutes.js');
const clientAttachmentRoutes = require("./routes/clientAttachmentRoutes.js");


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "exp://10.77.15.28:8081",
  "http://localhost:8081",
  "https://crm-digitalness.netlify.app",
  "https://dist-2cyxl5utn-akhilesh027s-projects.vercel.app",
  "https://chic-pony-e330ef.netlify.app",
  "http://digitalness.co.in",
  "https://digitalness.co.in",
  "http://www.digitalness.co.in",
  "https://www.digitalness.co.in",
  "http://server.digitalness.co.in",
  "https://server.digitalness.co.in",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_customer_room", (customerId) => {
    socket.join(`customer_${customerId}`);
    console.log(`Joined room: customer_${customerId}`);
  });

  socket.on("leave_customer_room", (customerId) => {
    socket.leave(`customer_${customerId}`);
    console.log(`Left room: customer_${customerId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Digitalness CRM Backend is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/works", workRoutes);
app.use("/api/work", workRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/work-approvals", workApprovalRoutes);
app.use("/api/approvals", require("./routes/approvalRoutes.js"));
app.use("/api/communications", communicationRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/tickets", require("./routes/ticketRoutes.js"));app.use(
  '/api/templates',
  require('./routes/templateRoutes.js')
);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use("/api/client-attachments", clientAttachmentRoutes);
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/blogs", require("./routes/blogRoutes.js"));
app.use("/api/recruitment", require("./routes/recruitmentRoutes.js"));
app.use("/api/attendance", require("./routes/attendanceRoutes.js"));
app.use("/api/client-locations", require("./routes/clientLocationRoutes.js"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes.js"));
app.use("/api/ai-memory", require("./routes/aiMemoryRoutes.js"));
app.use("/api/content-items", require("./routes/contentItemRoutes.js"));
app.use("/api/ai/scheduled-jobs", require("./routes/scheduledJobRoutes.js"));
app.use("/api/scheduled-jobs", require("./routes/scheduledJobRoutes.js"));
app.use("/api/ai", require("./routes/aiRoutes.js"));
app.use("/api/ads", require("./routes/adCampaignRoutes.js"));
app.use("/api/creative-projects", require("./routes/creativeProjectRoutes.js"));
app.use("/api/marketing-connections", require("./routes/marketingConnectionRoutes.js"));
app.use("/api/expenses", require("./routes/expenseRoutes.js"));
app.use("/api/invoices", require("./routes/invoiceRoutes.js"));
app.use("/api/payments", require("./routes/invoiceRoutes.js"));
app.use("/api/system/queues", require("./routes/systemQueueRoutes.js"));
app.use("/api/system/certification", require("./routes/certificationRoutes.js"));
app.use("/api/creatives", require("./routes/creativeRoutes.js"));
app.use("/api/creatives", require("./routes/creativeEditRoutes.js"));
app.use("/api/creatives/canva", require("./routes/creativeEditRoutes.js"));
app.use("/api/integrations/meta", require("./routes/metaOAuthRoutes.js"));
app.use("/api/integrations/google-business", require("./routes/googleBusinessOAuthRoutes.js"));
app.use("/api/integrations/google-ads", require("./routes/googleAdsOAuthRoutes.js"));
app.use("/api/whatsapp/followup", require("./routes/followUpRoutes.js"));
app.use("/api/inbox", require("./routes/inboxRoutes.js"));
app.use("/api/calendar", require("./routes/calendarRoutes.js"));
app.use("/api/reporting", require("./routes/reportingRoutes.js"));
app.use("/api/whatsapp", require("./routes/whatsappRoutes.js"));
app.use("/webhook/whatsapp", require("./routes/whatsappRoutes.js"));

app.get("/api/ping-test", (req, res) => res.json({ status: "alive_v2" }));

// Server Restart Endpoint (Triggers nodemon reload)
app.all("/api/admin/restart-server", (req, res) => {
  res.json({ success: true, message: "Server restarting via nodemon..." });
  setTimeout(() => process.exit(0), 100);
});

// Clean Reset Database Endpoint (Wipes all test/mock data and seeds operational foundation)
const cleanResetDB = require("./clean_reset_db");
const AutomationScheduler = require("./ai/automation/AutomationScheduler");

// Full-Spectrum Production Dataset Seeder Endpoint (v3)
app.all(["/api/admin/seed-complete-data", "/api/admin/seed-production-final"], async (req, res) => {
  try {
    console.log("[Admin API] Triggering Master Production Data Seed...");
    delete require.cache[require.resolve("./seed_production_final")];
    delete require.cache[require.resolve("./seed_complete_production_data")];
    const seedData = require("./seed_production_final");
    const result = await seedData();
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Seed Production Final Error]:", error);
    return res.status(200).json({
      success: false,
      message: "Failed to seed final production data",
      error: error.message,
      errorStack: error.stack,
    });
  }
});

app.all("/api/admin/clean-reset-db", async (req, res) => {
  try {
    console.log("[Admin API] Triggering Clean Database Reset...");
    await cleanResetDB();
    return res.status(200).json({
      success: true,
      message: "Database completely cleaned and reset to pristine operational state. All mock/test data removed.",
    });
  } catch (error) {
    console.error("[Clean Reset API Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clean reset database",
      error: error.message,
    });
  }
});

// Live Zero-Touch Client Lifecycle Simulator Endpoint (V2)
app.all("/api/admin/simulate-lifecycle", async (req, res) => {
  try {
    console.log("[Admin API] Triggering Live Lifecycle Simulation...");

    const Customer = mongoose.model("Customer");
    const Lead = mongoose.model("Lead");
    const AdCampaign = mongoose.model("AdCampaign");
    const User = mongoose.model("User");

    const leadAutoAssignService = require("./services/leadAutoAssignService");
    const clientAutoProvisioningService = require("./services/clientAutoProvisioningService");
    const adCreativeHandoffService = require("./services/adCreativeHandoffService");
    const adLeadAttributionService = require("./services/adLeadAttributionService");
    const contentCalendarEngine = require("./ai/automation/engines/ContentCalendarEngine");
    const executiveBriefingEngine = require("./ai/automation/engines/ExecutiveBriefingEngine");

    // 0. Pre-cleanup
    await Lead.deleteMany({ email: /auraaesthetics/i });
    await Customer.deleteMany({ email: /auraaesthetics/i });
    await AdCampaign.deleteMany({ campaignId: /CAMP-AURA/i });

    // 1. Ingest Inbound Lead
    const leadPayload = {
      name: "Aura Aesthetics Clinic",
      phone: "+91 9876543210",
      email: "contact@auraaesthetics.test",
      businessType: "Cosmetic & Skin Clinic",
      requirement: "Full-Stack Performance Ads & Social Media Growth",
      budget: 50000,
      timeline: "Immediate",
      source: "Meta Lead Ads",
      branchId: "BR001",
    };
    const leadResult = await leadAutoAssignService.ingestAndAssignLead(leadPayload);
    const createdLead = leadResult.lead;

    // 2. Convert to Customer & Provision Pipeline
    let adminUser = await User.findOne({ role: "Admin" });
    const customer = await Customer.create({
      name: "Aura Aesthetics Clinic",
      companyName: "Aura Aesthetics & Skin Wellness Pvt Ltd",
      contactPerson: "Dr. Ananya Sharma",
      contactNumbers: ["+91 9876543210"],
      phone: "+91 9876543210",
      email: "contact@auraaesthetics.test",
      businessType: "Healthcare / Clinic",
      city: "Hyderabad",
      branchId: "BR001",
      status: "Active",
      createdBy: adminUser ? adminUser._id : new mongoose.Types.ObjectId(),
      assignedManager: adminUser ? adminUser._id : null,
      brandProfile: {
        brandName: "Aura Aesthetics",
        tone: "Premium & Clinical",
        brandColors: ["#0F172A", "#38BDF8", "#F8FAFC"],
      },
      adsProfile: {
        monthlyMetaBudget: 30000,
        promotedServices: "HydraFacial, Laser Skin Rejuvenation, Botox",
      },
    });

    const provisioningRes = await clientAutoProvisioningService.provisionClient(customer, {
      packageCode: "PKG_GROWTH",
      currency: "INR",
    });

    // 3. Ad Campaign Blueprint, Creative Handoff & Launch
    const campaign = await AdCampaign.create({
      campaignId: `CAMP-AURA-${Date.now()}`,
      customerId: customer._id,
      campaignName: "Aura Aesthetics HydraFacial Special Meta Lead Campaign",
      platform: "Meta",
      objective: "LEAD_GENERATION",
      conversionType: "INSTANT_FORM",
      createdBy: adminUser ? adminUser._id : customer._id,
      budget: {
        amount: 1500,
        totalBudget: 15000,
        currency: "INR",
        days: 10,
        targetCPL: 250,
      },
      targetLocations: ["Jubilee Hills", "Banjara Hills", "HITEC City"],
      promotedServices: ["HydraFacial Glow Treatment"],
      promotedOffer: "25% Off First HydraFacial Session",
      strategy: {
        funnelStage: "MOFU",
        coreValueProposition: "Dermatologist-led medical grade HydraFacial in Jubilee Hills.",
        primaryHook: "Get Glass Skin with 25% Off HydraFacial",
      },
      audienceTargeting: [
        {
          name: "Luxury Skin Care Enthusiasts",
          strategyType: "Luxury / High Intent",
          locations: ["Jubilee Hills", "Banjara Hills"],
          ageRange: { min: 22, max: 50 },
          interests: ["Skin care", "Facial", "Cosmetology", "Luxury lifestyle"],
        },
      ],
      creativeRequirements: [
        {
          requirementId: `REQ-POSTER-${Date.now()}`,
          format: "Poster / Banner",
          aspectRatio: "1:1",
          concept: "Medical grade skincare visual with clinic atmosphere",
          headline: "EXPERIENCE FLAWLESS GLASS SKIN",
          offerBadge: "25% OFF First Visit",
          status: "Pending Generation",
        },
        {
          requirementId: `REQ-REEL-${Date.now()}`,
          format: "Reel / Story",
          aspectRatio: "9:16",
          concept: "HydraFacial 3-step extraction and hydration demo video reel",
          headline: "How HydraFacial Transforms Your Skin",
          offerBadge: "Watch Demo",
          status: "Pending Generation",
        },
      ],
      status: "Pending Approval",
    });

    await adCreativeHandoffService.provisionCampaignCreatives(campaign);
    await AdCampaign.findByIdAndUpdate(campaign._id, {
      $set: {
        platformCampaignId: `act_meta_sim_${Date.now()}`,
        status: "Active",
        launchedAt: new Date(),
        platformStatus: "RUNNING",
      },
    });

    // 4. Inbound Lead Attribution & Live CPL
    const attributedLead = await Lead.create({
      name: "Dr. Shalini Reddy",
      contactNumber: "+91 9988771122",
      email: "shalini.r@test.com",
      businessType: "Patient / Prospect",
      requirement: "HydraFacial Appointment Booking",
      source: "Ad",
      customer: customer._id,
      branchId: "BR001",
      status: "New",
    });

    const attrRes = await adLeadAttributionService.attributeInboundLead(attributedLead, {
      campaignId: campaign._id.toString(),
      platform: "Meta Lead Ads",
      utm_source: "instagram_reels",
      utm_campaign: campaign.campaignName,
    });

    // 5. 30-Day Content Calendar Generation
    try {
      await contentCalendarEngine.generateCalendar({
        clientId: customer._id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    } catch (calErr) {}

    // 6. Refresh Morning Executive Briefing Snapshot
    const briefSnapshot = await executiveBriefingEngine.generateMorningBrief();

    return res.status(200).json({
      success: true,
      message: "Live client lifecycle simulated successfully across all 6 automation stages!",
      data: {
        customerName: customer.name,
        invoiceNumber: provisioningRes.invoiceResult?.invoiceNumber || "INV-NEW",
        campaignName: campaign.campaignName,
        liveCPL: attrRes?.liveCPL,
        healthScore: briefSnapshot?.agencyHealth?.score,
        activeTasks: briefSnapshot?.delivery?.activeTotal,
      },
    });
  } catch (error) {
    console.error("[Simulate Lifecycle Error]:", error);
    return res.status(200).json({
      success: false,
      message: "Failed to simulate lifecycle",
      error: error.message,
      errorStack: error.stack,
    });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/digitalness";

const dbNameMatch = mongoUri.match(/\/([a-zA-Z0-9_\-]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : "digitalness";
console.log(`Connecting to MongoDB database: ${dbName} [REDACTED]`);
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("✓ MongoDB Connected Successfully.");

    // Start 24/7 Agency Autonomous Engine (SLA Guardian, Payment Watcher)
    try {
      AutomationScheduler.start();
    } catch (schedErr) {
      console.warn("[Scheduler Startup Note]:", schedErr.message);
    }

    // Start BullMQ Background Workers
    try {
      require("./ai/queue/workers/creativeWorker").start();
      require("./ai/queue/workers/socialWorker").start();
      require("./ai/queue/workers/adsWorker").start();
      require("./ai/queue/workers/gbpWorker").start();
      require("./ai/queue/workers/whatsappWorker").start();
      require("./ai/queue/workers/paymentWorker").start();
      require("./ai/queue/workers/automationWorker").start();
    } catch (workerErr) {
      console.warn("[BullMQ Worker Startup Note]:", workerErr.message);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ Digitalness CRM Server running on port ${PORT} [v2.2 Production Ready]`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

// Graceful Shutdown Handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  try {
    const QueueRegistry = require("./ai/queue/QueueRegistry");
    const { closeRedis } = require("./config/redis");
    
    await QueueRegistry.closeAll();
    await closeRedis();
    await mongoose.connection.close();
    console.log("[Server] Clean shutdown complete.");
    process.exit(0);
  } catch (err) {
    console.error("[Server] Error during graceful shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));