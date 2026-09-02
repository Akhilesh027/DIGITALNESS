import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType = 'Call' | 'Meeting' | 'WhatsApp' | 'Email' | 'Note';
export type ActivityRelation = 'lead' | 'deal' | 'customer';

export interface Activity {
  id: string;
  type: ActivityType;
  relation: ActivityRelation;
  relatedId: string;
  notes: string;
  by: string; // user/employee id
  byName?: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

const seed: Activity[] = [
  {
    id: 'ACT001', type: 'Call', relation: 'lead', relatedId: 'LEAD001',
    notes: 'Discussed package options. Interested in website + DM bundle.',
    by: 'EMP001', byName: 'Akhil Reddy', nextFollowUpDate: '2024-12-12',
    createdAt: '2024-12-05T10:30:00',
  },
  {
    id: 'ACT002', type: 'Meeting', relation: 'deal', relatedId: 'DEAL002',
    notes: 'On-site demo at jewellery store. Owner aligned on scope.',
    by: 'EMP003', byName: 'Rahul Verma',
    createdAt: '2024-12-03T15:00:00',
  },
  {
    id: 'ACT003', type: 'WhatsApp', relation: 'customer', relatedId: 'CUST001',
    notes: 'Shared website draft preview link for review.',
    by: 'EMP005', byName: 'Venkat Krishna',
    createdAt: '2024-12-04T11:20:00',
  },
];

interface ActivityState {
  activities: Activity[];
  addActivity: (a: Activity) => void;
  deleteActivity: (id: string) => void;
  forRelation: (relation: ActivityRelation, id: string) => Activity[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: seed,
      addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
      deleteActivity: (id) =>
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
      forRelation: (relation, id) =>
        get().activities
          .filter((a) => a.relation === relation && a.relatedId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    { name: 'digitalness-activities-v1' }
  )
);
