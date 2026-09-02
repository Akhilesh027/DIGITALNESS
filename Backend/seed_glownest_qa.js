const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const User = require("./models/User");
const Branch = require("./models/Branch");
const { processAIRequest } = require("./ai/orchestrator/parentOrchestrator");

async function runGlowNestTest() {
  console.log("==================================================================");
  console.log("FICTIONAL QA CLIENT (GlowNest Salon) ONBOARDING & AI TEST");
  console.log("==================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const adminUser = await User.findOne({ email: "admin@digitalness.com" }).lean();
  const branch = await Branch.findOne({ branchId: "BR001" }).lean();

  // 1. Create/Update GlowNest Salon Customer
  let customer = await Customer.findOne({ name: "GlowNest Salon" });
  const customerData = {
    name: "GlowNest Salon",
    companyName: "GlowNest Salon & Beauty Studio",
    contactPerson: "Riya Sharma",
    phone: "9000012345",
    email: "glownest.qa@example.com",
    businessType: "Salon & Beauty Services",
    gstNumber: "36ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    address: "Road No. 5, Test Colony",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500072",
    website: "https://example.com/glownest",
    status: "Active",
    package: "25",
    branchId: branch?.branchId || "BR001",
    assignedManager: adminUser?._id,

    brandProfile: {
      brandName: "GlowNest Salon",
      tagline: "Style That Feels Like You",
      description: "A modern premium salon focused on personalized hair, beauty and grooming services.",
      brandColors: ["#1A1A1A"],
      secondaryColors: ["#F7F2ED"],
      additionalColors: ["#C79A6B"],
      fonts: ["Poppins", "Playfair Display"],
      tone: "Premium",
      languages: ["English", "Telugu"],
      approvedWords: ["Premium", "Personalized", "Professional", "Transformation"],
      restrictedWords: ["Cheap", "Guaranteed", "Lowest Price"],
      visualStyle: "Modern luxury editorial salon photography",
      logoPreferences: "Use the logo exactly as provided. Do not distort, recolor or crop.",
      brandGuidelines: "Use clean layouts, premium visuals, minimal text and consistent brand colors.",
    },

    businessProfile: {
      industry: "Beauty & Wellness",
      summary: "GlowNest Salon provides premium hair, beauty and grooming services for men and women.",
      products: ["Professional Hair Care Products", "Beauty Care Products"],
      services: ["Haircut", "Hair Colour", "Hair Spa", "Keratin Treatment", "Facial", "Manicure", "Pedicure"],
      usp: "Experienced stylists, Premium products, Personalized consultations",
      targetAudience: ["Women 20-45", "Men 20-45", "Working Professionals", "College Students"],
      serviceAreas: ["Kukatpally", "Miyapur", "Hyderabad"],
      competitors: ["StyleHub Salon", "UrbanGlow Studio"],
      businessGoals: "Increase appointment bookings, Generate qualified local leads, Improve social media visibility",
      priorityServices: ["Hair Colour", "Keratin Treatment", "Haircut"],
    },

    creativePreferences: {
      preferredStyles: ["Luxury Editorial", "Minimal", "Modern"],
      dislikedStyles: ["Crowded", "Cartoonish", "Excessive gradients"],
      contentRatio: "80% Visual / 20% Content",
      posterSizes: ["1080x1080", "1080x1350"],
      preferredCTA: "Book Appointment",
      preferredImageStyle: "Premium realistic salon photography with editorial lighting",
      typographyPreference: "Clean modern typography with strong visual hierarchy",
      restrictedCreativeDirections: "Do not overcrowd the poster, Do not modify the brand logo, Avoid excessive text",
      referenceNotes: "Keep all social media creatives premium, modern and suitable for Instagram.",
    },

    socialProfile: {
      primaryPlatforms: ["Instagram", "Facebook"],
      postingFrequency: "5 Posts Per Week",
      preferredContentTypes: ["Poster", "Carousel", "Reel", "Offer", "Educational", "Before & After"],
      contentLanguages: ["English", "Telugu"],
      toneOfVoice: "Premium",
      ctaPreferences: ["Book Appointment", "Call Now", "DM Us"],
      hashtagStrategy: "Use Hyderabad, Kukatpally, salon, haircare and beauty-related hashtags.",
      approvedWords: ["Premium", "Transformation", "Professional", "Style"],
      restrictedWords: ["Cheap", "Guaranteed"],
      socialNotes: "Focus on transformations, premium services, offers and educational content.",
    },

    adsProfile: {
      monthlyMetaBudget: 15000,
      monthlyGoogleBudget: 10000,
      primaryCampaignGoals: "Lead Generation, Appointment Bookings",
      targetLocations: ["Kukatpally", "Miyapur"],
      targetAudienceNotes: "Target men and women aged 20-45 living within nearby salon service areas.",
      promotedServices: "Hair Colour, Keratin Treatment, Haircut",
      promotedOffers: "20% Off Selected Services for New Customers",
      leadObjective: "Appointment Enquiry",
      campaignRestrictions: "Do not advertise expired offers, Do not make unsupported claims",
      adsNotes: "Prioritize high-value services and appointment-generation campaigns.",
    },

    seoProfile: {
      website: "https://example.com/glownest",
      primaryDomain: "example.com",
      targetCities: "Hyderabad",
      targetAreas: "Kukatpally, Miyapur",
      priorityServices: "Hair Colour, Keratin Treatment, Haircut",
      targetKeywords: "best salon in Kukatpally, hair colour salon Kukatpally, keratin treatment Hyderabad, premium salon near Miyapur",
      competitors: "StyleHub Salon",
      seoGoals: "Increase local search visibility, Generate organic appointment enquiries",
      priorityLandingPages: "/, /services, /hair-colour",
      seoNotes: "Focus on high-intent local service keywords.",
    },

    leadPreferences: {
      leadQualificationRules: "A valid lead should provide phone number, service interest and preferred location.",
      priorityServices: ["Hair Colour", "Keratin Treatment"],
      targetLeadTypes: ["Appointment", "Price Enquiry", "Service Enquiry"],
      serviceLocations: ["Kukatpally"],
      defaultSalesContact: "Riya Sharma",
      followUpTone: "Professional and friendly",
      followUpNotes: "Follow up with qualified leads promptly during business hours.",
      offerDetails: "20% Off Selected Services for First-Time Customers",
      exclusions: ["Job Enquiry", "Vendor Enquiry", "Spam"],
    },

    reportingPreferences: {
      reportFrequency: "Monthly",
      primaryKPIs: "Leads Generated, Appointments, Cost Per Lead, ROAS",
      secondaryKPIs: "Reach, Engagement, Follower Growth",
      clientReportingNotes: "Prioritize appointment bookings and qualified leads over vanity metrics.",
      comparisonPreference: "Month over Month",
      summaryStyle: "Executive Summary",
    },
  };

  if (!customer) {
    customer = await Customer.create(customerData);
    console.log("✓ Created Customer: GlowNest Salon (ID:", customer._id.toString(), ")");
  } else {
    Object.assign(customer, customerData);
    await customer.save();
    console.log("✓ Updated Customer: GlowNest Salon (ID:", customer._id.toString(), ")");
  }

  // 2. Create/Update Kukatpally Location
  let location = await ClientLocation.findOne({ customerId: customer._id, name: "Kukatpally" });
  const locationData = {
    customerId: customer._id,
    name: "Kukatpally",
    address: "Plot 18, KPHB Main Road",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500072",
    phone: "9000012346",
    email: "kukatpally.glownest@example.com",
    openingHours: "10:00 AM - 9:00 PM",
    website: "https://example.com/glownest/kukatpally",
    services: ["Haircut", "Hair Colour", "Hair Spa", "Keratin Treatment", "Facial"],
    activeOffers: ["20% Off Selected Services"],
    ctaPreferences: "Book Kukatpally Appointment",
    socialHandles: {
      instagram: "@glownest_salon_qa",
      facebook: "GlowNest Salon QA",
    },
    gbpIdentity: {
      businessName: "GlowNest Salon Kukatpally",
      category: "Beauty Salon",
    },
    status: "Active",
  };

  if (!location) {
    location = await ClientLocation.create(locationData);
    console.log("✓ Created Location: Kukatpally (ID:", location._id.toString(), ")");
  } else {
    Object.assign(location, locationData);
    await location.save();
    console.log("✓ Updated Location: Kukatpally (ID:", location._id.toString(), ")");
  }

  // 3. Execute AI Workspace Request
  console.log("\n------------------------------------------------------------------");
  console.log("EXECUTING NATURAL LANGUAGE REQUEST:");
  const promptText = "Create a premium social media poster for GlowNest Salon Kukatpally promoting Hair Colour with 20% off selected services.";
  console.log(`"${promptText}"`);
  console.log("------------------------------------------------------------------\n");

  const aiResult = await processAIRequest({
    prompt: promptText,
    userId: adminUser?._id,
  });

  console.log("=== AI ORCHESTRATION RESPONSE PREVIEW ===");
  console.log(JSON.stringify(aiResult, null, 2));

  await mongoose.disconnect();
}

runGlowNestTest().catch((err) => console.error("Error running GlowNest test:", err));
