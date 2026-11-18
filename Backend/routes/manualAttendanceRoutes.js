const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Correction = require('../models/AttendanceCorrection');
const User = require('../models/User');
const p = require('../services/servicePermissions');
const a = require('../services/manualAttendance');
const publicFields = '_id employee date dayKey mode isOpen revision breaks correctedBreakMinutes loginTime logoutTime totalHours status branchId remarks updatedAt events legacySnapshot';
const idValid = value => /^[a-f\d]{24}$/i.test(value || '');
const present = record => record && ({ ...record, ...(record.mode === 'Manual' ? a.totals(record) : { totalHours: record.totalHours || 0, breakMinutes: 0 }), clockState: a.state(record), dayKey: record.dayKey || a.dayKey(new Date(record.date)) });
const ownFilter = req => ({ employee: req.user._id });
const dayFilter = key => { const { start, end } = a.dayBounds(key); return { date: { $gte: start, $lt: end } }; };
const event = (req, action, extra = {}) => ({ action, actor: req.user._id, at: new Date(), ...extra });
function version(req, record) {
  if (!Number.isInteger(req.body.revision) || req.body.revision !== (record.revision || 0)) throw a.error('Attendance changed. Refresh before trying again.', 409);
  return { _id: record._id, employee: req.user._id, updatedAt: record.updatedAt, revision: req.body.revision };
}
function manager(req) {
  const scope = p.scope(req.user);
  if (!['company', 'branch'].includes(scope.kind)) throw a.error('Only administrators and branch managers can manage attendance', 403);
  return scope.kind === 'branch' ? { branchId: scope.branchId } : {};
}
router.use((req, res, next) => {
  if (!['assigned', 'branch', 'company'].includes(p.scope(req.user).kind) || req.user.status === 'Inactive') return next(a.error('Access denied', 403));
  next();
});
router.get('/clock', async (req, res, next) => {
  try {
    const active = await Attendance.findOne({ ...ownFilter(req), mode: 'Manual', isOpen: true }).select(publicFields).lean();
    const today = await Attendance.findOne({ ...ownFilter(req), ...dayFilter(a.dayKey()) }).select(publicFields).lean();
    res.json({ success: true, active: present(active), today: present(today), serverTime: new Date(), timezone: 'Asia/Kolkata' });
  } catch (error) { next(error); }
});
router.post('/check-in', async (req, res, next) => {
  try {
    if (await Attendance.findOne({ ...ownFilter(req), mode: 'Manual', isOpen: true }).select('_id').lean()) throw a.error('You already have an open attendance session. Check out or request a correction.', 409);
    const key = a.dayKey();
    const existing = await Attendance.findOne({ ...ownFilter(req), ...dayFilter(key) }).lean();
    if (existing?.mode === 'Manual') throw a.error('Attendance is already recorded for today. Use a correction request if the times are wrong.', 409);
    const values = { mode: 'Manual', dayKey: key, isOpen: true, loginTime: new Date(), logoutTime: null, totalHours: 0, breaks: [], correctedBreakMinutes: null, status: 'Present', branchId: req.user.branchId || '', revision: 1 };
    let record;
    if (existing) {
      record = await Attendance.findOneAndUpdate({ _id: existing._id, updatedAt: existing.updatedAt, mode: { $ne: 'Manual' } }, { $set: { ...values, legacySnapshot: a.snapshot(existing) }, $push: { events: event(req, 'CHECK_IN', { before: a.snapshot(existing), reason: 'Explicit check-in replaced automatic attendance; original retained in legacySnapshot.' }) } }, { returnDocument: 'after', runValidators: true }).select(publicFields).lean();
      if (!record) throw a.error('Attendance changed. Refresh and try again.', 409);
    } else {
      const created = await Attendance.create({ ...values, employee: req.user._id, date: new Date(`${key}T00:00:00Z`), events: [event(req, 'CHECK_IN')] });
      record = created.toObject();
    }
    res.json({ success: true, item: present(record) });
  } catch (error) { next(error); }
});
for (const action of ['break-start', 'break-end', 'check-out']) router.post(`/${action}`, async (req, res, next) => {
  try {
    const record = await Attendance.findOne({ ...ownFilter(req), mode: 'Manual', isOpen: true }).lean();
    if (!record) throw a.error('No open attendance session found', 409);
    const update = a.transition(record, action);
    // breakMinutes is derived; only net hours and break intervals are stored.
    delete update.breakMinutes;
    const changed = await Attendance.findOneAndUpdate(version(req, record), { $set: update, $inc: { revision: 1 }, $push: { events: event(req, action.toUpperCase().replace('-', '_')) } }, { returnDocument: 'after', runValidators: true }).select(publicFields).lean();
    if (!changed) throw a.error('Attendance changed. Refresh before trying again.', 409);
    res.json({ success: true, item: present(changed) });
  } catch (error) { next(error); }
});
router.get('/history', async (req, res, next) => {
  try {
    const key = req.query.month || a.dayKey().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) throw a.error('Choose a valid month');
    const start = a.dayBounds(`${key}-01`).start;
    const nextMonth = new Date(start.getTime() + 32 * 86400000);
    const end = a.dayBounds(`${a.dayKey(nextMonth).slice(0, 7)}-01`).start;
    const rows = await Attendance.find({ ...ownFilter(req), date: { $gte: start, $lt: end } }).select(publicFields).sort({ date: -1 }).lean();
    res.json({ success: true, items: rows.map(present) });
  } catch (error) { next(error); }
});
router.get('/corrections', async (req, res, next) => {
  try { res.json({ success: true, items: await Correction.find(ownFilter(req)).sort({ createdAt: -1 }).limit(100).lean() }); }
  catch (error) { next(error); }
});
router.post('/corrections', async (req, res, next) => {
  try {
    const values = a.correction(req.body);
    const record = await Attendance.findOne({ ...ownFilter(req), ...dayFilter(values.dayKey) }).lean();
    if (record?.isOpen && a.state(record) !== 'Missed checkout' && record.dayKey === a.dayKey()) throw a.error('Check out before requesting a correction for an active shift', 409);
    const item = await Correction.create({ ...values, employee: req.user._id, branchId: req.user.branchId || '', attendance: record?._id || null, expectedRevision: record?.revision || 0, expectedUpdatedAt: record?.updatedAt || null, before: a.snapshot(record) });
    res.json({ success: true, item });
  } catch (error) { next(error); }
});
router.post('/corrections/:id/withdraw', async (req, res, next) => {
  try {
    if (!idValid(req.params.id)) throw a.error('Request not found', 404);
    const item = await Correction.findOneAndUpdate({ _id: req.params.id, ...ownFilter(req), status: 'Pending' }, { $set: { status: 'Withdrawn', isPending: false } }, { returnDocument: 'after' }).lean();
    if (!item) throw a.error('The request was already reviewed or is not yours', 409);
    res.json({ success: true, item });
  } catch (error) { next(error); }
});
router.get('/manage', async (req, res, next) => {
  try {
    const scope = manager(req);
    const key = req.query.date || a.dayKey();
    const { start, end } = a.dayBounds(key);
    const [employees, rows, open, corrections, correctionHistory] = await Promise.all([
      User.find({ ...scope, status: 'Active' }).select('_id name role branchId').sort({ name: 1 }).lean(),
      Attendance.find({ ...scope, date: { $gte: start, $lt: end } }).select(publicFields).populate('employee', 'name role').populate('events.actor', 'name').sort({ loginTime: -1 }).lean(),
      Attendance.find({ ...scope, mode: 'Manual', isOpen: true }).select(publicFields).populate('employee', 'name role').lean(),
      Correction.find({ ...scope, status: { $in: ['Pending', 'Processing'] } }).populate('employee', 'name role').sort({ createdAt: -1 }).lean(),
      Correction.find({ ...scope, status: { $in: ['Approved', 'Rejected', 'Withdrawn'] } }).populate('employee', 'name role').sort({ updatedAt: -1 }).limit(100).lean(),
    ]);
    const roster = [...employees];
    for (const row of rows) if (row.employee && !roster.some(user => p.id(user) === p.id(row.employee))) roster.push(typeof row.employee === 'object' ? { ...row.employee, branchId: row.branchId } : { _id: row.employee, name: 'Former employee', branchId: row.branchId });
    res.json({ success: true, date: key, employees: roster, items: rows.map(present), open: open.map(present), corrections, correctionHistory });
  } catch (error) { next(error); }
});
router.post('/manage/corrections/:id/review', async (req, res, next) => {
  let request, applied = false;
  try {
    const scope = manager(req);
    if (!idValid(req.params.id)) throw a.error('Request not found', 404);
    const desired = req.body.status;
    const note = req.body.reviewNote;
    if (!['Approved', 'Rejected'].includes(desired) || typeof note !== 'string' || !note.trim() || note.length > 2000) throw a.error('Choose a decision and provide a review note');
    request = await Correction.findOne({ _id: req.params.id, ...scope }).lean();
    if (!request) throw a.error('Request not found', 404);
    if (p.id(request.employee) === p.id(req.user)) throw a.error('Another administrator or manager must review your own correction', 403);
    if (!['Pending', 'Processing'].includes(request.status)) throw a.error('This request was already reviewed', 409);
    if (request.status === 'Processing' && (desired !== 'Approved' || p.id(request.reviewedBy) !== p.id(req.user))) throw a.error('The approving manager must finish this approval', 409);
    if (desired === 'Rejected') {
      const changed = await Correction.findOneAndUpdate({ _id: request._id, status: 'Pending' }, { $set: { status: 'Rejected', isPending: false, reviewNote: note.trim(), reviewedBy: req.user._id, reviewedAt: new Date() } }, { returnDocument: 'after' }).lean();
      if (!changed) throw a.error('Request changed. Refresh before reviewing.', 409);
      return res.json({ success: true, item: changed });
    }
    if (request.status === 'Pending') {
      const claimed = await Correction.findOneAndUpdate({ _id: request._id, status: 'Pending' }, { $set: { status: 'Processing', reviewedBy: req.user._id, reviewNote: note.trim() } }, { returnDocument: 'after' }).lean();
      if (!claimed) throw a.error('Another reviewer changed this request', 409);
      request = claimed;
    }
    // A persisted event makes retries safe if finalizing the request failed.
    let record = await Attendance.findOne({ employee: request.employee, 'events.requestId': request._id }).lean();
    if (record) applied = true;
    if (!record) {
      const current = await Attendance.findOne({ employee: request.employee, ...dayFilter(request.dayKey) }).lean();
      if ((request.attendance && (!current || p.id(current) !== p.id(request.attendance) || (current.revision || 0) !== request.expectedRevision || new Date(current.updatedAt).getTime() !== new Date(request.expectedUpdatedAt).getTime())) || (!request.attendance && current)) throw a.error('Attendance changed since this request. Reject it and ask for an updated request.', 409);
      const values = { mode: 'Manual', dayKey: request.dayKey, loginTime: request.proposedIn, logoutTime: request.proposedOut, isOpen: false, correctedBreakMinutes: request.breakMinutes, status: 'Present', branchId: request.branchId, ...a.totals({ loginTime: request.proposedIn, logoutTime: request.proposedOut, correctedBreakMinutes: request.breakMinutes }) };
      delete values.breakMinutes;
      const log = event(req, 'CORRECTION_APPROVED', { requestId: request._id, reason: request.reason, before: a.snapshot(current), after: values });
      if (current) {
        record = await Attendance.findOneAndUpdate({ _id: current._id, updatedAt: current.updatedAt, ...(current.mode === 'Manual' ? { revision: current.revision || 0 } : { mode: { $ne: 'Manual' } }) }, { $set: { ...values, ...(current.mode !== 'Manual' ? { legacySnapshot: a.snapshot(current) } : {}) }, $inc: { revision: 1 }, $push: { events: log } }, { returnDocument: 'after', runValidators: true }).lean();
        if (!record) throw a.error('Attendance changed while reviewing. Refresh and try again.', 409);
      } else {
        record = (await Attendance.create({ ...values, employee: request.employee, date: new Date(`${request.dayKey}T00:00:00Z`), revision: 1, events: [log] })).toObject();
      }
      applied = true;
    }
    const finalized = await Correction.findOneAndUpdate({ _id: request._id, status: 'Processing', reviewedBy: req.user._id }, { $set: { status: 'Approved', isPending: false, after: a.snapshot(record), reviewedAt: new Date(), attendance: record._id } }, { returnDocument: 'after' }).lean();
    if (!finalized) throw a.error('Attendance was corrected. Refresh and retry approval to finish recording the decision.', 409);
    res.json({ success: true, item: finalized });
  } catch (error) {
    if (request?.status === 'Processing' && !applied && p.id(request.reviewedBy) === p.id(req.user)) await Correction.updateOne({ _id: request._id, status: 'Processing', reviewedBy: req.user._id }, { $set: { status: 'Pending', reviewedBy: null } }).catch(() => {});
    next(error);
  }
});
router.use((error, req, res, next) => res.status(error.code === 11000 ? 409 : error.statusCode || 500).json({ success: false, message: error.code === 11000 ? 'Attendance or a pending correction already exists. Refresh before trying again.' : error.message }));
module.exports = router;
