/**
 * pipelineAutomationHandlers.js
 * Deterministic command handlers for Phase 5B Zero-Touch Client Pipeline & Workload Engine.
 */

const clientPipelineEngine = require("../../automation/engines/ClientPipelineEngine");
const packageService = require("../../automation/services/packageService");
const workloadService = require("../../automation/services/workloadService");
const Customer = require("../../../models/Customer");
const Lead = require("../../../models/Lead");
const Work = require("../../../models/Work");

exports.previewPipeline = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId || (params.customer ? (params.customer._id || params.customer) : null);
  if (!customerId) throw new Error("Client ID (customerId) is required to preview deliverable pipeline.");

  const result = await clientPipelineEngine.previewPipeline({
    clientId: customerId,
    packageId: params.packageId || params.packageCode,
    month: params.month ? Number(params.month) : null,
    year: params.year ? Number(params.year) : null,
  });

  return result;
};

exports.generatePipeline = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId || (params.customer ? (params.customer._id || params.customer) : null);
  if (!customerId) throw new Error("Client ID (customerId) is required to generate deliverable pipeline.");

  const result = await clientPipelineEngine.executePipeline({
    clientId: customerId,
    packageId: params.packageId || params.packageCode,
    month: params.month ? Number(params.month) : null,
    year: params.year ? Number(params.year) : null,
    deliverables: params.deliverables || [],
    userId: ctx.userId,
    userRole: ctx.userRole || "Admin",
  });

  return result;
};

exports.regeneratePipeline = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId;
  if (!customerId) throw new Error("Client ID is required to regenerate pipeline.");

  const targetMonth = params.month || new Date().getMonth() + 1;
  const targetYear = params.year || new Date().getFullYear();
  const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  // Remove previously generated automated tasks for this period
  const deleted = await Work.deleteMany({
    customer: customerId,
    "pipelineSource.period": periodStr,
    "pipelineSource.generatedByAutomation": true,
  });

  console.log(`[ClientPipelineEngine] Cleaned up ${deleted.deletedCount} previous pipeline tasks for ${periodStr}`);

  // Re-generate fresh pipeline
  const result = await clientPipelineEngine.executePipeline({
    clientId: customerId,
    packageId: params.packageId,
    month: targetMonth,
    year: targetYear,
    userId: ctx.userId,
    userRole: ctx.userRole || "Admin",
  });

  return {
    ...result,
    previousTasksRemoved: deleted.deletedCount,
  };
};

exports.convertAndOnboardLead = async (params = {}, ctx = {}) => {
  const leadId = params.leadId;
  if (!leadId) throw new Error("Lead ID (leadId) is required to convert and onboard.");

  const result = await clientPipelineEngine.convertAndOnboardLead({
    leadId,
    packageId: params.packageId,
    month: params.month ? Number(params.month) : null,
    year: params.year ? Number(params.year) : null,
    userId: ctx.userId,
    userRole: ctx.userRole || "Admin",
  });

  return result;
};

exports.getTeamCapacity = async (params = {}, ctx = {}) => {
  const capacities = await workloadService.getTeamCapacity(params.department || null);
  return {
    count: capacities.length,
    team: capacities,
  };
};

exports.suggestAssignee = async (params = {}, ctx = {}) => {
  const preferredRole = params.role || params.preferredRole || "Graphic Designer";
  const candidate = await workloadService.findBestAssignee({ preferredRole });
  if (!candidate) throw new Error("No available team members found.");

  return {
    role: preferredRole,
    candidate,
  };
};

exports.listPackages = async (params = {}, ctx = {}) => {
  const packages = await packageService.getAllPackages();
  return {
    count: packages.length,
    packages,
  };
};

exports.getPackage = async (params = {}, ctx = {}) => {
  const packageRef = params.packageId || params.code || params.name;
  const pkg = await packageService.getPackage(packageRef);
  if (!pkg) throw new Error(`Service package '${packageRef}' not found.`);

  return pkg;
};
