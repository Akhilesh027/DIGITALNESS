import React from 'react';
import { Brain, Building2, User, FileText, IndianRupee, Tag, CheckCircle2 } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

interface CommandUnderstandingCardProps {
  intent?: string;
  command?: string;
  category?: string;
  riskLevel?: string;
  resolvedEntities?: {
    customerName?: string;
    employeeName?: string;
    taskTitle?: string;
    leadName?: string;
    locationName?: string;
  };
  parameters?: Record<string, any>;
  confidence?: number;
}

export const CommandUnderstandingCard: React.FC<CommandUnderstandingCardProps> = ({
  intent = '',
  command = '',
  category = 'GENERAL',
  riskLevel = 'READ',
  resolvedEntities = {},
  parameters = {},
  confidence,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Command Understanding</h3>
            <p className="text-xs text-slate-400">Natural language parsed & verified by safety engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge riskLevel={riskLevel} />
          {confidence && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {Math.round(confidence * 100)}% match
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Intent & Command */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Target Command</span>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 truncate" title={command}>
            <Tag className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{command || intent}</span>
          </div>
        </div>

        {/* Resolved Client */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Resolved Client</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{resolvedEntities.customerName || 'None required'}</span>
            {resolvedEntities.customerName && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto flex-shrink-0" />}
          </div>
        </div>

        {/* Resolved Employee / Assignee */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Resolved Employee</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
            <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{resolvedEntities.employeeName || 'None'}</span>
            {resolvedEntities.employeeName && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto flex-shrink-0" />}
          </div>
        </div>

        {/* Amount / Task / Lead Payload */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Payload / Reference</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
            {parameters.amount ? (
              <>
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-emerald-700">₹{Number(parameters.amount).toLocaleString('en-IN')}</span>
              </>
            ) : resolvedEntities.taskTitle ? (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{resolvedEntities.taskTitle}</span>
              </>
            ) : resolvedEntities.leadName ? (
              <>
                <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{resolvedEntities.leadName}</span>
              </>
            ) : (
              <span className="text-slate-400 text-xs">Standard Query</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
