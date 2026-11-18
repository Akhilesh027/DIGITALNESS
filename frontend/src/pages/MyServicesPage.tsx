import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authHeaders } from '@/api/auth';
import EmployeeClientBrief from '@/components/EmployeeClientBrief';
import { ArrowUpRight, Building2, Layers3, RefreshCw, ShieldCheck, FolderOpen } from 'lucide-react';
import { serviceRequest, useServiceAccess } from '@/lib/serviceAccess';

export default function MyServicesPage() {
  const { access, error: accessError, refresh } = useServiceAccess();
  const [selection, setSelection] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [clientBrief, setClientBrief] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [publish, setPublish] = useState<any>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const request = useRef(0);
  const grants = access?.grants || [];
  const key = (grant: any) => `${grant.customerId}|${grant.service}`;
  const grant = grants.find(row => key(row) === selection);
  useEffect(() => {
    setSelection(current => grants.some(row => key(row) === current) ? current : grants[0] ? key(grants[0]) : '');
  }, [access]);
  const context = grant ? { customerId: grant.customerId, service: grant.service } : null;
  const can = (action: string) => Boolean(grant?.actions.includes('view') && grant.actions.includes(action));
  const load = async () => {
    const attempt = ++request.current;
    setItems([]); setClientBrief(null); setError(''); setBusy(false);
    if (!context) return;
    setBusy(true);
    try { const result = await serviceRequest(`/service-workspace/records?${new URLSearchParams(context)}`); if (attempt === request.current) { setItems(result.items); setClientBrief(result.client); } }
    catch (error) { if (attempt === request.current) setError(error instanceof Error ? error.message : 'Unable to load records'); }
    finally { if (attempt === request.current) setBusy(false); }
  };
  useEffect(() => { setEditing(null); setPublish(null); load(); return () => { request.current++; }; }, [selection, access?.version]);
  const action = async (item: any, operation: string) => {
    if (!context) return;
    setBusy(true); setError('');
    try {
      await serviceRequest(`/service-workspace/records/${item.kind}/${item._id}${operation === 'edit' ? '' : `/${operation}`}`, { method: operation === 'edit' ? 'PATCH' : 'POST', body: JSON.stringify({ ...context, version: item.updatedAt, ...(operation === 'edit' ? { changes } : {}), ...(operation === 'publish' && item.kind === 'content' ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}) }) });
      setEditing(null); setPublish(null); await load();
    } catch (error) { setError(error instanceof Error ? error.message : 'Action failed'); }
    finally { setBusy(false); }
  };
  const exportRecords = async () => {
    if (!context) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api'}/service-workspace/export?${new URLSearchParams(context)}`, { headers: authHeaders() });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Export failed'); }
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = 'assigned-service-records.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (error) { setError(error instanceof Error ? error.message : 'Export failed'); }
    finally { setBusy(false); }
  };
  const edit = (item: any) => {
    setEditing(item); setPublish(null);
    setChanges(item.kind === 'campaign' ? { campaignName: item.campaignName || '', promotedOffer: item.promotedOffer || '', dailyBudget: String(item.budget?.amount || '') } : item.kind === 'content' ? { title: item.title || '', caption: item.caption || '' } : { title: item.title || '', description: item.description || '', dueDate: item.dueDate?.slice(0, 10) || '' });
  };
  return <div className="mx-auto max-w-7xl space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Clients & services</h1><p className="mt-2 text-sm text-muted-foreground">Your client briefs, brand references, campaigns and content.</p></div><Button variant="outline" disabled={busy} onClick={async () => { await refresh(); await load(); }}><RefreshCw className="mr-2 h-4 w-4" />Refresh Access</Button></div>
    <div className="grid gap-4 sm:grid-cols-3">{[
      { label: 'Assigned clients', value: new Set(grants.map(row => row.customerId)).size, Icon: Building2, color: 'bg-blue-500/10 text-blue-500' },
      { label: 'Service assignments', value: grants.length, Icon: Layers3, color: 'bg-violet-500/10 text-violet-500' },
      { label: 'Available actions', value: new Set(grants.flatMap(row => row.actions)).size, Icon: ShieldCheck, color: 'bg-emerald-500/10 text-emerald-500' },
    ].map(({ label, value, Icon, color }) => <div key={label} className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon className="h-6 w-6" /></div></div>)}</div>
    {accessError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{accessError}</p>}
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">My clients & services</h2><p className="mt-1 text-sm text-muted-foreground">Select an assignment to view your work.</p></div>
    {!grants.length ? <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center"><div className="mb-5 rounded-2xl bg-primary/5 p-5"><FolderOpen className="h-9 w-9 text-primary" /></div><h3 className="text-xl font-semibold">Your workspace is ready</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your assigned clients and services will appear here. Ask your administrator to add your assignments from Employees → Access, then refresh your access.</p><span className="mt-5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">Awaiting assignments</span></div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{grants.map(row => <button type="button" key={key(row)} onClick={() => setSelection(key(row))} aria-pressed={key(row) === selection} className={`rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary/40 ${key(row) === selection ? 'border-primary ring-1 ring-primary/20' : ''}`}><div className="flex items-center justify-between"><div className="rounded-lg bg-primary/5 p-2.5"><Building2 className="h-5 w-5 text-primary" /></div><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div><p className="mt-4 truncate font-semibold">{access?.customers.find(client => client._id === row.customerId)?.name || 'Assigned client'}</p><p className="mt-1 text-sm text-muted-foreground">{row.service}</p><div className="mt-4 flex flex-wrap gap-1.5">{row.actions.map(action => <span key={action} className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium capitalize text-secondary-foreground">{action}</span>)}</div></button>)}</div>}
    </section>
    {grant && <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"><div><h2 className="text-lg font-semibold">Assigned work</h2><p className="mt-1 text-xs text-muted-foreground">{grant.service} · Up to 1,000 records per type. Changes to approved content require approval again.{grant.service === 'Google Ads' && ' Google Ads publishing is unavailable.'}</p></div>{can('export') && <Button disabled={busy} variant="outline" onClick={exportRecords}>Export CSV</Button>}</div>}
    {grant && <EmployeeClientBrief client={clientBrief} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{busy && <p aria-live="polite">Loading…</p>}
    {grant && !busy && !items.length && !error && <div className="rounded-2xl border bg-card p-10 text-center"><FolderOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><h3 className="font-semibold">No work records yet</h3><p className="mt-2 text-sm text-muted-foreground">Work and campaigns for this assignment will appear here.</p></div>}
    <div className="grid gap-4 md:grid-cols-2">{items.map(item => <article className="space-y-3 rounded-xl border bg-card p-4" key={`${item.kind}-${item._id}`}><div><p className="text-xs uppercase text-muted-foreground">{item.kind} · {item.status}</p><h2 className="font-semibold">{item.title || item.campaignName}</h2></div>{item.description && <p className="whitespace-pre-wrap text-sm">{item.description}</p>}{item.caption && <p className="whitespace-pre-wrap text-sm">{item.caption}</p>}{item.promotedOffer && <p className="text-sm">Offer: {item.promotedOffer}</p>}
      <div className="flex flex-wrap gap-2">{can('edit') && !['Scheduled', 'Publishing', 'Published', 'Live', 'Active'].includes(item.status) && !item.dispatchLockAt && !item.metaCampaignId && <Button size="sm" variant="outline" disabled={busy} onClick={() => edit(item)}>Edit</Button>}{can('approve') && !['Approved', 'Scheduled', 'Publishing', 'Published', 'Live', 'Active', 'Completed', 'Archived'].includes(item.status) && <Button size="sm" disabled={busy} onClick={() => action(item, 'approve')}>Approve</Button>}{can('publish') && item.kind !== 'work' && item.status === 'Approved' && grant?.service !== 'Google Ads' && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(null); setPublish(item); setScheduledFor(''); }}>{item.kind === 'campaign' ? 'Create Paused on Meta' : 'Schedule Publication'}</Button>}</div>
      {editing?._id === item._id && <div className="space-y-3 border-t pt-3">{Object.entries(changes).map(([field, value]) => <label className="block text-sm" key={field}>{field === 'campaignName' ? 'Campaign name' : field === 'promotedOffer' ? 'Offer' : field === 'dailyBudget' ? 'Daily budget' : field === 'dueDate' ? 'Due date' : field}<Input className="mt-1" type={field === 'dueDate' ? 'date' : field === 'dailyBudget' ? 'number' : 'text'} value={value} onChange={event => setChanges({ ...changes, [field]: event.target.value })} /></label>)}<Button disabled={busy} onClick={() => action(item, 'edit')}>Save Changes</Button><Button variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button></div>}
      {publish?._id === item._id && <div className="space-y-3 border-t pt-3"><p className="text-sm">{item.kind === 'campaign' ? 'This creates paused objects on Meta. It does not activate ad spending.' : 'Choose a future publish time in your local timezone. The content and attached creative must already be approved.'}</p>{item.kind === 'content' && <Input aria-label="Publish date and time" type="datetime-local" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} />}<Button disabled={busy || (item.kind === 'content' && (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()))} onClick={() => action(item, 'publish')}>Confirm</Button><Button variant="ghost" disabled={busy} onClick={() => setPublish(null)}>Cancel</Button></div>}
    </article>)}</div>
  </div>;
}
