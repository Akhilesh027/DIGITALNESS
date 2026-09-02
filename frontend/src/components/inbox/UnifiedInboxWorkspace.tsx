import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Star,
  Flame,
  AlertTriangle,
  Clock,
  UserCheck,
  Search,
  Send,
  StickyNote,
  Bot,
  User,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInboxItems,
  getInboxMetrics,
  getInboxItemDetail,
  assignInboxItem,
  unassignInboxItem,
  updateInboxItemStatus,
  addInboxInternalNote,
  takeOverInboxConversation,
  resumeInboxAutomation,
  generateInboxAIDraft,
  InboxItemDTO,
  InboxMetricsDTO,
} from "@/api/inboxApi";
import { getEmployees } from "@/api/employeeApi";
import { sendWhatsAppOutboundMessage, getWhatsAppTemplates, WhatsAppTemplateItem } from "@/api/whatsappApi";

export const UnifiedInboxWorkspace: React.FC = () => {
  const [items, setItems] = useState<InboxItemDTO[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItemDTO | null>(null);
  const [itemDetail, setItemDetail] = useState<any>(null);
  const [metrics, setMetrics] = useState<InboxMetricsDTO | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Composer state
  const [composerTab, setComposerTab] = useState<"reply" | "note">("reply");
  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  // Load metrics and list
  const fetchInboxData = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams: any = {};
      if (searchQuery) filterParams.search = searchQuery;

      if (activeFilter === "mine") filterParams.assignedTo = "me";
      else if (activeFilter === "unassigned") filterParams.assignedTo = "unassigned";
      else if (activeFilter === "whatsapp") filterParams.channel = "WHATSAPP";
      else if (activeFilter === "reviews") filterParams.channel = "GOOGLE_BUSINESS";
      else if (activeFilter === "at_risk") filterParams.slaStatus = "AT_RISK";
      else if (activeFilter === "breached") filterParams.slaStatus = "BREACHED";

      const [itemsRes, metricsRes] = await Promise.all([
        getInboxItems(filterParams),
        getInboxMetrics(),
      ]);

      if (itemsRes.success) {
        setItems(itemsRes.items || []);
        if (itemsRes.items?.length > 0 && !selectedItem) {
          handleSelectItem(itemsRes.items[0]);
        }
      }

      if (metricsRes.success) {
        setMetrics(metricsRes.metrics);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load inbox data.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery, selectedItem]);

  useEffect(() => {
    fetchInboxData();
  }, [activeFilter]);

  useEffect(() => {
    getEmployees().then((res) => {
      if (res?.employees) setEmployees(res.employees);
    });
  }, []);

  const handleSelectItem = async (item: InboxItemDTO) => {
    setSelectedItem(item);
    setDetailLoading(true);
    try {
      const detailRes = await getInboxItemDetail(item._id);
      if (detailRes.success) {
        setItemDetail(detailRes);
      }
      if (item.channel === "WHATSAPP") {
        getWhatsAppTemplates().then((tpl) => setTemplates(tpl.templates || []));
      }
    } catch (err: any) {
      toast.error("Failed to load item detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedItem) return;
    if (!replyText.trim() && !selectedTemplate) {
      toast.error("Please enter a reply or select an approved template.");
      return;
    }

    try {
      if (selectedItem.channel === "WHATSAPP") {
        const payload: any = {
          conversationId: selectedItem.sourceId,
        };
        if (selectedTemplate) {
          payload.messageType = "TEMPLATE";
          payload.templateName = selectedTemplate;
        } else {
          payload.messageType = "TEXT";
          payload.text = replyText;
        }

        const res = await sendWhatsAppOutboundMessage(payload);
        if (res.success) {
          toast.success("Reply dispatched successfully.");
          setReplyText("");
          setSelectedTemplate("");
          handleSelectItem(selectedItem);
        } else {
          toast.error(res.message || "Failed to send message.");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Send failed.");
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedItem || !internalNoteText.trim()) {
      toast.error("Note cannot be empty.");
      return;
    }

    try {
      const res = await addInboxInternalNote(selectedItem._id, { body: internalNoteText });
      if (res.success) {
        toast.success("Internal note saved.");
        setInternalNoteText("");
        handleSelectItem(selectedItem);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add note.");
    }
  };

  const handleTakeover = async () => {
    if (!selectedItem) return;
    try {
      const res = await takeOverInboxConversation(selectedItem._id);
      if (res.success) {
        toast.success("Conversation taken over by you.");
        handleSelectItem(selectedItem);
        fetchInboxData();
      }
    } catch (err: any) {
      toast.error(err.message || "Takeover failed.");
    }
  };

  const handleResumeAutomation = async () => {
    if (!selectedItem) return;
    try {
      const res = await resumeInboxAutomation(selectedItem._id);
      if (res.success) {
        toast.success("Automated bots resumed.");
        handleSelectItem(selectedItem);
        fetchInboxData();
      }
    } catch (err: any) {
      toast.error(err.message || "Resume failed.");
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!selectedItem) return;
    setAiDraftLoading(true);
    try {
      const res = await generateInboxAIDraft(selectedItem._id);
      if (res.success && res.suggestedDraft) {
        setReplyText(res.suggestedDraft);
        setComposerTab("reply");
        toast.success("AI draft generated & placed in composer.");
      }
    } catch (err: any) {
      toast.error("Failed to generate AI draft.");
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleAssignChange = async (userId: string) => {
    if (!selectedItem) return;
    try {
      if (userId === "unassigned") {
        await unassignInboxItem(selectedItem._id);
        toast.success("Item unassigned.");
      } else {
        await assignInboxItem(selectedItem._id, { assignedTo: userId });
        toast.success("Item assigned.");
      }
      fetchInboxData();
      handleSelectItem(selectedItem);
    } catch (err: any) {
      toast.error("Assignment failed.");
    }
  };

  const handleResolve = async () => {
    if (!selectedItem) return;
    try {
      await updateInboxItemStatus(selectedItem._id, "RESOLVED");
      toast.success("Inbox item marked as Resolved.");
      fetchInboxData();
    } catch (err: any) {
      toast.error("Failed to resolve item.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 p-4 space-y-4">
      {/* Top SLA & Status Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveFilter("breached")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "breached" ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50" : "bg-slate-900 border-slate-800 hover:border-rose-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-rose-400">SLA BREACHED</p>
            <p className="text-2xl font-bold text-rose-200">{metrics?.slaBreachedCount ?? 0}</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </button>

        <button
          onClick={() => setActiveFilter("at_risk")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "at_risk" ? "bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/50" : "bg-slate-900 border-slate-800 hover:border-amber-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-400">AT RISK</p>
            <p className="text-2xl font-bold text-amber-200">{metrics?.atRiskCount ?? 0}</p>
          </div>
          <Clock className="w-5 h-5 text-amber-500" />
        </button>

        <button
          onClick={() => setActiveFilter("whatsapp")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "whatsapp" ? "bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50" : "bg-slate-900 border-slate-800 hover:border-emerald-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-400">WHATSAPP</p>
            <p className="text-2xl font-bold text-emerald-200">{metrics?.whatsAppCount ?? 0}</p>
          </div>
          <MessageSquare className="w-5 h-5 text-emerald-500" />
        </button>

        <button
          onClick={() => setActiveFilter("reviews")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "reviews" ? "bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/50" : "bg-slate-900 border-slate-800 hover:border-amber-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-300">GOOGLE REVIEWS</p>
            <p className="text-2xl font-bold text-amber-100">{metrics?.reviewsCount ?? 0}</p>
          </div>
          <Star className="w-5 h-5 text-amber-400" />
        </button>

        <button
          onClick={() => setActiveFilter("all")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "all" ? "bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50" : "bg-slate-900 border-slate-800 hover:border-indigo-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-indigo-400">TOTAL OPEN</p>
            <p className="text-2xl font-bold text-indigo-200">{metrics?.totalOpen ?? 0}</p>
          </div>
          <Zap className="w-5 h-5 text-indigo-400" />
        </button>

        <button
          onClick={() => setActiveFilter("unassigned")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
            activeFilter === "unassigned" ? "bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/50" : "bg-slate-900 border-slate-800 hover:border-purple-900"
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-purple-400">UNASSIGNED</p>
            <p className="text-2xl font-bold text-purple-200">{metrics?.unassignedCount ?? 0}</p>
          </div>
          <UserCheck className="w-5 h-5 text-purple-400" />
        </button>
      </div>

      {/* Main 3-Pane Workspace */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* LEFT PANE: Conversation & Review List */}
        <div className="col-span-12 md:col-span-4 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {/* Search and Filters */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search leads, phone, review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInboxData()}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
              {["all", "mine", "unassigned", "whatsapp", "reviews"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition ${
                    activeFilter === f ? "bg-indigo-600 text-white font-medium" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading conversations...
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No conversations matching filter.</div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?._id === item._id;
                const isBreached = item.liveSlaStatus === "BREACHED" || item.slaStatus === "BREACHED";
                const isAtRisk = item.liveSlaStatus === "AT_RISK" || item.slaStatus === "AT_RISK";

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected ? "bg-indigo-950/40 border-l-4 border-indigo-500" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          {item.customerId?.name?.substring(0, 2).toUpperCase() || "DG"}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-sm text-slate-200">
                              {item.participantName || item.title || "Inbound Lead"}
                            </span>
                            {item.unread && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {item.customerId?.name || "Client"} • {item.locationId?.name || "Main Branch"}
                          </span>
                        </div>
                      </div>

                      {/* SLA badge */}
                      {isBreached ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          BREACHED
                        </span>
                      ) : isAtRisk ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          AT RISK
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.lastActivityAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 mt-1.5">{item.snippet || "No message snippet"}</p>

                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-slate-500 capitalize">{item.channel.toLowerCase().replace("_", " ")}</span>
                      <span className="text-slate-400">
                        {item.assignedTo ? `👤 ${item.assignedTo.name}` : "⚠️ Unassigned"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER PANE: Active Conversation / Review Timeline & Dual Composer */}
        <div className="col-span-12 md:col-span-5 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {selectedItem ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-slate-200">
                      {selectedItem.participantName || selectedItem.title}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {selectedItem.channel}
                    </span>
                    {selectedItem.priority === "HIGH" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800">
                        🔥 High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedItem.customerId?.name} ({selectedItem.locationId?.name || "Ameenpur"}) •{" "}
                    {selectedItem.participantPhone || "WhatsApp Lead"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResolve}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition"
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* Timeline Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading transcript...
                  </div>
                ) : itemDetail?.timeline?.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-12">No messages recorded in this timeline.</div>
                ) : (
                  itemDetail?.timeline?.map((event: any) => {
                    const isInternalNote = event.type === "INTERNAL_NOTE";
                    const isCustomer = event.type === "CUSTOMER_MESSAGE" || event.type === "CUSTOMER_REVIEW";

                    if (isInternalNote) {
                      return (
                        <div key={event.id} className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 my-2">
                          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              <StickyNote className="w-3.5 h-3.5" /> Internal Note by {event.author} ({event.authorRole || "Team"})
                            </span>
                            <span className="text-[10px] text-amber-400/80">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-amber-100">{event.text}</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={event.id}
                        className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-3 text-xs shadow-sm ${
                            isCustomer
                              ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60"
                              : "bg-indigo-600 text-white rounded-tr-none"
                          }`}
                        >
                          {event.starRating && (
                            <div className="flex text-amber-400 mb-1">
                              {Array.from({ length: event.starRating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{event.text || event.comment}</p>
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                              isCustomer ? "text-slate-400" : "text-indigo-200"
                            }`}
                          >
                            <span>
                              {new Date(event.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!isCustomer && <span>• {event.status || "SENT"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dual Tab Composer */}
              <div className="border-t border-slate-800 bg-slate-900 p-3 space-y-2">
                <div className="flex border-b border-slate-800 pb-2 gap-2 text-xs">
                  <button
                    onClick={() => setComposerTab("reply")}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      composerTab === "reply" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Reply to Customer
                  </button>
                  <button
                    onClick={() => setComposerTab("note")}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      composerTab === "note" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📝 Internal Note
                  </button>
                </div>

                {composerTab === "reply" ? (
                  <div className="space-y-2">
                    {/* Template picker if WhatsApp */}
                    {selectedItem.channel === "WHATSAPP" && templates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 flex-1"
                        >
                          <option value="">-- Or Select Approved Meta Template --</option>
                          {templates.map((t) => (
                            <option key={t.templateName} value={t.templateName}>
                              {t.templateName} ({t.category})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder="Type customer reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleSendReply}
                        className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder="Add internal note (visible ONLY to team, NEVER sent to customer)..."
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        className="flex-1 bg-amber-950/20 border border-amber-800/80 rounded-lg p-2 text-xs text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleAddInternalNote}
                        className="px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center justify-center text-xs font-semibold transition"
                      >
                        Post Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a conversation to view details.
            </div>
          )}
        </div>

        {/* RIGHT PANE: Lead Operations, Assignee & AI Assist */}
        <div className="col-span-12 md:col-span-3 flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-4 overflow-y-auto">
          {selectedItem ? (
            <>
              {/* Assignment & Status Control */}
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Owner</label>
                <select
                  value={selectedItem.assignedTo?._id || "unassigned"}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="unassigned">⚠️ Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleTakeover}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-semibold hover:bg-indigo-900 transition flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Take Over
                  </button>
                  <button
                    onClick={handleResumeAutomation}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resume Bot
                  </button>
                </div>
              </div>

              {/* Lead Operations & Pipeline Card */}
              <div className="space-y-2 pb-3 border-b border-slate-800 text-xs">
                <p className="font-semibold text-slate-400 uppercase tracking-wider">Lead Intelligence</p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lead Score:</span>
                    <span className="font-bold text-emerald-400">78 / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Intent:</span>
                    <span className="font-medium text-slate-200">PRICE_INQUIRY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stage:</span>
                    <span className="font-medium text-indigo-400">Qualifying</span>
                  </div>
                </div>
              </div>

              {/* AI Assist Panel */}
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Assist Panel
                  </p>
                  <button
                    onClick={handleGenerateAIDraft}
                    disabled={aiDraftLoading}
                    className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center gap-1"
                  >
                    {aiDraftLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                    Generate Draft
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                  <p className="text-slate-400 italic">
                    AI analysis provides suggested replies and summaries without autonomous customer transmission.
                  </p>
                </div>
              </div>

              {/* SLA Breakdown Clock */}
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-400 uppercase tracking-wider">SLA Target Breakdown</p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">First Response Target:</span>
                    <span className="text-slate-200 font-medium">30 Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    <span
                      className={`font-bold ${
                        selectedItem.slaStatus === "BREACHED"
                          ? "text-rose-400"
                          : selectedItem.slaStatus === "AT_RISK"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedItem.slaStatus}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">Select an item to view lead operations.</div>
          )}
        </div>
      </div>
    </div>
  );
};
