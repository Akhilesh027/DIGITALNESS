/**
 * seed_complete_production_data_v2.js
 * Complete, Fully Compliant Autonomous Agency Dataset Seeder for Digitalness CRM
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seedCompleteProductionData() {
  console.log("==================================================================");
  console.log("DIGITALNESS CRM: FULL-SPECTRUM PRODUCTION DATA SEEDER");
  console.log("==================================================================\n");

  const User = mongoose.models.User || require("./models/User");
  const Customer = mongoose.models.Customer || require("./models/Customer");
  const Lead = mongoose.models.Lead || require("./models/Lead");
  const Deal = mongoose.models.Deal || require("./models/Deal");
  const Work = mongoose.models.Work || require("./models/Work");
  const Invoice = mongoose.models.Invoice || require("./models/Invoice");
  const Expense = mongoose.models.Expense || require("./models/Expense");
  const AdCampaign = mongoose.models.AdCampaign || require("./models/AdCampaign");
  const ContentCalendar = mongoose.models.ContentCalendar || require("./models/ContentCalendar");
  const ContentItem = mongoose.models.ContentItem || require("./models/ContentItem");
  const Ticket = mongoose.models.Ticket || require("./models/Ticket");
  const SLAIncident = mongoose.models.SLAIncident || require("./models/SLAIncident");
  const MarketingConnection = mongoose.models.MarketingConnection || require("./models/MarketingConnection");
  const BriefingSnapshot = mongoose.models.BriefingSnapshot || require("./models/BriefingSnapshot");

  const executiveBriefingEngine = require("./ai/automation/engines/ExecutiveBriefingEngine");

  // ---------------------------------------------------------------------------
  // 0. CLEAN RESET PRE-EXISTING DATA
  // ---------------------------------------------------------------------------
  console.log(">>> [0/12] Cleaning existing database records...");
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Lead.deleteMany({}),
    Deal.deleteMany({}),
    Work.deleteMany({}),
    Invoice.deleteMany({}),
    Expense.deleteMany({}),
    AdCampaign.deleteMany({}),
    ContentCalendar.deleteMany({}),
    ContentItem.deleteMany({}),
    Ticket.deleteMany({}),
    SLAIncident.deleteMany({}),
    MarketingConnection.deleteMany({}),
    BriefingSnapshot.deleteMany({}),
  ]);
  console.log("  ✓ Database cleared.\n");

  // ---------------------------------------------------------------------------
  // 1. TEAM ROSTER (10 Users)
  // ---------------------------------------------------------------------------
  console.log(">>> [1/12] Seeding Team Members & Roles...");
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash("Agency123!", salt);

  const teamData = [
    { name: "Akhil Sharma", email: "admin@digitalness.agency", role: "Admin", designation: "Founder & CEO", department: "Management", phone: "+91 9900112233", monthlySalary: 150000 },
    { name: "Anjali Verma", email: "anjali@digitalness.agency", role: "Operational Manager", designation: "Sr. Account Director", department: "Management", phone: "+91 9900112234", monthlySalary: 85000 },
    { name: "Rohit Malhotra", email: "rohit@digitalness.agency", role: "Operational Manager", designation: "Client Operations Lead", department: "Management", phone: "+91 9900112235", monthlySalary: 75000 },
    { name: "Siddharth Mehta", email: "siddharth@digitalness.agency", role: "Employee", designation: "Lead Performance Media Buyer", department: "Marketing", phone: "+91 9900112236", monthlySalary: 80000 },
    { name: "Vikram Rao", email: "vikram@digitalness.agency", role: "Employee", designation: "Meta & Google Ads Specialist", department: "Marketing", phone: "+91 9900112237", monthlySalary: 65000 },
    { name: "Priya Sen", email: "priya@digitalness.agency", role: "Employee", designation: "Head of Brand Design", department: "Creative", phone: "+91 9900112238", monthlySalary: 70000 },
    { name: "Aman Gupta", email: "aman@digitalness.agency", role: "Employee", designation: "Sr. Visual Designer", department: "Creative", phone: "+91 9900112239", monthlySalary: 55000 },
    { name: "Sneha Kapoor", email: "sneha@digitalness.agency", role: "Employee", designation: "Video Producer & Motion Artist", department: "Creative", phone: "+91 9900112240", monthlySalary: 60000 },
    { name: "Neha Joshi", email: "neha@digitalness.agency", role: "Telecaller", designation: "Inbound Sales Specialist", department: "Sales", phone: "+91 9900112241", monthlySalary: 45000 },
    { name: "Rahul Dev", email: "rahul@digitalness.agency", role: "Telecaller", designation: "Business Development Representative", department: "Sales", phone: "+91 9900112242", monthlySalary: 45000 },
  ];

  const usersWithIds = teamData.map((u) => ({
    _id: new mongoose.Types.ObjectId(),
    ...u,
    password: defaultPassword,
    status: "Active",
    branchId: "BR001",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await User.collection.insertMany(usersWithIds);
  const users = usersWithIds;
  const adminUser = users.find((u) => u.role === "Admin");
  const accountManager = users.find((u) => u.name === "Anjali Verma");
  const mediaBuyer = users.find((u) => u.name === "Siddharth Mehta");
  const designer = users.find((u) => u.name === "Priya Sen");
  const videoEditor = users.find((u) => u.name === "Sneha Kapoor");
  const salesRep = users.find((u) => u.name === "Neha Joshi");
  console.log(`  ✓ Created ${users.length} Team Members.\n`);

  // ---------------------------------------------------------------------------
  // 2. CLIENT ACCOUNTS / CUSTOMERS (5 Retainers)
  // ---------------------------------------------------------------------------
  console.log(">>> [2/12] Seeding Active Client Retainers...");
  const clientsData = [
    {
      name: "Aura Aesthetics Clinic",
      companyName: "Aura Aesthetics & Skin Wellness Pvt Ltd",
      contactPerson: "Dr. Ananya Sharma",
      contactNumbers: ["+91 9876543210"],
      phone: "+91 9876543210",
      email: "contact@auraaesthetics.com",
      businessType: "Healthcare / Skincare",
      city: "Hyderabad",
      branchId: "BR001",
      status: "Active",
      packageType: "Retainer Growth",
      monthlyBudget: 75000,
      createdBy: adminUser._id,
      assignedManager: accountManager._id,
      brandProfile: { brandName: "Aura Aesthetics", tone: "Clinical, Luxury, Trustworthy", brandColors: ["#0F172A", "#38BDF8", "#F8FAFC"], targetAudience: "Affluent professionals aged 24-52 seeking dermatology and cosmetic care." },
      adsProfile: { monthlyMetaBudget: 40000, monthlyGoogleBudget: 25000, promotedServices: "HydraFacial, Laser Rejuvenation, Botox, Chemical Peels" },
    },
    {
      name: "Prestige SkyVillas",
      companyName: "Prestige Living & Real Estate Infra LLP",
      contactPerson: "Rajeshwar Rao",
      contactNumbers: ["+91 9876543211"],
      phone: "+91 9876543211",
      email: "sales@prestigeskyvillas.in",
      businessType: "Luxury Real Estate",
      city: "Hyderabad",
      branchId: "BR001",
      status: "Active",
      packageType: "Enterprise Lead Engine",
      monthlyBudget: 150000,
      createdBy: adminUser._id,
      assignedManager: accountManager._id,
      brandProfile: { brandName: "Prestige SkyVillas", tone: "Exclusive, Architectural, High-Net-Worth", brandColors: ["#1E293B", "#D97706", "#FFFFFF"], targetAudience: "HNIs, NRI investors, Tech executives looking for 4BHK+ Penthouses." },
      adsProfile: { monthlyMetaBudget: 90000, monthlyGoogleBudget: 60000, promotedServices: "Ultra-luxury Penthouses, Private Pool SkyVillas in Financial District" },
    },
    {
      name: "CloudScale AI Systems",
      companyName: "CloudScale Enterprise Intelligence Inc",
      contactPerson: "Kavita Nair",
      contactNumbers: ["+91 9876543212"],
      phone: "+91 9876543212",
      email: "growth@cloudscale.ai",
      businessType: "B2B SaaS / Enterprise AI",
      city: "Bengaluru",
      branchId: "BR001",
      status: "Active",
      packageType: "Full-Funnel B2B Growth",
      monthlyBudget: 120000,
      createdBy: adminUser._id,
      assignedManager: accountManager._id,
      brandProfile: { brandName: "CloudScale AI", tone: "Authoritative, Modern Tech, ROI-Focused", brandColors: ["#0284C7", "#0F172A", "#6366F1"], targetAudience: "CTOs, VP Engineering, DevOps Directors managing multi-cloud infra." },
      adsProfile: { monthlyMetaBudget: 40000, monthlyGoogleBudget: 80000, promotedServices: "AI Infrastructure Auto-scaling, GPU Optimization" },
    },
    {
      name: "VogueCraft Atelier",
      companyName: "VogueCraft Luxury Pret Pvt Ltd",
      contactPerson: "Meera Singhania",
      contactNumbers: ["+91 9876543213"],
      phone: "+91 9876543213",
      email: "marketing@voguecraft.store",
      businessType: "D2C Fashion & Apparel",
      city: "Mumbai",
      branchId: "BR001",
      status: "Active",
      packageType: "Performance E-Commerce",
      monthlyBudget: 60000,
      createdBy: adminUser._id,
      assignedManager: accountManager._id,
      brandProfile: { brandName: "VogueCraft", tone: "Chic, Vibrant, Contemporary Heritage", brandColors: ["#BE185D", "#FDE047", "#18181B"], targetAudience: "Fashion-forward women aged 20-38 looking for artisanal prêt wear." },
      adsProfile: { monthlyMetaBudget: 50000, monthlyGoogleBudget: 10000, promotedServices: "Artisanal Silk Co-ord Sets, Festive Collection" },
    },
    {
      name: "The Amber Table Hospitality",
      companyName: "Amber Hospitality Group & Kitchens",
      contactPerson: "Chef Varun Kapoor",
      contactNumbers: ["+91 9876543214"],
      phone: "+91 9876543214",
      email: "hello@theambertable.in",
      businessType: "Hospitality / Fine Dining",
      city: "Hyderabad",
      branchId: "BR001",
      status: "Active",
      packageType: "Social Buzz & Dine-In Acquisition",
      monthlyBudget: 45000,
      createdBy: adminUser._id,
      assignedManager: accountManager._id,
      brandProfile: { brandName: "The Amber Table", tone: "Gourmet, Warm, Epicurean", brandColors: ["#78350F", "#F59E0B", "#FEF3C7"], targetAudience: "Food connoisseurs, couples, family weekend diners in Jubilee Hills." },
      adsProfile: { monthlyMetaBudget: 35000, monthlyGoogleBudget: 10000, promotedServices: "Weekend Progressive Degustation Brunch, Chef's Table" },
    },
  ];

  const customers = await Customer.insertMany(clientsData);
  console.log(`  ✓ Created ${customers.length} Client Retainers.\n`);
  const [auraClient, prestigeClient, cloudScaleClient, vogueClient, amberClient] = customers;

  // ---------------------------------------------------------------------------
  // 3. INBOUND SALES & LEAD PIPELINE (15 Diverse Leads)
  // ---------------------------------------------------------------------------
  console.log(">>> [3/12] Seeding Inbound Leads...");
  const leadsData = [
    { name: "Dr. Shalini Reddy", contactNumber: "+91 9123456780", email: "shalini.derm@test.com", businessType: "Dental & Aesthetics", requirements: ["Performance Lead Gen", "Instagram Growth"], budgetRange: "₹50k-₹75k", timeline: "Urgent", source: "Ad", leadScore: "Hot", status: "New", assignedTo: salesRep._id, customer: auraClient._id, branchId: "BR001" },
    { name: "Karthik Somani", contactNumber: "+91 9123456781", email: "karthik@somaniinfra.com", businessType: "Real Estate Developer", requirements: ["Villa Launch Campaign"], budgetRange: "₹1.5L-₹2.5L", timeline: "Urgent", source: "Website", leadScore: "Hot", status: "Contacted", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Arjun Bhalla", contactNumber: "+91 9123456782", email: "arjun@bhallaortho.clinic", businessType: "Orthopedic Center", requirements: ["Google Search Ads", "SEO"], budgetRange: "₹35k-₹50k", timeline: "Normal", source: "Website", leadScore: "Warm", status: "Qualified", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Pooja Hegde", contactNumber: "+91 9123456783", email: "pooja@silkandthread.co", businessType: "D2C Jewelry", requirements: ["Meta Ads", "Shopify Optimization"], budgetRange: "₹60k-₹80k", timeline: "Urgent", source: "Ad", leadScore: "Hot", status: "Negotiation", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Naveen Chawla", contactNumber: "+91 9123456784", email: "naveen@nexuscloud.io", businessType: "Cybersecurity SaaS", requirements: ["B2B Lead Gen", "LinkedIn InMail"], budgetRange: "₹1L-₹2L", timeline: "Normal", source: "Telecaller", leadScore: "Hot", status: "Qualified", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Divya Nambiar", contactNumber: "+91 9123456785", email: "divya@ayurvaveda.live", businessType: "Ayurvedic Wellness", requirements: ["Influencer Campaign", "Brand Strategy"], budgetRange: "₹40k-₹60k", timeline: "Later", source: "Website", leadScore: "Warm", status: "Contacted", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Suresh Pillai", contactNumber: "+91 9123456786", email: "suresh@pillaifinance.in", businessType: "Wealth Advisory", requirements: ["HNI Inbound Funnel"], budgetRange: "₹80k-₹1.2L", timeline: "Urgent", source: "Ad", leadScore: "Hot", status: "Negotiation", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Gautam Adiga", contactNumber: "+91 9123456787", email: "gautam@adigafresh.com", businessType: "Organic Gourmet Foods", requirements: ["Full Performance Ads", "Content"], budgetRange: "₹60k-₹90k", timeline: "Normal", source: "AI Workspace", leadScore: "Warm", status: "New", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Ritu Khanna", contactNumber: "+91 9123456788", email: "ritu@khannaweddings.com", businessType: "Destination Wedding Planning", requirements: ["High-Ticket Lead Generation"], budgetRange: "₹1L-₹1.5L", timeline: "Urgent", source: "Ad", leadScore: "Hot", status: "Negotiation", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Vikas Talwar", contactNumber: "+91 9123456789", email: "vikas@talwargym.fit", businessType: "Premium Gym Chain", requirements: ["Membership Acquisition"], budgetRange: "₹30k-₹50k", timeline: "Later", source: "Telecaller", leadScore: "Warm", status: "Contacted", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Zoya Akhtar", contactNumber: "+91 9123456790", email: "zoya@lumierecafe.in", businessType: "Artisan Bakery", requirements: ["Reels Viral Strategy"], budgetRange: "₹25k-₹40k", timeline: "Normal", source: "Website", leadScore: "Warm", status: "New", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Dr. Sandeep Jha", contactNumber: "+91 9123456791", email: "sandeep@jhahospital.org", businessType: "Super-Speciality Hospital", requirements: ["Doctor Branding", "Patient Inquiries"], budgetRange: "₹1.5L-₹2L", timeline: "Urgent", source: "Ad", leadScore: "Hot", status: "Converted", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Ankur Warikoo Tech", contactNumber: "+91 9123456792", email: "connect@ankurtech.test", businessType: "EdTech Platform", requirements: ["Webinar Lead Acquisition"], budgetRange: "₹80k-₹1.2L", timeline: "Normal", source: "AI Workspace", leadScore: "Warm", status: "Converted", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Manish Goyal", contactNumber: "+91 9123456793", email: "manish@goyaltextiles.in", businessType: "Wholesale Fabric", requirements: ["Export Lead Generation"], budgetRange: "₹20k-₹30k", timeline: "Later", source: "Telecaller", leadScore: "Cold", status: "Lost", assignedTo: salesRep._id, branchId: "BR001" },
    { name: "Harish Iyer", contactNumber: "+91 9123456794", email: "harish@iyerapp.dev", businessType: "Mobile Gaming App", requirements: ["App Install Campaign"], budgetRange: "₹25k-₹40k", timeline: "Later", source: "Website", leadScore: "Cold", status: "Lost", assignedTo: salesRep._id, branchId: "BR001" },
  ];

  const leads = await Lead.insertMany(leadsData);
  console.log(`  ✓ Created ${leads.length} Sales Leads.\n`);

  // ---------------------------------------------------------------------------
  // 4. ACTIVE SALES DEALS & PIPELINE (8 Deals)
  // ---------------------------------------------------------------------------
  console.log(">>> [4/12] Seeding Active Sales Deals...");
  const dealsData = [
    { title: "Somani Luxury Villas Launch Retainer", customerName: "Karthik Somani", contactNumber: "+91 9123456781", businessType: "Real Estate Developer", dealValue: 200000, stage: "Proposal", probability: 75, leadId: leads[1]._id, customerId: prestigeClient._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 7), branchId: "BR001" },
    { title: "Silk & Thread D2C Performance Scale", customerName: "Pooja Hegde", contactNumber: "+91 9123456783", businessType: "D2C Jewelry", dealValue: 75000, stage: "Negotiation", probability: 85, leadId: leads[3]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 3), branchId: "BR001" },
    { title: "NexusCloud B2B Outbound Engine", customerName: "Naveen Chawla", contactNumber: "+91 9123456784", businessType: "Cybersecurity SaaS", dealValue: 150000, stage: "Qualified", probability: 60, leadId: leads[4]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 12), branchId: "BR001" },
    { title: "Pillai Wealth HNI Funnel Retainer", customerName: "Suresh Pillai", contactNumber: "+91 9123456786", businessType: "Wealth Advisory", dealValue: 100000, stage: "Proposal", probability: 90, leadId: leads[6]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 4), branchId: "BR001" },
    { title: "Khanna Luxury Weddings Brand Retainer", customerName: "Ritu Khanna", contactNumber: "+91 9123456788", businessType: "Destination Wedding Planning", dealValue: 120000, stage: "Proposal", probability: 70, leadId: leads[8]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 6), branchId: "BR001" },
    { title: "Adiga Fresh Performance Growth", customerName: "Gautam Adiga", contactNumber: "+91 9123456787", businessType: "Organic Gourmet Foods", dealValue: 80000, stage: "Discovery", probability: 40, leadId: leads[7]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 15), branchId: "BR001" },
    { title: "Jha Super-Speciality Digital Mandate", customerName: "Dr. Sandeep Jha", contactNumber: "+91 9123456791", businessType: "Super-Speciality Hospital", dealValue: 180000, stage: "Won", probability: 100, leadId: leads[11]._id, customerId: auraClient._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() - 86400000 * 2), branchId: "BR001" },
    { title: "Talwar Gym Hyperlocal Acquisition", customerName: "Vikas Talwar", contactNumber: "+91 9123456789", businessType: "Premium Gym Chain", dealValue: 40000, stage: "Discovery", probability: 30, leadId: leads[9]._id, assignedTo: salesRep._id, expectedCloseDate: new Date(Date.now() + 86400000 * 20), branchId: "BR001" },
  ];

  const deals = await Deal.insertMany(dealsData);
  console.log(`  ✓ Created ${deals.length} Sales Deals (~₹9.45L Pipeline).\n`);

  // ---------------------------------------------------------------------------
  // 5. WORK & DELIVERABLES LEDGER (35 Tasks)
  // ---------------------------------------------------------------------------
  console.log(">>> [5/12] Seeding Work Deliverables...");
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const workItems = [
    { title: "HydraFacial 25% Off Promotional Poster (1:1)", customer: auraClient._id, assignedTo: [designer._id], priority: "High", status: "In Progress", workType: "Design", dueDate: todayEnd, description: "Create clinical luxury feed creative with offer badge." },
    { title: "HydraFacial 3-Step Extraction Reel (9:16)", customer: auraClient._id, assignedTo: [videoEditor._id], priority: "High", status: "In Progress", workType: "Video", dueDate: new Date(now.getTime() + 86400000), description: "Motion edit showing vacuum extraction and hydration." },
    { title: "Laser Rejuvenation Before/After Carousel (10 Slides)", customer: auraClient._id, assignedTo: [designer._id], priority: "Medium", status: "Review", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 2), description: "Educational carousel highlighting clinical facts." },
    { title: "Meta Instant Lead Form Integration & CRM Webhook", customer: auraClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "Completed", workType: "Performance Ads", dueDate: new Date(now.getTime() - 86400000), description: "Verify automated lead ingestion from Meta Ads." },
    { title: "Monthly SEO Technical Audit & Core Web Vitals Fix", customer: auraClient._id, assignedTo: [mediaBuyer._id], priority: "Medium", status: "In Progress", workType: "SEO", dueDate: new Date(now.getTime() + 86400000 * 4), description: "Speed optimization and schema markup." },
    { title: "Patient Google Reviews QR Poster & Standee", customer: auraClient._id, assignedTo: [designer._id], priority: "Low", status: "Completed", workType: "Design", dueDate: new Date(now.getTime() - 86400000 * 3), description: "Physical reception standee." },
    { title: "Dermatologist Q&A Reel on Sunscreen Myths", customer: auraClient._id, assignedTo: [videoEditor._id], priority: "Medium", status: "In Progress", workType: "Video", dueDate: new Date(now.getTime() + 86400000 * 3), description: "Dr. Ananya answering top 5 misconceptions." },

    { title: "4BHK SkyVilla Architectural Walkthrough 4K Reel", customer: prestigeClient._id, assignedTo: [videoEditor._id], priority: "Urgent", status: "In Progress", workType: "Video", dueDate: todayEnd, description: "Luxury drone shots and marble interior pacing." },
    { title: "Google Search Ads High-Intent Keyword Expansion", customer: prestigeClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "In Progress", workType: "Performance Ads", dueDate: todayEnd, description: "Add exact-match keywords for luxury penthouses." },
    { title: "Private Pool Penthouse Lead Magnet Brochure (PDF)", customer: prestigeClient._id, assignedTo: [designer._id], priority: "High", status: "Review", workType: "Design", dueDate: new Date(now.getTime() + 86400000), description: "24-page luxury digital brochure." },
    { title: "Meta HNI Retargeting Audience Custom Segment Build", customer: prestigeClient._id, assignedTo: [mediaBuyer._id], priority: "Medium", status: "In Progress", workType: "Performance Ads", dueDate: new Date(now.getTime() + 86400000 * 2), description: "Segment web visitors." },
    { title: "NRI Investment Webinar Registration Landing Page", customer: prestigeClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "In Progress", workType: "Dev", dueDate: new Date(now.getTime() + 86400000 * 3), description: "High-converting Next.js landing page." },
    { title: "Prestige SkyVillas Brand Guidelines Document", customer: prestigeClient._id, assignedTo: [designer._id], priority: "Medium", status: "Completed", workType: "Design", dueDate: new Date(now.getTime() - 86400000 * 5), description: "Color palette and typography rules." },
    { title: "Financial District Real Estate Market Snapshot Carousel", customer: prestigeClient._id, assignedTo: [designer._id], priority: "Medium", status: "In Progress", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 2), description: "Rental yield and capital appreciation data." },

    { title: "Enterprise LLM Cost Optimization Whitepaper Design", customer: cloudScaleClient._id, assignedTo: [designer._id], priority: "High", status: "Review", workType: "Design", dueDate: todayEnd, description: "Graphic layout for 16-page report." },
    { title: "LinkedIn Thought Leadership Ghostwriting & Carousels (Week 4)", customer: cloudScaleClient._id, assignedTo: [designer._id], priority: "Medium", status: "In Progress", workType: "Content", dueDate: new Date(now.getTime() + 86400000 * 2), description: "4 carousel posts breaking down Kubernetes auto-scaling." },
    { title: "Google Search Competitor Conquesting Ad Campaign Setup", customer: cloudScaleClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "In Progress", workType: "Performance Ads", dueDate: new Date(now.getTime() + 86400000), description: "Deploy search ads for competitor keywords." },
    { title: "SaaS Free Trial Interactive Product Tour Video", customer: cloudScaleClient._id, assignedTo: [videoEditor._id], priority: "Medium", status: "In Progress", workType: "Video", dueDate: new Date(now.getTime() + 86400000 * 4), description: "Slick 60-second dashboard walkthrough." },
    { title: "Email Nurture Sequence for MQL-to-Demo Conversion (6 Emails)", customer: cloudScaleClient._id, assignedTo: [accountManager._id], priority: "Medium", status: "Completed", workType: "Content", dueDate: new Date(now.getTime() - 86400000 * 2), description: "Automated sequence addressing SOC2 and ROI." },
    { title: "Customer Case Study: How FinTech X Cut GPU Bills by 42%", customer: cloudScaleClient._id, assignedTo: [designer._id], priority: "Medium", status: "In Progress", workType: "Content", dueDate: new Date(now.getTime() + 86400000 * 5), description: "2-page case study layout." },

    { title: "Festive Silk Pret Collection Launch Reel", customer: vogueClient._id, assignedTo: [videoEditor._id], priority: "Urgent", status: "In Progress", workType: "Video", dueDate: todayEnd, description: "Aesthetic reel showcasing drape and styling." },
    { title: "Instagram Catalog DPA Feed Refresh", customer: vogueClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "In Progress", workType: "Performance Ads", dueDate: new Date(now.getTime() + 86400000), description: "Update product catalog with new SKUs." },
    { title: "Autumn Lookbook 10-Post Grid Layout & Stories", customer: vogueClient._id, assignedTo: [designer._id], priority: "Medium", status: "Review", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 2), description: "Cohesive aesthetic moodboard." },
    { title: "Abandoned Cart Email Automation Setup (Klaviyo)", customer: vogueClient._id, assignedTo: [mediaBuyer._id], priority: "Medium", status: "Completed", workType: "Performance Ads", dueDate: new Date(now.getTime() - 86400000 * 4), description: "3-tier abandoned cart recovery email series." },
    { title: "Influencer Gifting Unboxing Guidelines & Creative Brief", customer: vogueClient._id, assignedTo: [accountManager._id], priority: "Medium", status: "Completed", workType: "Content", dueDate: new Date(now.getTime() - 86400000), description: "Brief for 20 fashion micro-influencers." },
    { title: "Diwali Early Bird Flash Sale Banner Set (1:1, 9:16, 16:9)", customer: vogueClient._id, assignedTo: [designer._id], priority: "High", status: "In Progress", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 3), description: "Multi-format creative suite." },

    { title: "Chef's Tasting Menu 7-Course Macro Food Reel", customer: amberClient._id, assignedTo: [videoEditor._id], priority: "High", status: "In Progress", workType: "Video", dueDate: new Date(now.getTime() + 86400000), description: "Slow-motion plating shots and truffle shaving." },
    { title: "Hyperlocal Instagram Radius Ad Campaign (5km Jubilee Hills)", customer: amberClient._id, assignedTo: [mediaBuyer._id], priority: "High", status: "Review", workType: "Performance Ads", dueDate: new Date(now.getTime() + 86400000 * 2), description: "Target weekend dining foodies." },
    { title: "Sunday Degustation Brunch Menu Card Redesign", customer: amberClient._id, assignedTo: [designer._id], priority: "Medium", status: "Completed", workType: "Design", dueDate: new Date(now.getTime() - 86400000 * 2), description: "Minimalist earthy layout on textured paper." },
    { title: "Mixology Masterclass Event Poster & Story Teasers", customer: amberClient._id, assignedTo: [designer._id], priority: "Medium", status: "In Progress", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 3), description: "Cocktail workshop creative with QR code." },
    { title: "Google My Business 360 Virtual Tour & Photos Upload", customer: amberClient._id, assignedTo: [mediaBuyer._id], priority: "Low", status: "Completed", workType: "SEO", dueDate: new Date(now.getTime() - 86400000 * 6), description: "Upload 50 high-res photos." },
    { title: "Customer Loyalty Stamp Card & Table Tent Cards", customer: amberClient._id, assignedTo: [designer._id], priority: "Medium", status: "In Progress", workType: "Design", dueDate: new Date(now.getTime() + 86400000 * 4), description: "Complimentary dessert cards." },

    { title: "Q3 Agency Case Study Showreel & Website Refresh", assignedTo: [videoEditor._id], priority: "Medium", status: "In Progress", workType: "Video", dueDate: new Date(now.getTime() + 86400000 * 7), description: "Compile high-growth metrics." },
    { title: "AI Command Workspace V3 Training & Command Optimization", assignedTo: [adminUser._id], priority: "High", status: "Completed", workType: "Dev", dueDate: new Date(now.getTime() - 86400000), description: "Audit 38 operational commands." },
    { title: "Q4 Client Retainer Rate Card & Packaging Review", assignedTo: [adminUser._id], priority: "Medium", status: "In Progress", workType: "Strategy", dueDate: new Date(now.getTime() + 86400000 * 10), description: "Formulate revised packaging structure." },
  ];

  const createdTasks = await Work.insertMany(workItems.map((item) => ({ ...item, branchId: "BR001", createdBy: adminUser._id })));
  console.log(`  ✓ Created ${createdTasks.length} Deliverables.\n`);

  // ---------------------------------------------------------------------------
  // 6. META & GOOGLE AD CAMPAIGNS (6 Campaigns)
  // ---------------------------------------------------------------------------
  console.log(">>> [6/12] Seeding Ad Campaigns...");
  const campaignsData = [
    {
      campaignId: "CAMP-AURA-HYDRA-001",
      customerId: auraClient._id,
      campaignName: "Aura Aesthetics — HydraFacial Glass Skin Special",
      platform: "Meta",
      objective: "LEAD_GENERATION",
      conversionType: "INSTANT_FORM",
      status: "Active",
      platformStatus: "RUNNING",
      platformCampaignId: "act_meta_aura_77218",
      launchedAt: new Date(now.getTime() - 86400000 * 14),
      createdBy: mediaBuyer._id,
      budget: { amount: 1500, totalBudget: 45000, currency: "INR", days: 30, targetCPL: 250 },
      targetLocations: ["Jubilee Hills", "Banjara Hills", "Madhapur", "HITEC City"],
      promotedServices: ["HydraFacial Glow Treatment", "Medical Skin Peels"],
      promotedOffer: "25% Off First HydraFacial Visit",
      metrics: { impressions: 142800, clicks: 3840, spend: 21000, leadsGenerated: 88, costPerLead: 238.6 },
    },
    {
      campaignId: "CAMP-SKYVILLAS-HNI-002",
      customerId: prestigeClient._id,
      campaignName: "Prestige SkyVillas — 4BHK Sky Penthouse Launch",
      platform: "Meta",
      objective: "LEAD_GENERATION",
      conversionType: "WEBSITE_LEAD",
      status: "Active",
      platformStatus: "RUNNING",
      platformCampaignId: "act_meta_prestige_99312",
      launchedAt: new Date(now.getTime() - 86400000 * 20),
      createdBy: mediaBuyer._id,
      budget: { amount: 3000, totalBudget: 90000, currency: "INR", days: 30, targetCPL: 900 },
      targetLocations: ["Financial District", "Gachibowli", "Jubilee Hills", "Kokapet"],
      promotedServices: ["Luxury 4BHK Penthouses", "Private Sky Pools"],
      promotedOffer: "Exclusive Pre-Launch Pricing for First 10 Buyers",
      metrics: { impressions: 98400, clicks: 2120, spend: 54000, leadsGenerated: 64, costPerLead: 843.75 },
    },
    {
      campaignId: "CAMP-CLOUDSCALE-B2B-003",
      customerId: cloudScaleClient._id,
      campaignName: "CloudScale AI — Enterprise GPU Auto-Scaling Pilot",
      platform: "Google",
      objective: "CONVERSIONS",
      conversionType: "DEMO_BOOKING",
      status: "Active",
      platformStatus: "RUNNING",
      platformCampaignId: "act_google_cloudscale_4412",
      launchedAt: new Date(now.getTime() - 86400000 * 10),
      createdBy: mediaBuyer._id,
      budget: { amount: 2500, totalBudget: 75000, currency: "INR", days: 30, targetCPL: 1500 },
      targetLocations: ["Bengaluru", "Hyderabad", "Pune", "NCR"],
      promotedServices: ["AI Infra Auto-scaler", "Kubernetes GPU Optimization"],
      promotedOffer: "Free 14-Day Enterprise GPU Cost Audit",
      metrics: { impressions: 64200, clicks: 1890, spend: 25000, leadsGenerated: 18, costPerLead: 1388.8 },
    },
    {
      campaignId: "CAMP-VOGUE-FESTIVE-004",
      customerId: vogueClient._id,
      campaignName: "VogueCraft — Festive Pret Collection Scale",
      platform: "Meta",
      objective: "PURCHASE",
      conversionType: "SHOPIFY_PURCHASE",
      status: "Active",
      platformStatus: "RUNNING",
      platformCampaignId: "act_meta_vogue_88190",
      launchedAt: new Date(now.getTime() - 86400000 * 7),
      createdBy: mediaBuyer._id,
      budget: { amount: 1800, totalBudget: 54000, currency: "INR", days: 30, targetCPL: 300 },
      targetLocations: ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Kolkata"],
      promotedServices: ["Artisanal Silk Co-ord Sets", "Festive Tunics"],
      promotedOffer: "Buy 2 Get 15% Off | Use Code FESTIVE15",
      metrics: { impressions: 215000, clicks: 6400, spend: 12600, leadsGenerated: 42, costPerLead: 300.0, roas: 4.1 },
    },
    {
      campaignId: "CAMP-AMBER-BRUNCH-005",
      customerId: amberClient._id,
      campaignName: "The Amber Table — Weekend Gourmet Brunch Experience",
      platform: "Meta",
      objective: "LEAD_GENERATION",
      conversionType: "WHATSAPP_BOOKING",
      status: "Active",
      platformStatus: "RUNNING",
      platformCampaignId: "act_meta_amber_33100",
      launchedAt: new Date(now.getTime() - 86400000 * 12),
      createdBy: mediaBuyer._id,
      budget: { amount: 1200, totalBudget: 36000, currency: "INR", days: 30, targetCPL: 150 },
      targetLocations: ["Jubilee Hills", "Banjara Hills", "Madhapur", "Hills 45"],
      promotedServices: ["7-Course Degustation", "Unlimited Sparkling Cocktails"],
      promotedOffer: "Complimentary Chef's Dessert Platter on Table Reservation",
      metrics: { impressions: 88900, clicks: 3100, spend: 14400, leadsGenerated: 112, costPerLead: 128.5 },
    },
    {
      campaignId: "CAMP-AURA-LASER-006",
      customerId: auraClient._id,
      campaignName: "Aura Aesthetics — Carbon Laser Peel Rejuvenation",
      platform: "Meta",
      objective: "LEAD_GENERATION",
      conversionType: "INSTANT_FORM",
      status: "Pending Approval",
      platformStatus: "PAUSED",
      createdBy: mediaBuyer._id,
      budget: { amount: 1000, totalBudget: 30000, currency: "INR", days: 30, targetCPL: 300 },
      targetLocations: ["Jubilee Hills", "Banjara Hills"],
      promotedServices: ["Carbon Laser Peel", "Pore Minimization"],
      promotedOffer: "Introductory Trial Session at ₹1,999",
      metrics: { impressions: 0, clicks: 0, spend: 0, leadsGenerated: 0, costPerLead: 0 },
    },
  ];

  const campaigns = await AdCampaign.insertMany(campaignsData);
  console.log(`  ✓ Created ${campaigns.length} Ad Campaigns.\n`);

  // ---------------------------------------------------------------------------
  // 7. CONTENT CALENDARS & SOCIAL POSTS (5 Monthly Calendars)
  // ---------------------------------------------------------------------------
  console.log(">>> [7/12] Seeding 30-Day Calendars...");
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  for (const client of customers) {
    const calendar = await ContentCalendar.create({
      clientId: client._id,
      title: `${client.name} — ${new Date().toLocaleString("default", { month: "long" })} 30-Day Growth Calendar`,
      month: currentMonth,
      year: currentYear,
      status: "Active",
      strategySummary: `Multi-channel content strategy for ${client.name}.`,
      createdBy: adminUser._id,
      branchId: "BR001",
    });

    const samplePosts = [
      { channel: "Instagram", format: "Reel", title: "Behind the Scenes Craftsmanship", caption: `Excellence is in every detail at #${client.name.replace(/\s+/g, "")}.`, scheduledDate: new Date(now.getTime() + 86400000 * 1), status: "Scheduled" },
      { channel: "Instagram", format: "Carousel", title: "Top 5 Industry Insights You Must Know", caption: "Swipe through to discover the latest strategies. 👉", scheduledDate: new Date(now.getTime() + 86400000 * 3), status: "Scheduled" },
      { channel: "LinkedIn", format: "Text + Image", title: "Founder Perspective on Quality & Scale", caption: "Scaling without compromising on bespoke quality.", scheduledDate: new Date(now.getTime() + 86400000 * 5), status: "Scheduled" },
      { channel: "Facebook", format: "Post", title: "Client Spotlight & Real Results", caption: "Hear what our clients have to say!", scheduledDate: new Date(now.getTime() - 86400000 * 2), status: "Published" },
      { channel: "Instagram", format: "Reel", title: "Quick Masterclass / Tip of the Week", caption: "Save this tip for later! 💡", scheduledDate: new Date(now.getTime() - 86400000 * 5), status: "Published" },
      { channel: "Instagram", format: "Story", title: "Weekend Exclusive Offer Announcement", caption: "Tap the link in bio to claim your perk! ✨", scheduledDate: new Date(now.getTime() + 86400000 * 2), status: "Scheduled" },
    ];

    await ContentItem.insertMany(
      samplePosts.map((p) => ({
        ...p,
        calendarId: calendar._id,
        clientId: client._id,
        createdBy: designer._id,
        assignedTo: designer._id,
        hashtags: ["#Digitalness", "#AgencyGrowth", "#PremiumExperience", `#${client.businessType.split(" ")[0]}`],
      }))
    );
  }
  console.log(`  ✓ Created 5 Monthly Calendars with Social Posts.\n`);

  // ---------------------------------------------------------------------------
  // 8. FINANCIALS: INVOICES & REVENUE (10 Invoices, 5 Expenses)
  // ---------------------------------------------------------------------------
  console.log(">>> [8/12] Seeding Invoices & Expenses...");
  const invoicesData = [
    { invoiceNumber: "INV-2026-0801", customer: auraClient._id, originalAmount: 75000, paidAmount: 75000, balanceAmount: 0, paymentStatus: "PAID", dueDate: new Date(now.getTime() - 86400000 * 15), items: [{ description: "Monthly Digital Retainer & Meta Performance Lead Gen", quantity: 1, unitPrice: 75000, total: 75000 }] },
    { invoiceNumber: "INV-2026-0802", customer: prestigeClient._id, originalAmount: 150000, paidAmount: 150000, balanceAmount: 0, paymentStatus: "PAID", dueDate: new Date(now.getTime() - 86400000 * 12), items: [{ description: "Luxury HNI Real Estate Lead Engine Retainer", quantity: 1, unitPrice: 150000, total: 150000 }] },
    { invoiceNumber: "INV-2026-0803", customer: cloudScaleClient._id, originalAmount: 120000, paidAmount: 120000, balanceAmount: 0, paymentStatus: "PAID", dueDate: new Date(now.getTime() - 86400000 * 8), items: [{ description: "B2B SaaS Growth & LinkedIn Performance Mandate", quantity: 1, unitPrice: 120000, total: 120000 }] },
    { invoiceNumber: "INV-2026-0804", customer: vogueClient._id, originalAmount: 60000, paidAmount: 60000, balanceAmount: 0, paymentStatus: "PAID", dueDate: new Date(now.getTime() - 86400000 * 6), items: [{ description: "E-Commerce Meta DPA Ads & Creative Retainer", quantity: 1, unitPrice: 60000, total: 60000 }] },
    { invoiceNumber: "INV-2026-0805", customer: amberClient._id, originalAmount: 45000, paidAmount: 45000, balanceAmount: 0, paymentStatus: "PAID", dueDate: new Date(now.getTime() - 86400000 * 4), items: [{ description: "Fine Dining Video Production & Footfall Ads", quantity: 1, unitPrice: 45000, total: 45000 }] },

    { invoiceNumber: "INV-2026-0806", customer: auraClient._id, originalAmount: 25000, paidAmount: 0, balanceAmount: 25000, paymentStatus: "UNPAID", dueDate: new Date(now.getTime() + 86400000 * 5), items: [{ description: "Additional Clinic Walkthrough Video", quantity: 1, unitPrice: 25000, total: 25000 }] },
    { invoiceNumber: "INV-2026-0807", customer: prestigeClient._id, originalAmount: 65000, paidAmount: 0, balanceAmount: 65000, paymentStatus: "UNPAID", dueDate: new Date(now.getTime() + 86400000 * 7), items: [{ description: "NRI Investor High-Converting Landing Page", quantity: 1, unitPrice: 65000, total: 65000 }] },
    { invoiceNumber: "INV-2026-0808", customer: cloudScaleClient._id, originalAmount: 40000, paidAmount: 0, balanceAmount: 40000, paymentStatus: "UNPAID", dueDate: new Date(now.getTime() + 86400000 * 10), items: [{ description: "Enterprise Whitepaper Design", quantity: 1, unitPrice: 40000, total: 40000 }] },

    { invoiceNumber: "INV-2026-0790", customer: vogueClient._id, originalAmount: 35000, paidAmount: 0, balanceAmount: 35000, paymentStatus: "OVERDUE", dueDate: new Date(now.getTime() - 86400000 * 12), items: [{ description: "Mid-Season Extra Lookbook Shoot", quantity: 1, unitPrice: 35000, total: 35000 }] },
    { invoiceNumber: "INV-2026-0785", customer: amberClient._id, originalAmount: 20000, paidAmount: 0, balanceAmount: 20000, paymentStatus: "OVERDUE", dueDate: new Date(now.getTime() - 86400000 * 18), items: [{ description: "Mixology Launch Event Standees", quantity: 1, unitPrice: 20000, total: 20000 }] },
  ];

  const invoices = await Invoice.insertMany(invoicesData.map((inv) => ({ ...inv, branchId: "BR001", createdBy: adminUser._id })));
  console.log(`  ✓ Created ${invoices.length} Invoices.\n`);

  const expensesData = [
    { description: "Meta Advertising Platform Spend (Aura Aesthetics)", category: "Marketing & Ads", amount: 21000, expenseDate: new Date(now.getTime() - 86400000 * 2), branchId: "BR001", status: "Approved" },
    { description: "Google Cloud Platform & Vertex AI API Credits", category: "Software & Tools", amount: 18500, expenseDate: new Date(now.getTime() - 86400000 * 5), branchId: "BR001", status: "Approved" },
    { description: "Adobe Creative Cloud & Figma Subscriptions", category: "Software & Tools", amount: 12000, expenseDate: new Date(now.getTime() - 86400000 * 10), branchId: "BR001", status: "Approved" },
    { description: "Midjourney Pro & RunwayML Subscriptions", category: "Software & Tools", amount: 6500, expenseDate: new Date(now.getTime() - 86400000 * 8), branchId: "BR001", status: "Approved" },
    { description: "Studio Light & Camera Rental (Amber Table)", category: "Misc", amount: 8500, expenseDate: new Date(now.getTime() - 86400000 * 3), branchId: "BR001", status: "Approved" },
  ];
  await Expense.insertMany(expensesData);
  console.log(`  ✓ Created ${expensesData.length} Expenses.\n`);

  // ---------------------------------------------------------------------------
  // 9. CUSTOMER SUPPORT TICKETS (5 Tickets)
  // ---------------------------------------------------------------------------
  console.log(">>> [9/12] Seeding Support Tickets...");
  const ticketsData = [
    { ticketId: "TCK-1001", customer: auraClient._id, subject: "Need new offer banner for Independence Day weekend", priority: "High", status: "Open", assignedTo: designer._id, category: "Question", description: "Emergency 20% discount graphic." },
    { ticketId: "TCK-1002", customer: prestigeClient._id, subject: "Update phone number on Facebook Lead Form", priority: "Urgent", status: "Resolved", assignedTo: mediaBuyer._id, category: "Bug", description: "Changed sales routing number." },
    { ticketId: "TCK-1003", customer: cloudScaleClient._id, subject: "UTM tracking mismatch on Google Analytics 4", priority: "Medium", status: "In Progress", assignedTo: mediaBuyer._id, category: "Bug", description: "Align campaign source tags." },
    { ticketId: "TCK-1004", customer: vogueClient._id, subject: "Color correction on Silk Saree catalog reel", priority: "Medium", status: "Open", assignedTo: videoEditor._id, category: "Question", description: "Make the emerald green hue vibrant." },
    { ticketId: "TCK-1005", customer: amberClient._id, subject: "Add WhatsApp booking button to Instagram bio link", priority: "Low", status: "Resolved", assignedTo: accountManager._id, category: "Feature Request", description: "Configured direct WhatsApp click-to-chat link." },
  ];
  await Ticket.insertMany(ticketsData.map((t) => ({ ...t, branchId: "BR001" })));
  console.log(`  ✓ Created ${ticketsData.length} Support Tickets.\n`);

  // ---------------------------------------------------------------------------
  // 10. SLA INCIDENTS & COMPLIANCE (3 Incidents)
  // ---------------------------------------------------------------------------
  console.log(">>> [10/12] Seeding SLA Incident Records...");
  const slaData = [
    { incidentId: "SLA-INC-001", client: auraClient._id, title: "HydraFacial 25% Off Banner Revision SLA Risk", severity: "Medium", status: "Resolved", breachedAt: new Date(now.getTime() - 86400000 * 2), resolvedAt: new Date(now.getTime() - 86400000 * 1), rootCause: "Revision feedback arrived after hours.", resolutionNotes: "Completed in 4 hours next morning." },
    { incidentId: "SLA-INC-002", client: prestigeClient._id, title: "Prestige SkyVilla 4K Reel Rendering Delay", severity: "Low", status: "Resolved", breachedAt: new Date(now.getTime() - 86400000 * 4), resolvedAt: new Date(now.getTime() - 86400000 * 3), rootCause: "4K ProRes cloud export delay.", resolutionNotes: "Delivered within 6 hours." },
    { incidentId: "SLA-INC-003", client: cloudScaleClient._id, title: "Whitepaper Copy Technical Accuracy Review", severity: "Low", status: "Monitoring", breachedAt: new Date(now.getTime() - 86400000 * 1), rootCause: "Awaiting final sign-off from CTO.", resolutionNotes: "Deadline extended by mutual agreement." },
  ];
  await SLAIncident.insertMany(slaData.map((s) => ({ ...s, branchId: "BR001", createdBy: adminUser._id })));
  console.log(`  ✓ Created ${slaData.length} SLA Incidents.\n`);

  // ---------------------------------------------------------------------------
  // 11. MARKETING CONNECTIONS
  // ---------------------------------------------------------------------------
  console.log(">>> [11/12] Seeding Marketing Connections...");
  const connectionsData = [
    { customerId: auraClient._id, platform: "Meta", platformAccountId: "act_meta_aura_77218", platformAccountName: "Aura Aesthetics Clinic Ad Account", status: "Connected", accessToken: "EAAG_simulated_token_aura_aesthetics", connectedAt: new Date(now.getTime() - 86400000 * 30), branchId: "BR001", createdBy: adminUser._id },
    { customerId: prestigeClient._id, platform: "Meta", platformAccountId: "act_meta_prestige_99312", platformAccountName: "Prestige Living Master Ad Account", status: "Connected", accessToken: "EAAG_simulated_token_prestige_skyvillas", connectedAt: new Date(now.getTime() - 86400000 * 45), branchId: "BR001", createdBy: adminUser._id },
    { customerId: cloudScaleClient._id, platform: "GoogleAds", platformAccountId: "act_google_cloudscale_4412", platformAccountName: "CloudScale Enterprise Google Ads", status: "Connected", accessToken: "ya29_simulated_token_cloudscale_google", connectedAt: new Date(now.getTime() - 86400000 * 20), branchId: "BR001", createdBy: adminUser._id },
  ];
  await MarketingConnection.insertMany(connectionsData);
  console.log(`  ✓ Created ${connectionsData.length} Marketing Connections.\n`);

  // ---------------------------------------------------------------------------
  // 12. REFRESH EXECUTIVE BRIEFING SNAPSHOT
  // ---------------------------------------------------------------------------
  console.log(">>> [12/12] Refreshing Executive Briefing Engine...");
  const briefSnapshot = await executiveBriefingEngine.generateMorningBrief();

  console.log("==================================================================");
  console.log("EXECUTIVE MORNING BRIEFING SNAPSHOT (CALCULATED FROM LIVE DB):");
  console.log("==================================================================");
  console.log(`• ⚡ Agency Health Score: ${briefSnapshot.agencyHealth?.score}/100 (${briefSnapshot.agencyHealth?.level})`);
  console.log(`• 📋 Active Deliverables: ${briefSnapshot.delivery?.activeTotal} Tasks in Progress (${briefSnapshot.delivery?.urgentOrToday} Urgent/Due Today)`);
  console.log(`• 🏢 Active Retainers: ${briefSnapshot.clients?.activeCount} Client Accounts`);
  console.log(`• 💰 Inbound Sales Pipeline: ${briefSnapshot.sales?.activeDeals} Active Deals (₹${(briefSnapshot.sales?.pipelineValue || 0).toLocaleString("en-IN")} Value) • ${briefSnapshot.sales?.hotLeads} Hot Leads`);
  console.log(`• 🛡️ SLA Status: ${briefSnapshot.sla?.complianceRate}% Protected • ${briefSnapshot.sla?.criticalBreaches} Critical Breaches`);
  console.log("==================================================================");
  console.log("ALL 12 CORE CRM MODULES SEEDED WITH RICH PRODUCTION DATA!");
  console.log("==================================================================\n");

  return {
    success: true,
    message: "CRM database successfully populated with rich production data across all 15 operational modules!",
    summary: {
      teamMembers: users.length,
      clients: customers.length,
      leads: leads.length,
      deals: deals.length,
      tasks: createdTasks.length,
      campaigns: campaigns.length,
      invoices: invoices.length,
      expenses: expensesData.length,
      tickets: ticketsData.length,
      slaIncidents: slaData.length,
      marketingConnections: connectionsData.length,
      healthScore: briefSnapshot.agencyHealth?.score,
      pipelineValue: briefSnapshot.sales?.pipelineValue,
      activeRetainers: briefSnapshot.clients?.activeCount,
    },
  };
}

module.exports = seedCompleteProductionData;
