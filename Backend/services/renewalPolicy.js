const DAY = 86400000;
const IST = 330 * 60000;
function expiryDay(value) {
  const day = String(value instanceof Date ? value.toISOString() : value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Choose a valid Service End Date');
  const time = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== day) throw new Error('Choose a valid Service End Date');
  return day;
}
function cutoffFor(value) {
  // Access through expiry day plus three full grace days, in IST.
  return new Date(Date.parse(`${expiryDay(value)}T00:00:00Z`) + 4 * DAY - IST);
}
function renewalKey(customer) {
  return `${expiryDay(customer.rechargePlan.validUntil)}:${customer.rechargePlan.renewalRevision || 0}`;
}
function remindersFor(value) {
  const start = Date.parse(`${expiryDay(value)}T00:00:00Z`);
  return [7, 3, 0].flatMap(daysBefore => ['WhatsApp', 'Email'].map(channel => ({ daysBefore, channel, dueAt: new Date(start - daysBefore * DAY + 9 * 3600000 - IST) })));
}
function expiryDue(customer, now = new Date()) {
  return Boolean(customer?.rechargePlan?.validUntil) && now >= cutoffFor(customer.rechargePlan.validUntil);
}
function expiryHold(customer) {
  return customer?.accessControl?.isPortalLocked && customer.accessControl.holdType === 'EXPIRY';
}
module.exports = { expiryDay, cutoffFor, renewalKey, remindersFor, expiryDue, expiryHold };
