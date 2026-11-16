const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { actionScope, businessDayBounds } = require('./services/dashboardActionPolicy');

test('access fails closed for clients, unknown identities and managers without branches', () => {
  for (const user of [null, { role: 'Admin' }, { _id: 'c', role: 'Client' }, { _id: 'm', role: 'Operational Manager' }]) assert.equal(actionScope(user).denied, true);
  assert.deepEqual(actionScope({ _id: 'u', role: 'Designer' }), { kind: 'assigned', userId: 'u' });
});
test('India business day changes at 18:30 UTC, including year rollover', () => {
  assert.equal(businessDayBounds(new Date('2026-12-31T18:29:59Z')).start.toISOString(), '2026-12-30T18:30:00.000Z');
  const { start, end } = businessDayBounds(new Date('2026-12-31T18:30:00Z'));
  assert.equal(start.toISOString(), '2026-12-31T18:30:00.000Z');
  assert.equal(end - start, 86400000);
});
function harness(failModel) {
  let handler; const calls = [];
  const router = { use() {}, get(path, fn) { handler = fn; } };
  const models = {};
  for (const name of ['Customer', 'Lead', 'Work', 'Invoice', 'ApprovalRequest', 'WorkApproval']) {
    models[name] = {
      find(filter) {
        calls.push({ name, filter });
        const chain = { sort() { return chain; }, limit() { return chain; }, populate() { return chain; }, distinct: async () => ['branch-customer'], lean: async () => {
          if (failModel === name) throw new Error('offline');
          return [];
        } }; return chain;
      }, countDocuments: async () => 0,
    };
  }
  vm.runInNewContext(fs.readFileSync(require.resolve('./routes/dashboardRoutes'), 'utf8'), {
    require: id => id === 'express' ? { Router: () => router } : id.includes('authMiddleware') ? { protect() {} }
      : id.includes('dashboardActionPolicy') ? { actionScope, businessDayBounds } : models[id.split('/').pop()],
    module: { exports: {} }, console: { error() {} }, Date,
  });
  return { calls, async run(user, client) {
    let status = 200, body;
    const res = { status(code) { status = code; return this; }, json(value) { body = value; return this; } };
    await handler({ user, client }, res); return { status, body };
  } };
}
test('employees see assigned queues and no financial records', async () => {
  const h = harness(); const { body } = await h.run({ _id: 'employee', role: 'Designer' });
  assert.equal(body.categories.some(c => c.key === 'invoices'), false);
  for (const call of h.calls) assert.equal(call.filter.assignedTo, 'employee');
  assert.equal(body.categories[0].total, 0);
  assert.equal(body.categories[0].error, undefined);
});
test('branch managers are scoped to their branch customers and leads', async () => {
  const h = harness(); await h.run({ _id: 'manager', role: 'Operational Manager', branchId: 'BR002' });
  assert.equal(h.calls.find(c => c.name === 'Customer').filter.branchId, 'BR002');
  assert.equal(h.calls.find(c => c.name === 'Lead').filter.branchId, 'BR002');
  for (const call of h.calls.filter(c => !['Customer', 'Lead'].includes(c.name))) assert.deepEqual(Array.from(call.filter.customer.$in), ['branch-customer']);
});
test('one failed source is unavailable while other zero counts remain valid', async () => {
  const h = harness('Invoice'); const { body } = await h.run({ _id: 'admin', role: 'Admin' });
  assert.equal(body.categories.find(c => c.key === 'invoices').total, null);
  assert.ok(body.categories.find(c => c.key === 'invoices').error);
  assert.equal(body.categories.find(c => c.key === 'work').total, 0);
});
test('client requests cannot read staff actions', async () => {
  const h = harness(); assert.equal((await h.run({ _id: 'client', role: 'Client' }, {})).status, 403);
  assert.equal(h.calls.length, 0);
});
