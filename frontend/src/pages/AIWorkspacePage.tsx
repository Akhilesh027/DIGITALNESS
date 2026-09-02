import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Cpu,
  RefreshCcw,
  Trash2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  sendWorkspaceMessage,
  fetchConversations,
  fetchConversationById,
  deleteConversationApi,
} from "@/api/workspaceChatApi";
import { WorkspaceMessage, WorkspaceResponse } from "@/types/workspaceChat";
import { AIChatTimeline } from "@/components/ai/AIChatTimeline";
import { AIComposer } from "@/components/ai/AIComposer";
import { AutomationCenter } from "@/components/automation/AutomationCenter";
import { ExecutiveBriefingCard } from "@/components/ai/ExecutiveBriefingCard";

export default function AIWorkspacePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"chat" | "automation">("chat");

  // Conversational Chat State
  const [conversationId, setConversationId] = useState<string>(() => {
    return localStorage.getItem("active_ai_conv_id") || `conv_${Date.now().toString(36)}`;
  });
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);

  // Save active conversationId
  useEffect(() => {
    localStorage.setItem("active_ai_conv_id", conversationId);
  }, [conversationId]);

  // Load active conversation messages from backend
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const conv = await fetchConversationById(conversationId);
        if (conv && conv.messages) {
          setMessages(conv.messages);
        }
      } catch (err) {
        // New conversation, start fresh
      }
    };
    loadConversation();
    fetchConversations()
      .then(setRecentConversations)
      .catch(() => null);
  }, [conversationId]);

  // 1. Handle Send Natural Language Text Turn
  const handleSendMessage = async (text: string, overrideConvId?: string) => {
    if (!text.trim() || loading) return;

    const targetConvId = overrideConvId || conversationId;

    // Optimistically append user message
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
        conversationId: targetConvId,
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
        title: "Assistant Error",
        description: err.message || "Failed to process turn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Entity Selection (Client Chip Pick)
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
      toast({ title: "Entity Selection Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Intake Answer
  const handleSubmitIntake = async (field: string, value: any, isSkip: boolean = false) => {
    setLoading(true);
    try {
      const response: WorkspaceResponse = await sendWorkspaceMessage({
        conversationId,
        input: {
          type: "intake_answer",
          field,
          value,
          isSkip,
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
      toast({ title: "Intake Error", description: err.message, variant: "destructive" });
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
    } catch (err: any) {
      toast({ title: "Approval Error", description: err.message, variant: "destructive" });
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
      toast({ title: "Revision Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle Creative Schedule / Publishing Approval
  const handleCreativeSchedule = async (creativeRunId: string, scheduleDetails?: any) => {
    const slot = scheduleDetails?.slot || "Tomorrow at 10:00 AM IST";
    const platforms = scheduleDetails?.platforms || ["Instagram Feed", "Facebook Page"];
    const notes = scheduleDetails?.notes ? `\n- 📝 **Special Note**: "${scheduleDetails.notes}"` : "";

    // Sync to backend /scheduler DB
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/scheduled-jobs/update-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creativeRunId,
          slot,
          scheduledFor: scheduleDetails?.customDate || null,
          platforms,
          notes: scheduleDetails?.notes || "",
        }),
      });
    } catch (e: any) {
      console.warn("Failed to sync schedule update to backend:", e.message);
    }

    toast({
      title: "🚀 Post Scheduled & Synced",
      description: `Asset queued for ${platforms.join(" & ")} on ${slot}. Appears live on /scheduler.`,
    });

    const scheduleConfirmMsg: WorkspaceMessage = {
      turnId: `schedule_${Date.now()}`,
      role: "assistant",
      text: `🚀 **Asset Confirmed & Scheduled!**\n\nThe creative, caption, and hashtags have been queued in the **CRM Content Calendar & Scheduler Dashboard**:\n- 📅 **Scheduled Slot**: ${slot}\n- 📱 **Channels**: ${platforms.join(", ")}\n- 🎯 **Status**: Queued for Auto-Publishing${notes}\n- 🔗 **View in Queue**: [Open Scheduler Feed](http://localhost:8080/scheduler)`,
      state: "COMPLETED",
      uiBlocks: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, scheduleConfirmMsg]);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<"agency" | "client">("agency");
  const [activeClient, setActiveClient] = useState<any | null>(null);

  // Dynamic Live Customers fetched from CRM MongoDB
  const [liveCustomers, setLiveCustomers] = useState<any[]>([
    { _id: "cust_aura", name: "Aura Aesthetics Clinic", businessType: "Healthcare / Skincare", city: "Hyderabad", branchId: "BR001", monthlyRetainer: "₹75,000/mo" },
    { _id: "cust_prestige", name: "Prestige SkyVillas", businessType: "Luxury Real Estate", city: "Hyderabad", branchId: "BR001", monthlyRetainer: "₹1,20,000/mo" },
    { _id: "cust_cloudscale", name: "CloudScale AI Systems", businessType: "B2B SaaS / Enterprise", city: "Bangalore", branchId: "BR001", monthlyRetainer: "₹95,000/mo" },
    { _id: "cust_vogue", name: "VogueCraft Atelier", businessType: "D2C Fashion", city: "Mumbai", branchId: "BR001", monthlyRetainer: "₹65,000/mo" },
    { _id: "cust_amber", name: "The Amber Table", businessType: "Fine Dining", city: "Hyderabad", branchId: "BR001", monthlyRetainer: "₹50,000/mo" },
  ]);

  // Fetch real customers from CRM API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/customers", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        const data = json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(data) && data.length > 0) {
          setLiveCustomers(data);
        }
      } catch (e) {
        console.warn("Using preset customer roster for AI Workspace:", e);
      }
    };
    fetchCustomers();
  }, []);

  // Switch to Global Agency Chat Mode
  const handleSelectAgencyChat = () => {
    setChatMode("agency");
    setActiveClient(null);
    const agencyConvId = "agency_global_copilot";
    setConversationId(agencyConvId);
  };

  // Switch to Dedicated Client Chat Mode & Auto-Load Client 360 Overview
  const handleSelectClientChat = async (client: any) => {
    setChatMode("client");
    setActiveClient(client);
    const clientConvId = `conv_client_${client._id || client.name.replace(/\s+/g, "_")}`;
    setConversationId(clientConvId);

    try {
      const conv = await fetchConversationById(clientConvId);
      if (!conv || !conv.messages || conv.messages.length === 0) {
        handleSendMessage(`Show context and latest updates for ${client.name}`, clientConvId);
      } else {
        setMessages(conv.messages);
      }
    } catch (e) {
      handleSendMessage(`Show context and latest updates for ${client.name}`, clientConvId);
    }
  };

  const handleStartNewChat = () => {
    if (chatMode === "client" && activeClient) {
      const newId = `conv_client_${activeClient._id || activeClient.name.replace(/\s+/g, "_")}_${Date.now().toString(36)}`;
      setConversationId(newId);
      setMessages([]);
    } else {
      const newId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      setConversationId(newId);
      setMessages([]);
    }
  };

  const getClientColor = (c: any, index: number) => {
    if (c.brandProfile?.brandColors?.[0]) return c.brandProfile.brandColors[0];
    const type = (c.businessType || "").toLowerCase();
    if (type.includes("health") || type.includes("clinic") || type.includes("skin")) return "#38BDF8";
    if (type.includes("real") || type.includes("estate") || type.includes("villa")) return "#D97706";
    if (type.includes("tech") || type.includes("saas") || type.includes("ai")) return "#6366F1";
    if (type.includes("fashion") || type.includes("cloth") || type.includes("ecom")) return "#EC4899";
    if (type.includes("food") || type.includes("dine") || type.includes("restaurant")) return "#F59E0B";
    const palette = ["#38BDF8", "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#14B8A6"];
    return palette[index % palette.length];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#080C16] text-slate-100 overflow-hidden font-sans select-text">
      {/* TOP WORKSPACE NAVIGATION HEADER */}
      <header className="flex-shrink-0 bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-lg backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Mission Sidebar"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 font-bold text-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                Digitalness AI OS
                <span className="text-[10px] text-indigo-400 font-mono font-normal">v3.2</span>
              </h1>
              {chatMode === "client" && activeClient ? (
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] py-0 px-2 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  🏢 {activeClient.name}
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] py-0 px-2 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  🌐 Agency Global
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {chatMode === "client" && activeClient
                ? `Dedicated Client Workspace • Context-locked for ${activeClient.name}`
                : "Conversational Command & Autonomous Agency Intelligence"}
            </p>
          </div>
        </div>

        {/* TAB SWITCHER & CONTROLS */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === "chat"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> AI Copilot
            </button>
            <button
              onClick={() => setActiveTab("automation")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === "automation"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
                }`}
            >
              <Cpu className="w-3.5 h-3.5" /> 24/7 Automation Hub
            </button>
          </div>

          {activeTab === "chat" && (
            <Button
              size="sm"
              onClick={handleStartNewChat}
              className="h-8 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3 h-3 text-indigo-400" /> New Thread
            </Button>
          )}
        </div>
      </header>

      {/* 7-STAGE GOVERNANCE LIFECYCLE STRIP */}
      {activeTab === "chat" && (
        <div className="flex-shrink-0 bg-slate-950 px-4 py-2 border-b border-slate-800/80 shadow-md flex items-center justify-between gap-4 overflow-x-auto text-[11px] font-semibold z-10">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-max">
            {[
              { id: 1, label: "1. Intent Router", match: ["IDLE"] },
              { id: 2, label: "2. Customer 360", match: ["AWAITING_ENTITY"] },
              { id: 3, label: "3. Strategy Intake", match: ["COLLECTING_INPUT"] },
              { id: 4, label: "4. Gate 1 Blueprint", match: ["AWAITING_APPROVAL"] },
              { id: 5, label: "5. QA Guardian", match: ["QA_CHECK", "AWAITING_APPROVAL"] },
              { id: 6, label: "6. Gate 2 Sign-off", match: ["GATE_2", "AWAITING_APPROVAL"] },
              { id: 7, label: "7. Live / Deployed", match: ["COMPLETED"] },
            ].map((step, idx) => {
              const lastMsg = messages[messages.length - 1];
              const lastState = lastMsg?.state || "IDLE";
              const isActive = step.match.includes(lastState);
              const isPassed =
                lastState === "COMPLETED" ||
                (lastState === "AWAITING_APPROVAL" && step.id <= 4) ||
                (lastState === "COLLECTING_INPUT" && step.id <= 3) ||
                (lastState === "AWAITING_ENTITY" && step.id <= 2);

              return (
                <div key={step.id} className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${isActive
                      ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-extrabold animate-pulse"
                      : isPassed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-900 text-slate-500 border border-slate-800"
                      }`}
                  >
                    {step.label}
                  </span>
                  {idx < 6 && <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-400 flex-shrink-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              16 Agents Online
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-bold">🛡️ Two-Gate Approval Protocol Active</span>
          </div>
        </div>
      )}

      {/* WORKSPACE MAIN BODY: SIDEBAR + CONTENT */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* COLLAPSIBLE MISSIONS & CLIENT CONTEXT SIDEBAR */}
        {activeTab === "chat" && isSidebarOpen && (
          <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col min-h-0 flex-shrink-0 z-10 backdrop-blur-xl">
            {/* 1. GLOBAL AGENCY CHAT SELECTOR */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agency Mode</span>
              </div>
              <button
                onClick={handleSelectAgencyChat}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border ${chatMode === "agency"
                  ? "bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border-indigo-500/50 text-white shadow-sm"
                  : "hover:bg-slate-900 border-transparent text-slate-300 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                    🌐
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">Agency Orchestrator</div>
                    <div className="text-[10px] text-indigo-300/80 truncate">Global Multi-Client Feed</div>
                  </div>
                </div>
                {chatMode === "agency" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                )}
              </button>
            </div>

            {/* 2. DEDICATED CLIENT WORKSPACES (DYNAMIC CRM ROSTER) */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Client Workspaces
                </span>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] px-1.5 py-0 font-bold">
                  {liveCustomers.length} Live
                </Badge>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {liveCustomers.map((c, i) => {
                  const isSelected = chatMode === "client" && (activeClient?._id === c._id || activeClient?.name === c.name);
                  const color = getClientColor(c, i);
                  return (
                    <button
                      key={c._id || i}
                      onClick={() => handleSelectClientChat(c)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between group border ${isSelected
                        ? "bg-slate-900 border-indigo-500/40 text-white shadow-sm"
                        : "hover:bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${isSelected ? "text-indigo-200" : "text-slate-300 group-hover:text-white"}`}>
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{c.businessType || c.industry || "Client"}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-800 text-slate-400 flex-shrink-0">
                        {c.monthlyRetainer ? "Retainer" : "Active"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. MISSIONS & THREADS HISTORY */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mission Threads</span>
              </div>
              {recentConversations.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No previous missions recorded. Start typing below!
                </div>
              ) : (
                recentConversations.map((conv, idx) => (
                  <div
                    key={conv.conversationId || idx}
                    onClick={() => {
                      setConversationId(conv.conversationId);
                      setMessages(conv.messages || []);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between group border ${conversationId === conv.conversationId
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-200"
                      : "hover:bg-slate-900 border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 group-hover:text-indigo-400" />
                      <span className="truncate font-semibold">
                        {conv.title || `Mission ${conv.conversationId.substring(0, 8)}...`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationApi(conv.conversationId).then(() => {
                          setRecentConversations((prev) => prev.filter((c) => c.conversationId !== conv.conversationId));
                          if (conversationId === conv.conversationId) handleStartNewChat();
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* SIDEBAR FOOTER AGENT ORCHESTRATION */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="font-semibold text-slate-300">Hybrid Engine</span>
              </div>
              <span className="text-slate-500 font-mono">GPT-4o-mini</span>
            </div>
          </aside>
        )}

        {/* MAIN CHAT / AUTOMATION VIEW */}
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0A0E1A] relative">
            {/* DEDICATED CLIENT HUD BAR (WHEN IN CLIENT WORKSPACE MODE) */}
            {chatMode === "client" && activeClient && (
              <div className="flex-shrink-0 bg-slate-950/90 border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    {activeClient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-xs tracking-tight">{activeClient.name}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1.5">
                        ● Context Locked
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {activeClient.businessType || "Healthcare / Skincare"} • {activeClient.city || "Hyderabad"}
                    </p>
                  </div>
                </div>

                {/* 1-CLICK CLIENT QUICK ACTION PILLS */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {[
                    { label: "🎨 Poster", prompt: `Create a promotional poster for ${activeClient.name}` },
                    { label: "🎬 30s Reel", prompt: `Create a 30-second Instagram reel script for ${activeClient.name}` },
                    { label: "📅 Calendar", prompt: `Generate 30-day content calendar for ${activeClient.name}` },
                    { label: "📣 Meta Ads", prompt: `Launch Meta lead generation ad campaign for ${activeClient.name}` },
                    { label: "📋 Client 360", prompt: `Show context and latest updates for ${activeClient.name}` },
                  ].map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(pill.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all flex-shrink-0"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SCROLLABLE CHAT TIMELINE */}
            <AIChatTimeline
              messages={messages}
              loading={loading}
              onSelectEntity={handleSelectEntity}
              onSubmitIntake={handleSubmitIntake}
              onApproveBlueprint={handleApproveBlueprint}
              onCreativeRevision={handleCreativeRevision}
              onCreativeSchedule={handleCreativeSchedule}
              onSelectPrompt={handleSendMessage}
              onSendMessage={handleSendMessage}
            />

            {/* FIXED BOTTOM COMPOSER */}
            <div className="flex-shrink-0">
              <AIComposer onSendMessage={handleSendMessage} loading={loading} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full bg-[#0A0E1A]">
            <AutomationCenter />
          </div>
        )}
      </div>
    </div>
  );
}
