import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpenseCategory =
  | 'Ad Spend' | 'Tools/Software' | 'Freelancer' | 'Travel'
  | 'Office' | 'Salary' | 'Misc';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  customerId?: string; // if expense is project-attributed
  projectId?: string;
  branchId?: string;
  paidTo?: string;
  createdAt: string;
}

const seed: Expense[] = [
  { id: 'EXP001', date: '2024-12-01', category: 'Ad Spend', amount: 45000,
    description: 'Meta Ads — Sunrise Hospital December campaign',
    customerId: 'CUST001', projectId: 'PROJ001', branchId: 'BR001',
    paidTo: 'Meta Platforms', createdAt: '2024-12-01T10:00:00' },
  { id: 'EXP002', date: '2024-12-03', category: 'Tools/Software', amount: 8500,
    description: 'Canva Teams + Buffer monthly', branchId: 'BR001',
    paidTo: 'Canva / Buffer', createdAt: '2024-12-03T10:00:00' },
  { id: 'EXP003', date: '2024-12-04', category: 'Freelancer', amount: 12000,
    description: 'Video editor for Acme reels', customerId: 'CUST003',
    projectId: 'PROJ003', paidTo: 'Sandeep K.', createdAt: '2024-12-04T10:00:00' },
  { id: 'EXP004', date: '2024-11-28', category: 'Office', amount: 22000,
    description: 'Bangalore office rent', branchId: 'BR002',
    paidTo: 'Landlord', createdAt: '2024-11-28T10:00:00' },
];

interface ExpenseState {
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: seed,
      addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
      updateExpense: (id, data) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
    }),
    { name: 'digitalness-expenses-v1' }
  )
);
