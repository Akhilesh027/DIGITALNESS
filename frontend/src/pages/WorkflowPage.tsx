import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target, TrendingUp, FileSignature, Handshake, Building2, FolderKanban, ListChecks, FileText, CreditCard, BarChart3 } from 'lucide-react';

const stages = [
  { icon: Target, label: 'Lead', desc: 'Captured from web/ads/calls', color: 'bg-blue-500' },
  { icon: TrendingUp, label: 'Pipeline Deal', desc: 'Qualified & added to Kanban', color: 'bg-indigo-500' },
  { icon: FileSignature, label: 'Proposal', desc: 'Sent to client for review', color: 'bg-purple-500' },
  { icon: Handshake, label: 'Won', desc: 'Auto-creates customer + project + draft invoice', color: 'bg-emerald-500' },
  { icon: Building2, label: 'Customer', desc: 'Onboarded into CRM', color: 'bg-teal-500' },
  { icon: FolderKanban, label: 'Project', desc: 'Spawned from template playbook', color: 'bg-cyan-500' },
  { icon: ListChecks, label: 'Tasks & SLA', desc: 'Auto-generated with deadlines', color: 'bg-amber-500' },
  { icon: FileText, label: 'Invoice', desc: 'Generated on milestone / monthly', color: 'bg-orange-500' },
  { icon: CreditCard, label: 'Payment', desc: 'UPI / Bank / Cash / Cheque', color: 'bg-rose-500' },
  { icon: BarChart3, label: 'Reports', desc: 'Auto monthly PDF + analytics', color: 'bg-pink-500' },
];

const automations = [
  { from: 'Lead', to: 'Pipeline Deal', trigger: 'Click "Add to Pipeline"' },
  { from: 'Proposal Accepted', to: 'Deal advances to Negotiation', trigger: 'Status change' },
  { from: 'Deal Won', to: 'Customer + Project + Draft Invoice', trigger: 'Auto on stage move' },
  { from: 'Project Created', to: 'Tasks generated from playbook/template', trigger: 'Project Type or Template' },
  { from: 'Task Overdue', to: 'Notification to Manager', trigger: 'Deadline passed' },
  { from: 'Invoice Paid', to: 'Customer balance updated', trigger: 'Payment recorded' },
  { from: 'Month End', to: 'Auto-generate PDF reports', trigger: 'Monthly cycle' },
];

export default function WorkflowPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Agency Workflow</h1>
        <p className="text-muted-foreground">End-to-end client journey & automation map</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {stages.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center w-32"
                >
                  <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-md`}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-sm mt-2 text-center">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground text-center leading-tight mt-1">{s.desc}</p>
                </motion.div>
                {i < stages.length - 1 && <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold mb-4">Automations</h2>
          <div className="space-y-2">
            {automations.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                <Badge>{a.from}</Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <Badge variant="secondary">{a.to}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Trigger: {a.trigger}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
