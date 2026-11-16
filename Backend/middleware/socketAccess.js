const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { scope } = require('../services/servicePermissions');
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digitalnesscrmsecret');
    if (decoded.type === 'client' || decoded.role === 'Client') return next(new Error('Customer-wide event subscriptions require a staff management role'));
    const user = await User.findById(decoded.id || decoded._id || decoded.userId).select('_id role status branchId');
    if (!user || user.status !== 'Active' || !['company', 'branch'].includes(scope(user).kind)) return next(new Error('Customer-wide event subscriptions require a management role'));
    socket.data.userId = user._id;
    next();
  } catch { next(new Error('Authentication failed')); }
}
async function joinCustomer(socket, customerId) {
  if (!/^[a-f\d]{24}$/i.test(String(customerId))) return false;
  const user = await User.findById(socket.data.userId).select('_id role status branchId');
  if (!user || user.status !== 'Active') return false;
  const access = scope(user);
  if (!['company', 'branch'].includes(access.kind)) return false;
  const customer = await Customer.findOne({ _id: customerId, ...(access.kind === 'branch' ? { branchId: access.branchId } : {}) }).select('_id').lean();
  if (!customer) return false;
  await socket.join(`customer_${customerId}`);
  return true;
}
module.exports = { authenticateSocket, joinCustomer };
