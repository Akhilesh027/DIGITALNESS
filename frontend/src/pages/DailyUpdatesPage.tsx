import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, PlayCircle, Clock, CheckCircle2, RotateCcw, XCircle,
  Send, Save, Calendar as CalendarIcon, Paperclip, Link as LinkIcon, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import {
  useDailyUpdateStore, DailyUpdate, DailyUpdateStatus, statusBadgeClass,
} from '@/store/dailyUpdateStore';
import { useTaskStore } from '@/store/taskStore';
import { useCRMStore } from '@/store/crmStore';

const STATUS_OPTIONS: DailyUpdateStatus[] = [
  'Not Started', 'In Progress', 'Pending Review', 'Submitted', 'Blocked',
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function DailyUpdatesPage() {
  const { updates, upsert, remove } = useDailyUpdateStore();
  const tasks = useTaskStore((s) => s.tasks);
  const { customers, projects, currentUser } = useCRMStore() as any;

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const employeeId = currentUser?.id || me?._id || me?.id || 'EMP007';
  const employeeName = currentUser?.name || me?.name || 'Team Member';

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<string>('0');
  const [progressPct, setProgressPct] = useState<string>('0');
  const [status, setStatus] = useState<DailyUpdateStatus>('In Progress');
  const [workDone, setWorkDone] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [refLink, setRefLink] = useState('');

  const myUpdates = useMemo(
    () => updates.filter((u) => u.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [updates, employeeId]
  );

  const stats = useMemo(() => {
    const assigned = tasks.filter((t) => t.assignedTo === employeeId);
    return {
      assigned: assigned.length,
      inProgress: assigned.filter((t) => t.status === 'In Progress').length,
      pendingReview: myUpdates.filter((u) => u.status === 'Pending Review' || u.status === 'Submitted').length,
      approved: myUpdates.filter((u) => u.status === 'Approved').length,
      revision: myUpdates.filter((u) => u.status === 'Revision Requested').length,
      blocked: myUpdates.filter((u) => u.status === 'Blocked').length,
    };
  }, [tasks, myUpdates, employeeId]);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignedTo === employeeId),
    [tasks, employeeId]
  );

  const buildPayload = (asDraft: boolean): DailyUpdate => {
    const project = projects?.find((p: any) => p.id === projectId);
    const customer = customers?.find((c: any) => c.id === customerId);
    const task = tasks.find((t) => t.id === taskId);
    return {
      id: `DU${Date.now()}`,
      employeeId, employeeName, date,
      projectId, projectName: project?.name,
      customerId, customerName: customer?.name,
      taskId, taskTitle: task?.title,
      timeSpent: parseFloat(timeSpent) || 0,
      progressPct: Math.min(100, Math.max(0, parseInt(progressPct) || 0)),
      status: asDraft ? status : 'Pending Review',
      workDone, blockers, tomorrowPlan,
      attachments: [], referenceLinks: refLink ? [refLink] : [],
      isDraft: asDraft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = (asDraft: boolean) => {
    if (!workDone.trim()) {
      toast.error('Please describe today\'s work before saving.');
      return;
    }
    upsert(buildPayload(asDraft));
    toast.success(asDraft ? 'Draft saved' : 'Update submitted for review');
    setWorkDone(''); setBlockers(''); setTomorrowPlan(''); setRefLink('');
    setTimeSpent('0'); setProgressPct('0');
  };

  const statTiles = [
    { label: 'Assigned Tasks', value: stats.assigned, icon: ClipboardList, color: 'bg-violet-500/10 text-violet-600' },
    { label: 'In Progress', value: stats.inProgress, icon: PlayCircle, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Approved Updates', value: stats.approved, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Revision Requested', value: stats.revision, icon: RotateCcw, color: 'bg-orange-500/10 text-orange-600' },
    { label: 'Blocked Tasks', value: stats.blocked, icon: XCircle, color: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">My Work Updates</h1>
          <p className="text-sm text-muted-foreground">
            Submit daily work progress, blockers, and tomorrow's plan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none"
            />
          </div>
          <Button variant="outline" onClick={() => handleSave(true)}>
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={() => handleSave(false)}>
            <Send className="w-4 h-4 mr-2" /> Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statTiles.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Work Update <span className="text-sm font-normal text-muted-foreground">({formatDate(date)})</span></CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Task</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent>
                  {myTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Spent (hours)</Label>
              <Input type="number" step="0.5" min="0" value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Progress %</Label>
              <Input type="number" min="0" max="100" value={progressPct}
                onChange={(e) => setProgressPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DailyUpdateStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Work Completed Today *</Label>
              <Textarea rows={3} value={workDone} onChange={(e) => setWorkDone(e.target.value)}
                placeholder="What did you complete today?" />
            </div>
            <div className="space-y-2">
              <Label>Blockers / Issues</Label>
              <Textarea rows={3} value={blockers} onChange={(e) => setBlockers(e.target.value)}
                placeholder="Anything blocking progress?" />
            </div>
            <div className="space-y-2">
              <Label>Tomorrow's Plan</Label>
              <Textarea rows={3} value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="What will you work on tomorrow?" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Reference Link</Label>
              <Input value={refLink} onChange={(e) => setRefLink(e.target.value)}
                placeholder="https://design-link.com/file" />
            </div>
            <div className="md:col-span-2 text-xs text-muted-foreground flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" /> Attachments coming soon — paste reference links above.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Work Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
            {myUpdates.length === 0 && (
              <p className="text-sm text-muted-foreground">No updates yet — submit your first one!</p>
            )}
            {myUpdates.slice(0, 8).map((u) => (
              <div key={u.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(u.date)}</span>
                  <Badge variant="outline" className={cn('text-xs', statusBadgeClass[u.status])}>
                    {u.status}
                  </Badge>
                </div>
                <p className="text-sm line-clamp-2">{u.workDone}</p>
                {typeof u.progressPct === 'number' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{u.taskTitle || u.projectName || 'Update'}</span>
                      <span>{u.progressPct}%</span>
                    </div>
                    <Progress value={u.progressPct} className="h-1.5" />
                  </div>
                )}
                {u.managerComment && (
                  <div className="text-xs bg-muted/40 rounded p-2">
                    <span className="font-medium">Manager: </span>{u.managerComment}
                  </div>
                )}
                {u.revisionReason && (
                  <div className="text-xs bg-orange-500/10 text-orange-700 rounded p-2">
                    <span className="font-medium">Revision: </span>{u.revisionReason}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Update History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task / Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myUpdates.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-sm">{formatDate(u.date)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{u.taskTitle || '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.projectName || '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm">{u.customerName || '—'}</TableCell>
                  <TableCell className="text-sm">{u.timeSpent}h</TableCell>
                  <TableCell className="text-sm w-32">
                    <Progress value={u.progressPct} className="h-1.5" />
                    <div className="text-xs text-muted-foreground mt-1">{u.progressPct}%</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', statusBadgeClass[u.status])}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { remove(u.id); toast.success('Removed'); }}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {myUpdates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No updates submitted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
