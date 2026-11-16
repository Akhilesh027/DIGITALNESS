const Customer = require('../models/Customer');
const Notice = require('../models/RenewalNotice');
const policy = require('./renewalPolicy');
const delivery = require('./renewalDelivery');
const IST_DAY = date => new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 10);
async function enforce(customer, now = new Date()) {
  if (!policy.expiryDue(customer, now) || customer.accessControl?.isPortalLocked) return customer;
  const revision = customer.rechargePlan.renewalRevision || 0;
  const updated = await Customer.findOneAndUpdate({ _id: customer._id, 'rechargePlan.validUntil': customer.rechargePlan.validUntil, $or: [{ 'rechargePlan.renewalRevision': revision }, ...(revision === 0 ? [{ 'rechargePlan.renewalRevision': { $exists: false } }] : [])], 'accessControl.isPortalLocked': { $ne: true } }, { $set: {
    'accessControl.isPortalLocked': true, 'accessControl.holdType': 'EXPIRY',
    'accessControl.lockReason': 'Service expired after three-day grace period',
    'accessControl.lockMessage': 'Your service period and three-day grace period have ended. Portal access is on hold. Please contact Digitalness to renew. Internal service delivery is not paused by this hold.',
    'accessControl.lockedAt': now, 'accessControl.lockedBy': null,
    'accessControl.servicesSuspended': false,
  }, $push: { activityLogs: { title: 'Portal held after service expiry', message: 'Three-day IST grace period ended. Internal delivery remains active.', type: 'system', createdAt: now } } }, { returnDocument: 'after' });
  // A concurrent renewal/manual hold may have won the conditional update.
  return updated || await Customer.findById(customer._id);
}
async function reconcile(customer, now = new Date()) {
  const active = ['Scheduled', 'Failed'];
  if (!customer.rechargePlan?.validUntil) {
    await Notice.updateMany({ customerId: customer._id, status: { $in: active } }, { $set: { status: 'Cancelled', error: 'Expiry date removed' } });
    return;
  }
  const key = policy.renewalKey(customer);
  await Notice.updateMany({ customerId: customer._id, renewalKey: { $ne: key }, status: { $in: active } }, { $set: { status: 'Cancelled', error: 'Replaced by a new expiry date' } });
  for (const item of policy.remindersFor(customer.rechargePlan.validUntil)) {
    const missed = IST_DAY(item.dueAt) < IST_DAY(now);
    await Notice.updateOne({ customerId: customer._id, renewalKey: key, daysBefore: item.daysBefore, channel: item.channel }, { $setOnInsert: { ...item, status: missed ? 'Cancelled' : 'Scheduled', error: missed ? 'Reminder day passed before scheduling' : '' } }, { upsert: true });
  }
}
async function sendNotice(notice, now = new Date()) {
  const customer = await Customer.findById(notice.customerId);
  if (!customer?.rechargePlan?.validUntil || policy.renewalKey(customer) !== notice.renewalKey || policy.expiryDue(customer, now)) {
    await Notice.updateOne({ _id: notice._id }, { $set: { status: 'Cancelled', error: 'Expiry changed or grace period ended' } });
    return;
  }
  let providerId;
  try {
    providerId = await delivery.deliver(customer, notice);
  } catch (error) {
    const ambiguous = ['AbortError', 'TimeoutError'].includes(error.name) || /fetch failed|socket|timed? ?out|ECONNRESET/i.test(error.message);
    await Notice.updateOne({ _id: notice._id }, { $set: { status: ambiguous ? 'Unknown' : 'Failed', error: error.message } });
    return;
  }
  // If this write fails, leave Sending for later Unknown reconciliation. A
  // provider-accepted message must not become an automatically retryable failure.
  await Notice.updateOne({ _id: notice._id }, { $set: { status: 'Sent', providerId, sentAt: new Date(), error: '' } });
}
let running = false;
async function tick(now = new Date()) {
  if (running) return;
  running = true;
  try {
    // A process interrupted after submitting to a provider must not blindly resend.
    await Notice.updateMany({ status: 'Sending', attemptedAt: { $lt: new Date(now - 5 * 60000) } }, { $set: { status: 'Unknown', error: 'Delivery interrupted; check provider before retrying' } });
    for await (const customer of Customer.find({ 'rechargePlan.validUntil': { $ne: null } }).cursor()) {
      try { await enforce(customer, now); await reconcile(customer, now); }
      catch (error) { console.error('[Renewal customer]', String(customer._id), error.message); }
    }
    // Do not send a burst of outdated reminders after an outage.
    const today = new Date(`${IST_DAY(now)}T00:00:00+05:30`);
    await Notice.updateMany({ status: 'Scheduled', dueAt: { $lt: today } }, { $set: { status: 'Cancelled', error: 'Reminder day passed' } });
    for (let count = 0; count < 100; count++) {
      const notice = await Notice.findOneAndUpdate({ status: 'Scheduled', dueAt: { $lte: now } }, { $set: { status: 'Sending', attemptedAt: new Date() }, $inc: { attempts: 1 } }, { sort: { dueAt: 1 }, returnDocument: 'after' });
      if (!notice) break;
      await sendNotice(notice);
    }
  } finally { running = false; }
}
async function retry(customerId, noticeId) {
  const customer = await Customer.findById(customerId);
  if (!customer?.rechargePlan?.validUntil || policy.expiryDue(customer)) throw new Error('Renew the service before retrying this notice');
  const notice = await Notice.findOneAndUpdate({ _id: noticeId, customerId, renewalKey: policy.renewalKey(customer), status: 'Failed' }, { $set: { status: 'Scheduled', dueAt: new Date(), error: '' } }, { returnDocument: 'after' });
  if (!notice) throw new Error('Only failed notices for the current expiry can be retried');
  return notice;
}
module.exports = { enforce, reconcile, tick, retry, sendNotice };
