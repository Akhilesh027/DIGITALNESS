const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersByBranch,
  addCustomerCommunication,
  addCustomerDocument,
  deleteCustomerDocument,
  resetCustomerPassword,
  getCustomerReadiness,
  getContextPreview,
} = require("../controllers/customerController.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.get("/branch/:branchId", getCustomersByBranch);

router.get("/:id/readiness", getCustomerReadiness);
router.get("/:id/context-preview", getContextPreview);
router.post("/:id/communications", addCustomerCommunication);
router.post("/:id/documents", addCustomerDocument);
router.delete("/:id/documents/:documentIndex", deleteCustomerDocument);
router.put("/:id/reset-password", resetCustomerPassword);

router.post("/seed-social-data", async (req, res) => {
  try {
    const Customer = require("../models/Customer");
    const ClientLocation = require("../models/ClientLocation");
    const ContentItem = require("../models/ContentItem");
    const CreativeProject = require("../models/CreativeProject");
    const ScheduledJob = require("../models/ScheduledJob");
    const User = require("../models/User");

    let admin = await User.findOne({ role: "Admin" }) || await User.findOne({});
    let customer = await Customer.findOne({ name: /GlowNest/i }) || await Customer.findOne({});

    if (!customer) {
      customer = await Customer.create({
        name: "GlowNest Luxury Salon",
        companyName: "GlowNest Wellness Pvt Ltd",
        businessType: "Salon & Beauty",
        contactNumbers: ["9000012346"],
        email: "info@glownest.com",
        address: "Plot 18, KPHB Main Road",
        city: "Hyderabad",
        state: "Telangana",
        branchId: "BR001",
        createdBy: admin?._id,
      });
    }

    customer.socialIntegrations = {
      instagram: {
        accountId: "17841405912384729",
        username: "@glownest_salon",
        accessToken: "EAAGNO4...sample_long_lived_ig_token_verified",
        connected: true,
        connectedAt: new Date(),
      },
      facebook: {
        pageId: "108489218491021",
        pageName: "GlowNest Luxury Salon & Spa",
        accessToken: "EAAGNO4...sample_long_lived_fb_page_token_verified",
        connected: true,
        connectedAt: new Date(),
      },
      googleBusiness: {
        locationId: "locations/glownest_kphb_01",
        accountId: "accounts/112233445566",
        connected: true,
        connectedAt: new Date(),
      },
    };
    await customer.save();

    let location = await ClientLocation.findOne({ customerId: customer._id });
    if (!location) {
      location = await ClientLocation.create({
        customerId: customer._id,
        name: "Kukatpally Flagship Branch",
        city: "Hyderabad",
        address: "Plot 18, Road No. 1, KPHB Colony",
        phone: "9000012346",
        status: "Active",
      });
    }

    const sampleItems = [
      {
        title: "Summer Hair Colour & Spa Festival",
        headline: "COLOUR YOUR CONFIDENCE — 20% OFF",
        supportingCopy: "Transform your hair with ammonia-free gloss & conditioning treatments.",
        caption: "Step into Summer with a radiant new look! ✨ Enjoy 20% OFF all Balayage, Global Hair Colour & Organic Spa treatments this week at GlowNest Salon.\n\n📍 Kukatpally Branch | Call 9000012346 to book your stylist.",
        hashtags: ["#GlowNestSalon", "#HyderabadSalons", "#HairTransformation", "#BalayageHyderabad", "#SummerGlow2026"],
        mediaUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop",
        platforms: ["Instagram", "Facebook"],
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "Scheduled",
        approvalStatus: "Approved",
        publishStatus: "Scheduled",
      },
      {
        title: "Weekend Bridal & Glow Makeover Package",
        headline: "FLAWLESS BRIDAL GLOW — PRE-BOOK NOW",
        supportingCopy: "Comprehensive pre-bridal skincare, hair styling & HD makeup packages.",
        caption: "Your special day deserves perfection 👰 Book our signature HD Bridal & Party Glow packages and get a complimentary Hair Spa upgrade!\n\n✨ Direct message us or visit our Kukatpally branch today.",
        hashtags: ["#BridalMakeupHyderabad", "#HyderabadBrides", "#GlowNestBrides", "#HDMakeup", "#WeddingGlow"],
        mediaUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1080&auto=format&fit=crop",
        platforms: ["Instagram", "Facebook"],
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        status: "Scheduled",
        approvalStatus: "Approved",
        publishStatus: "Scheduled",
      },
      {
        title: "Keratin Smooth Luxury Hair Treatment",
        headline: "ZERO FRIZZ. 100% SHINE.",
        supportingCopy: "Long-lasting keratin smoothing for manageable, silky hair.",
        caption: "Say goodbye to humidity frizz! Experience silky, salon-smooth hair for up to 4 months with our Keratin Infusion therapy.\n\nAppointments available daily at our Kukatpally flagship salon.",
        hashtags: ["#KeratinTreatment", "#SmoothHairGoals", "#HyderabadBeauty", "#HairCareDaily"],
        mediaUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1080&auto=format&fit=crop",
        platforms: ["Instagram", "Facebook"],
        scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "Published",
        approvalStatus: "Approved",
        publishStatus: "Published",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const itemData of sampleItems) {
      const creative = await CreativeProject.create({
        title: `${itemData.title} - Poster Asset`,
        customerId: customer._id,
        clientLocationId: location._id,
        assetType: "Poster",
        dimensions: { width: 1080, height: 1080, aspectRatio: "1:1" },
        visualDirection: "Editorial salon photography with elegant typography and brand palette",
        conceptName: itemData.title,
        versions: [
          {
            versionNumber: 1,
            fileUrl: itemData.mediaUrl,
            thumbnailUrl: itemData.mediaUrl,
            conceptName: itemData.title,
            headline: itemData.headline,
            supportingCopy: itemData.supportingCopy,
            cta: "Book Appointment",
            status: "Approved",
            createdBy: admin?._id,
          },
        ],
        currentVersion: 1,
        approvalStatus: "Approved",
        createdBy: admin?._id,
      });

      const content = await ContentItem.create({
        title: itemData.title,
        customerId: customer._id,
        clientLocationId: location._id,
        creativeProjectId: creative._id,
        contentType: "Poster",
        platforms: itemData.platforms,
        headline: itemData.headline,
        supportingCopy: itemData.supportingCopy,
        caption: itemData.caption,
        mediaUrl: itemData.mediaUrl,
        hashtags: itemData.hashtags,
        scheduledFor: itemData.scheduledFor,
        status: itemData.status,
        approvalStatus: itemData.approvalStatus,
        publishStatus: itemData.publishStatus,
        publishedAt: itemData.publishedAt || null,
        approvedBy: admin?._id,
        approvedAt: new Date(),
        createdBy: admin?._id,
      });

      const jobStatus = itemData.status === "Published" ? "Completed" : "Queued";
      await ScheduledJob.create({
        jobType: "ContentPublish",
        queueName: "scheduled-content",
        customerId: customer._id,
        clientLocationId: location._id,
        entityType: "ContentItem",
        entityId: content._id,
        scheduledFor: itemData.scheduledFor,
        timezone: "Asia/Kolkata",
        payload: {
          contentItemId: content._id,
          title: content.title,
          headline: itemData.headline,
          supportingCopy: itemData.supportingCopy,
          caption: itemData.caption,
          hashtags: itemData.hashtags,
          imageUrl: itemData.mediaUrl,
        },
        status: jobStatus,
        executedAt: itemData.status === "Published" ? itemData.publishedAt : null,
        createdBy: admin?._id,
        approvedBy: admin?._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Social integrations and sample scheduled campaigns seeded successfully!",
      customer: {
        name: customer.name,
        socialIntegrations: customer.socialIntegrations,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;