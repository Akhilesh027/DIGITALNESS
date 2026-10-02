import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
  Paperclip,
  Plus,
  UploadCloud,
  FileText,
  X,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId, getMediaUrl } from "../config/api";
import { MOCK_PAYMENTS } from "../data/mockData";

export default function PaymentsPage() {
  const { client, customer } = useAuth();
  const customerId = extractCustomerId(client, customer);

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("payments"); // 'payments' | 'invoices' | 'alerts' | 'pending'

  // Submit Payment Proof Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    invoiceId: "",
    amount: "",
    method: "UPI",
    reference: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(num || 0));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchFinancialData = useCallback(async () => {
    const token = localStorage.getItem("clientToken") || localStorage.getItem("token");
    if (!token && !customerId) {
      setInvoices(MOCK_PAYMENTS);
      setPayments(
        MOCK_PAYMENTS.filter((inv) => inv.status === "Paid").map((inv) => ({
          _id: `pay-${inv._id}`,
          reference: inv.referenceId || "REF-BANK-7789",
          amount: inv.total,
          method: inv.paymentMode || "Bank Transfer",
          date: inv.paidAt || inv.date,
          status: "Completed",
          notes: `Settlement for invoice ${inv.invoiceNumber}`,
          invoiceNumber: inv.invoiceNumber,
        }))
      );
      setAlerts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const payUrl = customerId
        ? `${API_BASE_URL}/payments?customerId=${customerId}`
        : `${API_BASE_URL}/payments`;
      const invUrl = customerId
        ? `${API_BASE_URL}/invoices?customerId=${customerId}`
        : `${API_BASE_URL}/invoices`;
      const alertsUrl = customerId
        ? `${API_BASE_URL}/communications/alerts?customerId=${customerId}`
        : `${API_BASE_URL}/communications/alerts`;

      // Parallel fetch for payments, invoices, and alerts
      const [paymentsRes, invoicesRes, alertsRes] = await Promise.allSettled([
        fetch(payUrl, { headers }),
        fetch(invUrl, { headers }),
        fetch(alertsUrl, { headers }),
      ]);

      let loadedPayments = [];
      let loadedInvoices = [];
      let loadedAlerts = [];

      if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
        const payData = await paymentsRes.value.json();
        const arrayData = Array.isArray(payData)
          ? payData
          : Array.isArray(payData?.data)
          ? payData.data
          : Array.isArray(payData?.payments)
          ? payData.payments
          : [];
        loadedPayments = arrayData;
      }

      if (invoicesRes.status === "fulfilled" && invoicesRes.value.ok) {
        const invData = await invoicesRes.value.json();
        const arrayData = Array.isArray(invData)
          ? invData
          : Array.isArray(invData?.data)
          ? invData.data
          : Array.isArray(invData?.invoices)
          ? invData.invoices
          : [];
        loadedInvoices = arrayData;
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
        const alertData = await alertsRes.value.json();
        const arrayData = Array.isArray(alertData)
          ? alertData
          : Array.isArray(alertData?.data)
          ? alertData.data
          : Array.isArray(alertData?.communications)
          ? alertData.communications
          : [];
        loadedAlerts = arrayData;
      } else if (customerId) {
        // Fallback: try customer communications endpoint
        try {
          const altCommRes = await fetch(
            `${API_BASE_URL}/communications/customers/${customerId}/communications`,
            { headers }
          );
          if (altCommRes.ok) {
            const altJson = await altCommRes.json();
            if (Array.isArray(altJson?.data)) loadedAlerts = altJson.data;
            else if (Array.isArray(altJson)) loadedAlerts = altJson;
          }
        } catch {}
      }

      // If no payments from direct query, try fallback endpoint
      if (loadedPayments.length === 0 && customerId) {
        try {
          const altRes = await fetch(`${API_BASE_URL}/payments/customer/${customerId}`, { headers });
          if (altRes.ok) {
            const altData = await altRes.json();
            if (Array.isArray(altData)) loadedPayments = altData;
            else if (Array.isArray(altData?.data)) loadedPayments = altData.data;
          }
        } catch {}
      }

      setPayments(loadedPayments);
      setAlerts(loadedAlerts);

      // Map invoices
      if (loadedInvoices.length > 0) {
        setInvoices(
          loadedInvoices.map((inv) => {
            const original = Number(inv.originalAmount || inv.total || inv.amount || 0);
            const paid = Number(inv.paidAmount || 0);
            const baseAmount = Math.round(original / 1.18);
            const tax = original - baseAmount;
            const balance = Number(inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, original - paid));
            const isPaid = inv.paymentStatus === "PAID" || inv.paymentStatus === "Paid" || balance === 0;
            return {
              _id: inv._id,
              invoiceNumber: inv.invoiceNumber,
              date: inv.invoiceDate || inv.createdAt || inv.date,
              dueDate: inv.dueDate,
              description: inv.notes || inv.items?.[0]?.description || "Agency Retainer & Marketing Services",
              amount: baseAmount,
              tax: tax,
              total: original,
              paidAmount: isPaid ? original : paid,
              balanceAmount: isPaid ? 0 : balance,
              status: isPaid ? "Paid" : inv.paymentStatus === "PARTIALLY_PAID" ? "Partial" : "Pending",
              documentUrl: inv.documentUrl,
              documentName: inv.documentName,
            };
          })
        );
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.warn("Failed to fetch live payments:", err.message);
      setInvoices(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinancialData();
  };

  const openSettleModal = (inv = null, prefillAmount = null) => {
    if (inv) {
      setSubmitForm({
        invoiceId: inv._id || "",
        amount: String(prefillAmount !== null ? prefillAmount : (inv.balanceAmount || inv.total || "")),
        method: "UPI",
        reference: "",
        date: new Date().toISOString().split("T")[0],
        notes: `Settlement for invoice ${inv.invoiceNumber}`,
      });
    } else {
      setSubmitForm({
        invoiceId: "",
        amount: prefillAmount !== null ? String(prefillAmount) : "",
        method: "UPI",
        reference: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setReceiptFile(null);
    setSubmitError("");
    setSubmitSuccess(false);
    setShowSubmitModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const numAmount = Number(submitForm.amount);
    if (!numAmount || numAmount <= 0) {
      setSubmitError("Please enter a valid payment amount greater than ₹0.");
      return;
    }
    if (!submitForm.reference.trim()) {
      setSubmitError("Please enter the UTR or Bank Transaction Reference number.");
      return;
    }

    setSubmittingPayment(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      if (customerId) {
        formData.append("customerId", customerId);
      }
      formData.append("amount", String(numAmount));
      formData.append("method", submitForm.method);
      formData.append("reference", submitForm.reference.trim());
      formData.append("date", submitForm.date);
      formData.append("notes", submitForm.notes);
      if (submitForm.invoiceId) {
        formData.append("invoiceId", submitForm.invoiceId);
      }
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record payment on server.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        fetchFinancialData();
      }, 1800);
    } catch (err) {
      setSubmitError(err.message || "Could not submit payment. Please verify connection.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalSettled = payments.reduce((acc, curr) => acc + Number(curr.amount || curr.paidAmount || 0), 0);
  const pendingAmount = Math.max(0, totalInvoiced - totalSettled);

  // Pending invoices (unpaid / partial)
  const pendingInvoices = invoices.filter((inv) => inv.status !== "Paid");
  // Payments awaiting admin verification
  const pendingVerificationPayments = payments.filter(
    (p) => p.status === "Pending" || p.status === "Pending Verification"
  );

  const handleDownloadInvoice = (inv) => {
    if (inv.documentUrl) {
      const fullUrl = getMediaUrl(inv.documentUrl);
      window.open(fullUrl, "_blank");
      return;
    }

    const invoiceNumber = inv.invoiceNumber || "INV";
    const win = window.open("", "_blank");
    if (!win) {
      alert(`Downloading Official Tax Invoice: ${invoiceNumber}`);
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; }
            .brand { font-size: 24px; font-weight: 900; color: #0f172a; }
            .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
            .meta { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
            th { background: #0f172a; color: #fff; text-align: left; padding: 12px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .total-row { font-weight: bold; font-size: 15px; background: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">DIGITALNESS MEDIA PVT LTD</div>
              <div class="sub">GSTIN: 36AAECD1234F1Z8 · Corporate Marketing Solutions</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0f172a;">TAX INVOICE</h2>
              <div class="sub">Invoice: <b>${invoiceNumber}</b></div>
              <div class="sub">Date: ${formatDate(inv.date)}</div>
            </div>
          </div>

          <div class="meta">
            <div class="meta-box">
              <strong>Billed To:</strong><br/>
              <b>${customer?.name || client?.name || "Client Account"}</b><br/>
              ${customer?.companyName || ""}<br/>
              Email: ${client?.email || customer?.email || "-"}<br/>
              Phone: ${client?.phone || customer?.phone || "-"}
            </div>
            <div class="meta-box">
              <strong>Payment Status:</strong><br/>
              Status: <b>${inv.status}</b><br/>
              Due Date: ${formatDate(inv.dueDate)}<br/>
              Balance Due: <b>₹${Number(inv.balanceAmount || 0).toLocaleString("en-IN")}</b>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Base Amount</th>
                <th style="text-align: right;">GST (18%)</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.description || "Agency Retainer & Marketing Deliverables"}</td>
                <td style="text-align: right;">1</td>
                <td style="text-align: right;">₹${Number(inv.amount || 0).toLocaleString("en-IN")}</td>
                <td style="text-align: right;">₹${Number(inv.tax || 0).toLocaleString("en-IN")}</td>
                <td style="text-align: right;"><b>₹${Number(inv.total || 0).toLocaleString("en-IN")}</b></td>
              </tr>
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total Paid</td>
                <td style="text-align: right; color: #059669;">₹${Number(inv.paidAmount || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Net Balance Due</td>
                <td style="text-align: right; color: #d97706;">₹${Number(inv.balanceAmount || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Payment Modes: Corporate UPI (digitalness@hdfcbank) or NEFT/RTGS to HDFC Bank A/C: 50200084930219 (IFSC: HDFC0001755).</p>
            <p>This is a computer-generated tax invoice verified by Digitalness CRM Financial Ledger.</p>
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
            Print / Save PDF
          </button>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-time CRM Financial Ledger</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Payments, Invoices & Alerts
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              Transparent, synchronized ledger of verified payments, official GST tax invoices,
              and direct payment due alerts from your agency squad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openSettleModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Payment Proof</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
              title="Refresh financial records from CRM"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-400" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Live"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Invoiced */}
        <div
          onClick={() => setActiveTab("invoices")}
          className="glass-card rounded-2xl p-5 border-l-4 border-l-brand-400 cursor-pointer hover:border-brand-300 transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </p>
            <Receipt className="w-4 h-4 text-brand-400 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-2xl font-black text-white mt-1.5">
            {formatCurrency(totalInvoiced)}
          </h3>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
            <span>{invoices.length} Tax Invoices issued</span>
          </span>
        </div>

        {/* KPI 2: Settled */}
        <div
          onClick={() => setActiveTab("payments")}
          className="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-400 cursor-pointer hover:border-emerald-300 transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Settled & Verified
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-1.5">
            {formatCurrency(totalSettled)}
          </h3>
          <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1">
            <span>{payments.length} Payments reconciled</span>
          </span>
        </div>

        {/* KPI 3: Pending Balance */}
        <div
          onClick={() => setActiveTab("pending")}
          className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-400 cursor-pointer hover:border-amber-300 transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Balance Due
            </p>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-2xl font-black text-amber-400 mt-1.5">
            {formatCurrency(pendingAmount)}
          </h3>
          <span className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-1">
            <span>{pendingInvoices.length} unpaid invoice{pendingInvoices.length !== 1 ? "s" : ""}</span>
          </span>
        </div>

        {/* KPI 4: Alerts */}
        <div
          onClick={() => setActiveTab("alerts")}
          className={`glass-card rounded-2xl p-5 border-l-4 cursor-pointer transition group ${
            alerts.length > 0 ? "border-l-rose-500 bg-rose-500/5 hover:bg-rose-500/10" : "border-l-sky-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Payment Due Alerts
            </p>
            <Bell className={`w-4 h-4 group-hover:scale-110 transition ${alerts.length > 0 ? "text-rose-400 animate-pulse" : "text-sky-400"}`} />
          </div>
          <h3 className="text-2xl font-black text-white mt-1.5">
            {alerts.length} Notice{alerts.length !== 1 ? "s" : ""}
          </h3>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
            <span>{alerts.length > 0 ? "CRM reminders received" : "No active due alerts"}</span>
          </span>
        </div>
      </div>

      {/* Active Alert Urgent Banner (if alerts exist or balance is overdue) */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Active Payment Reminder Dispatched</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {alerts[0].channel || "CRM Alert"}
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl truncate">
                {alerts[0].message || alerts[0].content || alerts[0].subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("alerts")}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              View All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => openSettleModal(null, alerts[0].metadata?.dueAmount || pendingAmount)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm"
            >
              Settle Now
            </button>
          </div>
        </div>
      )}

      {/* Distinct 4-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit">
        {/* Tab 1: Payments */}
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "payments"
              ? "bg-brand-500 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === "payments" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}
          >
            {payments.length}
          </span>
        </button>

        {/* Tab 2: Invoices (Separated) */}
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "invoices"
              ? "bg-brand-500 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax Invoices</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === "invoices" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}
          >
            {invoices.length}
          </span>
        </button>

        {/* Tab 3: Alerts (Separated) */}
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "alerts"
              ? "bg-brand-500 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bell className={`w-4 h-4 ${alerts.length > 0 ? "text-amber-400" : ""}`} />
          <span>Payment Alerts</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === "alerts"
                ? "bg-slate-950/20 text-slate-950"
                : alerts.length > 0
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {alerts.length}
          </span>
        </button>

        {/* Tab 4: Pending Payments */}
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "pending"
              ? "bg-amber-500 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${pendingInvoices.length > 0 ? "text-amber-400" : ""}`} />
          <span>Pending Payments</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === "pending"
                ? "bg-slate-950/20 text-slate-950"
                : pendingInvoices.length > 0
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {pendingInvoices.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYMENT RECEIPTS & TRANSACTIONS                                     */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-extrabold text-white">
                  Payment History & Verified Receipts
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct record of all payments reconciled and verified by Digitalness finance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {payments.length} Reconciled Settlement{payments.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => openSettleModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/30 hover:bg-brand-500/20 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Payment</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading verified payment transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
              <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-white">No payment transactions recorded yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Once a payment is recorded in CRM or submitted using the button below, it will automatically reflect here with receipt proof.
              </p>
              <button
                onClick={() => openSettleModal()}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/30 hover:bg-brand-500/20 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit First Payment</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Transaction / Ref</th>
                    <th className="pb-3 font-bold">Date</th>
                    <th className="pb-3 font-bold">Method</th>
                    <th className="pb-3 font-bold">Invoice / Notes</th>
                    <th className="pb-3 font-bold">Settled Amount</th>
                    <th className="pb-3 font-bold text-center">Status</th>
                    <th className="pb-3 font-bold text-right">Proof Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {payments.map((pay, idx) => {
                    const payAmount = Number(pay.amount || pay.paidAmount || 0);
                    const refId = pay.reference || pay.referenceId || `REC-${idx + 1}`;
                    const linkedInv =
                      pay.invoice?.invoiceNumber || pay.invoiceNumber || (pay.notes && pay.notes.includes("INV") ? pay.notes : null);

                    const receiptDownloadLink = pay.receiptUrl ? getMediaUrl(pay.receiptUrl) : "";

                    return (
                      <tr key={pay._id || idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-mono text-xs">{refId}</span>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-slate-300">
                          {formatDate(pay.date || pay.paymentDate || pay.createdAt)}
                        </td>
                        <td className="py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold">
                            {pay.method || "Bank Transfer / UPI"}
                          </span>
                        </td>
                        <td className="py-4 text-slate-300 max-w-xs truncate">
                          {linkedInv ? (
                            <span className="text-brand-300 font-semibold font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                              {linkedInv}
                            </span>
                          ) : (
                            pay.notes || "Agency Marketing Retainer"
                          )}
                        </td>
                        <td className="py-4 font-black text-emerald-400 text-sm">
                          {formatCurrency(payAmount)}
                        </td>
                        <td className="py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{pay.status || "Verified"}</span>
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {receiptDownloadLink ? (
                            <a
                              href={receiptDownloadLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[11px] font-bold transition"
                              title="Open verified payment receipt"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">Electronic Entry</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAX INVOICES & BILLING STATEMENTS (SEPARATED)                       */}
      {/* ========================================================================= */}
      {activeTab === "invoices" && (
        <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-extrabold text-white">Official Tax Invoices</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Official GST billing records, tax receipts, and payment download statements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {invoices.length} Total Invoice{invoices.length !== 1 ? "s" : ""}
              </span>
              {pendingAmount > 0 && (
                <button
                  onClick={() => openSettleModal(null, pendingAmount)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition"
                >
                  <span>Settle Total Due: {formatCurrency(pendingAmount)}</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading tax invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
              <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-white">No invoices generated yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Invoices generated in the agency CRM will automatically synchronize here with official GST breakdown.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Invoice #</th>
                    <th className="pb-3 font-bold">Billing Description</th>
                    <th className="pb-3 font-bold">Tax Base</th>
                    <th className="pb-3 font-bold">GST (18%)</th>
                    <th className="pb-3 font-bold">Total Amount</th>
                    <th className="pb-3 font-bold">Balance Due</th>
                    <th className="pb-3 font-bold text-center">Status</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-brand-400" />
                          <span className="font-mono">{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Issued: {formatDate(inv.date)} · Due: {formatDate(inv.dueDate)}
                        </div>
                        {inv.documentUrl && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-brand-300 font-semibold bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span className="max-w-[120px] truncate">{inv.documentName || "PDF Attached"}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 font-medium text-slate-300 max-w-xs truncate">{inv.description}</td>
                      <td className="py-4 text-slate-400">{formatCurrency(inv.amount)}</td>
                      <td className="py-4 text-slate-400">{formatCurrency(inv.tax)}</td>
                      <td className="py-4 font-black text-white">{formatCurrency(inv.total)}</td>
                      <td className="py-4 font-bold text-amber-400">{formatCurrency(inv.balanceAmount)}</td>
                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                            inv.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : inv.status === "Partial"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {inv.status === "Paid" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{inv.status}</span>
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== "Paid" && (
                            <button
                              onClick={() => openSettleModal(inv)}
                              className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-[11px] transition shadow-sm"
                              title="Pay / Settle this invoice"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title={inv.documentUrl ? "Open Uploaded Tax Invoice Document" : "Download / Print PDF Invoice"}
                          >
                            {inv.documentUrl ? <ExternalLink className="w-4 h-4 text-brand-400" /> : <Download className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT DUE ALERTS & CRM NOTICES (SEPARATED)                        */}
      {/* ========================================================================= */}
      {activeTab === "alerts" && (
        <div className="glass-card rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Payment Due Alerts & Reminders</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct notifications dispatched from Digitalness CRM via WhatsApp, Email, and SMS.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {alerts.length} Alert{alerts.length !== 1 ? "s" : ""} Received
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading payment due alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">All Clear! No Active Payment Alerts</h4>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                You have no pending due notices or payment reminders from the agency.
                {pendingAmount > 0 ? ` Your current total pending balance across invoices is ${formatCurrency(pendingAmount)}.` : " All your retainers and accounts are in good standing."}
              </p>
              {pendingAmount > 0 && (
                <button
                  onClick={() => openSettleModal(null, pendingAmount)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 text-xs font-black transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Settle Pending Balance ({formatCurrency(pendingAmount)})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, idx) => {
                const dueVal = alert.metadata?.dueAmount || null;
                const invNum = alert.metadata?.invoiceNumber || null;
                const dueDate = alert.metadata?.dueDate || null;
                const alertMsg = alert.message || alert.content || alert.subject;
                const ch = alert.channel || "WhatsApp";

                return (
                  <div
                    key={alert._id || idx}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            ch === "WhatsApp"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : ch === "Email"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {ch === "WhatsApp" ? (
                            <MessageSquare className="w-3.5 h-3.5" />
                          ) : ch === "Email" ? (
                            <Mail className="w-3.5 h-3.5" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                          <span>{ch} Notice</span>
                        </span>

                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(alert.createdAt)}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Dispatched</span>
                        </span>
                      </div>

                      {dueVal && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Due Balance:</span>
                          <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                            {formatCurrency(dueVal)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alert Message Box */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                      {alertMsg}
                    </div>

                    {/* Alert Footer & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs text-slate-400">
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        {invNum && (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Receipt className="w-3 h-3 text-brand-400" />
                            <span>Invoice: <strong className="text-white font-mono">{invNum}</strong></span>
                          </span>
                        )}
                        {dueDate && (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            <span>Due Date: <strong className="text-white">{formatDate(dueDate)}</strong></span>
                          </span>
                        )}
                        <span>
                          Sender: <strong className="text-slate-300">{alert.byName || alert.by?.name || "Finance Admin"}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const linkedTargetInv = invNum ? invoices.find((i) => i.invoiceNumber === invNum) : null;
                            openSettleModal(linkedTargetInv, dueVal || pendingAmount);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs transition shadow-sm"
                        >
                          Settle Alert Amount
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENDING PAYMENTS & DUES                                             */}
      {/* ========================================================================= */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          {/* Pending Invoices Section */}
          <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-extrabold text-white">Unpaid Invoices & Dues</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Invoices with outstanding balances that need settlement.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {pendingInvoices.length} Pending Invoice{pendingInvoices.length !== 1 ? "s" : ""}
                </span>
                {pendingAmount > 0 && (
                  <button
                    onClick={() => openSettleModal(null, pendingAmount)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition"
                  >
                    <span>Settle All: {formatCurrency(pendingAmount)}</span>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading pending invoices...</p>
              </div>
            ) : pendingInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">All Settled!</h4>
                <p className="text-xs max-w-sm mx-auto">
                  All your invoices are fully paid. No pending dues at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvoices.map((inv) => {
                  const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                  return (
                    <div
                      key={inv._id}
                      className={`p-4 rounded-2xl border transition hover:border-amber-500/40 ${
                        isOverdue
                          ? "bg-rose-500/5 border-rose-500/30"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isOverdue
                              ? "bg-rose-500/20 border border-rose-500/40"
                              : "bg-amber-500/20 border border-amber-500/40"
                          }`}>
                            {isOverdue ? (
                              <AlertTriangle className="w-5 h-5 text-rose-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-white">{inv.invoiceNumber}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                inv.status === "Partial"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                {inv.status}
                              </span>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  OVERDUE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {inv.description} · Due: {formatDate(inv.dueDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Balance Due</p>
                            <p className="text-lg font-black text-amber-400">{formatCurrency(inv.balanceAmount)}</p>
                            <p className="text-[10px] text-slate-500">of {formatCurrency(inv.total)} total</p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => openSettleModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs transition shadow-sm whitespace-nowrap"
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition whitespace-nowrap flex items-center gap-1 justify-center"
                            >
                              <Download className="w-3 h-3" />
                              Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submitted Payments Awaiting Verification */}
          {pendingVerificationPayments.length > 0 && (
            <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sky-400" />
                    <h3 className="text-base font-extrabold text-white">Payments Awaiting Verification</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted payment proofs pending admin review and approval.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {pendingVerificationPayments.length} Awaiting Review
                </span>
              </div>

              <div className="space-y-3">
                {pendingVerificationPayments.map((pay, idx) => {
                  const refId = pay.reference || pay.referenceId || `REC-${idx + 1}`;
                  const linkedInv = pay.invoice?.invoiceNumber || pay.invoiceNumber || null;
                  const receiptLink = pay.receiptUrl ? getMediaUrl(pay.receiptUrl) : null;

                  return (
                    <div
                      key={pay._id || idx}
                      className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 hover:border-sky-500/40 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-sky-400 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-white">{refId}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                <Clock className="w-2.5 h-2.5" />
                                Pending Verification
                              </span>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                                {pay.method || "UPI"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Submitted: {formatDate(pay.date || pay.createdAt)}
                              {linkedInv && (
                                <span className="ml-2 text-brand-300 font-semibold">
                                  → Invoice {linkedInv}
                                </span>
                              )}
                            </p>
                            {pay.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic">{pay.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-base font-black text-sky-400">
                            {formatCurrency(Number(pay.amount || pay.paidAmount || 0))}
                          </span>
                          {receiptLink && (
                            <a
                              href={receiptLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[11px] font-bold transition"
                            >
                              <Paperclip className="w-3 h-3" />
                              Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ========================================================================= */}
      {/* SUBMIT PAYMENT PROOF MODAL                                                */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-black text-white">Submit Payment Details</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Payment Recorded Successfully!</h4>
                <p className="text-xs text-slate-300">
                  Your settlement has been registered in the CRM ledger and your account balances have updated.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Select Target Invoice (Optional)
                  </label>
                  <select
                    value={submitForm.invoiceId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const targetInv = invoices.find((i) => i._id === selId);
                      setSubmitForm({
                        ...submitForm,
                        invoiceId: selId,
                        amount: targetInv ? String(targetInv.balanceAmount || targetInv.total) : submitForm.amount,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  >
                    <option value="">General Retainer / Advance Settlement</option>
                    {invoices.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} - Total: {formatCurrency(inv.total)} (Due: {formatCurrency(inv.balanceAmount)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Amount Paid (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 50000"
                      value={submitForm.amount}
                      onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                    <select
                      value={submitForm.method}
                      onChange={(e) => setSubmitForm({ ...submitForm, method: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                      <option value="IMPS">IMPS Instant Transfer</option>
                      <option value="Credit Card">Credit / Debit Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      UTR / Transaction Reference *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI/523190840291 or TXN-892348"
                      value={submitForm.reference}
                      onChange={(e) => setSubmitForm({ ...submitForm, reference: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={submitForm.date}
                      onChange={(e) => setSubmitForm({ ...submitForm, date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Upload Payment Proof / Screenshot (Receipt PDF / Image)
                  </label>
                  <label className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-900/60 transition group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand-400 transition" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate max-w-[260px]">
                      {receiptFile ? receiptFile.name : "Click to attach receipt or screenshot"}
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 25MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Notes / Remarks (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid from HDFC corporate account"
                    value={submitForm.notes}
                    onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow disabled:opacity-50"
                  >
                    {submittingPayment ? "Registering..." : "Submit Payment Record"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
