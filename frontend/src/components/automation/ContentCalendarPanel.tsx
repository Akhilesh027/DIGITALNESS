import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  Play,
  RefreshCw,
  Layers,
  Flag,
  Flame,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  previewContentCalendar,
  generateContentCalendar,
  batchApproveCalendarItems,
  getOpportunities,
  getClientCalendar,
  CalendarItem,
  ContentCalendarData,
} from "@/api/automationApi";
import { ContentCalendarGrid } from "./ContentCalendarGrid";

interface ContentCalendarPanelProps {
  customers: any[];
}

export const ContentCalendarPanel: React.FC<ContentCalendarPanelProps> = ({ customers }) => {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [opportunities, setOpportunities] = useState<any>(null);
  const [activeCalendar, setActiveCalendar] = useState<ContentCalendarData | null>(null);
  const [previewItems, setPreviewItems] = useState<CalendarItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const loadClientData = async (clientId: string) => {
    if (!clientId) return;
    try {
      setLoading(true);
      const [cals, opps] = await Promise.all([
        getClientCalendar(clientId).catch(() => []),
        getOpportunities(30, "SALON", targetMonth).catch(() => null),
      ]);
      setOpportunities(opps);

      const currentPeriodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
      const matchingCal = cals.find((c) => c.period.formatted === currentPeriodStr);
      if (matchingCal) {
        setActiveCalendar(matchingCal);
        setPreviewItems(matchingCal.items || []);
        setSelectedKeys([]);
      } else {
        setActiveCalendar(null);
        setPreviewItems([]);
        setSelectedKeys([]);
      }
    } catch (err: any) {
      toast({ title: "Failed to load calendar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0]._id);
      loadClientData(customers[0]._id);
    }
  }, [customers]);

  const handleGeneratePreview = async () => {
    if (!selectedCustomerId) return;
    try {
      setGenerating(true);
      const preview = await previewContentCalendar({
        customerId: selectedCustomerId,
        month: targetMonth,
        year: targetYear,
        duration: 30,
      });

      setPreviewItems(preview.items);
      setSelectedKeys(preview.items.map((i) => i.itemKey));
      toast({
        title: "Autonomous Content Generated! ✨",
        description: `Generated ${preview.items.length} content topics across festivals, seasonal hooks, and core services.`,
      });
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndApprove = async () => {
    if (!selectedCustomerId || previewItems.length === 0) return;
    try {
      setGenerating(true);
      // 1. Save Calendar
      const genRes = await generateContentCalendar({
        customerId: selectedCustomerId,
        month: targetMonth,
        year: targetYear,
        items: previewItems,
      });

      // 2. Batch Approve
      if (genRes.calendarId) {
        await batchApproveCalendarItems(genRes.calendarId, selectedKeys);
      }

      toast({
        title: "Content Calendar Approved! 🚀",
        description: `Approved ${selectedKeys.length} posts and handed off briefs to Creative Agents.`,
      });

      await loadClientData(selectedCustomerId);
    } catch (err: any) {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedKeys.length === previewItems.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(previewItems.map((i) => i.itemKey));
    }
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Autonomous Content Intelligence & Creative Calendar Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates monthly festival, seasonal, and service copy briefs mapping directly onto client deliverable slots.
            </p>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs w-fit">
            Phase 5C Engine
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Client</label>
            <Select
              value={selectedCustomerId}
              onValueChange={(val) => {
                setSelectedCustomerId(val);
                loadClientData(val);
              }}
            >
              <SelectTrigger className="bg-slate-50 text-xs">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Month</label>
            <Select
              value={String(targetMonth)}
              onValueChange={(val) => {
                setTargetMonth(Number(val));
                if (selectedCustomerId) loadClientData(selectedCustomerId);
              }}
            >
              <SelectTrigger className="bg-slate-50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label} {targetYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <Button
              onClick={handleGeneratePreview}
              disabled={generating || !selectedCustomerId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 h-9 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Crafting Calendar..." : "Generate AI Content Calendar"}
            </Button>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <Button
              onClick={handleSaveAndApprove}
              disabled={generating || previewItems.length === 0 || selectedKeys.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 h-9 shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Approve ({selectedKeys.length}) & Trigger Production
            </Button>
          </div>
        </div>

        {/* UPCOMING OPPORTUNITIES CAROUSEL */}
        {opportunities && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Detected Marketing Hooks & Festivals for {months.find((m) => m.value === targetMonth)?.label}:
              </span>
              <span className="text-[11px] text-slate-400">
                {opportunities.festivalsCount} Festivals • {opportunities.seasonalCount} Seasonal Hooks
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              {(opportunities.festivals || []).map((f: any) => (
                <Badge key={f.slug} className="bg-rose-50 text-rose-800 border-rose-200 text-[11px] font-semibold gap-1">
                  <Flag className="w-3 h-3 text-rose-600" />
                  {f.name} ({new Date(f.date).toLocaleDateString([], { month: "short", day: "numeric" })})
                </Badge>
              ))}
              {(opportunities.seasonal || []).map((s: any) => (
                <Badge key={s.slug} className="bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-semibold gap-1">
                  🌿 {s.title}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CALENDAR GRID */}
      {previewItems.length > 0 ? (
        <ContentCalendarGrid
          items={previewItems}
          selectedKeys={selectedKeys}
          onToggleKey={handleToggleKey}
          onSelectAll={handleSelectAll}
          onApproveSingle={(itemKey) => {
            if (activeCalendar) {
              batchApproveCalendarItems(activeCalendar._id, [itemKey]);
              toast({ title: "Item Approved", description: `Item ${itemKey} approved.` });
            }
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Content Calendar Staged Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>Generate AI Content Calendar</strong> above to autonomously scan upcoming festivals and industry hooks to build a ready-to-produce calendar.
          </p>
        </div>
      )}
    </div>
  );
};
