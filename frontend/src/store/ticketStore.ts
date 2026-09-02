import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupportTicket } from '@/data/dummyData';
import { supportTickets as initialTickets } from '@/data/ticketData';

interface TicketState {
  tickets: SupportTicket[];
  addTicket: (t: SupportTicket) => void;
  updateTicket: (id: string, data: Partial<SupportTicket>) => void;
  deleteTicket: (id: string) => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set) => ({
      tickets: initialTickets,
      addTicket: (t) => set((s) => ({ tickets: [t, ...s.tickets] })),
      updateTicket: (id, data) =>
        set((s) => ({
          tickets: s.tickets.map((x) =>
            x.id === id ? { ...x, ...data, updatedOn: new Date().toISOString().split('T')[0] } : x
          ),
        })),
      deleteTicket: (id) => set((s) => ({ tickets: s.tickets.filter((x) => x.id !== id) })),
    }),
    { name: 'digitalness-tickets-v1' }
  )
);
