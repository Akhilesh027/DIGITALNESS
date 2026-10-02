import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Eye,
  IndianRupee,
  Calendar,
  Users,
  Layers,
  X,
  Check,
  Send,
  Download,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId } from "../config/api";

export default function ProposalsPage() {
  const { client, customer } = useAuth();
  const customerId = extractCustomerId(client, customer);

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewProposal, setViewProposal] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(num || 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchProposals = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const token = localStorage.getItem("clientToken") || localStorage.getItem("token");
      if (!token && !customerId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = customerId
        ? `${API_BASE_URL}/proposals?customerId=${customerId}`
        : `${API_BASE_URL}/proposals`;
      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.proposals)
          ? data.proposals
          : [];
        setProposals(list);
      }
    } catch (err) {
      console.warn("Failed to fetch proposals:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProposals();
  };

  const handleAcceptProposal = async (proposal) => {
    setAccepting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(
        `${API_BASE_URL}/proposals/${proposal._id}/status`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Accepted" }),
        }
      );

      if (res.ok) {
        setProposals((prev) =>
          prev.map((p) =>
            p._id === proposal._id ? { ...p, status: "Accepted" } : p
          )
        );
        if (viewProposal?._id === proposal._id) {
          setViewProposal({ ...viewProposal, status: "Accepted" });
        }
      }
    } catch (err) {
      console.warn("Failed to accept proposal:", err.message);
    } finally {
      setAccepting(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Accepted":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          icon: CheckCircle2,
        };
      case "Sent":
        return {
          bg: "bg-sky-500/10",
          text: "text-sky-400",
          border: "border-sky-500/20",
          icon: Send,
        };
      case "Draft":
        return {
          bg: "bg-slate-700/30",
          text: "text-slate-300",
          border: "border-slate-700/50",
          icon: FileText,
        };
      case "Rejected":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/20",
          icon: AlertTriangle,
        };
      case "Expired":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/20",
          icon: Clock,
        };
      default:
        return {
          bg: "bg-brand-500/10",
          text: "text-brand-400",
          border: "border-brand-500/20",
          icon: Sparkles,
        };
    }
  };

  const stats = {
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === "Accepted").length,
    sent: proposals.filter((p) => p.status === "Sent").length,
    draft: proposals.filter((p) => p.status === "Draft").length,
    totalValue: proposals.reduce((acc, p) => acc + Number(p.grandTotal || p.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Proposals & Agreements</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your Proposals
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              View detailed proposals from the agency, track project scope, deliverables,
              timelines, and accept agreements directly.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-400" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-brand-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Proposals</p>
          <h3 className="text-2xl font-black text-white mt-1.5">{stats.total}</h3>
          <span className="text-[11px] text-slate-400">All proposals received</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accepted</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1.5">{stats.accepted}</h3>
          <span className="text-[11px] text-emerald-400/80">Agreements signed</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-sky-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
          <h3 className="text-2xl font-black text-sky-400 mt-1.5">{stats.sent}</h3>
          <span className="text-[11px] text-sky-400/80">Awaiting your decision</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
          <h3 className="text-2xl font-black text-amber-400 mt-1.5">{formatCurrency(stats.totalValue)}</h3>
          <span className="text-[11px] text-amber-400/80">Combined proposal worth</span>
        </div>
      </div>

      {/* Proposals List */}
      <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-extrabold text-white">All Proposals</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Service proposals, scope documents, and project agreements from the agency.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {proposals.length} Proposal{proposals.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
            <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No proposals yet</p>
            <p className="text-xs max-w-sm mx-auto">
              Once the agency creates a proposal for your account, it will appear here for review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposals.map((proposal) => {
              const sc = getStatusConfig(proposal.status);
              const StatusIcon = sc.icon;
              const services = Array.isArray(proposal.services) ? proposal.services : [];
              const proposalValue = Number(proposal.grandTotal || proposal.totalAmount || 0);

              return (
                <div
                  key={proposal._id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 transition space-y-3.5 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                          {proposal.proposalNumber || `PR-${proposal._id?.slice(-4)}`}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} border ${sc.border}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {proposal.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {proposal.title || proposal.proposalTitle || "Agency Proposal"}
                      </h4>
                    </div>
                    <span className="text-sm font-black text-white shrink-0">
                      {formatCurrency(proposalValue)}
                    </span>
                  </div>

                  {/* Services Preview */}
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {services.slice(0, 3).map((svc, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                        >
                          {svc.name || svc.service || svc.description}
                        </span>
                      ))}
                      {services.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          +{services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(proposal.proposalDate || proposal.createdAt)}
                    </span>
                    {proposal.validUntil && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Valid until {formatDate(proposal.validUntil)}
                      </span>
                    )}
                    {proposal.assignedTo?.name && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {proposal.assignedTo.name}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => setViewProposal(proposal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    {(proposal.status === "Sent" || proposal.status === "Draft") && (
                      <button
                        onClick={() => handleAcceptProposal(proposal)}
                        disabled={accepting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 text-slate-950 font-black text-xs transition shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Proposal
                      </button>
                    )}

                    {proposal.status === "Accepted" && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== VIEW DETAILS MODAL ==================== */}
      {viewProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-black text-white">Proposal Details</h3>
              </div>
              <button
                onClick={() => setViewProposal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proposal Number & Status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/20">
                  {viewProposal.proposalNumber || `PR-${viewProposal._id?.slice(-4)}`}
                </span>
                {(() => {
                  const sc = getStatusConfig(viewProposal.status);
                  const StatusIcon = sc.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text} border ${sc.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {viewProposal.status}
                    </span>
                  );
                })()}
              </div>
              <span className="text-xl font-black text-white">
                {formatCurrency(viewProposal.grandTotal || viewProposal.totalAmount || 0)}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-base font-bold text-white">
              {viewProposal.title || viewProposal.proposalTitle || "Agency Proposal"}
            </h4>

            {/* Description */}
            {(viewProposal.description || viewProposal.notes) && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                {viewProposal.description || viewProposal.notes}
              </p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Proposal Date</span>
                <strong className="text-white">{formatDate(viewProposal.proposalDate || viewProposal.createdAt)}</strong>
              </div>
              {viewProposal.validUntil && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Valid Until</span>
                  <strong className="text-white">{formatDate(viewProposal.validUntil)}</strong>
                </div>
              )}
              {viewProposal.assignedTo?.name && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Account Manager</span>
                  <strong className="text-white">{viewProposal.assignedTo.name}</strong>
                </div>
              )}
              {viewProposal.gstPercentage !== undefined && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">GST</span>
                  <strong className="text-white">{viewProposal.gstPercentage}%</strong>
                </div>
              )}
              {viewProposal.discount > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Discount</span>
                  <strong className="text-emerald-400">{formatCurrency(viewProposal.discount)}</strong>
                </div>
              )}
            </div>

            {/* Services Table */}
            {Array.isArray(viewProposal.services) && viewProposal.services.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  Deliverables & Services
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 font-bold">Service</th>
                        <th className="pb-2 font-bold text-center">Qty</th>
                        <th className="pb-2 font-bold text-right">Unit Price</th>
                        <th className="pb-2 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {viewProposal.services.map((svc, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-medium">{svc.name || svc.service || svc.description}</td>
                          <td className="py-2.5 text-center text-slate-400">{svc.quantity || 1}</td>
                          <td className="py-2.5 text-right text-slate-400">{formatCurrency(svc.price || 0)}</td>
                          <td className="py-2.5 text-right font-bold text-white">{formatCurrency(svc.total || (svc.quantity || 1) * (svc.price || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-semibold">{formatCurrency(viewProposal.subtotal || 0)}</span>
                  </div>
                  {viewProposal.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Discount</span>
                      <span className="text-emerald-400 font-semibold">-{formatCurrency(viewProposal.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">GST ({viewProposal.gstPercentage || 18}%)</span>
                    <span className="text-white font-semibold">{formatCurrency(viewProposal.gstAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-700">
                    <span className="text-white font-bold">Grand Total</span>
                    <span className="text-brand-400 font-black text-sm">{formatCurrency(viewProposal.grandTotal || viewProposal.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            {viewProposal.termsAndConditions && (
              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Terms & Conditions</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 rounded-xl p-3 border border-slate-800 whitespace-pre-line">
                  {viewProposal.termsAndConditions}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewProposal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Close
              </button>
              {(viewProposal.status === "Sent" || viewProposal.status === "Draft") && (
                <button
                  onClick={() => handleAcceptProposal(viewProposal)}
                  disabled={accepting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition disabled:opacity-50"
                >
                  {accepting ? "Processing..." : "Accept Proposal"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
