/**
 * executiveBriefingAutomationController.js
 * Express controllers for Phase 5F Executive Morning Briefing & EOD Intelligence API.
 */

const briefingHandlers = require("../ai/commands/handlers/briefingAutomationHandlers");

exports.getLiveBriefing = async (req, res) => {
  try {
    const result = await briefingHandlers.getCurrentBrief({}, { userId: req.user?._id });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMorningBrief = async (req, res) => {
  try {
    const date = req.query.date;
    const result = await briefingHandlers.getMorningBrief({ date }, { userId: req.user?._id });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEodWrap = async (req, res) => {
  try {
    const date = req.query.date;
    const result = await briefingHandlers.getEodWrap({ date }, { userId: req.user?._id });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPriorities = async (req, res) => {
  try {
    const result = await briefingHandlers.getPriorities({}, { userId: req.user?._id });
    return res.status(200).json({ success: true, count: result.count, data: result.priorities });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAgencyHealth = async (req, res) => {
  try {
    const result = await briefingHandlers.getAgencyHealth({}, { userId: req.user?._id });
    return res.status(200).json({ success: true, data: result.agencyHealth });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBriefingHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 14, 50);
    const result = await briefingHandlers.getHistory({ limit });
    return res.status(200).json({ success: true, count: result.count, data: result.history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateMorningBrief = async (req, res) => {
  try {
    const { date } = req.body;
    const result = await briefingHandlers.generateMorning({ date }, { userId: req.user?._id });
    return res.status(200).json({ success: true, message: "Morning Briefing snapshot generated.", data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateEodWrap = async (req, res) => {
  try {
    const { date } = req.body;
    const result = await briefingHandlers.generateEod({ date }, { userId: req.user?._id });
    return res.status(200).json({ success: true, message: "EOD Wrap-Up snapshot generated.", data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
