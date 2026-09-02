import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Sliders,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreativeBriefBlock } from "@/types/workspaceChat";

interface UniversalCreativeBriefCardProps {
  block: CreativeBriefBlock;
  onApprove?: () => void;
  onRequestChange?: () => void;
  onAnotherDirection?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const UniversalCreativeBriefCard: React.FC<UniversalCreativeBriefCardProps> = ({
  block,
  onApprove,
  onRequestChange,
  onAnotherDirection,
  onCancel,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(block.finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const client = block.client || {
    name: "Client 1",
    industry: "Real Estate",
    brandStyle: "Premium · Professional · Modern",
    primaryColors: "Navy Blue + Gold",
    logoStatus: "Approved logo available",
    website: "www.client1.com",
  };

  const campaign = block.campaign || {
    type: "Website Launch Announcement",
    event: "Official Website Launch",
    launchDate: "12 September 2026",
    platform: "Instagram + Facebook",
    posterSize: "1080 × 1350 px",
    aspectRatio: "4:5",
  };

  const communication = block.communication || {
    headline: "Our New Website Is Live",
    supportingLine: "A Better Digital Experience Begins This September",
    dateHighlight: "12 SEP 2026",
    cta: "Visit Our New Website",
  };

  const creativeConcept = block.creativeConcept || {
    name: "DIGITAL GATEWAY",
    description:
      "A premium laptop and smartphone display the new Client 1 website in a sophisticated studio environment. Subtle brand-colored light trails create a sense of launch, innovation and progress. The launch date is prominent but elegant.",
  };

  const visualComposition = block.visualComposition || {
    logoBranding: "10%",
    heroVisual: "65%",
    headlineDate: "15%",
    ctaWebsite: "10%",
  };

  const checklist = block.verifiedChecklist || [
    { label: "Logo", verified: true },
    { label: "Brand colors", verified: true },
    { label: "Website", verified: true },
    { label: "Launch date", verified: true },
    { label: "Poster format", verified: true },
    { label: "Approval required", verified: true },
  ];

  return (
    <div className="mt-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* CARD TOP HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 border-b border-indigo-950/40 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              SOCIAL / CREATIVE
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {campaign.type || "Digital Marketing Services Poster — Creative Brief"}
            </h3>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 tracking-wider animate-pulse">
            WAITING APPROVAL
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5 text-slate-800 text-xs sm:text-[13px]">
        {/* GRID 1: CLIENT DETAILS & CAMPAIGN DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CLIENT DETAILS BOX */}
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-black tracking-wider text-indigo-700 uppercase flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Client Details</span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-2">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Client</span>
                <span className="font-bold text-slate-900">{client.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Industry</span>
                <span className="font-semibold text-slate-700">{client.industry}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Phone (CRM)</span>
                <span className={`font-semibold text-[11px] ${client.phone && client.phone !== "PHONE_MISSING" ? "text-slate-800" : "text-amber-600 italic"}`}>
                  {client.phone && client.phone !== "PHONE_MISSING" ? client.phone : "PHONE_MISSING"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Logo Status</span>
                <span className="font-medium text-emerald-700 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" aria-hidden="true" focusable="false" />
                  <span>{client.logoStatus || "Test client profile applied"}</span>
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Brand Style</span>
                <span className="font-semibold text-slate-800">{client.brandStyle}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Primary Colors</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center -space-x-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0B0F19] border border-white shadow-xs" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#06B6D4] border border-white shadow-xs" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">{client.primaryColors}</span>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Website</span>
                <a
                  href={`https://${(client.website || "www.digitalness.agency").replace(/^https?:\/\//, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Globe className="w-3 h-3 text-indigo-500 flex-shrink-0" aria-hidden="true" focusable="false" />
                  <span>{client.website || "www.digitalness.agency"}</span>
                </a>
              </div>
            </div>
          </div>

          {/* CAMPAIGN DETAILS BOX */}
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-black tracking-wider text-indigo-700 uppercase flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              <span>Campaign Details</span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-2">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Objective</span>
                <span className="font-bold text-slate-900">{campaign.event || campaign.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Launch Date</span>
                <span className="font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded text-xs inline-block">
                  {campaign.launchDate || "Immediate"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Platform</span>
                <span className="font-semibold text-slate-800">{campaign.platform || "Instagram"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Poster Size</span>
                <span className="font-bold text-slate-800">{campaign.posterSize || "1080 × 1080 px"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Aspect Ratio</span>
                <span className="font-bold text-slate-800">{campaign.aspectRatio || "1:1"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase">Publishing</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs inline-block">
                  Disabled (Approval First)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMMUNICATION STRATEGY */}
        <div className="rounded-xl bg-indigo-50/40 p-3.5 border border-indigo-100 space-y-2">
          <div className="text-[11px] font-black tracking-wider text-indigo-800 uppercase flex items-center gap-1.5 pb-1 border-b border-indigo-200/60">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" focusable="false" />
            <span>Communication Strategy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
            <div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Headline</span>
              <span className="font-extrabold text-slate-950 text-xs sm:text-[13px]">
                {communication.headline}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Supporting Line</span>
              <span className="font-medium text-slate-700 text-xs">
                {communication.supportingLine}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Date / Campaign Highlight</span>
              <span className="font-bold text-indigo-700">{communication.dateHighlight || "Agency Awareness"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 block uppercase">CTA</span>
              <span className="font-bold text-slate-900">{communication.cta}</span>
            </div>
          </div>

          {/* GENERATED SOCIAL CAPTION & HASHTAGS PREVIEW */}
          <div className="pt-2 border-t border-indigo-100/80 space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-900 block uppercase">
              Social Media Caption & Exactly 5 Hashtags
            </span>
            <p className="text-xs text-slate-700 font-medium italic bg-white/80 p-2.5 rounded-lg border border-indigo-100 whitespace-pre-line">
              {communication.caption}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(
                communication.hashtags || [
                  "#DigitalMarketing",
                  "#SocialMediaMarketing",
                  "#BusinessGrowth",
                  "#Digitalness",
                  "#HyderabadBusiness",
                ]
              ).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-indigo-100/80 text-indigo-800 text-[11px] font-mono font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CREATIVE CONCEPT */}
        <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
              Creative Concept
            </span>
            <span className="text-xs font-black tracking-wide text-amber-300">
              {creativeConcept.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {creativeConcept.description}
          </p>
        </div>

        {/* VISUAL COMPOSITION BREAKDOWN */}
        <div className="space-y-2">
          <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" focusable="false" />
            <span>Visual Composition</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-slate-100/90 p-2 border border-slate-200 text-center">
              <span className="text-base font-black text-indigo-700 block">
                {visualComposition.logoBranding}
              </span>
              <span className="text-[10px] font-semibold text-slate-700 block">
                Logo / Branding
              </span>
            </div>
            <div className="rounded-lg bg-indigo-50/90 p-2 border border-indigo-200 text-center">
              <span className="text-base font-black text-indigo-800 block">
                {visualComposition.heroVisual}
              </span>
              <span className="text-[10px] font-semibold text-indigo-950 block">
                Hero Visual (Visual Only)
              </span>
            </div>
            <div className="rounded-lg bg-slate-100/90 p-2 border border-slate-200 text-center">
              <span className="text-base font-black text-indigo-700 block">
                {visualComposition.headlineDate}
              </span>
              <span className="text-[10px] font-semibold text-slate-700 block">
                Headline / Typography
              </span>
            </div>
            <div className="rounded-lg bg-slate-100/90 p-2 border border-slate-200 text-center">
              <span className="text-base font-black text-indigo-700 block">
                {visualComposition.ctaWebsite}
              </span>
              <span className="text-[10px] font-semibold text-slate-700 block">
                CTA / Phone / Website
              </span>
            </div>
          </div>
        </div>

        {/* FINAL GENERATION PROMPT BOX (VISUAL ONLY - NO EMBEDDED TEXT) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
              <span>Visual-Only Image Prompt</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-mono font-bold">
                ✓ No Text / Words / Logos
              </span>
            </span>
            <button
              onClick={handleCopyPrompt}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" focusable="false" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" focusable="false" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-950 text-slate-200 rounded-xl p-3.5 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner max-h-48 overflow-y-auto">
            {block.finalPrompt}
          </div>
        </div>

        {/* VERIFIED BEFORE GENERATION CHECKLIST */}
        <div className="pt-2 border-t border-slate-200">
          <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase block mb-2">
            Verified Before Generation
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" focusable="false" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <Button
            onClick={onApprove}
            disabled={disabled}
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" aria-hidden="true" focusable="false" />
            <span>Approve & Generate Poster</span>
          </Button>

          <Button
            variant="outline"
            onClick={onRequestChange}
            disabled={disabled}
            className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <span>Edit / Request Change</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onAnotherDirection}
            disabled={disabled}
            className="font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
            <span>Another Direction</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={disabled}
            className="font-semibold text-xs sm:text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
