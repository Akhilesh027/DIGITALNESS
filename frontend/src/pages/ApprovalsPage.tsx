import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  RefreshCcw,
  RotateCw,
  Search,
  User,
  Users,
  XCircle,
  Shield,
  Sparkles,
  Zap,
  Layers,
  History,
  Send,
  Ban,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  fetchApprovals,
  fetchApprovalById,
  approveApproval,
  rejectApproval,
  requestApprovalChanges,
  cancelApproval,
  UnifiedApprovalItem,
  ApprovalStatus,
  ApprovalRiskLevel,
} from "@/api/approvalApi";

const statusColor: Record<string, string> = {
  DRAFT: "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  AI_GENERATED: "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  WAITING_APPROVAL: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse",
  CHANGES_REQUESTED: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  REGENERATING: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  REJECTED: "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  QUEUED: "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  EXECUTING: "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  EXECUTED: "border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  FAILED: "border-red-400 bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  CANCELLED: "border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  // Legacy aliases
  "Pending Approval": "border-amber-300 bg-amber-50 text-amber-800",
  Approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-300 bg-rose-50 text-rose-700",
  "Revision Requested": "border-blue-300 bg-blue-50 text-blue-700",
};

const riskBadgeConfig: Record<string, { label: string; color: string; desc: string }> = {
  R0: { label: "R0 • Read/Audit", color: "bg-slate-100 text-slate-700 border-slate-300", desc: "No approval needed" },
  R1: { label: "R1 • Draft Gen", color: "bg-blue-50 text-blue-700 border-blue-300", desc: "Internal draft" },
  R2: { label: "R2 • Public Comm", color: "bg-amber-50 text-amber-700 border-amber-300", desc: "Manager approval required" },
  R3: { label: "R3 • High Impact", color: "bg-rose-50 text-rose-700 border-rose-300", desc: "Mandatory Admin/Manager approval" },
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<UnifiedApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal & Action State
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApprovalItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "CANCEL" | null;
    approval: UnifiedApprovalItem | null;
  }>({ open: false, type: null, approval: null });
  const [actionRemark, setActionRemark] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetchApprovals({
        domain: activeTab !== "ALL" ? activeTab : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        riskLevel: riskFilter !== "ALL" ? riskFilter : undefined,
      });
      setApprovals(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [activeTab, statusFilter, riskFilter]);

  const openDetail = async (item: UnifiedApprovalItem) => {
    try {
      setDetailLoading(true);
      const id = item.approvalId || item._id;
      const res = await fetchApprovalById(id);
      setSelectedApproval(res.data || item);
    } catch (err) {
      setSelectedApproval(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleActionSubmit = async () => {
    if (!actionModal.approval || !actionModal.type) return;
    const id = actionModal.approval.approvalId || actionModal.approval._id;

    try {
      setSubmittingAction(true);
      if (actionModal.type === "APPROVE") {
        await approveApproval(id, actionRemark);
        toast.success("Approval granted successfully!");
      } else if (actionModal.type === "REJECT") {
        if (!actionRemark.trim()) {
          toast.error("Please provide a reason for rejection.");
          setSubmittingAction(false);
          return;
        }
        await rejectApproval(id, actionRemark);
        toast.success("Request rejected.");
      } else if (actionModal.type === "REQUEST_CHANGES") {
        if (!actionRemark.trim()) {
          toast.error("Please provide specific feedback on what to change.");
          setSubmittingAction(false);
          return;
        }
        await requestApprovalChanges(id, actionRemark);
        toast.success("Revision requested. Agent will regenerate with feedback.");
      } else if (actionModal.type === "CANCEL") {
        await cancelApproval(id, actionRemark);
        toast.success("Approval cancelled.");
      }

      setActionModal({ open: false, type: null, approval: null });
      setActionRemark("");
      setSelectedApproval(null);
      await loadApprovals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Action failed");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      const q = searchQuery.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const client = (item.customer?.name || item.customer?.companyName || "").toLowerCase();
      const approvalId = (item.approvalId || "").toLowerCase();
      const domain = (item.domain || "").toLowerCase();

      return title.includes(q) || client.includes(q) || approvalId.includes(q) || domain.includes(q);
    });
  }, [approvals, searchQuery]);

  const counts = useMemo(() => {
    return {
      waiting: approvals.filter((a) => a.status === "WAITING_APPROVAL" || a.status === "Pending Approval").length,
      changes: approvals.filter((a) => a.status === "CHANGES_REQUESTED" || a.status === "Revision Requested").length,
      approved: approvals.filter((a) => a.status === "APPROVED" || a.status === "Approved").length,
      total: approvals.length,
    };
  }, [approvals]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 dark:bg-slate-950 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Central Approval Hub
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              Governance Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Human-in-the-loop governance for AI-generated creatives, social posts, ad campaigns, and high-impact actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadApprovals} disabled={loading} className="gap-2">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Waiting for Review</p>
              <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">{counts.waiting}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Revisions Active</p>
              <p className="text-2xl font-bold text-blue-950 dark:text-blue-100">{counts.changes}</p>
            </div>
            <RotateCw className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Approved Decisions</p>
              <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">{counts.approved}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Approvals</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</p>
            </div>
            <Shield className="w-8 h-8 text-primary opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Domain Tabs & Filters */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-3 md:flex md:flex-wrap h-auto p-1">
                <TabsTrigger value="ALL">All Items</TabsTrigger>
                <TabsTrigger value="CREATIVE">Creative</TabsTrigger>
                <TabsTrigger value="SOCIAL_POST">Social</TabsTrigger>
                <TabsTrigger value="META_ADS">Meta Ads</TabsTrigger>
                <TabsTrigger value="GBP">GBP</TabsTrigger>
                <TabsTrigger value="WHATSAPP">WhatsApp</TabsTrigger>
                <TabsTrigger value="INTERNAL">Internal</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title, client, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="WAITING_APPROVAL">Waiting Approval</SelectItem>
                  <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="QUEUED">Queued / Executing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Risks</SelectItem>
                  <SelectItem value="R1">R1 (Draft)</SelectItem>
                  <SelectItem value="R2">R2 (Public)</SelectItem>
                  <SelectItem value="R3">R3 (High Impact)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Loading approvals registry...</p>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">Inbox Zero!</p>
              <p className="text-xs">No approval requests match your active filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApprovals.map((item) => {
                const risk = riskBadgeConfig[item.riskLevel] || riskBadgeConfig.R1;
                const statusBadgeStyle = statusColor[item.status] || "border-slate-200 bg-slate-50 text-slate-700";
                const isWaiting = item.status === "WAITING_APPROVAL" || item.status === "Pending Approval";
                const isChangesRequested = item.status === "CHANGES_REQUESTED" || item.status === "Revision Requested";

                return (
                  <motion.div
                    key={item.approvalId || item._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 bg-white dark:bg-slate-900 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-xs font-semibold ${statusBadgeStyle}`}>
                          {item.status.replace(/_/g, " ")}
                        </Badge>

                        <Badge variant="outline" className={`text-xs font-semibold ${risk.color}`}>
                          {risk.label}
                        </Badge>

                        <Badge variant="secondary" className="text-xs">
                          {item.domain}
                        </Badge>

                        {item.currentVersion > 1 && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            Version {item.currentVersion}
                          </Badge>
                        )}

                        <span className="text-xs text-muted-foreground font-mono">
                          {item.approvalId}
                        </span>
                      </div>

                      <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <strong>Client:</strong> {item.customer?.companyName || item.customer?.name || "Global / Internal"}
                        </span>
                        <span>
                          <strong>Origin:</strong> {item.sourceAgent || item.submittedByType || "AI Agent"}
                        </span>
                        <span>
                          <strong>Created:</strong> {new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {item.decisionRemarks && (
                        <p className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                          "{item.decisionRemarks}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(item)}
                        className="gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        Inspect
                      </Button>

                      {isWaiting && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 gap-1"
                            onClick={() => setActionModal({ open: true, type: "REQUEST_CHANGES", approval: item })}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            Changes
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => setActionModal({ open: true, type: "REJECT", approval: item })}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => setActionModal({ open: true, type: "APPROVE", approval: item })}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                        </>
                      )}

                      {isChangesRequested && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          Awaiting Agent Re-gen
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Version History Modal */}
      <Dialog open={Boolean(selectedApproval)} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedApproval && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={`text-xs font-semibold ${statusColor[selectedApproval.status]}`}>
                    {selectedApproval.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className={riskBadgeConfig[selectedApproval.riskLevel]?.color}>
                    {riskBadgeConfig[selectedApproval.riskLevel]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{selectedApproval.approvalId}</span>
                </div>
                <DialogTitle className="text-xl font-bold">{selectedApproval.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block">Client:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {selectedApproval.customer?.companyName || selectedApproval.customer?.name || "Global"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Domain:</span>
                    <strong>{selectedApproval.domain}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Current Version:</span>
                    <strong>v{selectedApproval.currentVersion}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Originating Agent:</span>
                    <strong>{selectedApproval.sourceAgent || "AI Orchestrator"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Created At:</span>
                    <span>{new Date(selectedApproval.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Decided By:</span>
                    <span>{selectedApproval.decidedBy?.name || selectedApproval.decidedBy?.email || "Pending Review"}</span>
                  </div>
                </div>

                {/* Versions Breakdown */}
                {selectedApproval.versions && selectedApproval.versions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Version History ({selectedApproval.versions.length} versions)
                    </h4>

                    <div className="space-y-3">
                      {selectedApproval.versions.map((ver) => (
                        <div
                          key={ver.versionNumber}
                          className={`p-3 rounded-lg border text-xs space-y-2 ${
                            ver.versionNumber === selectedApproval.currentVersion
                              ? "border-primary/40 bg-primary/5"
                              : "border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">
                              Version {ver.versionNumber} {ver.versionNumber === selectedApproval.currentVersion && "(Active)"}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(ver.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>

                          {ver.previewUrl && (
                            <div className="rounded overflow-hidden border max-w-xs">
                              <img src={ver.previewUrl} alt="Preview" className="w-full h-auto object-cover" />
                            </div>
                          )}

                          {ver.blueprintPayload && Object.keys(ver.blueprintPayload).length > 0 && (
                            <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-xs max-h-40 overflow-y-auto">
                              <pre>{JSON.stringify(ver.blueprintPayload, null, 2)}</pre>
                            </div>
                          )}

                          {ver.managerFeedback && (
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded text-blue-800 dark:text-blue-300">
                              <strong>Manager Feedback:</strong> {ver.managerFeedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                {selectedApproval.auditHistory && selectedApproval.auditHistory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" />
                      Audit Trail
                    </h4>
                    <div className="border rounded-lg divide-y text-xs max-h-48 overflow-y-auto">
                      {selectedApproval.auditHistory.map((log) => (
                        <div key={log._id} className="p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white mr-2">
                              {log.action.replace(/_/g, " ")}
                            </span>
                            <span className="text-muted-foreground">
                              ({log.fromStatus} &rarr; {log.toStatus})
                            </span>
                            {log.remarks && <p className="text-muted-foreground italic mt-0.5">{log.remarks}</p>}
                          </div>
                          <span className="text-muted-foreground font-mono shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedApproval(null)}>
                  Close
                </Button>
                {(selectedApproval.status === "WAITING_APPROVAL" || selectedApproval.status === "Pending Approval") && (
                  <>
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                      onClick={() => {
                        const item = selectedApproval;
                        setSelectedApproval(null);
                        setActionModal({ open: true, type: "REQUEST_CHANGES", approval: item });
                      }}
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const item = selectedApproval;
                        setSelectedApproval(null);
                        setActionModal({ open: true, type: "REJECT", approval: item });
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        const item = selectedApproval;
                        setSelectedApproval(null);
                        setActionModal({ open: true, type: "APPROVE", approval: item });
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve / Reject / Changes / Cancel) */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ open: false, type: null, approval: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === "APPROVE" && "Authorize & Approve Request"}
              {actionModal.type === "REJECT" && "Reject Approval Request"}
              {actionModal.type === "REQUEST_CHANGES" && "Request Revision / Changes"}
              {actionModal.type === "CANCEL" && "Cancel Approval Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              {actionModal.type === "APPROVE" &&
                "Approving this item marks it as ready for execution. External connectors will only execute after queueing in Step 5."}
              {actionModal.type === "REQUEST_CHANGES" &&
                "Describe the exact changes you want the AI agent or creator to make. A new immutable version (v2) will be generated."}
              {actionModal.type === "REJECT" && "State the reason why this approval request is being rejected permanently."}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold">
                {actionModal.type === "REQUEST_CHANGES" ? "Change Instructions / Feedback *" : "Remarks (Optional)"}
              </label>
              <Textarea
                placeholder={
                  actionModal.type === "REQUEST_CHANGES"
                    ? "e.g. 'Make the ApexBee logo larger and change background color to dark blue.'"
                    : "Add optional decision remark..."
                }
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionModal({ open: false, type: null, approval: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={submittingAction}
              className={
                actionModal.type === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : actionModal.type === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : ""
              }
            >
              {submittingAction ? "Processing..." : "Confirm Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
