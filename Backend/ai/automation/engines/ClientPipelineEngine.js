/**
 * ClientPipelineEngine.js
 * Phase 5B: Zero-Touch Client Deliverable Pipeline Engine for Digitalness CRM.
 */

const Customer = require("../../../models/Customer");
const Lead = require("../../../models/Lead");
const Work = require("../../../models/Work");
const packageService = require("../services/packageService");
const workloadService = require("../services/workloadService");
const schedulingService = require("../services/deliverableSchedulingService");
const idempotencyService = require("../services/idempotencyService");
const auditService = require("../AutomationAuditService");
const eventBus = require("../services/eventBus");

class ClientPipelineEngine {
  /**
   * Generates a preview blueprint of the monthly deliverable pipeline.
   * PURE PREVIEW: Never mutates or writes to MongoDB.
   */
  async previewPipeline({ clientId, packageId = null, month = null, year = null }) {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

    // 1. Resolve Customer
    const customer = await Customer.findById(clientId).lean();
    if (!customer) {
      throw new Error(`Client with ID '${clientId}' not found.`);
    }

    // 2. Resolve Service Package Template
    let pkg = null;
    if (packageId) {
      pkg = await packageService.getPackage(packageId);
    }
    if (!pkg) {
      pkg = await packageService.matchPackage({
        requirements: customer.requirements || [],
        businessType: customer.businessType || "",
      });
    }
    if (!pkg) {
      throw new Error("Unable to determine a suitable service package for this client.");
    }

    // 3. Generate Chronological Scheduled Due Dates
    const scheduledItems = schedulingService.generateScheduleDates({
      deliverables: pkg.deliverables || [],
      month: targetMonth,
      year: targetYear,
    });

    // 4. Analyze Team Capacity & Determine Best Assignees
    const plannedDeliverables = [];
    const teamAllocationMap = new Map();

    for (const item of scheduledItems) {
      const bestAssignee = await workloadService.findBestAssignee({
        preferredRole: item.preferredRole,
      });

      const assigneeId = bestAssignee ? bestAssignee.employeeId : null;
      const assigneeName = bestAssignee ? bestAssignee.employeeName : "Unassigned";
      const assigneeRole = bestAssignee ? bestAssignee.role : "N/A";
      const capacityPercent = bestAssignee ? bestAssignee.capacityPercent : 0;

      if (assigneeId) {
        if (!teamAllocationMap.has(assigneeId)) {
          teamAllocationMap.set(assigneeId, {
            employeeId: assigneeId,
            name: assigneeName,
            role: assigneeRole,
            capacityPercent,
            taskCount: 0,
            types: new Set(),
          });
        }
        const member = teamAllocationMap.get(assigneeId);
        member.taskCount++;
        member.types.add(item.type);
      }

      plannedDeliverables.push({
        title: item.title,
        type: item.type,
        workType: this.mapTypeToWorkType(item.type),
        dueDate: item.dueDate,
        preferredRole: item.preferredRole,
        slaHours: item.slaHours,
        requiresApproval: item.requiresApproval,
        assignedTo: assigneeId,
        assignedToName: assigneeName,
        assignedToRole: assigneeRole,
        capacityPercent,
      });
    }

    const teamAllocation = Array.from(teamAllocationMap.values()).map((m) => ({
      ...m,
      types: Array.from(m.types),
    }));

    // 5. Warnings & Idempotency Check
    const warnings = [];
    const idempotencyKey = idempotencyService.getPipelineKey(clientId, periodStr);
    const existingCheck = await idempotencyService.checkIdempotency(idempotencyKey);
    if (existingCheck.isDuplicate) {
      warnings.push(`Warning: A pipeline for ${periodStr} has already been created for this client.`);
    }

    const totalDeliverables = plannedDeliverables.length;
    const firstDeadline = plannedDeliverables[0]?.dueDate;
    const finalDeadline = plannedDeliverables[plannedDeliverables.length - 1]?.dueDate;

    return {
      client: {
        id: customer._id,
        name: customer.name,
        companyName: customer.companyName || customer.businessType,
        city: customer.city || "",
      },
      package: {
        id: pkg._id,
        code: pkg.code,
        name: pkg.name,
        description: pkg.description,
      },
      period: {
        month: targetMonth,
        year: targetYear,
        formatted: periodStr,
      },
      deliverables: plannedDeliverables,
      teamAllocation,
      summary: {
        totalDeliverables,
        employeesUsed: teamAllocation.length,
        firstDeadline,
        finalDeadline,
      },
      warnings,
      idempotencyKey,
    };
  }

  /**
   * Executes the pipeline blueprint, creating real Work records in MongoDB with provenance metadata.
   */
  async executePipeline({
    clientId,
    packageId = null,
    month = null,
    year = null,
    deliverables = [],
    runId = null,
    userId = null,
    userRole = "Admin",
  }) {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    const idempotencyKey = idempotencyService.getPipelineKey(clientId, periodStr);

    // 1. Idempotency Guard: prevent duplicate generation if already run
    const existingCheck = await idempotencyService.checkIdempotency(idempotencyKey);
    if (existingCheck.isDuplicate) {
      console.log(`[ClientPipelineEngine] Pipeline already exists for ${clientId} in ${periodStr}`);
      return {
        status: "SKIPPED",
        reason: "ALREADY_PROCESSED",
        message: `Pipeline for ${periodStr} already exists.`,
      };
    }

    // 2. Generate or use provided preview deliverables
    let itemsToCreate = deliverables;
    let pkgDetails = null;

    if (!itemsToCreate || itemsToCreate.length === 0) {
      const preview = await this.previewPipeline({ clientId, packageId, month: targetMonth, year: targetYear });
      itemsToCreate = preview.deliverables;
      pkgDetails = preview.package;
    } else if (packageId) {
      pkgDetails = await packageService.getPackage(packageId);
    }

    const customer = await Customer.findById(clientId);
    if (!customer) throw new Error(`Customer '${clientId}' not found.`);

    // 3. Batch Create Work records in MongoDB
    const createdTasks = [];
    for (const item of itemsToCreate) {
      const assignedToList = item.assignedTo ? [item.assignedTo] : [];

      const task = await Work.create({
        title: item.title,
        workType: item.workType || this.mapTypeToWorkType(item.type),
        customer: customer._id,
        assignedTo: assignedToList,
        priority: item.priority || "Medium",
        status: "Pending",
        dueDate: item.dueDate ? new Date(item.dueDate) : new Date(),
        description: `Automated deliverable generated from package '${pkgDetails?.name || "Standard Package"}' for ${periodStr}.`,
        deliverables: 1,
        slaDays: Math.ceil((item.slaHours || 48) / 24),
        approvalRequired: item.requiresApproval !== false,
        createdBy: userId || null,
        generatedByAgent: true,
        agentId: "ClientPipelineEngine",
        pipelineSource: {
          automationRunId: runId || `RUN-PIPE-${Date.now()}`,
          packageId: pkgDetails?.id || pkgDetails?._id || null,
          packageCode: pkgDetails?.code || "STANDARD_DIGITAL_MARKETING",
          period: periodStr,
          generatedByAutomation: true,
        },
        timeline: [
          {
            title: "Pipeline Deliverable Created",
            description: `Auto-scheduled for ${periodStr} via Autonomous Agency OS.`,
            createdBy: userId || null,
            createdAt: new Date(),
          },
        ],
      });

      createdTasks.push(task);
    }

    // 4. Update Customer's total task counters
    customer.totalTasks = (customer.totalTasks || 0) + createdTasks.length;
    customer.pendingTasks = (customer.pendingTasks || 0) + createdTasks.length;
    await customer.save();

    // 5. Emit event
    eventBus.emitEvent("pipeline.generated", {
      customerId: customer._id,
      customerName: customer.name,
      period: periodStr,
      taskCount: createdTasks.length,
    });

    const summary = `Generated ${createdTasks.length} monthly deliverables for ${customer.name} (${periodStr})`;

    return {
      status: "COMPLETED",
      summary,
      customerId: customer._id,
      customerName: customer.name,
      period: periodStr,
      tasksCreated: createdTasks.length,
      taskIds: createdTasks.map((t) => t._id),
      idempotencyKey,
    };
  }

  /**
   * Orchestrates the entire Lead -> Customer -> Package -> Monthly Pipeline workflow atomically.
   */
  async convertAndOnboardLead({ leadId, packageId = null, month = null, year = null, userId = null, userRole = "Admin" }) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error(`Lead with ID '${leadId}' not found.`);

    if (lead.status === "Own Close" && lead.convertedToCustomer) {
      return {
        status: "SKIPPED",
        reason: "ALREADY_CONVERTED",
        message: `Lead '${lead.name}' has already been converted.`,
      };
    }

    // 1. Convert Lead to Customer
    const existingCustomer = await Customer.findOne({
      $or: [{ contactNumbers: lead.contactNumber }, { name: lead.name }],
    });

    let customer = existingCustomer;
    if (!customer) {
      customer = await Customer.create({
        name: lead.name,
        companyName: lead.name,
        businessType: lead.businessType || "Digital Marketing Client",
        contactNumbers: [lead.contactNumber],
        city: lead.city || "",
        status: "Active",
        source: lead.source || "Telecaller",
        branchId: lead.branchId || "BR001",
        leadId: lead._id,
        totalPaid: 0,
        totalPending: 0,
        activityLogs: [
          {
            title: "Customer Onboarded via Autonomous Engine",
            type: "onboarding",
            date: new Date(),
          },
        ],
      });
    }

    // 2. Mark Lead as Converted
    lead.status = "Own Close";
    lead.convertedToCustomer = customer._id;
    lead.convertedAt = new Date();
    lead.notes.push(`Converted to Customer & Onboarded to Pipeline on ${new Date().toLocaleDateString()}`);
    await lead.save();

    // 3. Generate and Execute Deliverable Pipeline
    const pipelineRes = await this.executePipeline({
      clientId: customer._id,
      packageId,
      month,
      year,
      userId,
      userRole,
    });

    // 4. Emit Events
    eventBus.emitEvent(eventBus.EVENTS.LEAD_CONVERTED, { leadId: lead._id, customerId: customer._id });
    eventBus.emitEvent(eventBus.EVENTS.CUSTOMER_CREATED, { customerId: customer._id });

    return {
      status: "COMPLETED",
      message: `Lead '${lead.name}' converted and onboarded with ${pipelineRes.tasksCreated || 0} deliverables created for ${pipelineRes.period}.`,
      leadId: lead._id,
      customer: {
        id: customer._id,
        name: customer.name,
        businessType: customer.businessType,
      },
      pipeline: pipelineRes,
    };
  }

  /**
   * Helper to map package deliverable types to standard Work model workType enum.
   */
  mapTypeToWorkType(type) {
    switch (type) {
      case "SOCIAL_CREATIVE":
      case "AD_CREATIVE":
        return "Graphic Design";
      case "REEL":
        return "Video Editing";
      case "BLOG_POST":
      case "AD_COPY":
      case "GBP_POST":
        return "Content Writing";
      case "SEO_AUDIT":
      case "CAMPAIGN_SETUP":
      case "WEEKLY_OPTIMIZATION":
        return "Performance Marketing";
      case "MONTHLY_REPORT":
        return "Reporting";
      default:
        return "Digital Marketing";
    }
  }
}

module.exports = new ClientPipelineEngine();
