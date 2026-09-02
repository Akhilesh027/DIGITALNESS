import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Send,
  QrCode,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { CollectionFollowupData } from "@/api/automationApi";

interface CollectionPriorityCardProps {
  followup: CollectionFollowupData;
  onOpenDetails: (f: CollectionFollowupData) => void;
  onQuickReminder?: (invoiceId: string) => void;
}

export const CollectionPriorityCard: React.FC<CollectionPriorityCardProps> = ({
  followup,
  onOpenDetails,
  onQuickReminder,
}) => {
  const inv = followup.invoiceId;
  const balance = inv?.balanceAmount || followup.balanceAtDetection || 0;
  const isDisputed = followup.status === "DISPUTED" || followup.dispute?.active;

  const hasBrokenPromise = followup.promises?.some((p) => p.status === "BROKEN");
  const hasActivePromise = followup.promises?.some((p) => p.status === "PENDING");

  const getPriorityBadgeClass = (score: number) => {
    if (score >= 85) return "bg-rose-100 text-rose-800 border-rose-300";
    if (score >= 70) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
      {/* TOP ROW */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] font-bold py-0.5 px-2 border ${getPriorityBadgeClass(followup.priorityScore)}`}>
            {followup.priorityScore}/100 Priority
          </Badge>
          <span className="text-xs font-bold text-slate-900 truncate">
            {followup.clientId?.name || "Client"}
          </span>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600">
          {followup.agingBucket}
        </Badge>
      </div>

      {/* BALANCE & INVOICE */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Outstanding Due</span>
          <p className="text-sm font-black text-slate-900">₹{balance.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Invoice</span>
          <p className="text-xs font-bold text-slate-700">{inv?.invoiceNumber || "INV"}</p>
        </div>
      </div>

      {/* STATUS BADGES: PROMISES OR DISPUTES */}
      <div className="flex flex-wrap gap-1.5 min-h-[22px]">
        {hasBrokenPromise && (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3" /> Missed Promise to Pay
          </Badge>
        )}
        {hasActivePromise && !hasBrokenPromise && (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] gap-1">
            <Handshake className="w-3 h-3" /> Active Promise Pending
          </Badge>
        )}
        {isDisputed && (
          <Badge className="bg-purple-100 text-purple-800 text-[10px]">
            Disputed Account
          </Badge>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
        <button
          onClick={() => onOpenDetails(followup)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          View Account <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {onQuickReminder && inv && !isDisputed && (
          <Button
            size="sm"
            onClick={() => onQuickReminder(inv._id)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] h-7 px-2.5 gap-1 shadow-xs"
          >
            <Send className="w-3 h-3" /> Remind
          </Button>
        )}
      </div>
    </div>
  );
};
