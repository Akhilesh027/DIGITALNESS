import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Handshake, Calendar, CheckCircle2 } from "lucide-react";
import { CollectionFollowupData } from "@/api/automationApi";

interface PromiseToPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  followup: CollectionFollowupData | null;
  onSubmit: (params: { promisedAmount: number; promisedDate: string; notes?: string }) => void;
}

export const PromiseToPayModal: React.FC<PromiseToPayModalProps> = ({
  isOpen,
  onClose,
  followup,
  onSubmit,
}) => {
  const balance = followup?.invoiceId?.balanceAmount || followup?.balanceAtDetection || 0;
  const [amount, setAmount] = useState<number>(balance);
  const [date, setDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  if (!followup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px] gap-1">
              <Handshake className="w-3.5 h-3.5" />
              Promise to Pay
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 mt-1">
            Record Client Payment Commitment
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Client: <strong>{followup.clientId?.name}</strong> • Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Promised Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Promised Payment Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Call / Meeting Notes</label>
            <Input
              type="text"
              placeholder="e.g. Spoke to Director, promised transfer after billing approval."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSubmit({ promisedAmount: amount, promisedDate: date, notes });
              onClose();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Save Promise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
