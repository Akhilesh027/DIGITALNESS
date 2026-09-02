import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Award,
  Zap,
  Server,
  Layers,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCertificationStatus,
  signOffPilotGoLive,
  toggleKillSwitch,
  CertificationStatusDTO,
  CertificationGateDTO,
} from "@/api/certificationApi";

export const ProductionCertificationDashboard: React.FC = () => {
  const [certData, setCertData] = useState<CertificationStatusDTO | null>(null);
  const [selectedGate, setSelectedGate] = useState<CertificationGateDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOff, setSigningOff] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getCertificationStatus();
      if (res.success) {
        setCertData(res);
      }
    } catch (err: any) {
      toast.error("Failed to load certification status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleKillSwitch = async (domain: string, currentEnabled: boolean) => {
    try {
      const res = await toggleKillSwitch(domain, !currentEnabled);
      if (res.success) {
        toast.success(`Updated write lock for ${domain}: ${!currentEnabled ? "ENABLED" : "LOCKED"}`);
        fetchStatus();
      }
    } catch (err: any) {
      toast.error("Failed to update emergency write lock.");
    }
  };

  const handleSignOff = async () => {
    setSigningOff(true);
    try {
      const res = await signOffPilotGoLive();
      if (res.success) {
        toast.success("Pilot successfully certified for canary rollout!");
        fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to sign off.");
    } finally {
      setSigningOff(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-950 text-slate-100 p-5 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Controlled Production Pilot & Go-Live Certification
          </h1>
          <p className="text-xs text-slate-400">
            Real provider validation, security hardening, domain kill switches, and immutable evidence audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              certData?.status === "PILOT_CERTIFIED"
                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                : certData?.status === "BLOCKED"
                ? "bg-rose-950 text-rose-300 border-rose-800"
                : "bg-amber-950 text-amber-300 border-amber-800"
            }`}
          >
            {certData?.status?.replace("_", " ")}
          </span>

          <button
            onClick={fetchStatus}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Progress & Blocker Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Certification Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <p className="text-xs font-semibold text-slate-400">Certification Gate Completion</p>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-slate-100">{certData?.completionRate || 0}%</span>
            <span className="text-xs text-slate-400">
              {certData?.passedCount || 0} / {certData?.totalCount || 0} Gates Passed
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${certData?.completionRate || 0}%` }}
            />
          </div>
        </div>

        {/* Blocking Issues Alert Box */}
        <div className="lg:col-span-2 bg-amber-950/20 border border-amber-900/60 rounded-2xl p-5 space-y-2">
          <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Production Rollout Blockers ({certData?.blockingIssues?.length || 0})
          </p>
          <ul className="text-xs text-slate-300 space-y-1">
            {certData?.blockingIssues?.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Emergency Kill Switches Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400" /> Emergency Write Locks & Domain Kill Switches
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {/* Global Kill Switch */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <p className="text-xs font-bold text-rose-300">Global Writes</p>
              <p className="text-[10px] text-slate-500">Master Kill Switch</p>
            </div>
            <button
              onClick={() => handleToggleKillSwitch("GLOBAL", certData?.pilotConfig?.externalWritesEnabled || false)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${
                certData?.pilotConfig?.externalWritesEnabled
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {certData?.pilotConfig?.externalWritesEnabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {certData?.pilotConfig?.externalWritesEnabled ? "UNLOCKED" : "LOCKED"}
            </button>
          </div>

          {/* Domain Switches */}
          {certData?.pilotConfig?.domainWrites &&
            Object.entries(certData.pilotConfig.domainWrites).map(([key, enabled]) => (
              <div key={key} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-200 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-[10px] text-slate-500">Domain Write Lock</p>
                </div>
                <button
                  onClick={() => handleToggleKillSwitch(key, enabled)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    enabled ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {enabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {enabled ? "ENABLED" : "LOCKED"}
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Certification Gates Grid & Evidence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gates Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" /> Certification Domain Gates Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 pb-2">
                  <th className="py-2.5 px-3">Gate Identifier</th>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {certData?.gates?.map((gate) => (
                  <tr
                    key={gate.gateId}
                    onClick={() => setSelectedGate(gate)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-200">{gate.gateId}</td>
                    <td className="py-3 px-3 text-slate-400">{gate.domain}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          gate.status === "PASS"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : gate.status === "FAIL"
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {gate.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1">
                        Evidence <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evidence Drawer Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-200">Safe Evidence Inspector</h3>
            {selectedGate ? (
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <p className="font-bold text-indigo-400">{selectedGate.gateId}</p>
                <p className="text-slate-400">Domain: {selectedGate.domain}</p>
                <p className="text-slate-400">
                  Tested At: {selectedGate.testedAt ? new Date(selectedGate.testedAt).toLocaleString() : "Not Run"}
                </p>
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-300">Evidence References:</p>
                  <pre className="p-2 rounded bg-slate-900 text-[11px] text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedGate.evidenceRefs, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select any gate from the table to view non-secret evidence references.</p>
            )}
          </div>

          {/* Sign-Off Action */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400">
              Final sign-off unlocks canary client rollout for certified domains.
            </p>
            <button
              onClick={handleSignOff}
              disabled={signingOff}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {signingOff ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Certify Pilot for Production Canary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionCertificationDashboard;
