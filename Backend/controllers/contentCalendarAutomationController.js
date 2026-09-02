/**
 * contentCalendarAutomationController.js
 * Express controllers for Phase 5C Autonomous Content Intelligence & Calendar API.
 */

const calendarHandlers = require("../ai/commands/handlers/contentCalendarAutomationHandlers");

exports.getOpportunities = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const industry = req.query.industry || "GENERAL";
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;

    const result = await calendarHandlers.getOpportunities({ days, industry, month });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClientCalendar = async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await calendarHandlers.getClientCalendar({ customerId: clientId });
    return res.status(200).json({ success: true, count: result.count, data: result.calendars });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.previewCalendar = async (req, res) => {
  try {
    const { customerId, month, year, duration } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const result = await calendarHandlers.previewCalendar({ customerId, month, year, duration });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.generateCalendar = async (req, res) => {
  try {
    const { customerId, month, year, items } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required." });

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await calendarHandlers.generateCalendar({ customerId, month, year, items }, ctx);
    return res.status(200).json({ success: true, message: "Content calendar generated successfully.", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.batchApproveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemKeys } = req.body;

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await calendarHandlers.batchApprove({ calendarId: id, itemKeys }, ctx);
    return res.status(200).json({ success: true, message: `Approved ${result.approvedCount} items.`, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.regenerateCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, month, year } = req.body;

    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };

    const result = await calendarHandlers.regenerateCalendar({ customerId, month, year }, ctx);
    return res.status(200).json({ success: true, message: "Calendar regenerated successfully.", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
