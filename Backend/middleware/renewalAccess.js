const Customer = require('../models/Customer');
async function renewalAccess(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const role = String(req.user?.role || '').toLowerCase();
    const allowed = role === 'admin' || (['operational manager', 'branch manager'].includes(role) && String(customer.branchId) === String(req.user.branchId));
    if (!allowed) return res.status(403).json({ success: false, message: 'Only an authorized administrator or manager can manage renewals' });
    next();
  } catch (error) { next(error); }
}
module.exports = renewalAccess;
