const { actionScope } = require('./dashboardActionPolicy');
const SERVICES = ['Google Ads', 'Meta Ads', 'Social Media'];
const ACTIONS = ['view', 'edit', 'approve', 'publish', 'export'];
const id = value => String(value?._id || value || '');
const error = (message = 'Access denied', statusCode = 403) => Object.assign(new Error(message), { statusCode });
const scope = user => actionScope(user);
const employee = user => scope(user).kind === 'assigned';
function permitted(user, customerId, service, action) {
  if (user?.status === 'Inactive' || !SERVICES.includes(service) || !ACTIONS.includes(action)) return false;
  return (user?.serviceGrants || []).some(grant => id(grant.customerId) === id(customerId) && grant.service === service && grant.actions.includes('view') && grant.actions.includes(action));
}
function validateGrants(grants) {
  if (!Array.isArray(grants) || grants.length > 300) throw error('Provide at most 300 client/service assignments', 400);
  const seen = new Set();
  return grants.map(grant => {
    if (!grant || Object.keys(grant).some(key => !['customerId', 'service', 'actions'].includes(key)) || !/^[a-f\d]{24}$/i.test(grant.customerId || '') || !SERVICES.includes(grant.service) || !Array.isArray(grant.actions) || !grant.actions.length || grant.actions.some(action => !ACTIONS.includes(action)) || !grant.actions.includes('view')) throw error('Each assignment needs a valid client, service, and View permission', 400);
    const customerId = grant.customerId.toLowerCase();
    const key = `${customerId}:${grant.service}`;
    if (seen.has(key)) throw error('Duplicate client/service assignment', 400);
    seen.add(key);
    return { customerId, service: grant.service, actions: [...new Set(grant.actions)] };
  });
}
function requireAdmin(req, res, next) {
  if (scope(req.user).kind !== 'company') return res.status(403).json({ success: false, message: 'Only an administrator can manage employee access' });
  next();
}
// Legacy pages aggregate clients, services and financial information. Employees
// use the scoped workspace instead; an unclassified endpoint fails closed.
function employeeBoundary(req, res, next) {
  if (!employee(req.user)) return next();
  const path = (req.originalUrl || '').split('?')[0].replace(/\/$/, '');
  const method = req.method;
  const own = id(req.user);
  const allowed = path === '/api/service-access/me'
    || (method === 'GET' && ['/api/attendance/clock', '/api/attendance/history', '/api/attendance/corrections'].includes(path))
    || (method === 'POST' && ['/api/attendance/check-in', '/api/attendance/check-out', '/api/attendance/break-start', '/api/attendance/break-end', '/api/attendance/corrections'].includes(path))
    || (method === 'POST' && /^\/api\/attendance\/corrections\/[a-f\d]{24}\/withdraw$/i.test(path))
    || (method === 'GET' && path === '/api/notifications')
    || (method === 'PATCH' && /^\/api\/notifications\/([a-f\d]{24}\/read|read-all)$/i.test(path))
    || path.startsWith('/api/service-workspace/') || path === '/api/service-workspace'
    || (method === 'POST' && ['/api/auth/logout', '/api/users/logout'].includes(path))
    || (method === 'GET' && ['/api/auth', '/api/users', '/api/attendance/my'].includes(path))
    || (['GET', 'PUT'].includes(method) && [`/api/users/${own}`, `/api/auth/${own}`].includes(path));
  if (!allowed) return res.status(403).json({ success: false, code: 'SERVICE_ACCESS_REQUIRED', message: 'Use My Services for your assigned clients and actions' });
  next();
}
module.exports = { SERVICES, ACTIONS, id, error, scope, employee, permitted, validateGrants, requireAdmin, employeeBoundary };
