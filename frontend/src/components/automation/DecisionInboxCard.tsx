import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  DollarSign,
  Layers,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DecisionItem } from "@/api/automationApi";

interface DecisionInboxCardProps {
  item: DecisionItem;
  onApprove: (item: DecisionItem) => Promise<void>;
  onReject: (item: DecisionItem, reason: string) => Promise<void>;
}

export const DecisionInboxCard: React.FC<DecisionInboxCardProps> = ({
  item,
  onApprove,
  onReject,
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case "CONTENT":
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      case "DELIVERY":
        return <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />;
      case "COLLECTION":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case "SAFE":
      case "R1":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "MODERATE":
      case "R2":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "HIGH_IMPACT":
      case "R3":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "R0":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleApproveClick = async () => {
    try {
      setLoading(true);
      await onApprove(item);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = async () => {
    try {
      setLoading(true);
      await onReject(item, rejectReason || "Rejected by manager");
      setShowRejectInput(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
      {/* HEADER: Domain & Risk Level */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-semibold gap-1 bg-slate-50">
            {getDomainIcon(item.domain)}
            {item.domain}
          </Badge>
          <span className="text-xs font-bold text-slate-900 truncate">
            {item.clientName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge className={`text-[10px] font-bold py-0.5 px-2 border ${getRiskBadgeClass(item.riskLevel)}`}>
            {item.riskLevel === "SAFE" ? "✓ Safe to Approve" : item.riskLevel}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
            {item.impactScore}/100 Impact
          </Badge>
        </div>
      </div>

      {/* TITLE & SUMMARY */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
        <p className="text-[11px] text-slate-600 leading-relaxed">{item.summary}</p>
      </div>

      {/* ITEMS PREVIEW (If Available) */}
      {item.itemsPreview && item.itemsPreview.length > 0 && (
        <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Deliverables Preview
          </span>
          <div className="space-y-1">
            {item.itemsPreview.map((prev, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-800 truncate">• {prev.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(prev.plannedDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECT REASON INPUT */}
      {showRejectInput && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="text-xs flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <Button
            size="sm"
            onClick={handleRejectClick}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-7 px-3"
          >
            Confirm Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRejectInput(false)}
            className="text-xs h-7 px-2"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ACTIONS TOOLBAR */}
      {!showRejectInput && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRejectInput(true)}
            disabled={loading}
            className="text-xs text-rose-700 hover:bg-rose-50 h-7 px-2 gap-1 font-semibold"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </Button>

          <Button
            size="sm"
            onClick={handleApproveClick}
            disabled={loading}
            className={`font-bold text-xs h-7 px-3 gap-1 shadow-xs text-white ${
              item.riskLevel === "SAFE"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {loading ? "Executing..." : "Approve & Execute"}
          </Button>
        </div>
      )}
    </div>
  );
};
