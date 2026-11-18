const error = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
function dayBounds(key = dayKey()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw error('Choose a valid date');
  const start = new Date(`${key}T00:00:00+05:30`);
  if (!Number.isFinite(start.getTime()) || dayKey(start) !== key) throw error('Choose a valid date');
  return { start, end: new Date(start.getTime() + 86400000) };
}
function totals(record, now = new Date()) {
  if (!record.loginTime) return { breakMinutes: 0, totalHours: 0 };
  const end = new Date(record.logoutTime || now).getTime();
  const start = new Date(record.loginTime).getTime();
  const breakMs = record.correctedBreakMinutes != null ? record.correctedBreakMinutes * 60000 : (record.breaks || []).reduce((sum, entry) => sum + Math.max(0, Math.min(end, new Date(entry.endedAt || now).getTime()) - Math.max(start, new Date(entry.startedAt).getTime())), 0);
  return { breakMinutes: Math.round(breakMs / 60000 * 100) / 100, totalHours: Math.round(Math.max(0, end - start - breakMs) / 3600000 * 10000) / 10000 };
}
function state(record, now = new Date()) {
  if (!record) return 'Not checked in';
  if (record.mode !== 'Manual') return 'Legacy record';
  if (!record.isOpen) return 'Checked out';
  if (new Date(now) - new Date(record.loginTime) > 18 * 3600000) return 'Missed checkout';
  return record.breaks?.some(entry => !entry.endedAt) ? 'On break' : 'Working';
}
function snapshot(record) {
  if (!record) return null;
  return { loginTime: record.loginTime, logoutTime: record.logoutTime, totalHours: record.totalHours, status: record.status, mode: record.mode, breaks: record.breaks || [], correctedBreakMinutes: record.correctedBreakMinutes, revision: record.revision || 0 };
}
function transition(record, action, now = new Date()) {
  if (record.mode !== 'Manual' || !record.isOpen) throw error('Check in before using attendance controls', 409);
  if (new Date(now) - new Date(record.loginTime) > 24 * 3600000) throw error('This session is over 24 hours old. Request a correction for the missed checkout.', 409);
  const breaks = (record.breaks || []).map(entry => ({ startedAt: entry.startedAt, endedAt: entry.endedAt || null }));
  const open = breaks.find(entry => !entry.endedAt);
  if (action === 'break-start') {
    if (open) throw error('A break is already in progress', 409);
    breaks.push({ startedAt: now, endedAt: null });
  } else if (action === 'break-end') {
    if (!open) throw error('No break is in progress', 409);
    open.endedAt = now;
  } else if (action === 'check-out') {
    if (open) open.endedAt = now;
  } else throw error('Invalid attendance action');
  const updates = { breaks, ...(action === 'check-out' ? { logoutTime: now, isOpen: false } : {}) };
  return { ...updates, ...totals({ ...record, ...updates }, now) };
}
function correction(body, now = new Date()) {
  const { dayKey: key, reason } = body;
  dayBounds(key);
  const proposedIn = new Date(body.proposedIn), proposedOut = new Date(body.proposedOut);
  const breakMinutes = Number(body.breakMinutes);
  if (![proposedIn, proposedOut].every(date => Number.isFinite(date.getTime())) || proposedOut <= proposedIn || proposedOut > now || dayKey(proposedIn) !== key || proposedOut - proposedIn > 24 * 3600000) throw error('Use a completed shift of up to 24 hours, starting on the selected date and ending in the past');
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0 || breakMinutes * 60000 >= proposedOut - proposedIn) throw error('Break time must be less than the shift duration');
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 2000) throw error('Explain the correction in 1–2,000 characters');
  return { dayKey: key, proposedIn, proposedOut, breakMinutes, reason: reason.trim() };
}
module.exports = { error, dayKey, dayBounds, totals, state, snapshot, transition, correction };
