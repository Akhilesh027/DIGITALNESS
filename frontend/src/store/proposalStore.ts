import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Proposal, ProposalStatus, proposals as initialProposals } from '@/data/proposalData';

interface ProposalState {
  proposals: Proposal[];
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: string, data: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;
  setStatus: (id: string, status: ProposalStatus) => void;
}

export const useProposalStore = create<ProposalState>()(
  persist(
    (set) => ({
      proposals: initialProposals,
      addProposal: (proposal) => set((s) => ({ proposals: [...s.proposals, proposal] })),
      updateProposal: (id, data) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deleteProposal: (id) =>
        set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),
      setStatus: (id, status) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status } : p)) })),
    }),
    { name: 'digitalness-proposal-storage', version: 1 }
  )
);
