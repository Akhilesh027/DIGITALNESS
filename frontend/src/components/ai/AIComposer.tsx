import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Sparkles, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuickPromptChips } from "./QuickPromptChips";

interface AIComposerProps {
  onSendMessage: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export const AIComposer: React.FC<AIComposerProps> = ({
  onSendMessage,
  loading = false,
  placeholder = "Ask Digitalness AI (e.g. 'I need a poster for website launch', 'Show today's briefing')...",
}) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-3 space-y-2.5 max-w-5xl mx-auto w-full shadow-2xl">
      {/* QUICK PROMPT CHIPS */}
      <QuickPromptChips
        onSelectPrompt={(p) => {
          setText(p);
          if (textareaRef.current) textareaRef.current.focus();
        }}
        disabled={loading}
      />

      {/* INPUT BAR */}
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all p-2 flex items-end gap-2 shadow-inner">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
          className="min-h-[42px] max-h-32 text-xs sm:text-sm bg-transparent border-0 focus-visible:ring-0 resize-none py-2 px-3 text-slate-100 placeholder:text-slate-500 leading-relaxed font-sans"
        />

        <div className="flex items-center gap-1.5 flex-shrink-0 pb-1 pr-1">
          {/* VOICE INPUT MIC */}
          {recognitionRef.current && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={loading}
              onClick={toggleVoice}
              className={`w-8 h-8 rounded-xl transition-all ${isListening
                ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              title={isListening ? "Listening... Speak now" : "Dictate with voice"}
            >
              {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}

          {/* SEND BUTTON */}
          <Button
            type="button"
            size="icon"
            disabled={loading || !text.trim()}
            onClick={handleSend}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-30 disabled:hover:bg-indigo-600"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* FOOTER KEYBOARD LEGEND */}
      <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>⚡ <strong className="text-slate-400 font-semibold">Enter</strong> to send</span>
          <span>•</span>
          <span><strong className="text-slate-400 font-semibold">Shift + Enter</strong> for new line</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 font-mono">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Multi-Turn State Active</span>
        </div>
      </div>
    </div>
  );
};
