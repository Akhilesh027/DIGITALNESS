import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceGrant, serviceNames, serviceActions, serviceRequest } from '@/lib/serviceAccess';

export default function EmployeeServiceAccess({ employeeId, onClose }: { employeeId: string | null; onClose: () => void }) {
  const [summary, setSummary] = useState<any>(null);
  const [grants, setGrants] = useState<ServiceGrant[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setSummary(null); setGrants([]); setError('');
    if (!employeeId) return;
    let active = true;
    serviceRequest(`/service-access/employees/${employeeId}`).then(result => { if (active) { setSummary(result); setGrants(result.employee.serviceGrants || []); } }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [employeeId]);
  const save = async () => {
    setSaving(true); setError('');
    try { await serviceRequest(`/service-access/employees/${employeeId}`, { method: 'PUT', body: JSON.stringify({ grants, version: summary.employee.accessVersion || 0 }) }); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to save access'); }
    finally { setSaving(false); }
  };
  const change = (index: number, patch: Partial<ServiceGrant>) => setGrants(rows => rows.map((row, at) => at === index ? { ...row, ...patch } : row));
  return <Dialog open={Boolean(employeeId)} onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Employee Client and Service Access</DialogTitle></DialogHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!summary && !error && <p>Loading access…</p>}
    {summary && <><p className="font-semibold">{summary.employee.name} · {summary.employee.role}</p><p className="text-sm text-muted-foreground">Each row grants access to one client and service. View is required for other actions. Removing every row revokes all employee service access. Administrator and manager roles retain their existing broader role access.</p>
      <div className="space-y-3">{grants.map((grant, index) => <fieldset disabled={saving} className="space-y-3 rounded-lg border p-3" key={index}><legend className="px-1 text-sm">Assignment {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Client<select aria-label={`Client ${index + 1}`} className="mt-1 block h-10 w-full rounded border bg-background px-2" value={grant.customerId} onChange={event => change(index, { customerId: event.target.value })}><option value="">Select client</option>{summary.customers.map((client: any) => <option key={client._id} value={client._id}>{client.name || client.companyName}</option>)}</select></label><label className="text-sm">Service<select className="mt-1 block h-10 w-full rounded border bg-background px-2" value={grant.service} onChange={event => change(index, { service: event.target.value })}>{serviceNames.map(service => <option key={service}>{service}</option>)}</select></label></div><div className="flex flex-wrap gap-4">{serviceActions.map(action => <label key={action} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={grant.actions.includes(action)} onChange={event => change(index, { actions: event.target.checked ? [...new Set([...grant.actions, 'view', action])] : action === 'view' ? [] : grant.actions.filter(value => value !== action) })} />{action}</label>)}</div><Button variant="outline" size="sm" onClick={() => setGrants(rows => rows.filter((_, at) => at !== index))}>Remove Assignment</Button></fieldset>)}</div>
      {!grants.length && <p className="text-sm">No client or service access assigned.</p>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={saving} onClick={() => setGrants(rows => [...rows, { customerId: '', service: 'Google Ads', actions: ['view'] }])}>Add Assignment</Button><Button disabled={saving || grants.some(row => !row.customerId || !row.actions.includes('view'))} onClick={save}>{saving ? 'Saving…' : 'Save Permissions'}</Button><Button variant="ghost" disabled={saving} onClick={onClose}>Cancel</Button></div></>}
  </DialogContent></Dialog>;
}
