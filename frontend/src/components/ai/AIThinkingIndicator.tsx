import React, { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AIThinkingIndicatorProps {
  prompt?: string;
}

const THINKING_STEPS = [
  "Understanding your request...",
  "Checking client & CRM context...",
  "Loading brand profile & memory...",
  "Preparing creative blueprint...",
  "Rendering AI design asset...",
];

export const AIThinkingIndicator: React.FC<AIThinkingIndicatorProps> = ({ prompt = "" }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>

      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-200/80 shadow-sm max-w-md space-y-1.5">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-800 transition-all duration-300">
            {THINKING_STEPS[stepIndex]}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${((stepIndex + 1) / THINKING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
