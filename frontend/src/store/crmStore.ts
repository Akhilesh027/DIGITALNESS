import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Employee,
  Lead,
  Customer,
  Project,
  Task,
  Attendance,
  SalaryRecord,
  FinancialRecord,
  Branch,
  UserRole,
  employees as initialEmployees,
  leads as initialLeads,
  customers as initialCustomers,
  projects as initialProjects,
  attendance as initialAttendance,
  salaryRecords as initialSalaryRecords,
  financialRecords as initialFinancialRecords,
  branches as initialBranches,
} from '@/data/dummyData';

interface CRMState {
  // Auth
  currentUser: {
    role: UserRole;
    name: string;
    id: string;
  } | null;
  isAuthenticated: boolean;

  // Data
  employees: Employee[];
  leads: Lead[];
  customers: Customer[];
  projects: Project[];
  attendance: Attendance[];
  salaryRecords: SalaryRecord[];
  financialRecords: FinancialRecord[];
  branches: Branch[];

  // Branch Actions
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, data: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  // Actions - Auth
  login: (role: UserRole) => void;
  logout: () => void;

  // Actions - Employees
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Actions - Leads
  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  convertLeadToCustomer: (leadId: string) => void;

  // Actions - Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Actions - Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Actions - Financial
  addFinancialRecord: (record: FinancialRecord) => void;
  updateSalaryRecord: (id: string, data: Partial<SalaryRecord>) => void;
}

const roleUserMap: Record<UserRole, { name: string; id: string }> = {
  Admin: { name: 'Varma Kumar', id: 'ADMIN001' },
  Manager: { name: 'Suresh Babu', id: 'MGR001' },
  Telecaller: { name: 'Akhil Reddy', id: 'EMP001' },
  'Sales Executive': { name: 'Rahul Verma', id: 'EMP003' },
  Employee: { name: 'Sravani Devi', id: 'EMP002' },
  Accountant: { name: 'Rekha Joshi', id: 'ACC001' },
  Customer: { name: 'Sunrise Hospital', id: 'CUST001' },
};

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      isAuthenticated: false,
      employees: initialEmployees,
      leads: initialLeads,
      customers: initialCustomers,
      projects: initialProjects,
      attendance: initialAttendance,
      salaryRecords: initialSalaryRecords,
      financialRecords: initialFinancialRecords,
      branches: initialBranches,

      addBranch: (branch) => set((s) => ({ branches: [...s.branches, branch] })),
      updateBranch: (id, data) =>
        set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      deleteBranch: (id) =>
        set((s) => ({ branches: s.branches.filter((b) => b.id !== id) })),

      // Auth Actions
      login: (role) => {
        const userData = roleUserMap[role];
        set({
          currentUser: { role, ...userData },
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      // Employee Actions
      addEmployee: (employee) => {
        set((state) => ({
          employees: [...state.employees, employee],
        }));
      },
      updateEmployee: (id, data) => {
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...data } : emp
          ),
        }));
      },
      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
        }));
      },

      // Lead Actions
      addLead: (lead) => {
        set((state) => ({
          leads: [...state.leads, lead],
        }));
      },
      updateLead: (id, data) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, ...data } : lead
          ),
        }));
      },
      deleteLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== id),
        }));
      },
      convertLeadToCustomer: (leadId) => {
        const lead = get().leads.find((l) => l.id === leadId);
        if (!lead) return;

        const newCustomer: Customer = {
          id: `CUST${Date.now()}`,
          name: lead.name,
          businessType: lead.businessType,
          contactNumbers: [lead.contactNumber],
          email: '',
          address: '',
          city: lead.city,
          requirements: lead.requirements,
          projects: [],
          totalPaid: 0,
          totalPending: 0,
          createdOn: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          customers: [...state.customers, newCustomer],
          leads: state.leads.map((l) =>
            l.id === leadId ? { ...l, status: 'Own Close' as const } : l
          ),
        }));
      },

      // Customer Actions
      addCustomer: (customer) => {
        set((state) => ({
          customers: [...state.customers, customer],
        }));
      },
      updateCustomer: (id, data) => {
        set((state) => ({
          customers: state.customers.map((cust) =>
            cust.id === id ? { ...cust, ...data } : cust
          ),
        }));
      },
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((cust) => cust.id !== id),
        }));
      },

      // Project Actions
      addProject: (project) => {
        set((state) => ({
          projects: [...state.projects, project],
        }));
      },
      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, ...data } : proj
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
        }));
      },

      // Financial Actions
      addFinancialRecord: (record) => {
        set((state) => ({
          financialRecords: [...state.financialRecords, record],
        }));
      },
      updateSalaryRecord: (id, data) => {
        set((state) => ({
          salaryRecords: state.salaryRecords.map((sal) =>
            sal.id === id ? { ...sal, ...data } : sal
          ),
        }));
      },
    }),
    {
      name: 'digitalness-crm-storage-v4',
    }
  )
);
