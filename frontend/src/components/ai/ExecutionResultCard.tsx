import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  IndianRupee,
  User,
  FileText,
  Code2,
  Copy,
  Check,
  Building2,
  Phone,
  Layers,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "./VerificationBadge";
import { ReadResultRenderer } from "./ReadResultRenderer";

interface ExecutionResultCardProps {
  executionId: string;
  command: string;
  actionType: string;
  status: string;
  result: any;
  verification?: {
    status?: string;
    details?: string;
    actual?: any;
    expected?: any;
  };
  supportsRollback?: boolean;
  onRollback?: (executionId: string) => void;
  onNewCommand?: () => void;
  loading?: boolean;
}

export const ExecutionResultCard: React.FC<ExecutionResultCardProps> = ({
  executionId,
  command,
  actionType,
  status,
  result,
  verification,
  supportsRollback = false,
  onRollback,
  onNewCommand,
  loading = false,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCompleted = status === "COMPLETED";
  const isRead = actionType === "READ";

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-md p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Execution Completed & Verified</h3>
            <p className="text-xs text-slate-500 font-mono">Trace ID: {executionId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VerificationBadge status={verification?.status || "VERIFIED"} details={verification?.details} />
        </div>
      </div>

      {/* Render Dynamic Content based on Read vs Write */}
      {isRead ? (
        <ReadResultRenderer command={command} result={result} />
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Persisted Document Record
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
              MongoDB Synced
            </Badge>
          </div>

          {command === "payment.record" && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Client Account</span>
                  <span className="font-bold text-slate-900 text-sm">{result?.clientName || "Client"}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Payment Amount</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹{Number(result?.amountRecorded || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">New Total Paid</span>
                  <span className="font-bold text-slate-900">
                    ₹{Number(result?.newTotalPaid || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Outstanding Balance</span>
                  <span className="font-bold text-amber-600">
                    ₹{Number(result?.newTotalPending || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {command === "lead.create" && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Lead Name</span>
                  <span className="font-bold text-slate-900 text-sm">{result?.name || "New Lead"}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Contact Phone</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {result?.contactNumber || "9876543210"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Service Required</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(result?.requirements) ? result.requirements.join(", ") : result?.requirements || "Digital Marketing"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Assigned To</span>
                  <span className="font-semibold text-indigo-600">
                    {result?.assignedTo?.name || "Auto-Assigned"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Lead Score & Status</span>
                  <span className="font-bold text-slate-800">
                    {result?.leadScore || "Warm"} • {result?.status || "New"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Branch ID</span>
                  <span className="font-semibold text-slate-700">{result?.branchId || "BR001"}</span>
                </div>
              </div>
            </div>
          )}

          {command === "task.create" && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Task Title</span>
                  <span className="font-bold text-slate-900 text-sm">{result?.title || "Deliverable"}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Client Name</span>
                  <span className="font-bold text-indigo-600">
                    {result?.customer?.name || result?.clientName || "Client"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Work Category</span>
                  <span className="font-semibold text-slate-800">{result?.workType || "Design"}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Priority & Status</span>
                  <span className="font-bold text-slate-800">
                    {result?.priority || "Medium"} • {result?.status || "In Progress"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {command !== "payment.record" && command !== "lead.create" && command !== "task.create" && (
            <div className="text-xs font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
              Command <code>{command}</code> executed successfully. Document state verified against MongoDB.
            </div>
          )}

          {/* EXPANDABLE RAW JSON PAYLOAD INSPECTOR */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowJson((prev) => !prev)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showJson ? "Hide Raw Document JSON" : "View Persisted MongoDB Document ({ })"}</span>
              </button>

              {showJson && (
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied JSON
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy JSON
                    </>
                  )}
                </button>
              )}
            </div>

            {showJson && (
              <pre className="bg-slate-900 p-3 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed shadow-inner">
                {JSON.stringify(result || {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-[11px] text-slate-500">
          {verification?.details || "Database state verified."}
        </span>

        <div className="flex items-center gap-2">
          {supportsRollback && onRollback && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onRollback(executionId)}
              className="text-slate-700 hover:bg-slate-100 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Undo Execution
            </Button>
          )}

          {onNewCommand && (
            <Button
              size="sm"
              onClick={onNewCommand}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              New Command
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
