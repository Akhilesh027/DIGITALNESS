import React from "react";
import { Laptop, Smartphone, Sparkles, Globe, ArrowUpRight } from "lucide-react";

interface DynamicPosterCanvasProps {
  clientName?: string;
  eventName?: string;
  launchDate?: string;
  headline?: string;
  supportingLine?: string;
  website?: string;
  aspectRatio?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const DynamicPosterCanvas: React.FC<DynamicPosterCanvasProps> = ({
  clientName = "CLIENT 1",
  eventName = "OFFICIAL LAUNCH",
  launchDate = "12 SEP 2026",
  headline = "OUR NEW WEBSITE IS LIVE",
  supportingLine = "A BETTER DIGITAL EXPERIENCE BEGINS THIS SEPTEMBER",
  website = "www.client1.com",
  aspectRatio = "4:5",
  primaryColor = "#0A192F",
  accentColor = "#D4AF37",
}) => {
  // Split headline into stylish lines
  const headlineWords = headline.toUpperCase().split(" ");
  const line1 = headlineWords.slice(0, 2).join(" ") || "OUR NEW";
  const line2 = headlineWords.slice(2, 3).join(" ") || "WEBSITE";
  const line3 = headlineWords.slice(3).join(" ") || "IS LIVE";

  return (
    <div
      className="relative w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30 select-none text-white transition-all duration-300 hover:shadow-indigo-500/20"
      style={{
        aspectRatio: "4 / 5",
        background: `radial-gradient(circle at 50% 20%, #1e293b 0%, ${primaryColor} 60%, #030712 100%)`,
      }}
    >
      {/* GLOWING AMBIENT LIGHT TRAILS */}
      <div
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: accentColor }}
      />
      <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full blur-3xl bg-indigo-500/20 pointer-events-none" />
      <div
        className="absolute -bottom-16 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* METALLIC GRID PATTERN OVERLAY */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* POSTER INNER CONTENT CONTAINER */}
      <div className="relative h-full flex flex-col justify-between p-6 sm:p-7 z-10">
        {/* TOP HEADER: BRAND LOGO & LAUNCH BADGE */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-slate-950 shadow-md"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #F59E0B)` }}
            >
              {clientName.charAt(0)}
            </div>
            <span className="text-xs font-black tracking-widest text-slate-200">
              {clientName.toUpperCase()} · {eventName.toUpperCase()}
            </span>
          </div>

          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 border border-amber-300/40 text-slate-950"
            style={{
              background: `linear-gradient(90deg, #FDE68A, ${accentColor}, #F59E0B)`,
            }}
          >
            <Sparkles className="w-3 h-3 text-slate-950" />
            {launchDate}
          </div>
        </div>

        {/* HERO TYPOGRAPHY */}
        <div className="text-center my-auto space-y-1 py-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white drop-shadow-md">
            <span className="block text-slate-200">{line1}</span>
            <span
              className="block font-extrabold tracking-wide py-0.5 text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(180deg, #FFFBEB 0%, ${accentColor} 50%, #D97706 100%)`,
              }}
            >
              {line2}
            </span>
            <span className="block text-slate-100">{line3}</span>
          </h1>

          {/* DEVICE HERO MOCKUP VISUAL (LAPTOP + PHONE IN LUXURY STUDIO) */}
          <div className="relative w-full max-w-[280px] mx-auto my-3.5 p-3 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/15 shadow-2xl">
            {/* SCREEN HEADER */}
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] text-slate-400 font-mono">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="truncate max-w-[120px]">{website}</span>
              <span className="text-amber-400 font-bold">HTTPS</span>
            </div>

            {/* SCREEN BODY UI PREVIEW */}
            <div className="pt-2 flex items-center justify-center gap-3">
              {/* LAPTOP DISPLAY */}
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-md p-2 border border-white/10 text-center space-y-1">
                <Laptop className="w-5 h-5 mx-auto text-amber-400/90" />
                <span className="text-[8px] font-bold text-slate-300 block">DESKTOP UI</span>
                <div className="h-1 bg-indigo-500/40 rounded-full w-3/4 mx-auto" />
              </div>

              {/* PHONE DISPLAY */}
              <div className="w-14 bg-gradient-to-br from-slate-900 to-slate-950 rounded-md p-2 border border-white/10 text-center space-y-1">
                <Smartphone className="w-4 h-4 mx-auto text-amber-400/90" />
                <span className="text-[8px] font-bold text-slate-300 block">MOBILE</span>
                <div className="h-1 bg-amber-500/40 rounded-full w-2/3 mx-auto" />
              </div>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide max-w-xs mx-auto leading-relaxed uppercase">
            {supportingLine}
          </p>
        </div>

        {/* BOTTOM FOOTER: CTA BAR */}
        <div className="border-t border-white/15 pt-3">
          <div
            className="w-full py-2 px-3.5 rounded-xl flex items-center justify-between text-slate-950 font-black text-xs shadow-lg transition-transform"
            style={{
              background: `linear-gradient(90deg, #FDE68A, ${accentColor}, #F59E0B)`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span className="tracking-wide font-mono text-[11px]">{website}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold">
              <span>EXPLORE</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
