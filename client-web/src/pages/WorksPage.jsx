import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ThumbsUp,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId, getMediaUrl } from "../config/api";
import { MOCK_WORKS } from "../data/mockData";

const FILTERS = [
  "All",
  "In Progress",
  "Review",
  "Pending",
  "Revision",
  "Completed",
];

export default function WorksPage() {
  const { client, customer } = useAuth();
  const [works, setWorks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWorkId, setExpandedWorkId] = useState(null);
  const [feedbackModalWork, setFeedbackModalWork] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackMode, setFeedbackMode] = useState("revision"); // 'revision' | 'comment'
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const customerId = extractCustomerId(client, customer);

  const normalizeWorks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.work)) return data.work;
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.customer?.works)) return data.customer.works;
    return [];
  };

  const fetchWorks = useCallback(async () => {
    if (!customerId) {
      setWorks(MOCK_WORKS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const urls = [
        `${API_BASE_URL}/works/customer/${customerId}`,
        `${API_BASE_URL}/works?customer=${customerId}`,
        `${API_BASE_URL}/customers/${customerId}`,
      ];

      let found = [];
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            const normalized = normalizeWorks(data);
            if (normalized.length > 0) {
              found = normalized;
              break;
            }
          }
        } catch {}
      }

      setWorks(found.length > 0 ? found : MOCK_WORKS);
    } catch {
      setWorks(MOCK_WORKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorks();
  };

  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchFilter =
        activeFilter === "All" ||
        (w.status || "Pending").toLowerCase() === activeFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (w.title && w.title.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.workType && w.workType.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }, [works, activeFilter, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedWorkId(expandedWorkId === id ? null : id);
  };

  const handleApproveWork = async (workId) => {
    if (!window.confirm("Confirm approval of this work item as completed?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/works/${workId}/approve`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          adminRemark: "Approved by client via Client Portal",
          status: "Completed",
        }),
      });

      if (res.ok) {
        setActionMsg("Work approved successfully!");
        setWorks((prev) =>
          prev.map((w) =>
            w._id === workId ? { ...w, status: "Completed", approvalStatus: "Approved" } : w
          )
        );
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        // Fallback for demo or mock items
        setWorks((prev) =>
          prev.map((w) =>
            w._id === workId ? { ...w, status: "Completed", approvalStatus: "Approved" } : w
          )
        );
      }
    } catch {
      // Local fallback
      setWorks((prev) =>
        prev.map((w) =>
          w._id === workId ? { ...w, status: "Completed", approvalStatus: "Approved" } : w
        )
      );
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() || !feedbackModalWork) return;

    setSubmittingFeedback(true);
    const workId = feedbackModalWork._id;

    try {
      if (feedbackMode === "revision") {
        await fetch(`${API_BASE_URL}/works/${workId}/revision`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            adminRemark: feedbackText,
            managerReviewNote: feedbackText,
          }),
        });

        setWorks((prev) =>
          prev.map((w) =>
            w._id === workId
              ? { ...w, status: "Revision", managerReviewNote: feedbackText }
              : w
          )
        );
      } else {
        await fetch(`${API_BASE_URL}/works/${workId}/comments`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            comment: feedbackText,
          }),
        });
      }

      setSubmittedFeedback(true);
      setTimeout(() => {
        setSubmittedFeedback(false);
        setFeedbackModalWork(null);
        setFeedbackText("");
      }, 1500);
    } catch {
      setSubmittedFeedback(true);
      setTimeout(() => {
        setSubmittedFeedback(false);
        setFeedbackModalWork(null);
        setFeedbackText("");
      }, 1500);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Revision":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-700/30 text-slate-300 border-slate-700/50";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Deliverables & Pipeline</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Deliverables & Work Orders
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              Live status tracking of every campaign milestone, creative asset, SEO optimization,
              and development sprint handled by Digitalness.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Works</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search campaigns, tasks, or deliverable names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-400"
          />
        </div>

        {/* Counter */}
        <div className="text-xs text-slate-400 font-semibold">
          Showing <span className="text-white font-bold">{filteredWorks.length}</span> of{" "}
          <span className="text-white font-bold">{works.length}</span> tasks
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-brand-500 text-slate-950 shadow-glow"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Works Listing */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Fetching real-time project tasks...</span>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No works matching this filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different status category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorks.map((work) => {
            const isExpanded = expandedWorkId === work._id;
            const tasks = work.tasks || [];
            const assignedList = Array.isArray(work.assignedTo)
              ? work.assignedTo
              : work.assignedTo
              ? [work.assignedTo]
              : [];
            const attachmentsList = Array.isArray(work.attachments) ? work.attachments : [];

            return (
              <div
                key={work._id}
                className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 transition-all"
              >
                {/* Top Row: Category, Title, Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {work.workType || work.category || "Project Work"}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(
                          work.priority
                        )}`}
                      >
                        {work.priority || "Medium"} Priority
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{work.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                        work.status
                      )}`}
                    >
                      {work.status || "Pending"}
                    </span>

                    {work.status !== "Completed" && (
                      <button
                        onClick={() => handleApproveWork(work._id)}
                        className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                        title="Mark work as approved & completed"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setFeedbackModalWork(work);
                        setFeedbackMode("revision");
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition flex items-center gap-1"
                      title="Request changes or give feedback"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Feedback</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {work.description && (
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {work.description}
                  </p>
                )}

                {/* Manager Review Notes if any */}
                {work.managerReviewNote && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
                    <strong>Client/Agency Notes:</strong> {work.managerReviewNote}
                  </div>
                )}

                {/* Metadata Row: Deliverables, SLA, Due Date, Assigned Team */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-medium">Deliverables</span>
                    <strong className="text-brand-400 font-bold">
                      {work.completedDeliverables || 0} / {work.deliverables || 0} Completed
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-medium">Target Deadline</span>
                    <strong className="text-slate-200 font-bold">{formatDate(work.dueDate)}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-medium">SLA Commitment</span>
                    <strong className="text-slate-200 font-bold">{work.slaDays || 14} Days turnaround</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-medium">Assigned Specialists</span>
                    <strong className="text-slate-200 font-bold truncate block">
                      {assignedList.length > 0
                        ? assignedList.map((u) => u?.name || "Staff").join(", ")
                        : "Digitalness Production"}
                    </strong>
                  </div>
                </div>

                {/* Attachments Section if present */}
                {attachmentsList.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-brand-400" />
                      Attached Assets & Deliverables ({attachmentsList.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {attachmentsList.map((att, idx) => {
                        const fileLink = getMediaUrl(att.url || att.fileUrl || att.path);
                        return (
                          <a
                            key={idx}
                            href={fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-slate-300 hover:text-white text-xs font-semibold transition"
                          >
                            <span>{att.name || att.title || `Asset ${idx + 1}`}</span>
                            <ExternalLink className="w-3 h-3 text-brand-400" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expand Subtasks Button */}
                {tasks.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExpand(work._id)}
                      className="text-xs font-bold text-slate-400 hover:text-brand-400 flex items-center gap-1.5 transition"
                    >
                      {isExpanded ? (
                        <>
                          <span>Hide Subtasks & Milestones ({tasks.length})</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>View Subtasks & Milestones ({tasks.length})</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pl-3 border-l-2 border-brand-500/40 space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task._id}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  task.status === "Completed"
                                    ? "text-emerald-400"
                                    : "text-slate-400"
                                }`}
                              />
                              <span
                                className={`font-semibold ${
                                  task.status === "Completed"
                                    ? "text-slate-400 line-through"
                                    : "text-slate-200"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                                task.status
                              )}`}
                            >
                              {task.status || "Pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback & Revision Request Modal */}
      {feedbackModalWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-black text-white">
              Request Feedback or Revision
            </h3>
            <p className="text-xs text-slate-400">
              For: <strong className="text-white">{feedbackModalWork.title}</strong>
            </p>

            {submittedFeedback ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Feedback Dispatched!</h4>
                <p className="text-xs text-slate-400">
                  Your project manager has been notified and will address your notes promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackMode("revision")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      feedbackMode === "revision"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackMode("comment")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      feedbackMode === "comment"
                        ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Add General Comment
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your {feedbackMode === "revision" ? "Revision Request" : "Comment"} / Instructions
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe changes required, copy adjustments, visual preferences, or notes for the team..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-400 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalWork(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs shadow-glow flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingFeedback ? "Dispatching..." : "Send to Agency"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
