import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Invoice,
  Deliverable,
  PaymentRecord,
  PaymentReminder,
  invoices as initialInvoices,
  deliverables as initialDeliverables,
  paymentRecords as initialPayments,
  paymentReminders as initialReminders,
} from '@/data/invoiceData';

interface InvoiceState {
  invoices: Invoice[];
  deliverables: Deliverable[];
  paymentRecords: PaymentRecord[];
  paymentReminders: PaymentReminder[];

  // Invoice actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Deliverable actions
  addDeliverable: (deliverable: Deliverable) => void;
  updateDeliverable: (id: string, data: Partial<Deliverable>) => void;
  deleteDeliverable: (id: string) => void;
  addDeliverableComment: (deliverableId: string, comment: Deliverable['comments'][0]) => void;

  // Payment actions
  addPaymentRecord: (payment: PaymentRecord) => void;
  addPaymentReminder: (reminder: PaymentReminder) => void;
  updatePaymentReminder: (id: string, data: Partial<PaymentReminder>) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: initialInvoices,
      deliverables: initialDeliverables,
      paymentRecords: initialPayments,
      paymentReminders: initialReminders,

      addInvoice: (invoice) => set((s) => ({ invoices: [...s.invoices, invoice] })),
      updateInvoice: (id, data) => set((s) => ({
        invoices: s.invoices.map((inv) => inv.id === id ? { ...inv, ...data } : inv),
      })),
      deleteInvoice: (id) => set((s) => ({
        invoices: s.invoices.filter((inv) => inv.id !== id),
      })),

      addDeliverable: (deliverable) => set((s) => ({ deliverables: [...s.deliverables, deliverable] })),
      updateDeliverable: (id, data) => set((s) => ({
        deliverables: s.deliverables.map((d) => d.id === id ? { ...d, ...data } : d),
      })),
      deleteDeliverable: (id) => set((s) => ({
        deliverables: s.deliverables.filter((d) => d.id !== id),
      })),
      addDeliverableComment: (deliverableId, comment) => set((s) => ({
        deliverables: s.deliverables.map((d) =>
          d.id === deliverableId ? { ...d, comments: [...d.comments, comment] } : d
        ),
      })),

      addPaymentRecord: (payment) => set((s) => ({ paymentRecords: [...s.paymentRecords, payment] })),
      addPaymentReminder: (reminder) => set((s) => ({ paymentReminders: [...s.paymentReminders, reminder] })),
      updatePaymentReminder: (id, data) => set((s) => ({
        paymentReminders: s.paymentReminders.map((r) => r.id === id ? { ...r, ...data } : r),
      })),
    }),
    { name: 'digitalness-invoice-storage' }
  )
);
