import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Clock,
  Send,
  Handshake,
  QrCode,
  AlertOctagon,
  History,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CollectionFollowupData } from "@/api/automationApi";

interface PaymentFollowupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  followup: CollectionFollowupData | null;
  onDraftReminder: (invoiceId: string) => void;
  onOpenPromiseModal: (followup: CollectionFollowupData) => void;
  onOpenQRModal: (followup: CollectionFollowupData) => void;
  onToggleDispute: (invoiceId: string, isDisputed: boolean) => void;
}

export const PaymentFollowupDrawer: React.FC<PaymentFollowupDrawerProps> = ({
  isOpen,
  onClose,
  followup,
  onDraftReminder,
  onOpenPromiseModal,
  onOpenQRModal,
  onToggleDispute,
}) => {
  if (!followup) return null;

  const inv = followup.invoiceId;
  const balance = inv?.balanceAmount || followup.balanceAtDetection || 0;
  const isDisputed = followup.status === "DISPUTED" || followup.dispute?.active;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                className={`text-[11px] font-bold ${
                  followup.priorityScore >= 70
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {followup.priorityScore}/100 Priority
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {followup.agingBucket}
              </Badge>
              {isDisputed && (
                <Badge className="bg-purple-100 text-purple-800 text-[10px]">
                  DISPUTED
                </Badge>
              )}
            </div>
            <span className="text-xs font-black text-slate-900">
              Outstanding: ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-slate-900 mt-2">
            {followup.clientId?.name || "Client Account"} • Invoice {inv?.invoiceNumber}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Original: ₹{inv?.originalAmount?.toLocaleString("en-IN")} • Paid: ₹{inv?.paidAmount?.toLocaleString("en-IN")} • Due: {inv?.dueDate ? new Date(inv.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "N/A"}
          </p>
        </DialogHeader>

        {/* PROMISES TO PAY SECTION */}
        {followup.promises && followup.promises.length > 0 && (
          <div className="space-y-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Handshake className="w-3.5 h-3.5 text-amber-700" />
              Recorded Promises to Pay
            </span>
            <div className="space-y-1.5">
              {followup.promises.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-white border border-amber-100">
                  <span className="font-semibold text-slate-800">
                    ₹{p.amount.toLocaleString("en-IN")} due {new Date(p.date).toLocaleDateString()}
                  </span>
                  <Badge
                    className={`text-[10px] ${
                      p.status === "BROKEN"
                        ? "bg-rose-100 text-rose-800"
                        : p.status === "FULFILLED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT ATTEMPTS HISTORY */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            Communication & Reminder History
          </span>
          {followup.contactAttempts && followup.contactAttempts.length > 0 ? (
            <div className="space-y-1.5">
              {followup.contactAttempts.map((att, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">{att.subject || att.type}</span>
                    <p className="text-[11px] text-slate-500">{new Date(att.timestamp).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white">
                    {att.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
              No automated reminders dispatched yet for this billing cycle.
            </p>
          )}
        </div>

        {/* ACTION BUTTONS TOOLBAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => {
              if (inv) onDraftReminder(inv._id);
            }}
            disabled={isDisputed}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1"
          >
            <Send className="w-3 h-3" /> Draft Reminder
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenPromiseModal(followup)}
            className="text-xs font-semibold gap-1"
          >
            <Handshake className="w-3 h-3" /> Promise to Pay
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenQRModal(followup)}
            className="text-xs font-semibold gap-1"
          >
            <QrCode className="w-3 h-3" /> Payment QR
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (inv) onToggleDispute(inv._id, isDisputed);
            }}
            className={`text-xs font-semibold gap-1 ${
              isDisputed ? "text-emerald-700 hover:bg-emerald-50" : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            {isDisputed ? "Resolve Dispute" : "Mark Disputed"}
          </Button>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
