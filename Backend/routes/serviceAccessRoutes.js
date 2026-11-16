const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Customer = require('../models/Customer');
const policy = require('../services/servicePermissions');
router.use(protect);
router.get('/me', async (req, res, next) => {
  try {
    if (req.user.role === 'Client') throw policy.error();
    const grants = req.user.serviceGrants || [];
    const customers = await Customer.find({ _id: { $in: grants.map(grant => grant.customerId) } }).select('_id name companyName').lean();
    res.json({ success: true, mode: policy.scope(req.user).kind, grants, customers, version: req.user.accessVersion || 0 });
  } catch (error) { next(error); }
});
router.use(policy.requireAdmin);
router.get('/employees/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name role serviceGrants accessVersion').lean();
    if (!user) throw policy.error('Employee not found', 404);
    const customers = await Customer.find({}).select('_id name companyName branchId').sort({ name: 1 }).lean();
    res.json({ success: true, employee: user, customers, services: policy.SERVICES, actions: policy.ACTIONS });
  } catch (error) { next(error); }
});
router.put('/employees/:id', async (req, res, next) => {
  try {
    const grants = policy.validateGrants(req.body.grants);
    const version = req.body.version;
    if (!Number.isInteger(version) || version < 0) throw policy.error('Reload the access summary before saving', 400);
    const ids = [...new Set(grants.map(grant => grant.customerId))];
    if (await Customer.countDocuments({ _id: { $in: ids } }) !== ids.length) throw policy.error('One or more selected clients no longer exist', 400);
    const user = await User.findOneAndUpdate({ _id: req.params.id, $or: [{ accessVersion: version }, ...(version === 0 ? [{ accessVersion: { $exists: false } }] : [])] }, { $set: { serviceGrants: grants }, $inc: { accessVersion: 1 } }, { returnDocument: 'after', runValidators: true }).select('name role serviceGrants accessVersion');
    if (!user) throw policy.error('Employee access changed or the employee was removed. Reload and try again.', 409);
    await require('../models/AuditLog').create({ actorType: 'Admin', actorId: req.user._id, actorName: req.user.name, action: 'EMPLOYEE_SERVICE_ACCESS_UPDATED', entityType: 'User', entityId: user._id, details: JSON.stringify(grants) }).catch(error => console.error('[Access audit]', error.message));
    res.json({ success: true, employee: user });
  } catch (error) { next(error); }
});
router.use((error, req, res, next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));
module.exports = router;
