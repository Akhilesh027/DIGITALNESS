import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { serviceRequest } from '@/lib/serviceAccess';
import { displayDate, fileUrl } from '@/lib/employeeWorkspace';

export default function EmployeeSubmissionQueue() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    serviceRequest('/work-approvals?status=Pending+Approval&approvalType=Work').then(data => { if (active) setItems(data.data || []); })
      .catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  async function review(status: string) {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await serviceRequest(`/work-approvals/${selected._id}/review`, { method: 'PUT', body: JSON.stringify({ status, adminRemark: feedback }) });
      setSelected(null); setFeedback(''); setReload(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to review submission'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Employee work submissions</h2><p className="mt-1 text-sm text-muted-foreground">Review deliveries and send feedback to your team.</p></div><Button size="sm" variant="outline" disabled={loading || busy} onClick={() => setReload(value => value + 1)}>Refresh submissions</Button></div>{error && !selected && <p role="alert" className="text-sm text-destructive">{error}</p>}{loading ? <p role="status" className="text-sm text-muted-foreground">Loading employee submissions…</p> : !items.length ? <p className="text-sm text-muted-foreground">No employee submissions awaiting review.</p> : <div className="grid gap-3 md:grid-cols-2">{items.map(item => <button key={item._id} onClick={() => { setSelected(item); setFeedback(''); setError(''); }} className="space-y-2 rounded-xl border p-4 text-left hover:border-primary/40"><h3 className="font-semibold">{item.work?.title || 'Work submission'}</h3><p className="text-xs text-muted-foreground">{item.submittedBy?.name || 'Employee'} · {item.customer?.name || 'Internal work'} · {displayDate(item.createdAt)}</p><p className="line-clamp-2 text-sm">{item.reviewMessage}</p><p className="text-sm font-medium text-primary">Review delivery →</p></button>)}</div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.work?.title || 'Review employee delivery'}</DialogTitle></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{selected && <div className="space-y-5"><p className="text-sm text-muted-foreground">Submitted by {selected.submittedBy?.name} · {selected.work?.workType}</p><div><h3 className="font-semibold">Brief</h3><p className="mt-2 whitespace-pre-wrap text-sm">{selected.work?.description || 'No brief provided.'}</p></div><div><h3 className="font-semibold">Submission</h3><p className="mt-2 whitespace-pre-wrap text-sm">{selected.reviewMessage}</p></div><div className="space-y-2"><h3 className="font-semibold">Files & delivery links</h3>{!selected.work?.attachments?.length && <p className="text-sm text-muted-foreground">No delivery attachments.</p>}{selected.work?.attachments?.map((file: any, index: number) => <a key={index} href={fileUrl(file.fileUrl)} target="_blank" rel="noopener noreferrer" className="block break-all rounded-lg border p-3 text-sm text-primary">{file.fileName || 'Delivery'}</a>)}</div><div className="space-y-2"><h3 className="font-semibold">Latest progress</h3>{[...(selected.work?.updates || [])].reverse().slice(0, 5).map((update: any, index: number) => <p key={index} className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{update.byName}: {update.message}</p>)}</div><label className="block text-sm font-medium">Feedback<Textarea className="mt-2" maxLength={10000} value={feedback} disabled={busy} onChange={event => setFeedback(event.target.value)} placeholder="Explain requested changes or confirm the delivery." /></label><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => review('Approved')}>Approve & complete</Button><Button disabled={busy || !feedback.trim()} variant="outline" onClick={() => review('Revision Requested')}>Request revision</Button></div></div>}</DialogContent></Dialog>
  </section>;
}
