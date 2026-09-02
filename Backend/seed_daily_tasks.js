const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const User = require("./models/User");
const Work = require("./models/Work");

async function seedDailyTasks() {
  console.log("Connecting to MongoDB:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to database:", mongoose.connection.name);

  // 1. Resolve or Create Users
  let users = await User.find({ status: { $in: ["Active", "active", null] } }).limit(5);
  if (!users || users.length === 0) {
    const admin = await User.create({
      employeeId: "DIG-2026-0001",
      name: "Super Admin",
      email: "admin@digitalness.com",
      password: "Admin@123456",
      phone: "9876543210",
      role: "Admin",
      department: "Management",
      designation: "System Administrator",
      status: "Active",
    });
    users = [admin];
  }

  const primaryUser = users[0];
  const secondaryUser = users[1] || primaryUser;

  // 2. Resolve or Create Customers
  let glownest = await Customer.findOne({ name: /glownest/i });
  if (!glownest) {
    glownest = await Customer.create({
      name: "GlowNest Salon",
      companyName: "GlowNest Salon & Studio",
      phone: "9000012345",
      email: "glownest@example.com",
      businessType: "Salon & Beauty Services",
      city: "Hyderabad",
      status: "Active",
      package: "25",
      branchId: "BR001",
      createdBy: primaryUser._id,
    });
  }

  let client1 = await Customer.findOne({ name: /client 1/i });
  if (!client1) {
    client1 = await Customer.create({
      name: "Client 1",
      companyName: "Client 1 Real Estate",
      phone: "9876500001",
      email: "contact@client1.com",
      businessType: "Real Estate",
      city: "Hyderabad",
      status: "Active",
      package: "50",
      branchId: "BR001",
      createdBy: primaryUser._id,
    });
  }

  let skyline = await Customer.findOne({ name: /skyline/i });
  if (!skyline) {
    skyline = await Customer.create({
      name: "Skyline Estates",
      companyName: "Skyline Luxury Properties",
      phone: "9876500002",
      email: "info@skylineestates.com",
      businessType: "Real Estate",
      city: "Bangalore",
      status: "Active",
      package: "50",
      branchId: "BR001",
      createdBy: primaryUser._id,
    });
  }

  let apex = await Customer.findOne({ name: /apex/i });
  if (!apex) {
    apex = await Customer.create({
      name: "Apex Clinic",
      companyName: "Apex Multi-Speciality Clinic",
      phone: "9876500003",
      email: "care@apexclinic.com",
      businessType: "Healthcare",
      city: "Mumbai",
      status: "Active",
      package: "25",
      branchId: "BR001",
      createdBy: primaryUser._id,
    });
  }

  let nexus = await Customer.findOne({ name: /nexus/i });
  if (!nexus) {
    nexus = await Customer.create({
      name: "Nexus Retail",
      companyName: "Nexus Fashion & E-Commerce",
      phone: "9876500004",
      email: "support@nexusretail.com",
      businessType: "Retail",
      city: "Delhi NCR",
      status: "Active",
      package: "50",
      branchId: "BR001",
      createdBy: primaryUser._id,
    });
  }

  // Define Date Boundaries
  const todayEOD = new Date();
  todayEOD.setHours(18, 0, 0, 0);

  const tomorrowEOD = new Date();
  tomorrowEOD.setDate(tomorrowEOD.getDate() + 1);
  tomorrowEOD.setHours(18, 0, 0, 0);

  // ----------------------------------------------------
  // 5 TASKS FOR TODAY
  // ----------------------------------------------------
  const tasksToday = [
    {
      title: "Diwali Promotional Poster & 4:5 Instagram Creative",
      customer: glownest._id,
      clientName: glownest.name,
      workType: "Social Media Creative",
      priority: "High",
      status: "In Progress",
      assignedTo: [primaryUser._id],
      dueDate: todayEOD,
      description: "Design high-converting festive promotional poster with approved brand colors.",
    },
    {
      title: "Website Launch Announcement Creative & Storyboard",
      customer: client1._id,
      clientName: client1.name,
      workType: "Design",
      priority: "Urgent",
      status: "In Progress",
      assignedTo: [secondaryUser._id],
      dueDate: todayEOD,
      description: "Official launch announcement poster for Instagram & Facebook with verified CTAs.",
    },
    {
      title: "Meta Lead Gen Ads Campaign Optimization",
      customer: skyline._id,
      clientName: skyline.name,
      workType: "Performance Marketing",
      priority: "High",
      status: "Pending",
      assignedTo: [primaryUser._id],
      dueDate: todayEOD,
      description: "Reallocate ad spend and refresh creative targeting to reduce CPL below ₹120.",
    },
    {
      title: "Technical SEO On-Page Audit & Meta Tags Fix",
      customer: apex._id,
      clientName: apex.name,
      workType: "SEO",
      priority: "Medium",
      status: "In Progress",
      assignedTo: [secondaryUser._id],
      dueDate: todayEOD,
      description: "Audit top 15 service pages, optimize title tags, and fix broken anchor links.",
    },
    {
      title: "Monthly Deliverables Review & Performance Summary",
      customer: nexus._id,
      clientName: nexus.name,
      workType: "General Task",
      priority: "Medium",
      status: "Review",
      assignedTo: [primaryUser._id],
      dueDate: todayEOD,
      description: "Prepare EOM executive performance report and ROAS summary deck for client meeting.",
    },
  ];

  // ----------------------------------------------------
  // 6 TASKS FOR TOMORROW
  // ----------------------------------------------------
  const tasksTomorrow = [
    {
      title: "Homepage UI Wireframes & Mobile Responsiveness Test",
      customer: client1._id,
      clientName: client1.name,
      workType: "Website Dev",
      priority: "High",
      status: "Not Started",
      assignedTo: [secondaryUser._id],
      dueDate: tomorrowEOD,
      description: "Finalize mobile responsive navigation and test contact form API endpoints.",
    },
    {
      title: "30-Second Instagram Reel Video Script & Audio Cue",
      customer: glownest._id,
      clientName: glownest.name,
      workType: "Social Media Creative",
      priority: "Medium",
      status: "Not Started",
      assignedTo: [primaryUser._id],
      dueDate: tomorrowEOD,
      description: "Script 3 viral hooks for hair transformation reel with trending audio timestamps.",
    },
    {
      title: "Complete Website UI & Commercial Assets Pack",
      customer: glownest._id,
      clientName: "ABC Client",
      workType: "Design",
      priority: "High",
      status: "Pending",
      assignedTo: [secondaryUser._id],
      dueDate: tomorrowEOD,
      description: "Export high-resolution SVGs, web-optimized hero banners, and vector icons.",
    },
    {
      title: "Commercial Scope of Work & Quotation Proposal",
      customer: client1._id,
      clientName: "BHU Client",
      workType: "Proposal",
      priority: "Medium",
      status: "Pending",
      assignedTo: [primaryUser._id],
      dueDate: tomorrowEOD,
      description: "Draft ₹50,000 Growth Engine commercial proposal with SLA terms.",
    },
    {
      title: "Landing Page Conversion Rate Audit & Heatmap Analysis",
      customer: skyline._id,
      clientName: skyline.name,
      workType: "Website Dev",
      priority: "Medium",
      status: "Not Started",
      assignedTo: [secondaryUser._id],
      dueDate: tomorrowEOD,
      description: "Analyze Hotjar user recordings on villa booking page and reduce drop-off rate.",
    },
    {
      title: "Google Search Ads Keywords & Negative Match Refinement",
      customer: apex._id,
      clientName: apex.name,
      workType: "Performance Marketing",
      priority: "High",
      status: "Not Started",
      assignedTo: [primaryUser._id],
      dueDate: tomorrowEOD,
      description: "Add 45 negative keywords and adjust geo-targeting bids for clinic consultation ads.",
    },
  ];

  // Insert Tasks
  console.log("\nInserting 5 tasks for TODAY...");
  for (const t of tasksToday) {
    const created = await Work.create({
      ...t,
      timeline: [
        {
          title: "Task Scheduled for Today",
          description: `Scheduled via Daily Operations Manager for ${t.clientName}`,
          createdBy: primaryUser._id,
          createdAt: new Date(),
        },
      ],
    });
    console.log(`  ✓ [TODAY] ${created.title} (${t.clientName})`);
  }

  console.log("\nInserting 6 tasks for TOMORROW...");
  for (const t of tasksTomorrow) {
    const created = await Work.create({
      ...t,
      timeline: [
        {
          title: "Task Scheduled for Tomorrow",
          description: `Scheduled via Daily Operations Manager for ${t.clientName}`,
          createdBy: primaryUser._id,
          createdAt: new Date(),
        },
      ],
    });
    console.log(`  ✓ [TOMORROW] ${created.title} (${t.clientName})`);
  }

  const totalCount = await Work.countDocuments();
  console.log(`\n🎉 SUCCESS! Created 11 new tasks. Total Work records in DB: ${totalCount}`);

  await mongoose.disconnect();
}

seedDailyTasks()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed to seed daily tasks:", e);
    process.exit(1);
  });
