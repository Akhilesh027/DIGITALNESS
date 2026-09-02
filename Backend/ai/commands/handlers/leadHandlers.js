/**
 * leadHandlers.js
 * Deterministic handlers for Lead commands.
 */

const Lead = require("../../../models/Lead");
const User = require("../../../models/User");

exports.searchLeads = async (params = {}, ctx = {}) => {
  const query = {};
  if (params.query) {
    const regex = new RegExp(params.query, "i");
    query.$or = [{ name: regex }, { city: regex }, { contactNumber: regex }, { businessType: regex }];
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.leadScore) {
    query.leadScore = params.leadScore;
  }
  if (params.assignedTo) {
    query.assignedTo = params.assignedTo;
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const leads = await Lead.find(query)
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    count: leads.length,
    leads,
  };
};

exports.getLead = async (params = {}, ctx = {}) => {
  const lead = await Lead.findById(params.leadId).populate("assignedTo", "name email role").lean();
  if (!lead) throw new Error(`Lead with ID '${params.leadId}' not found.`);
  return lead;
};

exports.createLead = async (params = {}, ctx = {}) => {
  const contactNumber = params.contactNumber || params.phone || params.mobile || "9876543210";
  const name = params.name || params.companyName || "New Lead";
  const requirements = Array.isArray(params.requirements)
    ? params.requirements
    : params.requirements
    ? [params.requirements]
    : ["Digital Marketing"];
  const businessType = params.businessType || (requirements.length > 0 ? requirements[0] : "Digital Marketing");
  const city = params.city || params.location || "";
  const leadScore = params.leadScore || "Warm";
  let assignedTo = null;
  if (params.assignedTo) {
    const rawStr = String(params.assignedTo);
    if (rawStr.toLowerCase().includes("me") && ctx.userId) {
      assignedTo = ctx.userId;
    } else {
      const cleanName = rawStr.split("(")[0].trim();
      if (cleanName && !cleanName.toLowerCase().includes("unassigned") && !cleanName.toLowerCase().includes("auto")) {
        const user = await User.findOne({ name: new RegExp(cleanName, "i") });
        if (user) assignedTo = user._id;
      }
    }
  }

  const source = params.source || "Telecaller";
  const branchId = params.branchId || "BR001";

  const notesList = [];
  if (params.notes) {
    if (Array.isArray(params.notes)) notesList.push(...params.notes);
    else notesList.push(String(params.notes));
  }
  if (params.assignedTo) {
    notesList.push(`Assignment Directive: ${params.assignedTo}`);
  }
  if (params.contactPerson) {
    notesList.push(`Contact Person: ${params.contactPerson}`);
  }
  if (params.email) {
    notesList.push(`Email: ${params.email}`);
  }
  if (params.budget) {
    notesList.push(`Budget: ₹${Number(params.budget).toLocaleString("en-IN")}`);
  }

  const lead = await Lead.create({
    name,
    contactNumber,
    businessType,
    city,
    requirements,
    leadScore,
    assignedTo,
    source,
    branchId,
    notes: notesList,
    createdBy: ctx.userId || null,
  });

  const populatedLead = await Lead.findById(lead._id).populate("assignedTo", "name email role").lean();
  return populatedLead;
};

exports.assignLead = async (params = {}, ctx = {}) => {
  const lead = await Lead.findById(params.leadId);
  if (!lead) throw new Error(`Lead with ID '${params.leadId}' not found.`);

  const employee = await User.findById(params.assignedTo);
  if (!employee) throw new Error(`Employee with ID '${params.assignedTo}' not found.`);

  const previousAssignedTo = lead.assignedTo;
  lead.assignedTo = employee._id;
  lead.notes.push(`Lead assigned to ${employee.name} via AI command on ${new Date().toLocaleDateString()}`);

  await lead.save();

  return {
    leadId: lead._id,
    leadName: lead.name,
    assignedTo: { id: employee._id, name: employee.name, email: employee.email },
    previousAssignedTo,
  };
};

exports.recordFollowUp = async (params = {}, ctx = {}) => {
  const lead = await Lead.findById(params.leadId);
  if (!lead) throw new Error(`Lead with ID '${params.leadId}' not found.`);

  const followUpEntry = {
    callStatus: params.callStatus || "Follow Up",
    notes: params.notes || "Follow-up logged via AI Command",
    followUpDate: params.followUpDate ? new Date(params.followUpDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    calledBy: ctx.userId || null,
    calledAt: new Date(),
  };

  lead.callLogs.push(followUpEntry);
  lead.status = params.callStatus || "Follow Up";
  if (params.notes) lead.notes.push(params.notes);
  lead.lastContactDate = new Date();
  lead.nextFollowUpDate = followUpEntry.followUpDate;

  await lead.save();
  return lead.toObject();
};

exports.convertLead = async (params = {}, ctx = {}) => {
  let lead = null;
  if (params.leadId) {
    lead = await Lead.findById(params.leadId);
  }
  if (!lead && (params.leadName || params.name || params.query)) {
    const nameSearch = (params.leadName || params.name || params.query)
      .replace(/lets|convert|lead|to|sales|pipeline|salespipeline/gi, "")
      .trim();
    if (nameSearch) {
      lead = await Lead.findOne({ name: new RegExp(nameSearch, "i") });
    }
  }
  if (!lead) {
    lead = await Lead.findOne({ status: { $ne: "Converted" } }).sort({ createdAt: -1 });
  }
  if (!lead) throw new Error("No active sales lead found to convert to pipeline.");

  const Deal = require("../../../models/Deal");
  lead.status = "Converted";
  lead.notes = lead.notes || [];
  lead.notes.push(`Lead converted to Sales Pipeline Deal via AI Workspace on ${new Date().toLocaleDateString()}`);
  await lead.save();

  const dealValue = params.dealValue || lead.expectedRevenue || 50000;
  const deal = await Deal.create({
    leadId: lead._id,
    title: `Deal - ${lead.name}`,
    customerName: lead.name,
    contactNumber: lead.contactNumber || "9999999999",
    businessType: (lead.requirements && lead.requirements[0]) || "Digital Marketing",
    branchId: lead.branchId || "BR001",
    stage: params.stage || "Qualified",
    dealValue,
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    assignedTo: lead.assignedTo || ctx.userId || null,
  });

  return {
    lead: lead.toObject(),
    deal: deal.toObject(),
    message: `Lead '${lead.name}' successfully converted to Sales Pipeline Deal in stage 'Qualified' with Deal Value ₹${dealValue.toLocaleString('en-IN')}.`,
  };
};
