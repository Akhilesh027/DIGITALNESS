import { useState } from 'react';
import { Phone, Users, MessageSquare, Mail, StickyNote, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Activity, ActivityRelation, ActivityType, useActivityStore,
} from '@/store/activityStore';
import { useCRMStore } from '@/store/crmStore';
import { toast } from 'sonner';

const ICONS: Record<ActivityType, React.ElementType> = {
  Call: Phone, Meeting: Users, WhatsApp: MessageSquare, Email: Mail, Note: StickyNote,
};

interface Props {
  relation: ActivityRelation;
  relatedId: string;
  compact?: boolean;
}

export function ActivityTimeline({ relation, relatedId, compact }: Props) {
  const { forRelation, addActivity } = useActivityStore();
  const { currentUser } = useCRMStore();
  const items = forRelation(relation, relatedId);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityType>('Call');
  const [notes, setNotes] = useState('');
  const [next, setNext] = useState('');

  const handleSave = () => {
    if (!notes.trim()) {
      toast.error('Add a note for the activity');
      return;
    }
    const a: Activity = {
      id: `ACT${Date.now()}`,
      type, relation, relatedId,
      notes,
      by: currentUser?.id || 'SYSTEM',
      byName: currentUser?.name,
      nextFollowUpDate: next || undefined,
      createdAt: new Date().toISOString(),
    };
    addActivity(a);
    toast.success(`${type} logged`);
    setOpen(false); setNotes(''); setNext(''); setType('Call');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Activity Timeline ({items.length})</h4>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          <Plus className="w-3 h-3 mr-1" /> Add Activity
        </Button>
      </div>

      {open && (
        <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <Select value={type} onValueChange={(v: ActivityType) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Call', 'Meeting', 'WhatsApp', 'Email', 'Note'] as ActivityType[]).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Next follow-up" />
          </div>
          <Textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" variant="gradient" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      <div className={`space-y-2 ${compact ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No activity yet</p>
        )}
        {items.map((a) => {
          const Icon = ICONS[a.type];
          return (
            <div key={a.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">{a.notes}</p>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>by {a.byName || a.by}</span>
                  {a.nextFollowUpDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      next: {new Date(a.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
