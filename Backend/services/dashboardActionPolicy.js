const ADMIN_ROLES = new Set(['admin', 'super admin', 'superadmin', 'owner', 'system owner', 'managing director', 'administrator', 'founder']);
const MANAGER_ROLES = new Set(['operational manager', 'branch manager', 'manager', 'operations manager']);

function actionScope(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  if (!user?._id || role === 'client') return { denied: true };
  if (ADMIN_ROLES.has(role)) return { kind: 'company' };
  if (MANAGER_ROLES.has(role)) return user.branchId ? { kind: 'branch', branchId: user.branchId } : { denied: true };
  return { kind: 'assigned', userId: user._id };
}

// CRM date-only deadlines are evaluated in the agency's business timezone.
function businessDayBounds(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const start = new Date(`${day}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 86400000) };
}

module.exports = { actionScope, businessDayBounds };
