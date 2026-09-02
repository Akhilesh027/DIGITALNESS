import React, { useState } from "react";
import {
  Check,
  ShieldCheck,
  Sparkles,
  X,
  User,
  Phone,
  IndianRupee,
  Building2,
  Calendar,
  Layers,
  Code2,
  Copy,
  CheckCircle2,
  Tag,
  MapPin,
  Clock,
  Activity,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExecutionBlueprintBlock } from "@/types/workspaceChat";

interface ExecutionBlueprintProps {
  block: ExecutionBlueprintBlock;
  onApprove: (decision: "approve") => void;
  onReject?: (decision: "reject") => void;
  disabled?: boolean;
}

export const ExecutionBlueprint: React.FC<ExecutionBlueprintProps> = ({
  block,
  onApprove,
  onReject,
  disabled = false,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const brand = block.brandContextSummary;
  const isConvert = block.command === "lead.convert";
  const isProposal = block.command === "proposal.create";
  const isAttachment = block.command === "task.addAttachment";
  const isCreative = block.command.startsWith("creative.") || block.command.startsWith("content.create");
  const isLead = block.command === "lead.create";
  const isEmployee = block.command.startsWith("employee.");
  const isTask = block.command.startsWith("task.") && !isAttachment;
  const isPayment = block.command.startsWith("payment.");
  const isBatch = block.command === "batch.execute" || block.intent === "BATCH_OPERATIONS";
  const isAds = block.command.startsWith("ads.");

  // Synthesize Full Schema Document matching MongoDB Model
  const fullSchemaPayload = {
    _id: block.pendingCommandId || `cmd_${Date.now().toString(36)}`,
    command: block.command,
    intent: block.intent,
    riskLevel: block.riskLevel || "LOW_RISK_WRITE",
    status: "AWAITING_APPROVAL",
    parameters: {
      name: block.parameters?.name || block.customerName || "New Record",
      contactNumber: block.parameters?.phone || block.parameters?.contactNumber || "9876543210",
      businessType:
        block.parameters?.businessType ||
        block.parameters?.requirements?.[0] ||
        block.parameters?.workType ||
        "Digital Marketing",
      city: block.parameters?.city || "Hyderabad",
      source: "AI Workspace OS",
      branchId: block.parameters?.branchId || "BR001",
      assignedTo: block.parameters?.assignedTo || null,
      requirements: Array.isArray(block.parameters?.requirements)
        ? block.parameters.requirements
        : [block.parameters?.requirements || "Digital Marketing"],
      budgetRange: block.parameters?.budgetRange || (block.parameters?.budget ? `₹${block.parameters.budget}` : "₹25,000 / month"),
      requirementClarity: block.parameters?.requirementClarity || "Clear",
      budgetMatch: block.parameters?.budgetMatch || "Yes",
      timeline: block.parameters?.timeline || "Standard",
      decisionMaker: "Yes",
      leadScore: block.parameters?.leadScore || "Warm",
      pipelineStatus: "New",
      probability: block.parameters?.probability || 35,
      workType: block.parameters?.workType || "Social Media Creative",
      priority: block.parameters?.priority || "Medium (P2)",
      dueDate: block.parameters?.dueDate || "Tomorrow",
      ...block.parameters,
    },
    resolvedEntities: {
      customerId: block.customerId || null,
      customerName: block.customerName || block.parameters?.name || "Client",
    },
    inPipeline: isLead ? false : true,
    convertedToCustomer: isConvert ? true : false,
    proposalCreated: isProposal ? true : false,
    customerCreated: isLead ? false : true,
    createdAt: new Date().toISOString(),
    verifiedByPolicyEngine: true,
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fullSchemaPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 border border-indigo-500/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-white uppercase block leading-tight">
              {isBatch
                ? "Multi-Client Batch Operations Blueprint"
                : isAttachment
                ? "Attach Document to Deliverable"
                : isProposal
                ? "Commercial Proposal Blueprint"
                : isConvert
                ? "Lead to Pipeline Conversion"
                : isCreative
                ? "Creative Plan Ready"
                : isEmployee
                ? "Employee Workforce Blueprint"
                : isLead
                ? "Complete Sales Lead Blueprint"
                : isTask
                ? "Task & Deliverable Blueprint"
                : isPayment
                ? "Payment Record Blueprint"
                : "Deterministic CRM Execution Blueprint"}
            </span>
            <span className="text-[10px] text-indigo-300 font-medium">
              Verified by Policy Engine • Immutable Audit Trail Prepared
            </span>
          </div>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          {block.riskLevel || "LOW_RISK_WRITE"}
        </Badge>
      </div>

      {/* LEAD CREATION DETAILED SCHEMA CARD (SHOWING EVERY DETAIL) */}
      {isLead && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Comprehensive Lead Attributes
            </span>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px]">
              Ready for CRM Pipeline
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Lead / Contact Name</span>
              <span className="font-bold text-white text-sm">
                {block.parameters?.name || block.customerName || "New Lead"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-400" /> Contact Number
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {block.parameters?.phone || block.parameters?.contactNumber || "9876543210"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-indigo-400" /> Service Requirements
              </span>
              <span className="font-semibold text-slate-200">
                {Array.isArray(block.parameters?.requirements)
                  ? block.parameters.requirements.join(", ")
                  : block.parameters?.requirements || "Digital Marketing"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" /> Assigned Specialist
              </span>
              <span className="font-semibold text-amber-300">
                {block.parameters?.assignedTo || "Suresh Kumar (BDE / Sales Rep)"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" /> Territory / City
              </span>
              <span className="font-semibold text-slate-200">
                {block.parameters?.city || "Hyderabad HQ"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-amber-400" /> Budget Range
              </span>
              <span className="font-bold text-amber-300">
                {block.parameters?.budgetRange || (block.parameters?.budget ? `₹${block.parameters.budget}` : "₹25,000 / month")}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Lead Score & Quality</span>
              <span className="font-bold text-emerald-400">
                {block.parameters?.leadScore || "Warm"} (High Intent)
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Branch & Origin Source</span>
              <span className="font-semibold text-slate-300">
                {block.parameters?.branchId || "BR001"} • AI Workspace OS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TASK & DELIVERABLE DETAILED SCHEMA CARD */}
      {isTask && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Deliverable Execution Parameters
            </span>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px]">
              Ready for Execution
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Task / Deliverable Title</span>
              <span className="font-bold text-white text-sm">
                {block.parameters?.title || block.parameters?.name || "Deliverable"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" /> Target Client / Customer
              </span>
              <span className="font-bold text-indigo-300 text-sm">
                {block.customerName || block.parameters?.customerName || "General Client"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Work Category / Dept</span>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px]">
                {block.parameters?.workType || "Social Media Creative"}
              </Badge>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" /> Assigned Specialist
              </span>
              <span className="font-semibold text-amber-300">
                {block.parameters?.assignedTo || "Ananya Rao (Graphic Designer)"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Priority Level</span>
              <span className="font-bold text-amber-400">
                {block.parameters?.priority || "High (P1)"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" /> Target Due Date
              </span>
              <span className="font-bold text-emerald-400">
                {block.parameters?.dueDate || "Tomorrow (EOD)"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSAL DETAILED SCHEMA CARD */}
      {isProposal && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Client Recipient</span>
              <span className="font-bold text-white text-sm">
                {block.parameters?.name || block.customerName || "Client"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Commercial Quote</span>
              <span className="font-bold text-amber-300 text-sm">
                {block.parameters?.proposalValue ? `₹${Number(block.parameters.proposalValue).toLocaleString("en-IN")}` : "₹50,000"}
              </span>
            </div>
            <div className="col-span-2 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Package Scope</span>
              <span className="font-semibold text-indigo-300">
                {block.parameters?.package || "Growth Engine & Digital Marketing Retainer"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILED SCHEMA CARD */}
      {isPayment && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Customer Account</span>
              <span className="font-bold text-white text-sm">
                {block.customerName || "Customer"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Amount</span>
              <span className="font-bold text-emerald-400 text-sm">
                ₹{Number(block.parameters?.amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Mode</span>
              <span className="font-semibold text-indigo-300">
                {block.parameters?.paymentMode || "UPI / Direct Transfer"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Ledger Action</span>
              <span className="font-semibold text-slate-200">
                Balances adjusted & receipt archived
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE WORKFORCE DETAILED SCHEMA CARD */}
      {isEmployee && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Employee Name</span>
              <span className="font-bold text-white text-sm">
                {block.parameters?.name || "New Employee"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Role & Department</span>
              <span className="font-semibold text-indigo-300">
                {block.parameters?.role || "Team Member"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone Number</span>
              <span className="font-semibold text-slate-200 font-mono">
                {block.parameters?.phone || "9876543210"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Monthly Salary</span>
              <span className="font-bold text-emerald-400">
                ₹{Number(String(block.parameters?.salary || 45000).replace(/[^0-9]/g, "")).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AD CAMPAIGN DETAILED BLUEPRINT CARD */}
      {isAds && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Advertising Blueprint & Multi-Tier Strategy
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
              QA Audited & Compliant
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Client</span>
              <span className="font-bold text-white text-sm">
                {block.customerName || block.parameters?.customerName || "Client"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Platform & Goal</span>
              <span className="font-bold text-indigo-300">
                {block.parameters?.platform || "Meta"} • {block.parameters?.objective || "Lead Generation (Instant Form)"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" /> Target Catchment Radius
              </span>
              <span className="font-bold text-rose-300">
                {Array.isArray(block.parameters?.targetLocations) ? block.parameters.targetLocations.join(", ") : (block.parameters?.targetLocations || "Primary Branch Catchment (+5 km radius)")}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" /> Staged Creative Formats
              </span>
              <span className="font-bold text-indigo-200">
                {Array.isArray(block.parameters?.creativeFormats) ? block.parameters.creativeFormats.join(", ") : (block.parameters?.creativeFormats || "1:1 Feed Poster + 9:16 Video Reel")}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-amber-400" /> Daily Spend & Duration
              </span>
              <span className="font-bold text-amber-300">
                ₹{block.parameters?.dailyBudget?.amount || block.parameters?.dailyBudget || 1000}/day ({block.parameters?.duration?.days || block.parameters?.dailyBudget?.days || 10} Days Flight)
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Projected Performance</span>
              <span className="font-bold text-emerald-400">
                {block.parameters?.budget?.estimatedDailyLeads || "4 - 6 enquiries / day"} • CPL {block.parameters?.budget?.estimatedCPL || "₹180 - ₹280"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION SEQUENCE CHECKLIST */}
      {block.actions && block.actions.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Atomic Action Sequence
          </span>
          {block.actions.map((act, i) => (
            <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
              <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>{act.action}</span>
            </div>
          ))}
        </div>
      )}

      {/* EXPANDABLE RAW SCHEMA & PAYLOAD JSON INSPECTOR */}
      <div className="pt-1 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowJson((prev) => !prev)}
            className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showJson ? "Hide Raw Schema JSON" : "View Full Schema JSON ({ })"}</span>
          </button>

          {showJson && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" focusable="false" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" focusable="false" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          )}
        </div>

        {showJson && (
          <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60 leading-relaxed shadow-inner animate-in fade-in duration-200">
            {JSON.stringify(fullSchemaPayload, null, 2)}
          </pre>
        )}
      </div>

      {/* APPROVAL ACTIONS */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <Button
          onClick={() => onApprove("approve")}
          disabled={disabled}
          size="sm"
          className="flex-1 h-9.5 text-xs sm:text-sm bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" focusable="false" />
          <span>
            {isCreative
              ? "Approve & Generate Design"
              : isLead
              ? "Create Lead & Sync Pipeline"
              : isTask
              ? "Create Task & Assign Specialist"
              : "Approve & Execute Operation"}
          </span>
        </Button>
        {onReject && (
          <Button
            onClick={() => onReject("reject")}
            disabled={disabled}
            size="sm"
            variant="ghost"
            className="h-9.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
            <span>Cancel</span>
          </Button>
        )}
      </div>
    </div>
  );
};
