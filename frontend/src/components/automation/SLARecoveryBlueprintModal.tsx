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
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SLAIncidentData } from "@/api/automationApi";

interface SLARecoveryBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: SLAIncidentData[];
  onApproveAll: () => void;
  isExecuting?: boolean;
}

export const SLARecoveryBlueprintModal: React.FC<SLARecoveryBlueprintModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onApproveAll,
  isExecuting,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px] gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              SLA Autonomous Recovery Blueprint
            </Badge>
            <span className="text-xs text-slate-400">{incidents.length} Bottlenecks Identified</span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 mt-1">
            Workload Rebalancing & Deadline Stabilization Blueprint
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Review AI recommended reassignments and remediation steps before updating CRM records.
          </p>
        </DialogHeader>

        {/* INCIDENTS REMEDIATION LIST */}
        <div className="space-y-3">
          {incidents.map((inc, i) => {
            const rec = inc.recommendations && inc.recommendations[0];

            return (
              <div
                key={inc._id || i}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{inc.workId?.title || "Deliverable"}</span>
                  </div>
                  <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                    {inc.riskScore}/100 Risk
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Root Issue</span>
                    <p className="text-slate-700 text-[11px] font-medium">{inc.primaryRootCause}</p>
                  </div>
                  <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Recommended Solution</span>
                    <p className="text-emerald-950 text-[11px] font-bold">{rec ? rec.label : "Rebalance Workload"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onApproveAll}
            disabled={isExecuting || incidents.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isExecuting ? "Executing Reassignments..." : `Approve & Remediate ${incidents.length} Risks`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
