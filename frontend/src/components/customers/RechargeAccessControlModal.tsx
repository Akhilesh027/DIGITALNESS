import React, { useState } from "react";
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
import {
  lockCustomerPortal,
  unlockCustomerPortal,
  rechargeCustomerPlan,
  sendRechargeDueAlert,
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
  const [rechargeDays, setRechargeDays] = useState(30);
  const [planName, setPlanName] = useState(customer?.rechargePlan?.planName || customer?.package || "Standard Retainer");
  const [monthlyAmount, setMonthlyAmount] = useState(
    String(customer?.rechargePlan?.monthlyAmount || customer?.package || "25000")
  );
  const [autoUnlockOnRecharge, setAutoUnlockOnRecharge] = useState(true);

  // Alert form state
  const [customAlertMsg, setCustomAlertMsg] = useState("");

  if (!customer) return null;

  const isLocked = Boolean(customer?.accessControl?.isPortalLocked);
  const validUntil = customer?.rechargePlan?.validUntil ? new Date(customer.rechargePlan.validUntil) : null;
  const pendingAmount = Number(customer?.totalPending || 0);

  let daysRemaining: number | null = null;
  let isExpired = false;
  if (validUntil) {
    const diffMs = validUntil.getTime() - Date.now();
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
    try {
      setLoading(true);
      await rechargeCustomerPlan(customer._id, {
        planName,
        days: rechargeDays,
        monthlyAmount: Number(monthlyAmount),
        autoUnlock: autoUnlockOnRecharge,
      });

      toast({
        title: "Service Recharged",
        description: `Service plan recharged for ${customer.name}. Validity extended by ${rechargeDays} days.`,
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

  // 4. Handle Alert
  const handleSendAlert = async () => {
    try {
      setLoading(true);
      await sendRechargeDueAlert(customer._id, {
        channel: "WhatsApp",
        customMessage: customAlertMsg,
      });

      toast({
        title: "WhatsApp Alert Sent",
        description: `Payment & renewal alert dispatched to ${customer.name}.`,
      });
      onClose();
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
      <DialogContent className="w-[95vw] max-w-2xl p-6">
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
              Plan: <b>{customer.rechargePlan?.planName || customer.package || "Retainer"}</b> • Retainer: ₹{Number(customer.rechargePlan?.monthlyAmount || customer.package || 0).toLocaleString("en-IN")}/mo
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
              Validity Status
            </span>
            <div className="text-sm font-semibold flex items-center gap-1.5 sm:justify-end mt-0.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {validUntil
                  ? isExpired
                    ? "Expired / Overdue"
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
              <span>Send WhatsApp Notice</span>
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
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="25000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Extend Validity Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRechargeDays(d)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${rechargeDays === d
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted/50 border-input"
                      }`}
                  >
                    +{d} Days
                  </button>
                ))}
              </div>
            </div>

            {isLocked && (
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <input
                  type="checkbox"
                  checked={autoUnlockOnRecharge}
                  onChange={(e) => setAutoUnlockOnRecharge(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Automatically unlock portal access & restore active marketing services</span>
              </label>
            )}

            <Button
              onClick={handleRecharge}
              disabled={loading}
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
                  Confirm Recharge (+{rechargeDays} Days)
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

          {/* TAB 3: WHATSAPP DUE ALERT */}
          <TabsContent value="alert" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground">
              Dispatches an automated payment due and retainer renewal notice via WhatsApp to the client's registered contact number ({customer.contactNumbers?.[0] || customer.phone || "No phone"}).
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Custom Alert Note (Optional - overrides default notice)
              </label>
              <textarea
                rows={4}
                value={customAlertMsg}
                onChange={(e) => setCustomAlertMsg(e.target.value)}
                placeholder="Leave blank to use the standard high-priority renewal notice with exact outstanding amount and bank details..."
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
              />
            </div>

            <Button
              onClick={handleSendAlert}
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending WhatsApp Notice...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Dispatch WhatsApp Renewal Notice
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
