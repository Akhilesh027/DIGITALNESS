const CreativeProject = require("../models/CreativeProject");
const Customer = require("../models/Customer");
const WorkApproval = require("../models/WorkApproval");
const AuditLog = require("../models/AuditLog");

const safeAuditLog = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.warn("[AuditLog Warning]:", err.message);
  }
};

exports.getCreativeProjects = async (req, res) => {
  try {
    const { customerId, clientLocationId, approvalStatus, assetType } = req.query;
    let filter = {};

    if (customerId) filter.customerId = customerId;
    if (clientLocationId) filter.clientLocationId = clientLocationId;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (assetType) filter.assetType = assetType;

    const projects = await CreativeProject.find(filter)
      .populate("customerId", "name companyName")
      .populate("clientLocationId", "name city")
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCreativeProjectById = async (req, res) => {
  try {
    const project = await CreativeProject.findById(req.params.id)
      .populate("customerId", "name companyName")
      .populate("clientLocationId", "name city")
      .populate("versions.createdBy", "name email role")
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Creative project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createCreativeProject = async (req, res) => {
  try {
    const { customerId, title, fileUrl, assetType, dimensions, prompt, notes } = req.body;

    if (!customerId || !title) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and title are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Associated Customer not found",
      });
    }

    const initialVersion = fileUrl
      ? [
          {
            versionNumber: 1,
            fileUrl,
            prompt: prompt || "",
            notes: notes || "Initial Version 1",
            createdBy: req.user?._id,
            createdAt: new Date(),
          },
        ]
      : [];

    const project = await CreativeProject.create({
      ...req.body,
      versions: initialVersion,
      currentVersion: initialVersion.length ? 1 : 0,
      createdBy: req.user?._id,
    });

    await AuditLog.create({
      actorType: req.user?.role || "Employee",
      actorId: req.user?._id,
      actorName: req.user?.name || "User",
      action: "creative_project_created",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      inputSummary: `Created creative project "${project.title}" (V1)`,
      status: "Success",
    });

    res.status(201).json({
      success: true,
      message: "Creative project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addCreativeVersion = async (req, res) => {
  try {
    const {
      fileUrl,
      bgImageUrl,
      heroImageUrl,
      headline,
      subheadline,
      offerText,
      ctaText,
      primaryColor,
      accentColor,
      secondaryColor,
      phone,
      website,
      locationName,
      showLogo,
      logoScale,
      logoUrl,
      logoBgStyle,
      layoutTheme,
      prompt,
      notes,
    } = req.body;

    if (!fileUrl && !bgImageUrl) {
      return res.status(400).json({
        success: false,
        message: "fileUrl or bgImageUrl is required to add a new creative version",
      });
    }

    const project = await CreativeProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Creative project not found",
      });
    }

    const nextVersionNumber = (project.versions?.length || 0) + 1;
    const resolvedBg = bgImageUrl || heroImageUrl || project.bgImageUrl || fileUrl;

    const newVersion = {
      versionNumber: nextVersionNumber,
      fileUrl: fileUrl || resolvedBg,
      bgImageUrl: resolvedBg,
      heroImageUrl: resolvedBg,
      headline: headline !== undefined ? headline : project.headline || "",
      subheadline: subheadline !== undefined ? subheadline : project.subheadline || "",
      offerText: offerText !== undefined ? offerText : project.offerText || "",
      ctaText: ctaText !== undefined ? ctaText : project.ctaText || "",
      primaryColor: primaryColor || project.primaryColor || "",
      accentColor: accentColor || project.accentColor || "",
      phone: phone !== undefined ? phone : project.phone || "",
      website: website !== undefined ? website : project.website || "",
      locationName: locationName !== undefined ? locationName : project.locationName || "",
      showLogo: showLogo !== undefined ? showLogo : project.showLogo ?? true,
      logoScale: typeof logoScale === "number" ? logoScale : 1.0,
      logoUrl: logoUrl !== undefined ? logoUrl : project.logoUrl || "",
      logoBgStyle: logoBgStyle || "pill",
      layoutTheme: layoutTheme || project.layoutTheme || "gold_luxury",
      prompt: prompt || project.aiPrompt || "",
      notes: notes || `Version ${nextVersionNumber}`,
      createdBy: req.user?._id,
      createdAt: new Date(),
    };

    project.versions.push(newVersion);
    project.currentVersion = nextVersionNumber;
    project.bgImageUrl = resolvedBg;
    if (headline !== undefined) project.headline = headline;
    if (subheadline !== undefined) project.subheadline = subheadline;
    if (offerText !== undefined) project.offerText = offerText;
    if (ctaText !== undefined) project.ctaText = ctaText;
    if (primaryColor) project.primaryColor = primaryColor;
    if (accentColor) project.accentColor = accentColor;
    if (phone !== undefined) project.phone = phone;
    if (website !== undefined) project.website = website;
    if (locationName !== undefined) project.locationName = locationName;
    if (showLogo !== undefined) project.showLogo = showLogo;
    if (logoScale !== undefined) project.logoScale = logoScale;
    if (logoUrl !== undefined) project.logoUrl = logoUrl;
    if (logoBgStyle !== undefined) project.logoBgStyle = logoBgStyle;
    if (layoutTheme !== undefined) project.layoutTheme = layoutTheme;
    if (prompt) project.aiPrompt = prompt;

    await project.save();

    await safeAuditLog({
      actorType: req.user?.role || "Employee",
      actorId: req.user?._id,
      actorName: req.user?.name || "User",
      action: "creative_version_added",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      inputSummary: `Added Version ${nextVersionNumber} to "${project.title}"`,
      status: "Success",
    });

    const populatedProject = await CreativeProject.findById(project._id)
      .populate("customerId", "name companyName brandProfile logoUrl phone website city")
      .populate("clientLocationId", "name city")
      .populate("createdBy", "name email role")
      .populate("approvedBy", "name email role");

    res.status(200).json({
      success: true,
      message: `Version ${nextVersionNumber} added successfully`,
      project: populatedProject || project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.scheduleCreativeProject = async (req, res) => {
  try {
    const {
      scheduledFor,
      platforms,
      headline,
      caption,
      hashtags,
      posterData,
      notes,
    } = req.body;

    const project = await CreativeProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Creative project not found",
      });
    }

    // Auto-approve the creative project
    project.approvalStatus = "Approved";
    project.approvedVersion = project.currentVersion;
    project.approvedBy = req.user?._id;
    project.approvedAt = new Date();
    await project.save();

    let targetDate = new Date();
    if (scheduledFor) {
      targetDate = new Date(scheduledFor);
      if (isNaN(targetDate.getTime())) {
        targetDate = new Date(Date.now() + 30 * 60000); // 30 mins default
      }
    } else {
      targetDate = new Date(Date.now() + 30 * 60000);
    }

    const ContentItem = require("../models/ContentItem");
    const ScheduledJob = require("../models/ScheduledJob");
    const { getQueue } = require("../queues/queueRegistry");

    const resolvedPlatforms = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ["Instagram", "Facebook"];

    const resolvedHeadline = headline || project.headline || project.title;
    const resolvedCaption = caption || `${resolvedHeadline}\n\n${project.subheadline || ""}\n\n${project.ctaText || "Connect with us today!"}`.trim();
    const resolvedHashtags = Array.isArray(hashtags) && hashtags.length > 0
      ? hashtags
      : ["#DigitalMarketing", "#SpecialOffer", "#BrandPromotion"];
    const latestVer = project.versions?.[project.versions?.length - 1];
    const resolvedMediaUrl = project.bgImageUrl || latestVer?.bgImageUrl || latestVer?.fileUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop";

    // 1. Create or Update ContentItem
    let contentItem = null;
    if (project.contentItemId) {
      contentItem = await ContentItem.findById(project.contentItemId);
    }

    if (contentItem) {
      contentItem.title = project.title;
      contentItem.headline = resolvedHeadline;
      contentItem.caption = resolvedCaption;
      contentItem.hashtags = resolvedHashtags;
      contentItem.platforms = resolvedPlatforms;
      contentItem.mediaUrl = resolvedMediaUrl;
      contentItem.scheduledFor = targetDate;
      contentItem.status = "Scheduled";
      contentItem.approvalStatus = "Approved";
      contentItem.publishStatus = "Scheduled";
      await contentItem.save();
    } else {
      contentItem = await ContentItem.create({
        customerId: project.customerId,
        clientLocationId: project.clientLocationId,
        creativeProjectId: project._id,
        title: project.title,
        campaignName: project.campaignName || "Studio Campaign",
        contentType: project.assetType || "Poster",
        platforms: resolvedPlatforms,
        caption: resolvedCaption,
        mediaUrl: resolvedMediaUrl,
        hashtags: resolvedHashtags,
        scheduledFor: targetDate,
        status: "Scheduled",
        approvalStatus: "Approved",
        approvedBy: req.user?._id,
        approvedAt: new Date(),
        publishStatus: "Scheduled",
        createdBy: req.user?._id,
      });
      project.contentItemId = contentItem._id;
      await project.save();
    }

    // 2. Create or Update ScheduledJob
    let scheduledJob = await ScheduledJob.findOne({
      entityId: contentItem._id,
      status: { $in: ["Pending", "Queued"] },
    });

    const delayMs = Math.max(0, targetDate.getTime() - Date.now());
    let bullJobId = "";
    let queueCreated = false;

    try {
      const queue = getQueue("scheduled-content");
      if (queue) {
        const bullJob = await queue.add(
          "publish-content-job",
          { contentItemId: String(contentItem._id), scheduledJobId: "" },
          { delay: delayMs, jobId: `creative_${project._id}_${targetDate.getTime()}` }
        );
        bullJobId = bullJob?.id || "";
        queueCreated = Boolean(bullJobId);
      }
    } catch (queueErr) {
      console.log("BullMQ queue notice (fallback mode active):", queueErr.message);
    }

    const initialStatus = queueCreated ? "Queued" : "Pending";
    const failureReason = queueCreated ? "" : "Redis/BullMQ fallback queue";

    const payloadData = {
      contentItemId: contentItem._id,
      creativeProjectId: project._id,
      title: project.title,
      headline: resolvedHeadline,
      caption: resolvedCaption,
      hashtags: resolvedHashtags,
      platforms: resolvedPlatforms,
      imageUrl: resolvedMediaUrl,
      posterData: posterData || {
        headline: project.headline,
        subheadline: project.subheadline,
        offerText: project.offerText,
        ctaText: project.ctaText,
        primaryColor: project.primaryColor,
        accentColor: project.accentColor,
        bgImageUrl: resolvedMediaUrl,
        phone: project.phone,
        website: project.website,
        locationName: project.locationName,
        showLogo: project.showLogo,
        logoUrl: project.logoUrl,
      },
      notes: notes || `Scheduled from Creative Studio: ${project.title}`,
    };

    if (scheduledJob) {
      scheduledJob.scheduledFor = targetDate;
      scheduledJob.status = initialStatus;
      scheduledJob.bullJobId = bullJobId;
      scheduledJob.failureReason = failureReason;
      scheduledJob.payload = payloadData;
      scheduledJob.approvedBy = req.user?._id;
      await scheduledJob.save();
    } else {
      scheduledJob = await ScheduledJob.create({
        jobType: "ContentPublish",
        queueName: "scheduled-content",
        customerId: project.customerId,
        clientLocationId: project.clientLocationId,
        entityType: "ContentItem",
        entityId: contentItem._id,
        scheduledFor: targetDate,
        timezone: "Asia/Kolkata",
        bullJobId,
        payload: payloadData,
        status: initialStatus,
        failureReason,
        createdBy: req.user?._id,
        approvedBy: req.user?._id,
      });
    }

    await safeAuditLog({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "creative_scheduled_for_publishing",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      inputSummary: `Scheduled creative "${project.title}" for ${targetDate.toISOString()} across ${resolvedPlatforms.join(", ")}`,
      status: "Success",
    });

    res.status(200).json({
      success: true,
      message: `Creative "${project.title}" successfully scheduled for ${targetDate.toLocaleString("en-IN")}`,
      scheduledFor: targetDate,
      scheduledJob,
      contentItem,
      project,
    });
  } catch (error) {
    console.error("[Schedule Creative Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.submitCreativeForApproval = async (req, res) => {
  try {
    const project = await CreativeProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Creative project not found" });

    project.approvalStatus = "Pending Approval";
    await project.save();

    const approval = await WorkApproval.create({
      approvalType: "Creative",
      creativeProjectId: project._id,
      customer: project.customerId,
      submittedBy: req.user?._id,
      reviewMessage: req.body.reviewMessage || `Approval requested for creative "${project.title}" (V${project.currentVersion})`,
      status: "Pending Approval",
    });

    await safeAuditLog({
      actorType: req.user?.role || "Employee",
      actorId: req.user?._id,
      actorName: req.user?.name || "User",
      action: "creative_approval_requested",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      approvalId: approval._id,
      inputSummary: `Submitted creative "${project.title}" (V${project.currentVersion}) for approval`,
      status: "Pending Approval",
    });

    res.status(200).json({
      success: true,
      message: "Creative submitted for approval",
      project,
      approval,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveCreative = async (req, res) => {
  try {
    const project = await CreativeProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Creative project not found" });

    project.approvalStatus = "Approved";
    project.approvedVersion = project.currentVersion;
    project.approvedBy = req.user?._id;
    project.approvedAt = new Date();
    await project.save();

    await WorkApproval.updateOne(
      { creativeProjectId: project._id, status: "Pending Approval" },
      { $set: { status: "Approved", reviewedBy: req.user?._id, reviewedAt: new Date(), adminRemark: req.body.remark || "Approved" } }
    );

    await safeAuditLog({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "creative_approved",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      inputSummary: `Approved creative "${project.title}" (V${project.approvedVersion})`,
      status: "Success",
    });

    res.status(200).json({
      success: true,
      message: `Creative Version ${project.approvedVersion} approved successfully`,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestCreativeRevision = async (req, res) => {
  try {
    const project = await CreativeProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Creative project not found" });

    project.approvalStatus = "Revision Requested";
    project.managerFeedback = req.body.remark || req.body.feedback || "Revision requested";
    await project.save();

    await WorkApproval.updateOne(
      { creativeProjectId: project._id, status: "Pending Approval" },
      { $set: { status: "Revision Requested", reviewedBy: req.user?._id, reviewedAt: new Date(), adminRemark: project.managerFeedback } }
    );

    await safeAuditLog({
      actorType: req.user?.role || "Manager",
      actorId: req.user?._id,
      actorName: req.user?.name || "Manager",
      action: "creative_revision_requested",
      entityType: "CreativeProject",
      entityId: project._id,
      customerId: project.customerId,
      inputSummary: `Requested revision for creative "${project.title}" (V${project.currentVersion}): ${project.managerFeedback}`,
      status: "Warning",
    });

    res.status(200).json({
      success: true,
      message: "Revision requested for creative project",
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
