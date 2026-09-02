import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Star,
  Users,
  Award,
  Download,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { getClientScorecard, generateReportSnapshot, ClientScorecardDTO } from "@/api/reportingApi";
import { getCustomers } from "@/api/customerApi";

export const ClientReportingWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(searchParams.get("customerId") || "");
  const [scorecard, setScorecard] = useState<ClientScorecardDTO | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "ads" | "leads" | "whatsapp" | "reputation">("overview");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getCustomers().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setCustomers(res);
        if (!selectedCustomerId) {
          setSelectedCustomerId(res[0]._id);
        }
      }
    });
  }, [selectedCustomerId]);

  const fetchScorecard = useCallback(async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      const res = await getClientScorecard(selectedCustomerId);
      if (res.success) {
        setScorecard(res.scorecard);
      }
    } catch (err: any) {
      toast.error("Failed to load client report.");
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId) {
      setSearchParams({ customerId: selectedCustomerId });
      fetchScorecard();
    }
  }, [selectedCustomerId, fetchScorecard, setSearchParams]);

  const handleGenerateSnapshot = async () => {
    if (!selectedCustomerId) return;
    setGenerating(true);
    try {
      const res = await generateReportSnapshot(selectedCustomerId);
      if (res.success) {
        toast.success(`Report Snapshot generated (${res.snapshot.reportSnapshotId})`);
      }
    } catch (err: any) {
      toast.error("Failed to generate report snapshot.");
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "— (Not Connected)";
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-950 text-slate-100 p-5 space-y-5 overflow-y-auto">
      {/* Header & Client Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Client Reporting & Performance Scorecard
          </h1>
          <p className="text-xs text-slate-400">
            Read-only client scorecard combining content delivery, Meta/Google ads, leads, WhatsApp, and reputation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name || c.companyName}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSnapshot}
            disabled={generating}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
            Save Snapshot
          </button>
        </div>
      </div>

      {scorecard && (
        <>
          {/* Executive Grounded Narrative Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {scorecard.customer.name.substring(0, 1)}
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-100">{scorecard.customer.name}</h2>
                  <p className="text-xs text-slate-400">{scorecard.customer.industry || "Marketing & Growth"}</p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    scorecard.healthScore?.status === "ON_TRACK"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  Health Score: {scorecard.healthScore?.score} / 100 ({scorecard.healthScore?.status.replace("_", " ")})
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {scorecard.narrative?.summaryText}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1 shrink-0 overflow-x-auto">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "content", label: "🎨 Content Delivery" },
              { id: "ads", label: "📈 Paid Advertising" },
              { id: "leads", label: "👥 Leads Funnel" },
              { id: "whatsapp", label: "💬 WhatsApp" },
              { id: "reputation", label: "⭐ Reputation & GBP" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Overview / Highlights & Risks */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Highlights */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Key Performance Highlights
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {scorecard.narrative?.highlights?.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks & Recommendations */}
                <div className="p-4 bg-amber-950/20 border border-amber-900/60 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Recommended Next Actions
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2">
                    {scorecard.narrative?.recommendations?.map((r, i) => (
                      <li key={i} className="space-y-0.5">
                        <div className="font-semibold text-amber-300">{r.title}</div>
                        <div className="text-[11px] text-slate-400">{r.recommendedAction}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Content Delivery Tab */}
            {activeTab === "content" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200">Content Calendar & Delivery Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Planned Deliverables</p>
                    <p className="text-xl font-bold text-slate-100">{scorecard.contentDelivery.planned}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Published Posts</p>
                    <p className="text-xl font-bold text-emerald-400">{scorecard.contentDelivery.published}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Reels Published</p>
                    <p className="text-xl font-bold text-indigo-400">{scorecard.contentDelivery.reelsPublished}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Delivery Rate</p>
                    <p className="text-xl font-bold text-emerald-400">{scorecard.contentDelivery.deliveryRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Paid Advertising Tab */}
            {activeTab === "ads" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meta Ads */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm text-purple-300">Meta Marketing API Performance</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Total Spend:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(scorecard.metaAds.spend)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Primary Leads:</span>
                      <span className="font-semibold text-slate-200">{scorecard.metaAds.leads ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Cost Per Lead (CPL):</span>
                      <span className="font-semibold text-purple-300">{formatCurrency(scorecard.metaAds.costPerLead)}</span>
                    </div>
                  </div>
                </div>

                {/* Google Ads */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm text-emerald-300">Google Ads Search Campaigns</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Total Spend:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(scorecard.googleAds.spend)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Conversions:</span>
                      <span className="font-semibold text-slate-200">{scorecard.googleAds.primaryResults ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Cost Per Conversion:</span>
                      <span className="font-semibold text-emerald-300">{formatCurrency(scorecard.googleAds.costPerResult)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leads Funnel Tab */}
            {activeTab === "leads" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200">Inbound Lead Generation Funnel</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Total Leads</p>
                    <p className="text-lg font-bold text-slate-100">{scorecard.leadPipeline.total}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">New / Unreached</p>
                    <p className="text-lg font-bold text-indigo-400">{scorecard.leadPipeline.new}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Contacted</p>
                    <p className="text-lg font-bold text-slate-300">{scorecard.leadPipeline.contacted}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Qualified</p>
                    <p className="text-lg font-bold text-emerald-400">{scorecard.leadPipeline.qualified}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Won Clients</p>
                    <p className="text-lg font-bold text-amber-400">{scorecard.leadPipeline.won}</p>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === "whatsapp" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200">WhatsApp Inbound & Automated Follow-Up Performance</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Inbound Conversations</p>
                    <p className="text-xl font-bold text-slate-100">{scorecard.whatsapp.conversations}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Follow-Ups Sent</p>
                    <p className="text-xl font-bold text-indigo-400">{scorecard.whatsapp.followUpsSent}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Replies After Follow-Up</p>
                    <p className="text-xl font-bold text-emerald-400">{scorecard.whatsapp.responsesAfterFollowUp}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reputation Tab */}
            {activeTab === "reputation" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200">Google Business Profile Reputation & Reviews</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Reviews Received</p>
                    <p className="text-xl font-bold text-slate-100">{scorecard.reputation.reviewsReceived}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Average Rating</p>
                    <p className="text-xl font-bold text-amber-400">{scorecard.reputation.averageRating.toFixed(1)}⭐</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">Review Reply Rate</p>
                    <p className="text-xl font-bold text-emerald-400">{scorecard.reputation.replyRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientReportingWorkspace;
