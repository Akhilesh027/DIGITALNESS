import React from "react";
import { User, Activity, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmployeeCapacity } from "@/api/automationApi";

interface TeamCapacityCardProps {
  capacities: EmployeeCapacity[];
  loading?: boolean;
}

export const TeamCapacityCard: React.FC<TeamCapacityCardProps> = ({ capacities, loading }) => {
  const getCapacityColor = (percent: number) => {
    if (percent >= 80) return "bg-rose-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getCapacityBadge = (percent: number) => {
    if (percent >= 80) return "bg-rose-100 text-rose-800 border-rose-200";
    if (percent >= 50) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Live Team Capacity & Workload Scores
          </h3>
          <p className="text-xs text-slate-500">
            Multivariate workload balancing score (Active + Urgent + Overdue + Availability).
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {capacities.length} Active Members
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {capacities.map((emp) => (
          <div
            key={emp.employeeId}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {emp.employeeName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{emp.employeeName}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{emp.role}</span>
                </div>
              </div>
              <Badge className={`text-[10px] font-semibold py-0 px-2 border ${getCapacityBadge(emp.capacityPercent)}`}>
                {emp.capacityPercent}% Load
              </Badge>
            </div>

            {/* Load Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getCapacityColor(emp.capacityPercent)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, emp.capacityPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                {emp.activeTasks} Active
              </span>
              {emp.urgentTasks > 0 && (
                <span className="text-amber-600 font-semibold flex items-center gap-0.5 text-[10px]">
                  🔥 {emp.urgentTasks} Urgent
                </span>
              )}
              {emp.overdueTasks > 0 && (
                <span className="text-rose-600 font-semibold flex items-center gap-0.5 text-[10px]">
                  ⚠️ {emp.overdueTasks} Overdue
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
