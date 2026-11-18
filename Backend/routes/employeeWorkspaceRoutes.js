const router = require('express').Router();
const Work = require('../models/Work');
const WorkApproval = require('../models/WorkApproval');
const DailyUpdate = require('../models/DailyUpdate');
const User = require('../models/User');
const p = require('../services/servicePermissions');
const upload = require('../middleware/uploadMiddleware');
const notify = require('../utils/createNotification');
const fs = require('node:fs/promises');

const fields = '_id title description workType clientName customer assignedTo createdBy status approvalStatus priority dueDate parentWorkId updatedAt deliverables completedDeliverables estimatedHours timeSpent progressNote updates attachments comments timeline managerReviewNote blockedBy';
const editable = ['Pending', 'Not Started', 'In Progress', 'Revision'];
const objectId = value => /^[a-f\d]{24}$/i.test(value || '');
function text(value, label, required = false, max = 10000) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw p.error(`Provide a valid ${label}`, 400);
  return value.trim();
}
function version(req, item) {
  if (typeof req.body.version !== 'string' || req.body.version !== new Date(item.updatedAt).toISOString()) throw p.error('This work changed. Refresh its details before saving.', 409);
  return { _id: item._id, assignedTo: req.user._id, updatedAt: new Date(req.body.version) };
}
async function own(req, res, next) {
  try {
    if (!objectId(req.params.id)) throw p.error('Assignment not found', 404);
    const item = await Work.findOne({ _id: req.params.id, assignedTo: req.user._id }).select(fields)
      .populate('customer', 'name companyName requirements brandProfile businessProfile').populate('assignedTo', 'name role').populate('createdBy', 'name role').lean();
    if (!item) throw p.error('Assignment not found', 404);
    item.clientName = item.clientName || item.customer?.name || item.customer?.companyName || '';
    req.assignment = item; next();
  } catch (error) { next(error); }
}
function canChange(item) {
  if (!editable.includes(item.status)) throw p.error('Work awaiting review or already closed cannot be changed. Ask your manager for a revision.', 409);
}
async function change(req, update) {
  const item = await Work.findOneAndUpdate(version(req, req.assignment), update, { returnDocument: 'after', runValidators: true }).select(fields)
    .populate('customer', 'name companyName requirements brandProfile businessProfile').populate('assignedTo', 'name role').populate('createdBy', 'name role').lean();
  if (!item) throw p.error('This work changed or was reassigned. Refresh before trying again.', 409);
  item.clientName = item.clientName || item.customer?.name || item.customer?.companyName || '';
  return item;
}
async function notifyCreator(req, title, message) {
  const creator = p.id(req.assignment.createdBy);
  if (creator && creator !== p.id(req.user)) await notify({ title, message: `${req.assignment.title}: ${message}`, type: 'work', moduleId: req.assignment._id, moduleModel: 'Work', recipient: creator, createdBy: req.user._id, link: '/works' });
}
router.use((req, res, next) => {
  if (!['assigned', 'company', 'branch'].includes(p.scope(req.user).kind) || req.user.status === 'Inactive') return next(p.error());
  next();
});
router.get('/my-work/:id', own, async (req, res, next) => {
  try {
    const reviews = await WorkApproval.find({ work: req.assignment._id }).select('_id status adminRemark reviewMessage reviewedAt createdAt').sort({ createdAt: -1 }).lean();
    res.json({ success: true, item: req.assignment, reviews });
  } catch (error) { next(error); }
});
router.post('/my-work/:id/status', own, async (req, res, next) => {
  let approval;
  let saved = false;
  try {
    const item = req.assignment;
    canChange(item); version(req, item);
    const status = req.body.status;
    if (!['In Progress', 'Review'].includes(status)) throw p.error('Employees can start work or submit it for review', 400);
    if (status === item.status) throw p.error('This work already has that status', 409);
    if (status === 'Review' && item.blockedBy?.isBlocked) throw p.error('Resolve the blocker before submitting for review', 400);
    const message = text(req.body.message, 'submission summary', status === 'Review');
    if (status === 'Review') {
      // Create the manager queue entry before changing the work. Compensate if
      // the assignment/version check loses a race; never report a false success.
      approval = await WorkApproval.create({ work: item._id, customer: item.customer ? p.id(item.customer) : null, submittedBy: req.user._id, assignedTo: item.assignedTo.map(p.id), reviewMessage: message });
    }
    const updated = await change(req, {
      $set: { status, ...(status === 'Review' ? { approvalStatus: 'Pending Approval', approvalRequired: true, progressNote: message } : {}) },
      $push: { timeline: { title: status === 'Review' ? 'Submitted For Review' : 'Work Started', description: message || 'Employee started work', createdBy: req.user._id } },
    });
    saved = true;
    if (approval) {
      // Notify the creator and company admins through the existing in-app inbox.
      const admins = await User.find({ role: { $in: ['Admin', 'admin', 'Super Admin', 'superadmin', 'Owner', 'owner'] }, status: { $ne: 'Inactive' } }).select('_id').lean().catch(() => []);
      const recipients = new Set([...(admins || []).map(user => p.id(user)), ...(item.createdBy ? [p.id(item.createdBy)] : [])]);
      recipients.delete(p.id(req.user));
      await Promise.all([...recipients].map(recipient => notify({ title: 'Work Approval Required', message: `${item.title} was submitted for review.`, type: 'approval', moduleId: item._id, moduleModel: 'Work', recipient, createdBy: req.user._id, link: '/approvals' })));
    }
    res.json({ success: true, item: { ...updated, clientName: item.clientName, assignedTo: item.assignedTo, createdBy: item.createdBy } });
  } catch (error) {
    if (approval && !saved) await WorkApproval.deleteOne({ _id: approval._id }).catch(cleanup => console.error('[Employee approval cleanup]', cleanup.message));
    next(error);
  }
});
router.post('/my-work/:id/updates', own, (req, res, next) => {
  try { canChange(req.assignment); next(); } catch (error) { next(error); }
}, upload.array('files', 5), async (req, res, next) => {
  try {
    const message = text(req.body.message, 'progress note', true);
    const hours = Number(req.body.timeSpent || 0);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw p.error('Time spent must be between 0 and 24 hours', 400);
    let links;
    try { links = typeof req.body.links === 'string' ? JSON.parse(req.body.links) : req.body.links || []; } catch { throw p.error('Invalid delivery links', 400); }
    if (!Array.isArray(links) || links.length > 10 || links.some(link => typeof link !== 'string' || link.length > 2000 || !/^https?:\/\//i.test(link) || (() => { try { return !new URL(link).hostname; } catch { return true; } })())) throw p.error('Use up to 10 valid HTTP or HTTPS delivery links', 400);
    const files = (req.files || []).map(file => ({ fileName: file.originalname, fileUrl: `/uploads/daily-updates/${file.filename}`, fileType: file.mimetype, uploadedBy: req.user._id }));
    const attachments = [...files, ...links.map(link => ({ fileName: 'Delivery link', fileUrl: link, uploadedBy: req.user._id }))];
    const item = await change(req, { $set: { progressNote: message }, $inc: { timeSpent: hours }, $push: {
      updates: { message, files: attachments.map(file => file.fileUrl), timeSpent: hours, by: req.user._id, byName: req.user.name },
      ...(attachments.length ? { attachments: { $each: attachments } } : {}),
      timeline: { title: 'Work Update Added', description: message, createdBy: req.user._id },
    } });
    res.json({ success: true, item });
  } catch (error) {
    await Promise.all((req.files || []).map(file => fs.unlink(file.path).catch(() => {})));
    next(error);
  }
});
router.post('/my-work/:id/comments', own, async (req, res, next) => {
  try {
    const message = text(req.body.message, 'comment', true);
    const item = await change(req, { $push: { comments: { message, createdBy: req.user._id, createdByName: req.user.name } } });
    await notifyCreator(req, 'New work comment', message);
    res.json({ success: true, item });
  } catch (error) { next(error); }
});
router.post('/my-work/:id/blocker', own, async (req, res, next) => {
  try {
    canChange(req.assignment);
    if (typeof req.body.isBlocked !== 'boolean') throw p.error('Choose whether this work is blocked', 400);
    const note = text(req.body.note, 'blocker description', req.body.isBlocked);
    const type = req.body.type || 'OTHER_TASK';
    if (!['CLIENT_INPUT', 'MANAGER_APPROVAL', 'OTHER_TASK', 'ASSET', 'EXTERNAL'].includes(type)) throw p.error('Invalid blocker type', 400);
    const item = await change(req, { $set: { blockedBy: { isBlocked: req.body.isBlocked, type: req.body.isBlocked ? type : '', note, since: req.body.isBlocked ? new Date() : null } }, $push: { timeline: { title: req.body.isBlocked ? 'Blocker Reported' : 'Blocker Resolved', description: note, createdBy: req.user._id } } });
    await notifyCreator(req, req.body.isBlocked ? 'Employee needs help' : 'Work blocker resolved', note || 'The employee can continue work.');
    res.json({ success: true, item });
  } catch (error) { next(error); }
});
router.get('/daily-updates', async (req, res, next) => {
  try { res.json({ success: true, items: await DailyUpdate.find({ employee: req.user._id }).sort({ date: -1 }).limit(60).lean() }); }
  catch (error) { next(error); }
});
router.post('/daily-updates', async (req, res, next) => {
  try {
    const hours = Number(req.body.totalHours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw p.error('Hours must be between 0 and 24', 400);
    const item = await DailyUpdate.create({ employee: req.user._id, branchId: req.user.branchId || '', date: new Date(), taskTitle: 'Daily summary', totalHours: hours, workCompleted: text(req.body.workCompleted, 'work completed', true), pendingWork: text(req.body.pendingWork, 'pending work'), blockers: text(req.body.blockers, 'blockers'), tomorrowPlan: text(req.body.tomorrowPlan, 'next day plan') });
    res.json({ success: true, item });
  } catch (error) { next(error); }
});
module.exports = router;
