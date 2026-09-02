import React from 'react';
import { HelpCircle, User, Building2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Candidate {
  id: string;
  name: string;
  role?: string;
  companyName?: string;
  city?: string;
  email?: string;
}

interface AmbiguityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: string;
  message?: string;
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
}

export const AmbiguityModal: React.FC<AmbiguityModalProps> = ({
  isOpen,
  onClose,
  entityType = 'Entity',
  message = '',
  candidates = [],
  onSelectCandidate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <HelpCircle className="w-5 h-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Multiple Matches Found
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-600">
            {message || `Please select the exact ${entityType} you intended.`}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              onClick={() => onSelectCandidate(cand)}
              className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-indigo-50/80 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  {entityType === 'Employee' ? <User className="w-3.5 h-3.5 text-slate-500" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{cand.name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {cand.role && <span>Role: {cand.role}</span>}
                  {cand.companyName && <span>Company: {cand.companyName}</span>}
                  {cand.email && <span> • {cand.email}</span>}
                  {cand.city && <span> • {cand.city}</span>}
                </div>
              </div>

              <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-100 text-xs font-semibold">
                Select <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
