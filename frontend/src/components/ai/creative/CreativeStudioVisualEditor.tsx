import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  Send,
  RefreshCw,
  Sliders,
  Type,
  Palette,
  Building2,
  Calendar,
  Share2,
  ExternalLink,
  Layers,
  Phone,
  Globe,
  Tag,
  Check,
  Clock,
  ArrowRight,
  Eye,
  MessageSquare,
  Copy,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreativePosterCanvas } from "./CreativePosterCanvas";
import { scheduleCreativeProject } from "@/api/creativeProjectApi";

interface CreativeStudioVisualEditorProps {
  project: any;
  customer: any;
  onClose: () => void;
  onSaveVersion: (newVersionData: any) => Promise<void>;
  onSubmitApproval: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
}

// Helpers for Date & Time
const getFormattedTomorrow = (hours = 10, mins = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, mins, 0, 0);
  const dateStr = d.toISOString().split("T")[0];
  const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  return { dateStr, timeStr, dateObj: d };
};

const getUpcomingSaturday = (hours = 11, mins = 0) => {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hours, mins, 0, 0);
  const dateStr = d.toISOString().split("T")[0];
  const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  return { dateStr, timeStr, dateObj: d };
};

export const CreativeStudioVisualEditor: React.FC<CreativeStudioVisualEditorProps> = ({
  project,
  customer,
  onClose,
  onSaveVersion,
  onSubmitApproval,
  onApprove,
}) => {
  const { toast } = useToast();
  const latestVersion = project?.versions?.[project?.versions?.length - 1];

  const clientLogo = customer?.logoUrl || customer?.logo || customer?.brandProfile?.logoUrl || null;

  // Editable Canvas State (Dynamically initialized from project & version)
  const [headline, setHeadline] = useState(
    latestVersion?.headline || project?.headline || "DIVINE BLESSINGS OF LORD GANESHA"
  );
  const [subheadline, setSubheadline] = useState(
    latestVersion?.subheadline ||
      project?.subheadline ||
      "May Lord Ganesha bless every new beginning with wisdom, prosperity, and boundless success."
  );
  const [offerText, setOfferText] = useState(
    latestVersion?.offerText || project?.offerText || "FESTIVE CELEBRATION SPECIAL"
  );
  const [ctaText, setCtaText] = useState(
    latestVersion?.ctaText || project?.ctaText || "Warm Festive Greetings"
  );
  const [phone, setPhone] = useState(
    latestVersion?.phone || customer?.contactNumbers?.[0] || customer?.phone || "+91 98765 43214"
  );
  const [website, setWebsite] = useState(
    latestVersion?.website || customer?.website || "www.digitalness.agency"
  );
  const [locationName, setLocationName] = useState(
    latestVersion?.locationName || customer?.city || "Hyderabad HQ"
  );
  const [layoutTheme, setLayoutTheme] = useState<string>(
    latestVersion?.layoutTheme || project?.layoutTheme || "gold_luxury"
  );

  // Visual & Colors
  const [primaryColor, setPrimaryColor] = useState(
    latestVersion?.primaryColor || customer?.brandProfile?.brandColors?.[0] || customer?.primaryColor || "#78350F"
  );
  const [accentColor, setAccentColor] = useState(
    latestVersion?.accentColor || customer?.brandProfile?.brandColors?.[1] || customer?.accentColor || "#F59E0B"
  );
  const [secondaryColor, setSecondaryColor] = useState("#FEF3C7");
  const [showLogo, setShowLogo] = useState(
    latestVersion?.showLogo !== undefined ? latestVersion.showLogo : true
  );
  const [logoScale, setLogoScale] = useState(latestVersion?.logoScale || 1.0);
  const [logoUrl, setLogoUrl] = useState<string | null>(latestVersion?.logoUrl || clientLogo);
  const [logoBgStyle, setLogoBgStyle] = useState<string>(latestVersion?.logoBgStyle || "pill");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload Handler for Logo (Converts to high-res Base64 Data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Format",
        description: "Please upload an image file (PNG, SVG, JPG, WebP).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setShowLogo(true);
        toast({
          title: "✓ Brand Logo Uploaded!",
          description: `Loaded ${file.name} directly onto the poster canvas.`,
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "Could not read logo image file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };
  const [bgImageUrl, setBgImageUrl] = useState(
    latestVersion?.bgImageUrl ||
      latestVersion?.heroImageUrl ||
      (latestVersion?.fileUrl && !latestVersion?.fileUrl.startsWith("data:image/svg") ? latestVersion?.fileUrl : null) ||
      project?.bgImageUrl ||
      "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080"
  );

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState(
    latestVersion?.prompt ||
      project?.aiPrompt ||
      "Beautifully sculpted traditional Indian Lord Ganesha idol, graceful divine and peaceful posture, authentic devotional aesthetics, resting on an elevated traditional carved teakwood pedestal. Delicate fresh orange marigold garlands, white jasmine flowers, polished brass diya oil lamps with glowing warm flames, subtle brass thali accents arranged naturally around the base. Soft warm ivory to subtle golden amber gradient background with understated temple arch silhouette and faint mandala motifs. Soft warm golden illumination, gentle diya glow, volumetric golden light rays, delicate cinematic rim lighting around Lord Ganesha, natural brass highlights, Hasselblad H6D-100c medium format, 85mm f/1.4 luxury commercial prime lens, shallow depth of field, creamy background bokeh, ultra-sharp focus on subject, cinematic 3-point studio lighting, photorealistic 8k render"
  );
  const [isRegeneratingBg, setIsRegeneratingBg] = useState(false);

  // Social Captions & Hashtags State
  const defaultCaptionText = `✨ **${headline}** ✨\n\n${subheadline}\n\n🌟 **Why Choose ${customer?.name || "Us"}:**\n• Premium Quality & Certified Excellence\n• Tailored Solutions & Dedicated Support\n• Limited-Time Exclusive Privilege\n\n📍 **Location:** ${locationName}\n📞 **Direct Line:** ${phone}\n🌐 **Official Website:** ${website}\n\n👉 **${ctaText} — Tap the link in bio to get started!**`;

  const [socialCaption, setSocialCaption] = useState(defaultCaptionText);
  const [socialHashtags, setSocialHashtags] = useState(
    `#${(customer?.name || "Brand").replace(/[^a-zA-Z0-9]/g, "")} #${(customer?.industry || "Business").replace(/[^a-zA-Z0-9]/g, "")} #SpecialOffer #FestivalOffer #Trending #HyderabadBusiness #TopBrand #Marketing`
  );

  // Scheduling Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("TOMORROW_10AM");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [scheduling, setScheduling] = useState(false);

  // Scheduling Date & Time Picker state
  const tomorrowDefaults = getFormattedTomorrow(10, 0);
  const [scheduleDate, setScheduleDate] = useState(tomorrowDefaults.dateStr);
  const [scheduleTime, setScheduleTime] = useState(tomorrowDefaults.timeStr);
  const [scheduleCaption, setScheduleCaption] = useState("");
  const [scheduleHashtags, setScheduleHashtags] = useState(socialHashtags);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync initial state from project metadata whenever project or customer changes
  useEffect(() => {
    if (project) {
      const v = project?.versions?.[project?.versions?.length - 1];
      if (v?.headline || project?.headline) {
        setHeadline(v?.headline || project?.headline);
      }
      if (v?.subheadline || project?.subheadline) {
        setSubheadline(v?.subheadline || project?.subheadline);
      }
      if (v?.offerText || project?.offerText) {
        setOfferText(v?.offerText || project?.offerText);
      }
      if (v?.ctaText || project?.ctaText) {
        setCtaText(v?.ctaText || project?.ctaText);
      }
      const bg =
        v?.bgImageUrl ||
        v?.heroImageUrl ||
        (v?.fileUrl && !v?.fileUrl.startsWith("data:image/svg") ? v?.fileUrl : null) ||
        project?.bgImageUrl;
      if (bg) {
        setBgImageUrl(bg);
      }
      if (v?.prompt || project?.aiPrompt) {
        setAiPrompt(v?.prompt || project?.aiPrompt);
      }
      if (v?.phone || project?.phone) {
        setPhone(v?.phone || project?.phone);
      }
      if (v?.website || project?.website) {
        setWebsite(v?.website || project?.website);
      }
      if (v?.locationName || project?.locationName) {
        setLocationName(v?.locationName || project?.locationName);
      }
      if (v?.layoutTheme || project?.layoutTheme) {
        setLayoutTheme(v?.layoutTheme || project?.layoutTheme);
      }
      if (v?.caption || project?.caption) {
        setSocialCaption(v?.caption || project?.caption);
      }
    }
    if (customer) {
      if (customer?.brandProfile?.brandColors?.[0] || customer?.primaryColor) {
        setPrimaryColor(customer?.brandProfile?.brandColors?.[0] || customer?.primaryColor);
      }
      if (customer?.brandProfile?.brandColors?.[1] || customer?.accentColor) {
        setAccentColor(customer?.brandProfile?.brandColors?.[1] || customer?.accentColor);
      }
      const logo = customer?.logoUrl || customer?.logo || customer?.brandProfile?.logoUrl;
      if (logo) {
        setLogoUrl(logo);
      }
      if (customer?.contactNumbers?.[0] || customer?.phone) {
        setPhone((prev: string) => prev || customer?.contactNumbers?.[0] || customer?.phone);
      }
      if (customer?.website) {
        setWebsite((prev: string) => prev || customer?.website);
      }
    }
  }, [project, customer]);

  // Sync default schedule caption when opening scheduling modal
  useEffect(() => {
    if (isScheduleOpen) {
      setScheduleCaption(`${headline}\n\n${subheadline}\n\n📍 ${locationName} | 📞 ${phone}\n👉 ${ctaText}: ${website}`);
    }
  }, [isScheduleOpen, headline, subheadline, ctaText, locationName, phone, website]);

  // Regenerate Hero Visual via Pollinations AI
  const handleRegenerateBackground = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsRegeneratingBg(true);
      const seed = Math.floor(Math.random() * 1000000);
      const cleanPrompt = encodeURIComponent(
        `${aiPrompt}, commercial advertising photography, cinematic studio lighting, 8k resolution, photorealistic, clean negative space, no text, no words, no letters, no watermark`
      );
      const newUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}`;

      // Preload image
      const img = new Image();
      img.src = newUrl;
      img.onload = () => {
        setBgImageUrl(newUrl);
        setIsRegeneratingBg(false);
        toast({
          title: "✨ Visual Background Regenerated",
          description: "New AI hero visual loaded into the canvas.",
        });
      };
      img.onerror = () => {
        setIsRegeneratingBg(false);
        toast({
          title: "Generation Notice",
          description: "Applied generated visual link to canvas.",
        });
        setBgImageUrl(newUrl);
      };
    } catch (err: any) {
      setIsRegeneratingBg(false);
      toast({
        title: "Regeneration Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Download Canvas as SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${project.title || "creative_poster"}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);

    toast({
      title: "📥 Poster Downloaded",
      description: "Saved high-resolution SVG creative to your device.",
    });
  };

  // Package all current poster design state
  const getCurrentPosterState = () => ({
    fileUrl: bgImageUrl,
    bgImageUrl,
    heroImageUrl: bgImageUrl,
    headline,
    subheadline,
    offerText,
    ctaText,
    primaryColor,
    accentColor,
    secondaryColor,
    phone,
    website,
    locationName,
    showLogo,
    logoScale,
    logoUrl,
    logoBgStyle,
    layoutTheme,
    prompt: aiPrompt,
  });

  // Save current design as new version
  const handleSaveCurrentVersion = async () => {
    try {
      const posterData = getCurrentPosterState();
      await onSaveVersion({
        ...posterData,
        notes: `Custom studio edit: ${headline}`,
      });
      toast({
        title: "💾 Poster Version Saved",
        description: "Latest design snapshot and branding saved to project history.",
      });
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Submit current poster for Admin approval
  const handleSubmitForApproval = async () => {
    try {
      const posterData = getCurrentPosterState();
      await onSaveVersion({
        ...posterData,
        notes: `Submitted for Admin Approval: ${headline}`,
      });
      await onSubmitApproval(project._id);
      toast({
        title: "✨ Poster Saved & Submitted for Approval",
        description: "Creative snapshot saved and sent to admin for review.",
      });
    } catch (e: any) {
      toast({
        title: "Submission Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Approve current poster
  const handleApproveCreative = async () => {
    try {
      const posterData = getCurrentPosterState();
      await onSaveVersion({
        ...posterData,
        notes: `Approved Creative: ${headline}`,
      });
      await onApprove(project._id);
      toast({
        title: "✅ Creative Approved & Saved",
        description: "Design signed off and ready for publishing.",
      });
    } catch (e: any) {
      toast({
        title: "Approval Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Select Quick Timing Preset and synchronize Date & Time inputs
  const handleSelectTimingPreset = (slotId: string) => {
    setSelectedSlot(slotId);
    if (slotId === "NOW") {
      const now = new Date(Date.now() + 5 * 60000); // 5 mins from now
      setScheduleDate(now.toISOString().split("T")[0]);
      setScheduleTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    } else if (slotId === "TOMORROW_10AM") {
      const t = getFormattedTomorrow(10, 0);
      setScheduleDate(t.dateStr);
      setScheduleTime(t.timeStr);
    } else if (slotId === "TOMORROW_6PM") {
      const t = getFormattedTomorrow(18, 0);
      setScheduleDate(t.dateStr);
      setScheduleTime(t.timeStr);
    } else if (slotId === "WEEKEND") {
      const w = getUpcomingSaturday(11, 0);
      setScheduleDate(w.dateStr);
      setScheduleTime(w.timeStr);
    }
  };

  // Compute live scheduled Date object and countdown text
  const computedScheduledDate = (() => {
    try {
      if (!scheduleDate || !scheduleTime) return new Date();
      const dt = new Date(`${scheduleDate}T${scheduleTime}:00`);
      return isNaN(dt.getTime()) ? new Date() : dt;
    } catch {
      return new Date();
    }
  })();

  const formatCountdownSummary = (dateObj: Date) => {
    const diff = dateObj.getTime() - Date.now();
    if (diff <= 0) return "Publish immediately";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `In ${days} day${days > 1 ? "s" : ""} (${hours % 24} hours)`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
    const mins = Math.floor(diff / (1000 * 60));
    return `In ${mins} minute${mins > 1 ? "s" : ""}`;
  };

  // Handle direct schedule post calling the real Backend API
  const handleConfirmSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Date & Time Required",
        description: "Please pick a valid publish date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setScheduling(true);
      const posterData = getCurrentPosterState();

      // 1. Auto-save current poster version
      await onSaveVersion({
        ...posterData,
        notes: `Auto-saved upon scheduling for ${scheduleDate} ${scheduleTime}`,
      });

      // 2. Schedule via real backend API
      const parsedHashtags = scheduleHashtags
        .split(/\s+/)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .filter(Boolean);

      const targetIso = computedScheduledDate.toISOString();

      await scheduleCreativeProject(project._id, {
        scheduledFor: targetIso,
        platforms: selectedPlatforms,
        headline,
        caption: scheduleCaption,
        hashtags: parsedHashtags,
        posterData,
        notes: `Scheduled for ${selectedPlatforms.join(", ")} at ${computedScheduledDate.toLocaleString()}`,
      });

      toast({
        title: "🚀 Creative Scheduled for Publishing!",
        description: `Queued for ${selectedPlatforms.join(", ")} on ${computedScheduledDate.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })} (${formatCountdownSummary(computedScheduledDate)}). Visible in Queue Scheduler!`,
      });

      setIsScheduleOpen(false);
      onClose();
    } catch (e: any) {
      toast({
        title: "Scheduling Failed",
        description: e.message || "Failed to schedule creative post",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  const isApproved = project?.approvalStatus === "Approved";
  const isPending = project?.approvalStatus === "Pending Approval";

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 rounded-2xl text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sliders className="h-5 w-5" aria-hidden="true" focusable="false" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{project.title}</h2>
              <Badge
                className={
                  isApproved
                    ? "bg-emerald-500 text-white font-bold"
                    : isPending
                    ? "bg-amber-500 text-white font-bold"
                    : "bg-slate-700 text-slate-200"
                }
              >
                <span>{project.approvalStatus || "Draft"}</span>
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Client: <strong className="text-purple-300">{customer?.name || "Client Brand"}</strong> · Canvas: 1080 × 1080 px (1:1 Square)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadSvg}
            className="h-8.5 text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
            <span>Download High-Res</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveCurrentVersion}
            className="h-8.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
            <span>Save Version</span>
          </Button>

          {!isApproved && (
            <Button
              size="sm"
              onClick={handleSubmitForApproval}
              className="h-8.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
              <span>Submit for Admin Approval</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={async () => {
              if (!isApproved) {
                await handleApproveCreative();
              }
              setIsScheduleOpen(true);
            }}
            className="h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
            <span>{isApproved ? "Schedule / Publish Post" : "Approve & Schedule"}</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Canvas, Right Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Live Interactive SVG Canvas Preview (1080x1080 Scaled) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 relative group bg-slate-900 flex items-center justify-center">
            {/* SVG Live Rendered Canvas Component */}
            <CreativePosterCanvas
              svgRef={svgRef}
              bgImageUrl={bgImageUrl}
              headline={headline}
              subheadline={subheadline}
              offerText={offerText}
              ctaText={ctaText}
              primaryColor={primaryColor}
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              phone={phone}
              website={website}
              locationName={locationName}
              showLogo={showLogo}
              logoScale={logoScale}
              logoUrl={logoUrl}
              logoBgStyle={logoBgStyle}
              brandName={customer?.name || "BRAND LOGO"}
              layoutTheme={layoutTheme}
              idPrefix="editor_canvas"
            />
          </div>

          <div className="mt-3 flex items-center justify-between w-full max-w-[480px] text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Theme: <strong className="text-purple-300 capitalize">{layoutTheme.replace("_", " ")}</strong></span>
            </span>
            <span>1080 × 1080 Full Resolution</span>
          </div>
        </div>

        {/* RIGHT: Studio Controls Tabs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <Tabs defaultValue="theme" className="space-y-4">
            <TabsList className="grid grid-cols-5 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="theme" className="text-[11px] font-semibold">
                <Palette className="w-3.5 h-3.5 mr-1 text-purple-600" aria-hidden="true" focusable="false" />
                <span>Theme</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="text-[11px] font-semibold">
                <Type className="w-3.5 h-3.5 mr-1" aria-hidden="true" focusable="false" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="text-[11px] font-semibold">
                <Share2 className="w-3.5 h-3.5 mr-1 text-pink-600" aria-hidden="true" focusable="false" />
                <span>Social</span>
              </TabsTrigger>
              <TabsTrigger value="brand" className="text-[11px] font-semibold">
                <Building2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" focusable="false" />
                <span>Brand</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" aria-hidden="true" focusable="false" />
                <span>AI Visual</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 5 Design Themes */}
            <TabsContent value="theme" className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Select Visual Layout Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "gold_luxury", label: "🌟 Gold Luxury & Elite", desc: "Dark scrims, golden borders, refined luxury aesthetic", colors: ["#020617", "#D4AF37"] },
                    { id: "modern_glass", label: "💎 Modern Glassmorphism", desc: "Frosted cards, floating pill badges, sleek tech feel", colors: ["#0F172A", "#38BDF8"] },
                    { id: "festive_divine", label: "🪔 Festive Divine Aura", desc: "Temple arch frame, glowing diyas, saffron & gold accents", colors: ["#7C2D12", "#F59E0B"] },
                    { id: "bold_commercial", label: "⚡ Bold Commercial Sale", desc: "High-contrast discount ribbon, punchy CTA, urgent vibe", colors: ["#881337", "#F43F5E"] },
                    { id: "clinical_teal", label: "🩺 Clinical & Aesthetic Glow", desc: "Medical grade clarity, pristine cyan & teal styling", colors: ["#0F3D3E", "#22D3EE"] },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLayoutTheme(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        layoutTheme === t.id
                          ? "border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{t.label}</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors[0] }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors[1] }} />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Text & Copy Editing */}
            <TabsContent value="content" className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Primary Headline
                </label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Supporting Line / Subtext
                </label>
                <Textarea
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Offer Badge Text
                  </label>
                  <Input
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    CTA Button Text
                  </label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Social Media Captions & Hashtags */}
            <TabsContent value="social" className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Generated Social Media Caption</span>
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] text-indigo-600 gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(`${socialCaption}\n\n${socialHashtags}`);
                      toast({ title: "Copied!", description: "Full caption and hashtags copied." });
                    }}
                  >
                    <Copy className="h-3 w-3" /> Copy Full Text
                  </Button>
                </div>
                <Textarea
                  value={socialCaption}
                  onChange={(e) => setSocialCaption(e.target.value)}
                  rows={5}
                  className="text-xs font-mono bg-slate-50 border-slate-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Curated Campaign Hashtags</span>
                </label>
                <Input
                  value={socialHashtags}
                  onChange={(e) => setSocialHashtags(e.target.value)}
                  className="text-xs font-mono"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {socialHashtags.split(/\s+/).filter(Boolean).map((t, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Branding & Logo Upload */}
            <TabsContent value="brand" className="space-y-4 pt-1">
              {/* Hidden Native File Input */}
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
                onChange={handleLogoFileUpload}
              />

              {/* Logo Visibility & Scale Header */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Display Brand Logo on Poster</span>
                  <span className="text-[10px] text-slate-500">Show or hide the logo / brand identity block</span>
                </div>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* LOGO UPLOAD & MANAGEMENT SECTION */}
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                    <span>Brand Logo Artwork</span>
                  </span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                    PNG / SVG / JPG / WebP
                  </Badge>
                </div>

                {logoUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-purple-200 shadow-xs">
                    <div className="h-12 w-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1 relative group shrink-0">
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {logoUrl.startsWith("data:") ? "Custom Uploaded Logo" : "Connected Logo Asset"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="h-6 text-[10px] px-2 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          <UploadCloud className="h-3 w-3" /> Change Logo
                        </Button>

                        {clientLogo && logoUrl !== clientLogo && (
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            className="h-6 text-[10px] px-1.5 text-slate-600 hover:text-slate-900 gap-1"
                            onClick={() => {
                              setLogoUrl(clientLogo);
                              toast({ title: "Reset to CRM Logo", description: "Default customer logo restored." });
                            }}
                          >
                            <RotateCcw className="h-3 w-3" /> Reset CRM
                          </Button>
                        )}

                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="h-6 text-[10px] px-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                          onClick={() => {
                            setLogoUrl(null);
                            toast({ title: "Logo Removed", description: "Poster will render stylized typography brand name." });
                          }}
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag / Drop Click to Upload Box */
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/50 transition-all rounded-xl p-4 text-center cursor-pointer space-y-1.5 group"
                  >
                    <UploadCloud className="h-6 w-6 text-purple-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-purple-900">Click to Upload Brand Logo</p>
                    <p className="text-[10px] text-slate-500">Supports transparent PNG, vector SVG, JPG, WebP</p>
                  </div>
                )}

                {/* Logo Scale Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-700">Logo Size / Scale</span>
                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                      {logoScale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* Logo Container Style Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Logo Container Backdrop
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { id: "pill", label: "💊 Pill Card" },
                      { id: "transparent", label: "🪟 Transparent" },
                      { id: "gold", label: "🌟 Gold Trim" },
                      { id: "dark", label: "🌙 Dark Slate" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setLogoBgStyle(st.id)}
                        className={`p-1.5 rounded-lg border text-[10px] font-semibold transition-all text-center ${
                          logoBgStyle === st.id
                            ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CRM Contact Details */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Phone (From CRM)
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Branch / Location Tag
                  </label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Website URL
                </label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="text-xs"
                />
              </div>
            </TabsContent>

            {/* TAB 5: AI Visual Prompt & Master Art Direction */}
            <TabsContent value="ai" className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Complete AI Image Prompt</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {aiPrompt.length} chars
                    </span>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      className="h-6 text-[10px] text-purple-700 hover:bg-purple-100 gap-1 px-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(aiPrompt);
                        toast({ title: "Copied!", description: "Complete image generation prompt copied." });
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy Prompt
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="text-xs font-mono bg-slate-950 text-emerald-300 border-slate-800 leading-relaxed shadow-inner"
                />
              </div>

              {/* Quick Prompt Upgrader Chips */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  ✨ Quick Art Direction Upgraders:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "🌟 Cinematic Diya Glow", append: ", authentic glowing brass diyas with warm flame highlights and marigold accents" },
                    { label: "📸 85mm Prime Bokeh", append: ", shot on Hasselblad H6D-100c, 85mm f/1.4 prime lens, ultra-creamy shallow depth of field" },
                    { label: "✨ Luxury Gold Scrim", append: ", dramatic champagne gold rim lighting with luxury minimalist marble podium" },
                    { label: "🌿 Pure Botanical Daylight", append: ", soft natural morning daylight with delicate water droplet reflections on frosted glass" },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt((prev) => `${prev.trim()}${chip.append}`)}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleRegenerateBackground}
                disabled={isRegeneratingBg || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white font-bold py-2 shadow-sm gap-2"
              >
                {isRegeneratingBg ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" focusable="false" />
                    <span>Synthesizing New Hero Visual...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
                    <span>Regenerate Hero Artwork with Complete Prompt →</span>
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Version: <strong>V{project?.versions?.length || 1}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close Studio
            </Button>
          </div>
        </div>
      </div>

      {/* SCHEDULING & PUBLISHING MODAL */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Calendar className="h-5 w-5 text-emerald-600" aria-hidden="true" focusable="false" />
              <span>Schedule & Publish Creative</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select destination social channels and exact date & time to queue this poster for automated publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Platform Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                1. Destination Channels ({selectedPlatforms.length} Selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "Instagram", label: "📱 Instagram" },
                  { id: "Facebook", label: "🌐 Facebook" },
                  { id: "Content Calendar", label: "📅 Calendar" },
                  { id: "WhatsApp", label: "💬 WhatsApp" },
                ].map((p) => {
                  const isChecked = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          if (selectedPlatforms.length > 1) {
                            setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p.id));
                          }
                        } else {
                          setSelectedPlatforms([...selectedPlatforms, p.id]);
                        }
                      }}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span>{p.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" focusable="false" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Timing Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                2. Quick Timing Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "NOW", label: "⚡ Publish Now", sub: "Dispatch in 5 mins" },
                  { id: "TOMORROW_10AM", label: "☀️ Tomorrow 10 AM", sub: "Peak morning slot" },
                  { id: "TOMORROW_6PM", label: "🌆 Tomorrow 6 PM", sub: "Evening slot" },
                  { id: "WEEKEND", label: "🌟 Weekend 11 AM", sub: "Saturday prime" },
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSelectTimingPreset(slot.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedSlot === slot.id
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-xs">{slot.label}</div>
                    <div className="text-[10px] text-slate-400">{slot.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Date & Time Picker */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3. Selected Publish Date & Time
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">Publish Date</span>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => {
                      setScheduleDate(e.target.value);
                      setSelectedSlot("CUSTOM");
                    }}
                    className="text-xs bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">Publish Time (24h / IST)</span>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => {
                      setScheduleTime(e.target.value);
                      setSelectedSlot("CUSTOM");
                    }}
                    className="text-xs bg-white"
                  />
                </div>
              </div>

              {/* Live Formatted Summary Badge */}
              <div className="p-2 bg-indigo-100/70 border border-indigo-200 rounded-lg flex items-center justify-between text-xs text-indigo-950">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-700" />
                  <span>
                    🗓️ Scheduled for:{" "}
                    <strong>
                      {computedScheduledDate.toLocaleString("en-IN", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </strong>
                  </span>
                </div>
                <Badge className="bg-indigo-700 text-white text-[10px] font-bold">
                  {formatCountdownSummary(computedScheduledDate)}
                </Badge>
              </div>
            </div>

            {/* 4. Social Caption & Hashtags Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                4. Social Post Caption & Hashtags
              </label>
              <Textarea
                rows={3}
                value={scheduleCaption}
                onChange={(e) => setScheduleCaption(e.target.value)}
                placeholder="Post caption text..."
                className="text-xs bg-slate-50"
              />
              <Input
                value={scheduleHashtags}
                onChange={(e) => setScheduleHashtags(e.target.value)}
                placeholder="#Hashtags separated by spaces"
                className="text-xs bg-slate-50 font-mono"
              />
            </div>

            {/* Confirm Schedule Button */}
            <Button
              onClick={handleConfirmSchedule}
              disabled={scheduling || selectedPlatforms.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2 text-sm"
            >
              {scheduling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" focusable="false" />
                  <span>Queueing to Scheduled Jobs...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" focusable="false" />
                  <span>Confirm & Queue to Social Publisher →</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
