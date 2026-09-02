import { Lead, LeadScore } from '@/data/dummyData';

// Compute Hot/Warm/Cold from qualification inputs.
// Each criterion contributes a small weight; sum drives the band.
export function computeLeadScore(input: Partial<Lead>): LeadScore {
  let score = 0;
  if (input.requirementClarity === 'Clear') score += 2;
  if (input.budgetMatch === 'Yes') score += 3;
  if (input.decisionMaker === 'Yes') score += 2;
  if (input.timeline === 'Urgent') score += 3;
  else if (input.timeline === 'Normal') score += 1;
  if ((input.probability ?? 0) >= 70) score += 2;
  else if ((input.probability ?? 0) >= 40) score += 1;

  if (score >= 8) return 'Hot';
  if (score >= 4) return 'Warm';
  return 'Cold';
}

export const scoreBadgeClass: Record<LeadScore, string> = {
  Hot: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  Warm: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Cold: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
};
