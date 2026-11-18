const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Attendance = require('./models/Attendance');
const Correction = require('./models/AttendanceCorrection');
const User = require('./models/User');
const a = require('./services/manualAttendance');
const p = require('./services/servicePermissions');
const E = 'e'.repeat(24), O = 'f'.repeat(24), A = 'a'.repeat(24), M = 'b'.repeat(24);
let actor, rows, requests, users, app, failFinalize, originals = [], serial = 0;
const copy = value => structuredClone(value);
function get(row, key) { return key.split('.').reduce((value, part) => Array.isArray(value) ? value.map(entry => entry?.[part]) : value?.[part], row); }
function match(row, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = get(row, key);
    if (key === '$or') return expected.some(part => match(row, part));
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      if ('$ne' in expected) return String(actual) !== String(expected.$ne);
      if ('$in' in expected) return expected.$in.some(value => String(value) === String(actual));
      if ('$gte' in expected && new Date(actual) < expected.$gte) return false;
      if ('$lt' in expected && new Date(actual) >= expected.$lt) return false;
      if ('$gte' in expected || '$lt' in expected) return Boolean(actual);
    }
    if (Array.isArray(actual)) return actual.some(value => String(value) === String(expected));
    return expected instanceof Date ? new Date(actual).getTime() === expected.getTime() : String(actual) === String(expected);
  });
}
function chain(value) {
  return { select(fields) {
    if (fields) {
      const project = row => row && Object.fromEntries(['_id', ...fields.split(' ')].filter(key => key in row).map(key => [key, row[key]]));
      value = Array.isArray(value) ? value.map(project) : project(value);
    } return this;
  }, populate() { return this; }, sort() { return this; }, limit(n) { if (Array.isArray(value)) value = value.slice(0, n); return this; }, lean() { return Promise.resolve(copy(value)); }, then(resolve, reject) { return Promise.resolve(copy(value)).then(resolve, reject); } };
}
function stub(object, key, value) { const previous = object[key]; object[key] = value; originals.push(() => { object[key] = previous; }); }
function update(row, change) {
  Object.assign(row, change.$set);
  for (const [key, value] of Object.entries(change.$inc || {})) row[key] = (row[key] || 0) + value;
  for (const [key, value] of Object.entries(change.$push || {})) (row[key] ||= []).push(value);
  row.updatedAt = new Date(new Date(row.updatedAt || 0).getTime() + 1000);
  return row;
}
before(() => {
  for (const [model, collection] of [[Attendance, () => rows], [Correction, () => requests], [User, () => users]]) {
    stub(model, 'findOne', filter => chain(collection().find(row => match(row, filter)) || null));
    stub(model, 'find', filter => chain(collection().filter(row => match(row, filter))));
    stub(model, 'findOneAndUpdate', (filter, changes) => {
      if (model === Correction && changes.$set?.status === 'Approved' && failFinalize) { failFinalize = false; throw new Error('Simulated finalization failure'); }
      const row = collection().find(row => match(row, filter));
      return chain(row ? update(row, changes) : null);
    });
    stub(model, 'updateOne', async (filter, changes) => { const row = collection().find(row => match(row, filter)); if (row) update(row, changes); return {}; });
    stub(model, 'create', async values => {
      if (model === Attendance && rows.some(row => row.employee === values.employee && ((row.mode === 'Manual' && row.dayKey === values.dayKey) || (row.isOpen && values.isOpen)))) throw Object.assign(new Error('Duplicate'), { code: 11000 });
      if (model === Correction && requests.some(row => row.employee === values.employee && row.dayKey === values.dayKey && row.isPending)) throw Object.assign(new Error('Duplicate'), { code: 11000 });
      const row = { _id: String(++serial).padStart(24, '0'), createdAt: new Date(), updatedAt: new Date(), ...(model === Correction ? { status: 'Pending', isPending: true } : {}), ...copy(values) };
      collection().push(row);
      return { ...row, toObject: () => copy(row) };
    });
  }
  app = express();
  app.use('/api/attendance', (req, res, next) => {
    if (!actor) return res.status(401).json({ message: 'Authentication required' });
    req.user = actor; p.employeeBoundary(req, res, next);
  }, require('./routes/manualAttendanceRoutes'));
});
after(() => originals.reverse().forEach(restore => restore()));
function reset() {
  actor = { _id: E, name: 'Employee', role: 'Frontend Dev', branchId: 'BR1', status: 'Active' };
  rows = []; requests = []; failFinalize = false;
  users = [{ ...actor, salary: 'private' }, { _id: O, name: 'Other employee', role: 'Designer', branchId: 'BR2', status: 'Active' }];
}
async function call(path, body, method = body ? 'POST' : 'GET') {
  const http = require('node:http');
  const req = new http.IncomingMessage(new (require('node:net').Socket)());
  req.method = method; req.url = '/api/attendance' + path; req.headers = {}; req.body = body || {};
  const res = new http.ServerResponse(req);
  return new Promise((resolve, reject) => {
    res.end = value => { try { resolve({ status: res.statusCode, body: JSON.parse(String(value)) }); } catch (error) { reject(error); } return res; };
    app.handle(req, res, error => error ? reject(error) : resolve({ status: 404 }));
  });
}
function requestValues() {
  const now = new Date();
  const start = new Date(now.getTime() - 5 * 3600000), end = new Date(now.getTime() - 3600000);
  return { dayKey: a.dayKey(start), proposedIn: start.toISOString(), proposedOut: end.toISOString(), breakMinutes: 30, reason: 'Forgot to record my shift' };
}
test('IST business dates and overnight calculations are stable across UTC midnight and month boundaries', () => {
  assert.equal(a.dayKey(new Date('2026-11-15T20:00:00Z')), '2026-11-16');
  assert.equal(a.dayBounds('2026-11-16').start.toISOString(), '2026-11-15T18:30:00.000Z');
  assert.throws(() => a.dayBounds('2026-02-30'));
  const record = { mode: 'Manual', isOpen: true, loginTime: '2026-11-16T16:30:00Z', breaks: [{ startedAt: '2026-11-16T18:00:00Z', endedAt: '2026-11-16T18:30:00Z' }] };
  const result = a.transition(record, 'check-out', new Date('2026-11-17T00:30:00Z'));
  assert.equal(result.totalHours, 7.5); assert.equal(result.breakMinutes, 30); assert.equal(result.isOpen, false);
});
test('working time pauses on a break and checkout closes an unfinished break', () => {
  const now = new Date('2026-11-16T12:00:00Z');
  const record = { mode: 'Manual', isOpen: true, loginTime: '2026-11-16T10:00:00Z', breaks: [{ startedAt: '2026-11-16T11:00:00Z', endedAt: null }] };
  assert.equal(a.totals(record, now).totalHours, 1);
  assert.equal(a.transition(record, 'check-out', now).totalHours, 1);
  assert.throws(() => a.transition(record, 'break-start', now), /already/);
  assert.throws(() => a.transition({ ...record, breaks: [] }, 'break-end', now), /No break/);
  assert.equal(a.state(record, new Date('2026-11-17T06:00:00Z')), 'Missed checkout');
  assert.throws(() => a.transition(record, 'check-out', new Date('2026-11-17T11:00:00Z')), /correction/);
});
test('explicit check-in, break, resume and checkout are owned, server timed and reject stale or duplicate punches', async () => {
  reset();
  assert.equal((await call('/check-in', { employee: O, loginTime: '2000-01-01' })).status, 200);
  assert.equal(rows[0].employee, E); assert.equal(rows[0].revision, 1);
  assert.ok(new Date() - rows[0].loginTime < 5000);
  assert.equal((await call('/check-in', {})).status, 409);
  assert.equal((await call('/break-start', { revision: 1 })).status, 200);
  assert.equal((await call('/break-start', { revision: 1 })).status, 409);
  assert.equal((await call('/break-end', { revision: 1 })).status, 409);
  assert.equal((await call('/break-end', { revision: 2 })).status, 200);
  assert.equal((await call('/check-out', { revision: 3 })).status, 200);
  assert.equal(rows[0].isOpen, false); assert.equal(rows[0].events.length, 4);
  assert.equal((await call('/check-out', { revision: 4 })).status, 409);
  assert.equal((await call('/check-in', {})).status, 409);
});
test('legacy attendance is retained in an audit snapshot when explicit check-in starts', async () => {
  reset();
  const legacyIn = new Date(Date.now() - 2 * 3600000);
  rows.push({ _id: A, employee: E, date: new Date(`${a.dayKey()}T00:00:00Z`), loginTime: legacyIn, logoutTime: new Date(), totalHours: 2, status: 'Half Day', updatedAt: new Date() });
  assert.equal((await call('/check-in', {})).status, 200);
  assert.equal(rows.length, 1); assert.equal(rows[0].mode, 'Manual');
  assert.equal(rows[0].legacySnapshot.totalHours, 2);
  assert.equal(rows[0].legacySnapshot.loginTime.getTime(), legacyIn.getTime());
});
test('employee history/corrections cannot be redirected to another employee and management is denied', async () => {
  reset(); await call('/check-in', {});
  rows.push({ ...copy(rows[0]), _id: A, employee: O });
  assert.equal((await call('/clock?employeeId=' + O)).body.active.employee, E);
  assert.equal((await call('/history?employeeId=' + O)).body.items.length, 1);
  assert.equal((await call('/manage')).status, 403);
  assert.equal((await call('/manage/corrections/' + A + '/review', { status: 'Approved', reviewNote: 'test' })).status, 403);
  actor = null; assert.equal((await call('/clock')).status, 401);
  actor = { _id: E, role: 'Client' }; assert.equal((await call('/clock')).status, 403);
});
test('correction validation rejects future, invalid, mismatched dates, excessive shifts, breaks and missing reasons', () => {
  const valid = { dayKey: '2026-11-16', proposedIn: '2026-11-16T04:00:00Z', proposedOut: '2026-11-16T12:00:00Z', breakMinutes: 30, reason: 'Forgot' };
  const now = new Date('2026-11-16T13:00:00Z');
  assert.equal(a.correction(valid, now).breakMinutes, 30);
  for (const patch of [{ proposedOut: '2026-11-17T12:00:00Z' }, { proposedOut: 'invalid' }, { dayKey: '2026-11-15' }, { breakMinutes: -1 }, { breakMinutes: 480 }, { reason: '' }]) assert.throws(() => a.correction({ ...valid, ...patch }, now));
});
test('requests do not alter attendance, duplicate pending requests fail and only the owner can withdraw', async () => {
  reset(); const values = requestValues();
  assert.equal((await call('/corrections', { ...values, employee: O, status: 'Approved' })).status, 200);
  assert.equal(rows.length, 0); assert.equal(requests[0].employee, E); assert.equal(requests[0].status, 'Pending');
  assert.equal((await call('/corrections', values)).status, 409);
  const id = requests[0]._id;
  actor._id = O; assert.equal((await call(`/corrections/${id}/withdraw`, {})).status, 409);
  actor._id = E; assert.equal((await call(`/corrections/${id}/withdraw`, {})).status, 200);
  assert.equal(requests[0].isPending, false);
});
test('branch managers see only their branch and cannot approve another branch or themselves', async () => {
  reset(); await call('/corrections', requestValues());
  actor = { _id: M, role: 'Branch Manager', branchId: 'BR2' };
  const monitor = await call('/manage');
  assert.equal(monitor.body.employees.length, 1); assert.equal(monitor.body.corrections.length, 0);
  assert.ok(!JSON.stringify(monitor.body).includes('private'));
  const path = `/manage/corrections/${requests[0]._id}/review`;
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Yes' })).status, 404);
  actor = { _id: E, role: 'Admin' };
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Yes' })).status, 403);
});
test('approved correction creates the missing record, computes net hours and records the decision once', async () => {
  reset(); await call('/corrections', requestValues());
  actor = { _id: A, role: 'Admin' };
  const path = `/manage/corrections/${requests[0]._id}/review`;
  const result = await call(path, { status: 'Approved', reviewNote: 'Verified with manager' });
  assert.equal(result.status, 200); assert.equal(requests[0].status, 'Approved');
  assert.equal(rows[0].totalHours, 3.5); assert.equal(rows[0].correctedBreakMinutes, 30);
  assert.equal(rows[0].events[0].action, 'CORRECTION_APPROVED');
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Again' })).status, 409);
  assert.equal(rows.length, 1);
});
test('approval retry after finalization failure is idempotent and keeps the pending-day lock', async () => {
  reset(); await call('/corrections', requestValues());
  actor = { _id: A, role: 'Admin' }; failFinalize = true;
  const path = `/manage/corrections/${requests[0]._id}/review`;
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Verified' })).status, 500);
  assert.equal(requests[0].status, 'Processing'); assert.equal(rows.length, 1);
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Verified' })).status, 200);
  assert.equal(rows.length, 1); assert.equal(rows[0].events.length, 1);
});
test('stale correction approval fails without replacing a changed record and rejection leaves times unchanged', async () => {
  reset(); const values = requestValues();
  rows.push({ _id: A, employee: E, date: new Date(`${values.dayKey}T00:00:00Z`), mode: 'Manual', dayKey: values.dayKey, isOpen: false, loginTime: new Date(values.proposedIn), logoutTime: new Date(values.proposedOut), totalHours: 4, revision: 1, updatedAt: new Date(Date.now() - 10000), events: [] });
  await call('/corrections', values);
  rows[0].revision++; rows[0].updatedAt = new Date();
  actor = { _id: M, role: 'Branch Manager', branchId: 'BR1' };
  const path = `/manage/corrections/${requests[0]._id}/review`;
  assert.equal((await call(path, { status: 'Approved', reviewNote: 'Verified' })).status, 409);
  assert.equal(requests[0].status, 'Pending'); assert.equal(rows[0].totalHours, 4);
  assert.equal((await call(path, { status: 'Rejected', reviewNote: 'Please submit current times' })).status, 200);
  assert.equal(rows[0].totalHours, 4); assert.equal(requests[0].status, 'Rejected');
});
test('logout no longer reads or writes attendance', async () => {
  const { logoutUser } = require('./controllers/authController');
  let payload;
  await logoutUser({ user: { _id: E } }, { json(value) { payload = value; }, status() { throw new Error('Logout failed'); } });
  assert.equal(payload.success, true); assert.equal(payload.attendance, undefined);
});
