import React, { useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Workflow,
  ShieldCheck,
  Copy,
  Check,
  Hash,
  Share2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PosterPreviewQABlock } from "@/types/workspaceChat";
import { DynamicPosterCanvas } from "./DynamicPosterCanvas";

interface UniversalPosterQAPreviewCardProps {
  block: PosterPreviewQABlock;
  onFinalApprove?: () => void;
  onRequestRevision?: () => void;
  onRunAnother?: () => void;
  disabled?: boolean;
}

export const UniversalPosterQAPreviewCard: React.FC<UniversalPosterQAPreviewCardProps> = ({
  block,
  onFinalApprove,
  onRequestRevision,
  onRunAnother,
  disabled = false,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "facebook" | "all">("instagram");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const isDemo = block.isDemoPreview !== false || !block.qaPassed;
  const qaStatus = block.qaStatus || (isDemo ? "QA_NOT_RUN (No image generated)" : "QA_PASSED");

  const client = block.client || {
    name: "Digitalness Pilot",
    website: "",
    primaryColors: "#0B0F19 + #06B6D4",
  };

  const campaign = block.campaign || {
    event: "Digital Marketing Campaign",
    launchDate: "Immediate",
    headline: "Scale Your Digital Presence & Revenue",
    supportingLine: "End-to-end performance marketing and growth engineering tailored for modern brands.",
    website: client.website || "",
  };

  const socialCopy = block.socialCopy || {
    caption: `✨ ${(campaign.headline || "Scale Your Digital Presence & Revenue").toUpperCase()} ✨\n\n${campaign.supportingLine}.\n\n📞 Phone: ${client?.phone || "+91 91234 56789"}${client?.website ? `\n🌐 Website: ${client.website}` : ""}\n\n👉 Get Started Today`,
    instagramCaption: `✨ ${(campaign.headline || "Scale Your Digital Presence & Revenue").toUpperCase()} ✨\n\n${campaign.supportingLine}.\n\n📞 Phone: ${client?.phone || "+91 91234 56789"}${client?.website ? `\n🌐 Website: ${client.website}` : ""}\n\n👉 Get Started Today`,
    facebookCaption: `📢 ${campaign.headline}!\n\n${campaign.supportingLine}.${client?.website ? `\n\nVisit: ${client.website}` : ""}`,
    hashtags: [
      "#DigitalMarketing",
      "#SocialMediaMarketing",
      "#BusinessGrowth",
      "#Digitalness",
      "#HyderabadBusiness",
    ],
  };

  const primaryColor = block.client?.colorPalette?.primary || "#0B0F19";
  const accentColor = block.client?.colorPalette?.secondary || "#06B6D4";

  const getActiveCaption = () => {
    if (selectedPlatform === "instagram" && socialCopy.instagramCaption) {
      return socialCopy.instagramCaption;
    }
    if (selectedPlatform === "facebook" && socialCopy.facebookCaption) {
      return socialCopy.facebookCaption;
    }
    return socialCopy.caption;
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getActiveCaption());
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(socialCopy.hashtags.join(" "));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  return (
    <div className="mt-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* TOP HEADER */}
      <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" aria-hidden="true" focusable="false" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {isDemo ? "Creative Brief Approved — Demo Layout" : "Poster Generated — Asset Ready"}
          </h3>
        </div>
        {isDemo ? (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" focusable="false" />
            <span>DEMO PREVIEW · NO IMAGE GENERATED · QA NOT RUN</span>
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" focusable="false" />
            <span>QA PASSED</span>
          </Badge>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* POSTER CANVAS PREVIEW */}
        <div className="py-2">
          <DynamicPosterCanvas
            clientName={client.name}
            eventName={campaign.event}
            launchDate={campaign.launchDate}
            headline={campaign.headline}
            supportingLine={campaign.supportingLine}
            website={campaign.website}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        </div>

        {/* PRODUCTION EXPLANATORY NOTE */}
        <p className="text-xs text-slate-500 text-center italic max-w-md mx-auto">
          {isDemo
            ? "Visual layout preview rendered. In production, the active image generation provider (e.g. Pollinations / Stable Diffusion) will produce the final photo asset."
            : "The asset has been rendered and validated against CRM brand specifications."}
        </p>

        {/* SOCIAL MEDIA COPY, CAPTIONS & HASHTAGS BOX */}
        <div className="rounded-xl bg-slate-900 text-slate-100 p-4 border border-slate-800 space-y-3.5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" aria-hidden="true" focusable="false" />
              <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                Generated Captions & Hashtags
              </span>
            </div>

            {/* PLATFORM SWITCHER TABS */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedPlatform("instagram")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  selectedPlatform === "instagram"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>📸 Instagram</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform("facebook")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  selectedPlatform === "facebook"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>📘 Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform("all")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  selectedPlatform === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🌐 General</span>
              </button>
            </div>
          </div>

          {/* CAPTION TEXT AREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                {selectedPlatform === "instagram"
                  ? "Instagram Caption"
                  : selectedPlatform === "facebook"
                  ? "Facebook Post Copy"
                  : "Campaign Copy"}
              </span>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" focusable="false" />
                    <span>Copied Caption</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" aria-hidden="true" focusable="false" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950/80 rounded-lg p-3 text-xs font-sans whitespace-pre-wrap leading-relaxed border border-slate-800 text-slate-200">
              {getActiveCaption()}
            </div>
          </div>

          {/* HASHTAGS PILLS */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-amber-400" aria-hidden="true" focusable="false" />
                <span>Target Hashtags ({socialCopy.hashtags.length})</span>
              </span>
              <button
                type="button"
                onClick={handleCopyHashtags}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedHashtags ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" focusable="false" />
                    <span>Copied Tags</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" aria-hidden="true" focusable="false" />
                    <span>Copy All Tags</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {socialCopy.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-medium hover:border-indigo-400 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* MANAGER FINAL REVIEW BOX */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wider text-slate-900 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" aria-hidden="true" focusable="false" />
              <span>MANAGER FINAL REVIEW</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              <span>Publishing Locked</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {isDemo
              ? "Creative brief and copy approved. To generate and finalize the production asset, connect the image provider API."
              : "The work is complete and QA has passed. Review the actual output now. Scheduling remains locked until you approve."}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Button
              onClick={onFinalApprove}
              disabled={disabled}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" focusable="false" />
              <span>Final Approve & Save Draft</span>
            </Button>

            <Button
              variant="outline"
              onClick={onRequestRevision}
              disabled={disabled}
              className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Request Revision</span>
            </Button>

            <Button
              variant="secondary"
              onClick={onRunAnother}
              disabled={disabled}
              className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-200/80 text-slate-800 hover:bg-slate-300 flex items-center gap-1.5"
            >
              <Workflow className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Run Another Workflow</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
