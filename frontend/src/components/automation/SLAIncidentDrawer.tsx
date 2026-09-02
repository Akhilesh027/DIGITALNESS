import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react";
import { SLAIncidentData } from "@/api/automationApi";

interface SLAIncidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incident: SLAIncidentData | null;
  onApplyAction?: (action: string, payload: any) => void;
}

export const SLAIncidentDrawer: React.FC<SLAIncidentDrawerProps> = ({
  isOpen,
  onClose,
  incident,
  onApprove,
  onApplyAction,
}: any) => {
  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                className={`text-[11px] font-bold ${
                  incident.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : incident.severity === "HIGH"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-blue-100 text-blue-800 border-blue-300"
                }`}
              >
                {incident.severity} • {incident.riskScore}/100 Risk
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {incident.type}
              </Badge>
            </div>
            <span className="text-xs text-slate-400">
              Responsibility: <strong className="text-slate-700">{incident.responsibility}</strong>
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-slate-900 mt-2">
            {incident.workId?.title || "Deliverable SLA Risk Analysis"}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Client: <strong className="text-slate-700">{incident.clientId?.name}</strong> • Due: {new Date(incident.deadline).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </DialogHeader>

        {/* PRIMARY ROOT CAUSE DIAGNOSIS */}
        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-950">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Diagnosed Root Cause</span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed font-medium">
            {incident.primaryRootCause}
          </p>
        </div>

        {/* RISK FACTOR CONTRIBUTIONS */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Risk Factor Decomposition (0-100 Points)
          </span>

          <div className="space-y-1.5">
            {incident.riskFactors.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">{f.label}</span>
                  <p className="text-[11px] text-slate-500">{f.details}</p>
                </div>
                <Badge className="bg-slate-200 text-slate-800 text-[10px] flex-shrink-0">
                  +{f.scoreContribution} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* RECOVERY RECOMMENDATIONS */}
        {incident.recommendations && incident.recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Autonomous Recovery Recommendations
            </span>

            <div className="space-y-2">
              {incident.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-950 block">{rec.label}</span>
                    <span className="text-[10px] text-emerald-700">Confidence: {Math.round(rec.confidence * 100)}%</span>
                  </div>
                  {onApplyAction && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onApplyAction(rec.action, rec.payload);
                        onClose();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-7 gap-1 shadow-xs"
                    >
                      Execute Fix <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
