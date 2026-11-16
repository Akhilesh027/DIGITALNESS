const invalid = (message) => Object.assign(new Error(message), { statusCode: 400 });

// DailyUpdate dates are normalized to midnight by the model. Use the same
// server-local boundaries here, including the whole final day.
function periodFor(type, query = {}, now = new Date()) {
  if (query.month || query.year) {
    const month = Number(query.month), year = Number(query.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1000 || year > 9999) throw invalid('Invalid report month or year');
    query = { ...query, fromDate: `${year}-${String(month).padStart(2, '0')}-01`, toDate: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}` };
  }
  const parse = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw invalid('Use YYYY-MM-DD dates');
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw invalid('Invalid report date');
    return date;
  };
  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const end = query.toDate ? parse(query.toDate) : parse(format(now));
  const start = query.fromDate ? parse(query.fromDate) : new Date(end);
  if (!query.fromDate) {
    if (type === 'weekly') start.setDate(start.getDate() - 6);
    if (type === 'monthly') start.setDate(1);
  }
  if (start > end) throw invalid('From date must be on or before To date');
  return { fromDate: format(start), toDate: format(end) };
}

function buildActivityReport(type, customer, period, updates) {
  const rows = updates.map((update) => ({
    date: update.date,
    task: update.taskTitle || update.work?.title || 'Untitled task',
    employee: update.employee?.name || 'Unassigned',
    status: update.currentStatus || 'Not set',
    approval: update.approvalStatus || 'Pending',
    hours: Number(update.totalHours || 0),
    completed: update.workCompleted || '',
    pending: update.pendingWork || '',
    blockers: update.blockers || '',
    next: update.tomorrowPlan || '',
  }));
  return {
    type, period,
    customer: { id: String(customer._id), name: customer.name || customer.companyName || 'Client' },
    generatedAt: new Date().toISOString(),
    empty: rows.length === 0,
    summary: {
      updates: rows.length,
      completedUpdates: rows.filter(row => row.status === 'Completed').length,
      pendingApprovals: rows.filter(row => row.approval === 'Pending').length,
      blockedUpdates: rows.filter(row => row.status === 'Blocked' || row.blockers.trim()).length,
      hours: Math.round(rows.reduce((sum, row) => sum + row.hours, 0) * 100) / 100,
    },
    rows,
  };
}
module.exports = { periodFor, buildActivityReport };
