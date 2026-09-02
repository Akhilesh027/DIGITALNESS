import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision Requested';
export type ApprovalEntityType = 'Task' | 'Deliverable' | 'Proposal' | 'Invoice';

export interface ApprovalRequest {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  title: string;
  customerId?: string;
  submittedBy: string;
  submittedByName?: string;
  status: ApprovalStatus;
  revisionNotes?: string;
  revisionCount: number;
  attachments: string[];
  createdAt: string;
  decidedAt?: string;
}

const seed: ApprovalRequest[] = [
  { id: 'APR001', entityType: 'Task', entityId: 'TASK001', title: 'Homepage Hero Design v1',
    customerId: 'CUST001', submittedBy: 'EMP007', submittedByName: 'Arjun Patel',
    status: 'Revision Requested', revisionNotes: 'Make CTA stronger; tweak palette to brand teal.',
    revisionCount: 1, attachments: ['hero-v1.png'], createdAt: '2024-12-05T17:00:00' },
  { id: 'APR002', entityType: 'Deliverable', entityId: 'DEL003', title: 'November Reels Pack',
    customerId: 'CUST003', submittedBy: 'EMP006', submittedByName: 'Lakshmi Naidu',
    status: 'Approved', revisionCount: 0, attachments: [],
    createdAt: '2024-11-28T11:00:00', decidedAt: '2024-11-29T09:30:00' },
  { id: 'APR003', entityType: 'Proposal', entityId: 'PROP001', title: 'Acme Wellness — Retainer Proposal',
    submittedBy: 'EMP003', submittedByName: 'Rahul Verma', status: 'Pending',
    revisionCount: 0, attachments: [], createdAt: '2024-12-06T10:00:00' },
];

interface ApprovalState {
  approvals: ApprovalRequest[];
  addApproval: (a: ApprovalRequest) => void;
  decide: (id: string, status: ApprovalStatus, notes?: string) => void;
  forEntity: (type: ApprovalEntityType, id: string) => ApprovalRequest[];
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: seed,
      addApproval: (a) => set((s) => ({ approvals: [a, ...s.approvals] })),
      decide: (id, status, notes) =>
        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  revisionNotes: notes ?? a.revisionNotes,
                  revisionCount:
                    status === 'Revision Requested' ? a.revisionCount + 1 : a.revisionCount,
                  decidedAt: new Date().toISOString(),
                }
              : a
          ),
        })),
      forEntity: (type, id) =>
        get().approvals.filter((a) => a.entityType === type && a.entityId === id),
    }),
    { name: 'digitalness-approvals-v1' }
  )
);
