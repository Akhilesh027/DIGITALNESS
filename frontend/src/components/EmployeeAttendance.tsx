import { useEffect, useState } from 'react';
import { Clock3, Coffee, LogIn, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { serviceRequest } from '@/lib/serviceAccess';
import { AttendanceCorrection, ClockRecord, attendanceDay, attendanceTime, hoursLabel, istInput, liveHours } from '@/lib/attendance';

export default function EmployeeAttendance() {
  const [active, setActive] = useState<ClockRecord | null>(null);
  const [today, setToday] = useState<ClockRecord | null>(null);
  const [history, setHistory] = useState<ClockRecord[]>([]);
  const [requests, setRequests] = useState<AttendanceCorrection[]>([]);
  const [month, setMonth] = useState(attendanceDay().slice(0, 7));
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ dayKey: attendanceDay(), proposedIn: '', proposedOut: '', breakMinutes: '0', reason: '' });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    const refresh = window.setInterval(() => setReload(value => value + 1), 60000);
    return () => { clearInterval(timer); clearInterval(refresh); };
  }, []);
  useEffect(() => {
    let valid = true;
    setLoading(true); setError('');
    Promise.all([serviceRequest('/attendance/clock'), serviceRequest(`/attendance/history?month=${month}`), serviceRequest('/attendance/corrections')]).then(([clock, history, requests]) => {
      if (!valid) return;
      setActive(clock.active); setToday(clock.today); setHistory(history.items); setRequests(requests.items);
      setOffset(new Date(clock.serverTime).getTime() - Date.now());
    }).catch(error => { if (valid) setError(error.message); }).finally(() => { if (valid) setLoading(false); });
    return () => { valid = false; };
  }, [reload, month]);
  async function action(path: string, body: any = {}) {
    setBusy(true); setError(''); setNotice('');
    try {
      await serviceRequest(`/attendance/${path}`, { method: 'POST', body: JSON.stringify(body) });
      setNotice(path === 'check-in' ? 'Checked in. Your work session has started.' : path === 'check-out' ? 'Checked out. Working hours saved.' : path === 'break-start' ? 'Break started. Working time is paused.' : path === 'break-end' ? 'Break ended. Working time has resumed.' : 'Request updated.');
      setReload(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update attendance'); }
    finally { setBusy(false); }
  }
  function requestCorrection(row?: ClockRecord) {
    setForm({ dayKey: row?.dayKey || attendanceDay(), proposedIn: istInput(row?.loginTime), proposedOut: istInput(row?.logoutTime), breakMinutes: String(row?.breakMinutes || 0), reason: '' });
    setFormOpen(true); setNotice('');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await serviceRequest('/attendance/corrections', { method: 'POST', body: JSON.stringify({ ...form, proposedIn: new Date(`${form.proposedIn}:00+05:30`).toISOString(), proposedOut: new Date(`${form.proposedOut}:00+05:30`).toISOString(), breakMinutes: Number(form.breakMinutes) }) });
      setFormOpen(false); setNotice('Correction requested. Your attendance stays unchanged until approval.'); setReload(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to request correction'); }
    finally { setBusy(false); }
  }
  const record = active || (today?.mode === 'Manual' ? today : null);
  const state = active?.clockState || (record ? 'Checked out' : 'Not checked in');
  const paused = active?.breaks?.some(entry => !entry.endedAt);
  return <section className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">My attendance</h2><p className="mt-2 text-sm text-muted-foreground">Check in when work begins. Check out when your workday ends. All times are IST.</p></div><Button size="sm" variant="outline" disabled={busy || loading} onClick={() => setReload(value => value + 1)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
    <div className="rounded-2xl border bg-card p-5"><div className="grid gap-5 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Attendance status</p><p className="mt-2 text-xl font-semibold">{loading && !record ? 'Loading…' : state}</p>{active && <p className="mt-1 text-xs text-muted-foreground">Shift started {active.dayKey}</p>}</div><div><p className="text-xs text-muted-foreground">Net working time</p><p className="mt-2 flex items-center gap-2 text-xl font-semibold"><Clock3 className="h-5 w-5 text-primary" />{record ? hoursLabel(liveHours(record, now + offset)) : '0h 0m'}</p><p className="mt-1 text-xs text-muted-foreground">Excludes breaks · separate from task hours</p></div><div><p className="text-xs text-muted-foreground">Check-in / check-out</p><p className="mt-2 text-sm">{attendanceTime(record?.loginTime)}</p><p className="mt-1 text-sm text-muted-foreground">{attendanceTime(record?.logoutTime)}</p></div></div>
      {active?.clockState === 'Missed checkout' && <p className="mt-5 flex gap-2 rounded-lg bg-amber-500/10 p-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0" />This session has been open for over 18 hours. If you forgot to check out, request a correction using the actual end time.</p>}
      {!record && today?.mode !== 'Manual' && today && <p className="mt-4 text-xs text-muted-foreground">Today has an older automatic attendance record. Checking in starts an explicit work session and retains the original record in the audit history.</p>}
      <div className="mt-5 flex flex-wrap gap-3">{!active && !record ? <Button disabled={busy || loading || Boolean(error)} onClick={() => action('check-in')}><LogIn className="mr-2 h-4 w-4" />Check in</Button> : active ? <><Button variant="outline" disabled={busy || loading} onClick={() => action(paused ? 'break-end' : 'break-start', { revision: active.revision })}><Coffee className="mr-2 h-4 w-4" />{paused ? 'End break' : 'Start break'}</Button><Button disabled={busy || loading} onClick={() => action('check-out', { revision: active.revision })}><LogOut className="mr-2 h-4 w-4" />Check out</Button></> : <p className="text-sm text-muted-foreground">Your workday is closed. Request a correction if the times are wrong.</p>}<Button variant="ghost" disabled={busy || loading} onClick={() => requestCorrection(record || undefined)}>Request correction</Button></div><p className="mt-4 text-xs text-muted-foreground">Signing out or closing the browser does not check you out.</p>
    </div>
    {formOpen && <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5"><h3 className="font-semibold">Attendance correction request</h3><p className="text-sm text-muted-foreground">Use actual times in IST. Overnight checkouts can fall on the next day. Maximum shift length: 24 hours.</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Check-in date<Input required type="date" max={attendanceDay()} value={form.dayKey} disabled={busy} onChange={event => setForm({ ...form, dayKey: event.target.value })} /></label><label className="text-sm">Total break minutes<Input required type="number" min="0" step="1" value={form.breakMinutes} disabled={busy} onChange={event => setForm({ ...form, breakMinutes: event.target.value })} /></label><label className="text-sm">Actual check-in (IST)<Input required type="datetime-local" value={form.proposedIn} disabled={busy} onChange={event => setForm({ ...form, proposedIn: event.target.value })} /></label><label className="text-sm">Actual check-out (IST)<Input required type="datetime-local" value={form.proposedOut} disabled={busy} onChange={event => setForm({ ...form, proposedOut: event.target.value })} /></label></div><label className="block text-sm">Reason<Textarea required maxLength={2000} value={form.reason} disabled={busy} onChange={event => setForm({ ...form, reason: event.target.value })} /></label><div className="flex gap-2"><Button disabled={busy}>{busy ? 'Submitting…' : 'Send for approval'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}
    <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Attendance history</h3><Input aria-label="Attendance month" className="w-auto" type="month" value={month} disabled={busy} onChange={event => { if (event.target.value) setMonth(event.target.value); }} /></div><div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/40"><tr>{['Date', 'State', 'Check in', 'Check out', 'Break', 'Net hours', ''].map((label, index) => <th key={index} className="whitespace-nowrap p-3 font-medium">{label}</th>)}</tr></thead><tbody>{history.map(row => <tr key={row._id} className="border-t"><td className="whitespace-nowrap p-3">{row.dayKey}</td><td className="whitespace-nowrap p-3">{row.clockState}</td><td className="whitespace-nowrap p-3">{attendanceTime(row.loginTime)}</td><td className="whitespace-nowrap p-3">{attendanceTime(row.logoutTime)}</td><td className="p-3">{Math.round(row.breakMinutes || 0)}m</td><td className="whitespace-nowrap p-3">{hoursLabel(row.isOpen ? liveHours(row, now + offset) : row.totalHours)}</td><td className="p-3"><Button variant="ghost" size="sm" disabled={busy} onClick={() => requestCorrection(row)}>Correct</Button></td></tr>)}</tbody></table>{!history.length && <p className="p-6 text-sm text-muted-foreground">{loading ? 'Loading history…' : 'No attendance records for this month.'}</p>}</div></div>
    <div className="space-y-3"><h3 className="font-semibold">My correction requests</h3>{!requests.length && <p className="text-sm text-muted-foreground">No correction requests yet.</p>}{requests.map(request => <article key={request._id} className="space-y-2 rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{request.dayKey} · {request.status}</p>{request.status === 'Pending' && <Button variant="ghost" size="sm" disabled={busy} onClick={() => action(`corrections/${request._id}/withdraw`)}>Withdraw</Button>}</div><p className="text-xs text-muted-foreground">{attendanceTime(request.proposedIn)} → {attendanceTime(request.proposedOut)} · {request.breakMinutes}m break</p><p className="whitespace-pre-wrap text-sm">{request.reason}</p>{request.reviewNote && <p className="whitespace-pre-wrap rounded-lg bg-secondary p-3 text-sm">Manager: {request.reviewNote}</p>}</article>)}</div>
  </section>;
}
