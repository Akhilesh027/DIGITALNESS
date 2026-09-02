import React from "react";
import { PaymentAgingRollup } from "@/api/automationApi";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react";

interface InvoiceAgingSummaryProps {
  aging: PaymentAgingRollup | null;
}

export const InvoiceAgingSummary: React.FC<InvoiceAgingSummaryProps> = ({ aging }) => {
  if (!aging) return null;

  const buckets = [
    { label: "Upcoming", amount: aging.upcoming, color: "bg-slate-50 border-slate-200 text-slate-700", dot: "bg-slate-400" },
    { label: "Due Today", amount: aging.dueToday, color: "bg-amber-50 border-amber-200 text-amber-900", dot: "bg-amber-500" },
    { label: "1–3 Days", amount: aging.overdue1_3, color: "bg-amber-50 border-amber-200 text-amber-900", dot: "bg-amber-500" },
    { label: "4–7 Days", amount: aging.overdue4_7, color: "bg-orange-50 border-orange-200 text-orange-900", dot: "bg-orange-500" },
    { label: "8–15 Days", amount: aging.overdue8_15, color: "bg-rose-50 border-rose-200 text-rose-900", dot: "bg-rose-500" },
    { label: "16–30 Days", amount: aging.overdue16_30, color: "bg-rose-100 border-rose-300 text-rose-950", dot: "bg-rose-600" },
    { label: "30+ Days", amount: aging.overdue30Plus, color: "bg-red-200 border-red-400 text-red-950", dot: "bg-red-700" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-900">Deterministic Invoice Aging Rollup</h4>
        </div>
        <span className="text-xs text-slate-400">
          Total Outstanding: <strong className="text-slate-900 font-black">₹{aging.totalOutstanding.toLocaleString("en-IN")}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {buckets.map((b, i) => (
          <div key={i} className={`p-3 rounded-xl border ${b.color} space-y-1`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${b.dot}`} />
              {b.label}
            </div>
            <p className="text-sm font-black tracking-tight">₹{b.amount.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
