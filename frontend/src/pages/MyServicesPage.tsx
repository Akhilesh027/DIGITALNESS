import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authHeaders } from '@/api/auth';
import { serviceRequest, useServiceAccess } from '@/lib/serviceAccess';

export default function MyServicesPage() {
  const { access, refresh } = useServiceAccess();
  const [selection, setSelection] = useState('');
  const [items, setItems] = useState<any[]>([]);
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
  const context = grant ? { customerId: grant.customerId, service: grant.service } : null;
  const can = (action: string) => Boolean(grant?.actions.includes('view') && grant.actions.includes(action));
  const load = async () => {
    const attempt = ++request.current;
    setItems([]); setError(''); setBusy(false);
    if (!context) return;
    setBusy(true);
    try { const result = await serviceRequest(`/service-workspace/records?${new URLSearchParams(context)}`); if (attempt === request.current) setItems(result.items); }
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
  return <div className="mx-auto max-w-6xl space-y-5"><h1 className="text-2xl font-bold">My Clients and Services</h1><p className="text-sm text-muted-foreground">Your administrator controls which clients, services, and actions are available. Editing an approved campaign or post sends it back for approval.</p>
    {!grants.length && <p className="rounded-lg border p-4">No services are assigned. Ask your administrator to assign a client and service.</p>}
    <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm">Client and Service<select disabled={busy} className="mt-1 block h-10 w-full rounded border bg-background px-2" value={grant ? selection : ''} onChange={event => setSelection(event.target.value)}><option value="">Choose an assignment</option>{grants.map(row => <option key={key(row)} value={key(row)}>{access?.customers.find(client => client._id === row.customerId)?.name || 'Assigned client'} · {row.service}</option>)}</select></label><Button variant="outline" disabled={busy} onClick={async () => { await refresh(); await load(); }}>Refresh Access</Button>{can('export') && <Button disabled={busy} onClick={exportRecords}>Export CSV</Button>}</div>
    {grant && <p className="text-sm">Allowed actions: {grant.actions.join(', ')}. Showing up to 1,000 records of each type.{grant.service === 'Google Ads' && ' Google Ads publishing is not supported by the current integration.'}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{busy && <p aria-live="polite">Loading…</p>}
    {grant && !busy && !items.length && !error && <p>No work or campaign records for this assignment.</p>}
    <div className="grid gap-4 md:grid-cols-2">{items.map(item => <article className="space-y-3 rounded-xl border bg-card p-4" key={`${item.kind}-${item._id}`}><div><p className="text-xs uppercase text-muted-foreground">{item.kind} · {item.status}</p><h2 className="font-semibold">{item.title || item.campaignName}</h2></div>{item.description && <p className="whitespace-pre-wrap text-sm">{item.description}</p>}{item.caption && <p className="whitespace-pre-wrap text-sm">{item.caption}</p>}{item.promotedOffer && <p className="text-sm">Offer: {item.promotedOffer}</p>}
      <div className="flex flex-wrap gap-2">{can('edit') && !['Scheduled', 'Publishing', 'Published', 'Live', 'Active'].includes(item.status) && !item.dispatchLockAt && !item.metaCampaignId && <Button size="sm" variant="outline" disabled={busy} onClick={() => edit(item)}>Edit</Button>}{can('approve') && !['Approved', 'Scheduled', 'Publishing', 'Published', 'Live', 'Active', 'Completed', 'Archived'].includes(item.status) && <Button size="sm" disabled={busy} onClick={() => action(item, 'approve')}>Approve</Button>}{can('publish') && item.kind !== 'work' && item.status === 'Approved' && grant?.service !== 'Google Ads' && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(null); setPublish(item); setScheduledFor(''); }}>{item.kind === 'campaign' ? 'Create Paused on Meta' : 'Schedule Publication'}</Button>}</div>
      {editing?._id === item._id && <div className="space-y-3 border-t pt-3">{Object.entries(changes).map(([field, value]) => <label className="block text-sm" key={field}>{field === 'campaignName' ? 'Campaign name' : field === 'promotedOffer' ? 'Offer' : field === 'dailyBudget' ? 'Daily budget' : field === 'dueDate' ? 'Due date' : field}<Input className="mt-1" type={field === 'dueDate' ? 'date' : field === 'dailyBudget' ? 'number' : 'text'} value={value} onChange={event => setChanges({ ...changes, [field]: event.target.value })} /></label>)}<Button disabled={busy} onClick={() => action(item, 'edit')}>Save Changes</Button><Button variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button></div>}
      {publish?._id === item._id && <div className="space-y-3 border-t pt-3"><p className="text-sm">{item.kind === 'campaign' ? 'This creates paused objects on Meta. It does not activate ad spending.' : 'Choose a future publish time in your local timezone. The content and attached creative must already be approved.'}</p>{item.kind === 'content' && <Input aria-label="Publish date and time" type="datetime-local" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} />}<Button disabled={busy || (item.kind === 'content' && (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()))} onClick={() => action(item, 'publish')}>Confirm</Button><Button variant="ghost" disabled={busy} onClick={() => setPublish(null)}>Cancel</Button></div>}
    </article>)}</div>
  </div>;
}
