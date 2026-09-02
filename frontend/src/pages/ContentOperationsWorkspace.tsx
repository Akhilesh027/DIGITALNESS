import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Send,
  Zap,
  Tag,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDailyOperations,
  getCalendarItems,
  getCalendarCampaigns,
  getCalendarGaps,
  rescheduleCalendarItem,
  MarketingCalendarItemDTO,
  DailyOperationsDTO,
} from "@/api/calendarApi";
import { getCustomers } from "@/api/customerApi";

export const ContentOperationsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"today" | "week" | "month" | "campaigns">("today");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

  const [dailyOps, setDailyOps] = useState<DailyOperationsDTO | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketingCalendarItemDTO | null>(null);
  const [loading, setLoading] = useState(false);

  // Load clients
  useEffect(() => {
    getCustomers().then((res) => {
      if (Array.isArray(res)) setCustomers(res);
    });
  }, []);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCustomerId !== "all") params.customerId = selectedCustomerId;
      if (selectedLocationId !== "all") params.locationId = selectedLocationId;

      if (activeTab === "today") {
        const res = await getDailyOperations(params);
        if (res.success) {
          setDailyOps(res);
        }
      } else if (activeTab === "campaigns") {
        const res = await getCalendarCampaigns(params);
        if (res.success) {
          setCampaigns(res.campaigns || []);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load operations calendar.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCustomerId, selectedLocationId]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "INSTAGRAM":
        return "bg-pink-950 text-pink-300 border-pink-800";
      case "FACEBOOK":
        return "bg-blue-950 text-blue-300 border-blue-800";
      case "GOOGLE_BUSINESS":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "META_ADS":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "GOOGLE_ADS":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-950 text-slate-100 p-4 space-y-4 overflow-hidden">
      {/* Header & Multi-Client Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-lg shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" /> Marketing & Campaign Operations Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Multi-client daily operations, execution readiness, creative pinning, and R2/R3 approval visibility.
          </p>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Client Filter */}
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">🏢 All Clients</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name || c.companyName}
              </option>
            ))}
          </select>

          {/* Tab Switcher */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
            {[
              { id: "today", label: "📋 Today's Operations" },
              { id: "campaigns", label: "🚀 Campaign Groups" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOperations}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Operations Board */}
      <div className="flex-1 min-h-0 overflow-hidden flex gap-4">
        {activeTab === "today" ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3 overflow-y-auto pb-4">
            {/* Lane 1: OVERDUE */}
            <div className="bg-slate-900/90 border border-rose-900/60 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  {dailyOps?.lanes?.OVERDUE?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.OVERDUE?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/50 hover:border-rose-500 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name || "Client"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 2: NEEDS CREATIVE */}
            <div className="bg-slate-900/90 border border-amber-900/60 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Needs Creative
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {dailyOps?.lanes?.NEEDS_CREATIVE?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.NEEDS_CREATIVE?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-amber-900/50 hover:border-amber-500 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 3: NEEDS APPROVAL */}
            <div className="bg-slate-900/90 border border-amber-800/60 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-amber-800/40">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Needs Approval
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-700">
                  {dailyOps?.lanes?.NEEDS_APPROVAL?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.NEEDS_APPROVAL?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-amber-800/50 hover:border-amber-400 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 4: READY */}
            <div className="bg-slate-900/90 border border-emerald-900/60 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ready
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {dailyOps?.lanes?.READY?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.READY?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/50 hover:border-emerald-500 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 5: SCHEDULED */}
            <div className="bg-slate-900/90 border border-indigo-900/60 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-900/40">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Scheduled
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {dailyOps?.lanes?.SCHEDULED?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.SCHEDULED?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-indigo-900/50 hover:border-indigo-500 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{item.customerId?.name}</span>
                      <span>{new Date(item.scheduledStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 6: PUBLISHED */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Published
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {dailyOps?.lanes?.PUBLISHED?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.PUBLISHED?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-1 opacity-80"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane 7: FAILED */}
            <div className="bg-slate-900/90 border border-rose-950 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-rose-950">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Failed
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-900">
                  {dailyOps?.lanes?.FAILED?.length || 0}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {dailyOps?.lanes?.FAILED?.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/60 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="font-semibold text-rose-300 line-clamp-1">{item.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getChannelColor(item.channel)}`}>
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.customerId?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Campaigns Group View */
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp: any) => (
              <div key={camp.group._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{camp.group.name}</h3>
                    <p className="text-xs text-slate-400">{camp.group.customerId?.name || "Client"}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {camp.group.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Campaign Milestone Completion</span>
                    <span className="font-bold text-emerald-400">{camp.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${camp.progressPercent}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <p className="text-slate-400">Deliverables</p>
                    <p className="font-bold text-slate-200">{camp.totalDeliverables}</p>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <p className="text-slate-400">Completed</p>
                    <p className="font-bold text-emerald-400">{camp.completedCount}</p>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <p className="text-slate-400">Blocked / Review</p>
                    <p className="font-bold text-amber-400">{camp.blockedCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Item Detail Slide-over Panel */}
        {selectedItem && (
          <div className="w-96 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 overflow-y-auto shadow-2xl shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-200">Operation Details</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-200 text-xs">
                ✕ Close
              </button>
            </div>

            <div className="space-y-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getChannelColor(selectedItem.channel)}`}>
                {selectedItem.channel}
              </span>
              <h4 className="font-semibold text-base text-slate-100">{selectedItem.title}</h4>
              <p className="text-xs text-slate-400">
                {selectedItem.customerId?.name} ({selectedItem.locationId?.name || "Main Branch"})
              </p>
            </div>

            {/* Creative Thumbnail with Version Badge */}
            {selectedItem.creativeAssetId && (
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Attached Creative</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800">
                    Version V{selectedItem.pinnedCreativeVersion || 1}
                  </span>
                </div>
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedItem.creativeAssetId.assetUrl || selectedItem.creativeAssetId.previewUrl}
                    alt="Creative Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Caption */}
            {selectedItem.caption && (
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-400">Caption / Copy</p>
                <p className="text-xs text-slate-200 whitespace-pre-wrap">{selectedItem.caption}</p>
              </div>
            )}

            {/* Readiness & Blockers */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Execution Readiness</span>
                <span className="font-bold text-emerald-400">{selectedItem.readinessScorePercent || 0}%</span>
              </div>

              {selectedItem.blockers?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-semibold text-amber-400">Active Blockers ({selectedItem.blockers.length}):</p>
                  {selectedItem.blockers.map((b, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-amber-950/40 border border-amber-900 text-[10px] text-amber-200">
                      ⚠ {b.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule & Timezone */}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span>Scheduled For:</span>
                <span className="font-medium text-slate-200">
                  {new Date(selectedItem.scheduledStartAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timezone:</span>
                <span className="font-medium text-slate-200">{selectedItem.timezone}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentOperationsWorkspace;
