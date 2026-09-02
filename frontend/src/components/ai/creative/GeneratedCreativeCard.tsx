import React, { useState } from "react";
import { Download, RefreshCw, Calendar, Sparkles, CheckCircle2, Clock, Globe, Share2, Eye, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneratedAssetBlock } from "@/types/workspaceChat";

interface ScheduleDetails {
  slot: string;
  customDate?: string;
  platforms: string[];
  notes?: string;
}

interface GeneratedCreativeCardProps {
  block: GeneratedAssetBlock;
  onRevision?: (instruction: string, creativeRunId: string) => void;
  onSchedule?: (creativeRunId: string, scheduleDetails?: ScheduleDetails) => void;
  disabled?: boolean;
}

export const GeneratedCreativeCard: React.FC<GeneratedCreativeCardProps> = ({
  block,
  onRevision,
  onSchedule,
  disabled = false,
}) => {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [imageRendered, setImageRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [approved, setApproved] = useState(false);

  // Scheduling State
  const [selectedSlot, setSelectedSlot] = useState("Tomorrow at 10:00 AM (Morning Reach)");
  const [customDateTime, setCustomDateTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram Feed", "Facebook Page"]);
  const [scheduleNote, setScheduleNote] = useState("");
  const [confirmedSchedule, setConfirmedSchedule] = useState<ScheduleDetails | null>(null);

  const PRESET_SLOTS = [
    { label: "Tomorrow at 10:00 AM (Morning Reach)", value: "Tomorrow at 10:00 AM" },
    { label: "Tomorrow at 5:30 PM (Evening Prime)", value: "Tomorrow at 5:30 PM" },
    { label: "This Weekend (Sat 11:30 AM Peak)", value: "Saturday at 11:30 AM" },
    { label: "Custom Date & Time", value: "CUSTOM" },
  ];

  const PLATFORM_OPTIONS = [
    { id: "Instagram Feed", label: "Instagram Feed", icon: "📸" },
    { id: "Facebook Page", label: "Facebook Page", icon: "📘" },
    { id: "Instagram Story", label: "Instagram Story", icon: "📱" },
    { id: "Google Business (GBP)", label: "Google Business", icon: "📍" },
  ];

  const handleSendRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionPrompt.trim() || !onRevision) return;
    onRevision(revisionPrompt.trim(), block.creativeRunId);
    setShowRevisionInput(false);
    setRevisionPrompt("");
  };

  const handleRenderImage = () => {
    setIsRendering(true);
    setTimeout(() => {
      setIsRendering(false);
      setImageRendered(true);
      setShowScheduleConfig(true); // Open schedule configuration automatically
    }, 1200);
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleConfirmSchedule = () => {
    const finalTime =
      selectedSlot === "CUSTOM" && customDateTime
        ? new Date(customDateTime).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : selectedSlot;

    const details: ScheduleDetails = {
      slot: finalTime,
      customDate: customDateTime,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ["Instagram Feed"],
      notes: scheduleNote.trim(),
    };

    setConfirmedSchedule(details);
    setApproved(true);
    setShowScheduleConfig(false);

    if (onSchedule) {
      onSchedule(block.creativeRunId, details);
    }
  };

  const finalImageUrl =
    block.imageUrl ||
    "https://images.unsplash.com/photo-1786815151687-650e337e5850?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div className="mt-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-4">
      {/* HEADER BADGES */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] font-bold ${
              approved
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : imageRendered
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {approved
              ? "Scheduled in Content Calendar"
              : imageRendered
              ? `Version ${block.version || 1} • Visual Rendered`
              : `Version ${block.version || 1} • Copy & Prompt Staged`}
          </Badge>
          {block.clientName && (
            <span className="text-xs text-slate-500 font-semibold">{block.clientName}</span>
          )}
        </div>
        {approved && (
          <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Scheduled & Queued
          </Badge>
        )}
      </div>

      {/* ASSET IMAGE & COPY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
        {imageRendered ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square max-h-64 sm:max-h-72 shadow-inner group">
            <img
              src={finalImageUrl}
              alt="Generated Creative"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-400" /> Reference Image (1080×1080)
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 aspect-square flex flex-col items-center justify-center p-5 text-center text-slate-500 text-xs space-y-2">
            {isRendering ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="font-bold text-indigo-700 text-xs">Rendering Poster with Brand Memory...</span>
                <span className="text-[10px] text-slate-400">Applying colors, typography & logo</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Copy & Prompt Verified</span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Review the headline, caption & AI prompt on the right.
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleRenderImage}
                  disabled={disabled}
                  className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-7.5 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Generate Poster Image
                </Button>
              </>
            )}
          </div>
        )}

        {/* HEADLINE, CAPTION, HASHTAGS, IMAGE PROMPT & PLATFORM VARIANTS */}
        <div className="space-y-2.5 text-xs">
          {block.headline && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Headline
              </span>
              <p className="font-bold text-slate-900 leading-snug">{block.headline}</p>
            </div>
          )}

          {block.caption && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Caption
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-28 overflow-y-auto whitespace-pre-line">
                {block.caption}
              </p>
            </div>
          )}

          {block.tags && block.tags.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hashtags</span>
              <div className="flex flex-wrap gap-1">
                {block.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {block.imagePrompt && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                🎨 Image Generation Prompt
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 max-h-24 overflow-y-auto font-mono">
                {block.imagePrompt}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE SCHEDULING CONFIGURATOR (When Image is Rendered & Not Yet Final Approved) */}
      {imageRendered && !approved && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-slate-50 border border-indigo-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">Publishing & Schedule Options</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200">
              Interactive Selector
            </Badge>
          </div>

          {/* 1. Time Slot Options */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Select Publishing Time Slot
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRESET_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedSlot(slot.value)}
                  className={`text-left p-2 rounded-lg border text-xs font-medium transition-all ${
                    selectedSlot === slot.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{slot.label}</span>
                    {selectedSlot === slot.value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedSlot === "CUSTOM" && (
              <div className="pt-1.5">
                <Input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="h-8 text-xs bg-white border-indigo-200 max-w-xs"
                />
              </div>
            )}
          </div>

          {/* 2. Platform Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              2. Target Channels
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-bold"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Custom Questions & Notes */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              3. Special Instructions or Question (Optional)
            </span>
            <Input
              placeholder="e.g. Tag @glownest_salon and include 'Limited booking slots available'"
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200"
            />
          </div>

          {/* Confirm Schedule Button */}
          <div className="pt-1 flex items-center justify-between border-t border-indigo-100">
            <span className="text-[11px] text-slate-500">
              Selected: <strong className="text-slate-800">{selectedSlot === "CUSTOM" ? customDateTime || "Custom" : selectedSlot}</strong> on{" "}
              <strong className="text-indigo-700">{selectedPlatforms.join(", ")}</strong>
            </span>
            <Button
              size="sm"
              onClick={handleConfirmSchedule}
              disabled={disabled}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Confirm & Schedule Post</span>
            </Button>
          </div>
        </div>
      )}

      {/* CONFIRMED SCHEDULE SUMMARY BADGE */}
      {approved && confirmedSchedule && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-600" aria-hidden="true" focusable="false" />
              <span>Scheduled for {confirmedSchedule.slot}</span>
            </div>
            <div className="text-emerald-700 text-[11px] flex items-center gap-2">
              <span>📱 Channels: {confirmedSchedule.platforms.join(" • ")}</span>
              {confirmedSchedule.notes && <span>• Note: "{confirmedSchedule.notes}"</span>}
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
            Status: Queued in Content Calendar
          </Badge>
        </div>
      )}

      {/* REVISION INLINE PROMPT INPUT */}
      {showRevisionInput && (
        <form onSubmit={handleSendRevision} className="flex items-center gap-2 pt-1">
          <Input
            placeholder="e.g. Make it more traditional with warmer festive colors..."
            value={revisionPrompt}
            onChange={(e) => setRevisionPrompt(e.target.value)}
            disabled={disabled}
            className="h-8 text-xs bg-slate-50"
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !revisionPrompt.trim()}
            className="h-8 text-xs bg-indigo-600 text-white font-semibold"
          >
            <span>Update Version</span>
          </Button>
        </form>
      )}

      {/* FOOTER ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        {!imageRendered ? (
          <Button
            size="sm"
            onClick={handleRenderImage}
            disabled={disabled || isRendering}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
            <span>Approve Prompt & Generate Poster Image</span>
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRevisionInput(!showRevisionInput)}
          disabled={disabled}
          className="h-8 text-xs text-slate-700 border-slate-200 flex items-center gap-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
          <span>{showRevisionInput ? "Cancel Revision" : "Request Changes"}</span>
        </Button>

        {imageRendered && finalImageUrl && (
          <a
            href={finalImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download="creative.jpg"
            className="inline-flex"
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Download</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};
