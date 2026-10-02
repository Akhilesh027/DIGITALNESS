const Proposal = require("../models/Proposal.js");
const Customer = require("../models/Customer.js");
const Deal = require("../models/Deal.js");
const Lead = require("../models/Lead.js");
const Notification = require("../models/Notification.js");
const sendMail = require("../utils/sendMail");

const ADMIN_ROLES = ["Admin", "admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const getUserId = (user) => user?._id || user?.id;

const generateProposalNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Proposal.countDocuments();
  const seq = String(count + 1).padStart(4, "0");
  return `PR-${year}-${seq}`;
};

const getProposalEmail = (proposal) => {
  return (
    proposal?.clientEmail ||
    proposal?.email ||
    proposal?.customerEmail ||
    proposal?.billingEmail ||
    ""
  );
};

const getRoleFilter = (user, query = {}) => {
  if (user?.role === "Client" || user?.type === "client" || user?.customerId) {
    const cId = user.customerId || user._id;
    const orConditions = [{ customerId: cId }];
    if (user.email) {
      const emailLower = String(user.email).trim().toLowerCase();
      orConditions.push({ clientEmail: emailLower });
      orConditions.push({ email: emailLower });
    }
    return { $or: orConditions };
  }

  if (query.customerId) {
    return { customerId: query.customerId };
  }

  if (ADMIN_ROLES.includes(user?.role)) return {};

  if (MANAGER_ROLES.includes(user?.role)) {
    return { branchId: user.branchId };
  }

  return { assignedTo: getUserId(user) };
};

const populateProposal = (query) => {
  return query
    .populate("dealId")
    .populate("leadId")
    .populate("customerId")
    .populate("assignedTo", "name email phone role department branchId")
    .populate("createdBy", "name email role branchId");
};

const calculateProposalTotals = (data = {}) => {
  const services = Array.isArray(data.services) ? data.services : [];

  const updatedServices = services.map((service) => {
    const quantity = Number(service.quantity || 1);
    const price = Number(service.price || 0);

    return {
      ...service,
      quantity,
      price,
      total: quantity * price,
    };
  });

  const subtotal = updatedServices.reduce(
    (sum, service) => sum + Number(service.total || 0),
    0
  );

  const discount = Number(data.discount || 0);
  const gstPercentage = Number(data.gstPercentage ?? 18);
  const taxableAmount = Math.max(subtotal - discount, 0);
  const gstAmount = Math.round((taxableAmount * gstPercentage) / 100);
  const grandTotal = taxableAmount + gstAmount;

  return {
    ...data,
    services: updatedServices,
    subtotal,
    discount,
    gstPercentage,
    gstAmount,
    grandTotal,
    proposalValue: grandTotal,
  };
};

const normalizeProposalPayload = (body = {}) => {
  const data = { ...body };

  const cleanObjectId = (value) => {
    if (!value || value === "" || value === "null" || value === "undefined") {
      return null;
    }
    return value;
  };

  data.dealId = cleanObjectId(data.dealId);
  data.leadId = cleanObjectId(data.leadId);
  data.customerId = cleanObjectId(data.customerId);
  data.parentProposalId = cleanObjectId(data.parentProposalId);
  data.assignedTo = cleanObjectId(data.assignedTo);
  data.createdBy = cleanObjectId(data.createdBy);

  data.clientEmail = data.clientEmail || data.email || "";
  data.email = data.email || data.clientEmail || "";

  if (data.email) data.email = String(data.email).trim().toLowerCase();
  if (data.clientEmail) data.clientEmail = String(data.clientEmail).trim().toLowerCase();

  if (typeof data.services === "string") {
    try {
      data.services = JSON.parse(data.services);
    } catch {
      data.services = [];
    }
  }

  if (!Array.isArray(data.services)) data.services = [];

  if (typeof data.attachments === "string") {
    try {
      data.attachments = JSON.parse(data.attachments);
    } catch {
      data.attachments = [];
    }
  }

  if (!Array.isArray(data.attachments)) data.attachments = [];

  return calculateProposalTotals(data);
};

const validateProposalPayload = (data) => {
  if (!data.customerName && !data.clientName) return "Customer name is required";
  if (!data.title) return "Proposal title is required";
  return null;
};

const buildProposalMailTemplate = ({ proposal, message }) => {
  const servicesHtml = (proposal.services || [])
    .map(
      (s) => `
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb">${s.name || "-"}</td>
          <td style="padding:10px;border:1px solid #e5e7eb">${s.description || "-"}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;text-align:center">${s.quantity || 1}</td>
          <td style="padding:10px;border:1px solid #e5e7eb">₹${Number(s.price || 0).toLocaleString("en-IN")}</td>
          <td style="padding:10px;border:1px solid #e5e7eb">₹${Number(s.total || 0).toLocaleString("en-IN")}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
      <div style="max-width:760px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 8px;color:#111827">Proposal from Digitalness</h2>
        <p style="margin:0;color:#6b7280">Designed and Developed by Digitalness</p>

        <p style="white-space:pre-line;margin-top:20px;color:#374151;line-height:1.6">${message || ""}</p>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:18px">
          <p><b>Proposal No:</b> ${proposal.proposalNumber || "-"}</p>
          <p><b>Client:</b> ${proposal.customerName || proposal.clientName || "-"}</p>
          <p><b>Company:</b> ${proposal.companyName || "-"}</p>
          <p><b>Business:</b> ${proposal.businessType || "-"}</p>
          <p><b>Contact:</b> ${proposal.contactNumber || "-"}</p>
          <p><b>Email:</b> ${getProposalEmail(proposal) || "-"}</p>
          <p><b>Title:</b> ${proposal.title || "-"}</p>
          <p><b>Status:</b> ${proposal.status || "-"}</p>
        </div>

        <h3 style="margin-top:24px">Services & Pricing</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <thead>
            <tr style="background:#111827;color:#ffffff">
              <th style="padding:10px;border:1px solid #111827;text-align:left">Service</th>
              <th style="padding:10px;border:1px solid #111827;text-align:left">Description</th>
              <th style="padding:10px;border:1px solid #111827;text-align:center">Qty</th>
              <th style="padding:10px;border:1px solid #111827;text-align:left">Price</th>
              <th style="padding:10px;border:1px solid #111827;text-align:left">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              servicesHtml ||
              `<tr><td colspan="5" style="padding:10px;border:1px solid #e5e7eb">No services added</td></tr>`
            }
          </tbody>
        </table>

        <div style="margin-top:20px;background:#f9fafb;border-radius:12px;padding:16px">
          <p><b>Subtotal:</b> ₹${Number(proposal.subtotal || 0).toLocaleString("en-IN")}</p>
          <p><b>Discount:</b> ₹${Number(proposal.discount || 0).toLocaleString("en-IN")}</p>
          <p><b>GST (${proposal.gstPercentage || 0}%):</b> ₹${Number(proposal.gstAmount || 0).toLocaleString("en-IN")}</p>
          <h3 style="margin:8px 0 0;color:#111827">Grand Total: ₹${Number(proposal.grandTotal || proposal.proposalValue || 0).toLocaleString("en-IN")}</h3>
        </div>

        <h3 style="margin-top:24px">Scope & Terms</h3>
        <p><b>Scope of Work:</b> ${proposal.scopeOfWork || "-"}</p>
        <p><b>Deliverables:</b> ${proposal.deliverables || "-"}</p>
        <p><b>Timeline:</b> ${proposal.timeline || "-"}</p>
        <p><b>Payment Terms:</b> ${proposal.paymentTerms || "-"}</p>
        <p><b>Support Period:</b> ${proposal.supportPeriod || "-"}</p>

        <p style="margin-top:24px;font-size:13px;color:#6b7280">
          This proposal was sent from Digitalness CRM.
        </p>
      </div>
    </div>
  `;
};

const syncProposalWithRelatedEntities = async ({
  proposal,
  previousProposal = null,
  userId = null,
  io = null,
}) => {
  try {
    if (!proposal) return;

    const proposalId = proposal._id;
    const assignedUserId = proposal.assignedTo?._id || proposal.assignedTo || null;
    const proposalValue = Number(proposal.grandTotal || proposal.proposalValue || 0);

    // 1. SYNCHRONIZE WITH DEAL
    if (proposal.dealId) {
      const dealId = proposal.dealId._id || proposal.dealId;
      const deal = await Deal.findById(dealId);

      if (deal) {
        deal.proposalId = proposalId;
        deal.proposalCreated = true;
        if (proposalValue > 0) {
          deal.dealValue = proposalValue;
        }

        // Synchronize assigned user if specified
        if (assignedUserId && !deal.assignedTo) {
          deal.assignedTo = assignedUserId;
        }

        // Synchronize stage according to proposal status
        if (["Approved", "Accepted"].includes(proposal.status)) {
          deal.stage = "Won";
          deal.customerCreated = true;
          if (proposal.customerId) {
            deal.customerId = proposal.customerId;
          }
          deal.probability = 100;
          deal.wonOn = new Date();
        } else if (["Sent", "Viewed"].includes(proposal.status)) {
          if (["New", "Contacted", "Discovery", "Qualified"].includes(deal.stage)) {
            deal.stage = "Proposal";
            deal.probability = 75;
          }
        } else if (proposal.status === "Revision Requested") {
          if (deal.stage === "Proposal") {
            deal.stage = "Negotiation";
            deal.probability = 80;
          }
        }

        if (!deal.callLogs) deal.callLogs = [];
        deal.callLogs.push({
          callStatus: deal.stage === "Won" ? "Own Close" : "Follow Up",
          notes: "[Proposal Sync] Proposal " + (proposal.proposalNumber || proposal.title) + " (" + proposal.status + ") synced. Value: Rs." + proposalValue.toLocaleString("en-IN"),
          calledAt: new Date(),
          calledBy: userId,
        });

        await deal.save();

        if (io) {
          const populatedDeal = await Deal.findById(deal._id)
            .populate("leadId")
            .populate("proposalId")
            .populate("customerId")
            .populate("assignedTo", "name email phone role department branchId status");
          io.emit("deal_updated", populatedDeal);
        }
      }
    }

    // If dealId changed on proposal, unlink proposal from the previous deal
    const prevDealId = previousProposal?.dealId?._id || previousProposal?.dealId;
    const currentDealId = proposal.dealId?._id || proposal.dealId;
    if (prevDealId && String(prevDealId) !== String(currentDealId)) {
      await Deal.findByIdAndUpdate(prevDealId, {
        $unset: { proposalId: 1 },
        proposalCreated: false,
      });
    }

    // 2. SYNCHRONIZE WITH LEAD
    let targetLeadId = proposal.leadId?._id || proposal.leadId;
    if (!targetLeadId && proposal.dealId) {
      const linkedDeal = await Deal.findById(proposal.dealId?._id || proposal.dealId);
      if (linkedDeal?.leadId) {
        targetLeadId = linkedDeal.leadId;
      }
    }

    if (targetLeadId) {
      const lead = await Lead.findById(targetLeadId);
      if (lead) {
        lead.proposalId = proposalId;
        lead.proposalCreated = true;

        if (assignedUserId && !lead.assignedTo) {
          lead.assignedTo = assignedUserId;
        }

        if (["Approved", "Accepted"].includes(proposal.status)) {
          lead.status = "Converted";
          lead.convertedToCustomer = true;
          if (proposal.customerId) {
            lead.customerId = proposal.customerId;
          }
          lead.wonOn = new Date();
        } else if (["Sent", "Viewed"].includes(proposal.status)) {
          if (["New", "Call Back", "Demo Completed"].includes(lead.status)) {
            lead.status = "Follow Up";
          }
        } else if (proposal.status === "Revision Requested") {
          lead.status = "Negotiation";
        }

        if (!lead.notes) lead.notes = [];
        lead.notes.push(
          "Proposal " + (proposal.proposalNumber || proposal.title) + " (" + proposal.status + ") synced. Value: Rs." + proposalValue.toLocaleString("en-IN")
        );

        await lead.save();

        if (io) {
          const populatedLead = await Lead.findById(lead._id)
            .populate("assignedTo", "name email role")
            .populate("proposalId");
          io.emit("lead_updated", populatedLead);
        }
      }
    }

    // 3. SYNCHRONIZE WITH CUSTOMER
    let targetCustomerId = proposal.customerId?._id || proposal.customerId;
    if (targetCustomerId) {
      const customer = await Customer.findById(targetCustomerId);
      if (customer) {
        if (assignedUserId && !customer.assignedTo) {
          customer.assignedTo = assignedUserId;
        }

        if (proposal.title && !customer.package) {
          customer.package = proposal.title;
        }

        if (Array.isArray(proposal.services) && proposal.services.length > 0) {
          const serviceNames = proposal.services.map((s) => s.name).filter(Boolean);
          const currentReqs = new Set(customer.requirements || []);
          serviceNames.forEach((s) => currentReqs.add(s));
          customer.requirements = Array.from(currentReqs);
        }

        if (["Approved", "Accepted"].includes(proposal.status)) {
          customer.status = "Active";
          if (customer.totalPending === 0 && proposalValue > 0) {
            customer.totalPending = proposalValue;
          }
        }

        if (!customer.activityLogs) customer.activityLogs = [];
        customer.activityLogs.push({
          title: "Proposal " + proposal.status,
          message: "Proposal " + (proposal.proposalNumber || proposal.title) + " (" + proposal.status + ") was synchronized. Amount: Rs." + proposalValue.toLocaleString("en-IN"),
          type: "proposal",
          createdBy: userId,
          createdAt: new Date(),
        });

        await customer.save();

        if (io) {
          const populatedCust = await Customer.findById(customer._id);
          io.emit("customer_updated", populatedCust);
        }
      }
    }

    // 4. NOTIFICATION DISPATCH
    if (assignedUserId && String(assignedUserId) !== String(userId)) {
      try {
        const notif = await Notification.create({
          title: "Proposal " + (proposal.proposalNumber || proposal.title) + " Updated",
          message: "Proposal \"" + proposal.title + "\" for " + (proposal.customerName || "client") + " is now " + proposal.status + ". Value: Rs." + proposalValue.toLocaleString("en-IN"),
          type: "proposal",
          moduleId: proposal._id,
          moduleModel: "Proposal",
          recipient: assignedUserId,
          createdBy: userId,
          link: "/proposals",
        });

        if (io) {
          io.emit("notification", notif);
        }
      } catch (notifErr) {
        console.warn("Proposal notification create failed:", notifErr.message);
      }
    }

    // 5. GLOBAL CRM SOCKET EVENT
    if (io) {
      io.emit("crm_update", {
        type: "proposal",
        action: previousProposal ? "updated" : "created",
        proposalId: proposal._id,
        dealId: proposal.dealId,
        leadId: proposal.leadId,
        customerId: proposal.customerId,
        status: proposal.status,
        grandTotal: proposal.grandTotal,
        assignedTo: proposal.assignedTo,
      });
    }
  } catch (err) {
    console.error("Error in syncProposalWithRelatedEntities:", err);
  }
};

exports.getProposals = async (req, res) => {
  try {
    const filter = getRoleFilter(req.user, req.query);

    const proposals = await populateProposal(
      Proposal.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    console.log("Get proposals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch proposals",
      error: error.message,
    });
  }
};

exports.getProposalById = async (req, res) => {
  try {
    const proposal = await populateProposal(Proposal.findById(req.params.id));

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.log("Get proposal by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch proposal",
      error: error.message,
    });
  }
};

exports.createProposal = async (req, res) => {
  try {
    const userId = getUserId(req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing from token.",
      });
    }

    let proposalNumber = req.body.proposalNumber;

    if (!proposalNumber) {
      proposalNumber = await generateProposalNumber();
    }

    const proposalData = normalizeProposalPayload({
      ...req.body,
      proposalNumber,
      mailSent: false,
      createdBy: userId,
      assignedTo: req.body.assignedTo || userId,
    });

    if (!proposalData.customerName && proposalData.clientName) {
      proposalData.customerName = proposalData.clientName;
    }

    if (!proposalData.branchId) {
      proposalData.branchId = req.user?.branchId || "";
    }

    const validationError = validateProposalPayload(proposalData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const proposal = await Proposal.create(proposalData);

    const populatedProposal = await populateProposal(
      Proposal.findById(proposal._id)
    );

    const io = req.app.get("io");
    await syncProposalWithRelatedEntities({
      proposal: populatedProposal,
      userId,
      io,
    });

    if (io) {
      io.emit("proposal_created", populatedProposal);
    }

    return res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      data: populatedProposal,
    });
  } catch (error) {
    console.log("Create proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create proposal",
      error: error.message,
    });
  }
};

exports.updateProposal = async (req, res) => {
  try {
    const { id } = req.params;

    const oldProposal = await Proposal.findById(id).lean();

    let updates = normalizeProposalPayload(req.body);

    delete updates._id;
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.proposalNumber;
    delete updates.__v;

    if (!updates.customerName && updates.clientName) {
      updates.customerName = updates.clientName;
    }

    const validationError = validateProposalPayload({
      ...updates,
      customerName: updates.customerName || "existing",
      title: updates.title || "existing",
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const proposal = await populateProposal(
      Proposal.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      )
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    const io = req.app.get("io");
    await syncProposalWithRelatedEntities({
      proposal,
      previousProposal: oldProposal,
      userId: getUserId(req.user),
      io,
    });

    if (io) {
      io.emit("proposal_updated", proposal);
    }

    return res.status(200).json({
      success: true,
      message: "Proposal updated successfully",
      data: proposal,
    });
  } catch (error) {
    console.log("Update proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update proposal",
      error: error.message,
    });
  }
};

exports.sendProposalMail = async (req, res) => {
  try {
    const { clientEmail, subject, message } = req.body;

    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    const finalEmail = clientEmail || getProposalEmail(proposal);

    if (!finalEmail) {
      return res.status(400).json({
        success: false,
        message: "Client email is required",
      });
    }

    const clientNameStr = proposal.customerName || proposal.clientName || "";
    const finalSubject =
      subject ||
      proposal.mailSubject ||
      ("Proposal from Digitalness - " + clientNameStr);

    const finalMessage =
      message ||
      proposal.mailMessage ||
      ("Dear " + (clientNameStr || "Client") + ",\n\nPlease find your proposal details below.\n\nRegards,\nDigitalness Team");

    await sendMail({
      to: finalEmail,
      subject: finalSubject,
      html: buildProposalMailTemplate({
        proposal,
        message: finalMessage,
      }),
    });

    proposal.clientEmail = finalEmail;
    proposal.email = finalEmail;
    proposal.mailSubject = finalSubject;
    proposal.mailMessage = finalMessage;
    proposal.mailSent = true;
    proposal.sentAt = new Date();
    proposal.status = "Sent";

    await proposal.save();

    const populatedProposal = await populateProposal(
      Proposal.findById(proposal._id)
    );

    const io = req.app.get("io");
    await syncProposalWithRelatedEntities({
      proposal: populatedProposal,
      userId: getUserId(req.user),
      io,
    });

    if (io) {
      io.emit("proposal_updated", populatedProposal);
    }

    return res.status(200).json({
      success: true,
      message: "Proposal mail sent successfully",
      data: populatedProposal,
    });
  } catch (error) {
    console.log("Send proposal mail error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send proposal mail",
      error: error.message,
    });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // Unlink from linked Deal
    if (proposal.dealId) {
      await Deal.findByIdAndUpdate(proposal.dealId, {
        $unset: { proposalId: 1 },
        proposalCreated: false,
      });
    }

    // Unlink from linked Lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, {
        $unset: { proposalId: 1 },
        proposalCreated: false,
      });
    }

    await Proposal.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    if (io) {
      io.emit("proposal_deleted", { _id: req.params.id, id: req.params.id });
      io.emit("crm_update", { type: "proposal", action: "deleted", id: req.params.id });
    }

    return res.status(200).json({
      success: true,
      message: "Proposal deleted successfully",
    });
  } catch (error) {
    console.log("Delete proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete proposal",
      error: error.message,
    });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "Draft",
      "Sent",
      "Viewed",
      "Approved",
      "Rejected",
      "Revision Requested",
      "Expired",
      "Accepted",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal status",
      });
    }

    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    proposal.status = status;

    if (status === "Sent") proposal.sentAt = new Date();
    if (status === "Viewed") proposal.viewedAt = new Date();
    if (status === "Approved" || status === "Accepted") proposal.approvedAt = new Date();
    if (status === "Rejected") proposal.rejectedAt = new Date();

    if (status === "Approved" || status === "Accepted") {
      const email = getProposalEmail(proposal);
      const contactNumber = proposal.contactNumber;

      let existingCustomer = null;

      if (proposal.customerId) {
        existingCustomer = await Customer.findById(proposal.customerId);
      }

      if (!existingCustomer && email) {
        existingCustomer = await Customer.findOne({ email });
      }

      if (!existingCustomer && contactNumber) {
        existingCustomer = await Customer.findOne({
          contactNumbers: contactNumber,
        });
      }

      if (existingCustomer) {
        proposal.customerId = existingCustomer._id;
        proposal.customerCreated = true;

        if (existingCustomer.activityLogs) {
          existingCustomer.activityLogs.push({
            title: "Proposal Approved",
            message: (proposal.title || "Proposal") + " approved",
            type: "proposal",
            createdBy: getUserId(req.user),
          });

          await existingCustomer.save();
        }
      } else {
        const newCustomer = await Customer.create({
          name: proposal.customerName || proposal.clientName,
          companyName: proposal.companyName || "",
          businessType: proposal.businessType || "General",
          contactNumbers: proposal.contactNumber ? [proposal.contactNumber] : ["0000000000"],
          email,
          branchId: proposal.branchId || req.user?.branchId,
          assignedTo: proposal.assignedTo,
          leadId: proposal.leadId,
          requirements:
            proposal.requirements ||
            proposal.services?.map((service) => service.name) ||
            [],
          package: proposal.title,
          totalPaid: 0,
          totalPending: proposal.proposalValue || proposal.grandTotal || 0,
          status: "Active",
          createdBy: getUserId(req.user),
          activityLogs: [
            {
              title: "Customer Created From Proposal",
              message: (proposal.title || "Proposal") + " was approved and converted into customer",
              type: "proposal",
              createdBy: getUserId(req.user),
            },
          ],
        });

        proposal.customerId = newCustomer._id;
        proposal.customerCreated = true;
      }

      if (proposal.dealId) {
        await Deal.findByIdAndUpdate(proposal.dealId, {
          customerCreated: true,
          customerId: proposal.customerId,
          stage: "Won",
        });
      }
    }

    await proposal.save();

    const updatedProposal = await populateProposal(
      Proposal.findById(proposal._id)
    );

    const io = req.app.get("io");
    await syncProposalWithRelatedEntities({
      proposal: updatedProposal,
      userId: getUserId(req.user),
      io,
    });

    if (io) {
      io.emit("proposal_status_updated", updatedProposal);
      io.emit("proposal_updated", updatedProposal);
    }

    return res.status(200).json({
      success: true,
      message: "Proposal status updated successfully",
      data: updatedProposal,
    });
  } catch (error) {
    console.log("Update proposal status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update proposal status",
      error: error.message,
    });
  }
};
exports.getProposalAnalytics = async (req, res) => {
  try {
    const filter = getRoleFilter(req.user);

    const proposals = await Proposal.find(filter);

    const total = proposals.length;
    const approved = proposals.filter((p) => ["Approved", "Accepted"].includes(p.status)).length;
    const rejected = proposals.filter((p) => p.status === "Rejected").length;
    const pending = proposals.filter((p) => ["Draft", "Sent", "Viewed", "Revision Requested"].includes(p.status)).length;

    const revenue = proposals
      .filter((p) => ["Approved", "Accepted"].includes(p.status))
      .reduce((sum, p) => sum + Number(p.grandTotal || p.proposalValue || 0), 0);

    const totalValue = proposals.reduce(
      (sum, p) => sum + Number(p.grandTotal || p.proposalValue || 0),
      0
    );

    const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
        approved,
        rejected,
        pending,
        revenue,
        totalValue,
        conversionRate,
      },
    });
  } catch (error) {
    console.log("Proposal analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch proposal analytics",
      error: error.message,
    });
  }
};

exports.createProposalVersion = async (req, res) => {
  try {
    const oldProposal = await Proposal.findById(req.params.id).lean();

    if (!oldProposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    await Proposal.findByIdAndUpdate(req.params.id, {
      $set: { isLatestVersion: false },
      $push: {
        activityLogs: {
          title: "New Version Created",
          message: "Version " + (oldProposal.version + 1) + " created",
          type: "version",
          createdBy: getUserId(req.user),
        },
      },
    });

    const proposalNumber = await generateProposalNumber();

    const newVersionData = {
      ...oldProposal,
      _id: undefined,
      proposalNumber,
      status: "Draft",
      parentProposalId: oldProposal.parentProposalId || oldProposal._id,
      version: Number(oldProposal.version || 1) + 1,
      isLatestVersion: true,
      mailSent: false,
      sentAt: null,
      viewedAt: null,
      approvedAt: null,
      rejectedAt: null,
      customerCreated: false,
      createdBy: getUserId(req.user),
      activityLogs: [
        {
          title: "Proposal Version Created",
          message: "Created version " + (Number(oldProposal.version || 1) + 1),
          type: "version",
          createdBy: getUserId(req.user),
        },
      ],
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
      ...req.body,
    };

    const newProposal = await Proposal.create(normalizeProposalPayload(newVersionData));

    const populatedProposal = await populateProposal(
      Proposal.findById(newProposal._id)
    );

    const io = req.app.get("io");
    await syncProposalWithRelatedEntities({
      proposal: populatedProposal,
      userId: getUserId(req.user),
      io,
    });

    if (io) {
      io.emit("proposal_created", populatedProposal);
    }

    return res.status(201).json({
      success: true,
      message: "Proposal version created successfully",
      data: populatedProposal,
    });
  } catch (error) {
    console.log("Create proposal version error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create proposal version",
      error: error.message,
    });
  }
};

exports.addProposalAttachment = async (req, res) => {
  try {
    const { fileName, fileUrl, fileType } = req.body;

    if (!fileName && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "File name or file URL is required",
      });
    }

    const proposal = await populateProposal(
      Proposal.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            attachments: {
              fileName: fileName || "Proposal Attachment",
              fileUrl: fileUrl || "",
              fileType: fileType || "",
              uploadedAt: new Date(),
            },
            activityLogs: {
              title: "Attachment Added",
              message: fileName || "Proposal attachment added",
              type: "document",
              createdBy: getUserId(req.user),
            },
          },
        },
        { new: true, runValidators: true }
      )
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attachment added successfully",
      data: proposal,
    });
  } catch (error) {
    console.log("Add proposal attachment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add attachment",
      error: error.message,
    });
  }
};

exports.deleteProposalAttachment = async (req, res) => {
  try {
    const { id, attachmentIndex } = req.params;
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    const index = Number(attachmentIndex);

    if (Number.isNaN(index) || index < 0 || index >= proposal.attachments.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid attachment index",
      });
    }

    const removed = proposal.attachments[index];

    proposal.attachments.splice(index, 1);
    proposal.activityLogs.push({
      title: "Attachment Removed",
      message: removed?.fileName || "Proposal attachment removed",
      type: "document",
      createdBy: getUserId(req.user),
    });

    await proposal.save();

    const populatedProposal = await populateProposal(Proposal.findById(id));

    return res.status(200).json({
      success: true,
      message: "Attachment removed successfully",
      data: populatedProposal,
    });
  } catch (error) {
    console.log("Delete proposal attachment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete attachment",
      error: error.message,
    });
  }
};