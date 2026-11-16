const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const p = require('./services/servicePermissions');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Campaign = require('./models/AdCampaign');
const Content = require('./models/ContentItem');
const Work = require('./models/Work');
const Audit = require('./models/AuditLog');
const auth = require('./middleware/authMiddleware');
const realProtect = auth.protect;
const A = 'a'.repeat(24), B = 'b'.repeat(24), E = 'e'.repeat(24), G = '1'.repeat(24), M = '2'.repeat(24), O = '3'.repeat(24), W = '4'.repeat(24), S = '5'.repeat(24);
const stamp = '2026-11-14T09:00:00.000Z';
const employee = actions => ({ _id: E, name: 'Google employee', role: 'Performance Marketer', status: 'Active', serviceGrants: [{ customerId: A, service: 'Google Ads', actions }], accessVersion: 0 });
let actor, app, campaigns, works, content, storedUser, originals = [];
function match(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some(part => match(row, part));
    const actual = row[key];
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('$in' in value) return value.$in.map(String).includes(String(actual));
      if ('$nin' in value) return !value.$nin.map(String).includes(String(actual));
      if ('$exists' in value) return (actual !== undefined) === value.$exists;
    }
    if (value instanceof Date) return new Date(actual).getTime() === value.getTime();
    return String(actual) === String(value);
  });
}
function chain(initial) {
  let value = structuredClone(initial);
  return { select(fields) {
    if (fields && !fields.startsWith('-')) {
      const project = row => row && Object.fromEntries(['_id', ...fields.split(' ')].filter(key => key in row).map(key => [key, row[key]]));
      value = Array.isArray(value) ? value.map(project) : project(value);
    }
    return this;
  }, sort() { return this; }, limit(count) { if (Array.isArray(value)) value = value.slice(0, count); return this; }, lean() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } };
}
function stub(object, key, replacement) { const original = object[key]; originals.push(() => { object[key] = original; }); object[key] = replacement; }
const clients = [{ _id: A, name: 'Assigned client', branchId: 'BR1' }, { _id: B, name: 'Other client', branchId: 'BR2' }];
before(async () => {
  stub(auth, 'protect', (req, res, next) => {
    if (!actor) return res.status(401).json({ message: 'Authentication required' });
    req.user = actor; p.employeeBoundary(req, res, next);
  });
  stub(Customer, 'find', filter => chain(clients.filter(row => match(row, filter))));
  stub(Customer, 'findOne', filter => chain(clients.find(row => match(row, filter)) || null));
  stub(Customer, 'countDocuments', async filter => clients.filter(row => match(row, filter)).length);
  stub(User, 'findById', () => chain(storedUser));
  stub(User, 'findOneAndUpdate', (filter, update) => {
    if (!match(storedUser, filter)) return chain(null);
    Object.assign(storedUser, update.$set); storedUser.accessVersion = (storedUser.accessVersion || 0) + 1; return chain(storedUser);
  });
  for (const [model, data] of [[Campaign, () => campaigns], [Work, () => works], [Content, () => content]]) {
    stub(model, 'find', filter => chain(data().filter(row => match(row, filter))));
    stub(model, 'findOne', filter => chain(data().find(row => match(row, filter)) || null));
    stub(model, 'findOneAndUpdate', (filter, update) => {
      const row = data().find(row => match(row, filter));
      if (!row) return chain(null);
      Object.assign(row, update.$set);
      for (const [key, amount] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + amount;
      row.updatedAt = new Date(new Date(row.updatedAt).getTime() + 1000).toISOString();
      return chain(row);
    });
  }
  stub(Audit, 'create', async () => ({}));
  app = express();
  app.use('/api/service-workspace', require('./routes/serviceWorkspaceRoutes'));
  app.use('/api/service-access', require('./routes/serviceAccessRoutes'));
  app.get(['/api/ads/campaigns', '/api/payments', '/api/reporting/agency'], auth.protect, (req, res) => res.json({ leaked: true }));
 });
after(() => { originals.reverse().forEach(restore => restore()); });
function reset(actions = ['view']) {
  actor = employee(actions); storedUser = { ...employee([]), accessVersion: 0 };
  campaigns = [{ _id: G, customerId: A, platform: 'Google', campaignName: '=unsafe formula', status: 'Draft', budget: { amount: 500 }, updatedAt: stamp, version: 0, privateToken: 'never-export' }, { _id: M, customerId: A, platform: 'Meta', campaignName: 'Hidden Meta', status: 'Draft', updatedAt: stamp }, { _id: O, customerId: B, platform: 'Google', campaignName: 'Hidden other client', status: 'Draft', updatedAt: stamp }];
  works = [{ _id: W, customer: A, workType: 'Google Ads', title: 'Assigned Google work', status: 'In Progress', updatedAt: stamp }, { _id: S, customer: A, workType: 'Social Media', title: 'Hidden social work', updatedAt: stamp }];
  content = [{ _id: S, customerId: A, contentType: 'Poster', title: 'Social post', status: 'Draft', approvalStatus: 'Not Submitted', updatedAt: stamp }];
}
async function call(path, method = 'GET', body) {
  // Exercise the real Express routers without sockets or external services.
  const http = require('node:http');
  const req = new http.IncomingMessage(new (require('node:net').Socket)());
  req.method = method; req.url = path; req.headers = {}; req.body = body || {};
  const res = new http.ServerResponse(req);
  return new Promise((resolve, reject) => {
    res.end = data => {
      try { resolve({ status: res.statusCode, body: String(res.getHeader('content-type')).includes('json') ? JSON.parse(String(data)) : String(data || '') }); }
      catch (error) { reject(error); }
      return res;
    };
    app.handle(req, res, error => error ? reject(error) : resolve({ status: 404, body: '' }));
  });
}
const ctx = { customerId: A, service: 'Google Ads' };
const query = object => new URLSearchParams(object).toString();

test('grant validation requires View, known actions, valid client IDs, and unique client/service pairs', () => {
  for (const grants of [[{ ...ctx, actions: ['edit'] }], [{ ...ctx, actions: ['view', 'admin'] }], [{ ...ctx, service: 'unknown', actions: ['view'] }], [{ ...ctx, actions: ['view'] }, { ...ctx, actions: ['view'] }]]) assert.throws(() => p.validateGrants(grants));
  assert.equal(p.validateGrants([{ ...ctx, actions: ['view', 'edit'] }])[0].service, 'Google Ads');
  assert.deepEqual(p.validateGrants([]), []);
});

test('Google-only assignment lists no Meta, social, other-client, or private fields', async () => {
  reset(); const result = await call(`/api/service-workspace/records?${query(ctx)}`);
  assert.equal(result.status, 200); assert.equal(result.body.items.length, 2);
  assert.deepEqual(result.body.items.map(row => row._id).sort(), [G, W].sort());
  assert.ok(!JSON.stringify(result.body).includes('never-export'));
  assert.equal((await call(`/api/service-workspace/records?${query({ ...ctx, customerId: B })}`)).status, 403);
  assert.equal((await call(`/api/service-workspace/records?${query({ ...ctx, service: 'Meta Ads' })}`)).status, 403);
});

test('view-only employees cannot edit, approve, publish or export; legacy/direct billing APIs are denied', async () => {
  reset();
  for (const path of [`/api/service-workspace/records/campaign/${G}/approve`, `/api/service-workspace/records/campaign/${G}/publish`]) assert.equal((await call(path, 'POST', { ...ctx, version: stamp })).status, 403);
  assert.equal((await call(`/api/service-workspace/records/campaign/${G}`, 'PATCH', { ...ctx, version: stamp, changes: { campaignName: 'Changed' } })).status, 403);
  assert.equal((await call(`/api/service-workspace/export?${query(ctx)}`)).status, 403);
  for (const path of ['/api/ads/campaigns', '/api/payments', '/api/reporting/agency']) assert.equal((await call(path)).status, 403);
});

test('edit remains within assigned resource identity and cannot forge approvals or overwrite stale records', async () => {
  reset(['view', 'edit']);
  assert.equal((await call(`/api/service-workspace/records/campaign/${M}`, 'PATCH', { ...ctx, version: stamp, changes: { campaignName: 'Wrong service' } })).status, 404);
  assert.equal((await call(`/api/service-workspace/records/campaign/${G}`, 'PATCH', { ...ctx, version: stamp, changes: { status: 'Approved' } })).status, 400);
  const result = await call(`/api/service-workspace/records/campaign/${G}`, 'PATCH', { ...ctx, version: stamp, changes: { campaignName: 'New name', dailyBudget: '750' } });
  assert.equal(result.status, 200); assert.equal(result.body.item.status, 'Pending Approval'); assert.equal(result.body.item.budget.amount, 750);
  assert.equal((await call(`/api/service-workspace/records/campaign/${G}`, 'PATCH', { ...ctx, version: stamp, changes: { campaignName: 'Stale' } })).status, 409);
});

test('approve and export are separate grants; exports are scoped and formula-safe', async () => {
  reset(['view', 'approve', 'export']);
  assert.equal((await call(`/api/service-workspace/records/campaign/${G}/approve`, 'POST', { ...ctx, version: stamp })).status, 200);
  assert.equal(campaigns[0].status, 'Approved');
  const result = await call(`/api/service-workspace/export?${query(ctx)}`);
  assert.equal(result.status, 200); assert.ok(result.body.includes("'=unsafe formula"));
  assert.ok(!result.body.includes('Hidden Meta')); assert.ok(!result.body.includes('other client')); assert.ok(!result.body.includes('never-export'));
});

test('publishing cannot bypass approval or run the unsupported Google execution path', async () => {
  reset(['view', 'publish']);
  assert.equal((await call(`/api/service-workspace/records/campaign/${G}/publish`, 'POST', { ...ctx, version: stamp })).status, 501);
  actor.serviceGrants = [{ customerId: A, service: 'Social Media', actions: ['view', 'publish'] }];
  assert.equal((await call(`/api/service-workspace/records/content/${S}/publish`, 'POST', { customerId: A, service: 'Social Media', version: stamp, scheduledFor: '2099-01-01' })).status, 409);
});

test('only admins can change grants; saving zero assignments revokes access and stale admin saves conflict', async () => {
  reset();
  assert.equal((await call(`/api/service-access/employees/${E}`, 'PUT', { version: 0, grants: [] })).status, 403);
  actor = { _id: 'f'.repeat(24), role: 'Admin', status: 'Active' };
  assert.equal((await call(`/api/service-access/employees/${E}`, 'PUT', { version: 0, grants: [{ ...ctx, actions: ['view'] }] })).status, 200);
  assert.equal((await call(`/api/service-access/employees/${E}`, 'PUT', { version: 0, grants: [] })).status, 409);
  assert.equal((await call(`/api/service-access/employees/${E}`, 'PUT', { version: 1, grants: [] })).status, 200);
  actor = storedUser;
  assert.equal((await call(`/api/service-workspace/records?${query(ctx)}`)).status, 403);
});

test('unauthenticated calls fail before reading any service data', async () => {
  reset(); actor = null;
  assert.equal((await call(`/api/service-workspace/records?${query(ctx)}`)).status, 401);
});

test('existing tokens read current grants from the database and cannot invent an admin role', async () => {
  reset(); storedUser = employee(['view']);
  const token = require('jsonwebtoken').sign({ id: E, role: 'Admin' }, process.env.JWT_SECRET || 'digitalnesscrmsecret');
  const invoke = async () => {
    const req = { headers: { authorization: `Bearer ${token}` }, method: 'GET', originalUrl: '/api/service-workspace/records' };
    const res = { status(code) { this.code = code; return this; }, json() {} };
    let allowed = false;
    await realProtect(req, res, () => { allowed = true; });
    return { req, allowed, code: res.code };
  };
  let result = await invoke();
  assert.equal(result.req.user.role, 'Performance Marketer');
  assert.equal(p.permitted(result.req.user, A, 'Google Ads', 'view'), true);
  storedUser.serviceGrants = [];
  result = await invoke(); assert.equal(p.permitted(result.req.user, A, 'Google Ads', 'view'), false);
  storedUser.status = 'Inactive'; assert.equal((await invoke()).code, 403);
});

test('self-profile changes cannot grant roles, branch access, or service permissions', async () => {
  reset(); storedUser = employee(['view']);
  const { updateUser } = require('./controllers/authController');
  for (const body of [{ role: 'Admin' }, { branchId: 'BR2' }, { status: 'Active' }, { serviceGrants: [{ ...ctx, actions: ['view', 'publish'] }] }, { 'serviceGrants.0.actions': ['view', 'publish'] }]) {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.body = data; } };
    await updateUser({ params: { id: E }, user: employee(['view']), body }, res);
    assert.ok([400, 403].includes(res.code));
    assert.equal(storedUser.role, 'Performance Marketer'); assert.equal(storedUser.serviceGrants[0].actions.length, 1);
  }
});

test('employees cannot subscribe to mixed-service customer event rooms', async () => {
  reset(); storedUser = employee(['view']);
  const sockets = require('./middleware/socketAccess');
  const token = require('jsonwebtoken').sign({ id: E }, process.env.JWT_SECRET || 'digitalnesscrmsecret');
  let error;
  await sockets.authenticateSocket({ handshake: { auth: { token } }, data: {} }, result => { error = result; });
  assert.ok(error instanceof Error);
  let joined = false;
  assert.equal(await sockets.joinCustomer({ data: { userId: E }, join: async () => { joined = true; } }, A), false);
  assert.equal(joined, false);
});

test('delegated scheduling cannot auto-approve content or an attached creative', async () => {
  reset();
  const originalFind = Content.findById;
  const Creative = require('./models/CreativeProject');
  const originalCreative = Creative.findById;
  let saved = false;
  try {
    Content.findById = async () => ({ _id: S, customerId: A, approvalStatus: 'Not Submitted', save: async () => { saved = true; } });
    const scheduler = require('./services/schedulerService');
    await assert.rejects(scheduler.scheduleContentPublish({ contentItemId: S, scheduledFor: '2099-01-01', user: employee(['view', 'publish']), requireApproved: true, expectedUpdatedAt: stamp }), /approver/);
    assert.equal(saved, false);
    Content.findById = async () => ({ _id: S, customerId: A, approvalStatus: 'Approved', creativeProjectId: W });
    Creative.findById = () => chain({ customerId: A, approvalStatus: 'Pending' });
    await assert.rejects(scheduler.scheduleContentPublish({ contentItemId: S, scheduledFor: '2099-01-01', user: employee(['view', 'publish']), requireApproved: true, expectedUpdatedAt: stamp }), /creative must be approved/);
  } finally { Content.findById = originalFind; Creative.findById = originalCreative; }
});

test('grant fields serialize in the user schema and reject unknown service actions', async () => {
  const user = new User({ name: 'Example', email: 'example@example.test', password: 'test-password', phone: '919000000000', role: 'Performance Marketer', serviceGrants: [{ ...ctx, actions: ['view', 'edit'] }] });
  await user.validate();
  const stored = user.toObject();
  assert.equal(String(stored.serviceGrants[0].customerId), A);
  assert.deepEqual(stored.serviceGrants[0].actions, ['view', 'edit']);
  assert.equal(stored.accessVersion, 0);
  user.serviceGrants[0].actions.push('manage-users');
  await assert.rejects(user.validate());
});

test('management workspace requests retain their branch boundary', async () => {
  reset(); actor = { _id: E, role: 'Branch Manager', status: 'Active', branchId: 'BR1' };
  assert.equal((await call(`/api/service-workspace/records?${query(ctx)}`)).status, 200);
  assert.equal((await call(`/api/service-workspace/records?${query({ ...ctx, customerId: B })}`)).status, 404);
});
