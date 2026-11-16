const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function loadController(file, dependencies) {
  const exports = {};
  vm.runInNewContext(fs.readFileSync(require.resolve(file), 'utf8'), {
    exports, require: id => id === "../services/dashboardActionPolicy" ? require("./services/dashboardActionPolicy") : dependencies[id] || {}, console: { error() {} }, Date,
  });
  return exports;
}
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
test('chat reads and deletes are scoped to the authenticated owner', async () => {
  const calls = [];
  const controller = loadController('./controllers/aiWorkspaceConversationController', {
    '../models/AIConversation': {
      findOne: filter => { calls.push(filter); return { lean: async () => null }; },
      deleteOne: async filter => { calls.push(filter); return { deletedCount: 0 }; },
    },
  });
  const req = { user: { _id: 'staff-1' }, params: { conversationId: 'someone-elses-chat' } };
  for (const method of ['getConversationById', 'deleteConversation']) {
    const res = response(); await controller[method](req, res); assert.equal(res.code, 404);
  }
  for (const call of calls) { assert.equal(call.userId, 'staff-1'); assert.equal(call.conversationId, 'someone-elses-chat'); }
});
test('client and missing-identity requests cannot access chat endpoints', async () => {
  const controller = loadController('./controllers/aiWorkspaceConversationController', {});
  for (const method of Object.keys(controller)) {
    for (const req of [{ client: { _id: 'client' }, user: { _id: 'client' } }, {}]) {
      const res = response(); await controller[method](req, res); assert.equal(res.code, 403);
    }
  }
});
test('workspace ownership errors retain their HTTP status', async () => {
  const controller = loadController('./controllers/aiWorkspaceConversationController', {
    '../ai/conversation/workspaceConversationService': { processTurn: async () => { throw Object.assign(new Error('Conversation not found.'), { statusCode: 404 }); } },
  });
  const res = response();
  await controller.handleWorkspaceMessage({ user: { _id: 'staff' }, body: { conversationId: 'other-chat', input: { type: 'text', text: 'hello' } } }, res);
  assert.equal(res.code, 404);
});
test('scheduling a missing creative returns failure instead of a false success', async () => {
  const controller = loadController('./controllers/scheduledJobController', {
    '../models/ScheduledJob': { findOne: async () => null },
    '../models/AgentRun': { findById: async () => null },
  });
  const res = response();
  await controller.createOrUpdateSchedule({ user: { _id: "admin", role: "Admin" }, body: { creativeRunId: 'missing', scheduledFor: '2099-01-01T10:00:00+05:30' } }, res);
  assert.equal(res.code, 404); assert.equal(res.body.success, false);
});
test('invalid schedule dates are rejected before querying records', async () => {
  const controller = loadController('./controllers/scheduledJobController', {});
  for (const scheduledFor of ['invalid', '2000-01-01T00:00:00Z']) {
    const res = response(); await controller.createOrUpdateSchedule({ user: { _id: "admin", role: "Admin" }, body: { scheduledFor } }, res);
    assert.equal(res.code, 400);
  }
});

test('workspace service rejects another owner before processing a turn', async () => {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./ai/conversation/workspaceConversationService'), 'utf8'), {
    module, require: id => id.endsWith('/AIConversation') ? { findOne: async () => ({ userId: 'other' }) } : {},
    console: { warn() {}, error() {} }, Date,
  });
  await assert.rejects(module.exports.getOrCreateConversation({ conversationId: 'private', userId: 'me' }), error => error.statusCode === 404);
});
test('unconnected image revisions do not mutate the approved creative or claim completion', async () => {
  const module = { exports: {} }; const run = { _id: 'asset', requestedBy: 'me' }; let filter;
  vm.runInNewContext(fs.readFileSync(require.resolve('./ai/conversation/workspaceConversationService'), 'utf8'), {
    module, require: id => id.endsWith('/AgentRun') ? { findOne: async query => { filter = query; return run; } } : {},
    console: { warn() {}, error() {} }, Date,
  });
  await assert.rejects(module.exports._handleRevision({ creativeRunId: 'asset', userId: 'me' }), /original creative has not been changed/);
  assert.equal(filter.requestedBy, 'me');
  assert.equal(run.status, undefined);
});

