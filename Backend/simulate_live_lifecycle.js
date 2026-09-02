const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const Customer = require("./models/Customer");
const Lead = require("./models/Lead");
const Work = require("./models/Work");
const Invoice = require("./models/Invoice");
const AdCampaign = require("./models/AdCampaign");
const User = require("./models/User");

const leadAutoAssignService = require("./services/leadAutoAssignService");
const clientAutoProvisioningService = require("./services/clientAutoProvisioningService");
const adCreativeHandoffService = require("./services/adCreativeHandoffService");
const metaAdsDispatchService = require("./services/metaAdsDispatchService");
const adLeadAttributionService = require("./services/adLeadAttributionService");
const contentCalendarEngine = require("./ai/automation/engines/ContentCalendarEngine");
const executiveBriefingEngine = require("./ai/automation/engines/ExecutiveBriefingEngine");

async function simulateLiveLifecycle() {
  await Lead.deleteMany({ email: /auraaesthetics/i });
  await Customer.deleteMany({ email: /auraaesthetics/i });
  await AdCampaign.deleteMany({ campaignId: /CAMP-AURA/i });

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
  await metaAdsDispatchService.dispatchCampaign(campaign._id);

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

  try {
    await contentCalendarEngine.generateCalendar({
      clientId: customer._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  } catch (e) {}

  const briefSnapshot = await executiveBriefingEngine.generateMorningBrief();

  return {
    success: true,
    customer,
    lead: createdLead,
    invoice: provisioningRes.invoiceResult,
    campaign,
    attribution: attrRes,
    briefSnapshot,
  };
}

module.exports = simulateLiveLifecycle;
