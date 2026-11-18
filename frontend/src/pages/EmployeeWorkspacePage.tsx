import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bell, CalendarDays, CheckSquare, ClipboardList, LayoutDashboard, Users, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getCurrentUser } from '@/api/auth';
import { serviceRequest } from '@/lib/serviceAccess';
import { displayDate } from '@/lib/employeeWorkspace';
import EmployeeAssignedWork from '@/components/EmployeeAssignedWork';
import MyServicesPage from './MyServicesPage';
import EmployeeAttendance from '@/components/EmployeeAttendance';
import AttendanceStatusBanner from '@/components/AttendanceStatusBanner';

export const employeeViews = [
  { id: 'today', label: 'My day', Icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks & works', Icon: CheckSquare },
  { id: 'clients', label: 'Clients & services', Icon: Users },
  { id: 'daily', label: 'Daily update', Icon: ClipboardList },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'profile', label: 'Attendance & profile', Icon: UserRound },
];
export default function EmployeeWorkspacePage() {
  const [params] = useSearchParams();
  const view = params.get('view') || 'today';
  return <div className="mx-auto max-w-7xl space-y-6"><nav aria-label="Employee pages" className="flex gap-2 overflow-x-auto pb-2 md:hidden">{employeeViews.map(({ id, label }) => <Link key={id} to={`/my-services?view=${id}`} aria-current={view === id ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${view === id ? 'bg-primary text-primary-foreground' : 'border bg-card'}`}>{label}</Link>)}</nav>
    {(view === 'today') && <AttendanceStatusBanner />}
    {view === 'clients' ? <MyServicesPage /> : view === 'daily' ? <DailySummary /> : view === 'notifications' ? <EmployeeNotifications /> : view === 'profile' ? <EmployeeProfile /> : <EmployeeAssignedWork key={view} dashboard={view !== 'tasks'} />}
  </div>;
}
function DailySummary() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ workCompleted: '', pendingWork: '', blockers: '', tomorrowPlan: '', totalHours: '' });
  useEffect(() => {
    let active = true;
    setLoading(true);
    serviceRequest('/service-workspace/daily-updates').then(data => { if (active) setItems(data.items); })
      .catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await serviceRequest('/service-workspace/daily-updates', { method: 'POST', body: JSON.stringify(form) });
      setForm({ workCompleted: '', pendingWork: '', blockers: '', tomorrowPlan: '', totalHours: '' });
      setNotice('Daily summary submitted for manager review.'); setReload(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to submit summary'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5"><div><h1 className="text-2xl font-bold">Daily update</h1><p className="mt-2 text-sm text-muted-foreground">Share what you completed, what is pending and where you need help.</p></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}<div className="grid gap-6 xl:grid-cols-2"><form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5"><p className="text-sm font-semibold">Today · {displayDate(new Date().toISOString())}</p>{[['workCompleted', 'What did you complete?'], ['pendingWork', 'What is still pending?'], ['blockers', 'Blockers or help needed'], ['tomorrowPlan', 'Plan for the next working day']].map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<Textarea className="mt-2" required={key === 'workCompleted'} maxLength={10000} disabled={busy} value={form[key as keyof typeof form]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></label>)}<label className="block text-sm font-medium">Total hours worked<Input required className="mt-2" type="number" min="0" max="24" step="0.25" disabled={busy} value={form.totalHours} onChange={event => setForm({ ...form, totalHours: event.target.value })} /></label><p className="text-xs text-muted-foreground">This summary does not change task status or add time to individual tasks.</p><Button disabled={busy || !form.workCompleted.trim()}>{busy ? 'Submitting…' : 'Submit daily update'}</Button></form><div className="space-y-3"><h2 className="font-semibold">Recent summaries</h2>{loading && <p role="status" className="text-sm text-muted-foreground">Loading summaries…</p>}{!loading && !items.length && <p className="text-sm text-muted-foreground">Your submitted summaries will appear here.</p>}{items.map(item => <article key={item._id} className="space-y-2 rounded-xl border bg-card p-4"><div className="flex flex-wrap justify-between gap-2 text-sm font-medium"><span>{displayDate(item.date)} · {item.totalHours} hours</span><span>{item.approvalStatus}</span></div><p className="whitespace-pre-wrap break-words text-sm">{item.workCompleted}</p>{item.pendingWork && <p className="whitespace-pre-wrap text-sm text-muted-foreground">Pending: {item.pendingWork}</p>}{item.blockers && <p className="whitespace-pre-wrap text-sm text-amber-700 dark:text-amber-300">Blockers: {item.blockers}</p>}{item.tomorrowPlan && <p className="whitespace-pre-wrap text-sm text-muted-foreground">Next: {item.tomorrowPlan}</p>}{(item.managerComment || item.revisionReason) && <p className="rounded-lg bg-secondary p-3 text-sm">Manager feedback: {item.managerComment || item.revisionReason}</p>}</article>)}</div></div></section>;
}
function EmployeeNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    serviceRequest('/notifications').then(data => { if (active) setItems(data.data || []); })
      .catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  async function markRead(id?: string) {
    setBusy(true); setError('');
    try { await serviceRequest(`/notifications/${id ? `${id}/read` : 'read-all'}`, { method: 'PATCH' }); setReload(value => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to update notification'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-2 text-sm text-muted-foreground">Assignments, feedback and updates shared with you.</p></div><div className="flex gap-2"><Button variant="outline" disabled={loading || busy} onClick={() => setReload(value => value + 1)}>Refresh</Button><Button disabled={busy || !items.some(item => !item.isRead)} onClick={() => markRead()}>Mark all read</Button></div></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{loading ? <p role="status">Loading notifications…</p> : !items.length ? <p className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No notifications yet.</p> : items.map(item => <article key={item._id} className={`space-y-2 rounded-xl border bg-card p-5 ${!item.isRead ? 'border-l-4 border-l-primary' : ''}`}><div className="flex justify-between gap-3"><h2 className="font-semibold">{item.title}</h2>{!item.isRead && <Button size="sm" variant="ghost" disabled={busy} onClick={() => markRead(item._id)}>Mark read</Button>}</div><p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p><p className="text-xs text-muted-foreground">{displayDate(item.createdAt)}</p><Link to="/my-services?view=tasks" className="inline-block text-sm font-medium text-primary">Go to my work →</Link></article>)}</section>;
}
function EmployeeProfile() {
  const user = getCurrentUser();
  return <section className="space-y-6"><h1 className="text-2xl font-bold">Attendance & profile</h1><div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">{[['Name', user?.name], ['Role', user?.role], ['Email', user?.email]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold">{value || 'Not provided'}</p></div>)}</div><EmployeeAttendance /></section>;
}
