import React from 'react';
import { Layers, AlertTriangle, CheckCircle, Play, X, RotateCcw, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from './RiskBadge';

interface BlueprintAction {
  step?: number;
  order?: number;
  action?: string;
  name?: string;
  command?: string;
  status?: string;
}

interface CommandBlueprintCardProps {
  blueprintId?: string;
  executionId: string;
  command: string;
  riskLevel: string;
  approvalRequired: boolean;
  actions: BlueprintAction[];
  warnings?: string[];
  status: string;
  supportsRollback?: boolean;
  onApprove?: (executionId: string) => void;
  onReject?: (executionId: string) => void;
  onRollback?: (executionId: string) => void;
  loading?: boolean;
}

export const CommandBlueprintCard: React.FC<CommandBlueprintCardProps> = ({
  blueprintId,
  executionId,
  command,
  riskLevel,
  approvalRequired,
  actions = [],
  warnings = [],
  status,
  supportsRollback = false,
  onApprove,
  onReject,
  onRollback,
  loading = false,
}) => {
  const isActionable = status === 'WAITING_APPROVAL' || status === 'READY' || status === 'DRAFT';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED' || status === 'PARTIALLY_FAILED';

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-md p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Execution Blueprint</h3>
              {blueprintId && <span className="font-mono text-[11px] text-slate-400">({blueprintId})</span>}
            </div>
            <p className="text-xs text-slate-500">Deterministic sequence of CRM actions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge riskLevel={riskLevel} />
          <Badge
            className={
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : isActionable
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : isFailed
                ? 'bg-rose-100 text-rose-800'
                : 'bg-indigo-100 text-indigo-800'
            }
          >
            {status}
          </Badge>
        </div>
      </div>

      {/* Sequential Actions List */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Planned Actions</span>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
          {actions.map((act, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 text-xs">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                {act.step || act.order || idx + 1}
              </span>
              <span className="font-medium text-slate-800 flex-1">{act.action || act.name}</span>
              {act.status === 'COMPLETED' ? (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Done
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">{act.command || command}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Risk Guardrails */}
      {warnings && warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Policy Warnings & Constraints</span>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 pl-6 list-disc">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
        <div className="text-[11px] text-slate-400 font-mono">
          Execution ID: <span className="font-semibold text-slate-600">{executionId}</span>
        </div>

        <div className="flex items-center gap-2">
          {isActionable && (
            <>
              {onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => onReject(executionId)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              )}
              {onApprove && (
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => onApprove(executionId)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-bold gap-1.5 px-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {command === 'lead.create' ? 'Create Lead Now' : 'Approve & Execute'}
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {isCompleted && supportsRollback && onRollback && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onRollback(executionId)}
              className="text-slate-700 hover:bg-slate-100 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Undo Action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
