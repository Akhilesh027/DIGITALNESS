import React, { useState, useEffect } from "react";
import {
  Banknote,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Handshake,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getFinanceSummary,
  getOverdueInvoices,
  triggerFinanceScan,
  generateReminderDraft,
  recordPromiseToPay,
  markInvoiceDisputed,
  resolveInvoiceDispute,
  getPaymentLink,
  CollectionFollowupData,
  FinanceSummaryData,
} from "@/api/automationApi";
import { InvoiceAgingSummary } from "./InvoiceAgingSummary";
import { CollectionPriorityCard } from "./CollectionPriorityCard";
import { PaymentFollowupDrawer } from "./PaymentFollowupDrawer";
import { PromiseToPayModal } from "./PromiseToPayModal";
import { PaymentQRModal } from "./PaymentQRModal";

export const PaymentRecoveryPanel: React.FC = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<FinanceSummaryData | null>(null);
  const [overdueAccounts, setOverdueAccounts] = useState<CollectionFollowupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [activeFollowup, setActiveFollowup] = useState<CollectionFollowupData | null>(null);
  const [promiseModalFollowup, setPromiseModalFollowup] = useState<CollectionFollowupData | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    invoiceNumber: string;
    clientName: string;
    balance: number;
    upiUri: string;
  } | null>(null);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [summ, accounts] = await Promise.all([
        getFinanceSummary().catch(() => null),
        getOverdueInvoices().catch(() => []),
      ]);
      setSummary(summ);
      setOverdueAccounts(accounts);
    } catch (err: any) {
      toast({ title: "Failed to load Finance Engine", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const scanRes = await triggerFinanceScan();
      setSummary(scanRes);
      toast({
        title: "Finance Scan Completed! 💰",
        description: scanRes.summary,
      });
      await loadFinanceData();
    } catch (err: any) {
      toast({ title: "Scan Failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleDraftReminder = async (invoiceId: string) => {
    try {
      const res = await generateReminderDraft(invoiceId);
      toast({
        title: "Reminder Drafted! 📨",
        description: `Drafted compliant WhatsApp message with verified UPI link for ₹${res.balance.toLocaleString("en-IN")}.`,
      });
      await loadFinanceData();
    } catch (err: any) {
      toast({ title: "Reminder Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSavePromise = async (params: { promisedAmount: number; promisedDate: string; notes?: string }) => {
    if (!promiseModalFollowup?.invoiceId?._id) return;
    try {
      await recordPromiseToPay({
        invoiceId: promiseModalFollowup.invoiceId._id,
        ...params,
      });
      toast({
        title: "Promise to Pay Recorded! 🤝",
        description: `Recorded commitment for ₹${params.promisedAmount.toLocaleString("en-IN")} on ${new Date(params.promisedDate).toLocaleDateString()}.`,
      });
      await loadFinanceData();
    } catch (err: any) {
      toast({ title: "Promise Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenQRModal = async (f: CollectionFollowupData) => {
    if (!f.invoiceId?._id) return;
    try {
      const paymentLink = await getPaymentLink(f.invoiceId._id);
      setQrModalData({
        invoiceNumber: f.invoiceId.invoiceNumber,
        clientName: f.clientId?.name || "Client",
        balance: paymentLink.balance,
        upiUri: paymentLink.upiUri,
      });
    } catch (err: any) {
      toast({ title: "QR Generation Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleDispute = async (invoiceId: string, isDisputed: boolean) => {
    try {
      if (isDisputed) {
        await resolveInvoiceDispute(invoiceId);
        toast({ title: "Dispute Resolved", description: "Automated payment recovery resumed." });
      } else {
        await markInvoiceDisputed(invoiceId, "Client requested billing audit.");
        toast({ title: "Invoice Disputed", description: "Automated payment reminders paused." });
      }
      await loadFinanceData();
    } catch (err: any) {
      toast({ title: "Dispute Update Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* CASH FLOW HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 gap-1.5 py-1 px-3">
                <Banknote className="w-3.5 h-3.5" />
                Phase 5E Cash-Flow Engine
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Autonomous Payment & Dues Recovery Engine
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Monitors invoice aging buckets, tracks promises to pay, prevents communication spam,
              and generates instant dynamic NPCI UPI payment links with zero financial hallucinations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunScan}
              disabled={scanning}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning Invoices..." : "Run Collections Scan"}
            </Button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY COUNTERS */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Outstanding</span>
              <p className="text-xl font-black text-white mt-0.5">₹{summary.totalOutstanding.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-amber-300 uppercase font-semibold">Expected Today</span>
              <p className="text-xl font-black text-amber-300 mt-0.5">₹{summary.expectedTodayTotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Total Overdue</span>
              <p className="text-xl font-black text-rose-300 mt-0.5">₹{summary.overdueTotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Critical Accounts (≥85)</span>
              <p className="text-xl font-black text-rose-400 mt-0.5">{summary.criticalCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-orange-400 uppercase font-semibold">Broken Promises</span>
              <p className="text-xl font-black text-orange-300 mt-0.5">{summary.brokenPromisesCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* AGING ROLLUP BARS */}
      {summary?.agingRollup && <InvoiceAgingSummary aging={summary.agingRollup} />}

      {/* OVERDUE & CRITICAL COLLECTIONS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Prioritized Collections Queue ({overdueAccounts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Sorted by Priority Score & Aging</span>
        </div>

        {overdueAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {overdueAccounts.map((f) => (
              <CollectionPriorityCard
                key={f._id}
                followup={f}
                onOpenDetails={(item) => setActiveFollowup(item)}
                onQuickReminder={handleDraftReminder}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">All Client Dues are Current & Paid! 🎉</h4>
            <p className="text-xs text-slate-500">
              No overdue invoices, missed promises, or collection bottlenecks detected.
            </p>
          </div>
        )}
      </div>

      {/* ACCOUNT DETAIL DRAWER */}
      <PaymentFollowupDrawer
        isOpen={Boolean(activeFollowup)}
        onClose={() => setActiveFollowup(null)}
        followup={activeFollowup}
        onDraftReminder={handleDraftReminder}
        onOpenPromiseModal={(f) => {
          setPromiseModalFollowup(f);
        }}
        onOpenQRModal={handleOpenQRModal}
        onToggleDispute={handleToggleDispute}
      />

      {/* PROMISE TO PAY MODAL */}
      <PromiseToPayModal
        isOpen={Boolean(promiseModalFollowup)}
        onClose={() => setPromiseModalFollowup(null)}
        followup={promiseModalFollowup}
        onSubmit={handleSavePromise}
      />

      {/* DYNAMIC PAYMENT QR MODAL */}
      {qrModalData && (
        <PaymentQRModal
          isOpen={Boolean(qrModalData)}
          onClose={() => setQrModalData(null)}
          invoiceNumber={qrModalData.invoiceNumber}
          clientName={qrModalData.clientName}
          balance={qrModalData.balance}
          upiUri={qrModalData.upiUri}
        />
      )}
    </div>
  );
};
