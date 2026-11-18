import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, ClipboardList, Clock, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { serviceRequest } from '@/lib/serviceAccess';
import { AssignedWork, businessDate, closed, displayDate, dueDay } from '@/lib/employeeWorkspace';
import EmployeeWorkDetails from './EmployeeWorkDetails';

export default function EmployeeAssignedWork({ dashboard = false }: { dashboard?: boolean }) {
  const [items, setItems] = useState<AssignedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Active');
  const [client, setClient] = useState('');
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState('List');
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    serviceRequest('/service-workspace/my-work').then(result => { if (active) setItems(result.items); })
      .catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const today = businessDate();
  function matches(item: AssignedWork, value: string) {
    if (value === 'Active') return !closed(item);
    if (value === 'Due today') return !closed(item) && dueDay(item.dueDate) === today;
    if (value === 'Overdue') return !closed(item) && Boolean(item.dueDate) && dueDay(item.dueDate) < today;
    if (value === 'Blocked') return !closed(item) && item.blockedBy?.isBlocked;
    return value === 'All' || item.status === value;
  }
  const visible = items.filter(item => matches(item, filter) && (!client || item.clientName === client) && `${item.title} ${item.description || ''} ${item.workType} ${item.clientName || ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(b.status === 'Revision') - Number(a.status === 'Revision') || Number(Boolean(b.blockedBy?.isBlocked)) - Number(Boolean(a.blockedBy?.isBlocked)) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const filters = ['Active', 'Due today', 'Overdue', 'In Progress', 'Review', 'Revision', 'Blocked', 'Approved', 'Completed', 'All'];
  const card = (item: AssignedWork) => <button key={item._id} type="button" onClick={() => setSelected(item._id)} className="w-full space-y-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{item.workType} · {item.clientName || 'Internal work'}</span><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{item.status}</span></div><h3 className="break-words font-semibold">{item.title}</h3>{item.description && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{item.description}</p>}<div className="flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground"><span className={['Urgent', 'High'].includes(item.priority) ? 'font-medium text-amber-700 dark:text-amber-300' : ''}>{item.priority} priority</span><span className={`flex items-center gap-1 ${matches(item, 'Overdue') ? 'text-destructive' : ''}`}><CalendarDays className="h-3.5 w-3.5" />{displayDate(item.dueDate)}</span>{item.blockedBy?.isBlocked && <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" />Blocked</span>}<span className="ml-auto font-medium text-primary">Open assignment →</span></div></button>;
  return <section id="my-assigned-work" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">{dashboard ? 'My day' : 'My tasks & works'}</h1><p className="mt-2 text-sm text-muted-foreground">{dashboard ? 'Your priorities, deadlines and feedback in one place.' : 'Open an assignment to work, share progress and submit your delivery.'}</p></div><Button variant="outline" size="sm" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh work</Button></div>
    {dashboard && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
      { label: 'Due today', Icon: CalendarDays, color: 'text-blue-500' }, { label: 'Overdue', Icon: AlertTriangle, color: 'text-rose-500' },
      { label: 'Review', Icon: Clock, color: 'text-violet-500' }, { label: 'Revision', Icon: ClipboardList, color: 'text-amber-500' },
    ].map(({ label, Icon, color }) => <button key={label} onClick={() => setFilter(label)} className={`flex items-center justify-between rounded-2xl border bg-card p-5 text-left ${filter === label ? 'ring-2 ring-primary/30' : ''}`}><div><p className="text-xs text-muted-foreground">{label === 'Review' ? 'Awaiting review' : label === 'Revision' ? 'Needs revision' : label}</p><p className="mt-2 text-3xl font-semibold">{loading || error ? '—' : items.filter(item => matches(item, label)).length}</p></div><Icon className={`h-6 w-6 ${color}`} /></button>)}</div>}
    <div className="space-y-3 rounded-2xl border bg-card p-4"><div className="flex flex-wrap gap-3"><label className="relative min-w-0 flex-1"><span className="sr-only">Search assignments</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search tasks, clients or work types…" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filter by client" className="max-w-full rounded-md border bg-background px-3 py-2 text-sm" value={client} onChange={event => setClient(event.target.value)}><option value="">All clients</option>{[...new Set(items.map(item => item.clientName).filter(Boolean))].map(name => <option key={name} value={name}>{name}</option>)}</select><div className="flex gap-1">{['List', 'Board'].map(value => <Button key={value} size="sm" variant={layout === value ? 'default' : 'ghost'} aria-pressed={layout === value} onClick={() => setLayout(value)}>{value}</Button>)}</div></div><div role="group" aria-label="Filter assigned work" className="flex flex-wrap gap-1.5">{filters.map(value => <Button key={value} size="sm" variant={filter === value ? 'secondary' : 'ghost'} onClick={() => setFilter(value)} aria-pressed={filter === value} disabled={loading}>{value}</Button>)}</div></div>
    {error ? <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error} Use Refresh work to try again.</p> : loading ? <p role="status" className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">Loading assignments…</p> : !visible.length ? <div className="rounded-2xl border bg-card p-10 text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">{items.length ? 'No work matches these filters' : 'No assignments yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{items.length ? 'Try All or adjust your search to see other assignments.' : 'Work assigned to you will appear here.'}</p></div> : layout === 'Board' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{['Pending', 'Not Started', 'In Progress', 'Review', 'Revision', 'Approved', 'Completed', 'Failed'].filter(status => visible.some(item => item.status === status)).map(status => <div key={status} className="space-y-3 rounded-2xl bg-muted/50 p-3"><h2 className="px-1 text-sm font-semibold">{status} <span className="text-muted-foreground">{visible.filter(item => item.status === status).length}</span></h2>{visible.filter(item => item.status === status).map(card)}</div>)}</div> : <div className="grid gap-3 lg:grid-cols-2">{visible.map(card)}</div>}
    {selected && <EmployeeWorkDetails key={selected} id={selected} onClose={() => setSelected(null)} onChanged={() => setReload(value => value + 1)} />}
  </section>;
}
