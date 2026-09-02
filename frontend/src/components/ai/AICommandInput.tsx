import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AICommandInputProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
  disabled?: boolean;
  customers?: any[];
  customSuggestions?: string[];
}

export const AICommandInput: React.FC<AICommandInputProps> = ({
  onSubmit,
  loading,
  disabled = false,
  customers = [],
  customSuggestions,
}) => {
  const [prompt, setPrompt] = useState('');

  // Dynamically derive quick commands based on live database entities
  const clientName = customers?.[0]?.name || 'GlowNest Salon';

  const quickCommands = customSuggestions || [
    'Show all pending tasks',
    'Show all hot leads',
    `Assign poster campaign for ${clientName} to Super Admin`,
    `Create a high priority task for ${clientName}`,
    'Show recent customer activity & tickets',
    `Create a new lead interested in SEO & Digital Marketing`,
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading || disabled) return;
    onSubmit(prompt.trim());
  };

  const handleSelectQuick = (cmd: string) => {
    setPrompt(cmd);
    onSubmit(cmd);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative flex items-center shadow-lg rounded-2xl border-2 border-indigo-200 bg-white focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
        <div className="pl-4 text-indigo-600 flex items-center">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Ask Digitalness AI... (e.g. 'Show all pending tasks' or 'Assign creative task for ${clientName}')`}
          disabled={loading || disabled}
          className="border-0 shadow-none focus-visible:ring-0 text-base py-6 px-3 bg-transparent text-slate-800 placeholder:text-slate-400 font-medium"
        />
        <div className="pr-3 flex items-center gap-2">
          <Button
            type="submit"
            disabled={!prompt.trim() || loading || disabled}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <span>Run</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-600 font-semibold flex items-center gap-1">
          💡 Try:
        </span>
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectQuick(cmd)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/80 transition-colors cursor-pointer font-medium disabled:opacity-50"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
