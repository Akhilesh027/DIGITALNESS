import { useEffect, useState } from "react";
import { Bot, Clock, ShieldCheck, RefreshCcw, CheckCircle2, FileText, Terminal, Wand2, RotateCcw, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAgentRuns, getCommandHistory, rollbackCommand } from "../api/aiApi";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { VerificationBadge } from "@/components/ai/VerificationBadge";
import { useToast } from "@/hooks/use-toast";

export default function AgentActivityPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'commands' | 'campaigns'>('commands');
  const [runs, setRuns] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommand, setSelectedCommand] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsData, commandsData] = await Promise.all([
        getAgentRuns().catch(() => []),
        getCommandHistory(50).catch(() => []),
      ]);
      setRuns(runsData);
      setCommands(commandsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRollback = async (executionId: string) => {
    try {
      const res = await rollbackCommand(executionId);
      toast({ title: "Rollback Complete", description: res.message || "Database state restored." });
      fetchData();
      if (selectedCommand && selectedCommand.executionId === executionId) {
        setSelectedCommand((prev: any) => ({ ...prev, status: "ROLLED_BACK" }));
      }
    } catch (err: any) {
      toast({ title: "Rollback Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Audit Telemetry
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI Command & Agent Audit Stream</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time execution log of all autonomous CRM commands, risk evaluations, and post-mutation DB verifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCcw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab("commands")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "commands"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Terminal className="w-4 h-4" />
          ⚡ Universal Commands ({commands.length})
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "campaigns"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          🎨 Campaign Runs ({runs.length})
        </button>
      </div>

      {/* Detail Modal */}
      {selectedCommand && (
        <Dialog open={Boolean(selectedCommand)} onOpenChange={() => setSelectedCommand(null)}>
          <DialogContent className="max-w-xl p-6 space-y-4">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Command Execution Telemetry
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs">{selectedCommand.executionId}</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Original Prompt</span>
                <p className="text-slate-800 font-semibold text-sm">{selectedCommand.originalPrompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Risk Level</span>
                  <RiskBadge riskLevel={selectedCommand.riskLevel} className="mt-1" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">DB Verification</span>
                  <VerificationBadge status={selectedCommand.verification?.status || "VERIFIED"} details={selectedCommand.verification?.details} className="mt-1" />
                </div>
              </div>

              {selectedCommand.verification?.details && (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                  <span className="font-bold block mb-0.5">Verification Report:</span>
                  <p>{selectedCommand.verification.details}</p>
                </div>
              )}

              {selectedCommand.actions && selectedCommand.actions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700">Actions Executed:</span>
                  <div className="divide-y border rounded-xl bg-white overflow-hidden">
                    {selectedCommand.actions.map((act: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <span className="font-medium text-slate-800">{act.name}</span>
                        <Badge variant="outline" className="text-[10px]">{act.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-[11px] text-slate-400">
                Created {new Date(selectedCommand.createdAt).toLocaleString()}
              </span>
              {selectedCommand.supportsRollback && selectedCommand.status === "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRollback(selectedCommand.executionId)}
                  className="text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Undo / Rollback
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* TAB 1: COMMAND AUDIT STREAM */}
      {activeTab === "commands" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {commands.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No command activities logged yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {commands.map((cmd) => (
                <div
                  key={cmd._id || cmd.executionId}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {cmd.command}
                      </span>
                      {cmd.resolvedEntities?.customerName && (
                        <span className="font-bold text-slate-800 text-xs">
                          🏢 {cmd.resolvedEntities.customerName}
                        </span>
                      )}
                      {cmd.resolvedEntities?.employeeName && (
                        <span className="text-slate-600 text-xs">
                          👤 {cmd.resolvedEntities.employeeName}
                        </span>
                      )}
                      <RiskBadge riskLevel={cmd.riskLevel} />
                    </div>

                    <p className="text-xs text-slate-800 font-medium italic">
                      "{cmd.originalPrompt}"
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>ID: {cmd.executionId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(cmd.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <VerificationBadge
                      status={cmd.verification?.status || (cmd.status === "COMPLETED" ? "VERIFIED" : "NOT_REQUIRED")}
                      details={cmd.verification?.details}
                    />

                    <Badge
                      className={
                        cmd.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : cmd.status === "WAITING_APPROVAL"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : cmd.status === "ROLLED_BACK"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-rose-100 text-rose-800"
                      }
                    >
                      {cmd.status}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCommand(cmd)}
                      className="text-xs h-8 px-2.5"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMPAIGN RUNS STREAM */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {runs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No agent activities logged yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {runs.map((run) => (
                <div key={run._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800">{run.intent}</Badge>
                      <span className="font-bold text-slate-800 text-sm">{run.customerId?.name || "Client"}</span>
                      {run.clientLocationId?.name && (
                        <span className="text-xs text-slate-500">({run.clientLocationId.name})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 italic">{run.originalRequest}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(run.createdAt).toLocaleString()}
                      </span>
                      <span>Readiness: {run.readiness}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        run.executionStatus === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : run.executionStatus === "Awaiting Output Approval"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-indigo-100 text-indigo-800"
                      }
                    >
                      {run.executionStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
