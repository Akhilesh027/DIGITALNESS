import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Palette,
  Megaphone,
  Bot,
  Play,
  CheckCircle2,
  ArrowRight,
  Zap,
  Eye,
  RefreshCw,
  Sliders,
  Send,
  Layers,
  ShieldCheck,
} from "lucide-react";

export default function UpcomingPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [demoState, setDemoState] = useState({
    calendarGenerated: false,
    creativeGenerated: false,
    adsRunning: false,
    selectedPrompt: "Diwali Special Festive Flash Sale - Flat 30% Off",
  });

  const [generating, setGenerating] = useState(false);

  const handleSimulate = (key) => {
    setGenerating(true);
    setTimeout(() => {
      setDemoState((prev) => ({ ...prev, [key]: true }));
      setGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                Upcoming Agency Suite
              </span>
              <span className="text-xs text-slate-400 font-medium">In Final Staging & QA</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Upcoming AI & Autonomous Modules
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore live interactive demonstrations of next-generation AI workflows currently being integrated into your Digitalness client desk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <span className="text-brand-400 font-black">4</span> Major Systems Ready For Demo
            </div>
          </div>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: "calendar",
            title: "Content Calendar",
            icon: Calendar,
            tag: "Social Scheduling",
          },
          {
            id: "creative",
            title: "Creative Studio",
            icon: Palette,
            tag: "Asset Generator",
          },
          {
            id: "ads",
            title: "Performance Ads",
            icon: Megaphone,
            tag: "Meta & Google",
          },
          {
            id: "agents",
            title: "Autonomous Agents",
            icon: Bot,
            tag: "24/7 SLA Watcher",
          },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive
                  ? "bg-gradient-to-r from-brand-500/20 to-amber-500/10 border-brand-500/40 shadow-glow"
                  : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive
                      ? "bg-brand-500 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Click to explore demo</p>
            </button>
          );
        })}
      </div>

      {/* Interactive Demonstration Panel */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Tab 1: AI Content Calendar */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase text-brand-400 tracking-wider">
                  Upcoming Feature • Demo
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Autonomous Social Content Calendar
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Automatically scans upcoming Indian festivals and commercial trends to formulate a month of ready-to-publish social posts.
                </p>
              </div>

              <button
                onClick={() => handleSimulate("calendarGenerated")}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition cursor-pointer shrink-0"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{demoState.calendarGenerated ? "Regenerate Demo Calendar" : "Generate Demo Calendar"}</span>
              </button>
            </div>

            {demoState.calendarGenerated ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    day: "Oct 24",
                    event: "Dussehra Victory Campaign",
                    platform: "Instagram & Facebook",
                    status: "Ready for Approval",
                    caption: "Celebrate triumph with unmissable festive deals! Light up your festivities with up to 40% savings. #DigitalFestive",
                  },
                  {
                    day: "Oct 28",
                    event: "Pre-Diwali Flash Offer",
                    platform: "WhatsApp & Instagram",
                    status: "Draft Ready",
                    caption: "Golden hour savings are here! Claim your early bird Diwali hampers before stock clears out. Limited slots available.",
                  },
                  {
                    day: "Nov 01",
                    event: "Diwali Day Celebration Post",
                    platform: "All Platforms + GBP",
                    status: "Scheduled",
                    caption: "Wishing you and your family abundant joy, wealth, and prosperity this Deepavali! ✨🪔",
                  },
                ].map((post, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-brand-400">{post.day}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {post.status}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white">{post.event}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      "{post.caption}"
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Channels: {post.platform}</span>
                      <span className="text-brand-400 font-bold">100% Automated</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
                <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Interactive Demo Ready</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the <strong>Generate Demo Calendar</strong> button above to watch our AI plan and formulate multi-channel festive posts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Creative Studio */}
        {activeTab === "creative" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase text-brand-400 tracking-wider">
                  Upcoming Feature • Demo
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  AI Creative Studio & Ad Copy Generator
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Generate professional ad copy, multi-aspect-ratio promotional banners, and Canva-ready templates from a single prompt.
                </p>
              </div>

              <button
                onClick={() => handleSimulate("creativeGenerated")}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition cursor-pointer shrink-0"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Generate Demo Asset</span>
              </button>
            </div>

            {demoState.creativeGenerated ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <span className="text-[10px] font-bold uppercase text-brand-400 tracking-wider">
                    Generated Ad Copy
                  </span>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">Primary Headline:</p>
                    <p className="text-sm font-extrabold text-white">
                      Light Up Your Growth • Get 30% Off This Diwali Season
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">Body Hook:</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Don't miss the biggest sale of the quarter. Premium services, certified support, and 24-hour turnaround guaranteed.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold">
                      CTA: Shop Now
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Format: Instagram Square (1080x1080)
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-gradient-to-tr from-brand-900/30 via-slate-900 to-amber-950/20 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      LIVE PREVIEW
                    </span>
                    <h4 className="text-2xl font-black text-white">FESTIVE MEGA SALE</h4>
                    <p className="text-xs text-brand-300 font-bold">FLAT 30% DISCOUNT ON ALL PACKAGES</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span>Generated in 1.2s via AI</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High Resolution
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
                <Palette className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Creative Engine Ready</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click <strong>Generate Demo Asset</strong> to test the autonomous multi-aspect ratio creative renderer.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Performance Ads */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase text-brand-400 tracking-wider">
                  Upcoming Feature • Demo
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Ad Campaigns & Emergency Spend Locks
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Automated Meta & Google ad synchronizer with spend kill-switches, ROAS performance tracking, and live budget locks.
                </p>
              </div>

              <button
                onClick={() => handleSimulate("adsRunning")}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition cursor-pointer shrink-0"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{demoState.adsRunning ? "Simulate Campaign Sync" : "Launch Ad Demo"}</span>
              </button>
            </div>

            {demoState.adsRunning ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Simulated Spend</span>
                  <div className="text-2xl font-black text-white mt-1">₹45,200</div>
                  <span className="text-[10px] text-emerald-400 font-bold">Within Daily Budget Cap</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Blended ROAS</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">4.62x</div>
                  <span className="text-[10px] text-emerald-400 font-bold">+28% vs Industry Standard</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Emergency Spend Lock</span>
                  <div className="text-base font-black text-emerald-400 mt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    PROTECTED (ACTIVE)
                  </div>
                  <span className="text-[10px] text-slate-400">Write freezes enabled</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
                <Megaphone className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Ad Telemetry Ready</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click <strong>Launch Ad Demo</strong> to see how our autonomous spend tracker protects and scales campaign budgets.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Autonomous Agents */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800/80 pb-5">
              <span className="text-[11px] font-black uppercase text-brand-400 tracking-wider">
                Upcoming Feature • Architecture
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                24/7 Autonomous Agency Workers
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Background BullMQ agents that monitor deliverables around the clock, ping team leads on SLA risks, and generate daily executive briefings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "SLA Guardian", status: "Active", desc: "Flags deliverables within 48h of deadline." },
                { name: "Content Publisher", status: "Active", desc: "Dispatches approved posts to Instagram & FB." },
                { name: "Payment Recovery", status: "Active", desc: "Automated invoice reminders & receipts." },
                { name: "Executive Briefing", status: "Active", desc: "Daily KPI intelligence for managers." },
              ].map((agent, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-white">{agent.name}</h5>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
