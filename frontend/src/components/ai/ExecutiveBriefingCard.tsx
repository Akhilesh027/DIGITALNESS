import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  SunMedium,
  CheckCircle2,
  DollarSign,
  Users,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLiveBriefing, BriefingSnapshotData } from "@/api/automationApi";

interface ExecutiveBriefingCardProps {
  onOpenFullBriefing?: () => void;
}

export const ExecutiveBriefingCard: React.FC<ExecutiveBriefingCardProps> = ({
  onOpenFullBriefing,
}) => {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLiveBriefing()
      .then((data) => setBriefing(data))
      .catch(() => {});
  }, []);

  if (!briefing) return null;

  const health = briefing.agencyHealth || { score: 86, level: "HEALTHY" };
  const metrics = briefing.metrics || {};
  const prioritiesCount = briefing.priorities?.length || 0;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-5 text-white shadow-lg border border-indigo-500/20 relative overflow-hidden space-y-4">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <SunMedium className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              30-Second Executive Summary
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight">Daily Morning Briefing</h4>
          </div>
        </div>

        <Badge
          className={`text-xs font-bold px-2.5 py-0.5 border ${
            health.score >= 80
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
          }`}
        >
          Agency Health: {health.score}/100
        </Badge>
      </div>

      {/* 4 CORE EXECUTIVE METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Expected Today</span>
          <p className="text-base font-black text-amber-300">
            ₹{(metrics.finance?.expectedToday || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Critical Delivery</span>
          <p className="text-base font-black text-rose-400">
            {metrics.delivery?.critical || 0} At Risk
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Hot Leads</span>
          <p className="text-base font-black text-emerald-300">
            {metrics.sales?.hotLeads || 0} Active
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Pending Approvals</span>
          <p className="text-base font-black text-purple-300">
            {metrics.delivery?.awaitingApproval || metrics.content?.awaitingApproval || 0} Tasks
          </p>
        </div>
      </div>

      {/* NARRATIVE HIGHLIGHT */}
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
        {briefing.narrative?.summary || "Operations are running with prioritized delivery and collection milestones scheduled for today."}
      </p>

      {/* FOOTER CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <span className="text-xs text-slate-400">
          <strong className="text-white font-bold">{prioritiesCount}</strong> items require manager attention
        </span>
        {onOpenFullBriefing && (
          <Button
            size="sm"
            onClick={onOpenFullBriefing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-7 px-3 gap-1 shadow-xs"
          >
            Review Priorities <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
