import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Deal, DealStage, DealCallLog, deals as initialDeals } from '@/data/dealData';

interface DealState {
  deals: Deal[];
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDealStage: (id: string, stage: DealStage, extra?: Partial<Deal>) => void;
  addCallLog: (dealId: string, log: DealCallLog) => void;
}

export const useDealStore = create<DealState>()(
  persist(
    (set) => ({
      deals: initialDeals,
      addDeal: (deal) => set((s) => ({ deals: [...s.deals, deal] })),
      updateDeal: (id, data) =>
        set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
      deleteDeal: (id) => set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),
      moveDealStage: (id, stage, extra) =>
        set((s) => ({
          deals: s.deals.map((d) => (d.id === id ? { ...d, stage, ...(extra || {}) } : d)),
        })),
      addCallLog: (dealId, log) =>
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, callLogs: [...d.callLogs, log] } : d
          ),
        })),
    }),
    { name: 'digitalness-deal-storage', version: 1 }
  )
);
