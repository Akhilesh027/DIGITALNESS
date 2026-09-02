import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getSLASummary,
  getSLAIncidents,
  triggerSLAScan,
  rebalanceSLAWorkload,
  recoverSLAIncident,
  SLAIncidentData,
  SLAScanSummary,
} from "@/api/automationApi";
import { SLARiskCard } from "./SLARiskCard";
import { SLAIncidentDrawer } from "./SLAIncidentDrawer";
import { SLARecoveryBlueprintModal } from "./SLARecoveryBlueprintModal";

export const SLAGuardianPanel: React.FC = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<SLAScanSummary | null>(null);
  const [incidents, setIncidents] = useState<SLAIncidentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [activeIncident, setActiveIncident] = useState<SLAIncidentData | null>(null);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);

  const loadSLAData = async () => {
    try {
      setLoading(true);
      const [summ, incs] = await Promise.all([
        getSLASummary().catch(() => null),
        getSLAIncidents(30).catch(() => []),
      ]);
      setSummary(summ);
      setIncidents(incs);
    } catch (err: any) {
      toast({ title: "Failed to load SLA Guardian", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSLAData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const scanRes = await triggerSLAScan();
      setSummary(scanRes);
      toast({
        title: "SLA Scan Completed! 🛡️",
        description: scanRes.summary,
      });
      await loadSLAData();
    } catch (err: any) {
      toast({ title: "Scan Failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleApplyQuickFix = async (incident: SLAIncidentData) => {
    const rec = incident.recommendations && incident.recommendations[0];
    if (!rec) return;

    try {
      await recoverSLAIncident(incident._id, rec.action, rec.payload);
      toast({
        title: "Recovery Applied",
        description: `Executed '${rec.label}' successfully.`,
      });
      await loadSLAData();
    } catch (err: any) {
      toast({ title: "Recovery Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleApproveAllRebalancing = async () => {
    try {
      setIsRebalancing(true);
      const res = await rebalanceSLAWorkload();
      toast({
        title: "Workload Rebalanced! 🎉",
        description: res.message || "Reassigned at-risk tasks to available team members.",
      });
      setIsBlueprintModalOpen(false);
      await loadSLAData();
    } catch (err: any) {
      toast({ title: "Rebalancing Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRebalancing(false);
    }
  };

  const healthScore = summary?.agencyHealthScore || 92;
  const getHealthBadgeClass = (score: number) => {
    if (score >= 85) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (score >= 65) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  };

  return (
    <div className="space-y-6">
      {/* SLA HEALTH BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={`border gap-1.5 py-1 px-3 ${getHealthBadgeClass(healthScore)}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Agency SLA Health: {healthScore}/100
              </Badge>
              <span className="text-xs text-slate-400">Phase 5D Proactive Watcher</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
              Proactive SLA & Deadline Guardian
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Continuously diagnoses workload bottlenecks, imminent breaches, and stalled approvals,
              providing 1-click workload rebalancing before SLA deadlines fail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunScan}
              disabled={scanning}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning Tasks..." : "Run SLA Scan"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBlueprintModalOpen(true)}
              disabled={incidents.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs font-bold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fix All Risks ({incidents.length})
            </Button>
          </div>
        </div>

        {/* METRICS ROLLUP */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Scanned</span>
              <p className="text-2xl font-black text-white mt-0.5">{summary.scannedCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Critical Risks (≥85)</span>
              <p className="text-2xl font-black text-rose-300 mt-0.5">{summary.criticalCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-amber-400 uppercase font-semibold">At Risk (≥50)</span>
              <p className="text-2xl font-black text-amber-300 mt-0.5">{summary.atRiskCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Overdue Breaches</span>
              <p className="text-2xl font-black text-rose-400 mt-0.5">{summary.overdueCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Resolved / Healthy</span>
              <p className="text-2xl font-black text-emerald-300 mt-0.5">{summary.incidentsResolved}</p>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE INCIDENTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Active SLA Incidents & At-Risk Deliverables ({incidents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Sorted by Highest Risk Score</span>
        </div>

        {incidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {incidents.map((inc) => (
              <SLARiskCard
                key={inc._id}
                incident={inc}
                onOpenDetails={(item) => setActiveIncident(item)}
                onQuickFix={handleApplyQuickFix}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">All Agency Deliverables are Healthy! 🎉</h4>
            <p className="text-xs text-slate-500">
              No SLA breaches, stalled reviews, or overloaded bottlenecks detected.
            </p>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      <SLAIncidentDrawer
        isOpen={Boolean(activeIncident)}
        onClose={() => setActiveIncident(null)}
        incident={activeIncident}
        onApplyAction={async (action, payload) => {
          if (activeIncident) {
            await recoverSLAIncident(activeIncident._id, action, payload);
            toast({ title: "Action Applied", description: `Executed ${action} successfully.` });
            await loadSLAData();
          }
        }}
      />

      {/* RECOVERY BLUEPRINT MODAL */}
      <SLARecoveryBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        incidents={incidents}
        onApproveAll={handleApproveAllRebalancing}
        isExecuting={isRebalancing}
      />
    </div>
  );
};
