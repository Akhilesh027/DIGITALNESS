import React, { useState } from "react";
import {
  Sun,
  Palette,
  Film,
  CheckCircle2,
  UserPlus,
  ShieldAlert,
  IndianRupee,
  Sparkles,
  BarChart3,
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface PromptItem {
  id: string;
  label: string;
  prompt: string;
  category: string;
  agent: string;
  description?: string;
  icon?: any;
}

export const ALL_AGENT_PROMPTS: PromptItem[] = [
  // 1. DAILY & EXECUTIVE
  {
    id: "mb-1",
    label: "☀️ Morning Briefing",
    prompt: "Show me today's morning executive briefing",
    category: "Daily",
    agent: "Executive Agent",
    description: "09:00 AM snapshot of agency KPIs, SLA alerts, overdue collections, and urgent actions.",
    icon: Sun,
  },
  {
    id: "dec-1",
    label: "📥 Pending Decisions",
    prompt: "What operational decisions are waiting on my approval?",
    category: "Daily",
    agent: "Executive Agent",
    description: "Unified queue of proposals, deliverables, and payment recovery actions requiring sign-off.",
    icon: CheckCircle2,
  },
  {
    id: "sla-1",
    label: "🛡️ SLA Risks",
    prompt: "What tasks are currently at critical SLA risk?",
    category: "Daily",
    agent: "SLA Guardian",
    description: "Scan active tasks with risk score >= 50 and root-cause bottleneck diagnostics.",
    icon: ShieldAlert,
  },
  {
    id: "fin-1",
    label: "💰 Overdue Dues",
    prompt: "Show outstanding overdue payments and aging breakdown",
    category: "Daily",
    agent: "Finance Agent",
    description: "Aging analysis across 1-3d, 4-7d, 8-15d, 30d+ overdue buckets.",
    icon: IndianRupee,
  },
  {
    id: "eod-1",
    label: "🌆 EOD Wrap-Up",
    prompt: "Show today's End of Day wrap-up and accomplishments",
    category: "Daily",
    agent: "Executive Agent",
    description: "Compare morning targets against closed deliverables and collections.",
    icon: Clock,
  },

  // 2. CREATIVE STUDIO & SOCIAL
  {
    id: "cr-1",
    label: "🎨 Create Promotional Poster",
    prompt: "Create a promotional social media poster with special 20% discount offer",
    category: "Creatives",
    agent: "Creative Agent",
    description: "Generate brand-aligned promotional poster with headline, colors, and typography.",
    icon: Palette,
  },
  {
    id: "cr-2",
    label: "🚀 Launch Campaign Poster",
    prompt: "Design a new brand website launch poster with headline and booking CTA",
    category: "Creatives",
    agent: "Creative Agent",
    description: "Launch campaign visual creative with offer badge and booking CTA.",
    icon: Palette,
  },
  {
    id: "reel-1",
    label: "🎥 30-Sec Reel Script",
    prompt: "Create a 30-second Instagram reel script for seasonal festive offer",
    category: "Creatives",
    agent: "Social Agent",
    description: "Short-form video script complete with 3-second hook, audio cue, and CTA.",
    icon: Film,
  },
  {
    id: "soc-1",
    label: "✍️ Engaging Captions",
    prompt: "Generate an engaging social media caption with clear call-to-action",
    category: "Creatives",
    agent: "Social Agent",
    description: "Platform-optimized caption with hook, emojis, and call-to-action.",
    icon: MessageSquare,
  },
  {
    id: "soc-2",
    label: "#️⃣ Trending Hashtags",
    prompt: "Generate high-reach trending hashtags for digital growth and branding",
    category: "Creatives",
    agent: "Social Agent",
    description: "Categorized niche, location, and viral hashtag matrix.",
    icon: Sparkles,
  },
  {
    id: "cal-1",
    label: "📅 30-Day Content Plan",
    prompt: "Generate 30-day autonomous content calendar themes and weekly content mix",
    category: "Creatives",
    agent: "Content Engine",
    description: "Full monthly editorial roadmap mapped to package deliverable quotas.",
    icon: Calendar,
  },

  // 3. LEADS & CLIENT ONBOARDING
  {
    id: "intake-1",
    label: "📋 Onboard Client (Intake)",
    prompt: "Start client intake interview to onboard a new business",
    category: "Leads & CRM",
    agent: "Client Agent",
    description: "AI-guided 4-stage interview to extract client 360 profile, brand colors, services, and save directly to CRM.",
    icon: UserPlus,
  },
  {
    id: "ld-1",
    label: "👤 Add Inbound Lead",
    prompt: "Add a new high-intent inbound lead for digital marketing retainer",
    category: "Leads & CRM",
    agent: "Lead Agent",
    description: "Instant CRM intake for incoming prospect with requirement tagging.",
    icon: UserPlus,
  },
  {
    id: "ld-4",
    label: "🔍 Search Hot Leads",
    prompt: "Search all hot leads with pending follow-ups this week",
    category: "Leads & CRM",
    agent: "Lead Agent",
    description: "Filter high-intent prospects awaiting executive outreach.",
    icon: Search,
  },
  {
    id: "prop-1",
    label: "📄 Draft Commercial Proposal",
    prompt: "Generate a commercial proposal for Digital Growth package with deliverables and commercial terms",
    category: "Leads & CRM",
    agent: "Proposal Agent",
    description: "Generate structured deliverables, commercial terms, and SLA timeline.",
    icon: BookOpen,
  },

  // 4. SLA & TEAM WORKLOAD
  {
    id: "work-1",
    label: "📊 Team Workload Capacity",
    prompt: "Check active workload and multivariate capacity scores across all team members",
    category: "SLA & Ops",
    agent: "Workload Engine",
    description: "Real-time task distribution across Graphic Designers, Writers, and Video Editors.",
    icon: BarChart3,
  },
  {
    id: "sla-2",
    label: "🚨 SLA Root-Cause Diagnosis",
    prompt: "Explain root cause diagnostics and risk factor breakdown for at-risk deliverables",
    category: "SLA & Ops",
    agent: "SLA Guardian",
    description: "Analyze delay reasons: designer capacity, client feedback delay, or asset shortage.",
    icon: ShieldAlert,
  },
  {
    id: "sla-3",
    label: "⚖️ Rebalance Workload",
    prompt: "Auto-reassign overloaded tasks to lowest-capacity team members to eliminate SLA risk",
    category: "SLA & Ops",
    agent: "Workload Engine",
    description: "Automated workload re-allocation without manual spreadsheet juggling.",
    icon: Zap,
  },
  {
    id: "tsk-1",
    label: "📋 Tomorrow's Task Plan",
    prompt: "What are tomorrow's scheduled deliverables and client milestones?",
    category: "SLA & Ops",
    agent: "Executive Agent",
    description: "Predictive lookahead of upcoming due dates and required resources.",
    icon: Calendar,
  },

  // 5. FINANCE & INVOICING
  {
    id: "fin-2",
    label: "📲 WhatsApp Payment Reminder",
    prompt: "Generate a polite payment reminder draft with verified UPI link for overdue invoices",
    category: "Finance",
    agent: "Recovery Engine",
    description: "Compliant, non-spam reminder with direct payment link and invoice summary.",
    icon: IndianRupee,
  },
  {
    id: "fin-3",
    label: "🔄 Trigger Recurring Invoicing",
    prompt: "Trigger monthly recurring retainer billing run for all active clients",
    category: "Finance",
    agent: "Finance Agent",
    description: "Auto-generate monthly retainer invoices for all active accounts.",
    icon: IndianRupee,
  },
  {
    id: "fin-5",
    label: "📈 Expected Collections",
    prompt: "List all pending dues and expected cash collections for this week",
    category: "Finance",
    agent: "Finance Agent",
    description: "Upcoming revenue pipeline to ensure healthy operational cash-flow.",
    icon: TrendingUp,
  },

  // 6. ADS & PERFORMANCE
  {
    id: "ads-1",
    label: "🎯 Meta Ad Campaign Blueprint",
    prompt: "Create a Meta lead generation ad campaign blueprint with daily budget, audience segmentation, and creative formats",
    category: "Ads & Campaigns",
    agent: "Ads Agent",
    description: "Complete campaign blueprint: objective, audience segmentation, budget allocation & creative requirements.",
    icon: Sparkles,
  },
  {
    id: "ads-2",
    label: "👥 Audience Segmentation",
    prompt: "Recommend 3-tier audience targeting strategy for high-intent conversion",
    category: "Ads & Campaigns",
    agent: "Audience Planner",
    description: "Multi-tier segmentation across Broad Local, Category Intent, and High-Intent shoppers.",
    icon: UserPlus,
  },
  {
    id: "ads-3",
    label: "💰 Calculate Ad Budget & CPL",
    prompt: "Recommend daily ad budget and forecast CPL for getting 30 qualified leads this month",
    category: "Ads & Campaigns",
    agent: "Budget Calculator",
    description: "Calculate optimal daily spend, platform splits, and forecast CPL and monthly enquiries.",
    icon: IndianRupee,
  },
  {
    id: "ads-4",
    label: "✍️ High-Conversion Ad Copy",
    prompt: "Generate 3 high-converting ad copy angles and instant lead form questions",
    category: "Ads & Campaigns",
    agent: "Ads Copy Engine",
    description: "Transformation, Trust, and Limited-Time Offer angles with customized instant lead form questions.",
    icon: MessageSquare,
  },

  // 7. REPORTS & AGENCY INTELLIGENCE
  {
    id: "rep-1",
    label: "🏥 Agency Health Score",
    prompt: "Show transparent 0-100 Agency Health Score and deduction breakdown",
    category: "Reports",
    agent: "Executive Agent",
    description: "Real-time health metric factoring SLAs, collections, pipeline, and team stress.",
    icon: Sparkles,
  },
  {
    id: "rep-2",
    label: "⚡ Batch Approve Safe Tasks",
    prompt: "Batch approve and execute all safe low-risk operational decisions",
    category: "Reports",
    agent: "Executive Agent",
    description: "1-click execution for low-risk queued actions without manual bottlenecks.",
    icon: Zap,
  },
  {
    id: "rep-3",
    label: "📊 Monthly Revenue Report",
    prompt: "Calculate total revenue and collections this month versus last month",
    category: "Reports",
    agent: "Report Agent",
    description: "Complete financial breakdown of billings, realized cash, and outstanding balances.",
    icon: TrendingUp,
  },
  {
    id: "rep-5",
    label: "🎯 Lead Conversion Velocity",
    prompt: "Generate lead funnel analytics across Hot, Warm, Cold, and Converted stages",
    category: "Reports",
    agent: "Report Agent",
    description: "Sales velocity, conversion rates, and acquisition cost breakdown.",
    icon: UserPlus,
  },
];

const CATEGORIES = [
  "Daily",
  "Ads & Campaigns",
  "Creatives",
  "Leads & CRM",
  "SLA & Ops",
  "Finance",
  "Reports",
];

interface QuickPromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Daily");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Filter chips based on active category
  const filteredPrompts = ALL_AGENT_PROMPTS.filter(
    (p) => p.category === selectedCategory
  );

  return (
    <div className="space-y-1.5 w-full">
      {/* CATEGORY SELECTOR STRIP */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap ${selectedCategory === cat
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PROMPT LIBRARY MODAL TRIGGER */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsLibraryOpen(true)}
          className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2 flex items-center gap-1 font-bold whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3" /> All Commands ({ALL_AGENT_PROMPTS.length})
        </Button>
      </div>

      {/* HORIZONTAL PROMPT CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filteredPrompts.slice(0, 6).map((item) => {
          const Icon = item.icon || Sparkles;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all shadow-2xs whitespace-nowrap group text-left"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* FULL COMMAND LIBRARY DIALOG */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 text-slate-100 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Zap className="w-4 h-4 text-indigo-400" />
              Autonomous Agency Command Hub
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Select any verified natural language command to execute directly through the autonomous workflow engine.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {ALL_AGENT_PROMPTS.map((p) => {
              const Icon = p.icon || Sparkles;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPrompt(p.prompt);
                    setIsLibraryOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between gap-1.5 group shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                          {p.label}
                        </div>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-medium border-slate-700 text-slate-400">
                          {p.agent}
                        </Badge>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
