import React, { useState } from "react";
import { Building2, CheckCircle2, ChevronRight, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityPickerBlock } from "@/types/workspaceChat";

interface ClientEntityPickerProps {
  block: EntityPickerBlock;
  onSelect: (candidateId: string) => void;
  disabled?: boolean;
}

export const ClientEntityPicker: React.FC<ClientEntityPickerProps> = ({
  block,
  onSelect,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = block.candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  const handlePick = (id: string) => {
    if (disabled) return;
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-tight">Select Client to Continue</span>
        </div>
        <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200">
          {block.totalCandidatesCount || block.candidates.length} Available Clients
        </Badge>
      </div>

      {block.candidates.length > 5 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search client name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-white/80 border-slate-200"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {filtered.map((c) => {
          const isSelected = selectedId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handlePick(c.id)}
              disabled={disabled}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white hover:bg-indigo-50/50 border-slate-200/90 text-slate-800 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate leading-tight">{c.name}</p>
                  <p className={`text-[10px] truncate ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                    {c.industry || "Active Client"} {c.city ? `• ${c.city}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
