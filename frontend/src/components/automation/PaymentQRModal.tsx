import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  balance: number;
  upiUri: string;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  clientName,
  balance,
  upiUri,
}) => {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    toast({ title: "UPI Link Copied! 📋", description: "Payment link copied to clipboard." });
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-6 space-y-4 text-center">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] mx-auto mb-1">
            Verified NPCI UPI Link
          </Badge>
          <DialogTitle className="text-base font-bold text-slate-900">
            Instant UPI Payment QR
          </DialogTitle>
          <p className="text-xs text-slate-500">
            {clientName} • Invoice <strong>{invoiceNumber}</strong>
          </p>
        </DialogHeader>

        {/* DYNAMIC QR CODE */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <img
            src={qrImageUrl}
            alt="UPI QR Code"
            className="w-44 h-44 rounded-xl border border-slate-200 shadow-xs bg-white p-2"
          />
          <div className="text-center space-y-0.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Exact Outstanding Due</span>
            <p className="text-2xl font-black text-slate-900">₹{balance.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <DialogFooter className="pt-2 flex flex-col gap-2 border-t border-slate-100">
          <Button
            onClick={handleCopyLink}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 h-9"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Dynamic UPI URI
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
