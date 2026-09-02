import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Layers,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
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
  getServicePackages,
  getTeamWorkload,
  previewClientPipeline,
  generateClientPipeline,
  regenerateClientPipeline,
  ServicePackage,
  EmployeeCapacity,
  PipelinePreview,
} from "@/api/automationApi";
import { TeamCapacityCard } from "./TeamCapacityCard";
import { PipelineBlueprintModal } from "./PipelineBlueprintModal";

interface ClientPipelinePanelProps {
  customers: any[];
  onPipelineCreated?: () => void;
}

export const ClientPipelinePanel: React.FC<ClientPipelinePanelProps> = ({
  customers,
  onPipelineCreated,
}) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [teamWorkload, setTeamWorkload] = useState<EmployeeCapacity[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PipelinePreview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [pkgs, team] = await Promise.all([
        getServicePackages().catch(() => []),
        getTeamWorkload().catch(() => []),
      ]);
      setPackages(pkgs);
      setTeamWorkload(team);
      if (pkgs.length > 0 && !selectedPackageId) {
        setSelectedPackageId(pkgs[0]._id);
      }
      if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0]._id);
      }
    } catch (err: any) {
      toast({ title: "Failed to load pipeline data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, [customers]);

  const handlePreviewPipeline = async () => {
    if (!selectedCustomerId) {
      toast({ title: "Client Required", description: "Please select a client.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const preview = await previewClientPipeline({
        customerId: selectedCustomerId,
        packageId: selectedPackageId || undefined,
        month: targetMonth,
        year: targetYear,
      });

      setPreviewData(preview);
      setIsModalOpen(true);
    } catch (err: any) {
      toast({ title: "Preview Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePipeline = async (customizedDeliverables: any[]) => {
    if (!selectedCustomerId) return;

    try {
      setIsExecuting(true);
      const res = await generateClientPipeline({
        customerId: selectedCustomerId,
        packageId: selectedPackageId,
        month: targetMonth,
        year: targetYear,
        deliverables: customizedDeliverables,
      });

      toast({
        title: "Deliverable Pipeline Created! 🎉",
        description: res.message || `Created ${customizedDeliverables.length} tasks in CRM.`,
      });

      setIsModalOpen(false);
      if (onPipelineCreated) onPipelineCreated();
      await loadBaseData();
    } catch (err: any) {
      toast({ title: "Pipeline Execution Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExecuting(false);
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
      {/* PIPELINE GENERATOR CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Zero-Touch Client Onboarding & Monthly Deliverable Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a client and service package to auto-generate the complete monthly deliverable roadmap with capacity balancing.
            </p>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs w-fit">
            Phase 5B Engine
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Client Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Client</label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
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

          {/* Package Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Service Package Template</label>
            <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
              <SelectTrigger className="bg-slate-50 text-xs">
                <SelectValue placeholder="Select Package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg._id} value={pkg._id}>
                    {pkg.name} ({pkg.deliverables.reduce((acc, d) => acc + d.quantity, 0)} Items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Month</label>
            <Select
              value={String(targetMonth)}
              onValueChange={(val) => setTargetMonth(Number(val))}
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

          {/* Action Trigger */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <Button
              onClick={handlePreviewPipeline}
              disabled={loading || !selectedCustomerId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 h-9 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating Roadmap..." : "Generate Pipeline Roadmap"}
            </Button>
          </div>
        </div>
      </div>

      {/* TEAM CAPACITY SCORES */}
      <TeamCapacityCard capacities={teamWorkload} loading={loading} />

      {/* BLUEPRINT APPROVAL MODAL */}
      <PipelineBlueprintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preview={previewData}
        onApprove={handleApprovePipeline}
        isExecuting={isExecuting}
        employees={teamWorkload}
      />
    </div>
  );
};
