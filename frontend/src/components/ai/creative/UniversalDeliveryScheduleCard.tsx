import React from "react";
import {
  Send,
  Calendar,
  Lock,
  FileCheck,
  CheckCircle2,
  Share2,
  Clock,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryScheduleBlock } from "@/types/workspaceChat";

interface UniversalDeliveryScheduleCardProps {
  block: DeliveryScheduleBlock;
  onPublishNow?: () => void;
  onScheduleSlot?: (slot: string) => void;
  onSaveDraft?: () => void;
  onStartPublishing?: () => void;
  disabled?: boolean;
}

export const UniversalDeliveryScheduleCard: React.FC<UniversalDeliveryScheduleCardProps> = ({
  block,
  onPublishNow,
  onScheduleSlot,
  onSaveDraft,
  onStartPublishing,
  disabled = false,
}) => {
  const destination = block.destination || "Instagram";
  const isDraftOnly = block.isDraftOnly || block.publishAllowed === false;
  const approvedStatus = block.approvedVersionStatus || (isDraftOnly ? "Approved Draft (Publishing Disabled)" : "Locked · QA Passed");
  const immediateOption = block.immediateOption || "Publish Now";
  const scheduledOption = block.scheduledOption || "Tomorrow · 10:00 AM";

  return (
    <div className="mt-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* TOP HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 border-b border-indigo-950/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {isDraftOnly ? "CREATIVE APPROVED" : "FINAL APPROVAL COMPLETE"}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {isDraftOnly ? "Approved Creative Draft" : "Schedule Approved Poster"}
          </h3>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-400" aria-hidden="true" focusable="false" />
          <span>{isDraftOnly ? "DRAFT LOCKED" : "LOCKED"}</span>
        </Badge>
      </div>

      <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-[13px]">
        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Destination Platform
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <Share2 className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" focusable="false" />
              <span>{destination}</span>
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Approved Status
            </span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" focusable="false" />
              <span>{approvedStatus}</span>
            </span>
          </div>

          {isDraftOnly ? (
            <div className="sm:col-span-2 rounded-xl bg-amber-50/70 p-3.5 border border-amber-200/80 space-y-1">
              <span className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" focusable="false" />
                <span>Publishing Constraint Enforced</span>
              </span>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Per your command (<em>"Do not publish anything"</em>), external publishing remains disabled. This creative is safely preserved in the database as an Approved Draft.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                  Immediate Option
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {immediateOption}
                </span>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                  Scheduled Option
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {scheduledOption}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          {isDraftOnly ? (
            <>
              <Button
                onClick={onSaveDraft}
                disabled={disabled}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" aria-hidden="true" focusable="false" />
                <span>Save Approved Draft</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => onScheduleSlot && onScheduleSlot("Download Copy")}
                disabled={disabled}
                className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
                <span>Download Copy</span>
              </Button>

              <Button
                variant="secondary"
                onClick={onStartPublishing}
                disabled={disabled}
                className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" focusable="false" />
                <span>Start Publishing Workflow</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onPublishNow}
                disabled={disabled}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" aria-hidden="true" focusable="false" />
                <span>Publish Now</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => onScheduleSlot && onScheduleSlot(scheduledOption)}
                disabled={disabled}
                className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" focusable="false" />
                <span>{scheduledOption}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={onSaveDraft}
                disabled={disabled}
                className="font-semibold text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
                <span>Save as Approved Draft</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
