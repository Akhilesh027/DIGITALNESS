const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
}
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Branch = require("./models/Branch");
const Customer = require("./models/Customer");
const Lead = require("./models/Lead");
const Deal = require("./models/Deal");
const Work = require("./models/Work");
const TaskList = require("./models/TaskList");
const Ticket = require("./models/Ticket");
const Invoice = require("./models/Invoice");
const Expense = require("./models/Expense");
const AuditLog = require("./models/AuditLog");
const AgentRun = require("./models/AgentRun");
const ScheduledJob = require("./models/ScheduledJob");
const SLAIncident = require("./models/SLAIncident");
const CollectionFollowup = require("./models/CollectionFollowup");
const AICommandExecution = require("./models/AICommandExecution");
const AICommandSession = require("./models/AICommandSession");
const AIConversation = require("./models/AIConversation");
const ClientAIMemory = require("./models/ClientAIMemory");
const ClientLocation = require("./models/ClientLocation");
const ClientAttachment = require("./models/ClientAttachment");
const ContentItem = require("./models/ContentItem");
const CreativeProject = require("./models/CreativeProject");
const WorkApproval = require("./models/WorkApproval");
const BriefingSnapshot = require("./models/BriefingSnapshot");
const DailyUpdate = require("./models/DailyUpdate");
const Attendance = require("./models/Attendance");
const RecruitmentJob = require("./models/RecruitmentJob");
const RecruitmentCandidate = require("./models/RecruitmentCandidate");
const Notification = require("./models/Notification");
const MarketingConnection = require("./models/MarketingConnection");
const Template = require("./models/Template");
const Communication = require("./models/Communication");
const Blog = require("./models/Blog");
const AdCampaign = require("./models/AdCampaign");
const ServicePackageTemplate = require("./models/ServicePackageTemplate");
const Proposal = require("./models/Proposal");
const Client = require("./models/Client");
const AutomationPolicy = require("./models/AutomationPolicy");
const AutomationRun = require("./models/AutomationRun");
const ContentCalendar = require("./models/ContentCalendar");

async function cleanResetDB() {
  const isStandAlone = mongoose.connection.readyState !== 1;
  if (isStandAlone) {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/digitalness";
    console.log("[DB Reset] Connecting to MongoDB: [REDACTED]");
    await mongoose.connect(mongoUri);
  }

  console.log("[DB Reset] Wiping all test and transactional collections...");

  const wipeModels = [
    Customer,
    Lead,
    Deal,
    Work,
    TaskList,
    Ticket,
    Invoice,
    Expense,
    AuditLog,
    AgentRun,
    ScheduledJob,
    SLAIncident,
    CollectionFollowup,
    AICommandExecution,
    AICommandSession,
    AIConversation,
    ClientAIMemory,
    ClientLocation,
    ClientAttachment,
    ContentItem,
    CreativeProject,
    WorkApproval,
    BriefingSnapshot,
    DailyUpdate,
    Attendance,
    RecruitmentJob,
    RecruitmentCandidate,
    Notification,
    MarketingConnection,
    Template,
    Communication,
    Blog,
    AdCampaign,
    ServicePackageTemplate,
    Proposal,
    Client,
    AutomationPolicy,
    AutomationRun,
    ContentCalendar,
    User,
    Branch,
  ];

  for (const model of wipeModels) {
    try {
      await model.deleteMany({});
      console.log(`  ✓ Cleared collection: ${model.collection.name}`);
    } catch (err) {
      console.warn(`  ! Could not clear ${model.collection.name}:`, err.message);
    }
  }

  console.log("\n[DB Reset] Seeding Clean Base Foundation...");

  // 1. Seed Branches
  const branches = [
    {
      branchId: "BR001",
      name: "Hyderabad Corporate HQ",
      code: "HYD01",
      city: "Hyderabad",
      state: "Telangana",
      location: "HITEC City Phase 2",
      address: "Tower 4, Mindspace IT Park, HITEC City, Hyderabad, Telangana 500081",
      contactPhone: "+91 9876543210",
      contactEmail: "hyderabad@digitalness.com",
      status: "Active",
    },
    {
      branchId: "BR002",
      name: "Bangalore Regional Hub",
      code: "BLR01",
      city: "Bangalore",
      state: "Karnataka",
      location: "Indiranagar 100ft Road",
      address: "Level 4, Metro Tower, Indiranagar, Bangalore, Karnataka 560038",
      contactPhone: "+91 9876543211",
      contactEmail: "bangalore@digitalness.com",
      status: "Active",
    },
    {
      branchId: "BR003",
      name: "Mumbai Western Branch",
      code: "MUM01",
      city: "Mumbai",
      state: "Maharashtra",
      location: "Andheri West Business District",
      address: "Suite 502, Crystal Plaza, Andheri West, Mumbai, Maharashtra 400053",
      contactPhone: "+91 9876543212",
      contactEmail: "mumbai@digitalness.com",
      status: "Active",
    },
  ];

  for (const b of branches) {
    await Branch.create(b);
  }
  console.log("  ✓ Seeded 3 Branches (HYD01, BLR01, MUM01)");

  // 2. Seed Base Users
  const defaultPassword = "Admin@123456";

  const users = [
    {
      employeeId: "EMP-001",
      name: "Admin User",
      email: "admin@digitalness.com",
      password: defaultPassword,
      role: "Admin",
      department: "Management",
      jobTitle: "Agency Director",
      branchId: "BR001",
      phone: "+91 9000000001",
      status: "Active",
    },
    {
      employeeId: "EMP-002",
      name: "Rohan Varma",
      email: "sales@digitalness.com",
      password: defaultPassword,
      role: "Employee",
      department: "Sales",
      jobTitle: "Senior Sales Representative",
      branchId: "BR001",
      phone: "+91 9000000002",
      status: "Active",
    },
    {
      employeeId: "EMP-003",
      name: "Priya Nair",
      email: "designer@digitalness.com",
      password: defaultPassword,
      role: "Employee",
      department: "Creative",
      jobTitle: "Graphic Designer",
      branchId: "BR001",
      phone: "+91 9000000003",
      status: "Active",
    },
    {
      employeeId: "EMP-004",
      name: "Ananya Sen",
      email: "marketer@digitalness.com",
      password: defaultPassword,
      role: "Employee",
      department: "Marketing",
      jobTitle: "Performance Marketer",
      branchId: "BR001",
      phone: "+91 9000000004",
      status: "Active",
    },
    {
      employeeId: "EMP-005",
      name: "Karan Patel",
      email: "manager@digitalness.com",
      password: defaultPassword,
      role: "Operational Manager",
      department: "Management",
      jobTitle: "Operations Manager",
      branchId: "BR001",
      phone: "+91 9000000005",
      status: "Active",
    },
  ];

  for (const u of users) {
    await User.create(u);
  }
  console.log("  ✓ Seeded 5 Operational Users (Admin, Sales, Designer, Marketer, Manager)");

  // 3. Seed Service Package Templates
  const admin = await User.findOne({ email: "admin@digitalness.com" });
  const packageTemplates = [
    {
      code: "PKG_STARTER",
      name: "Starter Digital Presence",
      description: "Essential monthly social media management, brand creatives, and monthly report.",
      deliverables: [
        {
          type: "SOCIAL_CREATIVE",
          title: "Brand Engagement Poster 1",
          quantity: 1,
          cadence: "WEEKLY",
          preferredRole: "Graphic Designer",
          slaHours: 48,
          schedulingStrategy: "DISTRIBUTE_MONTH",
        },
        {
          type: "SOCIAL_CREATIVE",
          title: "Promotional Offer Poster 2",
          quantity: 1,
          cadence: "WEEKLY",
          preferredRole: "Graphic Designer",
          slaHours: 48,
          schedulingStrategy: "DISTRIBUTE_MONTH",
        },
        {
          type: "REEL",
          title: "Viral Short Reel / Video",
          quantity: 2,
          cadence: "BIWEEKLY",
          preferredRole: "Graphic Designer",
          slaHours: 72,
          schedulingStrategy: "DISTRIBUTE_MONTH",
        },
        {
          type: "MONTHLY_REPORT",
          title: "Monthly Performance & ROI Report",
          quantity: 1,
          cadence: "MONTHLY",
          preferredRole: "Graphic Designer",
          slaHours: 24,
          schedulingStrategy: "MONTH_END",
        },
      ],
      createdBy: admin._id,
      active: true,
    },
    {
      code: "PKG_GROWTH",
      name: "Growth & Lead Accelerator",
      description: "Comprehensive 360 marketing package with Meta & Google Ads, creative production, and daily lead tracking.",
      deliverables: [
        {
          type: "SOCIAL_CREATIVE",
          title: "Brand Story & Feature Creatives",
          quantity: 8,
          cadence: "WEEKLY",
          preferredRole: "Graphic Designer",
          slaHours: 48,
          schedulingStrategy: "DISTRIBUTE_MONTH",
        },
        {
          type: "REEL",
          title: "Short Form Video Campaign",
          quantity: 4,
          cadence: "WEEKLY",
          preferredRole: "Graphic Designer",
          slaHours: 72,
          schedulingStrategy: "DISTRIBUTE_MONTH",
        },
        {
          type: "AD_CREATIVE",
          title: "Performance Ad Campaign Setup & Creatives",
          quantity: 2,
          cadence: "MONTHLY",
          preferredRole: "Graphic Designer",
          slaHours: 48,
          schedulingStrategy: "MONTH_START",
        },
        {
          type: "MONTHLY_REPORT",
          title: "Executive ROAS & Growth Summary",
          quantity: 1,
          cadence: "MONTHLY",
          preferredRole: "Graphic Designer",
          slaHours: 24,
          schedulingStrategy: "MONTH_END",
        },
      ],
      createdBy: admin._id,
      active: true,
    },
  ];

  for (const pkg of packageTemplates) {
    await ServicePackageTemplate.create(pkg);
  }
  console.log("  ✓ Seeded Service Package Templates (Starter & Growth)");

  console.log("\n==================================================================");
  console.log("CLEAN RESET COMPLETE: Database is clean and ready for automation!");
  console.log("==================================================================");

  if (isStandAlone) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  cleanResetDB().catch((err) => {
    console.error("Clean Reset Failed:", err);
    process.exit(1);
  });
}

module.exports = cleanResetDB;
