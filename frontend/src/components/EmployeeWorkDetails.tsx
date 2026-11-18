import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { serviceRequest } from '@/lib/serviceAccess';
import { AssignedWork, WorkReview, displayDate, fileUrl, uploadWorkUpdate } from '@/lib/employeeWorkspace';
import EmployeeClientBrief from './EmployeeClientBrief';

export default function EmployeeWorkDetails({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [item, setItem] = useState<AssignedWork | null>(null);
  const [reviews, setReviews] = useState<WorkReview[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [message, setMessage] = useState('');
  const [hours, setHours] = useState('');
  const [links, setLinks] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [summary, setSummary] = useState('');
  const [comment, setComment] = useState('');
  const [blocker, setBlocker] = useState('');
  const [blockerType, setBlockerType] = useState('CLIENT_INPUT');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    serviceRequest(`/service-workspace/my-work/${id}`).then(data => {
      if (active) { setItem(data.item); setReviews(data.reviews); setBlocker(data.item.blockedBy?.note || ''); }
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh]);
  const writable = item && ['Pending', 'Not Started', 'In Progress', 'Revision'].includes(item.status);
  async function mutate(operation: string, body: Record<string, unknown>, success: string) {
    if (!item) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await serviceRequest(`/service-workspace/my-work/${id}/${operation}`, { method: 'POST', body: JSON.stringify({ ...body, version: item.updatedAt }) });
      setItem(data.item); setNotice(success); onChanged();
      if (operation === 'comments') setComment('');
      if (operation === 'status') setSummary('');
      if (operation === 'status' && body.status === 'Review') setRefresh(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setBusy(false); }
  }
  async function saveUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (files.length > 5 || files.some(file => file.size > 10 * 1024 * 1024)) throw new Error('Choose up to 5 files, each no larger than 10 MB.');
      const form = new FormData();
      form.set('version', item.updatedAt); form.set('message', message); form.set('timeSpent', hours || '0');
      form.set('links', JSON.stringify(links.split('\n').map(link => link.trim()).filter(Boolean)));
      files.forEach(file => form.append('files', file));
      const data = await uploadWorkUpdate(id, form);
      setItem(data.item); setMessage(''); setHours(''); setLinks(''); setFiles([]); setFileKey(value => value + 1);
      setNotice('Progress update saved.'); onChanged();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save update'); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto" onInteractOutside={event => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>{item?.title || 'Assignment details'}</DialogTitle></DialogHeader>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}<Button size="sm" variant="outline" className="ml-3" disabled={busy} onClick={() => setRefresh(value => value + 1)}>Refresh details</Button></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
    {loading ? <p role="status" className="flex gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" />Loading assignment…</p> : item && <>
      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-secondary px-3 py-1">{item.status}</span><span className="rounded-full bg-secondary px-3 py-1">{item.priority} priority</span><span className="rounded-full bg-secondary px-3 py-1">{item.workType}</span>{item.clientName && <span className="rounded-full bg-secondary px-3 py-1">{item.clientName}</span>}</div>
      <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-3"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Due: {displayDate(item.dueDate)}</span><span className="flex items-center gap-2"><Clock className="h-4 w-4" />{item.timeSpent || 0} hours logged</span><span>{item.completedDeliverables || 0} / {item.deliverables || 1} deliverables</span></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span>Assigned by: {item.createdBy?.name || 'Not recorded'}</span><span>Team: {item.assignedTo?.map(user => user.name).filter(Boolean).join(', ') || 'Not recorded'}</span>{Boolean(item.estimatedHours) && <span>Estimated: {item.estimatedHours} hours</span>}</div>
      {item.blockedBy?.isBlocked && <p className="flex gap-2 rounded-xl bg-amber-500/10 p-3 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" />Blocked: {item.blockedBy.note}</p>}
      <EmployeeClientBrief client={item.customer} />
      {item.managerReviewNote && <div className="rounded-xl border border-violet-500/30 p-4"><h3 className="text-sm font-semibold">Manager feedback</h3><p className="mt-2 whitespace-pre-wrap text-sm">{item.managerReviewNote}</p></div>}
      <div role="group" aria-label="Task detail sections" className="flex flex-wrap gap-2 border-b pb-3">{['Overview', 'Updates & files', 'Discussion', 'Review history'].map(value => <Button key={value} size="sm" disabled={busy} variant={value === tab ? 'default' : 'ghost'} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</Button>)}</div>
      {tab === 'Overview' && <div className="space-y-5"><div><h3 className="text-sm font-semibold">Work brief</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{item.description || 'No detailed brief has been provided. Use Discussion to ask your manager for clarification.'}</p></div>
        {writable && <div className="space-y-4 rounded-xl border p-4"><h3 className="font-semibold">Move your work forward</h3>{item.status !== 'In Progress' && <Button disabled={busy} onClick={() => mutate('status', { status: 'In Progress' }, 'Work started.')}>Start work</Button>}
          <form className="space-y-3" onSubmit={event => { event.preventDefault(); mutate('status', { status: 'Review', message: summary }, 'Submitted for manager review.'); }}><label className="block text-sm font-medium">Submission summary<Textarea required maxLength={10000} disabled={busy} className="mt-2" value={summary} onChange={event => setSummary(event.target.value)} placeholder="What have you delivered? Add files or links in Updates & files before submitting." /></label><Button disabled={busy || !summary.trim() || item.blockedBy?.isBlocked} type="submit">Submit for review</Button><p className="text-xs text-muted-foreground">Your manager reviews the delivery and approves it or requests a revision.</p></form></div>}
        {!writable && <p className="rounded-xl bg-secondary p-4 text-sm">{item.status === 'Review' ? 'Submitted for review. You can follow feedback and use Discussion while your manager reviews the delivery.' : 'This assignment is closed for editing. Discussion and the delivery history remain available.'}</p>}
        {writable && <form className="space-y-3 rounded-xl border p-4" onSubmit={event => { event.preventDefault(); mutate('blocker', { isBlocked: !item.blockedBy?.isBlocked, note: blocker, type: blockerType }, item.blockedBy?.isBlocked ? 'Blocker resolved.' : 'Blocker reported.'); }}><h3 className="text-sm font-semibold">{item.blockedBy?.isBlocked ? 'Resolve blocker' : 'Need something to continue?'}</h3>{!item.blockedBy?.isBlocked && <label className="block text-sm">Blocked by<select className="mt-1 block w-full rounded-md border bg-background p-2" value={blockerType} disabled={busy} onChange={event => setBlockerType(event.target.value)}>{[['CLIENT_INPUT', 'Client input'], ['MANAGER_APPROVAL', 'Manager approval'], ['ASSET', 'Missing asset'], ['OTHER_TASK', 'Another task'], ['EXTERNAL', 'External dependency']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}<label className="block text-sm">{item.blockedBy?.isBlocked ? 'Resolution note' : 'What do you need?'}<Textarea className="mt-1" required={!item.blockedBy?.isBlocked} disabled={busy} value={blocker} maxLength={10000} onChange={event => setBlocker(event.target.value)} /></label><Button variant="outline" disabled={busy || (!item.blockedBy?.isBlocked && !blocker.trim())}>{item.blockedBy?.isBlocked ? 'Resolve blocker' : 'Report blocker'}</Button></form>}
      </div>}
      {tab === 'Updates & files' && <div className="space-y-5">{writable && <form onSubmit={saveUpdate} className="space-y-4 rounded-xl border p-4"><h3 className="font-semibold">Add a progress update</h3><label className="block text-sm">What did you work on?<Textarea className="mt-1" required disabled={busy} value={message} maxLength={10000} onChange={event => setMessage(event.target.value)} /></label><label className="block text-sm">Time spent (hours)<Input className="mt-1" disabled={busy} type="number" min="0" max="24" step="0.25" value={hours} onChange={event => setHours(event.target.value)} /></label><label className="block text-sm">Delivery links (one per line)<Textarea className="mt-1" disabled={busy} value={links} onChange={event => setLinks(event.target.value)} placeholder="https://…" /></label><label className="block text-sm">Attach files<Input key={fileKey} className="mt-1" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" disabled={busy} onChange={event => setFiles(Array.from(event.target.files || []))} /><span className="mt-1 block text-xs text-muted-foreground">Up to 5 images, PDF or Word files; 10 MB each.</span></label><Button disabled={busy || !message.trim()}>{busy ? 'Saving…' : 'Save update'}</Button></form>}
        <div className="space-y-2"><h3 className="text-sm font-semibold">Reference files & deliveries</h3>{!item.attachments?.length && <p className="text-sm text-muted-foreground">No attachments yet.</p>}{item.attachments?.map((file, index) => <a key={index} href={fileUrl(file.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 break-all rounded-lg border p-3 text-sm text-primary"><ExternalLink className="h-4 w-4 shrink-0" />{file.fileName || 'Attachment'}</a>)}</div>
        <div className="space-y-3"><h3 className="text-sm font-semibold">Progress history</h3>{!item.updates?.length && <p className="text-sm text-muted-foreground">No progress updates yet.</p>}{[...(item.updates || [])].reverse().map((update, index) => <article key={index} className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{update.byName || 'Team member'} · {displayDate(update.createdAt)} · {update.timeSpent || 0} hours</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{update.message}</p></article>)}</div>
      </div>}
      {tab === 'Discussion' && <div className="space-y-4">{!item.comments?.length && <p className="text-sm text-muted-foreground">Ask questions and discuss this assignment here.</p>}{item.comments?.map((entry, index) => <article key={index} className="rounded-xl bg-muted/40 p-4"><p className="text-xs font-medium">{entry.createdByName || 'Team member'} · {displayDate(entry.createdAt)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.message}</p></article>)}<form className="space-y-3" onSubmit={event => { event.preventDefault(); mutate('comments', { message: comment }, 'Comment added.'); }}><label className="block text-sm">Add a comment<Textarea className="mt-1" required maxLength={10000} value={comment} disabled={busy} onChange={event => setComment(event.target.value)} /></label><Button disabled={busy || !comment.trim()}>Post comment</Button></form></div>}
      {tab === 'Review history' && <div className="space-y-4">{!reviews.length && <p className="text-sm text-muted-foreground">No review submissions yet.</p>}{reviews.map(review => <article key={review._id} className="space-y-2 rounded-xl border p-4"><p className="text-sm font-semibold">{review.status}</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{review.reviewMessage}</p>{review.adminRemark && <p className="whitespace-pre-wrap text-sm">Feedback: {review.adminRemark}</p>}{review.reviewedAt && <p className="text-xs text-muted-foreground">Reviewed {displayDate(review.reviewedAt)}</p>}</article>)}<h3 className="text-sm font-semibold">Activity</h3>{[...(item.timeline || [])].reverse().map((event, index) => <div key={index} className="border-l-2 pl-4"><p className="text-sm font-medium">{event.title}</p><p className="whitespace-pre-wrap text-xs text-muted-foreground">{event.description} · {displayDate(event.createdAt)}</p></div>)}</div>}
    </>}
  </DialogContent></Dialog>;
}
