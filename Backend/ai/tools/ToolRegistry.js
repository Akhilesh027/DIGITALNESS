/**
 * ToolRegistry.js
 * Controlled tool registry for AI agents.
 * Ensures agents do not perform arbitrary database mutations without validation and permission checks.
 */

const { checkToolPermission, PERMISSIONS } = require("../policies/toolPolicy");
const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const Work = require("../../models/Work");
const ContentItem = require("../../models/ContentItem");
const CreativeProject = require("../../models/CreativeProject");
const WorkApproval = require("../../models/WorkApproval");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const { buildAgentContext, calculateCustomerReadiness } = require("../../services/agentContextService");

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerTool(name, handler, description = "") {
    this.tools.set(name, { handler, description });
  }

  async executeTool(name, args, context = {}) {
    const permCheck = checkToolPermission(name, context.userRole);
    if (!permCheck.allowed) {
      throw new Error(permCheck.reason);
    }

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered in ToolRegistry.`);
    }

    try {
      const result = await tool.handler(args, context);

      // Audit Log tool call
      await AuditLog.create({
        action: "AI_TOOL_CALLED",
        entity: "AgentRun",
        entityId: context.agentRunId || null,
        performedBy: context.userId || null,
        details: { toolName: name, args, permissionLevel: permCheck.permissionLevel },
      }).catch(() => null);

      return { success: true, tool: name, result };
    } catch (err) {
      return { success: false, tool: name, error: err.message };
    }
  }

  registerDefaultTools() {
    // READ TOOLS
    this.registerTool("getClientProfile", async ({ customerId }) => {
      return await Customer.findById(customerId).select("-password").lean();
    });

    this.registerTool("getClientLocations", async ({ customerId }) => {
      return await ClientLocation.find({ customerId, status: "Active" }).lean();
    });

    this.registerTool("getAgentContext", async ({ customerId, locationId, agentType }) => {
      return await buildAgentContext({ customerId, locationId, agentType });
    });

    this.registerTool("getReadiness", async ({ customerId }) => {
      return await calculateCustomerReadiness(customerId);
    });

    this.registerTool("getWorks", async ({ customerId }) => {
      return await Work.find({ customer: customerId }).sort({ createdAt: -1 }).limit(10).lean();
    });

    this.registerTool("getContentItems", async ({ customerId }) => {
      return await ContentItem.find({ customerId }).sort({ createdAt: -1 }).limit(10).lean();
    });

    this.registerTool("getCreativeProjects", async ({ customerId }) => {
      return await CreativeProject.find({ customerId }).sort({ createdAt: -1 }).limit(10).lean();
    });

    // WRITE TOOLS (DRAFT MODE)
    this.registerTool("createWork", async (data, ctx) => {
      const targetCustomer = data.customerId || data.customer;
      if (!targetCustomer) {
        throw new Error("Customer ID is required to create work deliverable.");
      }

      const work = await Work.create({
        title: data.title || "AI Marketing Campaign Deliverable",
        workType: data.workType || "Social Media",
        customer: targetCustomer,
        description: data.description || "",
        priority: data.priority || "Medium",
        status: "In Progress",
        assignedTo: ctx.userId ? [ctx.userId] : [],
        createdBy: ctx.userId || null,
        dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        generatedByAgent: true,
        agentRunId: String(ctx.agentRunId || ""),
        aiPrompt: String(data.description || data.title || ""),
        aiOutput: data.aiOutput || null,
        timeline: [
          {
            title: "AI Campaign Generated",
            description: `Generated via AI Workspace by agent run ${ctx.agentRunId || "session"}`,
            createdBy: ctx.userId || null,
            createdAt: new Date(),
          },
        ],
      });
      return work;
    });

    this.registerTool("createContentItem", async (data, ctx) => {
      const item = await ContentItem.create({
        title: data.title,
        customerId: data.customerId,
        clientLocationId: data.clientLocationId || null,
        contentType: data.contentType || "Post",
        platforms: data.platforms || ["Instagram", "Facebook"],
        headline: data.headline || "",
        supportingCopy: data.supportingCopy || "",
        caption: data.caption || "",
        mediaUrl: data.mediaUrl || data.imageUrl || "",
        ctaText: data.ctaText || "Book Now",
        hashtags: data.hashtags || [],
        scheduledFor: data.scheduledFor || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        approvalStatus: "Pending Approval",
        createdBy: ctx.userId || data.createdBy,
      });
      return item;
    });

    this.registerTool("createCreativeProject", async (data, ctx) => {
      const imgUrl = data.imageUrl || data.fileUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop";
      const project = await CreativeProject.create({
        title: data.title,
        customerId: data.customerId,
        clientLocationId: data.clientLocationId || null,
        assetType: data.assetType || "Poster",
        dimensions: data.dimensions || { width: 1080, height: 1080, aspectRatio: "1:1" },
        visualDirection: data.visualDirection || "",
        conceptName: data.conceptName || "Concept V1",
        versions: [
          {
            versionNumber: 1,
            fileUrl: imgUrl,
            thumbnailUrl: imgUrl,
            conceptName: data.conceptName || "Concept V1",
            visualDirection: data.visualDirection || "",
            imagePrompt: data.imagePrompt || "",
            structuredPrompt: data.structuredPrompt || {},
            posterSpecification: data.posterSpecification || {},
            headline: data.headline || "",
            supportingCopy: data.supportingCopy || "",
            cta: data.cta || "",
            brandSnapshot: data.brandSnapshot || {},
            locationSnapshot: data.locationSnapshot || {},
            campaignSnapshot: data.campaignSnapshot || {},
            status: "Pending Approval",
            createdBy: ctx.userId || data.createdBy,
          },
        ],
        currentVersion: 1,
        approvalStatus: "Pending Approval",
        createdBy: ctx.userId || data.createdBy,
      });
      return project;
    });

    this.registerTool("addCreativeVersion", async (data, ctx) => {
      const project = await CreativeProject.findById(data.creativeProjectId);
      if (!project) throw new Error("CreativeProject not found");

      const nextVersionNum = project.versions.length + 1;
      project.versions.push({
        versionNumber: nextVersionNum,
        conceptName: data.conceptName || `Revision V${nextVersionNum}`,
        visualDirection: data.visualDirection || "",
        imagePrompt: data.imagePrompt || "",
        structuredPrompt: data.structuredPrompt || {},
        posterSpecification: data.posterSpecification || {},
        headline: data.headline || "",
        supportingCopy: data.supportingCopy || "",
        cta: data.cta || "",
        managerFeedback: data.managerFeedback || "",
        status: "Pending Approval",
        createdBy: ctx.userId || data.createdBy,
      });
      project.currentVersion = nextVersionNum;
      project.approvalStatus = "Pending Approval";
      await project.save();
      return project;
    });

    this.registerTool("createWorkApproval", async (data, ctx) => {
      const approval = await WorkApproval.create({
        workId: data.workId || null,
        contentItemId: data.contentItemId || null,
        creativeProjectId: data.creativeProjectId || null,
        approvalType: data.approvalType || "Content",
        status: "Pending",
        requestedBy: ctx.userId || data.requestedBy,
        assignedApprovers: data.assignedApprovers || [],
        notes: data.notes || "AI Generated deliverable requiring human approval",
      });
      return approval;
    });

    this.registerTool("createNotification", async (data) => {
      return await Notification.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "system",
      });
    });

    this.registerTool("createAuditLog", async (data, ctx) => {
      return await AuditLog.create({
        action: data.action,
        entity: data.entity || "AI",
        entityId: data.entityId || null,
        performedBy: ctx.userId || null,
        details: data.details || {},
      });
    });
  }
}

module.exports = new ToolRegistry();
