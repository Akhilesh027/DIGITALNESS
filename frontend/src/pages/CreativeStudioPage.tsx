import { useEffect, useState } from "react";
import {
  Palette,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Layers,
  History,
  Eye,
  Sparkles,
  Wand2,
  ExternalLink,
  Download,
  Send,
  MessageSquare,
  Flame,
  Calendar,
  Zap,
  Sliders,
  ChevronRight,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreativeStudioVisualEditor } from "@/components/ai/creative/CreativeStudioVisualEditor";
import { CreativePosterCanvas } from "@/components/ai/creative/CreativePosterCanvas";
import {
  getCreativeProjects,
  createCreativeProject,
  addCreativeVersion,
  submitCreativeForApproval,
  approveCreative,
  requestCreativeRevision,
  generateAICreative,
  synthesizeAICreativePrompt,
  requestAICreativeRevision,
} from "../api/creativeProjectApi";
import { getCustomers } from "../api/customerApi";

const OCCASION_PRESETS = [
  { label: "🪔 Diwali Festival of Lights Special", value: "Diwali" },
  { label: "🐘 Ganesh Chaturthi / Vinayaka Chavithi", value: "Ganesh Chaturthi" },
  { label: "🌙 Eid Mubarak & Festive Blessings", value: "Eid Mubarak" },
  { label: "🎄 Christmas & New Year Celebration", value: "New Year Celebration" },
  { label: "⚡ 25% OFF Limited-Time Flash Sale", value: "25% OFF Flash Sale" },
  { label: "🎁 Buy 1 Get 1 (BOGO) Exclusive Privilege", value: "Buy 1 Get 1 Free BOGO Offer" },
  { label: "🚀 Grand Opening & Flagship Launch", value: "Grand Opening" },
  { label: "🩺 HydraFacial & Glass Skin Glow", value: "HydraFacial Skincare Treatment" },
  { label: "🏢 Luxury Architecture & Living", value: "Luxury Real Estate" },
  { label: "☀️ Daily Morning Radiance & Motivation", value: "Daily Motivation" },
];

export default function CreativeStudioPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 2-Step AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generatorStep, setGeneratorStep] = useState<"INPUT" | "PROMPT_REVIEW">("INPUT");
  const [aiCustomerId, setAiCustomerId] = useState("");
  const [aiOccasion, setAiOccasion] = useState(OCCASION_PRESETS[1].value); // Default to Ganesh Chaturthi
  const [aiTheme, setAiTheme] = useState<string>("gold_luxury");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [isSynthesizingPrompt, setIsSynthesizingPrompt] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [synthesizedBrief, setSynthesizedBrief] = useState<any>(null);
  const [editedPrompt, setEditedPrompt] = useState("");

  // Manual Project Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newAssetType, setNewAssetType] = useState("Poster");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Manage & Inspect Project Modal
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [versionFileUrl, setVersionFileUrl] = useState("");
  const [versionNotes, setVersionNotes] = useState("");

  // Natural Language AI Revision State inside Modal
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [revising, setRevising] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creativeData, customerData] = await Promise.all([
        getCreativeProjects(),
        getCustomers(),
      ]);
      setProjects(creativeData || []);
      setCustomers(customerData || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load creative studio", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // STEP 1: Synthesize AI Creative Prompt & Strategy
  const handleSynthesizePrompt = async () => {
    if (!aiCustomerId) {
      toast({ title: "Client Required", description: "Please select a client for AI prompt synthesis.", variant: "destructive" });
      return;
    }

    try {
      setIsSynthesizingPrompt(true);
      const res = await synthesizeAICreativePrompt({
        customerId: aiCustomerId,
        occasion: aiOccasion,
        customPrompt: aiCustomPrompt || undefined,
      });

      if (res.data) {
        setSynthesizedBrief(res.data);
        setEditedPrompt(res.data.finalPrompt || "");
        setGeneratorStep("PROMPT_REVIEW");
        toast({
          title: "✨ Master Strategy & Prompt Synthesized!",
          description: "Review and edit the visual prompt before generating the poster visual.",
        });
      }
    } catch (err: any) {
      toast({ title: "Synthesis Failed", description: err.message || "Could not synthesize prompt", variant: "destructive" });
    } finally {
      setIsSynthesizingPrompt(false);
    }
  };

  // STEP 2: Generate Poster from the Approved/Edited Prompt
  const handleGeneratePosterFromPrompt = async () => {
    if (!aiCustomerId) return;
    try {
      setAiGenerating(true);
      const res = await generateAICreative({
        customerId: aiCustomerId,
        occasion: aiOccasion,
        customPrompt: editedPrompt || aiCustomPrompt || undefined,
      });

      toast({
        title: "🎨 Poster Generated Successfully!",
        description: res.data?.title || "Your AI advertising poster has been rendered.",
      });

      setIsAiModalOpen(false);
      setGeneratorStep("INPUT");

      const updatedProjects = await getCreativeProjects();
      setProjects(updatedProjects || []);

      const returnedProject = res.data?.project;
      const heroImg = res.data?.asset?.renderSettings?.heroImageUrl;
      
      const targetProj = returnedProject || updatedProjects?.find(
        (p: any) => p._id === res.data?.project?._id || p.title === res.data?.project?.title
      );

      if (targetProj) {
        targetProj.layoutTheme = aiTheme || synthesizedBrief?.layoutTheme || "gold_luxury";
        if (heroImg) {
          targetProj.bgImageUrl = heroImg;
          if (targetProj.versions?.length > 0) {
            targetProj.versions[targetProj.versions.length - 1].bgImageUrl = heroImg;
            targetProj.versions[targetProj.versions.length - 1].layoutTheme = targetProj.layoutTheme;
          }
        }
        if (synthesizedBrief?.communication?.headline) {
          targetProj.headline = synthesizedBrief.communication.headline;
        }
        if (synthesizedBrief?.communication?.supportingLine) {
          targetProj.subheadline = synthesizedBrief.communication.supportingLine;
        }
        if (synthesizedBrief?.communication?.cta) {
          targetProj.ctaText = synthesizedBrief.communication.cta;
        }
        if (synthesizedBrief?.communication?.offerText) {
          targetProj.offerText = synthesizedBrief.communication.offerText;
        }
        if (synthesizedBrief?.communication?.caption) {
          targetProj.caption = synthesizedBrief.communication.caption;
        }
        setSelectedProject({ ...targetProj });
      }

      setSynthesizedBrief(null);
      setAiCustomPrompt("");
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message || "Could not generate creative", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  // 2. Handle Natural Language Revision Request
  const handleNaturalLanguageRevision = async (projectId: string, creativeAssetId?: string) => {
    if (!revisionPrompt.trim()) {
      toast({ title: "Revision Prompt Needed", description: "Please specify the changes you would like to make.", variant: "destructive" });
      return;
    }

    try {
      setRevising(true);
      if (creativeAssetId) {
        await requestAICreativeRevision({
          creativeAssetId,
          feedback: revisionPrompt,
        });
      } else {
        await requestCreativeRevision(projectId, revisionPrompt);
      }

      toast({
        title: "Revision Applied",
        description: "Your creative version was updated with the requested modifications.",
      });
      setRevisionPrompt("");
      await fetchData();
      if (selectedProject?._id === projectId) setSelectedProject(null);
    } catch (err: any) {
      toast({ title: "Revision Failed", description: err.message, variant: "destructive" });
    } finally {
      setRevising(false);
    }
  };

  // 3. Handle Manual Create
  const handleCreateCreative = async () => {
    if (!newTitle || !newCustomerId) {
      toast({ title: "Validation Error", description: "Title and Customer are required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await createCreativeProject({
        title: newTitle,
        customerId: newCustomerId,
        assetType: newAssetType,
        fileUrl: newFileUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop",
        aiPrompt: newPrompt,
      });

      toast({ title: "Success", description: "Creative Project created successfully" });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewFileUrl("");
      setNewPrompt("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create creative project", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVersion = async (projectId: string) => {
    if (!versionFileUrl) {
      toast({ title: "Validation Error", description: "File URL is required for new version", variant: "destructive" });
      return;
    }

    try {
      await addCreativeVersion(projectId, {
        fileUrl: versionFileUrl,
        notes: versionNotes || "New revision uploaded",
      });

      toast({ title: "Version Added", description: "New creative version uploaded successfully" });
      setVersionFileUrl("");
      setVersionNotes("");
      fetchData();
      if (selectedProject?._id === projectId) setSelectedProject(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmitApproval = async (id: string) => {
    try {
      await submitCreativeForApproval(id);
      toast({ title: "Submitted", description: "Creative submitted for manager / client approval" });
      fetchData();
      if (selectedProject?._id === id) setSelectedProject(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveCreative(id);
      toast({ title: "Approved", description: "Creative project approved for publishing & ad activation!" });
      fetchData();
      if (selectedProject?._id === id) setSelectedProject(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const selectedCustomerInfo = customers.find((c) => c._id === aiCustomerId);

  const filteredProjects = (projects || []).filter((project) => {
    const matchesSearch =
      (project.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.customerId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.customerId?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.approvalStatus === statusFilter;
    const matchesAsset = assetTypeFilter === "all" || project.assetType === assetTypeFilter;
    return matchesSearch && matchesStatus && matchesAsset;
  });

  const totalCreatives = projects.length;
  const approvedCreatives = projects.filter((p) => p.approvalStatus === "Approved").length;
  const pendingApprovals = projects.filter((p) => p.approvalStatus === "Pending Approval").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/40 text-xs font-semibold px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" /> Autonomous Creative Studio
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Palette className="h-8 w-8 text-purple-400" /> Creative & Visual Direction Studio
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Synthesize high-converting commercial posters, festival campaigns, and social banners with AI visual prompts, brand rules, and multi-tenant isolation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>

          {/* 2-Step AI Generator Modal */}
          <Dialog
            open={isAiModalOpen}
            onOpenChange={(open) => {
              setIsAiModalOpen(open);
              if (!open) {
                setGeneratorStep("INPUT");
                setSynthesizedBrief(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-purple-500/25">
                <Wand2 className="h-4 w-4" aria-hidden="true" focusable="false" />
                <span>Instant AI Poster Generator</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Wand2 className="h-5 w-5 text-purple-600" aria-hidden="true" focusable="false" />
                    <span>
                      {generatorStep === "INPUT"
                        ? "1. Brand Context & Campaign Objective"
                        : "2. Review & Customize AI Prompt"}
                    </span>
                  </DialogTitle>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                    {generatorStep === "INPUT" ? "Step 1 of 2: Ingest Context" : "Step 2 of 2: Prompt Strategy"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  {generatorStep === "INPUT"
                    ? "Select target client and occasion to synthesize a master art-directed advertising prompt."
                    : "Inspect the generated visual prompt, copy package, and brand rules before rendering the poster."}
                </DialogDescription>
              </DialogHeader>

              {/* STEP 1: CONTEXT INGESTION & SELECTION */}
              {generatorStep === "INPUT" && (
                <div className="space-y-4 py-3">
                  {/* Client Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      Target Client Brand *
                    </label>
                    <Select value={aiCustomerId} onValueChange={setAiCustomerId}>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-300">
                        <SelectValue placeholder="Select Client Brand from CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ""} — {c.businessType || c.industry || "General"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedCustomerInfo && (
                      <div className="mt-2.5 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-900">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{selectedCustomerInfo.name}</span>
                          <span className="text-slate-500">| {selectedCustomerInfo.phone || "Phone verified"}</span>
                        </div>
                        <Badge className="bg-purple-600 text-white text-[10px]">CRM Brand Profile Active</Badge>
                      </div>
                    )}
                  </div>

                  {/* 2. Campaign Occasion & Offer Type */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      2. Campaign Occasion & Offer Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {OCCASION_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setAiOccasion(preset.value)}
                          className={`p-2 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                            aiOccasion === preset.value
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <span>{preset.label}</span>
                          {aiOccasion === preset.value && <CheckCircle2 className="h-3.5 w-3.5 ml-1 flex-shrink-0" aria-hidden="true" focusable="false" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Poster Layout Design Theme */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      3. Poster Layout Design Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: "gold_luxury", label: "🌟 Gold Luxury", desc: "Dark gradient, gold frame" },
                        { id: "modern_glass", label: "💎 Modern Glass", desc: "Frosted cards, glowing badges" },
                        { id: "festive_divine", label: "🪔 Festive Divine", desc: "Temple arch, diya glow" },
                        { id: "bold_commercial", label: "⚡ Bold Commercial", desc: "High-impact sale ribbon" },
                        { id: "clinical_teal", label: "🩺 Clinical Teal", desc: "Medical/aesthetic clarity" },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setAiTheme(th.id)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            aiTheme === th.id
                              ? "bg-purple-50 border-purple-600 ring-1 ring-purple-600 text-purple-950 shadow-xs"
                              : "bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-700"
                          }`}
                        >
                          <div className="text-xs font-bold">{th.label}</div>
                          <div className="text-[10px] text-slate-500">{th.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Custom Creative Directives */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      4. Custom Directives / Specific Copy (Optional)
                    </label>
                    <Textarea
                      placeholder="e.g. Include 20% discount badge, make background luxury dark aesthetic with gold accents, highlight Book Appointment button."
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      rows={2}
                      className="text-xs bg-slate-50 border-slate-300"
                    />
                  </div>

                  {/* Step 1 Synthesize Button */}
                  <Button
                    onClick={handleSynthesizePrompt}
                    disabled={isSynthesizingPrompt || !aiCustomerId}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
                  >
                    {isSynthesizingPrompt ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" focusable="false" />
                        <span>Synthesizing Master Prompt & Strategy...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" focusable="false" />
                        <span>Synthesize Master AI Prompt & Strategy →</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* STEP 2: PROMPT REVIEW & CUSTOMIZATION */}
              {generatorStep === "PROMPT_REVIEW" && synthesizedBrief && (
                <div className="space-y-4 py-2">
                  {/* Creative Concept Narrative Box */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Creative Concept Theme
                        </span>
                        {synthesizedBrief.generationEngine && (
                          <Badge className="bg-purple-900/80 text-purple-200 border-purple-700 text-[9px] px-1.5 py-0 font-mono">
                            ⚡ {synthesizedBrief.generationEngine}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-black text-amber-300">
                        {synthesizedBrief.creativeConcept?.name || "DIVINE BEGINNINGS"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {synthesizedBrief.creativeConcept?.description}
                    </p>
                  </div>

                  {/* Meta-Prompt Sent to AI Card */}
                  {synthesizedBrief.metaPromptSent && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" focusable="false" />
                          <span>📤 Meta-Prompt & Directives Sent to AI</span>
                        </span>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="h-5 text-[10px] text-amber-300 hover:bg-slate-800 gap-1 px-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(synthesizedBrief.metaPromptSent);
                            toast({ title: "Copied Meta-Prompt!", description: "Copied the exact prompt sent to AI." });
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" aria-hidden="true" focusable="false" />
                          <span>Copy Meta-Prompt</span>
                        </Button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-emerald-300 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
                        {synthesizedBrief.metaPromptSent}
                      </pre>
                    </div>
                  )}

                  {/* Complete Master AI Poster & Typography Prompt (Editable Textarea) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" focusable="false" />
                        <span>Master AI Graphic Poster & Typography Prompt (Uncapped)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {editedPrompt.length} chars ({editedPrompt.split(/\s+/).filter(Boolean).length} words)
                        </Badge>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="h-6 text-[10px] text-purple-700 hover:bg-purple-100 gap-1 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(editedPrompt);
                            toast({ title: "Copied!", description: "Complete AI poster prompt copied to clipboard." });
                          }}
                        >
                          <Copy className="h-3 w-3" /> Copy Prompt
                        </Button>
                        <Badge className="bg-purple-100 text-purple-800 text-[10px]">
                          ✨ Complete Graphic Poster
                        </Badge>
                      </div>
                    </div>
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      rows={5}
                      className="text-xs font-mono bg-slate-950 text-emerald-300 border-slate-800 leading-relaxed shadow-inner"
                    />

                    {/* Quick Art Direction Enhancer Chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[
                        { label: "🌟 Cinematic Diya Glow", text: ", authentic glowing brass diyas with warm flame highlights and marigold accents" },
                        { label: "📸 85mm Prime Bokeh", text: ", shot on Hasselblad H6D-100c, 85mm f/1.4 prime lens, ultra-creamy shallow depth of field" },
                        { label: "✨ Luxury Gold Scrim", text: ", dramatic champagne gold rim lighting with luxury minimalist marble podium" },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditedPrompt((prev) => `${prev.trim()}${chip.text}`)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generated Copywriting Package (Headline, CTA, Subheadline) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Synthesized Copywriting Package
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Headline</span>
                        <span className="font-extrabold text-slate-900 block">{synthesizedBrief.communication?.headline}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Call To Action</span>
                        <span className="font-bold text-indigo-700 block">{synthesizedBrief.communication?.cta}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{synthesizedBrief.communication?.supportingLine}"
                    </p>
                  </div>

                  {/* Generated Social Media Caption & Hashtags */}
                  {synthesizedBrief.communication?.caption && (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-indigo-600" />
                          <span>Generated Social Caption & Hashtags</span>
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] text-indigo-700 hover:bg-indigo-100 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(synthesizedBrief.communication.caption);
                            toast({ title: "Copied!", description: "Social caption copied to clipboard." });
                          }}
                        >
                          <Copy className="h-3 w-3" /> Copy Caption
                        </Button>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-100 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                        {synthesizedBrief.communication.caption}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGeneratorStep("INPUT")}
                      className="text-xs text-slate-700"
                    >
                      ← Back / Change Occasion
                    </Button>

                    <Button
                      onClick={handleGeneratePosterFromPrompt}
                      disabled={aiGenerating || !editedPrompt.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
                    >
                      {aiGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" focusable="false" />
                          <span>Generating 1080×1080 Poster Artwork...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" aria-hidden="true" focusable="false" />
                          <span>Generate Poster with This Prompt (1080×1080) →</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Manual Project Modal */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-1.5 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                <Plus className="h-4 w-4" /> Manual Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Creative Project</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Create a manual graphic project and register asset files.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Client Customer *</label>
                  <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Client Customer" />
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

                <div>
                  <label className="text-xs font-semibold text-slate-700">Project Title *</label>
                  <Input
                    placeholder="e.g. Summer Offer Banner Design"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Asset Type</label>
                  <Select value={newAssetType} onValueChange={setNewAssetType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Poster", "Banner", "Reel", "Story", "Carousel", "Video"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Initial Asset File URL</label>
                  <Input
                    placeholder="https://..."
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button onClick={handleCreateCreative} disabled={submitting} className="w-full bg-purple-600 text-white">
                  {submitting ? "Creating..." : "Create Creative Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Creatives</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalCreatives}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Approval</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{pendingApprovals}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Approved & Active</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{approvedCreatives}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search creatives by title, client, or campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Approval Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Revision Requested">Revision Requested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Creative Gallery Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
            <span>Loading creative assets...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Palette className="h-12 w-12 text-slate-300" />
            <p className="font-semibold text-slate-700">No creative projects found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Generate an advertising poster with AI or create a new graphic project to get started.
            </p>
            <Button onClick={() => setIsAiModalOpen(true)} size="sm" className="bg-purple-600 text-white mt-2">
              <Sparkles className="h-4 w-4 mr-1.5" /> Generate First Poster
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const latestVersion = project.versions?.[project.versions?.length - 1];
              const resolvedBg =
                latestVersion?.bgImageUrl ||
                latestVersion?.heroImageUrl ||
                (latestVersion?.fileUrl && !latestVersion?.fileUrl.startsWith("data:image/svg") ? latestVersion?.fileUrl : null) ||
                project.bgImageUrl ||
                "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080";

              const cust = customers.find(
                (c) =>
                  c._id === project.customerId?._id ||
                  c._id === project.customerId
              );

              return (
                <div
                  key={project._id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-square bg-slate-950 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                    <CreativePosterCanvas
                      bgImageUrl={resolvedBg}
                      headline={latestVersion?.headline || project.headline}
                      subheadline={latestVersion?.subheadline || project.subheadline}
                      offerText={latestVersion?.offerText || project.offerText}
                      ctaText={latestVersion?.ctaText || project.ctaText}
                      primaryColor={latestVersion?.primaryColor || project.primaryColor}
                      accentColor={latestVersion?.accentColor || project.accentColor}
                      phone={latestVersion?.phone || project.phone || cust?.phone}
                      website={latestVersion?.website || project.website || cust?.website}
                      locationName={latestVersion?.locationName || project.locationName || cust?.city}
                      showLogo={latestVersion?.showLogo !== undefined ? latestVersion.showLogo : (project.showLogo !== undefined ? project.showLogo : true)}
                      logoScale={latestVersion?.logoScale || 1.0}
                      logoUrl={latestVersion?.logoUrl || project.logoUrl || cust?.logoUrl || cust?.brandProfile?.logoUrl}
                      logoBgStyle={latestVersion?.logoBgStyle || "pill"}
                      brandName={project.customerId?.name || cust?.name || "BRAND LOGO"}
                      layoutTheme={latestVersion?.layoutTheme || project.layoutTheme || "gold_luxury"}
                      idPrefix={`grid_${project._id}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />

                    <Badge className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white border-none text-[11px] font-medium">
                      {project.assetType || "Poster"} ({project.dimensions?.width || 1080}x{project.dimensions?.height || 1080})
                    </Badge>

                    <Badge className="absolute top-3 right-3 bg-purple-600 text-white font-bold text-xs shadow-md">
                      V{project.currentVersion || project.versions?.length || 1}
                    </Badge>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 tracking-wide uppercase">
                        {project.customerId?.name || "Client"}
                      </span>
                      <Badge
                        className={
                          project.approvalStatus === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : project.approvalStatus === "Pending Approval"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {project.approvalStatus || "Draft"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {project.title}
                    </h3>
                  </div>

                  <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <History className="h-3.5 w-3.5 text-purple-600" /> {project.versions?.length || 1} Versions
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect & Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Visual Studio Editor Modal */}
      {selectedProject && (
        <Dialog open={Boolean(selectedProject)} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="sm:max-w-[1040px] max-h-[95vh] overflow-y-auto p-4 sm:p-6 bg-slate-950 border-slate-800">
            <DialogHeader className="sr-only">
              <DialogTitle>Creative Studio Visual Editor - {selectedProject.title}</DialogTitle>
              <DialogDescription>
                Inspect, edit, customize layout theme, upload brand logo, and schedule creative poster versions.
              </DialogDescription>
            </DialogHeader>
            <CreativeStudioVisualEditor
              project={selectedProject}
              customer={
                customers.find(
                  (c) =>
                    c._id === selectedProject.customerId?._id ||
                    c._id === selectedProject.customerId ||
                    c._id === selectedProject.customer
                ) ||
                (typeof selectedProject.customerId === "object" ? selectedProject.customerId : null) ||
                customers.find((c) => c._id === aiCustomerId)
              }
              onClose={() => setSelectedProject(null)}
              onSaveVersion={async (versionData) => {
                const res = await addCreativeVersion(selectedProject._id, versionData);
                if (res?.project) {
                  setSelectedProject(res.project);
                }
                await fetchData();
              }}
              onSubmitApproval={async (id) => {
                await handleSubmitApproval(id);
              }}
              onApprove={async (id) => {
                await handleApprove(id);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
