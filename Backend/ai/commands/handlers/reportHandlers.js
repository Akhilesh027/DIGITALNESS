/**
 * reportHandlers.js
 * Deterministic handlers for Analytics & Reporting commands.
 */

const Customer = require("../../../models/Customer");
const Work = require("../../../models/Work");
const Lead = require("../../../models/Lead");
const User = require("../../../models/User");

exports.getRevenueReport = async (params = {}, ctx = {}) => {
  const customers = await Customer.find({ status: "Active" }).select("totalPaid totalPending name").lean();

  const totalCollected = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalPending = customers.reduce((sum, c) => sum + (c.totalPending || 0), 0);

  return {
    period: params.period || "All Time / Current Month",
    currency: "INR",
    totalCollected,
    totalPending,
    totalBilled: totalCollected + totalPending,
    activeClientCount: customers.length,
    topClients: customers
      .sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0))
      .slice(0, 5)
      .map((c) => ({ name: c.name, totalPaid: c.totalPaid })),
  };
};

exports.getClientReport = async (params = {}, ctx = {}) => {
  const customer = await Customer.findById(params.customerId).lean();
  if (!customer) throw new Error(`Customer with ID '${params.customerId}' not found.`);

  const works = await Work.find({ customer: customer._id }).lean();
  const completed = works.filter((w) => w.status === "Completed").length;
  const inProgress = works.filter((w) => ["In Progress", "Pending"].includes(w.status)).length;

  return {
    client: { id: customer._id, name: customer.name, city: customer.city, package: customer.package },
    totalProjects: works.length,
    completedProjects: completed,
    inProgressProjects: inProgress,
    totalPaid: customer.totalPaid || 0,
    totalPending: customer.totalPending || 0,
  };
};

exports.getTasksReport = async (params = {}, ctx = {}) => {
  const query = {};
  if (params.customerId) query.customer = params.customerId;
  if (params.status) query.status = params.status;

  const tasks = await Work.find(query).lean();
  const byStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalTasks: tasks.length,
    statusBreakdown: byStatus,
    pendingCount: (byStatus["Pending"] || 0) + (byStatus["In Progress"] || 0) + (byStatus["Review"] || 0),
    completedCount: byStatus["Completed"] || 0,
  };
};

exports.getLeadsReport = async (params = {}, ctx = {}) => {
  const leads = await Lead.find().lean();
  const hot = leads.filter((l) => l.leadScore === "Hot").length;
  const warm = leads.filter((l) => l.leadScore === "Warm").length;
  const cold = leads.filter((l) => l.leadScore === "Cold").length;
  const converted = leads.filter((l) => l.convertedToCustomer).length;

  return {
    totalLeads: leads.length,
    hotLeads: hot,
    warmLeads: warm,
    coldLeads: cold,
    convertedLeads: converted,
    conversionRate: leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0,
  };
};
