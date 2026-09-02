// Proposal module data

export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';

export interface ProposalService {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  clientContact: string;
  leadId?: string;
  dealId?: string;
  customerId?: string;
  services: ProposalService[];
  totalPrice: number;
  durationDays: number;
  deliverables: string[];
  status: ProposalStatus;
  createdOn: string;
  validUntil: string;
  notes?: string;
}

export const proposals: Proposal[] = [
  {
    id: 'PROP001', proposalNumber: 'PR-2024-001',
    clientName: 'Lakshmi Jewellers', clientContact: '8765432109',
    leadId: 'LEAD003', dealId: 'DEAL002',
    services: [
      { id: 'PS001', name: 'Website Design', description: 'Premium 8-page responsive website', price: 80000 },
      { id: 'PS002', name: 'App Development', description: 'Cross-platform Android + iOS app', price: 140000 },
    ],
    totalPrice: 220000, durationDays: 60,
    deliverables: ['Website (8 pages)', 'Android + iOS app', '3 months free maintenance'],
    status: 'Sent', createdOn: '2024-12-04', validUntil: '2024-12-20',
    notes: 'Discount of 10% if signed before Dec 20.',
  },
  {
    id: 'PROP002', proposalNumber: 'PR-2024-002',
    clientName: 'Metro Fitness Gym', clientContact: '9988112233',
    leadId: 'LEAD008', dealId: 'DEAL005',
    services: [
      { id: 'PS003', name: 'Gym Booking App', description: 'Member booking + payment app', price: 130000 },
      { id: 'PS004', name: 'Digital Marketing', description: '3-month launch campaign', price: 50000 },
    ],
    totalPrice: 180000, durationDays: 45,
    deliverables: ['Booking app', 'Landing page', 'Meta + Google ads campaign'],
    status: 'Viewed', createdOn: '2024-12-05', validUntil: '2024-12-22',
  },
  {
    id: 'PROP003', proposalNumber: 'PR-2024-003',
    clientName: 'Sunrise Hospital', clientContact: '7654321098',
    leadId: 'LEAD004', dealId: 'DEAL006', customerId: 'CUST001',
    services: [
      { id: 'PS005', name: 'Premium Digital Marketing', description: 'Monthly retainer', price: 80000 },
      { id: 'PS006', name: 'Website Redesign', description: 'New site with appointment booking', price: 80000 },
      { id: 'PS007', name: 'CRM Integration', description: 'Patient CRM setup', price: 40000 },
    ],
    totalPrice: 200000, durationDays: 30,
    deliverables: ['Monthly DM (ongoing)', 'New website', 'CRM setup'],
    status: 'Accepted', createdOn: '2024-11-22', validUntil: '2024-12-05',
  },
];
