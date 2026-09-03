import { useEffect, useState } from "react";
import {
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  XCircle,
  Calendar,
  Layers,
  Building2,
  Eye,
  Share2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Palette,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  LayoutGrid,
  List,
  ThumbsUp,
  MessageSquare,
  Globe,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreativePosterCanvas } from "@/components/ai/creative/CreativePosterCanvas";
import {
  getScheduledJobs,
  cancelScheduledJob,
  retryScheduledJob,
  getQueueHealth,
  reconcileQueue,
} from "../api/scheduledJobApi";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

export default function SchedulerPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [platformMock, setPlatformMock] = useState<"instagram" | "facebook">("instagram");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const [data, healthData] = await Promise.all([
        getScheduledJobs(params),
        getQueueHealth().catch(() => null),
      ]);
      setJobs(data);
      setHealth(healthData);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load scheduler jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      const res = await reconcileQueue();
      toast({ title: "Queue Reconciled", description: res.message });
      fetchJobs();
    } catch (err: any) {
      toast({
        title: "Reconciliation Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleCancelJob = async (id: string) => {
    try {
      await cancelScheduledJob(id);
      toast({
        title: "Cancelled",
        description: "Scheduled job cancelled successfully",
      });
      fetchJobs();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRetryJob = async (id: string) => {
    try {
      await retryScheduledJob(id);
      toast({
        title: "Retry Triggered",
        description: "Job retry attempt queued",
      });
      fetchJobs();
    } catch (err: any) {
      toast({
        title: "Retry Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionId(id);
    toast({ title: "Copied!", description: "Caption & hashtags copied to clipboard" });
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (job.customerId?.name || "").toLowerCase().includes(searchLower) ||
      (job.payload?.title || "").toLowerCase().includes(searchLower) ||
      (job.entityId?.title || "").toLowerCase().includes(searchLower) ||
      (job.entityId?.headline || "").toLowerCase().includes(searchLower) ||
      (job.jobType || "").toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const totalCount = jobs.length;
  const queuedCount = jobs.filter((j) => j.status === "Queued" || j.status === "Pending").length;
  const completedCount = jobs.filter((j) => j.status === "Completed").length;
  const failedCount = jobs.filter((j) => j.status === "Failed").length;

  const formatCountdown = (dateString: string) => {
    const target = new Date(dateString).getTime();
    const diff = target - Date.now();
    if (diff < 0) return "Due / Executed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `In ${days} day${days > 1 ? "s" : ""} (${hours % 24}h)`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
    const mins = Math.floor(diff / (1000 * 60));
    return `In ${mins} min${mins > 1 ? "s" : ""}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-indigo-600" /> Background Queue Scheduler & Publisher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed preview of delayed marketing posts, headlines, hashtags, and automated publish queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {health && (
            <Badge
              className={
                health.scheduler === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 text-xs font-semibold"
                  : "bg-amber-50 text-amber-800 border-amber-200 px-3 py-1.5 text-xs font-semibold"
              }
            >
              ● {health.scheduler === "available" ? "Online — Redis Queue Active" : "Fallback Mode — Database Queue"}
            </Badge>
          )}

          <Button
            onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/customers/seed-social-data`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                const data = await res.json();
                if (data.success) {
                  toast({
                    title: "✓ Demo Data Seeded",
                    description: "3 sample scheduled campaigns with 1080x1080 poster graphics added!",
                  });
                  fetchJobs();
                }
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            }}
            variant="outline"
            size="sm"
            className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Seed Sample Campaigns
          </Button>

          <Button
            onClick={handleReconcile}
            variant="outline"
            size="sm"
            className="gap-1 text-indigo-600 border-indigo-200 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reconcile Queue
          </Button>

          <Button onClick={fetchJobs} variant="outline" size="sm" className="gap-2 shadow-xs">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Scheduled Posts</span>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <span className="text-[11px] text-slate-400">All registered tasks</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-xs space-y-1">
          <span className="text-xs text-indigo-600 font-semibold">Active in Queue</span>
          <p className="text-2xl font-black text-indigo-700">{queuedCount}</p>
          <span className="text-[11px] text-indigo-500">Scheduled for future publish</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-xs space-y-1">
          <span className="text-xs text-emerald-600 font-semibold">Published & Live</span>
          <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
          <span className="text-[11px] text-emerald-500">Successfully published</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-100 shadow-xs space-y-1">
          <span className="text-xs text-rose-600 font-semibold">Failed / Retries</span>
          <p className="text-2xl font-black text-rose-700">{failedCount}</p>
          <span className="text-[11px] text-rose-500">Required review</span>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by client, headline, hashtags or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] text-xs">
                <SelectValue placeholder="Job Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({totalCount})</SelectItem>
                <SelectItem value="Queued">Queued ({queuedCount})</SelectItem>
                <SelectItem value="Completed">Completed ({completedCount})</SelectItem>
                <SelectItem value="Failed">Failed ({failedCount})</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode & Platform Preview Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {viewMode === "grid" && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setPlatformMock("instagram")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${platformMock === "instagram"
                  ? "bg-white text-pink-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Instagram Mockup
              </button>
              <button
                onClick={() => setPlatformMock("facebook")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${platformMock === "facebook"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Facebook Mockup
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2.5 text-xs gap-1 ${viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Post Previews
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              onClick={() => setViewMode("table")}
              className={`h-7 px-2.5 text-xs gap-1 ${viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              <List className="h-3.5 w-3.5" /> Table View
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="bg-white rounded-xl border p-16 text-center text-slate-500 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
          <p>Loading scheduled marketing jobs & visual feeds...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-slate-500 space-y-3">
          <Clock className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-800 text-base">No scheduled posts found matching criteria.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Generate an AI campaign in the Workspace or click "Seed Sample Campaigns" above to preview ready-to-post mockups.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* LIVE SOCIAL MEDIA FEED PREVIEW GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const content = typeof job.entityId === "object" && job.entityId !== null ? job.entityId : {};
            const title = job.payload?.title || content.title || "AI Campaign Post";
            const headline = content.headline || job.payload?.headline || title;
            const supportingCopy = content.supportingCopy || job.payload?.supportingCopy || "";
            const caption = content.caption || job.payload?.caption || "";
            const hashtags = (Array.isArray(content.hashtags) && content.hashtags.length > 0)
              ? content.hashtags
              : (Array.isArray(job.payload?.hashtags) && job.payload.hashtags.length > 0)
                ? job.payload.hashtags
                : (typeof job.payload?.hashtags === "string" ? job.payload.hashtags.split(/\s+/) : []);
            const platforms = content.platforms || job.payload?.platforms || ["Instagram", "Facebook"];
            const client = job.customerId || {};
            const location = job.clientLocationId || {};
            const posterImg =
              job.payload?.imageUrl ||
              content.mediaUrl ||
              content.imageUrl ||
              content.creativeProjectId?.versions?.[0]?.fileUrl ||
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop";

            const username = client.socialIntegrations?.instagram?.username || `@${(client.name || "brand").toLowerCase().replace(/\s+/g, "_")}`;
            const fbPageName = client.socialIntegrations?.facebook?.pageName || client.name || "Brand Official";

            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Post Card Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shrink-0">
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-bold text-slate-800 text-xs uppercase overflow-hidden">
                        {client.brandProfile?.logoUrl ? (
                          <img src={client.brandProfile.logoUrl} alt="Logo" className="h-full w-full object-contain p-0.5" />
                        ) : (
                          (client.name || "B").charAt(0)
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {platformMock === "instagram" ? username : fbPageName}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500 text-white shrink-0" />
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {location.name || "Flagship Location"} {location.city ? `• ${location.city}` : ""}
                      </span>
                    </div>
                  </div>

                  <Badge
                    className={
                      job.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                        : job.status === "Queued" || job.status === "Pending"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold"
                          : "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                    }
                  >
                    {job.status === "Queued" || job.status === "Pending" ? "Queued" : job.status}
                  </Badge>
                </div>

                {/* POSTER VISUAL MEDIA */}
                <div className="relative bg-slate-950 aspect-square w-full overflow-hidden group flex items-center justify-center">
                  {job.payload?.posterData ? (
                    <CreativePosterCanvas
                      {...job.payload.posterData}
                      brandName={client.name || "Brand"}
                      idPrefix={`sched_grid_${job._id}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <img
                      src={posterImg}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop";
                      }}
                    />
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {platforms.map((p: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-xs"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Scheduled Countdown Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-md text-white p-2 rounded-xl border border-white/10 flex items-center justify-between text-xs z-10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="font-semibold text-[11px]">
                        {new Date(job.scheduledFor).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {formatCountdown(job.scheduledFor)}
                    </span>
                  </div>
                </div>

                {/* SOCIAL INTERACTION BAR */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white text-slate-700">
                  {platformMock === "instagram" ? (
                    <div className="flex items-center gap-3.5">
                      <Heart className="h-4 w-4 hover:text-rose-500 cursor-pointer transition-colors" />
                      <MessageCircle className="h-4 w-4 hover:text-indigo-500 cursor-pointer transition-colors" />
                      <Send className="h-4 w-4 hover:text-blue-500 cursor-pointer transition-colors" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-blue-600" /> Like</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comment</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Share</span>
                    </div>
                  )}

                  <Bookmark className="h-4 w-4 text-slate-400 hover:text-slate-700 cursor-pointer" />
                </div>

                {/* POST BODY (HEADLINE, CAPTION, HASHTAGS) */}
                <div className="p-4 space-y-3 flex-1 bg-white text-xs">
                  {/* Promotional Headline */}
                  {headline && (
                    <div className="p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/80">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider block">Campaign Headline</span>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">{headline}</p>
                    </div>
                  )}

                  {/* Supporting Copy */}
                  {supportingCopy && (
                    <p className="text-slate-600 italic text-[11px] px-1">{supportingCopy}</p>
                  )}

                  {/* Caption Section */}
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-indigo-600" /> Post Caption
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{platformMock === "instagram" ? username : fbPageName}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                      {caption || `${headline}. Visit us today to book your appointment!`}
                    </p>
                  </div>

                  {/* Hashtags Section */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3 text-purple-600" /> Campaign Hashtags ({hashtags.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-600 gap-1"
                    onClick={() => copyToClipboard(`${headline}\n\n${caption}\n\n${hashtags.join(" ")}`, job._id)}
                  >
                    {copiedCaptionId === job._id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedCaptionId === job._id ? "Copied" : "Copy Text"}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => setSelectedJob(job)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Full Details
                    </Button>

                    {job.status === "Failed" && job.retryCount < job.maxRetries && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-amber-600 border-amber-200"
                        onClick={() => handleRetryJob(job._id)}
                      >
                        <RotateCcw className="h-3 w-3" /> Retry
                      </Button>
                    )}

                    {(job.status === "Queued" || job.status === "Pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleCancelJob(job._id)}
                      >
                        <XCircle className="h-3 w-3" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Scheduled Publish Time</th>
                  <th className="p-3.5">Campaign Deliverable & Headline</th>
                  <th className="p-3.5">Client & Location</th>
                  <th className="p-3.5">Platforms & Hashtags</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Approved By</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const content = typeof job.entityId === "object" && job.entityId !== null ? job.entityId : {};
                  const title = job.payload?.title || content.title || "AI Campaign Post";
                  const headline = content.headline || job.payload?.headline || title;
                  const caption = content.caption || job.payload?.caption || "";
                  const hashtags = (Array.isArray(content.hashtags) && content.hashtags.length > 0)
                    ? content.hashtags
                    : (Array.isArray(job.payload?.hashtags) && job.payload.hashtags.length > 0)
                      ? job.payload.hashtags
                      : (typeof job.payload?.hashtags === "string" ? job.payload.hashtags.split(/\s+/) : []);
                  const platforms = content.platforms || job.payload?.platforms || ["Instagram", "Facebook"];
                  const posterImg =
                    job.payload?.imageUrl ||
                    content.mediaUrl ||
                    content.imageUrl ||
                    content.creativeProjectId?.versions?.[0]?.fileUrl ||
                    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop";

                  return (
                    <tr key={job._id} className="hover:bg-slate-50/90 transition-colors">
                      {/* Scheduled Time */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Date(job.scheduledFor).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {formatCountdown(job.scheduledFor)}
                        </span>
                      </td>

                      {/* Poster Thumbnail & Campaign Title & Caption */}
                      <td className="p-3.5 max-w-[320px]">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 rounded-xl bg-slate-950 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs mt-0.5">
                            {job.payload?.posterData ? (
                              <CreativePosterCanvas
                                {...job.payload.posterData}
                                brandName={job.customerId?.name || "Brand"}
                                idPrefix={`sched_table_${job._id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img src={posterImg} alt="Poster" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <span className="font-bold text-slate-900 block truncate">
                              {headline}
                            </span>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                              {caption || title}
                            </p>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {String(job._id).slice(-6)} • {job.jobType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client Customer & Location */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {job.customerId?.name || "—"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {job.clientLocationId?.name || "Main Location"}
                          {job.clientLocationId?.city ? ` (${job.clientLocationId.city})` : ""}
                        </span>
                      </td>

                      {/* Target Platforms & Hashtags */}
                      <td className="p-3.5 max-w-[240px]">
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {platforms.map((p: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        {hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {hashtags.slice(0, 4).map((h: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                              >
                                {h.startsWith("#") ? h : `#${h}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          className={
                            job.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                              : job.status === "Queued" || job.status === "Pending"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                                : job.status === "Failed"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                                  : "bg-slate-100 text-slate-600"
                          }
                        >
                          {job.status === "Queued" || job.status === "Pending" ? "Queued" : job.status}
                        </Badge>
                      </td>

                      {/* Approved By */}
                      <td className="p-3.5 whitespace-nowrap text-slate-500">
                        <span className="font-medium text-slate-700 block">
                          {job.approvedBy?.name || job.createdBy?.name || "Manager"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {job.approvedBy?.role || "Admin"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setSelectedJob(job)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>

                          {job.status === "Failed" && job.retryCount < job.maxRetries && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-amber-600 border-amber-200"
                              onClick={() => handleRetryJob(job._id)}
                            >
                              <RotateCcw className="h-3 w-3" /> Retry
                            </Button>
                          )}

                          {(job.status === "Queued" || job.status === "Pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleCancelJob(job._id)}
                            >
                              <XCircle className="h-3 w-3" /> Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL DETAILS & MOCKUP MODAL */}
      {selectedJob && (
        <Dialog open={Boolean(selectedJob)} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-3xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" /> Scheduled Post Specification & Live Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Complete post preview, caption, hashtags, and queue execution metadata.
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const content = typeof selectedJob.entityId === "object" && selectedJob.entityId !== null ? selectedJob.entityId : {};
              const title = selectedJob.payload?.title || content.title || "AI Campaign Post";
              const headline = content.headline || selectedJob.payload?.headline || title;
              const supportingCopy = content.supportingCopy || selectedJob.payload?.supportingCopy || "";
              const caption = content.caption || selectedJob.payload?.caption || "";
              const hashtags = (Array.isArray(content.hashtags) && content.hashtags.length > 0)
                ? content.hashtags
                : (Array.isArray(selectedJob.payload?.hashtags) && selectedJob.payload.hashtags.length > 0)
                  ? selectedJob.payload.hashtags
                  : (typeof selectedJob.payload?.hashtags === "string" ? selectedJob.payload.hashtags.split(/\s+/) : []);
              const platforms = content.platforms || selectedJob.payload?.platforms || ["Instagram", "Facebook"];
              const client = selectedJob.customerId || {};
              const location = selectedJob.clientLocationId || {};
              const posterImg =
                selectedJob.payload?.imageUrl ||
                content.mediaUrl ||
                content.imageUrl ||
                content.creativeProjectId?.versions?.[0]?.fileUrl ||
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop";

              return (
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-950 text-sm block">{title}</span>
                      <span className="text-[11px] text-indigo-700">
                        Client: {client.name} • {location.name || "Main Branch"}
                      </span>
                    </div>
                    <Badge className="bg-indigo-600 text-white font-bold">{selectedJob.status}</Badge>
                  </div>

                  {/* Split Visual & Copy Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Poster Graphic */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 flex flex-col items-center justify-center text-center">
                      <div className="max-h-72 aspect-square w-full max-w-[280px] rounded-lg border border-purple-500/30 shadow-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                        {selectedJob.payload?.posterData ? (
                          <CreativePosterCanvas
                            {...selectedJob.payload.posterData}
                            brandName={client.name || "Brand"}
                            idPrefix={`sched_modal_${selectedJob._id}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={posterImg}
                            alt="Poster"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="w-full flex items-center justify-between text-slate-400 text-[11px]">
                        <span>1080 × 1080 (1:1 Square)</span>
                        <a
                          href={posterImg}
                          download="Scheduled_Poster_1080x1080.svg"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Download High-Res
                        </a>
                      </div>
                    </div>

                    {/* Right: Copy & Hashtags */}
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {headline && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Headline</span>
                          <p className="font-bold text-slate-900 text-xs mt-0.5">{headline}</p>
                        </div>
                      )}

                      {supportingCopy && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Supporting Line</span>
                          <p className="text-slate-700 text-xs italic">{supportingCopy}</p>
                        </div>
                      )}

                      {caption && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Caption Body</span>
                          <div className="p-2.5 bg-white text-slate-800 rounded-lg border border-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {caption}
                          </div>
                        </div>
                      )}

                      {hashtags.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Hashtags</span>
                          <div className="flex flex-wrap gap-1">
                            {hashtags.map((h: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                                {h.startsWith("#") ? h : `#${h}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timing & Target Channels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-lg border">
                      <span className="text-slate-400 block text-[10px]">Target Publish Date</span>
                      <span className="font-bold text-slate-900">{new Date(selectedJob.scheduledFor).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border">
                      <span className="text-slate-400 block text-[10px]">Timezone</span>
                      <span className="font-semibold text-slate-800">{selectedJob.timezone || "Asia/Kolkata (IST)"}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border">
                      <span className="text-slate-400 block text-[10px]">Platforms</span>
                      <span className="font-semibold text-slate-800">{platforms.join(", ")}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border">
                      <span className="text-slate-400 block text-[10px]">Approved By</span>
                      <span className="font-semibold text-slate-800">{selectedJob.approvedBy?.name || "Manager"}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
