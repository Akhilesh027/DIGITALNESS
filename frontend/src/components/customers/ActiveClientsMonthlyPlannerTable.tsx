import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Video,
  Image as ImageIcon,
  Megaphone,
  Globe,
  Plus,
  AlertCircle,
  Building2,
  User,
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

interface ActiveClientsMonthlyPlannerTableProps {
  customers: any[];
  works: any[];
  employees: any[];
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

export default function ActiveClientsMonthlyPlannerTable({
  customers,
  works,
  employees,
  onRefresh,
  apiUrl,
  authConfig,
}: ActiveClientsMonthlyPlannerTableProps) {
  const { toast } = useToast();
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[1]?.value || "2026-10");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [generatingCustomerId, setGeneratingCustomerId] = useState<string | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Edit Scope Modal State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isSavingScope, setIsSavingScope] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    postersCount: 30,
    postersCadence: "daily" as "daily" | "alternate" | "custom",
    reelsCount: 4,
    reelsCadence: "weekly" as "weekly" | "custom",
    metaAdsEnabled: false,
    metaMonthlyBudget: 0,
    googleAdsEnabled: false,
    googleMonthlyBudget: 0,
    seoGmbType: "None" as "None" | "GMB" | "SEO" | "Both",
    targetKeywords: "",
    assignedManagerId: "",
    notes: "",
  });

  const selectedMonthName = useMemo(() => {
    return monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  }, [selectedMonth, monthOptions]);

  // Open edit scope modal
  const openEditScope = (customer: any) => {
    const dbScope = customer?.monthlyDeliverablesScope || {};
    const adsProfile = customer?.adsProfile || {};

    setEditingCustomer(customer);
    setEditForm({
      postersCount: dbScope.postersCount !== undefined ? Number(dbScope.postersCount) : 30,
      postersCadence: dbScope.postersCadence || "daily",
      reelsCount: dbScope.reelsCount !== undefined ? Number(dbScope.reelsCount) : 4,
      reelsCadence: dbScope.reelsCadence || "weekly",
      metaAdsEnabled: dbScope.metaAdsEnabled !== undefined ? Boolean(dbScope.metaAdsEnabled) : Boolean(adsProfile.monthlyMetaBudget > 0),
      metaMonthlyBudget: Number(dbScope.metaMonthlyBudget || adsProfile.monthlyMetaBudget || 0),
      googleAdsEnabled: dbScope.googleAdsEnabled !== undefined ? Boolean(dbScope.googleAdsEnabled) : Boolean(adsProfile.monthlyGoogleBudget > 0),
      googleMonthlyBudget: Number(dbScope.googleMonthlyBudget || adsProfile.monthlyGoogleBudget || 0),
      seoGmbType: dbScope.seoGmbType || (customer.businessType?.toLowerCase().includes("clinic") ? "GMB" : "SEO"),
      targetKeywords: dbScope.targetKeywords || customer.brandProfile?.tone || "",
      assignedManagerId: dbScope.assignedManagerId || customer.assignedManager || customer.assignedTo || employees[0]?._id || "",
      notes: dbScope.notes || "",
    });
  };

  // Save edited scope to backend
  const handleSaveScope = async () => {
    if (!editingCustomer) return;
    setIsSavingScope(true);
    try {
      const customerId = editingCustomer._id || editingCustomer.id;
      const payload = {
        monthlyDeliverablesScope: {
          monthYear: selectedMonth,
          ...editForm,
        },
        adsProfile: {
          monthlyMetaBudget: editForm.metaMonthlyBudget,
          monthlyGoogleBudget: editForm.googleMonthlyBudget,
        },
      };

      const res = await fetch(`${apiUrl}/customers/${customerId}`, {
        method: "PUT",
        ...authConfig,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save client scope to backend");

      toast({
        title: "Monthly Scope Saved",
        description: `Updated deliverable targets in database for ${editingCustomer.name}.`,
      });

      setEditingCustomer(null);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save scope to server.",
        variant: "destructive",
      });
    } finally {
      setIsSavingScope(false);
    }
  };

  // Build client row data with deliverable metrics
  const clientRows = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const mNum = parseInt(monthStr, 10);
    const yNum = parseInt(yearStr, 10);
    const totalDays = getDaysInMonth(selectedMonth);
    const today = new Date();
    const currentDay = Math.min(today.getDate(), totalDays);

    return customers.map((c, index) => {
      const cId = c._id || c.id;
      const dbScope = c.monthlyDeliverablesScope || {};
      const adsProfile = c.adsProfile || {};

      // Effective scope targets
      const metaAdsEnabled =
        dbScope.metaAdsEnabled !== undefined
          ? Boolean(dbScope.metaAdsEnabled)
          : Boolean(adsProfile.monthlyMetaBudget && adsProfile.monthlyMetaBudget > 0);
      const metaBudget = Number(dbScope.metaMonthlyBudget || adsProfile.monthlyMetaBudget || 0);

      const googleAdsEnabled =
        dbScope.googleAdsEnabled !== undefined
          ? Boolean(dbScope.googleAdsEnabled)
          : Boolean(adsProfile.monthlyGoogleBudget && adsProfile.monthlyGoogleBudget > 0);
      const googleBudget = Number(dbScope.googleMonthlyBudget || adsProfile.monthlyGoogleBudget || 0);

      const seoGmbType =
        dbScope.seoGmbType ||
        (c.businessType?.toLowerCase().includes("clinic") || c.businessType?.toLowerCase().includes("furniture")
          ? "GMB"
          : c.businessType?.toLowerCase().includes("law") || c.businessType?.toLowerCase().includes("banquet")
          ? "SEO"
          : "None");

      const postersTarget = dbScope.postersCount !== undefined ? Number(dbScope.postersCount) : 30;
      const postersCadence = dbScope.postersCadence || "daily";

      const reelsTarget = dbScope.reelsCount !== undefined ? Number(dbScope.reelsCount) : 4;

      // Real work items for this client and month
      const clientWorks = works.filter((w) => {
        const wCustId = w.customer?._id || w.customer?.id || w.customer || w.customerId;
        if (String(wCustId) !== String(cId)) return false;
        if (w.title?.toLowerCase().includes("monthly retainer execution")) return false;

        const d = w.dueDate ? new Date(w.dueDate) : null;
        if (!d || isNaN(d.getTime())) return true;
        return d.getMonth() + 1 === mNum && d.getFullYear() === yNum;
      });

      // Deliverable counts
      const posterWorks = clientWorks.filter((w) => w.title?.toLowerCase().includes("poster") || w.channel === "Poster");
      const completedPosters = posterWorks.filter((w) => w.status === "Completed" || w.status === "Approved").length;

      const reelWorks = clientWorks.filter((w) => w.title?.toLowerCase().includes("reel") || w.channel === "Reel");
      const completedReels = reelWorks.filter((w) => w.status === "Completed" || w.status === "Approved").length;

      // Pacing calculation
      const expectedPosters = Math.round((currentDay / totalDays) * postersTarget);
      const posterDiff = completedPosters - expectedPosters;
      let paceLabel = "On Track";
      let paceVariant = "default";
      if (posterDiff > 1) {
        paceLabel = "Ahead";
        paceVariant = "success";
      } else if (posterDiff < -2) {
        paceLabel = "Behind";
        paceVariant = "destructive";
      }

      return {
        index: index + 1,
        customer: c,
        id: cId,
        name: c.name || "Client",
        companyName: c.companyName || c.businessType || "Company",
        city: c.city || "Hyderabad",
        metaAdsEnabled,
        metaBudget,
        googleAdsEnabled,
        googleBudget,
        seoGmbType,
        postersTarget,
        postersCadence,
        completedPosters,
        reelsTarget,
        completedReels,
        totalDeliverables: clientWorks.length,
        paceLabel,
        paceVariant,
        lastGeneratedAt: dbScope.lastGeneratedAt,
      };
    });
  }, [customers, works, selectedMonth]);

  // Filtered rows based on search
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return clientRows;
    const q = tableSearch.toLowerCase();
    return clientRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.seoGmbType.toLowerCase().includes(q)
    );
  }, [clientRows, tableSearch]);

  // Totals reconciliation row matching the PDF
  const totals = useMemo(() => {
    let totalMeta = 0;
    let totalGoogle = 0;
    let totalSeoGmb = 0;
    let totalPosters = 0;
    let totalCompletedPosters = 0;
    let totalReels = 0;
    let totalCompletedReels = 0;

    clientRows.forEach((r) => {
      if (r.metaAdsEnabled) totalMeta++;
      if (r.googleAdsEnabled) totalGoogle++;
      if (r.seoGmbType !== "None") totalSeoGmb++;
      totalPosters += r.postersTarget;
      totalCompletedPosters += r.completedPosters;
      totalReels += r.reelsTarget;
      totalCompletedReels += r.completedReels;
    });

    return {
      totalClients: clientRows.length,
      totalMeta,
      totalGoogle,
      totalSeoGmb,
      totalPosters,
      totalCompletedPosters,
      totalReels,
      totalCompletedReels,
    };
  }, [clientRows]);

  // Generate 1-Month Tasks for a single client
  const handleGenerateTasksForClient = async (row: any) => {
    setGeneratingCustomerId(row.id);
    try {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const totalDays = getDaysInMonth(selectedMonth);

      const managerId =
        row.customer.assignedManager || row.customer.assignedTo || employees[0]?._id;

      // Construct tasks array
      const tasksPayload: any[] = [];

      // 1. Posters
      if (row.postersTarget > 0) {
        if (row.postersCadence === "daily" || row.postersTarget === 30) {
          for (let day = 1; day <= Math.min(30, totalDays); day++) {
            const dateStr = new Date(year, month - 1, day, 18, 0).toISOString();
            tasksPayload.push({
              title: `Poster #${String(day).padStart(2, "0")}: Daily Creative & Copy for ${row.name}`,
              workType: "Social Media & Creatives",
              priority: day <= 7 ? "High" : "Medium",
              dueDate: dateStr,
              deliverables: 1,
              description: `Daily static poster creative for ${row.name}.`,
              category: "Poster",
              assignedTo: [managerId],
            });
          }
        } else {
          let count = 0;
          for (let day = 1; day <= totalDays && count < row.postersTarget; day += 2) {
            count++;
            const dateStr = new Date(year, month - 1, day, 18, 0).toISOString();
            tasksPayload.push({
              title: `Poster #${String(count).padStart(2, "0")} (Alternate Day): Visual Creative for ${row.name}`,
              workType: "Social Media & Creatives",
              priority: "Medium",
              dueDate: dateStr,
              deliverables: 1,
              description: `Alternate-day brand creative poster for ${row.name}.`,
              category: "Poster",
              assignedTo: [managerId],
            });
          }
        }
      }

      // 2. Reels
      if (row.reelsTarget > 0) {
        const reelMilestones = [
          { day: 7, title: `Reel #01: Scripting, Hook Concept & Audio Selection for ${row.name}` },
          { day: 14, title: `Reel #02: Video Production & B-Roll Editing for ${row.name}` },
          { day: 21, title: `Reel #03: Trend Audio Sync & Value Proposition Cut for ${row.name}` },
          { day: 28, title: `Reel #04: Monthly Recap & High-Impact Brand Showcase for ${row.name}` },
        ];
        for (let i = 0; i < row.reelsTarget; i++) {
          const m = reelMilestones[i] || { day: (i + 1) * 7, title: `Reel #${String(i + 1).padStart(2, "0")} for ${row.name}` };
          const dateStr = new Date(year, month - 1, m.day, 18, 0).toISOString();
          tasksPayload.push({
            title: m.title,
            workType: "Video & Motion Graphics",
            priority: "High",
            dueDate: dateStr,
            deliverables: 1,
            description: `Weekly video reel deliverable for ${row.name}.`,
            category: "Reel",
            assignedTo: [managerId],
          });
        }
      }

      // 3. Meta Ads
      if (row.metaAdsEnabled) {
        const metaSteps = [
          { day: 5, title: `Meta Ads - Week 1: Offers, Creative Assets & Tracking Pixel Setup for ${row.name}` },
          { day: 12, title: `Meta Ads - Week 2: Inquiry Flow & Lead Quality Audit for ${row.name}` },
          { day: 19, title: `Meta Ads - Week 3: Mid-Month Budget Pacing & Ad Creative Refresh for ${row.name}` },
          { day: 27, title: `Meta Ads - Week 4: ROAS Audit, Monthly Ad Report & Scaling Strategy for ${row.name}` },
        ];
        metaSteps.forEach((s) => {
          tasksPayload.push({
            title: s.title,
            workType: "Performance Marketing",
            priority: "High",
            dueDate: new Date(year, month - 1, s.day, 18, 0).toISOString(),
            deliverables: 1,
            description: "Weekly Meta Ads campaign management milestone.",
            category: "Meta Ads",
            assignedTo: [managerId],
          });
        });
      }

      // 4. Google Ads
      if (row.googleAdsEnabled) {
        const googleSteps = [
          { day: 6, title: `Google Ads - Week 1: Search Keywords, Conversion Tags & Bidding Setup for ${row.name}` },
          { day: 13, title: `Google Ads - Week 2: Search Terms & Negative Keywords Audit for ${row.name}` },
          { day: 20, title: `Google Ads - Week 3: Budget Pacing, Device Adjustments & Bid Optimization for ${row.name}` },
          { day: 28, title: `Google Ads - Week 4: Search Impression Share & Cost/Lead Summary for ${row.name}` },
        ];
        googleSteps.forEach((s) => {
          tasksPayload.push({
            title: s.title,
            workType: "Google Ads & PPC",
            priority: "High",
            dueDate: new Date(year, month - 1, s.day, 18, 0).toISOString(),
            deliverables: 1,
            description: "Weekly Google Ads optimization milestone.",
            category: "Google Ads",
            assignedTo: [managerId],
          });
        });
      }

      // 5. GMB / SEO
      if (row.seoGmbType !== "None") {
        const seoSteps = [
          { day: 7, title: `GMB / SEO - Week 1: Profile Audit & Target Keyword Review for ${row.name}` },
          { day: 14, title: `GMB / SEO - Week 2: GMB Weekly Offer Post & Review Replies for ${row.name}` },
          { day: 21, title: `GMB / SEO - Week 3: Local Citations Check & Backlink Quality Scan for ${row.name}` },
          { day: 29, title: `GMB / SEO - Week 4: Organic Search Visibility & Discovery Report for ${row.name}` },
        ];
        seoSteps.forEach((s) => {
          tasksPayload.push({
            title: s.title,
            workType: "SEO & Local Search",
            priority: "Medium",
            dueDate: new Date(year, month - 1, s.day, 18, 0).toISOString(),
            deliverables: 1,
            description: "Weekly GMB & SEO organic ranking milestone.",
            category: "GMB / SEO",
            assignedTo: [managerId],
          });
        });
      }

      // 6. Operations Milestones
      const milestones = [
        { day: 7, title: `Operations Milestone: Week 1 - Confirm offers, assets and tracking for ${row.name}` },
        { day: 14, title: `Operations Milestone: Week 2 - Publish content; review enquiries & GMB for ${row.name}` },
        { day: 21, title: `Operations Milestone: Week 3 - Continue delivery; review budget pacing for ${row.name}` },
        { day: Math.min(totalDays, 30), title: `Operations Milestone: Week 4 - Complete deliverables ledger; send reports for ${row.name}` },
      ];
      milestones.forEach((m) => {
        tasksPayload.push({
          title: m.title,
          workType: "Operations & Management",
          priority: "Urgent",
          dueDate: new Date(year, month - 1, m.day, 18, 0).toISOString(),
          deliverables: 1,
          description: "Internal operations milestone from Digitalness Monthly Delivery Schedule.",
          category: "Milestone",
          assignedTo: [managerId],
        });
      });

      // Call Backend batch creation endpoint
      const batchRes = await fetch(`${apiUrl}/works/monthly-batch`, {
        method: "POST",
        ...authConfig,
        body: JSON.stringify({
          customerId: row.id,
          monthYear: selectedMonth,
          monthName: selectedMonthName,
          tasks: tasksPayload,
          scope: {
            posters: { count: row.postersTarget, cadence: row.postersCadence },
            reels: { count: row.reelsTarget, cadence: "weekly" },
            metaAds: { enabled: row.metaAdsEnabled, monthlyBudget: row.metaBudget },
            googleAds: { enabled: row.googleAdsEnabled, monthlyBudget: row.googleBudget },
            seoGmb: { type: row.seoGmbType },
            assignedManagerId: managerId,
          },
        }),
      });

      if (!batchRes.ok) throw new Error("Failed to generate tasks in backend");

      toast({
        title: "Monthly Tasks Generated in Database!",
        description: `Successfully created ${tasksPayload.length} scheduled deliverable tasks for ${row.name}.`,
      });

      onRefresh();
    } catch (err: any) {
      toast({
        title: "Generation Error",
        description: err.message || "Failed to generate tasks.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCustomerId(null);
    }
  };

  // Bulk Generate Tasks for all filtered clients
  const handleBulkGenerate = async () => {
    setIsBulkGenerating(true);
    let successCount = 0;
    try {
      for (const row of filteredRows) {
        await handleGenerateTasksForClient(row);
        successCount++;
      }
      toast({
        title: "Bulk Generation Complete",
        description: `Generated 1-month task rosters for ${successCount} clients.`,
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Bulk Generation Finished with Warnings",
        description: `Processed ${successCount} clients.`,
      });
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Table Header Bar */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Active Clients Monthly Planner (Table Form)
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedMonthName}
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Internal operations monthly deliverable matrix, channel allocation & live delivery progress.
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

            {/* Print A4 Sheet */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>A4 Planner Sheet</span>
            </Button>

            {/* Bulk Generate Tasks */}
            <Button
              size="sm"
              onClick={handleBulkGenerate}
              disabled={isBulkGenerating}
              className="h-9 gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              {isBulkGenerating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>Generate All Monthly Tasks</span>
            </Button>
          </div>
        </div>

        {/* Search & Quick Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search active client, brand or city in planner..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Displaying <strong className="text-foreground">{filteredRows.length}</strong> active client retainers
          </div>
        </div>
      </div>

      {/* Main Monthly Planner Table (Matching internal operations sheet) */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="bg-muted/70 text-foreground uppercase tracking-wider font-bold border-b text-[11px]">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Megaphone className="h-3 w-3 text-blue-500" />
                    <span>Meta Ads</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3 text-red-500" />
                    <span>Google Ads</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Search className="h-3 w-3 text-emerald-500" />
                    <span>GMB / SEO</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ImageIcon className="h-3 w-3 text-amber-500" />
                    <span>Posters</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Video className="h-3 w-3 text-purple-500" />
                    <span>Reels</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">Pace / Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => {
                const isCurrentGenerating = generatingCustomerId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 text-center font-mono text-muted-foreground text-[11px]">
                      {row.index}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-foreground text-xs sm:text-sm">
                        {row.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{row.companyName}</span>
                        <span>•</span>
                        <span>{row.city}</span>
                      </div>
                    </td>

                    {/* Meta Ads */}
                    <td className="p-3.5 text-center">
                      {row.metaAdsEnabled ? (
                        <Badge variant="completed" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px] font-semibold">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </td>

                    {/* Google Ads */}
                    <td className="p-3.5 text-center">
                      {row.googleAdsEnabled ? (
                        <Badge variant="completed" className="bg-red-500/10 text-red-700 border-red-500/30 text-[10px] font-semibold">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </td>

                    {/* GMB / SEO */}
                    <td className="p-3.5 text-center">
                      {row.seoGmbType !== "None" ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold">
                          {row.seoGmbType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </td>

                    {/* Posters */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground text-xs">
                          {row.postersTarget > 0 ? row.postersTarget : "—"}
                        </span>
                        {row.postersTarget > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {row.completedPosters}/{row.postersTarget} done
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reels */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground text-xs">
                          {row.reelsTarget > 0 ? row.reelsTarget : "—"}
                        </span>
                        {row.reelsTarget > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {row.completedReels}/{row.reelsTarget} done
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pacing */}
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={
                          row.paceVariant === "success"
                            ? "completed"
                            : row.paceVariant === "destructive"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] font-mono"
                      >
                        {row.paceLabel}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditScope(row.customer)}
                          className="h-7 text-[11px] px-2 font-medium"
                          title="Configure Scope"
                        >
                          <SlidersHorizontal className="h-3 w-3 mr-1" />
                          <span>Scope</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleGenerateTasksForClient(row)}
                          disabled={isCurrentGenerating}
                          className="h-7 text-[11px] px-2.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                        >
                          {isCurrentGenerating ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span>Generate</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (window.location.href = `/client-portal?customer=${row.id}`)}
                          className="h-7 w-7 p-0"
                          title="Open Client Portal"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TOTALS RECONCILIATION FOOTER (FROM OPERATIONS SHEET) */}
            <tfoot className="bg-muted/80 font-bold border-t-2 border-foreground/10 text-xs">
              <tr>
                <td className="p-3.5 text-center font-bold">TOTAL</td>
                <td className="p-3.5 font-bold text-foreground">
                  {totals.totalClients} Active Clients
                </td>
                <td className="p-3.5 text-center font-extrabold text-blue-700">
                  {totals.totalMeta}
                </td>
                <td className="p-3.5 text-center font-extrabold text-red-700">
                  {totals.totalGoogle}
                </td>
                <td className="p-3.5 text-center font-extrabold text-emerald-700">
                  {totals.totalSeoGmb}
                </td>
                <td className="p-3.5 text-center font-extrabold text-amber-700">
                  {totals.totalPosters}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    ({totals.totalCompletedPosters} completed)
                  </span>
                </td>
                <td className="p-3.5 text-center font-extrabold text-purple-700">
                  {totals.totalReels}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    ({totals.totalCompletedReels} completed)
                  </span>
                </td>
                <td className="p-3.5 text-center font-semibold text-muted-foreground" colSpan={2}>
                  Totals count active client scopes. "-" = not in scope.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MONTHLY DELIVERY SCHEDULE REFERENCE BOX (FROM OPERATIONS SHEET) */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
            Monthly Delivery Schedule Guidelines
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
            <span className="font-bold text-primary">CONTENT CADENCE</span>
            <p className="text-muted-foreground text-[11px]">
              30 posters: approximately daily | 15 posters: alternate days.
            </p>
          </div>
          <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
            <span className="font-bold text-primary">REELS CADENCE</span>
            <p className="text-muted-foreground text-[11px]">
              1 reel each per week; 4 reels each per month.
            </p>
          </div>
          <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
            <span className="font-bold text-primary">WEEK 1 & 2 MILESTONES</span>
            <p className="text-muted-foreground text-[11px]">
              W1: Confirm offers, assets, tracking. W2: Content publishing & enquiries review.
            </p>
          </div>
          <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
            <span className="font-bold text-primary">WEEK 3 & 4 MILESTONES</span>
            <p className="text-muted-foreground text-[11px]">
              W3: Budget pacing & ad refresh. W4: Complete deliverables & send monthly report.
            </p>
          </div>
        </div>
      </div>

      {/* EDIT SCOPE MODAL */}
      <Dialog open={Boolean(editingCustomer)} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span>Configure Scope: {editingCustomer?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Set monthly targets for Meta Ads, Google Ads, GMB/SEO, Posters, and Reels. Saves directly to database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Posters */}
            <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Posters Target</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editForm.postersCount === 30 ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditForm({ ...editForm, postersCount: 30, postersCadence: "daily" })}
                  >
                    30 (Daily)
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.postersCount === 15 ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditForm({ ...editForm, postersCount: 15, postersCadence: "alternate" })}
                  >
                    15 (Alternate)
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Monthly Posters Count</Label>
                  <Input
                    type="number"
                    value={editForm.postersCount}
                    onChange={(e) => setEditForm({ ...editForm, postersCount: parseInt(e.target.value, 10) || 0 })}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Cadence</Label>
                  <Select
                    value={editForm.postersCadence}
                    onValueChange={(val: any) => setEditForm({ ...editForm, postersCadence: val })}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily" className="text-xs">Approximately Daily</SelectItem>
                      <SelectItem value="alternate" className="text-xs">Alternate Days</SelectItem>
                      <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reels */}
            <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-purple-500" />
                  <span>Reels Target</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editForm.reelsCount === 4 ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditForm({ ...editForm, reelsCount: 4 })}
                  >
                    4 (1 / week)
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.reelsCount === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditForm({ ...editForm, reelsCount: 0 })}
                  >
                    0 (None)
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Monthly Reels Count</Label>
                <Input
                  type="number"
                  value={editForm.reelsCount}
                  onChange={(e) => setEditForm({ ...editForm, reelsCount: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* Paid Ads & SEO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <Megaphone className="h-3 w-3 text-blue-500" /> Meta Ads
                  </span>
                  <input
                    type="checkbox"
                    checked={editForm.metaAdsEnabled}
                    onChange={(e) => setEditForm({ ...editForm, metaAdsEnabled: e.target.checked })}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                </div>
                {editForm.metaAdsEnabled && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Budget (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.metaMonthlyBudget}
                      onChange={(e) => setEditForm({ ...editForm, metaMonthlyBudget: parseInt(e.target.value, 10) || 0 })}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <Globe className="h-3 w-3 text-red-500" /> Google Ads
                  </span>
                  <input
                    type="checkbox"
                    checked={editForm.googleAdsEnabled}
                    onChange={(e) => setEditForm({ ...editForm, googleAdsEnabled: e.target.checked })}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                </div>
                {editForm.googleAdsEnabled && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Budget (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.googleMonthlyBudget}
                      onChange={(e) => setEditForm({ ...editForm, googleMonthlyBudget: parseInt(e.target.value, 10) || 0 })}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-2.5 space-y-1.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <Search className="h-3 w-3 text-emerald-500" /> GMB / SEO
                </span>
                <Select
                  value={editForm.seoGmbType}
                  onValueChange={(val: any) => setEditForm({ ...editForm, seoGmbType: val })}
                >
                  <SelectTrigger className="mt-0.5 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None" className="text-xs">None</SelectItem>
                    <SelectItem value="GMB" className="text-xs">GMB Only</SelectItem>
                    <SelectItem value="SEO" className="text-xs">SEO Only</SelectItem>
                    <SelectItem value="Both" className="text-xs">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Notes / Scope Instructions</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="mt-1 text-xs min-h-[50px]"
                placeholder="Client specific monthly deliverables or campaigns..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingCustomer(null)} disabled={isSavingScope}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveScope} disabled={isSavingScope} className="font-semibold gap-1.5">
              {isSavingScope && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSavingScope ? "Saving..." : "Save to Database"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A4 PRINT MODAL (MATCHING USER'S PDF) */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8 font-sans">
          <div className="space-y-5 text-foreground print:p-0" id="print-active-clients-sheet">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-primary">DIGITALNESS</h1>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  INDUSTRIES LLP | INTERNAL OPERATIONS
                </p>
                <h2 className="text-base font-bold mt-1">Active Clients Monthly Planner</h2>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p><strong>Month / Year:</strong> {selectedMonthName}</p>
                <p><strong>Owner:</strong> Internal Operations Team</p>
                <p><strong>Active Clients:</strong> {clientRows.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted text-foreground uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border">CLIENT</th>
                    <th className="p-2 border text-center">META ADS</th>
                    <th className="p-2 border text-center">GOOGLE ADS</th>
                    <th className="p-2 border text-center">GMB / SEO</th>
                    <th className="p-2 border text-center">POSTERS</th>
                    <th className="p-2 border text-center">REELS</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2 border font-medium">
                        {r.name}
                        {r.companyName && r.companyName !== r.name ? ` (${r.companyName})` : ""}
                      </td>
                      <td className="p-2 border text-center font-bold">{r.metaAdsEnabled ? "Yes" : "-"}</td>
                      <td className="p-2 border text-center font-bold">{r.googleAdsEnabled ? "Yes" : "-"}</td>
                      <td className="p-2 border text-center font-bold">{r.seoGmbType !== "None" ? r.seoGmbType : "-"}</td>
                      <td className="p-2 border text-center font-bold">{r.postersTarget || "-"}</td>
                      <td className="p-2 border text-center font-bold">{r.reelsTarget || "-"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted font-bold text-[11px]">
                  <tr>
                    <td className="p-2 border">TOTAL</td>
                    <td className="p-2 border text-center">{totals.totalMeta}</td>
                    <td className="p-2 border text-center">{totals.totalGoogle}</td>
                    <td className="p-2 border text-center">{totals.totalSeoGmb}</td>
                    <td className="p-2 border text-center">{totals.totalPosters}</td>
                    <td className="p-2 border text-center">{totals.totalReels}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="space-y-2 pt-2 border-t text-xs">
              <h3 className="font-extrabold uppercase text-primary">MONTHLY DELIVERY SCHEDULE</h3>
              <p><strong>CONTENT:</strong> 30 posters: approximately daily | 15 posters: alternate days.</p>
              <p><strong>REELS:</strong> Lepakshi and JS Gallor: 1 reel each per week; 4 each per month.</p>
              <p><strong>WEEK 1:</strong> Confirm offers, assets and approvals; review campaigns and tracking.</p>
              <p><strong>WEEK 2:</strong> Publish content; review enquiries, lead quality and GMB updates.</p>
              <p><strong>WEEK 3:</strong> Continue delivery; review budget pacing and campaign performance.</p>
              <p><strong>WEEK 4:</strong> Complete {totals.totalPosters} posters and {totals.totalReels} reels; send reports; plan next month.</p>
            </div>

            <div className="pt-3 border-t flex justify-between items-center text-[11px] text-muted-foreground">
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
              <span>Print A4 Sheet</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
