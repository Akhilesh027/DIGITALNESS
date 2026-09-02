const Ticket = require("../models/Ticket");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");

// ================= CREATE =================
const createTicket = async (req, res) => {
  try {
    const {
      customer,
      subject,
      description,
      category,
      priority,
      assignedTo,
    } = req.body;

    const customerData = await Customer.findById(customer);

    if (!customerData) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const count = await Ticket.countDocuments();

    const ticket = await Ticket.create({
      ticketId: `TKT${1000 + count + 1}`,
      customer,
      subject,
      description,
      category,
      priority,
      assignedTo,
      branchId: customerData.branchId,
      createdBy: req.user._id,
    });

    // ================= CREATE NOTIFICATION =================
    if (assignedTo) {
      await Notification.create({
        title: "New Ticket Assigned",
        message: `Ticket ${ticket.ticketId} assigned to you`,
        type: "task",

        moduleId: ticket._id,
        moduleModel: "Customer",

        recipient: assignedTo,
        createdBy: req.user._id,

        link: `/tickets`,
      });
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("customer")
      .populate("assignedTo", "name role");

    res.status(201).json({
      success: true,
      ticket: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET =================
const getTickets = async (req, res) => {
  try {
    let filter = {};

    // ADMIN
    if (req.user.role === "Admin") {
      filter = {};
    }

    // MANAGER
    else if (req.user.role === "Operational Manager") {
      filter.branchId = req.user.branchId;
    }

    // EMPLOYEE
    else {
      filter.assignedTo = req.user._id;
    }

    const tickets = await Ticket.find(filter)
      .populate("customer")
      .populate("assignedTo", "name role")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE =================
const updateTicket = async (req, res) => {
  try {
    const oldTicket = await Ticket.findById(req.params.id);

    if (!oldTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const { status, assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        assignedTo,
      },
      { new: true }
    )
      .populate("customer")
      .populate("assignedTo", "name role");

    // ================= STATUS NOTIFICATION =================
    if (status && status !== oldTicket.status) {
      await Notification.create({
        title: "Ticket Status Updated",
        message: `Ticket ${ticket.ticketId} status changed to ${status}`,
        type: "task",

        moduleId: ticket._id,
        moduleModel: "Customer",

        recipient: oldTicket.createdBy,
        createdBy: req.user._id,

        link: `/tickets`,
      });
    }

    // ================= REASSIGN NOTIFICATION =================
    if (
      assignedTo &&
      oldTicket.assignedTo?.toString() !== assignedTo
    ) {
      await Notification.create({
        title: "Ticket Assigned",
        message: `Ticket ${ticket.ticketId} assigned to you`,
        type: "task",

        moduleId: ticket._id,
        moduleModel: "Customer",

        recipient: assignedTo,
        createdBy: req.user._id,

        link: `/tickets`,
      });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE =================
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    // ================= DELETE NOTIFICATION =================
    await Notification.create({
      title: "Ticket Deleted",
      message: `Ticket ${ticket.ticketId} deleted`,
      type: "system",

      moduleId: ticket._id,
      moduleModel: "Customer",

      recipient: ticket.createdBy,
      createdBy: req.user._id,

      link: `/tickets`,
    });

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
};