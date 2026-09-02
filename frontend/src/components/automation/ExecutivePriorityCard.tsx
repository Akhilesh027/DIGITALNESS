import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  DollarSign,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
} from "lucide-react";
import { ExecutivePriorityItem } from "@/api/automationApi";

interface ExecutivePriorityCardProps {
  item: ExecutivePriorityItem;
  onExecuteAction?: (item: ExecutivePriorityItem) => void;
}

export const ExecutivePriorityCard: React.FC<ExecutivePriorityCardProps> = ({
  item,
  onExecuteAction,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DELIVERY":
        return <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />;
      case "COLLECTION":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case "SALES":
        return <Users className="w-3.5 h-3.5 text-amber-600" />;
      case "CONTENT":
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3">
      {/* TOP ROW */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-semibold gap-1 bg-slate-50">
            {getCategoryIcon(item.category)}
            {item.category}
          </Badge>
          <span className="text-xs font-bold text-slate-900 truncate">
            {item.clientName || "Agency Operations"}
          </span>
        </div>

        <Badge className={`text-[10px] font-bold py-0.5 px-2 border ${getSeverityBadgeClass(item.severity)}`}>
          {item.score}/100 Priority
        </Badge>
      </div>

      {/* TITLE & DESCRIPTION */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{item.description}</p>
      </div>

      {/* FOOTER ACTION */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-[10px] font-semibold text-slate-400">
          Reason: <strong className="text-slate-700">{item.reason}</strong>
        </span>

        {item.recommendedAction && onExecuteAction && (
          <Button
            size="sm"
            onClick={() => onExecuteAction(item)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] h-7 px-2.5 gap-1 shadow-xs"
          >
            {item.recommendedAction.label} <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
