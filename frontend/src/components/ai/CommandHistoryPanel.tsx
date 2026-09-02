import React from 'react';
import { History, Clock, CheckCircle2, AlertTriangle, ChevronRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from './RiskBadge';

interface CommandHistoryItem {
  _id: string;
  executionId: string;
  originalPrompt: string;
  intent: string;
  command: string;
  riskLevel: string;
  status: string;
  createdAt: string;
  resolvedEntities?: {
    customerName?: string;
    employeeName?: string;
  };
}

interface CommandHistoryPanelProps {
  history: CommandHistoryItem[];
  onSelectExecution?: (item: CommandHistoryItem) => void;
  selectedExecutionId?: string;
  loading?: boolean;
}

export const CommandHistoryPanel: React.FC<CommandHistoryPanelProps> = ({
  history = [],
  onSelectExecution,
  selectedExecutionId,
  loading = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Recent Commands</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          {history.length} logged
        </span>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          No CRM commands logged yet. Run your first command above!
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
          {history.map((item) => {
            const isSelected = item.executionId === selectedExecutionId;
            return (
              <div
                key={item._id || item.executionId}
                onClick={() => onSelectExecution && onSelectExecution(item)}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs truncate">
                      {item.originalPrompt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono text-indigo-600">{item.command}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] py-0 font-semibold ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.status === 'WAITING_APPROVAL'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : item.status === 'ROLLED_BACK'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {item.status}
                  </Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
