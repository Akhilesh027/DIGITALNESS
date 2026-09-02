import React, { useEffect, useRef } from "react";
import {
  Sparkles,
  Sun,
  Palette,
  CheckCircle2,
  UserPlus,
  ShieldAlert,
  IndianRupee,
  Film,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { WorkspaceMessage } from "@/types/workspaceChat";
import { AIChatMessage } from "./AIChatMessage";
import { AIThinkingIndicator } from "./AIThinkingIndicator";
import { Badge } from "@/components/ui/badge";

interface AIChatTimelineProps {
  messages: WorkspaceMessage[];
  loading?: boolean;
  onSelectEntity: (candidateId: string) => void;
  onSubmitIntake: (field: string, value: any, isSkip?: boolean) => void;
  onApproveBlueprint: (decision: "approve") => void;
  onRejectBlueprint?: (decision: "reject") => void;
  onCreativeRevision?: (instruction: string, creativeRunId: string) => void;
  onCreativeSchedule?: (creativeRunId: string, scheduleDetails?: any) => void;
  onSelectPrompt?: (prompt: string) => void;
  onSendMessage?: (text: string) => void;
}

const FEATURED_STARTERS = [
  {
    title: "🌅 Morning Executive Briefing",
    prompt: "Show me today's morning executive briefing",
    agent: "Executive Agent",
    category: "Intelligence",
    icon: Sun,
    iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    desc: "Live KPI overview, cash collections velocity, pending decisions & SLA risks",
  },
  {
    title: "🎨 Aura Aesthetics HydraFacial Poster",
    prompt: "Create a promotional social poster for Aura Aesthetics Clinic with 25% off HydraFacial offer",
    agent: "Creative Studio",
    category: "Creative",
    icon: Palette,
    iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    desc: "Generate clinical luxury feed creative with brand colors (#0F172A, #38BDF8)",
  },
  {
    title: "🏡 Prestige SkyVillas 4K Reel Script",
    prompt: "Create a 4K luxury walkthrough reel storyboard for Prestige SkyVillas penthouse launch",
    agent: "Creative Studio",
    category: "Creative",
    icon: Film,
    iconColor: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    desc: "Architectural motion pacing with drone angles & HNI targeting hooks",
  },
  {
    title: "🚀 Inbound Lead Intake",
    prompt: "Create a new lead named Dr. Shalini Reddy with phone 9123456780 for Clinic Growth Package",
    agent: "Lead Agent",
    category: "Sales",
    icon: UserPlus,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    desc: "Auto-qualify inbound lead, calculate lead score & assign sales representative",
  },
  {
    title: "🛡️ SLA Guardian Risk Scan",
    prompt: "What deliverables are currently at critical SLA risk?",
    agent: "SLA Guardian",
    category: "Operations",
    icon: ShieldAlert,
    iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    desc: "Scan 35 active tasks, diagnose root-cause bottlenecks and auto-remediate",
  },
  {
    title: "💰 Overdue Cash-Flow & Aging",
    prompt: "Show outstanding overdue payments and aging breakdown",
    agent: "Finance Agent",
    category: "Finance",
    icon: IndianRupee,
    iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    desc: "Inspect 1-3d, 4-7d, 8-15d, 30d+ aging buckets and collection status",
  },
  {
    title: "📅 30-Day Content Calendar",
    prompt: "Preview 30-day autonomous content calendar for VogueCraft Atelier",
    agent: "Content Engine",
    category: "Social",
    icon: Calendar,
    iconColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    desc: "Multi-channel monthly post schedule mapped to festive prêt launch",
  },
  {
    title: "📥 Pending Decision Queue",
    prompt: "What operational decisions are waiting on my approval?",
    agent: "Executive Agent",
    category: "Intelligence",
    icon: CheckCircle2,
    iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    desc: "Review proposals, deliverables, and automated payment recovery actions",
  },
];

export const AIChatTimeline: React.FC<AIChatTimelineProps> = ({
  messages,
  loading = false,
  onSelectEntity,
  onSubmitIntake,
  onApproveBlueprint,
  onRejectBlueprint,
  onCreativeRevision,
  onCreativeSchedule,
  onSelectPrompt,
  onSendMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const categories = ["All", "Intelligence", "Creative", "Sales", "Operations", "Finance"];
  const filteredStarters =
    selectedCategory === "All"
      ? FEATURED_STARTERS
      : FEATURED_STARTERS.filter((s) => s.category === selectedCategory);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full space-y-6">
        {/* HERO BANNER */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/50 border border-indigo-500/25 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "6s" }} />
                <span>Autonomous Digital Agency OS v3.0</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                AI Command Workshop & Multi-Agent Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Supervised operational command center. Execute client onboarding, creative poster generation, lead attribution, SLA remediation, and cash-flow intelligence via natural dialogue.
              </p>
            </div>

            {/* Quick Live Stats Pill */}
            <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto flex-shrink-0">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Retainers</div>
                <div className="text-lg font-black text-white">5 Active</div>
                <div className="text-[10px] text-emerald-400 font-medium">● 100% Retained</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Deliverables</div>
                <div className="text-lg font-black text-indigo-400">35 Tasks</div>
                <div className="text-[10px] text-slate-400 font-medium">SLA Protected</div>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 mr-1 flex-shrink-0">Filter Missions:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MISSION STARTER CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredStarters.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
                className="group text-left p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 flex items-start gap-3.5 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-indigo-500 transition-all duration-200" />
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${item.iconColor}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {item.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0.5 border-slate-700 bg-slate-800/80 text-indigo-300 font-mono flex-shrink-0"
                    >
                      {item.agent}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="pt-1 flex items-center text-xs text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Execute Command</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full">
      {messages.map((msg, idx) => (
        <AIChatMessage
          key={msg.turnId || idx}
          message={msg}
          onSelectEntity={onSelectEntity}
          onSubmitIntake={onSubmitIntake}
          onApproveBlueprint={onApproveBlueprint}
          onRejectBlueprint={onRejectBlueprint}
          onCreativeRevision={onCreativeRevision}
          onCreativeSchedule={onCreativeSchedule}
          onSendMessage={onSendMessage}
          loading={loading}
        />
      ))}

      {loading && <AIThinkingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
};
