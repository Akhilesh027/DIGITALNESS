const { test } = require('node:test');
const assert = require('node:assert/strict');
const { periodFor, buildActivityReport } = require('./services/clientActivityReport');
const Customer = require('./models/Customer');
const DailyUpdate = require('./models/DailyUpdate');
const Work = require('./models/Work');
const controller = require('./controllers/reportController');
const chain = value => ({ populate() { return this; }, sort() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });

test('weekly report is registered behind authentication', () => {
  const router = require('./routes/reportRoutes');
  const route = router.stack.find(layer => layer.route?.path === '/customer/:customerId/weekly');
  assert.ok(route?.route.methods.get);
  assert.equal(router.stack[0].handle, require('./middleware/authMiddleware').protect);
});

test('daily, weekly and monthly defaults and strict date validation', () => {
  const now = new Date(2026, 10, 14, 12);
  assert.deepEqual(periodFor('weekly', {}, now), { fromDate: '2026-11-08', toDate: '2026-11-14' });
  assert.deepEqual(periodFor('daily', {}, now), { fromDate: '2026-11-14', toDate: '2026-11-14' });
  assert.deepEqual(periodFor('monthly', { month: '2', year: '2024' }), { fromDate: '2024-02-01', toDate: '2024-02-29' });
  for (const query of [{ fromDate: '2026-02-30' }, { fromDate: 'bad' }, { fromDate: '2026-11-20', toDate: '2026-11-14' }]) assert.throws(() => periodFor('daily', query), { statusCode: 400 });
});

test('summary distinguishes an empty period and counts activity without inventing campaign metrics', () => {
  const customer = { _id: 'c1', name: 'Test Client' }, period = { fromDate: '2026-11-01', toDate: '2026-11-07' };
  assert.equal(buildActivityReport('weekly', customer, period, []).empty, true);
  const report = buildActivityReport('weekly', customer, period, [{ taskTitle: 'Poster', totalHours: 1.25, currentStatus: 'Completed', approvalStatus: 'Approved' }, { taskTitle: 'Reel', totalHours: 2.1, blockers: 'Waiting for footage', tomorrowPlan: 'Edit reel', approvalStatus: 'Pending' }]);
  assert.deepEqual(report.summary, { updates: 2, completedUpdates: 1, pendingApprovals: 1, blockedUpdates: 1, hours: 3.35 });
  assert.equal(report.rows[1].next, 'Edit reel');
});

test('report controllers enforce client isolation, date boundaries and failure responses without a database', async () => {
  const originals = [Customer.findById, DailyUpdate.find, Work.find];
  let captured;
  Customer.findById = () => chain({ _id: 'c1', name: 'Test Client', branchId: 'BR1' });
  DailyUpdate.find = filter => { captured = filter; return chain([]); };
  Work.find = () => chain([]);
  const invoke = async (handler, role, customerId, query = {}) => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await handler({ path: '/customer/c1/weekly', params: { customerId: 'c1' }, query, user: { role, customerId } }, res);
    return res;
  };
  try {
    const result = await invoke(controller.getCustomerWeeklyReport, 'Client', 'c1', { fromDate: '2026-11-01', toDate: '2026-11-07' });
    assert.equal(result.code, 200); assert.equal(result.body.report.type, 'weekly'); assert.equal(result.body.report.empty, true);
    assert.equal(captured.customer, 'c1'); assert.equal(captured.date.$gte.getDate(), 1); assert.equal(captured.date.$lte.getDate(), 7); assert.equal(captured.date.$lte.getHours(), 23);
    assert.equal((await invoke(controller.getCustomerWeeklyReport, 'Client', 'other')).code, 403);
    assert.equal((await invoke(controller.getCustomerDailyReport, 'Client', 'c1', { fromDate: 'bad' })).code, 400);
    const monthly = await invoke(controller.getCustomerMonthlyReport, 'Client', 'c1');
    assert.equal(monthly.body.report.type, 'monthly');
    DailyUpdate.find = () => { throw new Error('Database unavailable'); };
    const failure = await invoke(controller.getCustomerWeeklyReport, 'Client', 'c1');
    assert.equal(failure.code, 500); assert.equal(failure.body.success, false); assert.equal(failure.body.report, undefined);
  } finally { [Customer.findById, DailyUpdate.find, Work.find] = originals; }
});
