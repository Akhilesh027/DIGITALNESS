import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DailyUpdateStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Pending Review'
  | 'Approved'
  | 'Revision Requested'
  | 'Blocked';

export interface DailyUpdate {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  projectId?: string;
  projectName?: string;
  customerId?: string;
  customerName?: string;
  taskId?: string;
  taskTitle?: string;
  timeSpent: number; // hours
  progressPct: number;
  status: DailyUpdateStatus;
  workDone: string;
  blockers?: string;
  tomorrowPlan?: string;
  attachments: string[];
  referenceLinks: string[];
  managerComment?: string;
  revisionReason?: string;
  reviewedAt?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

const today = () => new Date().toISOString().split('T')[0];

const seed: DailyUpdate[] = [
  {
    id: 'DU001', employeeId: 'EMP007', employeeName: 'Arjun Patel',
    date: today(), projectId: 'PROJ001', projectName: 'Website Development',
    customerId: 'CUST001', customerName: 'ABC Pvt Ltd',
    taskId: 'TASK001', taskTitle: 'Homepage UI Design',
    timeSpent: 4.5, progressPct: 60, status: 'In Progress',
    workDone: 'Completed homepage header section and started hero section design. Implemented responsive layout for mobile and tablet.',
    blockers: 'Waiting for content from client for hero section.',
    tomorrowPlan: 'Complete hero section and start about section design.',
    attachments: [], referenceLinks: [],
    isDraft: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'DU002', employeeId: 'EMP007', employeeName: 'Arjun Patel',
    date: '2024-05-16', projectId: 'PROJ001', projectName: 'Website Development',
    customerId: 'CUST001', customerName: 'ABC Pvt Ltd',
    taskTitle: 'Homepage UI Design',
    timeSpent: 7, progressPct: 45, status: 'Approved',
    workDone: 'Wireframes finalised and component library set up.',
    tomorrowPlan: 'Begin hero section visuals.',
    managerComment: 'Good progress keep it up! Please ensure the responsive breakpoints are consistent.',
    reviewedAt: '2024-05-16T16:45:00',
    attachments: [], referenceLinks: [],
    isDraft: false, createdAt: '2024-05-16T09:00:00', updatedAt: '2024-05-16T17:00:00',
  },
  {
    id: 'DU003', employeeId: 'EMP007', employeeName: 'Arjun Patel',
    date: '2024-05-14', taskTitle: 'Landing page revisions',
    timeSpent: 6, progressPct: 80, status: 'Revision Requested',
    workDone: 'Updated CTA placement and section ordering.',
    revisionReason: 'Adjust spacing on mobile; align CTA with brand guidelines.',
    attachments: [], referenceLinks: [],
    isDraft: false, createdAt: '2024-05-14T09:00:00', updatedAt: '2024-05-15T10:00:00',
  },
];

interface DailyUpdateState {
  updates: DailyUpdate[];
  upsert: (u: DailyUpdate) => void;
  remove: (id: string) => void;
  review: (id: string, status: DailyUpdateStatus, comment?: string, revisionReason?: string) => void;
  forEmployee: (employeeId: string) => DailyUpdate[];
  forDate: (employeeId: string, date: string) => DailyUpdate | undefined;
}

export const useDailyUpdateStore = create<DailyUpdateState>()(
  persist(
    (set, get) => ({
      updates: seed,
      upsert: (u) =>
        set((s) => {
          const exists = s.updates.some((x) => x.id === u.id);
          return {
            updates: exists
              ? s.updates.map((x) => (x.id === u.id ? { ...u, updatedAt: new Date().toISOString() } : x))
              : [{ ...u, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.updates],
          };
        }),
      remove: (id) => set((s) => ({ updates: s.updates.filter((x) => x.id !== id) })),
      review: (id, status, comment, revisionReason) =>
        set((s) => ({
          updates: s.updates.map((x) =>
            x.id === id
              ? {
                  ...x, status,
                  managerComment: comment ?? x.managerComment,
                  revisionReason: revisionReason ?? x.revisionReason,
                  reviewedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : x
          ),
        })),
      forEmployee: (employeeId) => get().updates.filter((u) => u.employeeId === employeeId),
      forDate: (employeeId, date) =>
        get().updates.find((u) => u.employeeId === employeeId && u.date === date),
    }),
    { name: 'digitalness-daily-updates-v1' }
  )
);

export const statusBadgeClass: Record<DailyUpdateStatus, string> = {
  'Not Started': 'bg-muted text-muted-foreground border-border',
  'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Submitted: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  'Pending Review': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'Revision Requested': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  Blocked: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};
