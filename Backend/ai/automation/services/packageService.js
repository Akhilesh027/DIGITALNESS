/**
 * packageService.js
 * Service for managing dynamic ServicePackageTemplate definitions and auto-matching packages.
 */

const ServicePackageTemplate = require("../../../models/ServicePackageTemplate");

const DEFAULT_PACKAGES = [
  {
    name: "Standard Digital Marketing",
    code: "STANDARD_DIGITAL_MARKETING",
    description: "Complete agency digital marketing baseline (12 Creatives, 4 Reels, 4 Google Business Posts, 1 Monthly Performance Report = 21 Deliverables).",
    active: true,
    industryTags: ["GENERAL", "SALON", "FURNITURE", "HOSPITALITY", "RETAIL"],
    deliverables: [
      {
        type: "SOCIAL_CREATIVE",
        title: "Social Media Creative Poster",
        quantity: 12,
        cadence: "MONTHLY",
        preferredRole: "Graphic Designer",
        slaHours: 48,
        schedulingStrategy: "DISTRIBUTE_MONTH",
        requiresApproval: true,
      },
      {
        type: "REEL",
        title: "Short Video Reel / Motion Graphic",
        quantity: 4,
        cadence: "MONTHLY",
        preferredRole: "Graphic Designer",
        slaHours: 72,
        schedulingStrategy: "WEEKLY",
        requiresApproval: true,
      },
      {
        type: "GBP_POST",
        title: "Google Business Profile Post & Update",
        quantity: 4,
        cadence: "MONTHLY",
        preferredRole: "Content Writer",
        slaHours: 24,
        schedulingStrategy: "WEEKLY",
        requiresApproval: false,
      },
      {
        type: "MONTHLY_REPORT",
        title: "Monthly Growth & Performance Report",
        quantity: 1,
        cadence: "MONTHLY",
        preferredRole: "Operational Manager",
        slaHours: 48,
        schedulingStrategy: "MONTH_END",
        requiresApproval: true,
      },
    ],
  },
  {
    name: "Performance Marketing",
    code: "PERFORMANCE_MARKETING",
    description: "Paid acquisition & ads scaling package (3 Ad Creatives, 3 Copy Variations, Meta Ads Setup, Google Ads Setup, Weekly Optimization, Monthly Report = 13 Deliverables).",
    active: true,
    industryTags: ["E_COMMERCE", "LEAD_GEN", "HEALTHCARE", "REAL_ESTATE", "GENERAL"],
    deliverables: [
      {
        type: "AD_CREATIVE",
        title: "High-Converting Ad Creative",
        quantity: 3,
        cadence: "MONTHLY",
        preferredRole: "Graphic Designer",
        slaHours: 48,
        schedulingStrategy: "DISTRIBUTE_MONTH",
        requiresApproval: true,
      },
      {
        type: "AD_COPY",
        title: "Ad Copy Variations & Angles",
        quantity: 3,
        cadence: "MONTHLY",
        preferredRole: "Content Writer",
        slaHours: 24,
        schedulingStrategy: "DISTRIBUTE_MONTH",
        requiresApproval: false,
      },
      {
        type: "CAMPAIGN_SETUP",
        title: "Meta & Google Ads Campaign Setup",
        quantity: 2,
        cadence: "MONTHLY",
        preferredRole: "Performance Marketer",
        slaHours: 48,
        schedulingStrategy: "MONTH_START",
        requiresApproval: true,
      },
      {
        type: "WEEKLY_OPTIMIZATION",
        title: "Weekly Ad Performance Optimization",
        quantity: 4,
        cadence: "WEEKLY",
        preferredRole: "Performance Marketer",
        slaHours: 24,
        schedulingStrategy: "WEEKLY",
        requiresApproval: false,
      },
      {
        type: "MONTHLY_REPORT",
        title: "ROAS & Performance Marketing Report",
        quantity: 1,
        cadence: "MONTHLY",
        preferredRole: "Operational Manager",
        slaHours: 48,
        schedulingStrategy: "MONTH_END",
        requiresApproval: true,
      },
    ],
  },
  {
    name: "SEO Growth",
    code: "SEO_GROWTH",
    description: "Search Engine Optimization roadmap (Technical SEO Audit, 4 Blog Articles, 4 GBP Posts, Monthly Report = 10 Deliverables).",
    active: true,
    industryTags: ["LOCAL_BUSINESS", "B2B", "HEALTHCARE", "REAL_ESTATE"],
    deliverables: [
      {
        type: "SEO_AUDIT",
        title: "Technical SEO Audit & Error Fixes",
        quantity: 1,
        cadence: "MONTHLY",
        preferredRole: "Performance Marketer",
        slaHours: 72,
        schedulingStrategy: "MONTH_START",
        requiresApproval: true,
      },
      {
        type: "BLOG_POST",
        title: "SEO Optimized Long-Form Blog Article",
        quantity: 4,
        cadence: "MONTHLY",
        preferredRole: "Content Writer",
        slaHours: 48,
        schedulingStrategy: "WEEKLY",
        requiresApproval: true,
      },
      {
        type: "GBP_POST",
        title: "Local SEO Google Business Post",
        quantity: 4,
        cadence: "MONTHLY",
        preferredRole: "Content Writer",
        slaHours: 24,
        schedulingStrategy: "WEEKLY",
        requiresApproval: false,
      },
      {
        type: "MONTHLY_REPORT",
        title: "Keyword Rankings & Organic Traffic Report",
        quantity: 1,
        cadence: "MONTHLY",
        preferredRole: "Operational Manager",
        slaHours: 48,
        schedulingStrategy: "MONTH_END",
        requiresApproval: true,
      },
    ],
  },
  {
    name: "Salon Growth Package",
    code: "SALON_GROWTH",
    description: "Tailored monthly marketing package for luxury salons & spas (15 Instagram Creatives, 4 Reels, Weekend Promo Campaigns, 1 Monthly Report = 21 Deliverables).",
    active: true,
    industryTags: ["SALON", "SPA", "BEAUTY"],
    deliverables: [
      {
        type: "SOCIAL_CREATIVE",
        title: "Salon Trend & Style Creative",
        quantity: 15,
        cadence: "MONTHLY",
        preferredRole: "Graphic Designer",
        slaHours: 48,
        schedulingStrategy: "DISTRIBUTE_MONTH",
        requiresApproval: true,
      },
      {
        type: "REEL",
        title: "Hair Transformation / Before-After Reel",
        quantity: 4,
        cadence: "MONTHLY",
        preferredRole: "Graphic Designer",
        slaHours: 72,
        schedulingStrategy: "WEEKLY",
        requiresApproval: true,
      },
      {
        type: "MONTHLY_REPORT",
        title: "Salon Bookings & Social Growth Report",
        quantity: 1,
        cadence: "MONTHLY",
        preferredRole: "Operational Manager",
        slaHours: 48,
        schedulingStrategy: "MONTH_END",
        requiresApproval: true,
      },
    ],
  },
];

class PackageService {
  /**
   * Seeds default packages into database if none exist.
   */
  async ensureDefaultPackages() {
    for (const pkg of DEFAULT_PACKAGES) {
      const exists = await ServicePackageTemplate.findOne({ code: pkg.code });
      if (!exists) {
        await ServicePackageTemplate.create(pkg);
      }
    }
  }

  /**
   * Retrieves all active packages.
   */
  async getAllPackages() {
    await this.ensureDefaultPackages();
    return await ServicePackageTemplate.find({ active: true }).sort({ createdAt: 1 }).lean();
  }

  /**
   * Finds a package by ID or Code.
   */
  async getPackage(packageRef) {
    if (!packageRef) return null;
    await this.ensureDefaultPackages();

    let pkg = null;
    if (packageRef.match(/^[0-9a-fA-F]{24}$/)) {
      pkg = await ServicePackageTemplate.findById(packageRef).lean();
    }
    if (!pkg) {
      pkg = await ServicePackageTemplate.findOne({
        code: String(packageRef).toUpperCase().trim(),
      }).lean();
    }
    if (!pkg) {
      pkg = await ServicePackageTemplate.findOne({
        name: new RegExp(String(packageRef).trim(), "i"),
      }).lean();
    }
    return pkg;
  }

  /**
   * Automatically matches the best package from lead requirements or business type.
   */
  async matchPackage({ requirements = [], businessType = "", prompt = "" }) {
    await this.ensureDefaultPackages();
    const reqStr = (Array.isArray(requirements) ? requirements.join(" ") : String(requirements)).toLowerCase();
    const bType = String(businessType || "").toLowerCase();
    const pStr = String(prompt || "").toLowerCase();
    const combined = `${reqStr} ${bType} ${pStr}`;

    if (combined.includes("salon") || combined.includes("spa") || combined.includes("beauty")) {
      const salonPkg = await this.getPackage("SALON_GROWTH");
      if (salonPkg) return salonPkg;
    }

    if (combined.includes("ads") || combined.includes("ppc") || combined.includes("performance") || combined.includes("meta ads") || combined.includes("google ads")) {
      const perfPkg = await this.getPackage("PERFORMANCE_MARKETING");
      if (perfPkg) return perfPkg;
    }

    if (combined.includes("seo") || combined.includes("search engine") || combined.includes("organic") || combined.includes("blog")) {
      const seoPkg = await this.getPackage("SEO_GROWTH");
      if (seoPkg) return seoPkg;
    }

    // Default fallback is Standard Digital Marketing
    return await this.getPackage("STANDARD_DIGITAL_MARKETING");
  }
}

module.exports = new PackageService();
