import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Lock,
  Unlock,
  CreditCard,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  Loader2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatServiceExpiry } from "@/lib/serviceExpiry";
import {
  lockCustomerPortal,
  unlockCustomerPortal,
  rechargeCustomerPlan,
  getRenewalNotices,
  retryRenewalNotice,
} from "@/api/customerApi";

interface RechargeAccessControlModalProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  onSuccess: () => void;
}

export const RechargeAccessControlModal: React.FC<RechargeAccessControlModalProps> = ({
  open,
  onClose,
  customer,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("recharge");

  // Lock form state
  const [lockReason, setLockReason] = useState("Payment Overdue");
  const [lockMessage, setLockMessage] = useState(
    customer?.accessControl?.lockMessage ||
    "Your marketing services and portal access are currently on hold due to pending payment. Please settle your outstanding dues to restore full access immediately."
  );
  const [sendLockAlert, setSendLockAlert] = useState(true);

  // Recharge form state
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [planName, setPlanName] = useState(customer?.rechargePlan?.planName || customer?.package || "Standard Retainer");
  const [monthlyAmount, setMonthlyAmount] = useState(
    customer?.rechargePlan?.monthlyAmount == null ? "" : String(customer.rechargePlan.monthlyAmount)
  );

  // Alert form state
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeError, setNoticeError] = useState("");
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [confirmPastDate, setConfirmPastDate] = useState(false);

  const loadNotices = async () => {
    if (!customer?._id) return;
    setNoticeLoading(true);
    setNoticeError("");
    try { const result = await getRenewalNotices(customer._id); setNotices(result.data || []); }
    catch (error: any) { setNoticeError(error.message); }
    finally { setNoticeLoading(false); }
  };
  useEffect(() => {
    if (!open || !customer?._id) return;
    let cancelled = false;
    setNotices([]); setNoticeError(""); setNoticeLoading(true);
    getRenewalNotices(customer._id).then(result => { if (!cancelled) setNotices(result.data || []); })
      .catch(error => { if (!cancelled) setNoticeError(error.message); })
      .finally(() => { if (!cancelled) setNoticeLoading(false); });
    return () => { cancelled = true; };
  }, [open, customer?._id]);

  useEffect(() => {
    if (!open) return;
    const savedDate = customer?.rechargePlan?.validUntil;
    setServiceEndDate(savedDate ? String(savedDate).slice(0, 10) : "");
    setPlanName(customer?.rechargePlan?.planName || customer?.package || "Standard Retainer");
    setMonthlyAmount(customer?.rechargePlan?.monthlyAmount == null ? "" : String(customer.rechargePlan.monthlyAmount));
    setConfirmPastDate(false);
  }, [open, customer?._id, customer?.rechargePlan?.validUntil]);

  const parsedEndDate = serviceEndDate ? new Date(`${serviceEndDate}T00:00:00Z`) : null;
  const isValidEndDate = /^\d{4}-\d{2}-\d{2}$/.test(serviceEndDate)
    && parsedEndDate !== null && !Number.isNaN(parsedEndDate.getTime())
    && parsedEndDate.toISOString().slice(0, 10) === serviceEndDate;
  const endDateLabel = isValidEndDate
    ? parsedEndDate!.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    : "";
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const isPastDate = isValidEndDate && serviceEndDate < todayIST;
  const selectedCutoff = isValidEndDate ? new Date(parsedEndDate!.getTime() + 4 * 86400000 - 330 * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';

  if (!customer) return null;

  const isLocked = Boolean(customer?.accessControl?.isPortalLocked);
  const validUntil = customer?.rechargePlan?.validUntil ? new Date(customer.rechargePlan.validUntil) : null;
  const pendingAmount = Number(customer?.totalPending || 0);

  let daysRemaining: number | null = null;
  let isExpired = false;
  if (validUntil) {
    const expiryEnd = new Date(`${String(customer.rechargePlan.validUntil).slice(0, 10)}T00:00:00Z`).getTime() + 86400000 - 330 * 60000;
    const diffMs = expiryEnd - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
  }

  // 1. Handle Lock Portal
  const handleLockPortal = async () => {
    try {
      setLoading(true);
      await lockCustomerPortal(customer._id, {
        lockReason,
        lockMessage,
        holdType: "PAYMENT_OVERDUE",
        suspendServices: true,
        sendAlert: sendLockAlert,
        alertChannel: "WhatsApp",
      });

      toast({
        title: "Portal Access Held",
        description: `Portal access and active services for ${customer.name} have been suspended.`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to lock portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Unlock Portal
  const handleUnlockPortal = async () => {
    try {
      setLoading(true);
      await unlockCustomerPortal(customer._id);

      toast({
        title: "Portal Restored",
        description: `Portal access and services restored for ${customer.name}.`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Unlock Failed",
        description: err.message || "Failed to unlock portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Recharge
  const handleRecharge = async () => {
    if (!isValidEndDate || (isPastDate && !confirmPastDate)) {
      toast({ title: "Service End Date Required", description: "Choose a valid service end date before confirming.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      await rechargeCustomerPlan(customer._id, {
        planName,
        validUntil: serviceEndDate,
        monthlyAmount: monthlyAmount.trim() ? Number(monthlyAmount) : null,
        autoUnlock: true,
      });

      toast({
        title: "Service Recharged",
        description: `Service plan recharged for ${customer.name}. Service end date: ${endDateLabel}.`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Recharge Failed",
        description: err.message || "Failed to recharge service plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryNotice = async (noticeId: string) => {
    try {
      setLoading(true);
      await retryRenewalNotice(customer._id, noticeId);
      await loadNotices();
      toast({ title: "Reminder queued", description: "The reminder will be retried by the scheduler." });
    } catch (err: any) {
      toast({
        title: "Alert Failed",
        description: err.message || "Failed to send alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            <CreditCard className="w-5 h-5 text-primary" />
            <span>Client Recharge & Access Control</span>
          </DialogTitle>
        </DialogHeader>

        {/* Client Status Pill */}
        <div className="rounded-xl bg-muted/50 p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">{customer.name}</h3>
              {isLocked ? (
                <Badge variant="destructive" className="bg-rose-600 text-white animate-pulse">
                  <Lock className="w-3 h-3 mr-1" /> Portal On Hold
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Portal Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan: <b>{customer.rechargePlan?.planName || customer.package || "Retainer"}</b> • Retainer: {customer.rechargePlan?.monthlyAmount != null && Number.isFinite(Number(customer.rechargePlan.monthlyAmount)) ? `₹${Number(customer.rechargePlan.monthlyAmount).toLocaleString("en-IN")}/mo` : "Not set"}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-muted-foreground">Expiry Date</p>
            <p className="text-sm font-semibold mb-2">{formatServiceExpiry(customer.rechargePlan?.validUntil)}</p>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
              Validity Status
            </span>
            <div className="text-sm font-semibold flex items-center gap-1.5 sm:justify-end mt-0.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {validUntil
                  ? isExpired
                    ? (Date.now() < new Date(`${String(customer.rechargePlan.validUntil).slice(0, 10)}T00:00:00Z`).getTime() + 4 * 86400000 - 330 * 60000 ? "Grace period — portal access continues" : "Expired — grace period ended")
                    : `${daysRemaining} days left (${validUntil.toLocaleDateString("en-IN")})`
                  : "No expiry configured"}
              </span>
            </div>
            {pendingAmount > 0 && (
              <span className="text-xs font-bold text-rose-600 block mt-0.5">
                Outstanding: ₹{pendingAmount.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Tabs for Actions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="recharge">
              <CreditCard className="w-4 h-4 mr-1.5" />
              <span>Recharge Retainer</span>
            </TabsTrigger>
            <TabsTrigger value="access" className={isLocked ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
              {isLocked ? <Unlock className="w-4 h-4 mr-1.5" /> : <Lock className="w-4 h-4 mr-1.5" />}
              <span>{isLocked ? "Unlock Access" : "Hold Portal"}</span>
            </TabsTrigger>
            <TabsTrigger value="alert">
              <Send className="w-4 h-4 mr-1.5" />
              <span>Renewal Notices</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RECHARGE RETAINER */}
          <TabsContent value="recharge" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Plan Name</label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Performance Growth Retainer"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Monthly Retainer Amount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="Not set"
                />
              </div>
            </div>

            <div>
              <label htmlFor="service-end-date" className="text-xs font-semibold text-foreground mb-2 block">Service End Date</label>
              <Input
                id="service-end-date"
                type="date"
                required
                value={serviceEndDate}
                onChange={(event) => { setServiceEndDate(event.target.value); setConfirmPastDate(false); }}
                aria-describedby="service-end-date-preview"
              />
              <p id="service-end-date-preview" className="mt-2 text-xs text-muted-foreground">
                {isValidEndDate ? `Expiry Date: ${endDateLabel}` : "Choose the exact date to save as the service expiry date."}
              </p>
              {isValidEndDate && <p className="mt-2 text-xs text-muted-foreground">Portal access cutoff: {selectedCutoff} IST, including 3 grace days. Internal service delivery continues.</p>}
              <p className="mt-2 text-xs text-muted-foreground">WhatsApp and email reminders: 7 days before, 3 days before, and expiry day at 9:00 AM IST.</p>
              {isPastDate && <label className="mt-3 flex items-start gap-2 text-xs text-amber-700"><input type="checkbox" checked={confirmPastDate} onChange={event => setConfirmPastDate(event.target.checked)} />I understand this date is in the past and portal access may be held immediately if the grace period has ended.</label>}
            </div>

            {isLocked && customer.accessControl?.holdType === 'EXPIRY' && <p className="text-xs text-emerald-700">Renewal restores portal access automatically when the new date is within its active or grace period.</p>}
            {isLocked && customer.accessControl?.holdType !== 'EXPIRY' && <p className="text-xs text-amber-700">This is a manual or payment hold. Renewal will preserve it; an authorized manager must review it separately.</p>}

            <Button
              onClick={handleRecharge}
              disabled={loading || !isValidEndDate || (isPastDate && !confirmPastDate)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Recharge...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isValidEndDate ? `Confirm Recharge (${endDateLabel})` : "Select Service End Date"}
                </>
              )}
            </Button>
          </TabsContent>

          {/* TAB 2: ACCESS CONTROL (LOCK / UNLOCK) */}
          <TabsContent value="access" className="space-y-4 pt-3">
            {isLocked ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Portal Access & Services Currently Suspended</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Reason: <b>{customer.accessControl?.lockReason}</b>
                  <br />
                  Hold Message: <i>"{customer.accessControl?.lockMessage}"</i>
                </p>
                <Button
                  onClick={handleUnlockPortal}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restoring Access...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Restore Portal Access & Resume Services
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>
                    Locking portal access displays a full-screen hold screen to the client, kicks active portal sessions, and pauses client marketing workflows until dues are settled.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Hold Reason</label>
                  <select
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="Payment Overdue">Payment Overdue (Invoice Pending)</option>
                    <option value="Retainer Renewal Required">Retainer Renewal Required (Cycle Expired)</option>
                    <option value="Scope Exceeded">Service Scope Exceeded</option>
                    <option value="Administrative Review">Administrative Account Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Message Shown to Client on Portal Lock Screen
                  </label>
                  <textarea
                    rows={3}
                    value={lockMessage}
                    onChange={(e) => setLockMessage(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendLockAlert}
                    onChange={(e) => setSendLockAlert(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Send urgent WhatsApp suspension notification to client immediately</span>
                </label>

                <Button
                  onClick={handleLockPortal}
                  disabled={loading}
                  variant="destructive"
                  className="w-full font-bold h-11 bg-rose-600 hover:bg-rose-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suspending Access...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Hold Portal Access & Stop Services
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="alert" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground">WhatsApp and email reminders are scheduled at 9:00 AM IST, 7 days before, 3 days before, and on expiry day. Changing expiry replaces pending reminders. Sent means accepted by the provider; WhatsApp delivery/read status updates when a webhook arrives.</p>
            <Button variant="outline" onClick={loadNotices} disabled={noticeLoading}>{noticeLoading ? "Refreshing…" : "Refresh Status"}</Button>
            {noticeError && <p role="alert" className="text-xs text-destructive">{noticeError}</p>}
            {!noticeLoading && !noticeError && notices.length === 0 && <p className="text-xs text-muted-foreground">No reminders scheduled. Save a Service End Date to schedule them.</p>}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notices.map(notice => <div key={notice._id} className="rounded-lg border p-3 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><b>{notice.channel} · {notice.daysBefore === 0 ? "Expiry day" : `${notice.daysBefore} days before`}</b><Badge variant="outline">{notice.status}</Badge></div>
                <p>{new Date(notice.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
                {notice.error && <p className="text-muted-foreground">{notice.error}</p>}
                {notice.status === 'Failed' && <Button size="sm" variant="outline" onClick={() => handleRetryNotice(notice._id)} disabled={loading}>Retry</Button>}
              </div>)}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
