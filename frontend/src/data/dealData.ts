// Sales Pipeline Deals

export type DealStage =
  | 'New'
  | 'Contacted'
  | 'Discovery'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export const DEAL_STAGES: DealStage[] = [
  'New', 'Contacted', 'Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost',
];

export interface DealCallLog {
  id: string;
  date: string;
  notes: string;
  by: string;
}

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  customerName: string;
  contactNumber: string;
  businessType: string;
  branchId: string;
  stage: DealStage;
  dealValue: number;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string; // employeeId
  notes: string;
  callLogs: DealCallLog[];
  createdOn: string;
  lostReason?: string;
  wonOn?: string;
  customerId?: string;
  invoiceId?: string;
}

export const deals: Deal[] = [
  {
    id: 'DEAL001', leadId: 'LEAD001', title: 'Praveen Kumar - Real Estate Site + DM',
    customerName: 'Praveen Kumar', contactNumber: '9876543210', businessType: 'Real Estate',
    branchId: 'BR001', stage: 'Discovery', dealValue: 75000, probability: 70,
    expectedCloseDate: '2024-12-25', assignedTo: 'EMP003',
    notes: 'Needs website + monthly DM. Budget aligned.',
    callLogs: [
      { id: 'DL001', date: '2024-12-05', notes: 'Initial discovery call. Sent brochure.', by: 'EMP003' },
    ],
    createdOn: '2024-12-01',
  },
  {
    id: 'DEAL002', leadId: 'LEAD003', title: 'Lakshmi Jewellers - Website + App',
    customerName: 'Lakshmi Jewellers', contactNumber: '8765432109', businessType: 'Jewellery Store',
    branchId: 'BR001', stage: 'Proposal', dealValue: 220000, probability: 80,
    expectedCloseDate: '2024-12-20', assignedTo: 'EMP003',
    notes: 'Demo done. Proposal shared.',
    callLogs: [
      { id: 'DL002', date: '2024-12-03', notes: 'Demo completed. Decision pending owner approval.', by: 'EMP003' },
    ],
    createdOn: '2024-11-25',
  },
  {
    id: 'DEAL003', leadId: 'LEAD002', title: 'Mahesh Traders - Promo Video Pkg',
    customerName: 'Mahesh Traders', contactNumber: '9988776655', businessType: 'Wholesale Shop',
    branchId: 'BR001', stage: 'Contacted', dealValue: 35000, probability: 40,
    expectedCloseDate: '2025-01-15', assignedTo: 'EMP003',
    notes: 'Wants to see demo first.',
    callLogs: [],
    createdOn: '2024-11-28',
  },
  {
    id: 'DEAL004', leadId: 'LEAD006', title: 'Royal Caterers - Monthly DM',
    customerName: 'Royal Caterers', contactNumber: '8899776655', businessType: 'Catering Service',
    branchId: 'BR001', stage: 'Qualified', dealValue: 40000, probability: 35,
    expectedCloseDate: '2025-01-30', assignedTo: 'EMP003',
    notes: 'Re-engage in January.',
    callLogs: [],
    createdOn: '2024-11-30',
  },
  {
    id: 'DEAL005', leadId: 'LEAD008', title: 'Metro Fitness Gym - App + DM',
    customerName: 'Metro Fitness Gym', contactNumber: '9988112233', businessType: 'Fitness Center',
    branchId: 'BR002', stage: 'Negotiation', dealValue: 180000, probability: 75,
    expectedCloseDate: '2024-12-22', assignedTo: 'EMP003',
    notes: 'Negotiating final pricing.',
    callLogs: [
      { id: 'DL003', date: '2024-12-06', notes: 'Quote revised; awaiting approval.', by: 'EMP003' },
    ],
    createdOn: '2024-12-02',
  },
  {
    id: 'DEAL006', leadId: 'LEAD004', title: 'Sunrise Hospital - Premium Pkg',
    customerName: 'Sunrise Hospital', contactNumber: '7654321098', businessType: 'Healthcare',
    branchId: 'BR001', stage: 'Won', dealValue: 200000, probability: 100,
    expectedCloseDate: '2024-12-02', assignedTo: 'EMP003',
    notes: 'Closed - Premium package.', callLogs: [], createdOn: '2024-11-20',
    wonOn: '2024-12-02', customerId: 'CUST001',
  },
  {
    id: 'DEAL007', leadId: 'LEAD007', title: 'Swathi Textiles - Website',
    customerName: 'Swathi Textiles', contactNumber: '9876123456', businessType: 'Textile Shop',
    branchId: 'BR002', stage: 'Lost', dealValue: 35000, probability: 0,
    expectedCloseDate: '2024-11-28', assignedTo: 'EMP003',
    notes: 'Lost to competitor on price.', callLogs: [], createdOn: '2024-11-15',
    lostReason: 'Competitor',
  },
];
