/**
 * proposalHandlers.js
 * Deterministic command handlers for Proposal creation, search, and dispatch.
 */

const Proposal = require("../../../models/Proposal");
const Lead = require("../../../models/Lead");
const Customer = require("../../../models/Customer");
const Deal = require("../../../models/Deal");

exports.createProposal = async (params = {}, ctx = {}) => {
  let recipientName = params.name || params.customerName || params.leadName || "Client";
  recipientName = recipientName.replace(/^(?:i\s+want\s+to\s+send\s+a\s+proposal\s+for|send\s+proposal\s+to|send\s+a\s+proposal\s+for|create\s+proposal\s+for|proposal\s+for|for)\s+/i, "").trim();

  // Normalized matching for names like "sureshkumar" -> "Suresh Kumar"
  const cleanTerm = recipientName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  const allLeads = await Lead.find().sort({ createdAt: -1 }).lean();
  let lead = allLeads.find((l) => {
    const lClean = (l.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return lClean.includes(cleanTerm) || cleanTerm.includes(lClean) || (l.name && new RegExp(recipientName, "i").test(l.name));
  });

  const allCustomers = await Customer.find().sort({ createdAt: -1 }).lean();
  let customer = allCustomers.find((c) => {
    const cClean = (c.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cClean.includes(cleanTerm) || cleanTerm.includes(cClean) || (c.name && new RegExp(recipientName, "i").test(c.name));
  });

  let deal = lead ? await Deal.findOne({ leadId: lead._id }).lean() : null;

  const propCount = await Proposal.countDocuments();
  const proposalNumber = `PROP-${new Date().getFullYear()}-${String(propCount + 1).padStart(4, "0")}`;

  const numVal = params.proposalValue || params.budget || params.dealValue;
  const proposalValue = typeof numVal === "number"
    ? numVal
    : (numVal ? Number(String(numVal).replace(/[^0-9]/g, "")) : 50000) || 50000;

  const packageName = params.package || params.services || "Growth Engine & Digital Marketing";
  const finalName = lead?.name || customer?.name || recipientName;
  const contactNumber = lead?.contactNumber || lead?.phone || customer?.contactNumber || customer?.contactNumbers?.[0] || params.phone || "9876543210";
  const email = lead?.email || customer?.email || "contact@client.com";

  const newProposal = await Proposal.create({
    proposalNumber,
    leadId: lead?._id || null,
    customerId: customer?._id || null,
    dealId: deal?._id || null,
    customerName: finalName,
    companyName: customer?.companyName || lead?.name || finalName,
    clientName: finalName,
    contactNumber,
    email,
    title: `Commercial Proposal - ${packageName}`,
    packageName,
    branchId: lead?.branchId || customer?.branchId || "BR001",
    proposalValue,
    grandTotal: proposalValue,
    scopeOfWork: `Complete execution of ${packageName} services with verified milestone tracking.`,
    deliverables: "Monthly Creative Assets, Paid Ad Management, Performance Reports & SEO Audit",
    timeline: params.timeline || "30 Days Execution Cycle",
    paymentTerms: "50% Advance on Confirmation, 50% on Milestone Delivery",
    status: "Draft",
    createdBy: ctx.userId || null,
    assignedTo: ctx.userId || null,
    history: [
      {
        action: "Created",
        performedBy: ctx.userId || null,
        performedByName: "AI Workspace",
        note: `Proposal generated via AI Workspace for ${recipientName}`,
        date: new Date(),
      },
    ],
  });

  return {
    proposal: newProposal.toObject(),
    lead: lead || null,
    customer: customer || null,
    message: `✓ Proposal '${proposalNumber}' created for ${recipientName} (Value: ₹${proposalValue.toLocaleString('en-IN')}). Ready for dispatch!`,
  };
};

exports.getProposals = async (params = {}, ctx = {}) => {
  const query = {};
  if (params.query) {
    const regex = new RegExp(params.query, "i");
    query.$or = [{ customerName: regex }, { title: regex }, { proposalNumber: regex }];
  }
  const proposals = await Proposal.find(query).sort({ createdAt: -1 }).limit(10).lean();
  return { count: proposals.length, proposals };
};
