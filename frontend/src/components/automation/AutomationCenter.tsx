import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  Play,
  Settings2,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
  Calendar,
  DollarSign,
  SunMedium,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getAutomationPolicies,
  getAutomationSummary,
  triggerAutomationJob,
  updateAutomationPolicy,
  AutomationPolicy,
  AutomationSummary,
} from "@/api/automationApi";
import { ClientPipelinePanel } from "./ClientPipelinePanel";
import { ContentCalendarPanel } from "./ContentCalendarPanel";
import { SLAGuardianPanel } from "./SLAGuardianPanel";
import { PaymentRecoveryPanel } from "./PaymentRecoveryPanel";
import { ExecutiveBriefingPanel } from "./ExecutiveBriefingPanel";
import { DecisionInboxPanel } from "./DecisionInboxPanel";

interface AutomationCenterProps {
  customers?: any[];
}

export const AutomationCenter: React.FC<AutomationCenterProps> = ({ customers = [] }) => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"DECISIONS" | "BRIEFING" | "PIPELINE" | "CALENDAR" | "SLA" | "FINANCE" | "POLICIES">("DECISIONS");
  const [policies, setPolicies] = useState<AutomationPolicy[]>([]);
  const [summary, setSummary] = useState<AutomationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      const [policiesData, summaryData] = await Promise.all([
        getAutomationPolicies(),
        getAutomationSummary(),
      ]);
      setPolicies(policiesData);
      setSummary(summaryData);
    } catch (err: any) {
      toast({
        title: "Failed to load Automation Center",
        description: err.message || "Could not connect to Automation API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomationData();
  }, []);

  const handleTriggerJob = async (jobName: string) => {
    try {
      setTriggeringJob(jobName);
      const res = await triggerAutomationJob(jobName);
      toast({
        title: "Autonomous Job Dispatched! 🚀",
        description: res.message || `Successfully executed job ${jobName}`,
      });
      await loadAutomationData();
    } catch (err: any) {
      toast({
        title: "Execution Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleModeChange = async (policyKey: string, newMode: any) => {
    try {
      const updated = await updateAutomationPolicy(policyKey, { mode: newMode });
      setPolicies((prev) =>
        prev.map((p) => (p.key === policyKey ? updated : p))
      );
      toast({
        title: "Policy Updated",
        description: `${policyKey} set to ${newMode}`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const getModeBadgeClass = (mode: string) => {
    switch (mode) {
      case "AUTO_EXECUTE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "APPROVAL_REQUIRED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DRAFT":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "SUGGEST_ONLY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("DECISIONS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "DECISIONS"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          📥 Decision Inbox (Phase 5G)
        </button>

        <button
          onClick={() => setActiveSubTab("BRIEFING")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "BRIEFING"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <SunMedium className="w-3.5 h-3.5" />
          ☀️ Executive Briefing (Phase 5F)
        </button>

        <button
          onClick={() => setActiveSubTab("PIPELINE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "PIPELINE"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          🚀 Client Pipeline (Phase 5B)
        </button>

        <button
          onClick={() => setActiveSubTab("CALENDAR")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "CALENDAR"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          🗓️ Content Calendar (Phase 5C)
        </button>

        <button
          onClick={() => setActiveSubTab("SLA")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "SLA"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          🛡️ SLA Guardian (Phase 5D)
        </button>

        <button
          onClick={() => setActiveSubTab("FINANCE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "FINANCE"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          💰 Finance & Dues (Phase 5E)
        </button>

        <button
          onClick={() => setActiveSubTab("POLICIES")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "POLICIES"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          ⚙️ Policy Matrix
        </button>
      </div>

      {/* SUB-TAB 0: UNIFIED DECISION INBOX */}
      {activeSubTab === "DECISIONS" && (
        <DecisionInboxPanel onDecisionCleared={loadAutomationData} />
      )}

      {/* SUB-TAB 1: EXECUTIVE BRIEFING ENGINE */}
      {activeSubTab === "BRIEFING" && (
        <ExecutiveBriefingPanel />
      )}

      {/* SUB-TAB 2: CLIENT PIPELINE ENGINE */}
      {activeSubTab === "PIPELINE" && (
        <ClientPipelinePanel
          customers={customers}
          onPipelineCreated={loadAutomationData}
        />
      )}

      {/* SUB-TAB 3: CONTENT CALENDAR ENGINE */}
      {activeSubTab === "CALENDAR" && (
        <ContentCalendarPanel
          customers={customers}
        />
      )}

      {/* SUB-TAB 4: SLA GUARDIAN ENGINE */}
      {activeSubTab === "SLA" && (
        <SLAGuardianPanel />
      )}

      {/* SUB-TAB 5: PAYMENT RECOVERY ENGINE */}
      {activeSubTab === "FINANCE" && (
        <PaymentRecoveryPanel />
      )}

      {/* SUB-TAB 6: AUTONOMOUS POLICY GOVERNANCE MATRIX */}
      {activeSubTab === "POLICIES" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Autonomous Policy Governance Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Configure execution modes per domain. Control whether AI runs automatically or requires manager review.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAutomationData}
              disabled={loading}
              className="text-xs font-semibold"
            >
              Refresh Policies
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <div
                key={policy.key}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">{policy.title}</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{policy.description}</p>
                  </div>
                  <Badge className={`text-[10px] font-semibold ${getModeBadgeClass(policy.mode)}`}>
                    {policy.mode}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-mono">Execution Mode:</span>
                  <select
                    value={policy.mode}
                    onChange={(e) => handleModeChange(policy.key, e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="AUTO_EXECUTE">AUTO_EXECUTE</option>
                    <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUGGEST_ONLY">SUGGEST_ONLY</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export const AutomationCenterSkeleton = AutomationCenter;
