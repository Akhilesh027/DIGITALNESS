const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { actionScope } = require('./services/dashboardActionPolicy');
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function access(record) {
  const module = { exports: {} }; const queries = [];
  vm.runInNewContext(fs.readFileSync(require.resolve('./middleware/aiAccessMiddleware'), 'utf8'), {
    module, require: id => id.includes('dashboardActionPolicy') ? { actionScope } : { findOne: query => { queries.push(query); return { select: async () => record }; } },
  });
  return { ...module.exports, queries };
}
test('staff AI gate rejects clients, missing roles and missing identities', () => {
  const middleware = access();
  for (const req of [{}, { user: { _id: 'u' } }, { user: { _id: 'u', role: 'Client' } }, { client: { _id: 'client' }, user: { _id: 'u', role: 'Admin' } }]) {
    const res = response(); middleware.requireStaff(req, res, () => assert.fail('unexpected access')); assert.equal(res.code, 403);
  }
  let called = false; middleware.requireStaff({ user: { _id: 'u', role: 'Graphic Designer' } }, response(), () => { called = true; }); assert.ok(called);
});

test('the HTTP client socket is not mistaken for a logged-in client account', () => {
  let called = false;
  access().requireStaff({ client: { remoteAddress: '127.0.0.1' }, user: { _id: 'admin', role: 'Admin' } }, response(), () => { called = true; });
  assert.ok(called);
});
test('run and command access hides other staff records', async () => {
  const middleware = access(null);
  for (const [handler, params] of [['requireAgentRun', { id: 'run' }], ['requireCommand', { executionId: 'command' }]]) {
    const res = response(); await middleware[handler]({ user: { _id: 'staff', role: 'Manager' }, params }, res, () => assert.fail('unexpected access')); assert.equal(res.code, 404);
  }
  for (const query of middleware.queries) assert.equal(query.requestedBy, 'staff');
});
test('company admins can oversee records and owners can access their own', async () => {
  const middleware = access({ _id: 'record' });
  for (const role of ['Admin', 'Graphic Designer']) {
    let called = false; await middleware.requireAgentRun({ user: { _id: 'staff', role }, params: { id: 'run' } }, response(), error => { assert.equal(error, undefined); called = true; }); assert.ok(called);
  }
  assert.equal(middleware.queries[0].requestedBy, undefined); assert.equal(middleware.queries[1].requestedBy, 'staff');
});
test('structured provider accepts non-marketing CRM JSON and preserves task instructions', async () => {
  const exports = {}; const requests = [];
  vm.runInNewContext(fs.readFileSync(require.resolve('./ai/providers/AIProvider'), 'utf8'), {
    exports, process: { env: {} }, AbortController, setTimeout, clearTimeout, console: { log() {}, warn() {} },
    fetch: async (url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, text: async () => '{"tasks":[{"title":"Follow up"}]}' }; },
  });
  const result = await exports.generateStructured({ prompt: 'Extract tasks', schemaName: 'task_list' });
  assert.equal(result.tasks[0].title, 'Follow up'); assert.equal(requests.length, 1);
  assert.match(requests[0].messages[0].content, /task_list/);
});

