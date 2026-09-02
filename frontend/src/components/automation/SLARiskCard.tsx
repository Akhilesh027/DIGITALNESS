import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SLAIncidentData } from "@/api/automationApi";

interface SLARiskCardProps {
  incident: SLAIncidentData;
  onOpenDetails: (incident: SLAIncidentData) => void;
  onQuickFix?: (incident: SLAIncidentData) => void;
}

export const SLARiskCard: React.FC<SLARiskCardProps> = ({
  incident,
  onOpenDetails,
  onQuickFix,
}) => {
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const firstRec = incident.recommendations && incident.recommendations[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
      {/* TOP ROW: Client, Risk Score & Responsibility */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] font-bold py-0.5 px-2 border ${getSeverityBadgeClass(incident.severity)}`}>
            {incident.riskScore}/100 Risk
          </Badge>
          <span className="text-xs font-bold text-slate-800 truncate">
            {incident.clientId?.name || "Client"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500">
            {incident.responsibility}
          </Badge>
        </div>
      </div>

      {/* WORK TITLE & DEADLINE */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{incident.workId?.title || "Deliverable"}</h4>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Due: {new Date(incident.deadline).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* DIAGNOSED ROOT CAUSE */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
        <span className="text-[10px] uppercase font-bold text-rose-700 block">Root Cause Diagnosis</span>
        <p className="text-[11px] text-slate-700 leading-snug line-clamp-2">{incident.primaryRootCause}</p>
      </div>

      {/* RECOMMENDATION ACTION & BUTTON */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
        <button
          onClick={() => onOpenDetails(incident)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          View Diagnostics <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {firstRec && onQuickFix && (
          <Button
            size="sm"
            onClick={() => onQuickFix(incident)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-7 px-2.5 gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3" /> Quick Fix
          </Button>
        )}
      </div>
    </div>
  );
};
