import React, { useState, useEffect } from "react";
import {
  Cpu,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  Sparkles,
  RefreshCw,
  Layers,
  Calendar,
  DollarSign,
  Briefcase,
  Sliders,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAutomationPolicies,
  updateAutomationPolicy,
  getAutomationSummary,
  triggerAutomationJob,
  AutomationPolicy,
  AutomationSummary,
} from "@/api/automationApi";
import { ClientPipelinePanel } from "./ClientPipelinePanel";
import { ContentCalendarPanel } from "./ContentCalendarPanel";
import { SLAGuardianPanel } from "./SLAGuardianPanel";
import { PaymentRecoveryPanel } from "./PaymentRecoveryPanel";

interface AutomationCenterProps {
  customers?: any[];
}

export const AutomationCenterSkeleton: React.FC<AutomationCenterProps> = ({ customers = [] }) => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"PIPELINE" | "CALENDAR" | "SLA" | "FINANCE" | "POLICIES">("PIPELINE");
  const [policies, setPolicies] = useState<AutomationPolicy[]>([]);
  const [summary, setSummary] = useState<AutomationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      const [pols, summ] = await Promise.all([
        getAutomationPolicies().catch(() => []),
        getAutomationSummary().catch(() => null),
      ]);
      setPolicies(pols);
      setSummary(summ);
    } catch (err: any) {
      toast({ title: "Failed to load automations", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomationData();
  }, []);

  const handleTogglePolicy = async (key: string, currentEnabled: boolean) => {
    try {
      const updated = await updateAutomationPolicy(key, { enabled: !currentEnabled });
      setPolicies((prev) => prev.map((p) => (p.key === key ? updated : p)));
      toast({
        title: updated.enabled ? "Automation Enabled" : "Automation Disabled",
        description: `${updated.name} is now ${updated.enabled ? "Active" : "Paused"}.`,
      });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleModeChange = async (key: string, newMode: any) => {
    try {
      const updated = await updateAutomationPolicy(key, { mode: newMode });
      setPolicies((prev) => prev.map((p) => (p.key === key ? updated : p)));
      toast({
        title: "Policy Mode Updated",
        description: `Set mode to ${newMode}.`,
      });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleManualTrigger = async (jobType: string) => {
    try {
      setTriggeringJob(jobType);
      await triggerAutomationJob(jobType);
      toast({
        title: "Autonomous Job Triggered",
        description: `Ran ${jobType} successfully. Checking updates...`,
      });
      await loadAutomationData();
    } catch (err: any) {
      toast({ title: "Trigger Failed", description: err.message, variant: "destructive" });
    } finally {
      setTriggeringJob(null);
    }
  };

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case "CLIENT_PIPELINE":
        return Briefcase;
      case "CONTENT_CALENDAR":
        return Calendar;
      case "SLA_GUARDIAN":
        return ShieldCheck;
      case "PAYMENT_RECOVERY":
        return DollarSign;
      case "EXECUTIVE_BRIEFING":
        return Sparkles;
      default:
        return Cpu;
    }
  };

  const getModeBadgeClass = (mode: string) => {
    switch (mode) {
      case "AUTO_EXECUTE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "APPROVAL_REQUIRED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DRAFT":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SUGGEST_ONLY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 24/7 AUTONOMOUS STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                24/7 Agency Autonomous Engine Active
              </Badge>
              <span className="text-xs text-slate-400">Phase 5 OS Foundation</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-400" />
              Digitalness Autonomous Command Center
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Deterministic governance over autonomous onboarding pipelines, proactive SLA guardians,
              festival content engines, and executive briefings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAutomationData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
            <Button
              size="sm"
              onClick={() => handleManualTrigger("SLA_WATCHER")}
              disabled={Boolean(triggeringJob)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs font-bold gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              {triggeringJob === "SLA_WATCHER" ? "Running SLA Scan..." : "Scan SLA & Deadlines"}
            </Button>
          </div>
        </div>

        {/* TODAY'S METRICS ROLLUP */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Runs Today</span>
              <p className="text-2xl font-black text-white mt-0.5">{summary.counts.totalRuns}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-emerald-400 uppercase font-semibold">Executed & Verified</span>
              <p className="text-2xl font-black text-emerald-300 mt-0.5">{summary.counts.completed}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-amber-400 uppercase font-semibold">Awaiting Approval</span>
              <p className="text-2xl font-black text-amber-300 mt-0.5">{summary.counts.waitingApproval}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-indigo-400 uppercase font-semibold">Active Policies</span>
              <p className="text-2xl font-black text-indigo-200 mt-0.5">{policies.filter((p) => p.enabled).length} / {policies.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* TODAY'S AI ACTIVITY HIGHLIGHTS ("What Has AI Done Today?") */}
      {summary && summary.highlights.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>What Has AI Done Today?</span>
            </div>
            <span className="text-xs text-slate-400">{summary.highlights.length} Recent Actions</span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
            {summary.highlights.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 text-xs gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{h.summary}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] font-mono text-slate-500 bg-white">
                    {h.engine}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    {new Date(h.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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

      {/* SUB-TAB 1: CLIENT PIPELINE ENGINE */}
      {activeSubTab === "PIPELINE" && (
        <ClientPipelinePanel
          customers={customers}
          onPipelineCreated={loadAutomationData}
        />
      )}

      {/* SUB-TAB 2: CONTENT CALENDAR ENGINE */}
      {activeSubTab === "CALENDAR" && (
        <ContentCalendarPanel
          customers={customers}
        />
      )}

      {/* SUB-TAB 3: SLA GUARDIAN ENGINE */}
      {activeSubTab === "SLA" && (
        <SLAGuardianPanel />
      )}

      {/* SUB-TAB 4: PAYMENT RECOVERY ENGINE */}
      {activeSubTab === "FINANCE" && (
        <PaymentRecoveryPanel />
      )}

      {/* SUB-TAB 5: AUTONOMOUS POLICY GOVERNANCE MATRIX */}
      {activeSubTab === "POLICIES" && (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Autonomous Policy Governance Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Configure autonomy levels for each agency engine (Disabled, Suggest, Draft, Approval Required, Auto-Execute).
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {policies.map((pol) => {
            const Icon = getEngineIcon(pol.engine);
            return (
              <div
                key={pol.key}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  pol.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/70 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{pol.name}</h4>
                      <Badge className={`text-[10px] font-semibold py-0 px-2 border ${getModeBadgeClass(pol.mode)}`}>
                        {pol.mode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{pol.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="w-40">
                    <Select
                      value={pol.mode}
                      onValueChange={(val) => handleModeChange(pol.key, val)}
                      disabled={!pol.enabled}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUGGEST_ONLY">SUGGEST_ONLY</SelectItem>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</SelectItem>
                        <SelectItem value="AUTO_EXECUTE">AUTO_EXECUTE</SelectItem>
                        <SelectItem value="DISABLED">DISABLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pol.enabled}
                      onCheckedChange={() => handleTogglePolicy(pol.key, pol.enabled)}
                    />
                    <span className="text-xs font-semibold text-slate-600 w-10">
                      {pol.enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
