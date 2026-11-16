const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const p = require('../services/servicePermissions');
const Customer = require('../models/Customer');
const Work = require('../models/Work');
const AdCampaign = require('../models/AdCampaign');
const ContentItem = require('../models/ContentItem');
router.use(protect);

async function context(req, action) {
  const { customerId, service } = req.method === 'GET' ? req.query : req.body;
  if (!/^[a-f\d]{24}$/i.test(customerId || '') || !p.SERVICES.includes(service)) throw p.error('Select a valid client and service', 400);
  if (req.user.role === 'Client') throw p.error();
  const scope = p.scope(req.user);
  if (scope.kind === 'assigned' && !p.permitted(req.user, customerId, service, action)) throw p.error(`You do not have ${action} access to this client and service`);
  if (!['company', 'branch', 'assigned'].includes(scope.kind)) throw p.error();
  const client = await Customer.findOne({ _id: customerId, ...(scope.kind === 'branch' ? { branchId: scope.branchId } : {}) }).select('_id name').lean();
  if (!client) throw p.error('Client not found', 404);
  return { customerId, service, client };
}
function resources(ctx) {
  const aliases = { 'Google Ads': ['Google Ads', 'Google Ads Management'], 'Meta Ads': ['Meta Ads', 'Facebook Ads', 'Meta Ads Management'], 'Social Media': ['Social Media', 'Social Media Marketing', 'Social Media Management', 'Poster', 'Reel'] };
  return {
    work: { model: Work, filter: { customer: ctx.customerId, workType: { $in: aliases[ctx.service] } }, select: '_id title description status dueDate priority updatedAt approvalStatus' },
    ...(ctx.service === 'Social Media' ? { content: { model: ContentItem, filter: { customerId: ctx.customerId, contentType: { $nin: ['Ad Creative', 'Blog', 'GMB Post'] }, platforms: { $nin: ['Google Business', 'Website', 'Other'] } }, select: '_id title caption status contentType platforms scheduledFor approvalStatus publishStatus updatedAt creativeProjectId' } } : { campaign: { model: AdCampaign, filter: { customerId: ctx.customerId, platform: ctx.service === 'Google Ads' ? 'Google' : 'Meta' }, select: '_id campaignName status objective budget promotedOffer updatedAt version dispatchLockAt metaCampaignId' } }),
  };
}
async function records(ctx) {
  const groups = await Promise.all(Object.entries(resources(ctx)).map(async ([kind, spec]) => (await spec.model.find(spec.filter).select(spec.select).sort({ updatedAt: -1 }).limit(1000).lean()).map(item => ({ ...item, kind }))));
  return groups.flat();
}
async function record(req, action) {
  const ctx = await context(req, action);
  const spec = resources(ctx)[req.params.kind];
  if (!spec || !/^[a-f\d]{24}$/i.test(req.params.id || '')) throw p.error('Record not found', 404);
  const filter = { ...spec.filter, _id: req.params.id };
  const item = await spec.model.findOne(filter).select(spec.select).lean();
  if (!item) throw p.error('Record not found', 404);
  return { ctx, spec, filter, item };
}
function versionFilter(req, filter) {
  const stamp = req.body.version;
  if (typeof stamp !== 'string' || !Number.isFinite(Date.parse(stamp))) throw p.error('Refresh the record before changing it', 400);
  return { ...filter, updatedAt: new Date(stamp) };
}
async function save(spec, filter, changes, increment) {
  const item = await spec.model.findOneAndUpdate(filter, { $set: changes, ...(increment ? { $inc: increment } : {}) }, { returnDocument: 'after', runValidators: true }).select(spec.select).lean();
  if (!item) throw p.error('This record changed. Refresh before trying again.', 409);
  return item;
}
async function audit(req, ctx, item, action) {
  await require('../models/AuditLog').create({ actorType: p.scope(req.user).kind === 'company' ? 'Admin' : p.scope(req.user).kind === 'branch' ? 'Manager' : 'Employee', actorId: req.user._id, actorName: req.user.name, action: `SERVICE_${action.toUpperCase()}`, entityType: req.params.kind || 'Export', entityId: item?._id || ctx.client._id, customerId: ctx.customerId, details: `${ctx.service}: ${action}` }).catch(error => console.error('[Service audit]', error.message));
}
router.get('/records', async (req, res, next) => {
  try { const ctx = await context(req, 'view'); res.json({ success: true, client: ctx.client, service: ctx.service, items: await records(ctx), publishAvailable: ctx.service !== 'Google Ads' }); }
  catch (error) { next(error); }
});
router.get('/export', async (req, res, next) => {
  try {
    const ctx = await context(req, 'export');
    const items = await records(ctx);
    const cell = value => { let text = String(value ?? ''); if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`; };
    const rows = [['Client', 'Service', 'Kind', 'Name', 'Status', 'Due / scheduled date'], ...items.map(item => [ctx.client.name, ctx.service, item.kind, item.title || item.campaignName, item.status, item.dueDate || item.scheduledFor || ''])];
    await audit(req, ctx, null, 'export');
    res.type('text/csv').attachment('assigned-service-records.csv').send(rows.map(row => row.map(cell).join(',')).join('\r\n'));
  } catch (error) { next(error); }
});
router.patch('/records/:kind/:id', async (req, res, next) => {
  try {
    const { ctx, spec, filter, item } = await record(req, 'edit');
    const changes = req.body.changes;
    const allowed = req.params.kind === 'campaign' ? ['campaignName', 'promotedOffer', 'dailyBudget'] : req.params.kind === 'content' ? ['title', 'caption'] : ['title', 'description', 'dueDate', 'status'];
    if (!changes || !Object.keys(changes).length || Object.keys(changes).some(key => !allowed.includes(key))) throw p.error('One or more fields cannot be edited here', 400);
    if (Object.values(changes).some(value => typeof value !== 'string')) throw p.error('Use text values for these fields', 400);
    if (changes.status && !['Pending', 'Not Started', 'In Progress', 'Review', 'Revision'].includes(changes.status)) throw p.error('Approval and completion cannot be set with Edit permission', 400);
    if (changes.dueDate && !Number.isFinite(Date.parse(changes.dueDate))) throw p.error('Invalid due date', 400);
    if (['Scheduled', 'Publishing', 'Published', 'Live', 'Active'].includes(item.status) || item.dispatchLockAt || item.metaCampaignId) throw p.error('Live or scheduled records must be managed by an administrator', 409);
    const updates = { ...changes, ...(changes.dueDate === '' ? { dueDate: null } : {}) };
    if (changes.dailyBudget !== undefined) {
      const amount = Number(changes.dailyBudget);
      if (!Number.isFinite(amount) || amount <= 0) throw p.error('Daily budget must be positive', 400);
      delete updates.dailyBudget; updates.budget = { ...item.budget, amount };
    }
    if (req.params.kind === 'campaign') updates.status = 'Pending Approval';
    if (req.params.kind === 'content') Object.assign(updates, { status: 'Draft', approvalStatus: 'Not Submitted', approvedBy: null, approvedAt: null });
    if (req.params.kind === 'work' && (item.status === 'Approved' || item.approvalStatus === 'Approved')) Object.assign(updates, { status: changes.status || 'Review', approvalStatus: 'Pending Approval', approvedBy: null, approvedAt: null });
    const updated = await save(spec, versionFilter(req, filter), updates, req.params.kind === 'campaign' ? { version: 1 } : undefined);
    await audit(req, ctx, updated, 'edit'); res.json({ success: true, item: updated });
  } catch (error) { next(error); }
});
router.post('/records/:kind/:id/approve', async (req, res, next) => {
  try {
    const { ctx, spec, filter, item } = await record(req, 'approve');
    if (item.dispatchLockAt || item.metaCampaignId || ['Scheduled', 'Publishing', 'Published', 'Live', 'Active', 'Completed', 'Archived'].includes(item.status)) throw p.error('This record cannot be approved in its current state', 409);
    const updated = await save(spec, versionFilter(req, filter), req.params.kind === 'campaign' ? { status: 'Approved' } : { status: 'Approved', approvalStatus: 'Approved', approvedBy: req.user._id, approvedAt: new Date() });
    await audit(req, ctx, updated, 'approve'); res.json({ success: true, item: updated });
  } catch (error) { next(error); }
});
router.post('/records/:kind/:id/publish', async (req, res, next) => {
  try {
    const { ctx, item } = await record(req, 'publish');
    if (req.body.version !== new Date(item.updatedAt).toISOString()) throw p.error('Refresh before publishing', 409);
    if (req.params.kind === 'work') throw p.error('Work items are not publishable', 400);
    if (ctx.service === 'Google Ads') throw p.error('Google Ads publishing is not supported by the current dispatch integration', 501);
    if (item.status !== 'Approved' || (req.params.kind === 'content' && item.approvalStatus !== 'Approved')) throw p.error('An approver must approve the current record before publishing', 409);
    let result;
    if (req.params.kind === 'content') {
      result = await require('../services/schedulerService').scheduleContentPublish({ contentItemId: item._id, scheduledFor: req.body.scheduledFor, user: req.user, timezone: 'Asia/Kolkata', requireApproved: true, expectedUpdatedAt: req.body.version });
    } else {
      // Employees can create paused platform objects. Activation remains an admin operation.
      result = await require('../services/safeMetaCampaignService').dispatchCampaign(String(item._id), { activate: false, expectedUpdatedAt: req.body.version });
    }
    await audit(req, ctx, item, 'publish'); res.json({ success: true, message: req.params.kind === 'content' ? 'Content schedule saved' : 'Campaign created paused on Meta', schedulerAvailable: result.schedulerAvailable });
  } catch (error) { next(error); }
});
router.use((error, req, res, next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));
module.exports = router;
