// Invoice, Deliverable, Payment types and dummy data

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Partially Paid';
  createdDate: string;
  dueDate: string;
  paidAmount: number;
  notes?: string;
  // Phase 2 billing extensions
  cgst?: number;
  sgst?: number;
  igst?: number;
  isInterState?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  paymentTerms?: string;
  poNumber?: string;
  branchId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Deliverable {
  id: string;
  customerId: string;
  projectId: string;
  title: string;
  category: 'Video' | 'Social Media Post' | 'Design' | 'Website' | 'App Feature' | 'SEO' | 'Ad Campaign' | 'Content Writing';
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'Revision';
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  completedDate?: string;
  month: string; // e.g., "2024-12"
  comments: DeliverableComment[];
  attachments?: string[];
}

export interface DeliverableComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque' | 'Card';
  reference?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

export interface PaymentReminder {
  id: string;
  customerId: string;
  invoiceId: string;
  sentDate: string;
  type: 'WhatsApp' | 'Email' | 'Call';
  status: 'Sent' | 'Acknowledged' | 'Pending';
}

export interface ClientWorkReport {
  customerId: string;
  month: string;
  totalDeliverables: number;
  completed: number;
  inProgress: number;
  pending: number;
  onTimeRate: number;
  employeeHours: { employeeId: string; employeeName: string; hours: number }[];
  highlights: string[];
}

// Dummy Invoices
export const invoices: Invoice[] = [
  {
    id: 'INV001',
    invoiceNumber: 'KN21-2024-001',
    customerId: 'CUST001',
    customerName: 'Sunrise Hospital',
    items: [
      { id: 'ITEM001', description: 'Website Redesign - Phase 1', quantity: 1, rate: 80000, amount: 80000 },
      { id: 'ITEM002', description: 'Digital Marketing Setup', quantity: 1, rate: 50000, amount: 50000 },
      { id: 'ITEM003', description: 'CRM Integration', quantity: 1, rate: 40000, amount: 40000 },
    ],
    subtotal: 170000,
    tax: 30600,
    discount: 10000,
    total: 190600,
    status: 'Partially Paid',
    createdDate: '2024-12-02',
    dueDate: '2025-01-02',
    paidAmount: 150000,
    notes: 'Payment in 2 installments agreed',
  },
  {
    id: 'INV002',
    invoiceNumber: 'KN21-2024-002',
    customerId: 'CUST002',
    customerName: 'Sai Krishna Builders',
    items: [
      { id: 'ITEM004', description: 'Corporate Promo Video (3 min)', quantity: 1, rate: 65000, amount: 65000 },
      { id: 'ITEM005', description: 'Drone Shooting', quantity: 1, rate: 20000, amount: 20000 },
    ],
    subtotal: 85000,
    tax: 15300,
    discount: 0,
    total: 100300,
    status: 'Paid',
    createdDate: '2024-11-25',
    dueDate: '2024-12-25',
    paidAmount: 100300,
  },
  {
    id: 'INV003',
    invoiceNumber: 'KN21-2024-003',
    customerId: 'CUST003',
    customerName: 'Andhra Spices',
    items: [
      { id: 'ITEM006', description: 'Monthly Social Media Management - December', quantity: 1, rate: 40000, amount: 40000 },
    ],
    subtotal: 40000,
    tax: 7200,
    discount: 0,
    total: 47200,
    status: 'Sent',
    createdDate: '2024-12-01',
    dueDate: '2024-12-15',
    paidAmount: 0,
  },
  {
    id: 'INV004',
    invoiceNumber: 'KN21-2024-004',
    customerId: 'CUST004',
    customerName: 'Green Valley School',
    items: [
      { id: 'ITEM007', description: 'Mobile App Development - Phase 2', quantity: 1, rate: 120000, amount: 120000 },
      { id: 'ITEM008', description: 'UI/UX Design', quantity: 1, rate: 30000, amount: 30000 },
    ],
    subtotal: 150000,
    tax: 27000,
    discount: 5000,
    total: 172000,
    status: 'Overdue',
    createdDate: '2024-11-01',
    dueDate: '2024-12-01',
    paidAmount: 100000,
    notes: 'Pending amount follow-up required',
  },
  {
    id: 'INV005',
    invoiceNumber: 'KN21-2024-005',
    customerId: 'CUST005',
    customerName: 'Hyderabad Motors',
    items: [
      { id: 'ITEM009', description: 'SEO Campaign (3 months)', quantity: 3, rate: 40000, amount: 120000 },
      { id: 'ITEM010', description: 'Website Maintenance', quantity: 3, rate: 10000, amount: 30000 },
    ],
    subtotal: 150000,
    tax: 27000,
    discount: 0,
    total: 177000,
    status: 'Paid',
    createdDate: '2024-10-01',
    dueDate: '2024-11-01',
    paidAmount: 177000,
  },
  {
    id: 'INV006',
    invoiceNumber: 'KN21-2025-001',
    customerId: 'CUST001',
    customerName: 'Sunrise Hospital',
    items: [
      { id: 'ITEM011', description: 'Monthly Digital Marketing - January', quantity: 1, rate: 35000, amount: 35000 },
      { id: 'ITEM012', description: 'Social Media Content (20 posts)', quantity: 20, rate: 500, amount: 10000 },
    ],
    subtotal: 45000,
    tax: 8100,
    discount: 0,
    total: 53100,
    status: 'Draft',
    createdDate: '2025-01-01',
    dueDate: '2025-01-31',
    paidAmount: 0,
  },
];

// Dummy Deliverables
export const deliverables: Deliverable[] = [
  // Sunrise Hospital
  { id: 'DEL001', customerId: 'CUST001', projectId: 'PROJ001', title: 'Homepage Design', category: 'Website', status: 'Completed', assignedTo: 'EMP007', priority: 'High', dueDate: '2024-12-10', completedDate: '2024-12-09', month: '2024-12', comments: [{ id: 'C001', userId: 'EMP007', userName: 'Arjun Patel', text: 'Homepage design finalized with client feedback', timestamp: '2024-12-09T14:30:00' }] },
  { id: 'DEL002', customerId: 'CUST001', projectId: 'PROJ001', title: 'About Us Page', category: 'Website', status: 'In Progress', assignedTo: 'EMP005', priority: 'Medium', dueDate: '2024-12-15', month: '2024-12', comments: [] },
  { id: 'DEL003', customerId: 'CUST001', projectId: 'PROJ001', title: 'Appointment Booking Module', category: 'App Feature', status: 'Not Started', assignedTo: 'EMP005', priority: 'Urgent', dueDate: '2024-12-18', month: '2024-12', comments: [] },
  { id: 'DEL004', customerId: 'CUST001', projectId: 'PROJ001', title: 'Instagram Post - Health Tips #1', category: 'Social Media Post', status: 'Completed', assignedTo: 'EMP002', priority: 'Medium', dueDate: '2024-12-05', completedDate: '2024-12-05', month: '2024-12', comments: [] },
  { id: 'DEL005', customerId: 'CUST001', projectId: 'PROJ001', title: 'Instagram Post - Health Tips #2', category: 'Social Media Post', status: 'Completed', assignedTo: 'EMP002', priority: 'Medium', dueDate: '2024-12-08', completedDate: '2024-12-08', month: '2024-12', comments: [] },
  { id: 'DEL006', customerId: 'CUST001', projectId: 'PROJ001', title: 'Doctor Profile Video', category: 'Video', status: 'Review', assignedTo: 'EMP004', priority: 'High', dueDate: '2024-12-12', month: '2024-12', comments: [{ id: 'C002', userId: 'EMP004', userName: 'Priya Sharma', text: 'Video edited, sent for client review', timestamp: '2024-12-11T16:00:00' }] },

  // Sai Krishna Builders
  { id: 'DEL007', customerId: 'CUST002', projectId: 'PROJ002', title: 'Corporate Promo Video', category: 'Video', status: 'Review', assignedTo: 'EMP004', priority: 'Medium', dueDate: '2024-12-15', month: '2024-12', comments: [] },

  // Andhra Spices
  { id: 'DEL008', customerId: 'CUST003', projectId: 'PROJ003', title: 'Instagram Reel - Spice Recipe #1', category: 'Video', status: 'Completed', assignedTo: 'EMP004', priority: 'Medium', dueDate: '2024-12-05', completedDate: '2024-12-04', month: '2024-12', comments: [] },
  { id: 'DEL009', customerId: 'CUST003', projectId: 'PROJ003', title: 'Instagram Reel - Spice Recipe #2', category: 'Video', status: 'Completed', assignedTo: 'EMP004', priority: 'Medium', dueDate: '2024-12-12', completedDate: '2024-12-11', month: '2024-12', comments: [] },
  { id: 'DEL010', customerId: 'CUST003', projectId: 'PROJ003', title: 'Instagram Reel - Spice Recipe #3', category: 'Video', status: 'In Progress', assignedTo: 'EMP004', priority: 'Medium', dueDate: '2024-12-19', month: '2024-12', comments: [] },
  { id: 'DEL011', customerId: 'CUST003', projectId: 'PROJ003', title: 'Instagram Reel - Spice Recipe #4', category: 'Video', status: 'Not Started', assignedTo: 'EMP004', priority: 'Medium', dueDate: '2024-12-26', month: '2024-12', comments: [] },
  { id: 'DEL012', customerId: 'CUST003', projectId: 'PROJ003', title: 'Facebook Post - Product Feature #1', category: 'Social Media Post', status: 'Completed', assignedTo: 'EMP002', priority: 'Low', dueDate: '2024-12-03', completedDate: '2024-12-03', month: '2024-12', comments: [] },
  { id: 'DEL013', customerId: 'CUST003', projectId: 'PROJ003', title: 'Facebook Post - Product Feature #2', category: 'Social Media Post', status: 'Completed', assignedTo: 'EMP002', priority: 'Low', dueDate: '2024-12-06', completedDate: '2024-12-06', month: '2024-12', comments: [] },
  { id: 'DEL014', customerId: 'CUST003', projectId: 'PROJ003', title: 'Google Ads Campaign Setup', category: 'Ad Campaign', status: 'Completed', assignedTo: 'EMP006', priority: 'High', dueDate: '2024-12-02', completedDate: '2024-12-02', month: '2024-12', comments: [] },
  { id: 'DEL015', customerId: 'CUST003', projectId: 'PROJ003', title: 'Blog - Top 10 Indian Spices', category: 'Content Writing', status: 'In Progress', assignedTo: 'EMP006', priority: 'Low', dueDate: '2024-12-20', month: '2024-12', comments: [] },

  // Green Valley School
  { id: 'DEL016', customerId: 'CUST004', projectId: 'PROJ004', title: 'Student Dashboard UI', category: 'App Feature', status: 'Completed', assignedTo: 'EMP005', priority: 'High', dueDate: '2024-12-08', completedDate: '2024-12-07', month: '2024-12', comments: [] },
  { id: 'DEL017', customerId: 'CUST004', projectId: 'PROJ004', title: 'Attendance Module', category: 'App Feature', status: 'In Progress', assignedTo: 'EMP005', priority: 'Urgent', dueDate: '2024-12-15', month: '2024-12', comments: [] },
  { id: 'DEL018', customerId: 'CUST004', projectId: 'PROJ004', title: 'Push Notifications Setup', category: 'App Feature', status: 'Not Started', assignedTo: 'EMP005', priority: 'Medium', dueDate: '2024-12-22', month: '2024-12', comments: [] },
];

// Dummy Payment Records
export const paymentRecords: PaymentRecord[] = [
  { id: 'PAY001', customerId: 'CUST001', invoiceId: 'INV001', amount: 100000, date: '2024-12-05', method: 'Bank Transfer', reference: 'UTR123456789', status: 'Completed', notes: 'First installment' },
  { id: 'PAY002', customerId: 'CUST001', invoiceId: 'INV001', amount: 50000, date: '2024-12-15', method: 'UPI', reference: 'UPI789456123', status: 'Completed', notes: 'Second installment' },
  { id: 'PAY003', customerId: 'CUST002', invoiceId: 'INV002', amount: 100300, date: '2024-12-10', method: 'Bank Transfer', reference: 'UTR987654321', status: 'Completed' },
  { id: 'PAY004', customerId: 'CUST003', invoiceId: 'INV003', amount: 40000, date: '2024-12-01', method: 'UPI', reference: 'UPI456789123', status: 'Pending' },
  { id: 'PAY005', customerId: 'CUST004', invoiceId: 'INV004', amount: 100000, date: '2024-11-15', method: 'Cheque', reference: 'CHQ001234', status: 'Completed' },
  { id: 'PAY006', customerId: 'CUST005', invoiceId: 'INV005', amount: 177000, date: '2024-11-05', method: 'Bank Transfer', reference: 'UTR456123789', status: 'Completed' },
  { id: 'PAY007', customerId: 'CUST005', amount: 50000, date: '2024-10-15', method: 'UPI', reference: 'UPI112233445', status: 'Completed', notes: 'Advance payment' },
  { id: 'PAY008', customerId: 'CUST003', amount: 200000, date: '2024-09-01', method: 'Bank Transfer', reference: 'UTR556677889', status: 'Completed', notes: 'Annual retainer advance' },
];

// Dummy Payment Reminders
export const paymentReminders: PaymentReminder[] = [
  { id: 'REM001', customerId: 'CUST004', invoiceId: 'INV004', sentDate: '2024-12-05', type: 'WhatsApp', status: 'Sent' },
  { id: 'REM002', customerId: 'CUST004', invoiceId: 'INV004', sentDate: '2024-12-10', type: 'Email', status: 'Sent' },
  { id: 'REM003', customerId: 'CUST001', invoiceId: 'INV001', sentDate: '2024-12-18', type: 'Call', status: 'Acknowledged' },
  { id: 'REM004', customerId: 'CUST003', invoiceId: 'INV003', sentDate: '2024-12-14', type: 'WhatsApp', status: 'Pending' },
];
