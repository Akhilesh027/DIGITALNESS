import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarItem } from "@/api/automationApi";
import { CalendarItemDrawer } from "./CalendarItemDrawer";

interface ContentCalendarGridProps {
  items: CalendarItem[];
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
  onSelectAll: () => void;
  onApproveSingle?: (itemKey: string) => void;
}

export const ContentCalendarGrid: React.FC<ContentCalendarGridProps> = ({
  items,
  selectedKeys,
  onToggleKey,
  onSelectAll,
  onApproveSingle,
}) => {
  const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);

  const getSourceBadgeClass = (sourceType: string) => {
    switch (sourceType) {
      case "FESTIVAL":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "SEASONAL":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "OFFER":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* GRID HEADER CONTROLS */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-xs font-semibold text-slate-700 gap-1.5 h-8 px-2"
          >
            {selectedKeys.length === items.length && items.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            Select All ({selectedKeys.length}/{items.length})
          </Button>
        </div>

        <span className="text-xs text-slate-400">Click any card to inspect full creative brief & visual prompt</span>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const isSelected = selectedKeys.includes(item.itemKey);
          const isApproved = item.status === "APPROVED";

          return (
            <div
              key={item.itemKey}
              onClick={() => setActiveItem(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative space-y-2.5 ${
                isSelected
                  ? "border-indigo-400 bg-indigo-50/40 shadow-xs"
                  : isApproved
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* TOP ROW: Checkbox, Date & Type */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleKey(item.itemKey);
                    }}
                    className="cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(item.plannedDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge className={`text-[10px] font-semibold py-0 px-2 border ${getSourceBadgeClass(item.sourceType)}`}>
                    {item.sourceType}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono text-slate-500 bg-white">
                    {item.contentType}
                  </Badge>
                </div>
              </div>

              {/* HEADLINE & OCCASION */}
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{item.headline}</p>
                <span className="text-[11px] text-slate-400 font-medium block truncate">
                  Topic: {item.occasion}
                </span>
              </div>

              {/* CAPTION PREVIEW */}
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.caption}
              </p>

              {/* STATUS & REASONING TAG */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="text-indigo-600 font-medium truncate max-w-[140px]">
                  🎯 {item.reasoningTags && item.reasoningTags[0] ? item.reasoningTags[0] : "Targeted"}
                </span>
                <Badge
                  className={`text-[9px] py-0 px-1.5 ${
                    isApproved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL DRAWER */}
      <CalendarItemDrawer
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        item={activeItem}
        onApprove={onApproveSingle}
      />
    </div>
  );
};
