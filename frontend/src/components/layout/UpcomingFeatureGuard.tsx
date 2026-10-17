import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  RotateCcw,
  Bot,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpcomingFeatureGuardProps {
  featureId?: string;
  title: string;
  category?: string;
  description: string;
  highlights?: string[];
  icon?: React.ElementType;
  children: React.ReactNode;
}

export const UpcomingFeatureGuard: React.FC<UpcomingFeatureGuardProps> = ({
  featureId,
  title,
  category = "Autonomous AI & Operations",
  description,
  highlights = [
    "Full production workflow preview",
    "Real-time simulated data processing",
    "Interactive controls and automated actions",
  ],
  icon: Icon = Sparkles,
  children,
}) => {
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    return localStorage.getItem("digitalness_demo_mode") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsDemoActive(localStorage.getItem("digitalness_demo_mode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("demo-mode-changed", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("demo-mode-changed", handleStorageChange);
    };
  }, []);

  const handleEnableDemo = () => {
    localStorage.setItem("digitalness_demo_mode", "true");
    setIsDemoActive(true);
    window.dispatchEvent(new Event("demo-mode-changed"));
  };

  const handleDisableDemo = () => {
    localStorage.setItem("digitalness_demo_mode", "false");
    setIsDemoActive(false);
    window.dispatchEvent(new Event("demo-mode-changed"));
  };

  if (isDemoActive) {
    return (
      <div className="relative">
        {/* Floating Demo Status Pill */}
        <div className="sticky top-2 z-30 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur-md shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-extrabold text-amber-300">LIVE DEMO ACTIVE</span>
              <span className="hidden sm:inline text-amber-200/80 ml-2">
                • You are exploring the upcoming <strong className="text-white">{title}</strong> module.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              Upcoming
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisableDemo}
              className="h-7 text-xs border-amber-500/30 bg-slate-900/60 text-amber-300 hover:bg-slate-900 hover:text-white"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Exit Demo
            </Button>
          </div>
        </div>

        {/* The actual page content */}
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
      >
        {/* Ambient Gradient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Pill & Icon */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent border border-amber-500/30 text-amber-400 shadow-inner">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    {category}
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    UPCOMING
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                  {title}
                </h2>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {description}
          </p>

          {/* Key Feature Highlights */}
          <div className="space-y-2.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Module Capabilities
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Callout & Demo Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Pre-Release Beta:</span> Click the demo button to unlock and explore all interface controls.
            </div>

            <Button
              onClick={handleEnableDemo}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-sm px-6 h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Live Demo</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
