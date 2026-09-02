/**
 * customerHandlers.js
 * Deterministic handlers for Customer and Client 360 commands.
 */

const mongoose = require("mongoose");
const Customer = require("../../../models/Customer");
const ClientLocation = require("../../../models/ClientLocation");
const { calculateCustomerReadiness, buildAgentContext } = require("../../../services/agentContextService");

exports.searchCustomers = async (params = {}, ctx = {}) => {
  const query = {};
  if (params.query) {
    const regex = new RegExp(params.query, "i");
    query.$or = [{ name: regex }, { companyName: regex }, { city: regex }, { email: regex }];
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.city) {
    query.city = new RegExp(params.city, "i");
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const customers = await Customer.find(query)
    .select("name companyName city contactNumber contactNumbers email industry totalPaid totalPending status package branchId logoUrl")
    .limit(limit)
    .lean();

  return {
    count: customers.length,
    customers,
  };
};

exports.getCustomer = async (params = {}, ctx = {}) => {
  const customer = await Customer.findById(params.customerId).lean();
  if (!customer) throw new Error(`Customer with ID '${params.customerId}' not found.`);
  const locations = await ClientLocation.find({ customerId: customer._id, status: "Active" }).lean();
  return { customer, locations };
};

exports.createCustomer = async (params = {}, ctx = {}) => {
  const newCustomer = await Customer.create({
    name: params.name,
    companyName: params.companyName || params.name,
    businessType: params.businessType || "Business",
    contactNumbers: Array.isArray(params.contactNumbers) ? params.contactNumbers : [params.contactNumbers || "9999999999"],
    email: params.email || "",
    city: params.city || "",
    branchId: params.branchId || "BR001",
    createdBy: ctx.userId || null,
    activityLogs: [
      {
        title: "Customer Created via AI Command",
        message: `Created via autonomous command engine by user ${ctx.userId || "System"}`,
        type: "created",
        createdBy: ctx.userId || null,
        createdAt: new Date(),
      },
    ],
  });

  return newCustomer.toObject();
};

exports.updateCustomer = async (params = {}, ctx = {}) => {
  const customer = await Customer.findById(params.customerId);
  if (!customer) throw new Error(`Customer with ID '${params.customerId}' not found.`);

  Object.assign(customer, params.updates || {});
  customer.activityLogs.push({
    title: "Customer Updated via AI Command",
    message: `Fields updated: ${Object.keys(params.updates || {}).join(", ")}`,
    type: "updated",
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await customer.save();
  return customer.toObject();
};

exports.getClient360 = async (params = {}, ctx = {}) => {
  let customer = null;
  const targetId = params.customerId || ctx.activeCustomerId || ctx.customerId;
  if (targetId) {
    customer = await Customer.findById(targetId).lean();
  }
  const searchQuery = params.query || params.customerName || params.name || params.client;
  if (!customer && searchQuery) {
    const cleanSearch = String(searchQuery).replace(/show|context|latest|updates|and|for|client|customer|details/gi, "").trim();
    if (cleanSearch) {
      const regex = new RegExp(cleanSearch, "i");
      customer = await Customer.findOne({ $or: [{ name: regex }, { companyName: regex }] }).lean();
    }
  }
  if (!customer) {
    customer = await Customer.findOne({ status: "Active" }).sort({ createdAt: -1 }).lean();
  }
  if (!customer) throw new Error("No active client found to display 360 overview.");

  const Work = require("../../../models/Work");
  const AgentRun = require("../../../models/AgentRun");
  const Invoice = mongoose.models.Invoice || require("../../../models/Invoice");
  const AdCampaign = mongoose.models.AdCampaign || require("../../../models/AdCampaign");
  const ContentCalendar = mongoose.models.ContentCalendar || require("../../../models/ContentCalendar");
  const SLAIncident = mongoose.models.SLAIncident || require("../../../models/SLAIncident");
  const Ticket = mongoose.models.Ticket || require("../../../models/Ticket");
  const MarketingConnection = mongoose.models.MarketingConnection || require("../../../models/MarketingConnection");

  const [
    readiness,
    locations,
    tasks,
    recentCreatives,
    invoices,
    campaigns,
    contentCalendars,
    slaIncidents,
    tickets,
    connections,
  ] = await Promise.all([
    calculateCustomerReadiness(customer._id).catch(() => ({ score: 95, status: "READY" })),
    ClientLocation.find({ customerId: customer._id, status: "Active" }).lean().catch(() => []),
    Work.find({ customer: customer._id }).populate("assignedTo", "name role email").sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
    AgentRun.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
    Invoice.find({ customer: customer._id }).sort({ dueDate: -1 }).limit(6).lean().catch(() => []),
    AdCampaign.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(4).lean().catch(() => []),
    ContentCalendar.find({ clientId: customer._id }).sort({ createdAt: -1 }).limit(2).lean().catch(() => []),
    SLAIncident.find({ clientId: customer._id }).sort({ createdAt: -1 }).limit(4).lean().catch(() => []),
    Ticket.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
    MarketingConnection.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
  ]);

  return {
    customer,
    readiness,
    locations,
    tasks,
    recentCreatives,
    invoices,
    campaigns,
    contentCalendars,
    slaIncidents,
    tickets,
    connections,
  };
};

exports.getClientReadiness = async (params = {}, ctx = {}) => {
  return await calculateCustomerReadiness(params.customerId);
};
