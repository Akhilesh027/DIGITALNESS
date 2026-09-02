import React, { useState, useEffect } from "react";
import {
  SunMedium,
  Moon,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getLiveBriefing,
  getMorningBrief,
  getEodWrap,
  triggerMorningBriefGeneration,
  triggerEodWrapGeneration,
  getBriefingHistory,
  BriefingSnapshotData,
  ExecutivePriorityItem,
} from "@/api/automationApi";
import { ExecutivePriorityCard } from "./ExecutivePriorityCard";
import { AgencyHealthCard } from "./AgencyHealthCard";

export const ExecutiveBriefingPanel: React.FC = () => {
  const { toast } = useToast();
  const [briefTab, setBriefTab] = useState<"LIVE" | "MORNING" | "EOD" | "TOMORROW" | "HISTORY">("LIVE");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [liveData, setLiveData] = useState<any>(null);
  const [morningBrief, setMorningBrief] = useState<BriefingSnapshotData | null>(null);
  const [eodWrap, setEodWrap] = useState<BriefingSnapshotData | null>(null);
  const [history, setHistory] = useState<BriefingSnapshotData[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const [live, morning, eod, hist] = await Promise.all([
        getLiveBriefing().catch(() => null),
        getMorningBrief().catch(() => null),
        getEodWrap().catch(() => null),
        getBriefingHistory(10).catch(() => []),
      ]);
      setLiveData(live);
      setMorningBrief(morning);
      setEodWrap(eod);
      setHistory(hist);
    } catch (err: any) {
      toast({ title: "Failed to load Briefing Engine", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateMorning = async () => {
    try {
      setRefreshing(true);
      const res = await triggerMorningBriefGeneration();
      setMorningBrief(res);
      toast({ title: "Morning Brief Generated! ☀️", description: "Updated canonical 09:00 AM snapshot." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateEod = async () => {
    try {
      setRefreshing(true);
      const res = await triggerEodWrapGeneration();
      setEodWrap(res);
      toast({ title: "EOD Wrap Generated! 🌙", description: "Saved canonical 18:00 PM wrap-up snapshot." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPriorities = (liveData?.priorities || []).filter((p: ExecutivePriorityItem) => {
    if (priorityFilter === "ALL") return true;
    return p.category === priorityFilter;
  });

  const health = liveData?.agencyHealth || morningBrief?.agencyHealth || { score: 86, level: "HEALTHY" };

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="border border-indigo-400/30 bg-indigo-500/20 text-indigo-200 gap-1.5 py-1 px-3">
                <SunMedium className="w-3.5 h-3.5" />
                Phase 5F Executive Engine
              </Badge>
              <Badge
                className={`border text-xs ${
                  health.score >= 80
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                Agency Health: {health.score}/100 • {health.level}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Daily Morning Executive Briefing & EOD Intelligence
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Live operational rollup connecting Phase 5B pipelines, Phase 5C creative content,
              Phase 5D delivery risks, and Phase 5E cash collections into single-click manager decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMorning}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
            >
              <SunMedium className="w-3.5 h-3.5 text-amber-300" />
              Regenerate Morning Brief
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateEod}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
              Generate EOD Wrap
            </Button>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setBriefTab("LIVE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            briefTab === "LIVE" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          ⚡ Live Priorities Queue
        </button>

        <button
          onClick={() => setBriefTab("MORNING")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            briefTab === "MORNING" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <SunMedium className="w-3.5 h-3.5" />
          ☀️ 09:00 AM Morning Snapshot
        </button>

        <button
          onClick={() => setBriefTab("EOD")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            briefTab === "EOD" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          🌙 18:00 PM EOD Wrap
        </button>

        <button
          onClick={() => setBriefTab("TOMORROW")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            briefTab === "TOMORROW" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          🔮 Tomorrow Lookahead
        </button>

        <button
          onClick={() => setBriefTab("HISTORY")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            briefTab === "HISTORY" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          📜 History
        </button>
      </div>

      {/* TAB 1: LIVE PRIORITIES QUEUE */}
      {briefTab === "LIVE" && (
        <div className="space-y-6">
          <AgencyHealthCard health={health} />

          {/* PRIORITY FILTER PILLS */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {["ALL", "DELIVERY", "COLLECTION", "SALES", "CONTENT"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPriorityFilter(cat)}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                    priorityFilter === cat
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredPriorities.length} Action Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPriorities.map((item: ExecutivePriorityItem) => (
              <ExecutivePriorityCard
                key={item.id}
                item={item}
                onExecuteAction={(act) => {
                  toast({
                    title: "Executive Action Triggered",
                    description: `Dispatched command '${act.recommendedAction.command}'.`,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MORNING SNAPSHOT */}
      {briefTab === "MORNING" && morningBrief && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SunMedium className="w-5 h-5 text-amber-500" />
                {morningBrief.narrative.headline}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{morningBrief.narrative.summary}</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Snapshot: {morningBrief.date}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Tasks Due Today</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{morningBrief.delivery.dueToday}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-amber-600 font-semibold uppercase">Expected Collections</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">₹{morningBrief.finance.expectedToday.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-rose-600 font-semibold uppercase">Critical SLA Risks</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{morningBrief.delivery.critical}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-purple-600 font-semibold uppercase">Content Blocking</span>
              <p className="text-xl font-black text-purple-700 mt-0.5">{morningBrief.content.awaitingApproval}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Key Focus Points</h4>
            <div className="space-y-1.5">
              {morningBrief.narrative.focusPoints.map((fp, i) => (
                <div key={i} className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  {fp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EOD WRAP */}
      {briefTab === "EOD" && eodWrap && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                {eodWrap.narrative.headline}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{eodWrap.narrative.summary}</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              EOD: {eodWrap.date}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Accomplishments Today</h4>
            <div className="space-y-1.5">
              {(eodWrap.accomplishments || []).map((acc, i) => (
                <div key={i} className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {acc}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TOMORROW LOOKAHEAD */}
      {briefTab === "TOMORROW" && liveData?.tomorrowPlan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Tomorrow Predictive Lookahead ({liveData.tomorrowPlan.date})
          </h3>
          <div className="space-y-2">
            {(liveData.tomorrowPlan.tomorrowRisks || []).map((risk: string, i: number) => (
              <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                {risk}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HISTORY */}
      {briefTab === "HISTORY" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Archived Daily Snapshots
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900">
                    {h.type === "MORNING" ? "☀️ Morning Brief" : "🌙 EOD Wrap"} ({h.date})
                  </span>
                  <p className="text-slate-500 text-[11px]">{h.narrative?.summary}</p>
                </div>
                <Badge className="bg-slate-200 text-slate-800 text-[10px]">
                  {h.agencyHealth?.score}/100 Health
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
