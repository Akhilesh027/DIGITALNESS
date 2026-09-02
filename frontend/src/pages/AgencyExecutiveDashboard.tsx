import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  Award,
  Zap,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { getAgencyOverview, getClientsReportingSummary, AgencyOverviewDTO } from "@/api/reportingApi";
import { useNavigate } from "react-router-dom";

export const AgencyExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AgencyOverviewDTO | null>(null);
  const [clientSummaries, setClientSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [agencyRes, clientsRes] = await Promise.all([
        getAgencyOverview(),
        getClientsReportingSummary(),
      ]);

      if (agencyRes.success) setOverview(agencyRes);
      if (clientsRes.success) setClientSummaries(clientsRes.clients || []);
    } catch (err: any) {
      toast.error("Failed to load Executive Dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-950 text-slate-100 p-5 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Digitalness Agency Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Unified multi-client agency performance, normalized ad spend, delivery metrics, lead funnel, and SLA health.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Top 7 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Active Clients</p>
          <p className="text-xl font-bold text-slate-100">{overview?.topKpis?.activeClients || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Published This Month</p>
          <p className="text-xl font-bold text-emerald-400">{overview?.topKpis?.publishedThisMonth || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Scheduled Today</p>
          <p className="text-xl font-bold text-indigo-400">{overview?.topKpis?.scheduledToday || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Total Leads Ingested</p>
          <p className="text-xl font-bold text-slate-100">{overview?.topKpis?.totalLeads || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Qualified Leads</p>
          <p className="text-xl font-bold text-emerald-400">{overview?.topKpis?.qualifiedLeads || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">SLA Breaches</p>
          <p className={`text-xl font-bold ${overview?.topKpis?.slaBreached ? "text-rose-400" : "text-slate-300"}`}>
            {overview?.topKpis?.slaBreached || 0}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Pending Approvals</p>
          <p className="text-xl font-bold text-amber-400">{overview?.topKpis?.pendingApprovals || 0}</p>
        </div>
      </div>

      {/* Main Grid: Ad Performance & Operations Barometer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ad Performance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Paid Advertising Performance (30 Days)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold">
              INR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Meta Ads Spend</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(overview?.adPerformance?.metaSpend || 0)}</p>
              <p className="text-[11px] text-slate-400">{overview?.adPerformance?.metaPrimaryResults || 0} Leads</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Google Ads Spend</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(overview?.adPerformance?.googleSpend || 0)}</p>
              <p className="text-[11px] text-slate-400">{overview?.adPerformance?.googlePrimaryResults || 0} Conversions</p>
            </div>
          </div>

          <div className="p-3.5 bg-purple-950/30 border border-purple-800/60 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-300 font-semibold">Blended Primary Cost Per Lead</p>
              <p className="text-xl font-black text-purple-200">{formatCurrency(overview?.adPerformance?.blendedCPL || null)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Ad Spend</p>
              <p className="text-sm font-bold text-slate-200">{formatCurrency(overview?.adPerformance?.totalAdSpend || 0)}</p>
            </div>
          </div>
        </div>

        {/* Operations Barometer Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Agency Operations Barometer
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Content Delivery Rate</span>
                <span className="font-bold text-emerald-400">{overview?.operationsBarometer?.contentDeliveryRate || 100}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${overview?.operationsBarometer?.contentDeliveryRate || 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">SLA Compliance Rate</span>
                <span className="font-bold text-indigo-400">{overview?.operationsBarometer?.slaComplianceRate || 100}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${overview?.operationsBarometer?.slaComplianceRate || 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-xs">
            <span className="text-slate-400">Total Inbox Inquiries:</span>
            <span className="font-bold text-slate-200">{overview?.operationsBarometer?.totalInboxItems || 0}</span>
          </div>
        </div>
      </div>

      {/* Client Scorecards Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" /> Client Scorecards & Health Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Content Delivery</th>
                <th className="py-2.5 px-3">Meta Spend</th>
                <th className="py-2.5 px-3">Total Leads</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clientSummaries.map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-slate-200">{c.name || c.brandName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.healthScore?.status === "ON_TRACK"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : c.healthScore?.status === "ATTENTION_NEEDED"
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {c.healthScore?.score || 100} / 100 ({c.healthScore?.status?.replace("_", " ")})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.deliveryRate}%</td>
                  <td className="py-3 px-3 text-slate-300">{formatCurrency(c.metaSpend)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{c.totalLeads}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => navigate(`/client-reporting?customerId=${c.customerId}`)}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                    >
                      View Report <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgencyExecutiveDashboard;
