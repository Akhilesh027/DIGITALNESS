import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  RefreshCw,
  Calendar,
  Layers,
  PhoneCall,
  MessageSquare,
  CreditCard,
  IndianRupee,
  Receipt,
  Download,
  ShieldCheck,
  FileText,
  Eye,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId, getMediaUrl } from "../config/api";
import { MOCK_WORKS, MOCK_PAYMENTS } from "../data/mockData";

export default function DashboardPage() {
  const { client, customer, refreshProfile } = useAuth();
  const [works, setWorks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const customerId = extractCustomerId(client, customer);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(num || 0));
  };

  const normalizeWorks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.work)) return data.work;
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.customer?.works)) return data.customer.works;
    return [];
  };

  const fetchDashboardData = useCallback(async () => {
    if (!customerId) {
      setWorks(MOCK_WORKS);
      setInvoices(MOCK_PAYMENTS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = getAuthHeaders();

      // Parallel fetch for works, invoices, and payments
      const [worksRes, invoicesRes, paymentsRes, proposalsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/works/customer/${customerId}`, { headers }),
        fetch(`${API_BASE_URL}/invoices?customerId=${customerId}`, { headers }),
        fetch(`${API_BASE_URL}/payments?customerId=${customerId}`, { headers }),
        fetch(`${API_BASE_URL}/proposals?customerId=${customerId}`, { headers }),
      ]);

      // Parse works
      if (worksRes.status === "fulfilled" && worksRes.value.ok) {
        const data = await worksRes.value.json();
        const normalized = normalizeWorks(data);
        setWorks(normalized.length > 0 ? normalized : MOCK_WORKS);
      } else {
        setWorks(MOCK_WORKS);
      }

      // Parse invoices
      if (invoicesRes.status === "fulfilled" && invoicesRes.value.ok) {
        const invData = await invoicesRes.value.json();
        const list = Array.isArray(invData)
          ? invData
          : Array.isArray(invData.data)
          ? invData.data
          : Array.isArray(invData.invoices)
          ? invData.invoices
          : [];
        setInvoices(list);
      }

      // Parse payments
      if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
        const payData = await paymentsRes.value.json();
        const list = Array.isArray(payData)
          ? payData
          : Array.isArray(payData.data)
          ? payData.data
          : Array.isArray(payData.payments)
          ? payData.payments
          : [];
        setPayments(list);
      }

      // Parse proposals
      if (proposalsRes.status === "fulfilled" && proposalsRes.value.ok) {
        const propData = await proposalsRes.value.json();
        const list = Array.isArray(propData)
          ? propData
          : Array.isArray(propData.data)
          ? propData.data
          : Array.isArray(propData.proposals)
          ? propData.proposals
          : [];
        setProposals(list);
      }
    } catch {
      setWorks(MOCK_WORKS);
      setInvoices(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshProfile) await refreshProfile();
    await fetchDashboardData();
  };

  // Flatten works & tasks
  const allItems = useMemo(() => {
    const list = [];
    works.forEach((work) => {
      list.push({
        ...work,
        itemType: work.parentWorkId ? "Task" : "Work",
      });

      const childTasks = [
        ...(Array.isArray(work.tasks) ? work.tasks : []),
        ...(Array.isArray(work.taskList) ? work.taskList : []),
        ...(Array.isArray(work.subTasks) ? work.subTasks : []),
        ...(Array.isArray(work.subtasks) ? work.subtasks : []),
        ...(Array.isArray(work.children) ? work.children : []),
      ];

      childTasks.forEach((t) => {
        list.push({
          ...t,
          itemType: "Task",
          parentTitle: work.title,
        });
      });
    });
    return list;
  }, [works]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const worksCount = allItems.filter((i) => i.itemType === "Work").length;
    const tasksCount = allItems.filter((i) => i.itemType === "Task").length;
    const completed = allItems.filter((i) => i.status === "Completed").length;
    const progress = allItems.filter((i) => i.status === "In Progress").length;
    const review = allItems.filter((i) => i.status === "Review").length;
    const revision = allItems.filter((i) => i.status === "Revision").length;
    const pending = allItems.filter(
      (i) => i.status === "Pending" || i.status === "Not Started" || !i.status
    ).length;

    const completionPercent = total ? Math.round((completed / total) * 100) : 0;
    const activePercent = total ? Math.round(((progress + review) / total) * 100) : 0;

    return {
      total,
      worksCount,
      tasksCount,
      completed,
      progress,
      review,
      revision,
      pending,
      completionPercent,
      activePercent,
    };
  }, [allItems]);

  // Financial stats calculation
  const financialStats = useMemo(() => {
    // If customer has backend totals, use them or compute from live invoices
    const totalBilled = invoices.reduce(
      (acc, inv) => acc + Number(inv.total || inv.amount || 0),
      0
    );
    const totalPaid = payments.reduce(
      (acc, p) => acc + Number(p.amount || p.paidAmount || 0),
      0
    );
    const fallbackPending = Math.max(0, totalBilled - totalPaid);
    const pendingBalance =
      customer?.totalPending !== undefined ? customer.totalPending : fallbackPending;

    return {
      totalBilled: totalBilled || Number(customer?.totalBilled || 0),
      totalPaid: totalPaid || Number(customer?.totalPaid || 0),
      pendingBalance: pendingBalance,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
    };
  }, [invoices, payments, customer]);

  const statusBars = [
    { label: "Completed", value: stats.completed, color: "bg-emerald-500", text: "text-emerald-400" },
    { label: "In Progress", value: stats.progress, color: "bg-amber-500", text: "text-amber-400" },
    { label: "Review", value: stats.review, color: "bg-blue-500", text: "text-blue-400" },
    { label: "Pending", value: stats.pending, color: "bg-slate-500", text: "text-slate-400" },
    { label: "Revision", value: stats.revision, color: "bg-purple-500", text: "text-purple-400" },
  ];

  const priorityBars = useMemo(() => {
    const list = ["Urgent", "High", "Medium", "Low"];
    return list.map((priority) => ({
      label: priority,
      value: allItems.filter((i) => i.priority === priority).length,
      color:
        priority === "Urgent"
          ? "bg-rose-500"
          : priority === "High"
          ? "bg-orange-500"
          : priority === "Medium"
          ? "bg-amber-500"
          : "bg-emerald-500",
    }));
  }, [allItems]);

  const recentWorks = works.slice(0, 4);

  const formatDate = (d) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Revision":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-700/30 text-slate-300 border-slate-700/50";
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                👋 Welcome Back
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {client?.name || customer?.name || "Innovate Client"}
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {customer?.businessType || client?.businessType || "Digital Marketing Partner"} • Active Package:{" "}
              <span className="text-brand-400 font-bold">{customer?.package || "Growth Enterprise 360"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Desk</span>
            </button>

            <Link
              to="/works"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition"
            >
              <span>View All Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Overall Completion Progress */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Overall Project Completion
            </span>
            <span className="text-base font-black text-brand-400">
              {stats.completionPercent}% Completed
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-amber-400 to-emerald-400 shadow-glow transition-all duration-700"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 mt-2">
            <strong className="text-white">{stats.completed}</strong> of <strong className="text-white">{stats.total}</strong> total works and tasks successfully completed.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          Project Overview Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">Total Items</p>
            <h4 className="text-2xl font-black text-white mt-1">{stats.total}</h4>
            <span className="text-[11px] text-slate-400">Works & Tasks</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">Major Works</p>
            <h4 className="text-2xl font-black text-purple-400 mt-1">{stats.worksCount}</h4>
            <span className="text-[11px] text-slate-400">Campaigns</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">Completed</p>
            <h4 className="text-2xl font-black text-emerald-400 mt-1">{stats.completed}</h4>
            <span className="text-[11px] text-emerald-400/80">Delivered</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">In Progress</p>
            <h4 className="text-2xl font-black text-amber-400 mt-1">{stats.progress}</h4>
            <span className="text-[11px] text-amber-400/80">Underway</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">Under Review</p>
            <h4 className="text-2xl font-black text-blue-400 mt-1">{stats.review}</h4>
            <span className="text-[11px] text-blue-400/80">Approval Req</span>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400">Pending</p>
            <h4 className="text-2xl font-black text-slate-300 mt-1">{stats.pending}</h4>
            <span className="text-[11px] text-slate-400">In Queue</span>
          </div>
        </div>
      </div>

      {/* Live Financial Snapshot Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              Live Account Financials
            </span>
            <h3 className="text-lg font-black text-white">Billing & Settlements Overview</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Track invoices, verified receipts, and outstanding dues directly synchronized with the agency finance desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Billed</span>
              <strong className="text-white text-base font-black">
                {formatCurrency(financialStats.totalBilled)}
              </strong>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Settled</span>
              <strong className="text-emerald-400 text-base font-black">
                {formatCurrency(financialStats.totalPaid)}
              </strong>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Pending Dues</span>
              <strong className={`text-base font-black ${financialStats.pendingBalance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {formatCurrency(financialStats.pendingBalance)}
              </strong>
            </div>

            <Link
              to="/payments"
              className="px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs shadow-glow transition flex items-center gap-1.5 self-stretch sm:self-center justify-center"
            >
              <span>Manage Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Proposals & Agreements Section */}
      {proposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              Proposals & Agreements
            </h3>
            <Link
              to="/proposals"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.slice(0, 3).map((proposal) => {
              const proposalValue = Number(proposal.grandTotal || proposal.totalAmount || 0);
              const isAccepted = proposal.status === "Accepted";
              const isSent = proposal.status === "Sent";

              return (
                <div key={proposal._id} className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-1.5 font-mono">
                        {proposal.proposalNumber || `PR-${proposal._id?.slice(-4)}`}
                      </span>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {proposal.title || proposal.proposalTitle || "Agency Proposal"}
                      </h4>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      isAccepted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isSent
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        : "bg-slate-700/30 text-slate-300 border-slate-700/50"
                    }`}>
                      {proposal.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(proposal.proposalDate || proposal.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(proposalValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Dues Card */}
      {financialStats.pendingBalance > 0 && (
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-amber-500 bg-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Pending Dues</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  You have outstanding invoices totalling{" "}
                  <strong className="text-amber-400">{formatCurrency(financialStats.pendingBalance)}</strong>
                </p>
              </div>
            </div>
            <Link
              to="/payments"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition shrink-0"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Settle Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* Analytics Rows: Progress Insights & Status Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-6 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white">Status Breakdown</h4>
            <span className="text-xs text-slate-400 font-semibold">{stats.total} Total</span>
          </div>

          <div className="space-y-3 pt-2">
            {statusBars.map((bar) => {
              const pct = stats.total ? Math.round((bar.value / stats.total) * 100) : 0;
              return (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{bar.label}</span>
                    <span className="font-bold text-slate-400">
                      {bar.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="lg:col-span-6 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white">Priority Distribution</h4>
            <span className="text-xs text-slate-400 font-semibold">Severity & Speed</span>
          </div>

          <div className="space-y-3 pt-2">
            {priorityBars.map((bar) => {
              const pct = stats.total ? Math.round((bar.value / stats.total) * 100) : 0;
              return (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{bar.label} Priority</span>
                    <span className="font-bold text-slate-400">
                      {bar.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Works & Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-400" />
            Active Works & Deliverables
          </h3>
          <Link
            to="/works"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentWorks.map((work) => (
            <div key={work._id} className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-1.5">
                    {work.workType || "Marketing & Tech"}
                  </span>
                  <h4 className="text-base font-bold text-white line-clamp-1">{work.title}</h4>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                    work.status
                  )} shrink-0`}
                >
                  {work.status || "Pending"}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {work.description}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Due: <strong className="text-slate-200">{formatDate(work.dueDate)}</strong>
                </span>

                <span className="font-bold text-brand-400">
                  {work.completedDeliverables || 0}/{work.deliverables || 0} Deliverables
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Support Callout */}
      <div className="glass-card rounded-2xl p-6 border-l-4 border-l-brand-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-400" />
            Need Revisions, New Campaigns, or Priority Assistance?
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Your dedicated account manager and production team are available Monday to Saturday (9:30 AM - 7:30 PM).
            Connect directly via WhatsApp or upload revision files in the attachments tab.
          </p>
        </div>

        <a
          href="https://wa.me/919900000000?text=Hi%20Digitalness%20Team%2C%20I%20have%20an%20inquiry%20regarding%20my%20works."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs shadow-glow transition shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>WhatsApp Account Lead</span>
        </a>
      </div>
    </div>
  );
}
