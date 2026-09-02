/**
 * contentCalendarAutomationHandlers.js
 * Deterministic command handlers for Phase 5C Autonomous Content Intelligence & Calendar Engine.
 */

const contentCalendarEngine = require("../../automation/engines/ContentCalendarEngine");
const festivalService = require("../../automation/services/festivalService");
const contentOpportunityService = require("../../automation/services/contentOpportunityService");
const ContentCalendar = require("../../../models/ContentCalendar");

exports.previewCalendar = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId || (params.customer ? (params.customer._id || params.customer) : null);
  if (!customerId) throw new Error("Client ID (customerId) is required to preview content calendar.");

  const result = await contentCalendarEngine.previewCalendar({
    clientId: customerId,
    month: params.month ? Number(params.month) : null,
    year: params.year ? Number(params.year) : null,
    duration: params.duration ? Number(params.duration) : 30,
  });

  return result;
};

exports.generateCalendar = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId || (params.customer ? (params.customer._id || params.customer) : null);
  if (!customerId) throw new Error("Client ID (customerId) is required to generate content calendar.");

  const result = await contentCalendarEngine.generateCalendar({
    clientId: customerId,
    month: params.month ? Number(params.month) : null,
    year: params.year ? Number(params.year) : null,
    items: params.items || [],
    userId: ctx.userId,
  });

  return result;
};

exports.regenerateCalendar = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId;
  if (!customerId) throw new Error("Client ID is required to regenerate calendar.");

  const targetMonth = params.month ? Number(params.month) : new Date().getMonth() + 1;
  const targetYear = params.year ? Number(params.year) : new Date().getFullYear();
  const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  await ContentCalendar.deleteOne({ clientId: customerId, "period.formatted": periodStr });

  const result = await contentCalendarEngine.generateCalendar({
    clientId: customerId,
    month: targetMonth,
    year: targetYear,
    userId: ctx.userId,
  });

  return result;
};

exports.batchApprove = async (params = {}, ctx = {}) => {
  const calendarId = params.calendarId;
  if (!calendarId) throw new Error("calendarId is required to batch approve items.");

  const result = await contentCalendarEngine.batchApprove({
    calendarId,
    itemKeys: params.itemKeys || [],
    userId: ctx.userId,
  });

  return result;
};

exports.approveItem = async (params = {}, ctx = {}) => {
  const { calendarId, itemKey } = params;
  if (!calendarId || !itemKey) throw new Error("calendarId and itemKey are required to approve an item.");

  const result = await contentCalendarEngine.batchApprove({
    calendarId,
    itemKeys: [itemKey],
    userId: ctx.userId,
  });

  return result;
};

exports.rejectItem = async (params = {}, ctx = {}) => {
  const { calendarId, itemKey } = params;
  if (!calendarId || !itemKey) throw new Error("calendarId and itemKey are required.");

  const calendar = await ContentCalendar.findById(calendarId);
  if (!calendar) throw new Error("Calendar not found.");

  const item = calendar.items.find((i) => i.itemKey === itemKey);
  if (item) {
    item.status = "REJECTED";
    await calendar.save();
  }

  return { success: true, message: `Item ${itemKey} rejected.` };
};

exports.getOpportunities = async (params = {}, ctx = {}) => {
  const days = params.days ? Number(params.days) : 30;
  const festivals = festivalService.getUpcomingFestivals(days);
  const seasonal = contentOpportunityService.getOpportunitiesForClient({
    industry: params.industry || "GENERAL",
    month: params.month || new Date().getMonth() + 1,
  });

  return {
    festivalsCount: festivals.length,
    seasonalCount: seasonal.length,
    festivals,
    seasonal,
  };
};

exports.getClientCalendar = async (params = {}, ctx = {}) => {
  const customerId = params.customerId || params.clientId;
  if (!customerId) throw new Error("customerId is required.");

  const calendars = await ContentCalendar.find({ clientId: customerId }).sort({ "period.formatted": -1 }).lean();
  return {
    count: calendars.length,
    calendars,
  };
};
