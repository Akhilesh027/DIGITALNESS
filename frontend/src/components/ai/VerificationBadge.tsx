import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface VerificationBadgeProps {
  status?: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_REQUIRED' | string;
  details?: string;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status = 'NOT_REQUIRED',
  details = '',
  className = '',
}) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge className={`bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 px-2.5 py-1 ${className}`} title={details}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-xs">DB Verified</span>
        </Badge>
      );

    case 'FAILED':
      return (
        <Badge className={`bg-rose-100 text-rose-800 border-rose-300 gap-1 px-2.5 py-1 ${className}`} title={details}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span className="font-semibold text-xs">Verification Failed</span>
        </Badge>
      );

    case 'PENDING':
      return (
        <Badge className={`bg-amber-100 text-amber-800 border-amber-300 gap-1 px-2.5 py-1 ${className}`} title={details}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span className="font-medium text-xs">Verifying DB...</span>
        </Badge>
      );

    case 'NOT_REQUIRED':
    default:
      return (
        <Badge variant="outline" className={`bg-slate-50 text-slate-600 border-slate-200 gap-1 px-2 py-0.5 text-xs ${className}`}>
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <span>Read Only</span>
        </Badge>
      );
  }
};
