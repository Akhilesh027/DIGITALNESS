const Lead = require("../models/Lead.js");
const Deal = require("../models/Deal.js");
const Customer = require("../models/Customer");
const Branch = require("../models/Branch");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");
const sendMail = require("../utils/sendMail");
const clientAutoProvisioningService = require("../services/clientAutoProvisioningService");

const getDealValueFromBudget = (budgetRange = "") => {
  if (budgetRange.includes("3L+")) return 300000;
  if (budgetRange.includes("1L - ₹3L")) return 200000;
  if (budgetRange.includes("50K - ₹1L")) return 75000;
  if (budgetRange.includes("25K - ₹50K")) return 35000;
  if (budgetRange.includes("10K - ₹25K")) return 18000;
  return 50000;
};

const getUserId = (user) => user?._id || user?.id || user;

const getLeadEmail = (lead) => {
  return lead?.email || lead?.clientEmail || lead?.customerEmail || "";
};

const getAdminEmails = async () => {
  const admins = await User.find({
    role: "Admin",
    status: { $ne: "Inactive" },
    email: { $exists: true, $ne: "" },
  }).select("email");

  const emails = admins.map((admin) => admin.email).filter(Boolean);

  if (process.env.ADMIN_EMAIL) {
    emails.push(process.env.ADMIN_EMAIL);
  }

  return [...new Set(emails)];
};

const leadMailTemplate = ({ title, message, lead, buttonText, buttonLink }) => {
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
      <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 12px;color:#111827">${title}</h2>
        <p style="font-size:15px;color:#374151;line-height:1.6">${message}</p>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:18px">
          <p><b>Lead Name:</b> ${lead?.name || "-"}</p>
          <p><b>Contact:</b> ${lead?.contactNumber || "-"}</p>
          <p><b>Email:</b> ${getLeadEmail(lead) || "-"}</p>
          <p><b>Business Type:</b> ${lead?.businessType || "-"}</p>
          <p><b>City:</b> ${lead?.city || "-"}</p>
          <p><b>Status:</b> ${lead?.status || "-"}</p>
          <p><b>Requirements:</b> ${
            lead?.requirements?.length ? lead.requirements.join(", ") : "-"
          }</p>
        </div>

        ${
          buttonLink
            ? `<a href="${buttonLink}" style="display:inline-block;margin-top:20px;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px">${buttonText || "View Details"}</a>`
            : ""
        }

        <p style="font-size:12px;color:#6b7280;margin-top:24px">
          This is an automated email from Digitalness CRM.
        </p>
      </div>
    </div>
  `;
};

const sendLeadMail = async ({ to, subject, title, message, lead, buttonText, buttonLink }) => {
  if (!to) return;

  await sendMail({
    to,
    subject,
    html: leadMailTemplate({
      title,
      message,
      lead,
      buttonText,
      buttonLink,
    }),
  });
};

const notifyUser = async ({
  title,
  message,
  type,
  moduleId,
  moduleModel,
  recipient,
  createdBy,
  link,
}) => {
  if (!recipient) return;

  await createNotification({
    title,
    message,
    type,
    moduleId,
    moduleModel,
    recipient,
    createdBy,
    link,
  });
};

const populateLead = async (id) => {
  return await Lead.findById(id)
    .populate("assignedTo", "name email phone role department branchId status")
    .populate("createdBy", "name email role branchId")
    .populate("callLogs.calledBy", "name email role");
};

// ========== CREATE LEAD ==========
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.user?._id,
      lastContactDate: new Date(),
    });

    const populatedLead = await populateLead(lead._id);
    const assignedUserId = getUserId(populatedLead.assignedTo);
    const clientEmail = getLeadEmail(populatedLead);
    const adminEmails = await getAdminEmails();

    // Client welcome mail
    if (clientEmail) {
      await sendLeadMail({
        to: clientEmail,
        subject: "Welcome to Digitalness",
        title: "Welcome to Digitalness",
        message: `Hi ${populatedLead.name}, thank you for contacting Digitalness. Our team has received your enquiry and will connect with you shortly.`,
        lead: populatedLead,
      });
    }

    // Admin new lead mail
    if (adminEmails.length) {
      await sendLeadMail({
        to: adminEmails.join(","),
        subject: "New Lead Received",
        title: "New Lead Received",
        message: `${populatedLead.name} has submitted a new lead enquiry.`,
        lead: populatedLead,
        buttonText: "Open CRM",
        buttonLink: `${process.env.CLIENT_URL || ""}/leads/${populatedLead._id}`,
      });
    }

    // Assigned employee notification + email
    if (assignedUserId) {
      await notifyUser({
        title: "New Lead Assigned",
        message: `${populatedLead.name} has been assigned to you. Contact: ${populatedLead.contactNumber}, Business: ${populatedLead.businessType}`,
        type: "lead",
        moduleId: populatedLead._id,
        moduleModel: "Lead",
        recipient: assignedUserId,
        createdBy: req.user?._id,
        link: `/leads/${populatedLead._id}`,
      });

      if (populatedLead.assignedTo?.email) {
        await sendLeadMail({
          to: populatedLead.assignedTo.email,
          subject: "New Lead Assigned To You",
          title: "New Lead Assigned",
          message: `${populatedLead.name} has been assigned to you. Please follow up with the client.`,
          lead: populatedLead,
          buttonText: "View Lead",
          buttonLink: `${process.env.CLIENT_URL || ""}/leads/${populatedLead._id}`,
        });
      }
    }

    res.status(201).json({
      message: "Lead created successfully",
      lead: populatedLead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GET LEADS ==========
exports.getLeads = async (req, res) => {
  try {
    const loggedUser = req.user;
    let filter = {};

    if (loggedUser.role === "Admin") {
      filter = {};
    } else if (loggedUser.role === "Operational Manager") {
      filter = { branchId: loggedUser.branchId };
    } else {
      filter = { assignedTo: loggedUser._id };
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email phone role department branchId status")
      .populate("createdBy", "name email role branchId")
      .populate("callLogs.calledBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GET SINGLE LEAD ==========
exports.getLeadById = async (req, res) => {
  try {
    const lead = await populateLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== UPDATE LEAD ==========
exports.updateLead = async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);

    if (!oldLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const oldAssignedTo = oldLead.assignedTo ? String(oldLead.assignedTo) : null;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email phone role department status")
      .populate("createdBy", "name email role")
      .populate("callLogs.calledBy", "name email role");

    const newAssignedTo = lead.assignedTo ? String(getUserId(lead.assignedTo)) : null;

    if (newAssignedTo && oldAssignedTo !== newAssignedTo) {
      await notifyUser({
        title: "Lead Assigned To You",
        message: `${lead.name} lead has been assigned to you. Contact: ${lead.contactNumber}`,
        type: "lead",
        moduleId: lead._id,
        moduleModel: "Lead",
        recipient: newAssignedTo,
        createdBy: req.user?._id,
        link: `/leads/${lead._id}`,
      });

      if (lead.assignedTo?.email) {
        await sendLeadMail({
          to: lead.assignedTo.email,
          subject: "Lead Assigned To You",
          title: "Lead Assigned To You",
          message: `${lead.name} has been assigned to you. Please contact the client.`,
          lead,
          buttonText: "View Lead",
          buttonLink: `${process.env.CLIENT_URL || ""}/leads/${lead._id}`,
        });
      }
    }

    const adminEmails = await getAdminEmails();

    if (adminEmails.length) {
      await sendLeadMail({
        to: adminEmails.join(","),
        subject: "Lead Updated",
        title: "Lead Updated",
        message: `${lead.name} lead details have been updated.`,
        lead,
        buttonText: "Open Lead",
        buttonLink: `${process.env.CLIENT_URL || ""}/leads/${lead._id}`,
      });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== DELETE LEAD ==========
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== ASSIGN LEAD ==========
exports.assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const oldLead = await Lead.findById(req.params.id);

    if (!oldLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const oldAssignedTo = oldLead.assignedTo ? String(oldLead.assignedTo) : null;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "name email phone role department status")
      .populate("createdBy", "name email role")
      .populate("callLogs.calledBy", "name email role");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const newAssignedTo = assignedTo ? String(assignedTo) : null;

    if (newAssignedTo && oldAssignedTo !== newAssignedTo) {
      await notifyUser({
        title: "New Lead Assigned",
        message: `${lead.name} has been assigned to you. Contact: ${lead.contactNumber}, Business: ${lead.businessType}`,
        type: "lead",
        moduleId: lead._id,
        moduleModel: "Lead",
        recipient: newAssignedTo,
        createdBy: req.user?._id,
        link: `/leads/${lead._id}`,
      });

      if (lead.assignedTo?.email) {
        await sendLeadMail({
          to: lead.assignedTo.email,
          subject: "New Lead Assigned To You",
          title: "New Lead Assigned",
          message: `${lead.name} has been assigned to you. Please follow up with the client.`,
          lead,
          buttonText: "View Lead",
          buttonLink: `${process.env.CLIENT_URL || ""}/leads/${lead._id}`,
        });
      }

      const adminEmails = await getAdminEmails();

      if (adminEmails.length) {
        await sendLeadMail({
          to: adminEmails.join(","),
          subject: "Lead Assignment Updated",
          title: "Lead Assignment Updated",
          message: `${lead.name} has been assigned to ${lead.assignedTo?.name || "an employee"}.`,
          lead,
          buttonText: "Open Lead",
          buttonLink: `${process.env.CLIENT_URL || ""}/leads/${lead._id}`,
        });
      }
    }

    res.status(200).json({
      message: "Lead assigned successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== ADD CALL LOG ==========
exports.addCallLog = async (req, res) => {
  try {
    const { callStatus, notes, requirements, followUpDate } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const callLog = {
      callStatus,
      notes,
      requirements: requirements || [],
      followUpDate,
      calledBy: req.user?._id,
      calledAt: new Date(),
    };

    lead.callLogs.push(callLog);

    if (notes) lead.notes.push(notes);

    lead.status = callStatus;
    lead.lastContactDate = new Date();

    if (requirements?.length) {
      lead.requirements = requirements;
    }

    if (callStatus === "Call Back" || callStatus === "Follow Up") {
      lead.followUpDate = followUpDate;
      lead.nextFollowUpDate = followUpDate;
    }

    if (callStatus === "Own Close") {
      lead.convertedToCustomer = true;
    }

    await lead.save();

    const updatedLead = await populateLead(lead._id);
    const assignedUserId = getUserId(updatedLead.assignedTo);
    const adminEmails = await getAdminEmails();

    if (assignedUserId && String(assignedUserId) !== String(req.user?._id)) {
      await notifyUser({
        title: "Lead Call Log Updated",
        message: `${updatedLead.name} status updated to ${callStatus}. ${notes || ""}`,
        type: "lead",
        moduleId: updatedLead._id,
        moduleModel: "Lead",
        recipient: assignedUserId,
        createdBy: req.user?._id,
        link: `/leads/${updatedLead._id}`,
      });
    }

    if (updatedLead.assignedTo?.email) {
      await sendLeadMail({
        to: updatedLead.assignedTo.email,
        subject: `Lead Status Updated - ${callStatus}`,
        title: "Lead Status Updated",
        message: `${updatedLead.name} status has been updated to ${callStatus}. Notes: ${notes || "-"}`,
        lead: updatedLead,
        buttonText: "View Lead",
        buttonLink: `${process.env.CLIENT_URL || ""}/leads/${updatedLead._id}`,
      });
    }

    if (callStatus === "Call Back" || callStatus === "Follow Up") {
      if (adminEmails.length) {
        await sendLeadMail({
          to: adminEmails.join(","),
          subject: `Lead ${callStatus} Alert`,
          title: `Lead ${callStatus} Alert`,
          message: `${updatedLead.name} is marked as ${callStatus}. Follow-up date: ${followUpDate || "Not added"}.`,
          lead: updatedLead,
          buttonText: "Open Lead",
          buttonLink: `${process.env.CLIENT_URL || ""}/leads/${updatedLead._id}`,
        });
      }
    }

    res.status(200).json({
      message: "Call log added successfully",
      lead: updatedLead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== PUSH LEAD TO PIPELINE ==========
exports.pushToPipeline = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.leadScore === "Cold") {
      return res.status(400).json({
        message: "Cold leads cannot be moved to pipeline",
      });
    }

    const existingDeal = await Deal.findOne({ leadId: lead._id });

    if (existingDeal) {
      return res.status(400).json({
        message: "Lead already exists in sales pipeline",
        deal: existingDeal,
      });
    }

    const deal = await Deal.create({
      leadId: lead._id,
      title: `${lead.name} - ${
        lead.requirements?.length ? lead.requirements.join(", ") : "Discovery"
      }`,
      customerName: lead.name,
      contactNumber: lead.contactNumber,
      businessType: lead.businessType,
      branchId: lead.branchId,
      stage: "New",
      dealValue: getDealValueFromBudget(lead.budgetRange),
      probability: lead.probability || 50,
      expectedCloseDate: lead.expectedClosingDate,
      assignedTo: lead.assignedTo,
      notes: lead.notes.join("\n"),
      callLogs: lead.callLogs,
    });

    lead.inPipeline = true;
    await lead.save();

    if (lead.assignedTo) {
      await notifyUser({
        title: "Lead Moved To Pipeline",
        message: `${lead.name} has been moved to Sales Pipeline as a deal.`,
        type: "deal",
        moduleId: deal._id,
        moduleModel: "Deal",
        recipient: lead.assignedTo,
        createdBy: req.user?._id,
        link: `/sales-pipeline`,
      });
    }

    const populatedLead = await populateLead(lead._id);
    const adminEmails = await getAdminEmails();

    if (populatedLead.assignedTo?.email) {
      await sendLeadMail({
        to: populatedLead.assignedTo.email,
        subject: "Lead Moved To Sales Pipeline",
        title: "Lead Moved To Sales Pipeline",
        message: `${populatedLead.name} has been moved to the sales pipeline.`,
        lead: populatedLead,
        buttonText: "Open Pipeline",
        buttonLink: `${process.env.CLIENT_URL || ""}/sales-pipeline`,
      });
    }

    if (adminEmails.length) {
      await sendLeadMail({
        to: adminEmails.join(","),
        subject: "Lead Moved To Pipeline",
        title: "Lead Moved To Pipeline",
        message: `${populatedLead.name} has been moved to the sales pipeline.`,
        lead: populatedLead,
        buttonText: "Open Pipeline",
        buttonLink: `${process.env.CLIENT_URL || ""}/sales-pipeline`,
      });
    }

    res.status(201).json({
      message: "Lead moved to pipeline successfully",
      deal,
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== CONVERT LEAD TO CUSTOMER ==========
exports.convertLeadToCustomer = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const existingCustomer = await Customer.findOne({ leadId: lead._id });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists for this lead",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name: lead.name,
      businessType: lead.businessType,
      contactNumbers: [lead.contactNumber],
      city: lead.city,
      branchId: lead.branchId,
      assignedTo: lead.assignedTo,
      leadId: lead._id,
      requirements: lead.requirements,
      package: lead.budgetRange,
      totalPaid: 0,
      totalPending: 0,
      createdBy: req.user?._id,
    });

    lead.convertedToCustomer = true;
    lead.status = "Own Close";
    await lead.save();

    if (lead.assignedTo) {
      await notifyUser({
        title: "Lead Converted To Customer",
        message: `${lead.name} has been converted into a customer.`,
        type: "customer",
        moduleId: customer._id,
        moduleModel: "Customer",
        recipient: lead.assignedTo,
        createdBy: req.user?._id,
        link: `/customers`,
      });
    }

    const populatedLead = await populateLead(lead._id);
    const clientEmail = getLeadEmail(populatedLead);
    const adminEmails = await getAdminEmails();

    if (clientEmail) {
      await sendLeadMail({
        to: clientEmail,
        subject: "Welcome Onboard",
        title: "Welcome Onboard",
        message: `Hi ${populatedLead.name}, welcome onboard. Your enquiry has been converted into a customer account and our team will continue the next steps.`,
        lead: populatedLead,
      });
    }

    if (populatedLead.assignedTo?.email) {
      await sendLeadMail({
        to: populatedLead.assignedTo.email,
        subject: "Lead Converted To Customer",
        title: "Lead Converted To Customer",
        message: `${populatedLead.name} has been converted into a customer.`,
        lead: populatedLead,
        buttonText: "View Customers",
        buttonLink: `${process.env.CLIENT_URL || ""}/customers`,
      });
    }

    if (adminEmails.length) {
      await sendLeadMail({
        to: adminEmails.join(","),
        subject: "New Customer Created",
        title: "New Customer Created",
        message: `${populatedLead.name} has been converted into a customer.`,
        lead: populatedLead,
        buttonText: "View Customers",
        buttonLink: `${process.env.CLIENT_URL || ""}/customers`,
      });
    }

    // Zero-Touch Auto-Provisioning: Monthly deliverables pipeline & onboarding invoice
    clientAutoProvisioningService.provisionClient({
      customerId: customer._id,
      packageId: customer.package,
      createdBy: req.user?._id,
    }).catch((provErr) => console.log("[Auto-Provisioning Background Warning]:", provErr.message));

    res.status(201).json({
      message: "Lead converted to customer successfully and deliverables pipeline provisioned.",
      lead,
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== GET BRANCHES ==========
exports.getBranches = async (req, res) => {
  try {
    if (Branch) {
      const branches = await Branch.find().select("_id name code branchId city status");
      return res.status(200).json(branches);
    }

    const leads = await Lead.find().select("branchId").lean();
    const users = await User.find().select("branchId").lean();

    const allIds = [
      ...leads.map((lead) => lead.branchId),
      ...users.map((user) => user.branchId),
    ].filter(Boolean);

    const uniqueIds = [...new Set(allIds.map((id) => id.toString()))];

    const branches = uniqueIds.map((id) => ({
      _id: id,
      name: `Branch ${id.slice(-4)}`,
    }));

    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const canEditDeleteLead = (user) => {
  return ["Admin", "Operational Manager"].includes(user?.role);
};
exports.updateLead = async (req, res) => {
  try {
    if (!canEditDeleteLead(req.user)) {
      return res.status(403).json({
        message: "Only Admin and Operational Manager can edit leads",
      });
    }

    const oldLead = await Lead.findById(req.params.id);

    if (!oldLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (
      req.user.role === "Operational Manager" &&
      String(oldLead.branchId) !== String(req.user.branchId)
    ) {
      return res.status(403).json({
        message: "You can edit only your branch leads",
      });
    }

    const oldAssignedTo = oldLead.assignedTo ? String(oldLead.assignedTo) : null;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email phone role department status")
      .populate("createdBy", "name email role")
      .populate("callLogs.calledBy", "name email role");

    const newAssignedTo = lead.assignedTo
      ? String(getUserId(lead.assignedTo))
      : null;

    if (newAssignedTo && oldAssignedTo !== newAssignedTo) {
      await notifyUser({
        title: "Lead Assigned To You",
        message: `${lead.name} lead has been assigned to you. Contact: ${lead.contactNumber}`,
        type: "lead",
        moduleId: lead._id,
        moduleModel: "Lead",
        recipient: newAssignedTo,
        createdBy: req.user?._id,
        link: `/leads/${lead._id}`,
      });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteLead = async (req, res) => {
  try {
    if (!canEditDeleteLead(req.user)) {
      return res.status(403).json({
        message: "Only Admin and Operational Manager can delete leads",
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (
      req.user.role === "Operational Manager" &&
      String(lead.branchId) !== String(req.user.branchId)
    ) {
      return res.status(403).json({
        message: "You can delete only your branch leads",
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};