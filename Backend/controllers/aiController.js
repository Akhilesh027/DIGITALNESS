/**
 * aiController.js
 * Controller handlers for Phase 3 AI OS Endpoints.
 */

const { getAIStatus } = require("../ai/providers/AIProvider");
const { processAIRequest } = require("../ai/orchestrator/parentOrchestrator");
const {
  executePlan,
  requestRevision,
  regenerateOutput,
  approveOutput,
} = require("../ai/orchestrator/executionCoordinator");
const AgentRun = require("../models/AgentRun");

exports.getAIProviderStatus = async (req, res) => {
  try {
    const status = getAIStatus();
    return res.status(200).json({ success: true, data: status });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAIRequest = async (req, res) => {
  try {
    const { prompt, customerId, locationId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const userId = req.user?._id || req.user?.id;
    const result = await processAIRequest({
      prompt,
      userId,
      customerIdOverride: customerId || null,
      locationIdOverride: locationId || null,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.message && err.message.includes("Could not resolve target client")) {
      return res.status(400).json({
        success: false,
        status: "CLIENT_REQUIRED",
        message: err.message,
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateDirectPrompt = async (req, res) => {
  try {
    const { prompt, customerId, locationId } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const userId = req.user?._id || req.user?.id;
    const processRes = await processAIRequest({
      prompt,
      userId,
      customerIdOverride: customerId || null,
      locationIdOverride: locationId || null,
    });

    if (processRes.status === "LOCATION_REQUIRED") {
      return res.status(200).json({
        success: false,
        status: "LOCATION_REQUIRED",
        message: processRes.message,
        candidateLocations: processRes.candidateLocations,
      });
    }

    const runId = processRes.agentRunId;
    await AgentRun.findByIdAndUpdate(runId, { planStatus: "Plan Approved" });
    const executedRun = await executePlan({ agentRunId: runId, userId });

    return res.status(200).json({
      success: true,
      agentRunId: runId,
      plan: executedRun.plan,
      socialOutput: executedRun.outputs?.socialOutput,
      creativeOutput: executedRun.outputs?.creativeOutput,
      posterSpecification: executedRun.outputs?.creativeOutput?.posterSpecification,
      structuredPrompt: executedRun.outputs?.creativeOutput?.structuredPrompt,
      imagePromptText: executedRun.outputs?.creativeOutput?.imagePromptText || executedRun.outputs?.creativeOutput?.imagePrompt,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAgentRuns = async (req, res) => {
  try {
    const runs = await AgentRun.find()
      .populate("customerId", "name companyName city")
      .populate("clientLocationId", "name address city")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({ success: true, data: runs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAgentRunById = async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id)
      .populate("customerId")
      .populate("clientLocationId")
      .lean();

    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    return res.status(200).json({ success: true, data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.approvePlan = async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    run.planStatus = "Plan Approved";
    run.executionStatus = "Queued";
    await run.save();

    // Auto-trigger execution
    const userId = req.user?._id || req.user?.id;
    const executedRun = await executePlan({ agentRunId: run._id, userId });

    return res.status(200).json({ success: true, message: "Plan approved & execution started", data: executedRun });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.modifyPlan = async (req, res) => {
  try {
    const { modifiedPlan } = req.body;
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    run.plan = { ...run.plan, ...modifiedPlan };
    run.planStatus = "Awaiting Plan Approval";
    await run.save();

    return res.status(200).json({ success: true, message: "Plan modified successfully", data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelRun = async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    run.planStatus = "Cancelled";
    run.executionStatus = "Cancelled";
    await run.save();

    return res.status(200).json({ success: true, message: "AgentRun cancelled", data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.generatePosterImageForRun = async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    const creativeOutput = run.outputs?.creativeOutput || {};
    const plan = run.plan || {};

    const { generatePosterImage } = require("../ai/providers/AIProvider");
    const imageResult = await generatePosterImage({
      prompt: creativeOutput.imagePromptText || creativeOutput.imagePrompt || plan.campaignName,
      brandName: plan.client?.name || creativeOutput.brandName || "GlowNest Salon",
      serviceName: plan.campaign?.service || "Hair Styling",
      offerText: plan.campaign?.offer || "20% OFF",
      headlineText: creativeOutput.headline || plan.campaign?.headline || "COLOUR YOUR CONFIDENCE",
      supportingText: creativeOutput.supportingCopy || plan.campaign?.supportingOfferLine || "Premium personalized care.",
      ctaText: creativeOutput.cta || plan.campaign?.cta || "Book Appointment",
      locationName: plan.location?.name || "Kukatpally",
      locationPhone: plan.location?.phone || "9000012346",
      logoUrl: plan.brandContext?.logoUrl || "https://glownest.com/assets/logo-glownest.png",
      primaryColor: plan.brandContext?.primaryColor || "#1A1A1A",
      secondaryColor: plan.brandContext?.secondaryColor || "#F7F2ED",
      accentColor: plan.brandContext?.accentColor || "#C79A6B",
      isWebsiteLaunch: plan.campaign?.topic === "Website Launch",
    });

    creativeOutput.imageUrl = imageResult?.url || null;
    creativeOutput.imageProvider = imageResult?.provider || "Digitalness Commercial Poster Engine";
    creativeOutput.imageStatus = imageResult?.url ? "Generated" : "Failed";

    if (!run.outputs) run.outputs = {};
    run.outputs.creativeOutput = creativeOutput;
    run.executionStatus = "Awaiting Output Approval";
    run.markModified("outputs");
    await run.save();

    return res.status(200).json({ success: true, message: "Poster image generated successfully", data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.executeRun = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const executedRun = await executePlan({ agentRunId: req.params.id, userId });
    return res.status(200).json({ success: true, data: executedRun });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleRevision = async (req, res) => {
  try {
    const { feedback } = req.body;
    const userId = req.user?._id || req.user?.id;
    const run = await requestRevision({ agentRunId: req.params.id, feedback: feedback || "Revise copy and visuals", userId });
    return res.status(200).json({ success: true, data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleRegeneration = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const run = await regenerateOutput({ agentRunId: req.params.id, userId });
    return res.status(200).json({ success: true, data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleApproveOutput = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const run = await approveOutput({ agentRunId: req.params.id, userId });
    return res.status(200).json({ success: true, message: "Deliverables approved by manager", data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleScheduleOutput = async (req, res) => {
  try {
    const { scheduleOutput } = require("../ai/orchestrator/executionCoordinator");
    const user = req.user;
    const { scheduledFor } = req.body || {};
    const result = await scheduleOutput({
      agentRunId: req.params.id,
      scheduledFor,
      user,
      userId: user?._id || user?.id,
    });
    return res.status(200).json({ success: true, message: "Content scheduled successfully", data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleSaveOnly = async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: "AgentRun not found." });

    run.executionStatus = "Saved";
    await run.save();
    return res.status(200).json({ success: true, message: "Saved as CRM record only", data: run });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
