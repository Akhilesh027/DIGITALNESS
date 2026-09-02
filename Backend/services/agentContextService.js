const Customer = require("../models/Customer");
const ClientLocation = require("../models/ClientLocation");
const ClientAttachment = require("../models/ClientAttachment");
const ClientAIMemory = require("../models/ClientAIMemory");
const ContentItem = require("../models/ContentItem");

exports.calculateCustomerReadiness = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");

  const locations = await ClientLocation.find({ customerId, status: "Active" });
  const assets = await ClientAttachment.find({ customerId, approvedForAI: true });
  const memories = await ClientAIMemory.find({ customerId, status: "Approved" });

  const isPresent = (val) => {
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return val > 0;
    return true;
  };

  // Helper check list with required vs recommended fields
  const checkFields = (fields) => {
    const total = fields.length;
    let filled = 0;
    const missingRequired = [];
    const missingRecommended = [];

    fields.forEach(({ label, val, required }) => {
      if (isPresent(val)) {
        filled++;
      } else {
        if (required) {
          missingRequired.push(label);
        } else {
          missingRecommended.push(label);
        }
      }
    });

    const score = Math.round((filled / total) * 100);
    const ready = missingRequired.length === 0;

    return {
      score,
      ready,
      missingRequired,
      missingRecommended,
      missing: [...missingRequired, ...missingRecommended],
      status: ready ? (score >= 80 ? "READY" : "PARTIAL") : "NEEDS_DATA",
    };
  };

  const social = checkFields([
    { label: "Business Type / Industry", val: customer.businessType || customer.businessProfile?.industry, required: true },
    { label: "Services Provided", val: customer.businessProfile?.services, required: true },
    { label: "Target Audience", val: customer.businessProfile?.targetAudience, required: false },
    { label: "Primary Social Platforms", val: customer.socialProfile?.primaryPlatforms, required: true },
    { label: "Tone of Voice", val: customer.socialProfile?.toneOfVoice, required: false },
    { label: "CTA Preferences", val: customer.socialProfile?.ctaPreferences, required: false },
  ]);

  const creative = checkFields([
    { label: "Brand Colors", val: customer.brandProfile?.brandColors, required: true },
    { label: "Brand Visual Style", val: customer.brandProfile?.visualStyle, required: true },
    { label: "Approved Brand Logo", val: customer.brandProfile?.logoUrl || assets.length, required: true },
    { label: "Preferred Styles", val: customer.creativePreferences?.preferredStyles, required: false },
    { label: "Default Poster Sizes", val: customer.creativePreferences?.defaultPosterSizes, required: false },
  ]);

  const ads = checkFields([
    { label: "Meta / Google Budget", val: (customer.adsProfile?.monthlyMetaBudget || 0) + (customer.adsProfile?.monthlyGoogleBudget || 0), required: true },
    { label: "Campaign Goals", val: customer.adsProfile?.primaryCampaignGoals, required: true },
    { label: "Target Locations", val: customer.adsProfile?.targetLocations, required: true },
    { label: "Promoted Services", val: customer.adsProfile?.promotedServices, required: false },
  ]);

  const gbp = checkFields([
    { label: "Physical Client Location", val: locations.length, required: true },
    { label: "Location Address", val: locations[0]?.address, required: true },
    { label: "Opening Hours", val: locations[0]?.openingHours, required: false },
    { label: "Location Phone", val: locations[0]?.phone, required: true },
  ]);

  const seo = checkFields([
    { label: "Website URL", val: customer.seoProfile?.website, required: true },
    { label: "Target Cities", val: customer.seoProfile?.targetCities, required: true },
    { label: "Target Keywords", val: customer.seoProfile?.targetKeywords, required: true },
    { label: "Competitors", val: customer.seoProfile?.competitors, required: false },
  ]);

  const lead = checkFields([
    { label: "Qualification Rules", val: customer.leadPreferences?.leadQualificationRules, required: true },
    { label: "Priority Services", val: customer.leadPreferences?.priorityServices, required: false },
    { label: "Follow-up Tone", val: customer.leadPreferences?.followUpTone, required: false },
  ]);

  const reporting = checkFields([
    { label: "Report Frequency", val: customer.reportingPreferences?.reportFrequency, required: true },
    { label: "Primary KPIs", val: customer.reportingPreferences?.primaryKPIs, required: true },
    { label: "Summary Style", val: customer.reportingPreferences?.summaryStyle, required: false },
  ]);

  const overallScore = Math.round(
    (social.score + creative.score + ads.score + gbp.score + seo.score + lead.score + reporting.score) / 7
  );

  return {
    customerId: customer._id,
    customerName: customer.name,
    companyName: customer.companyName,
    overallScore,
    isAIReady: overallScore >= 75,
    agents: {
      parent: { score: overallScore, status: overallScore >= 75 ? "READY" : "NEEDS_DATA" },
      social,
      creative,
      ads,
      gbp,
      seo,
      lead,
      reporting,
    },
  };
};

exports.buildAgentContext = async ({ customerId, locationId = null, agentType = "Parent" }) => {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) throw new Error("Customer not found");

  let location = null;
  if (locationId) {
    location = await ClientLocation.findById(locationId).lean();
  }

  const assets = await ClientAttachment.find({ customerId, approvedForAI: true })
    .select("fileName fileUrl category tags description")
    .lean();

  const memories = await ClientAIMemory.find({ customerId, status: { $in: ["Active", "Approved"] } })
    .select("type title content tags")
    .lean();

  const recentContent = await ContentItem.find({ customerId, approvalStatus: "Approved" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title contentType platforms caption scheduledFor")
    .lean();

  // SANITIZED BASE (Excludes password, salary, bankDetails, tokens)
  const baseClientContext = {
    clientIdentity: {
      customerId: customer._id,
      name: customer.name,
      companyName: customer.companyName,
      businessType: customer.businessType,
      city: customer.city,
      state: customer.state,
      package: customer.package,
    },
    businessSummary: {
      industry: customer.businessProfile?.industry || customer.businessType,
      summary: customer.businessProfile?.businessSummary,
      products: customer.businessProfile?.products || [],
      services: customer.businessProfile?.services || customer.requirements || [],
      targetAudience: customer.businessProfile?.targetAudience || [],
      serviceAreas: customer.businessProfile?.serviceAreas || [],
      competitors: customer.businessProfile?.competitors || [],
    },
    brandRules: {
      tagline: customer.brandProfile?.tagline,
      description: customer.brandProfile?.description,
      logoUrl: (customer.brandProfile?.logoUrl || "").startsWith("data:image")
        ? "[ATTACHED_BASE64_IMAGE_DATA_TRUNCATED]"
        : customer.brandProfile?.logoUrl || "",
      bannerUrl: (customer.brandProfile?.bannerUrl || "").startsWith("data:image")
        ? "[ATTACHED_BASE64_IMAGE_DATA_TRUNCATED]"
        : customer.brandProfile?.bannerUrl || "",
      referenceImages: customer.brandProfile?.referenceImages || [],
      brandColors: customer.brandProfile?.brandColors || [],
      fonts: customer.brandProfile?.fonts || [],
      toneOfVoice: customer.socialProfile?.toneOfVoice || customer.brandProfile?.toneOfVoice || [],
      approvedWords: customer.brandProfile?.approvedWords || [],
      restrictedWords: customer.brandProfile?.restrictedWords || [],
    },
    activeLocation: location
      ? {
          locationId: location._id,
          name: location.name,
          address: location.brandOverrides?.addressOverride || location.address || customer.address,
          city: location.city || customer.city,
          state: location.state || customer.state,
          pincode: location.pincode || customer.pincode,
          phone: location.brandOverrides?.phoneOverride || location.contactNumbers?.[0] || location.phone || customer.contactNumbers?.[0] || "",
          email: location.email || customer.email,
          website: location.website || customer.website,
          openingHours: location.openingHours || "10:00 AM - 8:00 PM",
          cta: location.cta || customer.socialProfile?.ctaPreferences?.[0] || "Book Appointment",
          activeOffers: location.activeOffers || [],
          socialHandles: location.socialHandles || {},
          gbpIdentity: location.gbpIdentity || {},
          brandOverrides: location.brandOverrides || {},
          creativeOverrides: location.creativeOverrides || {},
        }
      : {
          locationId: null,
          name: customer.companyName || customer.name,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          phone: customer.contactNumbers?.[0] || "",
          email: customer.email,
          website: customer.website,
          openingHours: "10:00 AM - 8:00 PM",
          cta: customer.socialProfile?.ctaPreferences?.[0] || "Book Appointment",
          activeOffers: [],
          socialHandles: {},
          gbpIdentity: {},
          brandOverrides: {},
          creativeOverrides: {},
        },
    approvedAssets: assets,
    approvedBrandMemories: memories,
    recentApprovedContent: recentContent,
  };

  switch (agentType) {
    case "Social":
      return {
        agentTarget: "Social Media Agent",
        ...baseClientContext,
        socialStrategy: {
          primaryPlatforms: customer.socialProfile?.primaryPlatforms || ["Instagram", "Facebook"],
          postingFrequency: customer.socialProfile?.postingFrequency || "3 Posts / Week",
          preferredTypes: customer.socialProfile?.preferredContentTypes || ["Poster", "Reel"],
          ctaPreferences: customer.socialProfile?.ctaPreferences || ["Book Appointment"],
          hashtagStrategy: customer.socialProfile?.hashtagStrategy || "",
        },
      };

    case "Creative":
      return {
        agentTarget: "Creative Design Agent",
        ...baseClientContext,
        creativeGuidelines: {
          visualStyle: customer.brandProfile?.visualStyle || "Modern Editorial",
          preferredStyles: customer.creativePreferences?.preferredStyles || [],
          dislikedStyles: customer.creativePreferences?.dislikedStyles || [],
          posterDimensions: customer.creativePreferences?.defaultPosterSizes || ["1080x1080"],
          preferredImageStyle: customer.creativePreferences?.preferredImageStyle || "",
          logoUsageNotes: customer.brandProfile?.logoPreferences || "",
        },
      };

    case "Ads":
      return {
        agentTarget: "Ads Management Agent",
        ...baseClientContext,
        advertisingStrategy: {
          monthlyMetaBudget: customer.adsProfile?.monthlyMetaBudget || 0,
          monthlyGoogleBudget: customer.adsProfile?.monthlyGoogleBudget || 0,
          primaryGoals: customer.adsProfile?.primaryCampaignGoals || ["Lead Generation"],
          targetLocations: customer.adsProfile?.targetLocations || [customer.city],
          promotedServices: customer.adsProfile?.promotedServices || customer.businessProfile?.services || [],
          restrictions: customer.adsProfile?.campaignRestrictions || "",
        },
      };

    case "GBP":
      return {
        agentTarget: "Google Business Profile Agent",
        ...baseClientContext,
        gbpStrategy: {
          locationName: location?.name || customer.companyName || customer.name,
          address: location?.address || customer.address,
          openingHours: location?.openingHours || "10:00 AM - 8:00 PM",
          phone: location?.phone || customer.contactNumbers?.[0] || "",
          activeOffers: location?.activeOffers || [],
        },
      };

    case "SEO":
      return {
        agentTarget: "Search Engine Optimization Agent",
        ...baseClientContext,
        seoStrategy: {
          website: customer.seoProfile?.website || "",
          targetCities: customer.seoProfile?.targetCities || [customer.city],
          priorityServices: customer.seoProfile?.priorityServices || customer.businessProfile?.services || [],
          targetKeywords: customer.seoProfile?.targetKeywords || [],
          competitors: customer.seoProfile?.competitors || [],
        },
      };

    case "Lead":
      return {
        agentTarget: "Lead Nurturing Agent",
        ...baseClientContext,
        leadStrategy: {
          qualificationRules: customer.leadPreferences?.leadQualificationRules || "",
          priorityServices: customer.leadPreferences?.priorityServices || [],
          followUpTone: customer.leadPreferences?.followUpTone || "Helpful & Professional",
          salesContact: customer.leadPreferences?.defaultSalesContact || "",
        },
      };

    case "Reporting":
      return {
        agentTarget: "Reporting Agent",
        ...baseClientContext,
        reportingStrategy: {
          frequency: customer.reportingPreferences?.reportFrequency || "Monthly",
          primaryKPIs: customer.reportingPreferences?.primaryKPIs || ["Leads Generated", "Reach"],
          summaryStyle: customer.reportingPreferences?.summaryStyle || "Executive Summary",
        },
      };

    case "Parent":
    default:
      return {
        agentTarget: "Parent Orchestrator Agent",
        ...baseClientContext,
      };
  }
};
