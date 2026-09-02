/**
 * executionCoordinator.js
 * Coordinates specialist agent execution, CRM deliverable creation, revisions, regenerations, and approval handoffs.
 */

const AgentRun = require("../../models/AgentRun");
const ToolRegistry = require("../tools/ToolRegistry");
const SocialAgent = require("../agents/SocialAgent");
const CreativeAgent = require("../agents/CreativeAgent");
const AdsAgent = require("../agents/AdsAgent");
const GBPAgent = require("../agents/GBPAgent");
const SEOAgent = require("../agents/SEOAgent");
const LeadAgent = require("../agents/LeadAgent");
const ReportingAgent = require("../agents/ReportingAgent");
const WorkApproval = require("../../models/WorkApproval");
const ContentItem = require("../../models/ContentItem");
const CreativeProject = require("../../models/CreativeProject");
const { scheduleContentPublish } = require("../../services/schedulerService");

exports.executePlan = async ({ agentRunId, userId }) => {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) throw new Error("AgentRun not found");
  if (agentRun.planStatus !== "Plan Approved") {
    throw new Error("Plan must be approved by manager before execution.");
  }

  agentRun.executionStatus = "Executing";
  await agentRun.save();

  const plan = agentRun.plan;
  const ctx = { userId, customerId: agentRun.customerId, locationId: agentRun.clientLocationId, agentRunId: agentRun._id };

  // Execute Specialist Agents
  const socialOutput = await SocialAgent.execute(plan, ctx);
  const creativeOutput = await CreativeAgent.execute(plan, socialOutput, ctx);

  // Execute Write Tools via ToolRegistry (DRAFT MODE)
  const workRes = await ToolRegistry.executeTool(
    "createWork",
    {
      title: `${plan.campaignName || "Campaign"} - Work Deliverable`,
      customerId: agentRun.customerId,
      description: `AI Orchestrated Campaign Work for ${plan.clientName}`,
      workType: "AI Campaign",
      priority: "Medium",
    },
    ctx
  );

  const contentRes = await ToolRegistry.executeTool(
    "createContentItem",
    {
      title: `${plan.campaignName || "Post"} - Content`,
      customerId: agentRun.customerId,
      clientLocationId: agentRun.clientLocationId,
      contentType: "Post",
      platforms: plan.deliverables?.[0]?.platforms || ["Instagram", "Facebook"],
      headline: socialOutput.headline,
      supportingCopy: socialOutput.supportingCopy,
      caption: socialOutput.caption,
      ctaText: socialOutput.ctaText,
      hashtags: socialOutput.hashtags,
      mediaUrl: creativeOutput.imageUrl || "",
      imageUrl: creativeOutput.imageUrl || "",
    },
    ctx
  );

  const creativeRes = await ToolRegistry.executeTool(
    "createCreativeProject",
    {
      title: `${plan.campaignName || "Poster"} - Visual Asset`,
      customerId: agentRun.customerId,
      clientLocationId: agentRun.clientLocationId,
      assetType: creativeOutput.assetType || "Poster",
      dimensions: creativeOutput.dimensions || { width: 1080, height: 1080, aspectRatio: "1:1" },
      visualDirection: creativeOutput.visualDirection,
      conceptName: creativeOutput.conceptName,
      imagePrompt: creativeOutput.imagePrompt,
      structuredPrompt: creativeOutput.structuredPrompt,
      posterSpecification: creativeOutput.posterSpecification,
      headline: creativeOutput.headline,
      supportingCopy: creativeOutput.supportingCopy,
      cta: creativeOutput.cta,
      imageUrl: creativeOutput.imageUrl || "",
      fileUrl: creativeOutput.imageUrl || "",
      brandSnapshot: plan.brandContext || {},
      locationSnapshot: plan.location || {},
      campaignSnapshot: plan.campaign || {},
    },
    ctx
  );

  // Create WorkApproval Record requiring Manager Review
  const approvalRes = await ToolRegistry.executeTool(
    "createWorkApproval",
    {
      workId: workRes.result?._id,
      contentItemId: contentRes.result?._id,
      creativeProjectId: creativeRes.result?._id,
      approvalType: "Content",
      notes: "AI Deliverables generated. Requires human manager output approval.",
    },
    ctx
  );

  // Update AgentRun and link items
  const createdWorkId = workRes.result?._id;
  const createdContentId = contentRes.result?._id;
  const createdCreativeId = creativeRes.result?._id;

  if (createdContentId && (createdWorkId || createdCreativeId)) {
    await ContentItem.findByIdAndUpdate(createdContentId, {
      workId: createdWorkId || null,
      creativeProjectId: createdCreativeId || null,
    });
  }

  agentRun.executionStatus = "Awaiting Output Approval";
  agentRun.outputs = {
    socialOutput,
    creativeOutput,
    workId: createdWorkId,
    contentItemId: createdContentId,
    creativeProjectId: createdCreativeId,
    approvalId: approvalRes.result?._id,
  };
  agentRun.approvalIds = [approvalRes.result?._id].filter(Boolean);
  await agentRun.save();

  // Create Notification
  await ToolRegistry.executeTool("createNotification", {
    userId,
    title: "AI Deliverables Ready for Output Approval",
    message: `AI Agents finished generating campaign assets for ${plan.clientName}. Review and approve outputs.`,
  });

  return agentRun;
};

exports.requestRevision = async ({ agentRunId, feedback, userId }) => {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) throw new Error("AgentRun not found");

  agentRun.executionStatus = "Revision Requested";
  await agentRun.save();

  const plan = agentRun.plan || {};
  const ctx = { userId, customerId: agentRun.customerId, locationId: agentRun.clientLocationId, agentRunId: agentRun._id };

  const socialOutput = agentRun.outputs?.socialOutput || await SocialAgent.execute(plan, ctx);
  const updatedCreativeOutput = await CreativeAgent.execute({
    ...plan,
    campaignName: `${plan.campaignName || "Poster"} (Revision: ${feedback.slice(0, 30)})`,
  }, socialOutput, ctx);

  if (updatedCreativeOutput.structuredPrompt) {
    updatedCreativeOutput.structuredPrompt.manager_feedback = feedback;
  }
  if (updatedCreativeOutput.imagePromptText) {
    updatedCreativeOutput.imagePromptText = `[REVISION NOTES: ${feedback}]\n\n` + updatedCreativeOutput.imagePromptText;
    updatedCreativeOutput.imagePrompt = updatedCreativeOutput.imagePromptText;
  }

  const creativeProjectId = agentRun.outputs?.creativeProjectId;
  if (creativeProjectId) {
    await ToolRegistry.executeTool(
      "addCreativeVersion",
      {
        creativeProjectId,
        conceptName: updatedCreativeOutput.conceptName,
        visualDirection: updatedCreativeOutput.visualDirection,
        imagePrompt: updatedCreativeOutput.imagePrompt,
        structuredPrompt: updatedCreativeOutput.structuredPrompt,
        posterSpecification: updatedCreativeOutput.posterSpecification,
        headline: updatedCreativeOutput.headline,
        supportingCopy: updatedCreativeOutput.supportingCopy,
        cta: updatedCreativeOutput.cta,
        managerFeedback: feedback,
      },
      ctx
    );
  }

  agentRun.outputs = {
    ...agentRun.outputs,
    creativeOutput: updatedCreativeOutput,
  };
  agentRun.executionStatus = "Awaiting Output Approval";
  await agentRun.save();

  return agentRun;
};

exports.regenerateOutput = async ({ agentRunId, userId }) => {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) throw new Error("AgentRun not found");

  return await exports.executePlan({ agentRunId, userId });
};

exports.approveOutput = async ({ agentRunId, userId }) => {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) throw new Error("AgentRun not found");

  const approvalId = agentRun.outputs?.approvalId;
  const contentItemId = agentRun.outputs?.contentItemId;
  const creativeProjectId = agentRun.outputs?.creativeProjectId;
  const workId = agentRun.outputs?.workId;

  if (approvalId) {
    await WorkApproval.findByIdAndUpdate(approvalId, {
      status: "Approved",
      reviewedBy: userId,
      reviewedAt: new Date(),
    });
  }

  if (contentItemId) {
    await ContentItem.findByIdAndUpdate(contentItemId, {
      approvalStatus: "Approved",
      status: "Content Ready",
      reviewedBy: userId,
    });
  }

  if (creativeProjectId) {
    await CreativeProject.findByIdAndUpdate(creativeProjectId, {
      approvalStatus: "Approved",
      reviewedBy: userId,
    });
  }

  if (workId) {
    const Work = require("../../models/Work");
    await Work.findByIdAndUpdate(workId, {
      status: "In Progress",
      approvedBy: userId,
      approvedAt: new Date(),
      $push: {
        timeline: {
          title: "Deliverables Approved",
          description: "AI marketing campaign deliverables approved by manager",
          createdBy: userId,
          createdAt: new Date(),
        },
      },
    });
  }

  // Set status to Approved (Awaiting Manager choice: Schedule vs Save Only)
  agentRun.executionStatus = "Approved";
  agentRun.completedAt = new Date();
  await agentRun.save();

  return agentRun;
};

exports.scheduleOutput = async ({ agentRunId, scheduledFor = null, user = null, userId = null }) => {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) throw new Error("AgentRun not found");

  const effectiveUser = user || (userId ? await require("../../models/User").findById(userId).lean() : null);
  const effectiveUserId = effectiveUser?._id || userId;

  let contentItemId = agentRun.outputs?.contentItemId;
  let content = null;

  if (contentItemId) {
    content = await ContentItem.findById(contentItemId);
  }

  // If no content item exists yet for this run, create one on the fly
  if (!content) {
    const plan = agentRun.plan || {};
    const socialOutput = agentRun.outputs?.socialOutput || {};
    content = await ContentItem.create({
      title: `${plan.campaignName || "Campaign"} - Scheduled Post`,
      customerId: agentRun.customerId,
      clientLocationId: agentRun.clientLocationId || null,
      contentType: "Poster",
      platforms: plan.deliverables?.[0]?.platforms || ["Instagram", "Facebook"],
      headline: socialOutput.headline || "Campaign Headline",
      supportingCopy: socialOutput.supportingCopy || "",
      caption: socialOutput.caption || "",
      ctaText: socialOutput.ctaText || "Book Now",
      hashtags: socialOutput.hashtags || [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      approvalStatus: "Approved",
      status: "Approved",
      createdBy: effectiveUserId,
    });
    contentItemId = content._id;
    if (!agentRun.outputs) agentRun.outputs = {};
    agentRun.outputs.contentItemId = content._id;
  } else {
    // Ensure approval status is set to Approved for scheduling
    content.approvalStatus = "Approved";
    await content.save();
  }

  // Ensure attached creative project is also approved
  if (content.creativeProjectId) {
    await CreativeProject.findByIdAndUpdate(content.creativeProjectId, { approvalStatus: "Approved" });
  }

  const parsedDate = scheduledFor ? new Date(scheduledFor) : null;
  const targetDate = (parsedDate && !isNaN(parsedDate.getTime()) && parsedDate > new Date())
    ? parsedDate
    : (content.scheduledFor && new Date(content.scheduledFor) > new Date())
    ? new Date(content.scheduledFor)
    : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days in future default

  const scheduleResult = await scheduleContentPublish({
    contentItemId: content._id,
    scheduledFor: targetDate,
    user: effectiveUser,
  });

  // Ensure ContentItem status is updated to Scheduled
  await ContentItem.findByIdAndUpdate(contentItemId, {
    status: "Scheduled",
    scheduledFor: targetDate,
  });

  const workId = agentRun.outputs?.workId;
  if (workId) {
    const Work = require("../../models/Work");
    await Work.findByIdAndUpdate(workId, {
      $push: {
        timeline: {
          title: "Content Scheduled",
          description: `Campaign content scheduled for publishing on ${targetDate.toLocaleString()}`,
          createdBy: effectiveUserId,
          createdAt: new Date(),
        },
      },
    });
  }

  agentRun.executionStatus = "Scheduled";
  await agentRun.save();

  return { agentRun, scheduleResult };
};
