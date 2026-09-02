// Digitalness - Complete CRM Dummy Data

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
  dateOfJoining: string;
  status: 'active' | 'inactive';
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  performance: {
    completedTasks: number;
    successRate: number;
    avgTurnaround: number;
  };
  avatar?: string;
  // Phase 2
  branchId?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  skills?: string[];
  reportingTo?: string;
  employeeType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  panNumber?: string;
  aadhaarNumber?: string;
}

export type LeadScore = 'Hot' | 'Warm' | 'Cold';
export type LeadTimeline = 'Urgent' | 'Normal' | 'Later';
export type LeadClarity = 'Clear' | 'Not Clear';
export type YesNo = 'Yes' | 'No';
export type LostReason = 'Price' | 'No Response' | 'Competitor' | 'Not Interested' | 'Other';

export interface Lead {
  id: string;
  name: string;
  contactNumber: string;
  businessType: string;
  source: 'Telecaller' | 'Executive' | 'Website' | 'Ad';
  assignedTo: string;
  status: 'New' | 'Demo Completed' | 'Own Close' | 'Own Loss' | 'Follow Up' | 'No Response' | 'Call Back';
  requirements: string[];
  notes: string[];
  createdOn: string;
  lastContactDate: string;
  followUpDate?: string;
  city: string;
  // Phase 1 enhancements
  branchId?: string;
  budgetRange?: string;
  requirementClarity?: LeadClarity;
  budgetMatch?: YesNo;
  timeline?: LeadTimeline;
  decisionMaker?: YesNo;
  leadScore?: LeadScore;
  expectedClosingDate?: string;
  probability?: number;
  lostReason?: LostReason;
  nextFollowUpDate?: string;
  inPipeline?: boolean;
}

export interface Branch {
  id: string;
  _id?: string;
  branchId?: string;
  name: string;
  code?: string;
  city: string;
  state?: string;
  location?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  managerId: string;
  status: 'Active' | 'Inactive';
}

export interface Customer {
  id: string;
  name: string;
  businessType: string;
  contactNumbers: string[];
  email: string;
  address: string;
  city: string;
  requirements: string[];
  package?: string;
  projects: Project[];
  totalPaid: number;
  totalPending: number;
  createdOn: string;
  // Phase 2
  branchId?: string;
  gstin?: string;
  panNumber?: string;
  industry?: string;
  companySize?: 'Small' | 'Medium' | 'Large' | 'Enterprise';
  website?: string;
  pointOfContact?: string;
  designation?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  monthlyRetainer?: number;
  accountManagerId?: string;
  status?: 'Active' | 'Paused' | 'Churned';
  notes?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultDeliverables: { title: string; category: string; days: number }[];
  estimatedDays: number;
  estimatedCost: number;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  createdOn: string;
  updatedOn: string;
  category: 'Bug' | 'Feature Request' | 'Question' | 'Complaint' | 'Other';
}

export interface Project {
  id: string;
  customerId: string;
  title: string;
  type: string;
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'Failed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string[];
  dueDate: string;
  createdOn: string;
  description: string;
  deliverables: number;
  completedDeliverables: number;
  // Phase 2
  templateId?: string;
  branchId?: string;
  budget?: number;
  startDate?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'Failed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  createdOn: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  telecallerId: string;
  dateTime: string;
  notes: string;
  result: string;
  duration: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Half Day';
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  amount: number;
  status: 'Paid' | 'Pending';
  paidDate?: string;
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  customerId?: string;
}

// Dummy Employees
export const employees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Akhil Reddy',
    role: 'Telecaller',
    department: 'Sales',
    phone: '9550379505',
    email: 'akhil.reddy@digitalness.com',
    address: 'Madhapur, Hyderabad, Telangana',
    salary: 18000,
    dateOfJoining: '2023-06-15',
    status: 'active',
    bankDetails: {
      accountNumber: '****4521',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0001234',
    },
    performance: {
      completedTasks: 245,
      successRate: 78,
      avgTurnaround: 1.2,
    },
  },
  {
    id: 'EMP002',
    name: 'Sravani Devi',
    role: 'Graphic Designer',
    department: 'Creative',
    phone: '9700304050',
    email: 'sravani@digitalness.com',
    address: 'Jubilee Hills, Hyderabad, Telangana',
    salary: 22000,
    dateOfJoining: '2023-03-10',
    status: 'active',
    bankDetails: {
      accountNumber: '****8763',
      bankName: 'ICICI Bank',
      ifsc: 'ICIC0002345',
    },
    performance: {
      completedTasks: 189,
      successRate: 92,
      avgTurnaround: 2.5,
    },
  },
  {
    id: 'EMP003',
    name: 'Rahul Verma',
    role: 'Sales Executive',
    department: 'Sales',
    phone: '7989456500',
    email: 'rahul.verma@digitalness.com',
    address: 'Banjara Hills, Hyderabad, Telangana',
    salary: 25000,
    dateOfJoining: '2022-11-20',
    status: 'active',
    bankDetails: {
      accountNumber: '****2156',
      bankName: 'SBI',
      ifsc: 'SBIN0003456',
    },
    performance: {
      completedTasks: 156,
      successRate: 85,
      avgTurnaround: 3.0,
    },
  },
  {
    id: 'EMP004',
    name: 'Priya Sharma',
    role: 'Video Editor',
    department: 'Creative',
    phone: '9876543210',
    email: 'priya.sharma@digitalness.com',
    address: 'Gachibowli, Hyderabad, Telangana',
    salary: 24000,
    dateOfJoining: '2023-01-05',
    status: 'active',
    bankDetails: {
      accountNumber: '****5432',
      bankName: 'Axis Bank',
      ifsc: 'AXIS0004567',
    },
    performance: {
      completedTasks: 98,
      successRate: 88,
      avgTurnaround: 4.0,
    },
  },
  {
    id: 'EMP005',
    name: 'Venkat Krishna',
    role: 'Developer',
    department: 'Technical',
    phone: '8765432190',
    email: 'venkat@digitalness.com',
    address: 'Kondapur, Hyderabad, Telangana',
    salary: 35000,
    dateOfJoining: '2022-08-15',
    status: 'active',
    bankDetails: {
      accountNumber: '****9876',
      bankName: 'Kotak Bank',
      ifsc: 'KKBK0005678',
    },
    performance: {
      completedTasks: 67,
      successRate: 94,
      avgTurnaround: 5.5,
    },
  },
  {
    id: 'EMP006',
    name: 'Lakshmi Naidu',
    role: 'Digital Marketer',
    department: 'Marketing',
    phone: '9988776655',
    email: 'lakshmi@digitalness.com',
    address: 'HITEC City, Hyderabad, Telangana',
    salary: 28000,
    dateOfJoining: '2023-04-20',
    status: 'active',
    bankDetails: {
      accountNumber: '****1234',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0006789',
    },
    performance: {
      completedTasks: 134,
      successRate: 81,
      avgTurnaround: 2.0,
    },
  },
  {
    id: 'EMP007',
    name: 'Arjun Patel',
    role: 'UI/UX Designer',
    department: 'Creative',
    phone: '9876123450',
    email: 'arjun.patel@digitalness.com',
    address: 'Financial District, Hyderabad, Telangana',
    salary: 30000,
    dateOfJoining: '2022-09-01',
    status: 'active',
    bankDetails: {
      accountNumber: '****6543',
      bankName: 'Yes Bank',
      ifsc: 'YESB0007890',
    },
    performance: {
      completedTasks: 112,
      successRate: 90,
      avgTurnaround: 3.5,
    },
  },
  {
    id: 'EMP008',
    name: 'Sneha Reddy',
    role: 'Telecaller',
    department: 'Sales',
    phone: '9543217890',
    email: 'sneha@digitalness.com',
    address: 'Ameerpet, Hyderabad, Telangana',
    salary: 17000,
    dateOfJoining: '2023-07-10',
    status: 'active',
    bankDetails: {
      accountNumber: '****3210',
      bankName: 'Canara Bank',
      ifsc: 'CNRB0008901',
    },
    performance: {
      completedTasks: 198,
      successRate: 72,
      avgTurnaround: 1.0,
    },
  },
];

// Dummy Leads
export const leads: Lead[] = [
  {
    id: 'LEAD001', name: 'Praveen Kumar', contactNumber: '9876543210', businessType: 'Real Estate',
    source: 'Telecaller', assignedTo: 'EMP001', status: 'New',
    requirements: ['Digital Marketing', 'Website Design'],
    notes: ['Interested in monthly packages', 'Budget: 50k-1L'],
    createdOn: '2024-12-01', lastContactDate: '2024-12-05', city: 'Hyderabad',
    branchId: 'BR001', budgetRange: '₹50K - ₹1L', requirementClarity: 'Clear',
    budgetMatch: 'Yes', timeline: 'Normal', decisionMaker: 'Yes',
    leadScore: 'Hot', expectedClosingDate: '2024-12-25', probability: 70,
    nextFollowUpDate: '2024-12-12', inPipeline: true,
  },
  {
    id: 'LEAD002', name: 'Mahesh Traders', contactNumber: '9988776655', businessType: 'Wholesale Shop',
    source: 'Executive', assignedTo: 'EMP003', status: 'Follow Up',
    requirements: ['Promotion Video', 'Digital Marketing'],
    notes: ['Wants to see demo first', 'Callback requested for Saturday'],
    createdOn: '2024-11-28', lastContactDate: '2024-12-04', followUpDate: '2024-12-10', city: 'Vijayawada',
    branchId: 'BR001', budgetRange: '₹25K - ₹50K', requirementClarity: 'Not Clear',
    budgetMatch: 'No', timeline: 'Later', decisionMaker: 'No',
    leadScore: 'Warm', expectedClosingDate: '2025-01-15', probability: 40,
    nextFollowUpDate: '2024-12-10', inPipeline: true,
  },
  {
    id: 'LEAD003', name: 'Lakshmi Jewellers', contactNumber: '8765432109', businessType: 'Jewellery Store',
    source: 'Website', assignedTo: 'EMP001', status: 'Demo Completed',
    requirements: ['Website Design', 'App Development'],
    notes: ['Demo done on Dec 3rd', 'Very interested, decision pending'],
    createdOn: '2024-11-25', lastContactDate: '2024-12-03', city: 'Hyderabad',
    branchId: 'BR001', budgetRange: '₹1L - ₹3L', requirementClarity: 'Clear',
    budgetMatch: 'Yes', timeline: 'Urgent', decisionMaker: 'Yes',
    leadScore: 'Hot', expectedClosingDate: '2024-12-20', probability: 80,
    nextFollowUpDate: '2024-12-09', inPipeline: true,
  },
  {
    id: 'LEAD004', name: 'Sunrise Hospital', contactNumber: '7654321098', businessType: 'Healthcare',
    source: 'Ad', assignedTo: 'EMP003', status: 'Own Close',
    requirements: ['Digital Marketing', 'Website Design', 'CRM'],
    notes: ['Closed deal - Premium package', 'Payment received: 1.5L'],
    createdOn: '2024-11-20', lastContactDate: '2024-12-02', city: 'Secunderabad',
    branchId: 'BR001', budgetRange: '₹3L+', requirementClarity: 'Clear',
    budgetMatch: 'Yes', timeline: 'Urgent', decisionMaker: 'Yes',
    leadScore: 'Hot', expectedClosingDate: '2024-12-02', probability: 100,
    inPipeline: true,
  },
  {
    id: 'LEAD005', name: 'Krishna Electronics', contactNumber: '9543216789', businessType: 'Electronics Store',
    source: 'Telecaller', assignedTo: 'EMP008', status: 'No Response',
    requirements: ['Promotion Video'],
    notes: ['Called 3 times, no answer'],
    createdOn: '2024-12-03', lastContactDate: '2024-12-06', city: 'Warangal',
    branchId: 'BR001', budgetRange: '₹10K - ₹25K', requirementClarity: 'Not Clear',
    budgetMatch: 'No', timeline: 'Later', decisionMaker: 'No',
    leadScore: 'Cold', probability: 10, inPipeline: false,
  },
  {
    id: 'LEAD006', name: 'Royal Caterers', contactNumber: '8899776655', businessType: 'Catering Service',
    source: 'Executive', assignedTo: 'EMP003', status: 'Call Back',
    requirements: ['Digital Marketing', 'Model Video'],
    notes: ['Busy season, call back in January'],
    createdOn: '2024-11-30', lastContactDate: '2024-12-05', followUpDate: '2025-01-05', city: 'Hyderabad',
    branchId: 'BR001', budgetRange: '₹25K - ₹50K', requirementClarity: 'Clear',
    budgetMatch: 'Yes', timeline: 'Later', decisionMaker: 'Yes',
    leadScore: 'Warm', expectedClosingDate: '2025-01-30', probability: 35,
    nextFollowUpDate: '2025-01-05', inPipeline: true,
  },
  {
    id: 'LEAD007', name: 'Swathi Textiles', contactNumber: '9876123456', businessType: 'Textile Shop',
    source: 'Telecaller', assignedTo: 'EMP001', status: 'Own Loss',
    requirements: ['Website Design'],
    notes: ['Lost to competitor - pricing issue'],
    createdOn: '2024-11-15', lastContactDate: '2024-11-28', city: 'Guntur',
    branchId: 'BR002', budgetRange: '₹25K - ₹50K', requirementClarity: 'Clear',
    budgetMatch: 'No', timeline: 'Normal', decisionMaker: 'Yes',
    leadScore: 'Cold', probability: 0, lostReason: 'Competitor', inPipeline: false,
  },
  {
    id: 'LEAD008', name: 'Metro Fitness Gym', contactNumber: '9988112233', businessType: 'Fitness Center',
    source: 'Website', assignedTo: 'EMP003', status: 'Demo Completed',
    requirements: ['App Development', 'Digital Marketing'],
    notes: ['Wants gym booking app', 'Budget approved'],
    createdOn: '2024-12-02', lastContactDate: '2024-12-06', city: 'Bangalore',
    branchId: 'BR002', budgetRange: '₹1L - ₹3L', requirementClarity: 'Clear',
    budgetMatch: 'Yes', timeline: 'Urgent', decisionMaker: 'Yes',
    leadScore: 'Hot', expectedClosingDate: '2024-12-22', probability: 75,
    nextFollowUpDate: '2024-12-11', inPipeline: true,
  },
];

// Dummy Branches
export const branches: Branch[] = [
  {
    id: 'BR001',
    branchId: 'BR001',
    name: 'Hyderabad Headquarters',
    code: 'HYD01',
    city: 'Hyderabad',
    state: 'Telangana',
    location: 'Gachibowli Main Road',
    address: 'Plot 42, Silicon Valley, Gachibowli, Hyderabad, Telangana 500032',
    contactPhone: '+91 9876543210',
    contactEmail: 'hyderabad@digitalness.com',
    managerId: 'MGR001',
    status: 'Active',
  },
  {
    id: 'BR002',
    branchId: 'BR002',
    name: 'Bangalore Regional Hub',
    code: 'BLR01',
    city: 'Bangalore',
    state: 'Karnataka',
    location: 'Indiranagar 100ft Road',
    address: 'Level 4, Metro Tower, Indiranagar, Bangalore, Karnataka 560038',
    contactPhone: '+91 9876543211',
    contactEmail: 'bangalore@digitalness.com',
    managerId: 'EMP003',
    status: 'Active',
  },
  {
    id: 'BR003',
    branchId: 'BR003',
    name: 'Mumbai Western Branch',
    code: 'MUM01',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: 'Andheri West Business District',
    address: 'Suite 502, Crystal Plaza, Andheri West, Mumbai, Maharashtra 400053',
    contactPhone: '+91 9876543212',
    contactEmail: 'mumbai@digitalness.com',
    managerId: 'EMP006',
    status: 'Active',
  },
];

// Dummy Customers
export const customers: Customer[] = [
  {
    id: 'CUST001',
    name: 'Sunrise Hospital',
    businessType: 'Healthcare',
    contactNumbers: ['7654321098', '7654321099'],
    email: 'admin@sunrisehospital.com',
    address: 'Road No. 10, Secunderabad, Telangana',
    city: 'Secunderabad',
    requirements: ['Digital Marketing', 'Website Design', 'CRM'],
    package: 'Premium Digital Marketing',
    projects: [],
    totalPaid: 150000,
    totalPending: 50000,
    createdOn: '2024-12-02',
  },
  {
    id: 'CUST002',
    name: 'Sai Krishna Builders',
    businessType: 'Real Estate',
    contactNumbers: ['9876543211'],
    email: 'info@saikrishnabuilders.com',
    address: 'Jubilee Hills, Hyderabad, Telangana',
    city: 'Hyderabad',
    requirements: ['Website Design', 'Promotion Video'],
    package: 'Standard Package',
    projects: [],
    totalPaid: 85000,
    totalPending: 15000,
    createdOn: '2024-10-15',
  },
  {
    id: 'CUST003',
    name: 'Andhra Spices',
    businessType: 'Food Products',
    contactNumbers: ['8765432101', '8765432102'],
    email: 'orders@andhraspices.in',
    address: 'Industrial Area, Vijayawada, AP',
    city: 'Vijayawada',
    requirements: ['Digital Marketing', 'Model Video'],
    package: 'Monthly Retainer',
    projects: [],
    totalPaid: 240000,
    totalPending: 20000,
    createdOn: '2024-06-20',
  },
  {
    id: 'CUST004',
    name: 'Green Valley School',
    businessType: 'Education',
    contactNumbers: ['9988776644'],
    email: 'principal@greenvalleyschool.edu.in',
    address: 'Gachibowli, Hyderabad, Telangana',
    city: 'Hyderabad',
    requirements: ['Website Design', 'App Development'],
    package: 'Custom Development',
    projects: [],
    totalPaid: 180000,
    totalPending: 70000,
    createdOn: '2024-08-10',
  },
  {
    id: 'CUST005',
    name: 'Hyderabad Motors',
    businessType: 'Automobile',
    contactNumbers: ['7766554433'],
    email: 'sales@hyderabadmotors.com',
    address: 'Kukatpally, Hyderabad, Telangana',
    city: 'Hyderabad',
    requirements: ['Digital Marketing', 'Website Design', 'Promotion Video'],
    package: 'Enterprise Package',
    projects: [],
    totalPaid: 350000,
    totalPending: 0,
    createdOn: '2024-04-05',
  },
];

// Dummy Projects
export const projects: Project[] = [
  {
    id: 'PROJ001',
    customerId: 'CUST001',
    title: 'Sunrise Hospital Website Redesign',
    type: 'Website Design',
    status: 'In Progress',
    priority: 'High',
    assignedTo: ['EMP005', 'EMP007'],
    dueDate: '2024-12-20',
    createdOn: '2024-12-02',
    description: 'Complete website redesign with appointment booking system',
    deliverables: 15,
    completedDeliverables: 8,
  },
  {
    id: 'PROJ002',
    customerId: 'CUST002',
    title: 'Sai Krishna Builders Promo Video',
    type: 'Promotion Video',
    status: 'Review',
    priority: 'Medium',
    assignedTo: ['EMP004'],
    dueDate: '2024-12-15',
    createdOn: '2024-11-25',
    description: '3-minute corporate promo video with drone shots',
    deliverables: 1,
    completedDeliverables: 1,
  },
  {
    id: 'PROJ003',
    customerId: 'CUST003',
    title: 'Andhra Spices Monthly Social Media',
    type: 'Digital Marketing',
    status: 'In Progress',
    priority: 'Medium',
    assignedTo: ['EMP002', 'EMP006'],
    dueDate: '2024-12-31',
    createdOn: '2024-12-01',
    description: 'December social media campaign - 30 posts + 4 reels',
    deliverables: 34,
    completedDeliverables: 12,
  },
  {
    id: 'PROJ004',
    customerId: 'CUST004',
    title: 'Green Valley School Mobile App',
    type: 'App Development',
    status: 'In Progress',
    priority: 'Urgent',
    assignedTo: ['EMP005'],
    dueDate: '2025-01-15',
    createdOn: '2024-10-15',
    description: 'Parent-teacher communication app with attendance tracking',
    deliverables: 8,
    completedDeliverables: 5,
  },
  {
    id: 'PROJ005',
    customerId: 'CUST005',
    title: 'Hyderabad Motors SEO Campaign',
    type: 'Digital Marketing',
    status: 'Completed',
    priority: 'Low',
    assignedTo: ['EMP006'],
    dueDate: '2024-11-30',
    createdOn: '2024-10-01',
    description: '3-month SEO optimization campaign',
    deliverables: 12,
    completedDeliverables: 12,
  },
];

// Dummy Call Logs
export const callLogs: CallLog[] = [
  {
    id: 'CALL001',
    leadId: 'LEAD001',
    telecallerId: 'EMP001',
    dateTime: '2024-12-05T10:30:00',
    notes: 'Discussed package options, interested in website',
    result: 'Callback scheduled',
    duration: 8,
  },
  {
    id: 'CALL002',
    leadId: 'LEAD002',
    telecallerId: 'EMP008',
    dateTime: '2024-12-04T14:15:00',
    notes: 'Owner busy, asked to call back on Saturday',
    result: 'Follow up scheduled',
    duration: 3,
  },
  {
    id: 'CALL003',
    leadId: 'LEAD003',
    telecallerId: 'EMP001',
    dateTime: '2024-12-03T11:00:00',
    notes: 'Demo completed, sent proposal',
    result: 'Demo Completed',
    duration: 45,
  },
];

// Dummy Attendance
export const attendance: Attendance[] = [
  { id: 'ATT001', employeeId: 'EMP001', date: '2024-12-06', loginTime: '09:15', logoutTime: '18:30', status: 'Present' },
  { id: 'ATT002', employeeId: 'EMP002', date: '2024-12-06', loginTime: '09:00', logoutTime: '18:00', status: 'Present' },
  { id: 'ATT003', employeeId: 'EMP003', date: '2024-12-06', loginTime: '10:00', logoutTime: '19:00', status: 'Present' },
  { id: 'ATT004', employeeId: 'EMP004', date: '2024-12-06', loginTime: '', logoutTime: '', status: 'Leave' },
  { id: 'ATT005', employeeId: 'EMP005', date: '2024-12-06', loginTime: '09:30', logoutTime: '18:30', status: 'Present' },
  { id: 'ATT006', employeeId: 'EMP006', date: '2024-12-06', loginTime: '09:05', logoutTime: '13:00', status: 'Half Day' },
  { id: 'ATT007', employeeId: 'EMP007', date: '2024-12-06', loginTime: '09:00', logoutTime: '18:00', status: 'Present' },
  { id: 'ATT008', employeeId: 'EMP008', date: '2024-12-06', loginTime: '09:10', logoutTime: '18:15', status: 'Present' },
];

// Dummy Salary Records
export const salaryRecords: SalaryRecord[] = [
  { id: 'SAL001', employeeId: 'EMP001', month: 'November', year: 2024, amount: 18000, status: 'Paid', paidDate: '2024-12-01' },
  { id: 'SAL002', employeeId: 'EMP002', month: 'November', year: 2024, amount: 22000, status: 'Paid', paidDate: '2024-12-01' },
  { id: 'SAL003', employeeId: 'EMP003', month: 'November', year: 2024, amount: 25000, status: 'Paid', paidDate: '2024-12-01' },
  { id: 'SAL004', employeeId: 'EMP004', month: 'November', year: 2024, amount: 24000, status: 'Pending' },
  { id: 'SAL005', employeeId: 'EMP005', month: 'November', year: 2024, amount: 35000, status: 'Paid', paidDate: '2024-12-01' },
  { id: 'SAL006', employeeId: 'EMP006', month: 'November', year: 2024, amount: 28000, status: 'Paid', paidDate: '2024-12-01' },
  { id: 'SAL007', employeeId: 'EMP007', month: 'November', year: 2024, amount: 30000, status: 'Pending' },
  { id: 'SAL008', employeeId: 'EMP008', month: 'November', year: 2024, amount: 17000, status: 'Paid', paidDate: '2024-12-01' },
];

// Dummy Financial Records
export const financialRecords: FinancialRecord[] = [
  { id: 'FIN001', type: 'Income', category: 'Project Payment', description: 'Sunrise Hospital - Website Design', amount: 150000, date: '2024-12-02', customerId: 'CUST001' },
  { id: 'FIN002', type: 'Income', category: 'Project Payment', description: 'Sai Krishna Builders - Promo Video', amount: 85000, date: '2024-11-25', customerId: 'CUST002' },
  { id: 'FIN003', type: 'Expense', category: 'Salary', description: 'November 2024 Salaries', amount: 175000, date: '2024-12-01' },
  { id: 'FIN004', type: 'Expense', category: 'Office Rent', description: 'December Office Rent', amount: 45000, date: '2024-12-01' },
  { id: 'FIN005', type: 'Expense', category: 'Software', description: 'Adobe Creative Cloud Subscription', amount: 12000, date: '2024-12-03' },
  { id: 'FIN006', type: 'Income', category: 'Monthly Retainer', description: 'Andhra Spices - Monthly Retainer', amount: 40000, date: '2024-12-05', customerId: 'CUST003' },
  { id: 'FIN007', type: 'Expense', category: 'Investment', description: 'New Camera Equipment', amount: 85000, date: '2024-11-28' },
  { id: 'FIN008', type: 'Income', category: 'Project Payment', description: 'Hyderabad Motors - SEO Campaign Final', amount: 120000, date: '2024-11-30', customerId: 'CUST005' },
];

// Dashboard Stats
export const dashboardStats = {
  totalCustomers: 145,
  totalEmployees: 8,
  totalLeads: 287,
  completedProjects: 89,
  totalIncome: 2850000,
  totalExpenses: 1420000,
  pendingFollowups: 23,
  todaysFollowups: 5,
  digitalMarketingProjects: 34,
  appProjects: 12,
  promoVideos: 28,
  websiteDesigns: 15,
};

// Monthly Revenue Data for Charts
export const monthlyRevenueData = [
  { month: 'Jul', income: 380000, customers: 18 },
  { month: 'Aug', income: 420000, customers: 22 },
  { month: 'Sep', income: 365000, customers: 19 },
  { month: 'Oct', income: 490000, customers: 28 },
  { month: 'Nov', income: 520000, customers: 31 },
  { month: 'Dec', income: 395000, customers: 24 },
];

// Lead Status Distribution
export const leadStatusDistribution = [
  { name: 'New', value: 45, color: '#14b8a6' },
  { name: 'Demo Completed', value: 28, color: '#3b82f6' },
  { name: 'Own Close', value: 52, color: '#22c55e' },
  { name: 'Own Loss', value: 18, color: '#ef4444' },
  { name: 'Follow Up', value: 67, color: '#f59e0b' },
  { name: 'No Response', value: 42, color: '#6b7280' },
  { name: 'Call Back', value: 35, color: '#8b5cf6' },
];

// Employee by Department
export const employeesByDepartment = [
  { department: 'Sales', count: 3 },
  { department: 'Creative', count: 3 },
  { department: 'Technical', count: 1 },
  { department: 'Marketing', count: 1 },
];

// User Roles for Login
export type UserRole = 'Admin' | 'Manager' | 'Telecaller' | 'Sales Executive' | 'Employee' | 'Accountant' | 'Customer';

export const userRoles: UserRole[] = ['Admin', 'Manager', 'Telecaller', 'Sales Executive', 'Employee', 'Accountant', 'Customer'];
