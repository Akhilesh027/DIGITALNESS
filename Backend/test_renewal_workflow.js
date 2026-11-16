const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('./services/renewalPolicy');
const Customer = require('./models/Customer');
const Notice = require('./models/RenewalNotice');
const service = require('./services/renewalService');
const delivery = require('./services/renewalDelivery');
const customer = (holdType = 'NONE') => ({ _id: 'c1', name: 'Example', rechargePlan: { validUntil: new Date('2026-11-30T00:00:00Z'), renewalRevision: 1 }, accessControl: { isPortalLocked: holdType !== 'NONE', holdType } });

test('IST expiry includes the entire expiry day and three grace days across timezones', () => {
  const before = process.env.TZ;
  try {
    for (const timezone of ['UTC', 'Asia/Kolkata', 'America/Los_Angeles']) {
      process.env.TZ = timezone;
      assert.equal(policy.cutoffFor('2026-11-30').toISOString(), '2026-12-03T18:30:00.000Z');
      assert.equal(policy.expiryDue(customer(), new Date('2026-12-03T18:29:59.999Z')), false);
      assert.equal(policy.expiryDue(customer(), new Date('2026-12-03T18:30:00.000Z')), true);
    }
    assert.equal(policy.cutoffFor('2024-02-28').toISOString(), '2024-03-02T18:30:00.000Z');
    assert.throws(() => policy.expiryDay('2026-02-30'));
    assert.equal(policy.expiryDue({}), false);
  } finally { if (before === undefined) delete process.env.TZ; else process.env.TZ = before; }
});

test('six notices use both channels at 9AM IST on the selected days', () => {
  const notices = policy.remindersFor('2026-11-30');
  assert.equal(notices.length, 6);
  assert.deepEqual(notices.map(item => item.dueAt.toISOString()), ['2026-11-23T03:30:00.000Z', '2026-11-23T03:30:00.000Z', '2026-11-27T03:30:00.000Z', '2026-11-27T03:30:00.000Z', '2026-11-30T03:30:00.000Z', '2026-11-30T03:30:00.000Z']);
});

test('expiry holds only the portal, uses a conditional write, and preserves manual holds', async () => {
  const original = Customer.findOneAndUpdate;
  let writes = 0;
  Customer.findOneAndUpdate = async (filter, update) => {
    writes++;
    assert.equal(filter['rechargePlan.validUntil'].toISOString(), '2026-11-30T00:00:00.000Z');
    assert.equal(update.$set['accessControl.servicesSuspended'], false);
    assert.equal(update.$set['accessControl.holdType'], 'EXPIRY');
    return { ...customer('EXPIRY') };
  };
  try {
    await service.enforce(customer(), new Date('2026-12-03T18:29:59Z'));
    assert.equal(writes, 0);
    assert.equal((await service.enforce(customer(), new Date('2026-12-04T00:00:00Z'))).accessControl.holdType, 'EXPIRY');
    const manual = customer('MANUAL_HOLD');
    assert.equal(await service.enforce(manual, new Date('2026-12-04')), manual);
    assert.equal(writes, 1);
  } finally { Customer.findOneAndUpdate = original; }
});

test('expiry changes cancel pending old notices and create idempotent schedules; missing dates cancel notices', async () => {
  const originals = [Notice.updateMany, Notice.updateOne];
  const changes = [], inserts = [];
  Notice.updateMany = async (filter, update) => { changes.push({ filter, update }); };
  Notice.updateOne = async (filter, update, options) => { inserts.push({ filter, update, options }); };
  try {
    await service.reconcile(customer(), new Date('2026-11-25T04:00:00Z'));
    assert.equal(changes[0].filter.renewalKey.$ne, '2026-11-30:1');
    assert.equal(changes[0].update.$set.status, 'Cancelled');
    assert.equal(inserts.length, 6);
    assert.equal(inserts[0].update.$setOnInsert.status, 'Cancelled');
    assert.equal(inserts[2].update.$setOnInsert.status, 'Scheduled');
    assert.ok(inserts.every(item => item.options.upsert && item.update.$setOnInsert && item.filter.renewalKey));
    await service.reconcile({ _id: 'c1', rechargePlan: {} });
    assert.equal(changes[1].update.$set.error, 'Expiry date removed');
  } finally { [Notice.updateMany, Notice.updateOne] = originals; }
});

test('delivery reports provider acceptance, failures, uncertainty, and cancels stale notices', async () => {
  const originals = [Customer.findById, Notice.updateOne, delivery.deliver];
  const updates = [];
  const notice = { _id: 'n1', customerId: 'c1', renewalKey: '2026-11-30:1', channel: 'Email' };
  Customer.findById = async () => customer();
  Notice.updateOne = async (filter, update) => { updates.push(update.$set); };
  try {
    delivery.deliver = async () => 'provider-id';
    await service.sendNotice(notice, new Date('2026-11-23'));
    assert.equal(updates.pop().status, 'Sent');
    delivery.deliver = async () => { throw new Error('Sender not configured'); };
    await service.sendNotice(notice, new Date('2026-11-23'));
    assert.equal(updates.pop().status, 'Failed');
    delivery.deliver = async () => { throw new Error('fetch failed'); };
    await service.sendNotice(notice, new Date('2026-11-23'));
    assert.equal(updates.pop().status, 'Unknown');
    delivery.deliver = async () => { assert.fail('Stale notices must not be sent'); };
    await service.sendNotice({ ...notice, renewalKey: 'old-date' }, new Date('2026-11-23'));
    assert.equal(updates.pop().status, 'Cancelled');
  } finally { [Customer.findById, Notice.updateOne, delivery.deliver] = originals; }
});

test('retry is limited to failed notices belonging to the customer and current renewal', async () => {
  const originals = [Customer.findById, Notice.findOneAndUpdate];
  // Use a future expiry so this test remains independent of execution date.
  Customer.findById = async () => ({ ...customer(), rechargePlan: { validUntil: new Date('2099-11-30'), renewalRevision: 1 } });
  Notice.findOneAndUpdate = async filter => { assert.equal(filter.status, 'Failed'); assert.equal(filter.customerId, 'c1'); assert.equal(filter.renewalKey, '2099-11-30:1'); return { _id: 'n1' }; };
  try {
    assert.equal((await service.retry('c1', 'n1'))._id, 'n1');
    Notice.findOneAndUpdate = async () => null;
    await assert.rejects(service.retry('c1', 'other'), /Only failed/);
    Customer.findById = async () => ({ ...customer(), rechargePlan: { validUntil: new Date('2000-01-01') } });
    await assert.rejects(service.retry('c1', 'n1'), /Renew the service/);
  } finally { [Customer.findById, Notice.findOneAndUpdate] = originals; }
});

test('unconfigured WhatsApp sender fails instead of reporting a mock send', async () => {
  const saved = process.env.RENEWAL_WHATSAPP_ACCESS_TOKEN;
  delete process.env.RENEWAL_WHATSAPP_ACCESS_TOKEN;
  try { await assert.rejects(delivery.deliver(customer(), { channel: 'WhatsApp' }), /not configured/); }
  finally { if (saved !== undefined) process.env.RENEWAL_WHATSAPP_ACCESS_TOKEN = saved; }
});

test('renewal restores expiry holds only, preserves manual holds, and rejects invalid dates', async () => {
  const controller = require('./controllers/customerController');
  const AuditLog = require('./models/AuditLog');
  const originals = [Customer.findById, Customer.findOneAndUpdate, service.enforce, service.reconcile, AuditLog.create];
  let current, saved = 0;
  Customer.findById = async () => current;
  Customer.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter['accessControl.holdType'], 'EXPIRY');
    return current.accessControl.holdType === 'EXPIRY' ? { accessControl: { isPortalLocked: false, holdType: 'NONE', servicesSuspended: false } } : null;
  };
  service.enforce = async value => value;
  service.reconcile = async () => {};
  AuditLog.create = async () => {};
  const invoke = async validUntil => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await controller.rechargeCustomerPlan({ body: { validUntil }, params: { id: 'c1' }, user: { _id: 'u1', role: 'Admin' }, app: { get: () => null } }, res);
    return res;
  };
  try {
    current = { ...customer('EXPIRY'), save: async () => { saved++; } };
    assert.equal((await invoke('2099-12-31')).body.data.accessControl.isPortalLocked, false);
    assert.equal(current.rechargePlan.renewalRevision, 2);
    current = { ...customer('MANUAL_HOLD'), save: async () => { saved++; } };
    assert.equal((await invoke('2099-12-31')).body.data.accessControl.holdType, 'MANUAL_HOLD');
    assert.equal((await invoke('2099-02-30')).code, 400);
    assert.equal((await invoke('')).code, 400);
    assert.equal(saved, 2);
  } finally { [Customer.findById, Customer.findOneAndUpdate, service.enforce, service.reconcile, AuditLog.create] = originals; }
});

test('already-signed-in clients are blocked on protected requests while status remains available; staff remain active', async () => {
  const Client = require('./models/Client');
  const User = require('./models/User');
  const jwt = require('jsonwebtoken');
  const { protect } = require('./middleware/authMiddleware');
  const originals = [Client.findById, User.findById, Customer.findById, service.enforce];
  const client = { _id: 'cl1', customerId: 'c1', name: 'Example' };
  Client.findById = () => ({ select: async () => client });
  User.findById = () => ({ select: async () => ({ _id: 'u1', role: 'Graphic Designer' }) });
  Customer.findById = async () => customer('EXPIRY');
  service.enforce = async value => value;
  const invoke = async (path, type) => {
    const token = jwt.sign({ id: type === 'client' ? 'cl1' : 'u1', type }, process.env.JWT_SECRET || 'digitalnesscrmsecret');
    const req = { headers: { authorization: `Bearer ${token}` }, originalUrl: path, method: 'GET' };
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    let allowed = false;
    await protect(req, res, () => { allowed = true; });
    return { allowed, ...res };
  };
  try {
    assert.equal((await invoke('/api/works', 'client')).code, 423);
    assert.equal((await invoke('/api/reports/customer/c1/daily', 'client')).code, 423);
    assert.equal((await invoke('/api/clients/me', 'client')).allowed, true);
    assert.equal((await invoke('/api/customers/c1/recharge-status', 'client')).allowed, true);
    assert.equal((await invoke('/api/customers/other/recharge-status', 'client')).code, 423);
    assert.equal((await invoke('/api/service-workspace/records', 'employee')).allowed, true);
    assert.equal((await invoke('/api/works', 'employee')).code, 403);
  } finally { [Client.findById, User.findById, Customer.findById, service.enforce] = originals; }
});
