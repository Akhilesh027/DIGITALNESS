import React, { useState, useEffect } from "react";
import {
  Inbox,
  Sparkles,
  CheckCircle2,
  Zap,
  RefreshCw,
  Filter,
  ShieldCheck,
  Layers,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getDecisionInbox,
  approveDecisionItem,
  rejectDecisionItem,
  batchApproveSafeDecisions,
  DecisionItem,
} from "@/api/automationApi";
import { DecisionInboxCard } from "./DecisionInboxCard";

interface DecisionInboxPanelProps {
  onDecisionCleared?: () => void;
}

export const DecisionInboxPanel: React.FC<DecisionInboxPanelProps> = ({
  onDecisionCleared,
}) => {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [safeCount, setSafeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [batching, setBatching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const loadInbox = async () => {
    try {
      setLoading(true);
      const res = await getDecisionInbox();
      setDecisions(res.data || []);
      setSafeCount(res.safeCount || 0);
    } catch (err: any) {
      toast({
        title: "Failed to load Decision Inbox",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const handleApproveItem = async (item: DecisionItem) => {
    try {
      await approveDecisionItem(item.id, item.type, item.payload);
      toast({
        title: "Decision Approved & Executed! 🚀",
        description: `Executed '${item.title}' across operational engines.`,
      });
      await loadInbox();
      if (onDecisionCleared) onDecisionCleared();
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectItem = async (item: DecisionItem, reason: string) => {
    try {
      await rejectDecisionItem(item.id, item.type, reason, item.payload);
      toast({
        title: "Decision Rejected",
        description: `Item '${item.title}' marked as rejected.`,
      });
      await loadInbox();
      if (onDecisionCleared) onDecisionCleared();
    } catch (err: any) {
      toast({
        title: "Rejection Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleBatchApproveSafe = async () => {
    try {
      setBatching(true);
      const res = await batchApproveSafeDecisions();
      toast({
        title: "Batch Safe Approval Complete! ✨",
        description: res.message || `Approved ${res.approvedCount} safe operational items.`,
      });
      await loadInbox();
      if (onDecisionCleared) onDecisionCleared();
    } catch (err: any) {
      toast({
        title: "Batch Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBatching(false);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "SAFE_ONLY") return d.riskLevel === "SAFE";
    return d.domain === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* DECISION INBOX HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="border border-indigo-400/30 bg-indigo-500/20 text-indigo-200 gap-1.5 py-1 px-3">
                <Inbox className="w-3.5 h-3.5" />
                Phase 5G Unified Decision Inbox
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                {decisions.length} Decisions Awaiting Manager
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              Cross-Engine Autonomous Decision Queue
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              One unified inbox for all decisions across Content Calendars, SLA Rebalancing,
              Payment Dues, and Blueprint Approvals. Approve all low-risk items in a single click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {safeCount > 0 && (
              <Button
                onClick={handleBatchApproveSafe}
                disabled={batching}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg h-9 px-4"
              >
                <CheckCircle2 className={`w-4 h-4 ${batching ? "animate-spin" : ""}`} />
                {batching ? "Approving..." : `Approve All Safe (${safeCount} Items)`}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadInbox}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Inbox
            </Button>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "ALL", label: `All Decisions (${decisions.length})` },
            { id: "SAFE_ONLY", label: `✓ Safe Only (${safeCount})` },
            { id: "CONTENT", label: "Content" },
            { id: "DELIVERY", label: "Delivery & SLA" },
            { id: "COLLECTION", label: "Collections" },
            { id: "AUTOMATION", label: "Automation" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                selectedFilter === f.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredDecisions.length} of {decisions.length} Items
        </span>
      </div>

      {/* DECISIONS QUEUE GRID */}
      {filteredDecisions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecisions.map((item) => (
            <DecisionInboxCard
              key={item.id}
              item={item}
              onApprove={handleApproveItem}
              onReject={handleRejectItem}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Decision Inbox is Fully Cleared! 🎉</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Zero pending human bottlenecks. All autonomous pipelines, scheduled content,
              and SLA guardians are running smoothly within approved governance policies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
