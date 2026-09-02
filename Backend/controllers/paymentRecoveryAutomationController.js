/**
 * paymentRecoveryAutomationController.js
 * Express controllers for Phase 5E Cash-Flow & Payment Recovery API.
 */

const recoveryHandlers = require("../ai/commands/handlers/paymentRecoveryAutomationHandlers");
const paymentRecoveryEngine = require("../ai/automation/engines/PaymentRecoveryEngine");

exports.getFinanceSummary = async (req, res) => {
  try {
    const scanRes = await paymentRecoveryEngine.scan({ userId: req.user?._id });
    return res.status(200).json({ success: true, data: scanRes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAgingSummary = async (req, res) => {
  try {
    const result = await recoveryHandlers.getAgingSummary();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpectedCollections = async (req, res) => {
  try {
    const result = await recoveryHandlers.getExpectedCollections();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOverdueInvoices = async (req, res) => {
  try {
    const result = await recoveryHandlers.getOverdueInvoices();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCriticalCollections = async (req, res) => {
  try {
    const result = await recoveryHandlers.getCriticalCollections();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.triggerFinanceScan = async (req, res) => {
  try {
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await recoveryHandlers.scanDues({}, ctx);
    return res.status(200).json({ success: true, message: result.summary, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateReminderDraft = async (req, res) => {
  try {
    const { invoiceId, channel } = req.body;
    const result = await recoveryHandlers.generateReminder({ invoiceId, channel });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.recordPromiseToPay = async (req, res) => {
  try {
    const { invoiceId, promisedAmount, promisedDate, notes } = req.body;
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await recoveryHandlers.recordPromiseToPay({ invoiceId, promisedAmount, promisedDate, notes }, ctx);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.markDisputed = async (req, res) => {
  try {
    const { invoiceId, reason } = req.body;
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await recoveryHandlers.markDisputed({ invoiceId, reason }, ctx);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const ctx = {
      userId: req.user?._id || req.user?.id,
      userRole: req.user?.role || "Admin",
    };
    const result = await recoveryHandlers.resolveDispute({ invoiceId }, ctx);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.generatePaymentLink = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await recoveryHandlers.generatePaymentLink({ invoiceId });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
