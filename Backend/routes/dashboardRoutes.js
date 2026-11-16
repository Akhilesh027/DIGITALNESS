const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { actionScope, businessDayBounds } = require('../services/dashboardActionPolicy');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Work = require('../models/Work');
const Invoice = require('../models/Invoice');
const Approval = require('../models/ApprovalRequest');
const WorkApproval = require('../models/WorkApproval');
const router = express.Router();
router.use(protect);

router.get('/actions', async (req, res) => {
  const scope = actionScope(req.user);
  if (scope.denied || req.client?._id) return res.status(403).json({ message: 'Staff dashboard access required; managers must have an assigned branch.' });
  try {
    const { start, end } = businessDayBounds();
    const customerIds = scope.kind === 'branch'
      ? await Customer.find({ branchId: scope.branchId }).distinct('_id') : [];
    const customerFilter = scope.kind === 'branch' ? { customer: { $in: customerIds } } : {};
    const leadScope = scope.kind === 'branch' ? { branchId: scope.branchId }
      : scope.kind === 'assigned' ? { assignedTo: scope.userId } : {};
    const workScope = scope.kind === 'assigned' ? { assignedTo: scope.userId } : customerFilter;
    const approvalScope = scope.kind === 'assigned' ? { assignedTo: scope.userId } : customerFilter;
    const owner = value => (Array.isArray(value) ? value : [value]).filter(Boolean).map(v => v.name).filter(Boolean).join(', ') || 'Unassigned';
    const queries = [
      { key: 'followups', label: 'Follow-ups due', path: '/leads', model: Lead,
        filter: { ...leadScope, nextFollowUpDate: { $lt: end, $ne: null }, status: { $nin: ['Own Close', 'Own Loss', 'Converted', 'Lost', 'Won'] } },
        map: x => ({ id: String(x._id), title: x.name, owner: owner(x.assignedTo), date: x.nextFollowUpDate, overdue: new Date(x.nextFollowUpDate) < start }) },
      { key: 'work', label: 'Delayed work', path: '/works', model: Work,
        filter: { ...workScope, dueDate: { $lt: start, $ne: null }, status: { $nin: ['Completed', 'Approved'] } },
        map: x => ({ id: String(x._id), title: x.title, owner: owner(x.assignedTo), date: x.dueDate, overdue: true }) },
      { key: 'workApprovals', label: 'Work approvals', path: '/approvals', model: WorkApproval,
        filter: { ...approvalScope, status: 'Pending Approval' },
        map: x => ({ id: String(x._id), title: x.work?.title || 'Work awaiting review', owner: owner(x.assignedTo), date: x.createdAt, overdue: false }) },
      { key: 'approvals', label: 'Pending approvals', path: '/approvals', model: Approval,
        filter: { ...approvalScope, status: 'WAITING_APPROVAL' },
        map: x => ({ id: String(x._id), title: x.title, owner: owner(x.assignedTo), date: x.createdAt, overdue: false }) },
    ];
    // Financial records are shown only to company administrators and branch managers.
    if (scope.kind !== 'assigned') queries.push({ key: 'invoices', label: 'Overdue invoices', path: '/invoices', model: Invoice,
      filter: { ...customerFilter, dueDate: { $lt: start, $ne: null }, balanceAmount: { $gt: 0 }, paymentStatus: { $nin: ['PAID', 'CANCELLED'] } },
      map: x => ({ id: String(x._id), title: x.invoiceNumber, owner: owner(x.createdBy), date: x.dueDate, overdue: true, balance: x.balanceAmount, currency: x.currency }) });
    const categories = await Promise.all(queries.map(async q => {
      try {
        const sortField = q.key === 'followups' ? 'nextFollowUpDate'
          : ['approvals', 'workApprovals'].includes(q.key) ? 'createdAt' : 'dueDate';
        const query = q.model.find(q.filter).sort({ [sortField]: 1, _id: 1 }).limit(10)
          .populate(q.key === 'invoices' ? 'createdBy' : 'assignedTo', 'name');
        if (q.key === 'workApprovals') query.populate('work', 'title');
        const [records, total] = await Promise.all([query.lean(), q.model.countDocuments(q.filter)]);
        return { key: q.key, label: q.label, path: q.path, total, items: records.map(q.map) };
      } catch (err) {
        console.error(`Dashboard actions: ${q.key}`, err.message);
        return { key: q.key, label: q.label, path: q.path, total: null, items: [], error: 'Unable to load this category. Please retry.' };
      }
    }));
    return res.json({ categories, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Dashboard actions failed', err.message);
    return res.status(500).json({ message: 'Unable to load dashboard actions.' });
  }
});
module.exports = router;

