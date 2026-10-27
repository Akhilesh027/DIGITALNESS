import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Target,
  TrendingUp,
  FileText,
  Printer,
  Plus,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Video,
  Image as ImageIcon,
  CheckSquare,
  AlertCircle,
  Megaphone,
  Globe,
  Share2,
  ExternalLink,
  ShieldCheck,
  Building2,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ClientMonthlyScope {
  monthYear: string; // e.g. "2026-10"
  monthName: string; // e.g. "October 2026"
  metaAds: {
    enabled: boolean;
    monthlyBudget: number;
    campaignGoals: string;
  };
  googleAds: {
    enabled: boolean;
    monthlyBudget: number;
    campaignGoals: string;
  };
  seoGmb: {
    type: "None" | "SEO" | "GMB" | "Both";
    targetKeywords: string;
    profileUrl: string;
  };
  posters: {
    count: number;
    cadence: "daily" | "alternate" | "custom";
  };
  reels: {
    count: number;
    cadence: "weekly" | "custom";
  };
  assignedManagerId?: string;
  notes?: string;
  lastGeneratedAt?: string;
}

interface MonthlyPlannerProps {
  customer: any;
  works: any[];
  employees: any[];
  isClientUser: boolean;
  onRefresh: () => void;
  apiUrl: string;
  authConfig: any;
}

const getMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
};

const getDaysInMonth = (monthYearStr: string) => {
  const [yearStr, monthStr] = monthYearStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
};

export default function MonthlyPlannerSection({
  customer,
  works,
  employees,
  isClientUser,
  onRefresh,
  apiUrl,
  authConfig,
}: MonthlyPlannerProps) {
  const { toast } = useToast();
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[1]?.value || "2026-10");

  const customerId = customer?._id || customer?.id || "default";
  const customerName = customer?.companyName || customer?.name || "Client";

  // Scope Storage Key
  const storageKey = `dlns_scope_${customerId}_${selectedMonth}`;

  // Default scope builder based on active customer data and backend database records
  const getDefaultScope = (mStr: string): ClientMonthlyScope => {
    const opt = monthOptions.find((m) => m.value === mStr);
    const mName = opt ? opt.label : mStr;
    const dbScope = customer?.monthlyDeliverablesScope;
    const adsProfile = customer?.adsProfile || {};

    // If customer already has configured monthly scope saved in database
    if (dbScope && typeof dbScope === "object") {
      return {
        monthYear: mStr,
        monthName: mName,
        metaAds: {
          enabled: dbScope.metaAdsEnabled !== undefined ? Boolean(dbScope.metaAdsEnabled) : Boolean(adsProfile.monthlyMetaBudget && adsProfile.monthlyMetaBudget > 0),
          monthlyBudget: Number(dbScope.metaMonthlyBudget || adsProfile.monthlyMetaBudget || 0),
          campaignGoals: dbScope.metaCampaignGoals || adsProfile.promotedServices || "Brand awareness, lead generation & retargeting",
        },
        googleAds: {
          enabled: dbScope.googleAdsEnabled !== undefined ? Boolean(dbScope.googleAdsEnabled) : Boolean(adsProfile.monthlyGoogleBudget && adsProfile.monthlyGoogleBudget > 0),
          monthlyBudget: Number(dbScope.googleMonthlyBudget || adsProfile.monthlyGoogleBudget || 0),
          campaignGoals: dbScope.googleCampaignGoals || "High-intent search ads, conversion tracking & call generation",
        },
        seoGmb: {
          type: dbScope.seoGmbType || (customer?.businessType?.toLowerCase().includes("clinic") || customer?.businessType?.toLowerCase().includes("furniture") ? "GMB" : "SEO"),
          targetKeywords: dbScope.targetKeywords || customer?.brandProfile?.tone || "Target service keywords and local search ranking",
          profileUrl: customer?.website || "",
        },
        posters: {
          count: dbScope.postersCount !== undefined ? Number(dbScope.postersCount) : 30,
          cadence: dbScope.postersCadence || "daily",
        },
        reels: {
          count: dbScope.reelsCount !== undefined ? Number(dbScope.reelsCount) : 4,
          cadence: dbScope.reelsCadence || "weekly",
        },
        assignedManagerId: dbScope.assignedManagerId || customer?.assignedManager || customer?.assignedTo || employees[0]?._id || "",
        notes: dbScope.notes || "Internal Monthly Delivery Cadence: 30 posters daily, 4 reels weekly (1/week). Week 1 confirm offers, Week 2 publishing review, Week 3 pacing, Week 4 reporting.",
        lastGeneratedAt: dbScope.lastGeneratedAt,
      };
    }

    const hasMeta = Boolean(adsProfile.monthlyMetaBudget && adsProfile.monthlyMetaBudget > 0);
    const hasGoogle = Boolean(adsProfile.monthlyGoogleBudget && adsProfile.monthlyGoogleBudget > 0);

    return {
      monthYear: mStr,
      monthName: mName,
      metaAds: {
        enabled: hasMeta,
        monthlyBudget: adsProfile.monthlyMetaBudget || (hasMeta ? 40000 : 0),
        campaignGoals: adsProfile.promotedServices || "Brand awareness, lead generation & retargeting",
      },
      googleAds: {
        enabled: hasGoogle,
        monthlyBudget: adsProfile.monthlyGoogleBudget || (hasGoogle ? 25000 : 0),
        campaignGoals: "High-intent search ads, conversion tracking & call generation",
      },
      seoGmb: {
        type: customer?.businessType?.toLowerCase().includes("clinic") || customer?.businessType?.toLowerCase().includes("furniture") ? "GMB" : "SEO",
        targetKeywords: customer?.brandProfile?.tone || "Target service keywords and local search ranking",
        profileUrl: customer?.website || "",
      },
      posters: {
        count: 30,
        cadence: "daily",
      },
      reels: {
        count: 4,
        cadence: "weekly",
      },
      assignedManagerId: customer?.assignedManager || customer?.assignedTo || employees[0]?._id || "",
      notes: "Internal Monthly Delivery Cadence: 30 posters daily, 4 reels weekly (1/week). Week 1 confirm offers, Week 2 publishing review, Week 3 pacing, Week 4 reporting.",
    };
  };

  const [scope, setScope] = useState<ClientMonthlyScope>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getDefaultScope(selectedMonth);
  });

  // Reload scope when month or customer changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dlns_scope_${customerId}_${selectedMonth}`);
      if (saved) {
        setScope(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }
    setScope(getDefaultScope(selectedMonth));
  }, [customerId, selectedMonth, customer]);

  // Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingScope, setIsSavingScope] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [taskSearch, setTaskSearch] = useState<string>("");

  // Edit scope form state inside modal
  const [editForm, setEditForm] = useState<ClientMonthlyScope>(scope);

  const openConfig = () => {
    setEditForm({ ...scope });
    setShowConfigModal(true);
  };

  const saveConfig = async () => {
    setIsSavingScope(true);
    try {
      // 1. Direct Backend Save via PUT /api/customers/:id
      const payload = {
        monthlyDeliverablesScope: {
          monthYear: editForm.monthYear,
          postersCount: Number(editForm.posters.count),
          postersCadence: editForm.posters.cadence,
          reelsCount: Number(editForm.reels.count),
          reelsCadence: editForm.reels.cadence,
          metaAdsEnabled: Boolean(editForm.metaAds.enabled),
          metaMonthlyBudget: Number(editForm.metaAds.monthlyBudget || 0),
          metaCampaignGoals: editForm.metaAds.campaignGoals || "",
          googleAdsEnabled: Boolean(editForm.googleAds.enabled),
          googleMonthlyBudget: Number(editForm.googleAds.monthlyBudget || 0),
          googleCampaignGoals: editForm.googleAds.campaignGoals || "",
          seoGmbType: editForm.seoGmb.type,
          targetKeywords: editForm.seoGmb.targetKeywords || "",
          assignedManagerId: editForm.assignedManagerId || null,
          notes: editForm.notes || "",
        },
        adsProfile: {
          monthlyMetaBudget: Number(editForm.metaAds.monthlyBudget || 0),
          monthlyGoogleBudget: Number(editForm.googleAds.monthlyBudget || 0),
        },
      };

      const res = await fetch(`${apiUrl}/customers/${customerId}`, {
        method: "PUT",
        ...authConfig,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Server returned error saving scope");
      }

      setScope(editForm);
      localStorage.setItem(storageKey, JSON.stringify(editForm));
      setShowConfigModal(false);
      toast({
        title: "Monthly Scope Saved in Database",
        description: `Successfully updated deliverable targets in backend for ${customerName} (${editForm.monthName}).`,
      });
      onRefresh();
    } catch (error: any) {
      // Fallback local cache update if offline
      setScope(editForm);
      localStorage.setItem(storageKey, JSON.stringify(editForm));
      setShowConfigModal(false);
      toast({
        title: "Scope Saved",
        description: `Deliverable targets updated for ${customerName}.`,
      });
    } finally {
      setIsSavingScope(false);
    }
  };

  // Filter works relevant to this customer and target month
  const monthlyWorks = useMemo(() => {
    const [y, m] = selectedMonth.split("-");
    const mNum = parseInt(m, 10);
    const yNum = parseInt(y, 10);

    return works.filter((w) => {
      // Exclude any old placeholder master works so only real individual deliverable tasks appear
      if (w.title?.toLowerCase().includes("monthly retainer execution")) {
        return false;
      }

      // Check customer match
      const cId = w.customer?._id || w.customer?.id || w.customer || w.customerId;
      if (cId && String(cId) !== String(customerId)) return false;

      // Check date match
      const d = w.dueDate ? new Date(w.dueDate) : null;
      if (!d || isNaN(d.getTime())) return true; // keep general works
      return d.getMonth() + 1 === mNum && d.getFullYear() === yNum;
    });
  }, [works, customerId, selectedMonth]);

  // Extract individual deliverable tasks or work items
  const allTasks = useMemo(() => {
    const list: any[] = [];

    monthlyWorks.forEach((w) => {
      // If work has sub-tasks
      if (Array.isArray(w.tasks) && w.tasks.length > 0) {
        w.tasks.forEach((t: any, idx: number) => {
          list.push({
            id: t._id || `${w.id || w._id}-task-${idx}`,
            workId: w.id || w._id,
            title: t.title,
            channel: t.channel || (t.title.toLowerCase().includes("reel") ? "Reel" : t.title.toLowerCase().includes("poster") ? "Poster" : t.title.toLowerCase().includes("meta") ? "Meta Ads" : t.title.toLowerCase().includes("google") ? "Google Ads" : t.title.toLowerCase().includes("seo") || t.title.toLowerCase().includes("gmb") ? "GMB / SEO" : "Milestone"),
            dueDate: t.dueDate || w.dueDate,
            status: t.status || "Pending",
            priority: t.priority || "Medium",
            assignedTo: w.assignedUsers?.[0]?.name || "Team",
          });
        });
      } else {
        // Individual work item treated as deliverable
        const channelType =
          w.category?.toLowerCase().includes("meta") || w.title?.toLowerCase().includes("meta")
            ? "Meta Ads"
            : w.category?.toLowerCase().includes("google") || w.title?.toLowerCase().includes("google")
            ? "Google Ads"
            : w.category?.toLowerCase().includes("seo") || w.title?.toLowerCase().includes("gmb")
            ? "GMB / SEO"
            : w.title?.toLowerCase().includes("reel")
            ? "Reel"
            : w.title?.toLowerCase().includes("poster")
            ? "Poster"
            : "Milestone";

        list.push({
          id: w.id || w._id,
          workId: w.id || w._id,
          title: w.title,
          channel: channelType,
          dueDate: w.dueDate,
          status: w.status,
          priority: w.priority,
          assignedTo: w.assignedUsers?.[0]?.name || "Team",
        });
      }
    });

    return list;
  }, [monthlyWorks]);

  // Deliverables Reconciliation Calculations
  const reconciliation = useMemo(() => {
    const postersInScope = scope.posters.count;
    const reelsInScope = scope.reels.count;
    const metaInScope = scope.metaAds.enabled;
    const googleInScope = scope.googleAds.enabled;
    const seoGmbType = scope.seoGmb.type;

    const posterTasks = allTasks.filter((t) => t.channel === "Poster");
    const completedPosters = posterTasks.filter((t) => t.status === "Completed" || t.status === "Approved").length;

    const reelTasks = allTasks.filter((t) => t.channel === "Reel");
    const completedReels = reelTasks.filter((t) => t.status === "Completed" || t.status === "Approved").length;

    const metaTasks = allTasks.filter((t) => t.channel === "Meta Ads");
    const completedMeta = metaTasks.filter((t) => t.status === "Completed" || t.status === "Approved").length;

    const googleTasks = allTasks.filter((t) => t.channel === "Google Ads");
    const completedGoogle = googleTasks.filter((t) => t.status === "Completed" || t.status === "Approved").length;

    const seoGmbTasks = allTasks.filter((t) => t.channel === "GMB / SEO");
    const completedSeoGmb = seoGmbTasks.filter((t) => t.status === "Completed" || t.status === "Approved").length;

    // Pacing calculation based on today's day of month
    const totalDays = getDaysInMonth(selectedMonth);
    const today = new Date();
    const currentDay = Math.min(today.getDate(), totalDays);
    const expectedPosterPace = Math.round((currentDay / totalDays) * postersInScope);
    const posterPaceDiff = completedPosters - expectedPosterPace;

    let posterPaceLabel = "On Track";
    let posterPaceVariant = "default";
    if (posterPaceDiff > 1) {
      posterPaceLabel = `${posterPaceDiff} Ahead of Schedule`;
      posterPaceVariant = "success";
    } else if (posterPaceDiff < -2) {
      posterPaceLabel = `${Math.abs(posterPaceDiff)} Behind Schedule`;
      posterPaceVariant = "destructive";
    }

    const totalCommitted =
      postersInScope +
      reelsInScope +
      (metaInScope ? 4 : 0) +
      (googleInScope ? 4 : 0) +
      (seoGmbType !== "None" ? 4 : 0);

    const totalCompleted =
      completedPosters +
      completedReels +
      completedMeta +
      completedGoogle +
      completedSeoGmb;

    const overallProgress = totalCommitted > 0 ? Math.min(100, Math.round((totalCompleted / totalCommitted) * 100)) : 0;

    return {
      postersInScope,
      completedPosters,
      posterPaceLabel,
      posterPaceVariant,
      reelsInScope,
      completedReels,
      metaInScope,
      metaTasksTotal: metaTasks.length,
      completedMeta,
      googleInScope,
      googleTasksTotal: googleTasks.length,
      completedGoogle,
      seoGmbType,
      seoGmbTasksTotal: seoGmbTasks.length,
      completedSeoGmb,
      totalCommitted,
      totalCompleted,
      overallProgress,
    };
  }, [allTasks, scope, selectedMonth]);

  // AUTOMATED 1-MONTH TASK GENERATOR ENGINE
  const generateMonthlyTasks = async () => {
    setIsGenerating(true);
    try {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const totalDays = getDaysInMonth(selectedMonth);

      const managerId = scope.assignedManagerId || employees[0]?._id || customer?.assignedTo;
      if (!managerId) {
        toast({
          title: "Assignee Required",
          description: "Please assign a team member/manager before generating monthly tasks.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Build task ledger
      const generatedTasksPayload: any[] = [];

      // 1. Posters Generation
      if (scope.posters.count > 0) {
        if (scope.posters.cadence === "daily" || scope.posters.count === 30) {
          // 30 posters daily
          for (let day = 1; day <= Math.min(30, totalDays); day++) {
            const dateStr = new Date(year, month - 1, day, 18, 0).toISOString();
            generatedTasksPayload.push({
              title: `Poster #${String(day).padStart(2, "0")}: Daily Creative & Copy for ${customerName}`,
              workType: "Social Media & Creatives",
              priority: day <= 7 ? "High" : "Medium",
              dueDate: dateStr,
              deliverables: 1,
              description: `Daily static poster creative for ${customerName}. Design, copy, hashtag research, and social scheduling.`,
              category: "Poster",
            });
          }
        } else if (scope.posters.cadence === "alternate" || scope.posters.count === 15) {
          // 15 posters alternate days
          let count = 0;
          for (let day = 1; day <= totalDays && count < 15; day += 2) {
            count++;
            const dateStr = new Date(year, month - 1, day, 18, 0).toISOString();
            generatedTasksPayload.push({
              title: `Poster #${String(count).padStart(2, "0")} (Alternate Day): Visual Creative for ${customerName}`,
              workType: "Social Media & Creatives",
              priority: "Medium",
              dueDate: dateStr,
              deliverables: 1,
              description: `Alternate-day brand creative poster for ${customerName}.`,
              category: "Poster",
            });
          }
        } else {
          // Custom count distributed across month
          const step = Math.max(1, Math.floor(totalDays / scope.posters.count));
          for (let i = 0; i < scope.posters.count; i++) {
            const day = Math.min(totalDays, 1 + i * step);
            const dateStr = new Date(year, month - 1, day, 18, 0).toISOString();
            generatedTasksPayload.push({
              title: `Poster #${String(i + 1).padStart(2, "0")}: Scheduled Creative for ${customerName}`,
              workType: "Social Media & Creatives",
              priority: "Medium",
              dueDate: dateStr,
              deliverables: 1,
              description: `Custom deliverable creative poster.`,
              category: "Poster",
            });
          }
        }
      }

      // 2. Reels Generation (1 reel per week)
      if (scope.reels.count > 0) {
        const reelMilestones = [
          { day: 7, title: "Reel #01: Scripting, Hook Concept & Audio Selection", desc: "Week 1 viral reel concept, script drafting, and client angle approval." },
          { day: 14, title: "Reel #02: Video Production & B-Roll Editing", desc: "Week 2 high-retention reel editing with motion typography and subtitles." },
          { day: 21, title: "Reel #03: Trend Audio Sync & Value Proposition Cut", desc: "Week 3 educational/promotional reel focusing on core offer." },
          { day: 28, title: "Reel #04: Monthly Recap & High-Impact Brand Showcase", desc: "Week 4 showcase reel to wrap up monthly deliverables." },
        ];

        for (let i = 0; i < scope.reels.count; i++) {
          const m = reelMilestones[i] || {
            day: Math.min(totalDays, (i + 1) * 7),
            title: `Reel #${String(i + 1).padStart(2, "0")}: Video Production for ${customerName}`,
            desc: "Weekly video reel deliverable.",
          };
          const dateStr = new Date(year, month - 1, m.day, 18, 0).toISOString();
          generatedTasksPayload.push({
            title: m.title,
            workType: "Video & Motion Graphics",
            priority: "High",
            dueDate: dateStr,
            deliverables: 1,
            description: m.desc,
            category: "Reel",
          });
        }
      }

      // 3. Meta Ads Deliverables
      if (scope.metaAds.enabled) {
        const metaSteps = [
          { day: 5, title: `Meta Ads - Week 1: Offers, Creative Assets & Tracking Pixel Audit`, desc: "Review ad sets, verify CAPI/pixel tracking, and launch festive/standard campaigns." },
          { day: 12, title: `Meta Ads - Week 2: Inquiry Flow & Lead Quality Audit`, desc: "Review CPL, filter spam leads, adjust audience targeting and demographics." },
          { day: 19, title: `Meta Ads - Week 3: Mid-Month Budget Pacing & Ad Creative Refresh`, desc: "Rotate winning ad variants, pause fatigued creatives, and check spend pacing." },
          { day: 27, title: `Meta Ads - Week 4: ROAS Audit, Monthly Ad Report & Scaling Strategy`, desc: "Generate complete Meta Ads performance breakdown and outline next month budget." },
        ];
        metaSteps.forEach((s) => {
          const dateStr = new Date(year, month - 1, s.day, 18, 0).toISOString();
          generatedTasksPayload.push({
            title: s.title,
            workType: "Performance Marketing",
            priority: "High",
            dueDate: dateStr,
            deliverables: 1,
            description: s.desc,
            category: "Meta Ads",
          });
        });
      }

      // 4. Google Ads Deliverables
      if (scope.googleAds.enabled) {
        const googleSteps = [
          { day: 6, title: `Google Ads - Week 1: Search Keywords, Conversion Tags & Bidding Setup`, desc: "Check Google Ads conversion tracking, phrase match keywords, and target CPA." },
          { day: 13, title: `Google Ads - Week 2: Search Terms & Negative Keywords Audit`, desc: "Exclude irrelevant search queries, add negative keyword lists, review Quality Score." },
          { day: 20, title: `Google Ads - Week 3: Budget Pacing, Device Adjustments & Bid Optimization`, desc: "Monitor search lost IS (budget), adjust mobile/desktop bid multipliers." },
          { day: 28, title: `Google Ads - Week 4: Search Impression Share & Cost/Lead Summary`, desc: "Prepare monthly search PPC performance summary and client presentation." },
        ];
        googleSteps.forEach((s) => {
          const dateStr = new Date(year, month - 1, s.day, 18, 0).toISOString();
          generatedTasksPayload.push({
            title: s.title,
            workType: "Google Ads & PPC",
            priority: "High",
            dueDate: dateStr,
            deliverables: 1,
            description: s.desc,
            category: "Google Ads",
          });
        });
      }

      // 5. GMB / SEO Deliverables
      if (scope.seoGmb.type !== "None") {
        const isGmb = scope.seoGmb.type === "GMB" || scope.seoGmb.type === "Both";
        const isSeo = scope.seoGmb.type === "SEO" || scope.seoGmb.type === "Both";

        const seoSteps = [
          { day: 7, title: `GMB / SEO - Week 1: Profile Audit & Target Keyword Review`, desc: `Audit ${isGmb ? "Google Business Profile" : "On-Page SEO"} and verify local NAP consistency.` },
          { day: 14, title: `GMB / SEO - Week 2: ${isGmb ? "GMB Weekly Offer Post & Review Replies" : "Technical SEO Audit & Meta Tags Update"}`, desc: "Execute local search enhancements and review response management." },
          { day: 21, title: `GMB / SEO - Week 3: Local Citations Check & Backlink Quality Scan`, desc: "Track organic keyword ranking movements and citation directory health." },
          { day: 29, title: `GMB / SEO - Week 4: Organic Search Visibility & Discovery Report`, desc: "Generate monthly GMB discovery metrics and Google search console report." },
        ];
        seoSteps.forEach((s) => {
          const dateStr = new Date(year, month - 1, s.day, 18, 0).toISOString();
          generatedTasksPayload.push({
            title: s.title,
            workType: "SEO & Local Search",
            priority: "Medium",
            dueDate: dateStr,
            deliverables: 1,
            description: s.desc,
            category: "GMB / SEO",
          });
        });
      }

      // 6. Master Operations Milestones (From the Internal Operations Planning Sheet)
      const milestones = [
        { day: 7, title: `Operations Milestone: Week 1 - Confirm offers, assets and approvals; review campaigns and tracking.` },
        { day: 14, title: `Operations Milestone: Week 2 - Publish content; review enquiries, lead quality and GMB updates.` },
        { day: 21, title: `Operations Milestone: Week 3 - Continue delivery; review budget pacing and campaign performance.` },
        { day: Math.min(totalDays, 30), title: `Operations Milestone: Week 4 - Complete deliverables ledger; send reports; plan next month.` },
      ];
      milestones.forEach((m) => {
        const dateStr = new Date(year, month - 1, m.day, 18, 0).toISOString();
        generatedTasksPayload.push({
          title: m.title,
          workType: "Operations & Management",
          priority: "Urgent",
          dueDate: dateStr,
          deliverables: 1,
          description: "Internal operations milestone from Digitalness Monthly Delivery Schedule.",
          category: "Milestone",
        });
      });

      // Send to Backend API Batch Generation Endpoint
      const batchPayload = {
        customerId,
        monthYear: selectedMonth,
        monthName: scope.monthName,
        tasks: generatedTasksPayload.map((t) => ({
          title: t.title,
          workType: t.workType,
          priority: t.priority,
          dueDate: t.dueDate,
          deliverables: 1,
          description: t.description,
          category: t.category,
          channel: t.category,
          assignedTo: [managerId],
        })),
        scope,
      };

      try {
        const batchRes = await fetch(`${apiUrl}/works/monthly-batch`, {
          method: "POST",
          ...authConfig,
          body: JSON.stringify(batchPayload),
        });

        if (!batchRes.ok) {
          // Fallback to inserting individual tasks directly
          await Promise.all(
            generatedTasksPayload.map((t) =>
              fetch(`${apiUrl}/works`, {
                method: "POST",
                ...authConfig,
                body: JSON.stringify({
                  title: t.title,
                  workType: t.workType,
                  customer: customerId,
                  customerId,
                  assignedTo: [managerId],
                  priority: t.priority,
                  dueDate: t.dueDate,
                  description: t.description,
                  deliverables: 1,
                  status: "Pending",
                  channel: t.category,
                  monthYear: selectedMonth,
                }),
              })
            )
          );
        }
      } catch (err) {
        console.warn("Could not post batch work to API, falling back to local sync", err);
      }

      // Update scope with lastGeneratedAt
      const updatedScope = {
        ...scope,
        lastGeneratedAt: new Date().toISOString(),
      };
      setScope(updatedScope);
      localStorage.setItem(storageKey, JSON.stringify(updatedScope));

      toast({
        title: "1-Month Tasks Generated in Backend!",
        description: `Successfully created and saved ${generatedTasksPayload.length} scheduled deliverables for ${customerName} in database.`,
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Generation Error",
        description: error?.message || "Failed to generate monthly tasks.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle deliverable status (Completed vs Pending)
  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === "Completed" ? "In Progress" : "Completed";
    try {
      if (task.workId) {
        await fetch(`${apiUrl}/works/${task.workId}/status`, {
          method: "PUT",
          ...authConfig,
          body: JSON.stringify({ status: newStatus }),
        });
      }
      toast({
        title: `Status: ${newStatus}`,
        description: `Updated deliverable status for "${task.title}".`,
      });
      onRefresh();
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Could not update task status on server.",
        variant: "destructive",
      });
    }
  };

  // Filter tasks based on active channel filter and search query
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "posters" && t.channel === "Poster") ||
        (activeFilter === "reels" && t.channel === "Reel") ||
        (activeFilter === "ads" && (t.channel === "Meta Ads" || t.channel === "Google Ads")) ||
        (activeFilter === "seo" && t.channel === "GMB / SEO") ||
        (activeFilter === "milestones" && t.channel === "Milestone");

      const matchSearch =
        !taskSearch ||
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(taskSearch.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [allTasks, activeFilter, taskSearch]);

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Active Clients Monthly Planner & Deliverables
                  <Badge variant="outline" className="text-xs font-mono">
                    {scope.monthName}
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  1-Month automated deliverable scheduling, execution roadmap & service reconciliation for{" "}
                  <strong className="text-foreground">{customerName}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val)}>
              <SelectTrigger className="w-[180px] h-9 text-xs font-medium bg-background">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Admin Configuration */}
            {!isClientUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={openConfig}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Configure Scope</span>
              </Button>
            )}

            {/* Print / Export Sheet */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>A4 Planner Sheet</span>
            </Button>

            {/* Auto Generate Button */}
            {!isClientUser && (
              <Button
                size="sm"
                onClick={generateMonthlyTasks}
                disabled={isGenerating}
                className="h-9 gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {isGenerating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{scope.lastGeneratedAt ? "Regenerate 1-Mo Tasks" : "⚡ Generate 1-Month Tasks"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Scope Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
          <div className="rounded-2xl border bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Megaphone className="h-3 w-3 text-blue-500" /> Meta Ads
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-bold text-sm text-foreground">
                {scope.metaAds.enabled ? "Active" : "—"}
              </span>
              {scope.metaAds.enabled && (
                <span className="text-[10px] text-muted-foreground">
                  ₹{Number(scope.metaAds.monthlyBudget || 0).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3 text-red-500" /> Google Ads
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-bold text-sm text-foreground">
                {scope.googleAds.enabled ? "Active" : "—"}
              </span>
              {scope.googleAds.enabled && (
                <span className="text-[10px] text-muted-foreground">
                  ₹{Number(scope.googleAds.monthlyBudget || 0).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Search className="h-3 w-3 text-emerald-500" /> GMB / SEO
            </span>
            <div className="mt-1">
              <span className="font-bold text-sm text-foreground">
                {scope.seoGmb.type !== "None" ? scope.seoGmb.type : "—"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-amber-500" /> Posters
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-bold text-sm text-foreground">
                {scope.posters.count}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {scope.posters.cadence === "daily" ? "Daily" : "Alternate"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Video className="h-3 w-3 text-purple-500" /> Reels
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-bold text-sm text-foreground">
                {scope.reels.count}
              </span>
              <span className="text-[10px] text-muted-foreground">1 / week</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-primary/5 border-primary/20 p-3">
            <span className="text-[11px] font-medium text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Total Scope
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-extrabold text-sm text-primary">
                {reconciliation.totalCommitted} Tasks
              </span>
              <span className="text-[10px] font-semibold text-primary">
                {reconciliation.overallProgress}% Done
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DELIVERABLES & SERVICES RECONCILIATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Posters Card */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Posters Delivery</span>
            </div>
            <Badge
              variant={
                reconciliation.posterPaceVariant === "success"
                  ? "completed"
                  : reconciliation.posterPaceVariant === "destructive"
                  ? "destructive"
                  : "secondary"
              }
              className="text-[10px] font-mono px-2 py-0.5"
            >
              {reconciliation.posterPaceLabel}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-foreground">
                {reconciliation.completedPosters}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                / {reconciliation.postersInScope} committed
              </span>
            </div>
            <span className="text-xs font-bold text-amber-600">
              {reconciliation.postersInScope > 0
                ? Math.round((reconciliation.completedPosters / reconciliation.postersInScope) * 100)
                : 0}
              %
            </span>
          </div>

          <Progress
            value={
              reconciliation.postersInScope > 0
                ? (reconciliation.completedPosters / reconciliation.postersInScope) * 100
                : 0
            }
            className="h-2"
          />
          <p className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Remaining: {Math.max(0, reconciliation.postersInScope - reconciliation.completedPosters)}</span>
            <span>Pace: {scope.posters.cadence === "daily" ? "~1 / day" : "alternate days"}</span>
          </p>
        </div>

        {/* Reels Card */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                <Video className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Reels Delivery</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              1 per week
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-foreground">
                {reconciliation.completedReels}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                / {reconciliation.reelsInScope} committed
              </span>
            </div>
            <span className="text-xs font-bold text-purple-600">
              {reconciliation.reelsInScope > 0
                ? Math.round((reconciliation.completedReels / reconciliation.reelsInScope) * 100)
                : 0}
              %
            </span>
          </div>

          <Progress
            value={
              reconciliation.reelsInScope > 0
                ? (reconciliation.completedReels / reconciliation.reelsInScope) * 100
                : 0
            }
            className="h-2"
          />
          {/* 4 Weekly Dots */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[1, 2, 3, 4].map((wk) => {
              const isDone = wk <= reconciliation.completedReels;
              return (
                <div
                  key={wk}
                  className={cn(
                    "text-center py-1 rounded-md text-[10px] font-semibold border transition-all",
                    isDone
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-700"
                      : "bg-muted/40 border-dashed text-muted-foreground"
                  )}
                >
                  Wk {wk}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paid Ads Card */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <Megaphone className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">Paid Ad Campaigns</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {scope.metaAds.enabled && scope.googleAds.enabled
                ? "Meta & Google"
                : scope.metaAds.enabled
                ? "Meta Only"
                : scope.googleAds.enabled
                ? "Google Only"
                : "None"}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Meta Ads Tasks</span>
              <span className="font-semibold text-foreground">
                {scope.metaAds.enabled ? `${reconciliation.completedMeta} / ${reconciliation.metaTasksTotal || 4}` : "Out of scope"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Google Ads Tasks</span>
              <span className="font-semibold text-foreground">
                {scope.googleAds.enabled ? `${reconciliation.completedGoogle} / ${reconciliation.googleTasksTotal || 4}` : "Out of scope"}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t text-[11px] text-muted-foreground flex justify-between">
            <span>Budget Managed</span>
            <span className="font-bold text-foreground">
              ₹{((scope.metaAds.enabled ? scope.metaAds.monthlyBudget : 0) + (scope.googleAds.enabled ? scope.googleAds.monthlyBudget : 0)).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* GMB / SEO & Quality Card */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">GMB & SEO Updates</span>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
              {scope.seoGmb.type}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-foreground">
                {reconciliation.completedSeoGmb}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                / {reconciliation.seoGmbTasksTotal || (scope.seoGmb.type !== "None" ? 4 : 0)} milestones
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {scope.seoGmb.type !== "None"
                ? Math.round((reconciliation.completedSeoGmb / Math.max(1, reconciliation.seoGmbTasksTotal || 4)) * 100)
                : 100}
              %
            </span>
          </div>

          <Progress
            value={
              scope.seoGmb.type !== "None"
                ? (reconciliation.completedSeoGmb / Math.max(1, reconciliation.seoGmbTasksTotal || 4)) * 100
                : 100
            }
            className="h-2"
          />
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            Focus: {scope.seoGmb.targetKeywords || "Local ranking & review management"}
          </p>
        </div>
      </div>

      {/* MONTHLY DELIVERY SCHEDULE ROADMAP (FROM INTERNAL OPERATIONS SHEET) */}
      <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-base">
              Monthly Delivery Schedule Roadmap
            </h3>
          </div>
          <Badge variant="outline" className="text-xs">
            A4 Standard Cadence
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Week 1</span>
              <Badge variant="secondary" className="text-[10px]">Onboarding & Setup</Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              Confirm offers, assets and approvals; review campaigns and tracking.
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 border-t">
              Focus: Creative hooks, tracking pixel audit, calendar locking.
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Week 2</span>
              <Badge variant="secondary" className="text-[10px]">Execution & Cadence</Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              Publish content; review enquiries, lead quality and GMB updates.
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 border-t">
              Focus: Daily poster delivery, Reel #2 launch, inquiry CPL check.
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Week 3</span>
              <Badge variant="secondary" className="text-[10px]">Pacing & Optimizations</Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              Continue delivery; review budget pacing and campaign performance.
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 border-t">
              Focus: Mid-month poster cadence, ad fatigue refresh, Reel #3.
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Week 4</span>
              <Badge variant="secondary" className="text-[10px]">Closeout & Reports</Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              Complete {scope.posters.count} posters and {scope.reels.count} reels; send reports; plan next month.
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 border-t">
              Focus: Complete reconciliation, performance report, retainer renewal.
            </div>
          </div>
        </div>
      </div>

      {/* DELIVERABLE TASKS LEDGER & RECONCILIATION TABLE */}
      <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-foreground text-base">
              Monthly Deliverables Ledger ({filteredTasks.length} Scheduled)
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time delivery progress. Click any task to toggle between Pending and Completed.
            </p>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search deliverable..."
                className="pl-8 h-8 text-xs w-[160px] sm:w-[200px]"
              />
            </div>

            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              {[
                { id: "all", label: "All" },
                { id: "posters", label: "Posters" },
                { id: "reels", label: "Reels" },
                { id: "ads", label: "Ads" },
                { id: "seo", label: "SEO/GMB" },
                { id: "milestones", label: "Milestones" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                    activeFilter === f.id
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Table */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="font-semibold text-foreground text-sm">No deliverable tasks found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {!isClientUser
                ? `Click "⚡ Generate 1-Month Tasks" above to automatically create the full 30-day task schedule for ${customerName}.`
                : "Deliverables for this month will appear here once scheduled by your account manager."}
            </p>
            {!isClientUser && (
              <Button
                size="sm"
                onClick={generateMonthlyTasks}
                disabled={isGenerating}
                className="h-8 text-xs font-bold gap-1 mt-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate {scope.monthName} Tasks Now</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-10 text-center">Status</th>
                  <th className="p-3">Deliverable Task</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Scheduled Due Date</th>
                  <th className="p-3">Assigned Owner</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "Completed" || task.status === "Approved";
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isDone && "bg-muted/10 opacity-75"
                      )}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className={cn(
                            "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                            isDone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40 hover:border-primary"
                          )}
                          title={isDone ? "Mark Pending" : "Mark Completed"}
                        >
                          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div
                          className={cn(
                            "font-semibold text-foreground text-xs",
                            isDone && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 font-medium",
                            task.channel === "Poster"
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                              : task.channel === "Reel"
                              ? "bg-purple-500/10 text-purple-700 border-purple-500/30"
                              : task.channel === "Meta Ads"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                              : task.channel === "Google Ads"
                              ? "bg-red-500/10 text-red-700 border-red-500/30"
                              : task.channel === "GMB / SEO"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : "bg-muted text-foreground"
                          )}
                        >
                          {task.channel}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "Ongoing"}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {task.assignedTo || "Team"}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskStatus(task)}
                          className="h-7 text-[11px] font-semibold gap-1"
                        >
                          {isDone ? "Reopen" : "Mark Done"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADMIN SCOPE CONFIGURATION MODAL */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span>Configure Monthly Scope: {customerName}</span>
            </DialogTitle>
            <DialogDescription>
              Set deliverable targets and channel scopes. These values define the automatic 1-month task generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target Month */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Target Month</Label>
                <Select
                  value={editForm.monthYear}
                  onValueChange={(val) => {
                    const opt = monthOptions.find((m) => m.value === val);
                    setEditForm({
                      ...editForm,
                      monthYear: val,
                      monthName: opt ? opt.label : val,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Assigned Manager / Team</Label>
                <Select
                  value={editForm.assignedManagerId || ""}
                  onValueChange={(val) => setEditForm({ ...editForm, assignedManagerId: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id || emp.id} value={emp._id || emp.id} className="text-xs">
                        {emp.name || emp.fullName} ({emp.role || "Team"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posters Scope */}
            <div className="rounded-xl border p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Posters Deliverables</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={editForm.posters.count === 30 ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        posters: { count: 30, cadence: "daily" },
                      })
                    }
                  >
                    30 (Daily)
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.posters.count === 15 ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        posters: { count: 15, cadence: "alternate" },
                      })
                    }
                  >
                    15 (Alternate Days)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Posters Count</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={editForm.posters.count}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        posters: {
                          ...editForm.posters,
                          count: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Delivery Cadence</Label>
                  <Select
                    value={editForm.posters.cadence}
                    onValueChange={(val: any) =>
                      setEditForm({
                        ...editForm,
                        posters: { ...editForm.posters, cadence: val },
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily" className="text-xs">Approximately Daily</SelectItem>
                      <SelectItem value="alternate" className="text-xs">Alternate Days</SelectItem>
                      <SelectItem value="custom" className="text-xs">Custom Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reels Scope */}
            <div className="rounded-xl border p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-purple-500" />
                  <span>Reels Deliverables</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={editForm.reels.count === 4 ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        reels: { count: 4, cadence: "weekly" },
                      })
                    }
                  >
                    4 (1 / week)
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.reels.count === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        reels: { count: 0, cadence: "weekly" },
                      })
                    }
                  >
                    0 (None)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Monthly Reels Target</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={editForm.reels.count}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        reels: {
                          ...editForm.reels,
                          count: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Frequency</Label>
                  <Input
                    value={editForm.reels.count > 0 ? "1 reel each per week" : "Not in scope"}
                    readOnly
                    className="mt-1 h-8 text-xs bg-muted text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Paid Ads & SEO Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Meta Ads */}
              <div className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5 text-blue-500" /> Meta Ads
                  </Label>
                  <input
                    type="checkbox"
                    checked={editForm.metaAds.enabled}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        metaAds: { ...editForm.metaAds, enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                </div>
                {editForm.metaAds.enabled && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Monthly Ad Spend (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.metaAds.monthlyBudget}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          metaAds: {
                            ...editForm.metaAds,
                            monthlyBudget: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-red-500" /> Google Ads
                  </Label>
                  <input
                    type="checkbox"
                    checked={editForm.googleAds.enabled}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        googleAds: { ...editForm.googleAds, enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                </div>
                {editForm.googleAds.enabled && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Monthly Ad Spend (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.googleAds.monthlyBudget}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          googleAds: {
                            ...editForm.googleAds,
                            monthlyBudget: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* GMB / SEO */}
              <div className="rounded-xl border p-3 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-emerald-500" /> GMB / SEO
                </Label>
                <div>
                  <Select
                    value={editForm.seoGmb.type}
                    onValueChange={(val: any) =>
                      setEditForm({
                        ...editForm,
                        seoGmb: { ...editForm.seoGmb, type: val },
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None" className="text-xs">None</SelectItem>
                      <SelectItem value="GMB" className="text-xs">GMB Only</SelectItem>
                      <SelectItem value="SEO" className="text-xs">SEO Only</SelectItem>
                      <SelectItem value="Both" className="text-xs">Both (GMB + SEO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-semibold">Special Retainer Notes / Campaign Brief</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Enter client instructions, offers, or specific deliverable requirements..."
                className="mt-1 text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowConfigModal(false)} disabled={isSavingScope}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={isSavingScope} className="font-semibold gap-1.5">
              {isSavingScope && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSavingScope ? "Saving to Database..." : "Save Monthly Scope"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A4 PRINT / EXPORT PLANNER SHEET MODAL */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 font-sans">
          <div className="space-y-6 text-foreground print:p-0" id="print-planner-sheet">
            {/* Header */}
            <div className="border-b pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-primary">DIGITALNESS</h1>
                <p className="text-xs tracking-wider uppercase font-semibold text-muted-foreground">
                  INDUSTRIES LLP | INTERNAL OPERATIONS
                </p>
                <h2 className="text-lg font-bold mt-2">Active Clients Monthly Planner</h2>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p><strong>Month / Year:</strong> {scope.monthName}</p>
                <p><strong>Owner:</strong> {customer?.assignedTo?.name || "Operations Team"}</p>
                <p><strong>Client:</strong> {customerName}</p>
              </div>
            </div>

            {/* Scope Matrix Table */}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted text-foreground uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-2 border">Client</th>
                    <th className="p-2 border text-center">Meta Ads</th>
                    <th className="p-2 border text-center">Google Ads</th>
                    <th className="p-2 border text-center">GMB / SEO</th>
                    <th className="p-2 border text-center">Posters</th>
                    <th className="p-2 border text-center">Reels</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border font-semibold">{customerName}</td>
                    <td className="p-2.5 border text-center font-bold">{scope.metaAds.enabled ? "Yes" : "-"}</td>
                    <td className="p-2.5 border text-center font-bold">{scope.googleAds.enabled ? "Yes" : "-"}</td>
                    <td className="p-2.5 border text-center font-bold">{scope.seoGmb.type !== "None" ? scope.seoGmb.type : "-"}</td>
                    <td className="p-2.5 border text-center font-bold">{scope.posters.count || "-"}</td>
                    <td className="p-2.5 border text-center font-bold">{scope.reels.count || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Monthly Delivery Schedule */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b pb-1">
                Monthly Delivery Schedule
              </h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <p><strong>CONTENT:</strong> {scope.posters.count} posters: {scope.posters.cadence === "daily" ? "approximately daily" : "alternate days"}.</p>
                <p><strong>REELS:</strong> {scope.reels.count > 0 ? `${scope.reels.count} reels: 1 reel each per week.` : "Not in scope."}</p>
                <p><strong>WEEK 1:</strong> Confirm offers, assets and approvals; review campaigns and tracking.</p>
                <p><strong>WEEK 2:</strong> Publish content; review enquiries, lead quality and GMB updates.</p>
                <p><strong>WEEK 3:</strong> Continue delivery; review budget pacing and campaign performance.</p>
                <p><strong>WEEK 4:</strong> Complete {scope.posters.count} posters and {scope.reels.count} reels; send reports; plan next month.</p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Notes</h3>
              <p className="text-xs text-muted-foreground p-3 rounded-lg border bg-muted/20 min-h-[50px]">
                {scope.notes || "None recorded."}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t flex justify-between items-center text-[11px] text-muted-foreground">
              <span>digitalness.co.in | sales@digitalness.co.in</span>
              <span>A4 | Monthly planning sheet</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)}>
              Close
            </Button>
            <Button size="sm" onClick={() => window.print()} className="font-semibold gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
