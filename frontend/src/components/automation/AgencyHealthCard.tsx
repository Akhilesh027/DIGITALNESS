import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, TrendingDown } from "lucide-react";

interface AgencyHealthCardProps {
  health: {
    score: number;
    level: string;
    deductions?: {
      category: string;
      amount: number;
      reason: string;
    }[];
  };
}

export const AgencyHealthCard: React.FC<AgencyHealthCardProps> = ({ health }) => {
  const getHealthBadgeClass = (score: number) => {
    if (score >= 85) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (score >= 70) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-rose-50 text-rose-800 border-rose-200";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-900">Agency Health Score Breakdown</h4>
        </div>
        <Badge className={`text-xs font-bold border ${getHealthBadgeClass(health.score)}`}>
          {health.score}/100 • {health.level}
        </Badge>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Transparent Deductions & Factors
        </span>

        {health.deductions && health.deductions.length > 0 ? (
          <div className="space-y-1.5">
            {health.deductions.map((d, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">{d.category}</span>
                  <p className="text-[11px] text-slate-600">{d.reason}</p>
                </div>
                <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                  -{d.amount} pts
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-700 font-medium p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            ✨ Zero deductions! All agency operational and financial metrics are performing at optimal capacity.
          </p>
        )}
      </div>
    </div>
  );
};
