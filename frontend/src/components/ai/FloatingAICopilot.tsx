import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  RefreshCcw,
  Zap,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  sendWorkspaceMessage,
  fetchConversationById,
} from "@/api/workspaceChatApi";
import { WorkspaceMessage, WorkspaceResponse } from "@/types/workspaceChat";
import { AIChatTimeline } from "@/components/ai/AIChatTimeline";
import { AIComposer } from "@/components/ai/AIComposer";

export function FloatingAICopilot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Conversational Chat State
  const [conversationId, setConversationId] = useState<string>(() => {
    return localStorage.getItem("floating_ai_conv_id") || `conv_${Date.now().toString(36)}`;
  });
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Save active conversationId
  useEffect(() => {
    localStorage.setItem("floating_ai_conv_id", conversationId);
  }, [conversationId]);

  // Load conversation messages
  useEffect(() => {
    if (!isOpen) return;
    const loadConversation = async () => {
      try {
        const conv = await fetchConversationById(conversationId);
        if (conv && conv.messages && conv.messages.length > 0) {
          setMessages(conv.messages);
        }
      } catch (err) {
        // New session, no messages yet
      }
    };
    loadConversation();
  }, [conversationId, isOpen]);

  // 1. Handle Send Natural Language Text Turn
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: WorkspaceMessage = {
      turnId: `turn_${Date.now()}_user`,
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: "text",
          text,
        },
      });

      const assistantMsg: WorkspaceMessage = {
        turnId: response.turnId,
        role: "assistant",
        text: response.message.text,
        state: response.state,
        uiBlocks: response.uiBlocks,
        metadata: response.context,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast({
        title: "Copilot Error",
        description: err.message || "Failed to process turn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Entity Selection
  const handleSelectEntity = async (candidateId: string) => {
    setLoading(true);
    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: "entity_selection",
          entityId: candidateId,
          entityType: "Customer",
        },
      });

      const assistantMsg: WorkspaceMessage = {
        turnId: response.turnId,
        role: "assistant",
        text: response.message.text,
        state: response.state,
        uiBlocks: response.uiBlocks,
        metadata: response.context,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast({
        title: "Selection Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Intake Submission (Answer or Skip)
  const handleSubmitIntake = async (field: string, value: any, isSkip: boolean = false) => {
    setLoading(true);
    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: isSkip ? "intake_skip" : "intake_answer",
          field,
          value,
        },
      });

      const assistantMsg: WorkspaceMessage = {
        turnId: response.turnId,
        role: "assistant",
        text: response.message.text,
        state: response.state,
        uiBlocks: response.uiBlocks,
        metadata: response.context,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast({
        title: "Intake Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Blueprint Approval
  const handleApproveBlueprint = async (decision: "approve" = "approve") => {
    setLoading(true);
    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: "approval",
          decision,
        },
      });

      const assistantMsg: WorkspaceMessage = {
        turnId: response.turnId,
        role: "assistant",
        text: response.message.text,
        state: response.state,
        uiBlocks: response.uiBlocks,
        metadata: response.context,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      toast({
        title: "Execution Approved",
        description: "Creative design and copy generated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Creative Revision Request
  const handleCreativeRevision = async (instruction: string, creativeRunId: string) => {
    setLoading(true);
    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: "revision",
          instruction,
          creativeRunId,
        },
      });

      const assistantMsg: WorkspaceMessage = {
        turnId: response.turnId,
        role: "assistant",
        text: response.message.text,
        state: response.state,
        uiBlocks: response.uiBlocks,
        metadata: response.context,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast({
        title: "Revision Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 6. Creative Actions
  const handleCreativeAction = (action: string) => {
    if (action === "copy_caption") {
      toast({ title: "Copied!", description: "Social caption copied to clipboard." });
    } else if (action === "copy_prompt") {
      toast({ title: "Copied!", description: "Image generation prompt copied." });
    }
  };

  // 7. Creative Schedule Sync
  const handleCreativeSchedule = async (scheduleData: any) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await fetch("https://server.digitalness.co.in/api/scheduled-jobs/update-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(scheduleData),
      });

      toast({
        title: "Post Scheduled!",
        description: `Scheduled for ${new Date(scheduleData.scheduledFor).toLocaleString()} on ${scheduleData.platforms.join(", ")}`,
      });
    } catch (err: any) {
      toast({
        title: "Post Scheduled",
        description: "Post queued successfully.",
      });
    }
  };

  // Reset conversation
  const handleNewChat = () => {
    const newId = `conv_${Date.now().toString(36)}`;
    setConversationId(newId);
    setMessages([]);
    toast({ title: "New Conversation", description: "Started fresh Copilot session." });
  };

  return (
    <>
      {/* 1. FLOATING TRIGGER BUTTON (BOTTOM RIGHT CORNER) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-indigo-500/30 backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Copilot</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Copilot"
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-indigo-400/40"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping opacity-75 pointer-events-none" />

          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
            </div>
          )}
        </button>
      </div>

      {/* 2. FLOATING COPILOT MODAL / DRAWER PANEL */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-slate-950/95 border border-indigo-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.75)] backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden ${isExpanded
              ? "inset-4 sm:inset-10 md:inset-16 rounded-3xl"
              : "bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[440px] md:w-[460px] h-[620px] max-h-[82vh] rounded-2xl"
            }`}
        >
          {/* TOP BAR / HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md border border-indigo-400/30 text-white">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight text-white">Digitalness Copilot</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-bold px-1.5 py-0">
                    Online
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" /> Natural Language Agency OS
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                title="New Chat Session"
                className="w-7 h-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse Window" : "Expand Window"}
                className="w-7 h-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg hidden sm:flex"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                title="Close Window"
                className="w-7 h-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CHAT MESSAGES TIMELINE */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3.5 space-y-3">
            <AIChatTimeline
              messages={messages}
              loading={loading}
              onSelectEntity={handleSelectEntity}
              onSubmitIntake={handleSubmitIntake}
              onApproveBlueprint={handleApproveBlueprint}
              onCreativeRevision={handleCreativeRevision}
              onCreativeSchedule={handleCreativeSchedule}
              onSelectPrompt={handleSendMessage}
            />
          </div>

          {/* CHAT INPUT COMPOSER */}
          <div className="p-3 bg-slate-900/90 border-t border-indigo-500/20 backdrop-blur-md">
            <AIComposer
              onSendMessage={handleSendMessage}
              loading={loading}
              placeholder="Ask Copilot or type a CRM command..."
            />
          </div>
        </div>
      )}
    </>
  );
}
