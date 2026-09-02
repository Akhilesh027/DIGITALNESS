import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CommChannel = 'WhatsApp' | 'Email' | 'Call' | 'Meeting' | 'SMS';
export type CommDirection = 'Inbound' | 'Outbound';

export interface Communication {
  id: string;
  customerId: string;
  channel: CommChannel;
  direction: CommDirection;
  subject?: string;
  message: string;
  by: string;
  byName?: string;
  createdAt: string;
}

const seed: Communication[] = [
  { id: 'COM001', customerId: 'CUST001', channel: 'WhatsApp', direction: 'Outbound',
    message: 'Sent monthly performance report PDF.', by: 'EMP005', byName: 'Venkat Krishna',
    createdAt: '2024-12-04T11:20:00' },
  { id: 'COM002', customerId: 'CUST001', channel: 'Email', direction: 'Inbound',
    subject: 'Re: Website Draft', message: 'Looks great, please update the hero section copy.',
    by: 'CUST001', byName: 'Sunrise Hospital', createdAt: '2024-12-05T09:10:00' },
  { id: 'COM003', customerId: 'CUST003', channel: 'Call', direction: 'Outbound',
    message: 'Discussed November ROAS — agreed on a budget bump.',
    by: 'EMP003', byName: 'Rahul Verma', createdAt: '2024-12-02T15:45:00' },
];

interface CommState {
  comms: Communication[];
  addComm: (c: Communication) => void;
  deleteComm: (id: string) => void;
  forCustomer: (id: string) => Communication[];
}

export const useCommunicationStore = create<CommState>()(
  persist(
    (set, get) => ({
      comms: seed,
      addComm: (c) => set((s) => ({ comms: [c, ...s.comms] })),
      deleteComm: (id) => set((s) => ({ comms: s.comms.filter((c) => c.id !== id) })),
      forCustomer: (id) =>
        get().comms.filter((c) => c.customerId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    { name: 'digitalness-comm-v1' }
  )
);
