import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

interface RiskBadgeProps {
  riskLevel?: string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel = 'READ', className = '' }) => {
  switch (riskLevel) {
    case 'READ':
      return (
        <Badge variant="outline" className={`bg-emerald-50 text-emerald-700 border-emerald-200 font-medium ${className}`}>
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
          READ • Safe Query
        </Badge>
      );

    case 'DRAFT':
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 font-medium ${className}`}>
          <Shield className="w-3 h-3 mr-1 text-blue-600" />
          DRAFT • No Side Effects
        </Badge>
      );

    case 'LOW_RISK_WRITE':
      return (
        <Badge variant="outline" className={`bg-indigo-50 text-indigo-700 border-indigo-200 font-medium ${className}`}>
          <Shield className="w-3 h-3 mr-1 text-indigo-600" />
          LOW RISK WRITE
        </Badge>
      );

    case 'APPROVAL_REQUIRED':
      return (
        <Badge variant="outline" className={`bg-amber-50 text-amber-800 border-amber-300 font-semibold ${className}`}>
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
          APPROVAL REQUIRED
        </Badge>
      );

    case 'RESTRICTED':
      return (
        <Badge variant="outline" className={`bg-rose-50 text-rose-800 border-rose-300 font-semibold ${className}`}>
          <Lock className="w-3 h-3 mr-1 text-rose-600" />
          RESTRICTED • Blocked
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className={`bg-slate-50 text-slate-700 border-slate-200 ${className}`}>
          {riskLevel}
        </Badge>
      );
  }
};
