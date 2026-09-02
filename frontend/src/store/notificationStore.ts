import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifType = 'task' | 'approval' | 'invoice' | 'lead' | 'system';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body?: string;
  link?: string;
  forRole?: string;
  forUserId?: string;
  read: boolean;
  createdAt: string;
}

const seed: Notification[] = [
  { id: 'N001', type: 'task', title: 'Task overdue: CMS Integration',
    body: 'Sunrise Hospital · deadline passed', link: '/tasks',
    forRole: 'Manager', read: false, createdAt: '2024-12-06T08:00:00' },
  { id: 'N002', type: 'approval', title: 'Pending: Acme proposal',
    body: 'Awaiting client approval', link: '/proposals',
    forRole: 'Admin', read: false, createdAt: '2024-12-06T09:00:00' },
  { id: 'N003', type: 'invoice', title: 'Invoice INV-2024-002 overdue',
    body: '₹85,000 from Acme Wellness', link: '/invoices',
    forRole: 'Accountant', read: true, createdAt: '2024-12-05T08:00:00' },
];

interface NotifState {
  notifs: Notification[];
  push: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: (role?: string) => void;
  unreadCount: (role?: string) => number;
  forRole: (role?: string) => Notification[];
}

export const useNotificationStore = create<NotifState>()(
  persist(
    (set, get) => ({
      notifs: seed,
      push: (n) => set((s) => ({ notifs: [n, ...s.notifs] })),
      markRead: (id) =>
        set((s) => ({
          notifs: s.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: (role) =>
        set((s) => ({
          notifs: s.notifs.map((n) =>
            !role || n.forRole === role ? { ...n, read: true } : n
          ),
        })),
      unreadCount: (role) =>
        get().notifs.filter((n) => !n.read && (!role || !n.forRole || n.forRole === role)).length,
      forRole: (role) =>
        get().notifs
          .filter((n) => !role || !n.forRole || n.forRole === role)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    { name: 'digitalness-notif-v1' }
  )
);
