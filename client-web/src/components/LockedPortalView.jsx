import React, { useState } from "react";
import {
  ShieldAlert,
  Lock,
  IndianRupee,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MessageSquare,
  LogOut,
  RefreshCw,
  FileText,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId } from "../config/api";

export const LockedPortalView = () => {
  const { client, customer, logout, refreshProfile } = useAuth();
  const customerId = extractCustomerId(client, customer);

  const [copiedField, setCopiedField] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Settle / Proof Submission Form
  const [submitForm, setSubmitForm] = useState({
    amount: customer?.totalPending ? String(customer.totalPending) : "",
    method: "UPI",
    reference: "",
    date: new Date().toISOString().split("T")[0],
    notes: "Urgent payment proof to unlock portal access",
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const pendingAmount = Number(customer?.totalPending || customer?.balancePending || 0);
  const lockReason = customer?.accessControl?.lockReason || "Payment Overdue";
  const lockMessage =
    customer?.accessControl?.lockMessage ||
    "Your marketing services and client portal access have been temporarily placed on hold due to pending dues. Settle your outstanding invoice to restore full access immediately.";

  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showFormAnyway, setShowFormAnyway] = useState(false);

  const checkPendingPayments = React.useCallback(async () => {
    try {
      setLoadingPending(true);
      const url = customerId
        ? `${API_BASE_URL}/payments?customerId=${customerId}&status=Pending`
        : `${API_BASE_URL}/payments?status=Pending`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const pending = Array.isArray(data) ? data.filter((p) => p.status === "Pending") : [];
        setPendingPayments(pending);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    checkPendingPayments();

    // Fast poll profile every 4 seconds to instantly detect when admin verifies & unlocks
    const interval = setInterval(async () => {
      await refreshProfile();
    }, 4000);

    return () => clearInterval(interval);
  }, [checkPendingPayments, refreshProfile]);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2500);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await checkPendingPayments();
    setRefreshing(false);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    const numAmount = Number(submitForm.amount);
    if (!numAmount || numAmount <= 0) {
      setSubmitError("Please enter a valid amount greater than ₹0.");
      return;
    }
    if (!submitForm.reference.trim()) {
      setSubmitError("Please enter the UTR / Bank Transaction Reference number.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      if (customerId) formData.append("customerId", customerId);
      formData.append("amount", String(numAmount));
      formData.append("method", submitForm.method);
      formData.append("reference", submitForm.reference.trim());
      formData.append("date", submitForm.date);
      formData.append("notes", submitForm.notes);
      formData.append("status", "Pending");
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
        throw new Error(data.message || "Failed to submit payment proof");
      }

      setSubmittedSuccess(true);
      setShowFormAnyway(false);
      checkPendingPayments();
      // Refresh profile in background
      setTimeout(() => refreshProfile(), 1500);
    } catch (err) {
      setSubmitError(err.message || "Could not submit payment proof. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-rose-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-rose-900/30 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Digitalness Client Portal</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Access On Hold
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Account: <span className="text-slate-200 font-semibold">{customer?.name || client?.name || "Client Account"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-400" : ""}`} />
            <span>Check Status</span>
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-slate-800 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Locked Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Lock Banner Card */}
        <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-slate-900/60 to-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 mb-6 shadow-2xl shadow-rose-950/30 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30 ring-8 ring-rose-500/10">
            <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Service Suspension Notice ({lockReason})</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Portal Access & Active Services Are Temporarily On Hold
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {lockMessage}
            </p>
          </div>

          {/* Dues Metric */}
          <div className="sm:border-l sm:border-slate-800 sm:pl-6 text-center sm:text-right shrink-0 w-full sm:w-auto">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Outstanding Dues
            </span>
            <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono tracking-tight flex items-center justify-center sm:justify-end gap-1">
              <span>₹{pendingAmount > 0 ? pendingAmount.toLocaleString("en-IN") : "Pending"}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Immediate payment required
            </span>
          </div>
        </div>

        {/* Action Grid: Bank Transfer & Submit Proof */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Bank & UPI Payment Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Instant Bank & UPI Details</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* UPI ID */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">UPI ID</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">digitalness@icici</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("digitalness@icici", "upi")}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedField === "upi" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Account Number */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Number</span>
                    <span className="font-mono text-sm font-bold text-white">50200088991122</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("50200088991122", "acc")}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedField === "acc" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* IFSC & Bank */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">IFSC Code</span>
                    <span className="font-mono text-xs font-bold text-white">HDFC0001234</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank</span>
                    <span className="text-xs font-bold text-white truncate block">HDFC Bank Ltd</span>
                  </div>
                </div>

                {/* Beneficiary */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Beneficiary Name</span>
                  <span className="text-xs font-bold text-slate-200">Digitalness Media & Tech Pvt Ltd</span>
                </div>
              </div>

              {/* Priority Contact */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Need immediate help?</span>
                <a
                  href="https://wa.me/919900000000?text=Hi%20Finance%20Team%2C%20my%20portal%20access%20is%20on%20hold.%20I%20am%20clearing%20the%20dues%20now."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Finance</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Settle & Submit UTR Proof Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-brand-400" />
                    <span>Submit Payment Proof for Instant Unlock</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Once submitted, our accounts team will verify and immediately restore your services.
                  </p>
                </div>
              </div>

              {((pendingPayments && pendingPayments.length > 0) || submittedSuccess) && !showFormAnyway ? (
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-slate-900/70 to-slate-950 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Awaiting Admin Verification
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">Payment Proof Submitted</h4>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Review in Progress</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your payment proof has been successfully submitted and logged. Our finance team is reviewing the transaction details. <span className="text-amber-300 font-semibold">Your client portal holding will be automatically removed</span> as soon as an administrator verifies and approves this payment.
                  </p>

                  {/* Proof Details */}
                  {pendingPayments && pendingPayments.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Submitted Amount:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(pendingPayments[0].amount || pendingPayments[0].paidAmount || submitForm.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">UTR / Reference No:</span>
                        <span className="font-mono text-slate-200 font-semibold">{pendingPayments[0].reference || pendingPayments[0].referenceId || submitForm.reference || "REC-SUBMITTED"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Payment Mode:</span>
                        <span className="text-slate-200">{pendingPayments[0].method || submitForm.method || "UPI"}</span>
                      </div>
                      {pendingPayments[0].receiptUrl && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Attached Receipt:</span>
                          <span className="text-brand-400 truncate max-w-[200px]">{pendingPayments[0].receiptName || "Uploaded Screenshot"}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      <span>{refreshing ? "Checking Verification..." : "Check Approval Status"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFormAnyway(true)}
                      className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Submit Another Proof
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {showFormAnyway && (
                    <button
                      type="button"
                      onClick={() => setShowFormAnyway(false)}
                      className="mb-3 text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      &larr; View Pending Verification Status
                    </button>
                  )}
                  <form onSubmit={handleSubmitProof} className="space-y-4">
                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Amount Paid (₹) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={submitForm.amount}
                        onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })}
                        placeholder="e.g. 25000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Payment Method <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={submitForm.method}
                        onChange={(e) => setSubmitForm({ ...submitForm, method: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                      >
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Bank Transfer">NEFT / RTGS / IMPS</option>
                        <option value="Card">Debit / Credit Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cheque">Cheque Deposit</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Transaction UTR / Bank Reference Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={submitForm.reference}
                      onChange={(e) => setSubmitForm({ ...submitForm, reference: e.target.value })}
                      placeholder="e.g. 428901234567 or UPI-REF-XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Attach Screenshot or Bank Receipt (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-500 text-slate-300 text-xs transition-colors">
                        <UploadCloud className="w-4 h-4 text-brand-400" />
                        <span className="truncate">
                          {receiptFile ? receiptFile.name : "Choose receipt screenshot / PDF"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {receiptFile && (
                        <button
                          type="button"
                          onClick={() => setReceiptFile(null)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Payment Proof...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Payment & Request Unlock</span>
                      </>
                    )}
                  </button>
                </form>
              </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 px-4 sm:px-8 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Digitalness Media & Technology. Client Portal Access Control.</p>
      </footer>
    </div>
  );
};
