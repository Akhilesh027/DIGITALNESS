import React from "react";
import { Link } from "react-router-dom";
import { Clock, AlertTriangle, Sparkles, CreditCard, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const RechargeCountdownBanner = () => {
  const { customer } = useAuth();

  const rechargePlan = customer?.rechargePlan;
  const validUntil = rechargePlan?.validUntil ? new Date(rechargePlan.validUntil) : null;
  const pendingAmount = Number(customer?.totalPending || 0);

  // If no validity set and no pending dues, don't show intrusive banner
  if (!validUntil && pendingAmount <= 0) {
    return null;
  }

  let daysRemaining = null;
  let isExpired = false;

  if (validUntil) {
    const diffMs = validUntil.getTime() - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
  }

  // Grace / Expired state
  if (isExpired || daysRemaining <= 3 || pendingAmount > 0) {
    return (
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="font-bold text-amber-300">
              {isExpired ? "Service Retainer Expired" : daysRemaining !== null && daysRemaining <= 3 ? `Service Renewal Due in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}` : "Payment Overdue Alert"}
            </span>
            <span className="hidden md:inline text-slate-300">
              {validUntil ? `Valid until ${validUntil.toLocaleDateString("en-IN")}` : "Renewal required"}
              {pendingAmount > 0 && ` • Outstanding: ₹${pendingAmount.toLocaleString("en-IN")}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Settle & Recharge Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal active state
  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>
            <strong className="text-slate-200">{rechargePlan?.planName || "Active Retainer"}</strong> •{" "}
            {daysRemaining !== null ? `${daysRemaining} days remaining in current billing cycle` : "Subscription Active"}
          </span>
        </div>

        <Link
          to="/payments"
          className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1"
        >
          <span>View Invoices & Retainers</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
