import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  Sparkles,
  Trash2,
  Plus,
} from "lucide-react";
import { PipelinePreview, EmployeeCapacity } from "@/api/automationApi";

interface PipelineBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: PipelinePreview | null;
  onApprove: (customizedDeliverables: any[]) => void;
  isExecuting?: boolean;
  employees: EmployeeCapacity[];
}

export const PipelineBlueprintModal: React.FC<PipelineBlueprintModalProps> = ({
  isOpen,
  onClose,
  preview,
  onApprove,
  isExecuting = false,
  employees,
}) => {
  if (!preview) return null;

  const [deliverables, setDeliverables] = useState<any[]>(preview.deliverables || []);

  const handleAssigneeChange = (index: number, employeeId: string) => {
    const selectedEmp = employees.find((e) => e.employeeId === employeeId);
    setDeliverables((prev) =>
      prev.map((d, i) =>
        i === index
          ? {
              ...d,
              assignedTo: employeeId,
              assignedToName: selectedEmp ? selectedEmp.employeeName : "Unassigned",
              assignedToRole: selectedEmp ? selectedEmp.role : "N/A",
            }
          : d
      )
    );
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-6 space-y-5">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Autonomous Onboarding Blueprint
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Period: {preview.period.formatted}</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
            Client Deliverable Pipeline: {preview.client.name}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Package: <strong className="text-slate-700">{preview.package.name}</strong> • Total {deliverables.length} Deliverables
          </p>
        </DialogHeader>

        {/* SUMMARY HEADER CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Deliverables</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{deliverables.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Team Allocated</span>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{preview.teamAllocation.length} Members</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400">First Deadline</span>
            <p className="text-xs font-bold text-slate-800 mt-1.5">
              {new Date(preview.summary.firstDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Final Review</span>
            <p className="text-xs font-bold text-slate-800 mt-1.5">
              {new Date(preview.summary.finalDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* TEAM WORKLOAD DISTRIBUTION PREVIEW */}
        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2">
          <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            Smart Team Allocation Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {preview.teamAllocation.map((member) => (
              <div key={member.employeeId} className="bg-white p-2.5 rounded-lg border border-indigo-100 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{member.name}</span>
                  <Badge variant="outline" className="text-[10px]">{member.taskCount} tasks</Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{member.role}</span>
                  <span className="text-indigo-600 font-semibold">{member.capacityPercent}% load</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DELIVERABLES CHECKLIST */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Scheduled Deliverables ({deliverables.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Click assignee dropdown to reassign</span>
          </h4>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
            {deliverables.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs bg-white hover:bg-slate-50">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Due: {new Date(item.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      <span>•</span>
                      <span>SLA: {item.slaHours}h</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={item.assignedTo || ""}
                    onChange={(e) => handleAssigneeChange(idx, e.target.value)}
                    className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 py-0 font-medium text-slate-700"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.employeeName} ({emp.role})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isExecuting} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(deliverables)}
            disabled={isExecuting || deliverables.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isExecuting ? "Creating Work Records in MongoDB..." : `Approve & Create ${deliverables.length} Deliverables`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
