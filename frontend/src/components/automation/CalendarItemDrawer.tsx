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
import {
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  Tag,
  MessageSquare,
  Wand2,
  FileText,
  Eye,
} from "lucide-react";
import { CalendarItem } from "@/api/automationApi";

interface CalendarItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: CalendarItem | null;
  onApprove?: (itemKey: string) => void;
}

export const CalendarItemDrawer: React.FC<CalendarItemDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onApprove,
}) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px]">
              {item.sourceType}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-mono">
              {item.contentType}
            </Badge>
            <span className="text-xs text-slate-400">
              Due: {new Date(item.plannedDate).toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 mt-2">
            {item.headline}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Occasion: <strong className="text-slate-700">{item.occasion}</strong> • Objective: {item.objective}
          </p>
        </DialogHeader>

        {/* CAPTION & COPY */}
        <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            Social Media Caption
          </span>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{item.caption}</p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {item.hashtags.map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* CREATIVE BRIEF FOR DESIGNERS */}
        <div className="space-y-1.5 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Creative Brief (Design Direction)
          </span>
          <p className="text-xs text-purple-950 leading-relaxed">{item.creativeBrief}</p>
        </div>

        {/* AI VISUAL PROMPT */}
        {item.visualPrompt && (
          <div className="space-y-1.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-600" />
              AI Image Generation Prompt
            </span>
            <p className="text-xs text-amber-950 font-mono text-[11px] leading-relaxed">{item.visualPrompt}</p>
          </div>
        )}

        {/* CALL TO ACTION & PLATFORMS */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500">CTA: <strong className="text-slate-800">{item.cta}</strong></span>
          <div className="flex gap-1">
            {item.platformTargets.map((p, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-slate-50">
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          {onApprove && item.status !== "APPROVED" && (
            <Button
              size="sm"
              onClick={() => {
                onApprove(item.itemKey);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Content Item
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
