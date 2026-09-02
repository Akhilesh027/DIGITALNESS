import { useEffect, useMemo, useState } from 'react';
import { clearAuth, getToken, authHeaders } from '@/api/auth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  Building2,
  Phone,
  Video,
  Globe,
  MonitorSmartphone,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Star,
  Ticket,
  UserPlus,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ===================== TYPES =====================
interface Employee {
  _id: string;
  id?: string;
  name: string;
  role: string;
  status?: string;
  branchId?: string;
}

interface Customer {
  _id: string;
  id?: string;
  name: string;
  branchId?: string;
  assignedTo?: any;
  createdAt?: string;
}

interface Lead {
  _id: string;
  id?: string;
  name: string;
  status: string;
  nextFollowUpDate?: string | null;
  assignedTo?: any;
  branchId?: string;
  createdAt: string;
  updatedAt?: string;
  source?: string;
}

interface Work {
  _id: string;
  id?: string;
  title: string;
  workType: string;
  status: string;
  assignedTo?: any;
  branchId?: string;
  customer?: any;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
}

interface Ticket {
  _id: string;
  id?: string;
  ticketId?: string;
  subject: string;
  status: string;
  priority?: string;
  assignedTo?: any;
  branchId?: string;
  createdAt?: string;
  customer?: any;
}

interface ActivityItem {
  id: string;
  type: 'lead' | 'work' | 'customer' | 'ticket';
  title: string;
  description: string;
  timestamp: string;
}

interface User {
  _id: string;
  id?: string;
  name?: string;
  role?: string;
  branchId?: string;
}

type DashboardMode = 'admin' | 'manager' | 'telecaller' | 'employee';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ===================== HELPERS =====================
function extractId(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.$oid) return value.$oid;
  if (value._id) return extractId(value._id);
  if (value.id) return extractId(value.id);
  return null;
}

function normalizeRole(role?: string): string {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getDashboardMode(role?: string): DashboardMode {
  const normalizedRole = normalizeRole(role);

  if (
    !normalizedRole ||
    normalizedRole === 'admin' ||
    normalizedRole === 'super admin' ||
    normalizedRole === 'system owner' ||
    normalizedRole === 'managing director' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'founder' ||
    normalizedRole === 'owner' ||
    normalizedRole.includes('admin')
  ) {
    return 'admin';
  }

  if (
    normalizedRole.includes('manager') ||
    normalizedRole.includes('operational') ||
    normalizedRole.includes('operation')
  ) {
    return 'manager';
  }

  if (
    normalizedRole.includes('telecaller') ||
    normalizedRole.includes('tele') ||
    normalizedRole.includes('caller')
  ) {
    return 'telecaller';
  }

  return 'employee';
}

function isAssignedToUser(assignedTo: any, userId?: string): boolean {
  if (!userId || !assignedTo) return false;

  if (Array.isArray(assignedTo)) {
    return assignedTo.some((item) => extractId(item) === userId);
  }

  return extractId(assignedTo) === userId;
}

function getEntityBranchId(entity: any, customerBranchMap?: Record<string, string>): string | undefined {
  if (!entity) return undefined;

  const directBranch =
    entity.branchId ||
    entity.branch ||
    entity?.branchId?._id ||
    entity?.branch?._id ||
    entity?.branchId?.$oid ||
    entity?.branch?.$oid;

  if (directBranch) return String(directBranch);

  const customerId = extractId(entity.customer);
  if (customerId && customerBranchMap?.[customerId]) {
    return customerBranchMap[customerId];
  }

  return undefined;
}

function belongsToBranch(entity: any, branchId?: string, customerBranchMap?: Record<string, string>): boolean {
  if (!branchId) return true; // If manager has no branchId in localStorage, do not break the dashboard.
  const entityBranchId = getEntityBranchId(entity, customerBranchMap);
  return entityBranchId === branchId;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day ago`;

  return date.toLocaleDateString('en-IN');
}

async function fetcher<T>(endpoint: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/${endpoint}`, {
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const json = await res.json();

  if (Array.isArray(json)) return json as T;
  if (Array.isArray(json.data)) return json.data as T;
  if (Array.isArray(json?.data?.items)) return json.data.items as T;
  if (Array.isArray(json?.data?.docs)) return json.data.docs as T;

  const possibleKeys = ['customers', 'leads', 'works', 'tickets', 'users', 'items', 'results', 'result'];
  for (const key of possibleKeys) {
    if (Array.isArray(json[key])) return json[key] as T;
    if (Array.isArray(json?.data?.[key])) return json.data[key] as T;
  }

  console.warn(`Unexpected response shape for ${endpoint}:`, json);
  return [] as T;
}

// ===================== DASHBOARD =====================
export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = getToken();

  const storedUserStr = localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}';
  let storedUser: any = {};
  try {
    storedUser = JSON.parse(storedUserStr);
  } catch {
    storedUser = {};
  }

  const currentUser: User = {
    _id: storedUser._id || storedUser.id || '',
    id: storedUser.id || storedUser._id || '',
    name: storedUser.name || 'Admin',
    role: storedUser.role || 'Admin',
    branchId: storedUser.branchId || storedUser.branch || 'BR001',
  };

  const userId = currentUser._id || currentUser.id || '';
  const mode = getDashboardMode(currentUser.role);
  const isAdmin = mode === 'admin';
  const isManager = mode === 'manager';
  const isTelecaller = mode === 'telecaller';
  const isNormalEmployee = mode === 'employee';

  const canViewAllCompanyData = isAdmin;
  const canViewBranchData = isManager;
  const canViewLeads = isAdmin || isManager || isTelecaller;
  const canViewCustomers = isAdmin || isManager;
  const canViewEmployees = isAdmin || isManager;
  const canViewTickets = isAdmin || isManager || isTelecaller;
  const canViewProjectStats = isAdmin || isManager;
  const dashboardTitle =
    isAdmin
      ? 'Company-wide insights'
      : isManager
        ? 'Branch insights'
        : isTelecaller
          ? 'Your leads, follow-ups and assigned tasks'
          : 'Your assigned work and recent updates';

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const activeToken = localStorage.getItem('token') || '';
      if (!activeToken) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [usersData, customersData, leadsData, worksData, ticketsData] = await Promise.all([
          fetcher<Employee[]>('users', activeToken).catch(() => []),
          fetcher<Customer[]>('customers', activeToken).catch(() => []),
          fetcher<Lead[]>('leads', activeToken).catch(() => []),
          fetcher<Work[]>('works', activeToken).catch(() => []),
          fetcher<Ticket[]>('tickets', activeToken).catch(() => []),
        ]);

        let employeesList = Array.isArray(usersData) ? usersData : [];
        let customersList = Array.isArray(customersData) ? customersData : [];
        let leadsList = Array.isArray(leadsData) ? leadsData : [];
        let worksList = Array.isArray(worksData) ? worksData : [];
        let ticketsList = Array.isArray(ticketsData) ? ticketsData : [];

        const customerBranchMap = customersList.reduce<Record<string, string>>((acc, customer) => {
          const customerId = extractId(customer);
          const customerBranchId = getEntityBranchId(customer);
          if (customerId && customerBranchId) acc[customerId] = customerBranchId;
          return acc;
        }, {});

        // ===================== ROLE-BASED DATA ACCESS =====================
        if (canViewAllCompanyData) {
          // Admin sees everything.
        } else if (canViewBranchData) {
          // Operational Manager sees only own branch data.
          employeesList = employeesList.filter((employee) => employee.branchId === currentUser.branchId);
          customersList = customersList.filter((customer) => belongsToBranch(customer, currentUser.branchId));
          leadsList = leadsList.filter((lead) => belongsToBranch(lead, currentUser.branchId));
          worksList = worksList.filter((work) => belongsToBranch(work, currentUser.branchId, customerBranchMap));
          ticketsList = ticketsList.filter((ticket) => belongsToBranch(ticket, currentUser.branchId, customerBranchMap));
        } else if (isTelecaller) {
          // Telecaller sees only assigned leads and assigned works/tasks.
          employeesList = employeesList.filter((employee) => extractId(employee) === userId);
          customersList = [];
          leadsList = leadsList.filter((lead) => isAssignedToUser(lead.assignedTo, userId));
          worksList = worksList.filter((work) => isAssignedToUser(work.assignedTo, userId));
          ticketsList = ticketsList.filter((ticket) => isAssignedToUser(ticket.assignedTo, userId));
        } else {
          // Other employees see only assigned works and their work-related recent activity.
          employeesList = employeesList.filter((employee) => extractId(employee) === userId);
          customersList = [];
          leadsList = [];
          worksList = worksList.filter((work) => isAssignedToUser(work.assignedTo, userId));
          ticketsList = ticketsList.filter((ticket) => isAssignedToUser(ticket.assignedTo, userId));
        }

        setEmployees(employeesList);
        setCustomers(customersList);
        setLeads(leadsList);
        setWorks(worksList);
        setTickets(ticketsList);

        const allowedActivities: ActivityItem[] = [];

        if (canViewLeads) {
          leadsList.forEach((lead) => {
            if (lead.createdAt) {
              allowedActivities.push({
                id: `lead-${lead._id}`,
                type: 'lead',
                title: 'Lead Update',
                description: lead.name,
                timestamp: lead.createdAt,
              });
            }
          });
        }

        worksList.forEach((work) => {
          if (work.createdAt) {
            allowedActivities.push({
              id: `work-${work._id}`,
              type: 'work',
              title: 'Work Update',
              description: work.title,
              timestamp: work.createdAt,
            });
          }
        });

        if (canViewCustomers) {
          customersList.forEach((customer) => {
            if (customer.createdAt) {
              allowedActivities.push({
                id: `customer-${customer._id}`,
                type: 'customer',
                title: 'Customer Update',
                description: customer.name,
                timestamp: customer.createdAt,
              });
            }
          });
        }

        if (canViewTickets) {
          ticketsList.forEach((ticket) => {
            if (ticket.createdAt) {
              allowedActivities.push({
                id: `ticket-${ticket._id}`,
                type: 'ticket',
                title: 'Ticket Update',
                description: ticket.subject,
                timestamp: ticket.createdAt,
              });
            }
          });
        }

        allowedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(allowedActivities.slice(0, 10));
      } catch (err: any) {
        if (err?.message === 'Unauthorized') {
          navigate('/', { replace: true });
          return;
        }
        console.error('Dashboard fetch error:', err);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [
    token,
    toast,
    userId,
    currentUser.branchId,
    canViewAllCompanyData,
    canViewBranchData,
    isTelecaller,
    canViewLeads,
    canViewCustomers,
    canViewTickets,
  ]);

  // ===================== DERIVED DATA =====================
  const today = new Date().toISOString().split('T')[0];

  const todayFollowups = leads.filter(
    (lead) => lead.nextFollowUpDate && lead.nextFollowUpDate.split('T')[0] === today
  ).length;

  const completedWorks = works.filter((work) => work.status === 'Completed').length;
  const pendingWorks = works.filter((work) => work.status !== 'Completed').length;
  const openTickets = tickets.filter((ticket) => ticket.status !== 'Closed' && ticket.status !== 'Resolved').length;
  const highPriorityTickets = tickets.filter((ticket) => ticket.priority === 'High' || ticket.priority === 'Urgent').length;

  const leadStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((lead) => {
      map[lead.status || 'Unknown'] = (map[lead.status || 'Unknown'] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const workStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    works.forEach((work) => {
      map[work.status || 'Unknown'] = (map[work.status || 'Unknown'] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [works]);

  const ticketPriorityData = useMemo(() => {
    const map: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const priority = ticket.priority || 'Medium';
      map[priority] = (map[priority] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const completedWorksList = works.filter((work) => work.status === 'Completed');
  const projectStats = [
    {
      title: 'Digital Marketing',
      value: completedWorksList.filter((work) => work.workType === 'Digital Marketing').length,
      icon: TrendingUp,
    },
    {
      title: 'Apps Developed',
      value: completedWorksList.filter((work) => work.workType === 'App Development').length,
      icon: MonitorSmartphone,
    },
    {
      title: 'Promo Videos',
      value: completedWorksList.filter((work) => work.workType === 'Video Production').length,
      icon: Video,
    },
    {
      title: 'Website Designs',
      value: completedWorksList.filter((work) => work.workType === 'Website Design').length,
      icon: Globe,
    },
  ];

  const topEmployees = useMemo(() => {
    if (!canViewEmployees || employees.length === 0) return [];

    const employeeMap: Record<string, { name: string; completed: number; total: number }> = {};

    works.forEach((work) => {
      const assigneeIds = Array.isArray(work.assignedTo)
        ? work.assignedTo.map((item) => extractId(item)).filter(Boolean)
        : [extractId(work.assignedTo)].filter(Boolean);

      assigneeIds.forEach((assigneeId) => {
        const employee = employees.find((item) => extractId(item) === assigneeId);
        const name = employee?.name || 'Unknown';

        if (!employeeMap[assigneeId as string]) {
          employeeMap[assigneeId as string] = { name, completed: 0, total: 0 };
        }

        employeeMap[assigneeId as string].total += 1;

        if (work.status === 'Completed') {
          employeeMap[assigneeId as string].completed += 1;
        }
      });
    });

    return Object.values(employeeMap)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [canViewEmployees, employees, works]);

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const urgentWorks = works
    .filter((work) => work.status !== 'Completed' && (work.priority === 'High' || work.priority === 'Urgent'))
    .slice(0, 5);

  const statsCards: any[] = [];

  if (canViewCustomers) {
    statsCards.push({
      title: isManager ? 'Branch Customers' : 'Total Customers',
      value: customers.length,
      icon: Building2,
      variant: 'default',
      onClick: () => navigate('/customers'),
    });
  }

  if (canViewEmployees) {
    statsCards.push({
      title: isManager ? 'Branch Employees' : 'Total Employees',
      value: employees.length,
      icon: Users,
      variant: 'default',
      onClick: () => navigate('/employees'),
    });
  }

  if (canViewLeads) {
    statsCards.push({
      title: isTelecaller ? 'My Leads' : isManager ? 'Branch Leads' : 'Total Leads',
      value: leads.length,
      icon: Target,
      variant: 'default',
      onClick: () => navigate('/leads'),
    });
  }

  statsCards.push({
    title: isAdmin || isManager ? 'Pending Works' : 'My Pending Works',
    value: pendingWorks,
    icon: Briefcase,
    variant: pendingWorks > 0 ? 'warning' : 'default',
    onClick: () => navigate('/works'),
  });

  if (canViewTickets) {
    statsCards.push({
      title: isTelecaller ? 'My Open Tickets' : 'Open Tickets',
      value: openTickets,
      icon: Ticket,
      variant: openTickets > 0 ? 'warning' : 'default',
      onClick: () => navigate('/tickets'),
    });
  }

  if (canViewLeads) {
    statsCards.push({
      title: "Today's Follow-ups",
      value: todayFollowups,
      icon: Phone,
      variant: todayFollowups > 0 ? 'warning' : 'default',
      onClick: () => navigate('/leads'),
    });
  }

  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#A855F7', '#EF4444'];

  const getStatusColor = (status?: string) => {
    const map: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Open: 'bg-blue-100 text-blue-800',
      Closed: 'bg-gray-100 text-gray-800',
      Resolved: 'bg-green-100 text-green-800',
      Won: 'bg-green-100 text-green-800',
      'Own Close': 'bg-green-100 text-green-800',
      Lost: 'bg-red-100 text-red-800',
      Failed: 'bg-red-100 text-red-800',
      Review: 'bg-purple-100 text-purple-800',
    };

    return map[status || ''] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Overview {currentUser.role ? `(${currentUser.role})` : ''}
          </h1>
          <p className="text-muted-foreground">{dashboardTitle}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index} />
        ))}
      </div>

      {/* Charts */}
      <div className={`grid grid-cols-1 ${canViewLeads ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {canViewLeads && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {leadStatusData.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={leadStatusData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {leadStatusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">No lead data</div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isNormalEmployee ? 'My Work Status Overview' : 'Work Status Overview'}</CardTitle>
          </CardHeader>
          <CardContent>
            {workStatusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No work data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Priority */}
      {canViewTickets && ticketPriorityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Completed Projects by Type */}
      {canViewProjectStats && (
        <Card>
          <CardHeader>
            <CardTitle>{isManager ? 'Branch Completed Projects by Type' : 'Completed Projects by Type'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {projectStats.map((stat) => (
                <div key={stat.title} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canViewEmployees && (
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Star className="text-yellow-500" /> Top Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topEmployees.length ? (
                topEmployees.map((employee, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs">Completed: {employee.completed}/{employee.total}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {employee.total ? Math.round((employee.completed / employee.total) * 100) : 0}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        )}

        {canViewLeads && (
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Target className="text-blue-500" /> {isTelecaller ? 'My Recent Leads' : 'Recent Leads'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads.length ? (
                recentLeads.map((lead) => (
                  <div key={lead._id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(lead.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No leads</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Briefcase className="text-green-500" /> {isNormalEmployee ? 'My Urgent Works' : 'Urgent Works'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentWorks.length ? (
              urgentWorks.map((work) => (
                <div key={work._id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                  <div>
                    <p className="text-sm font-medium">{work.title}</p>
                    <p className="text-xs text-muted-foreground">{work.dueDate ? new Date(work.dueDate).toLocaleDateString('en-IN') : 'No due date'}</p>
                  </div>
                  <Badge className={getStatusColor(work.status)}>{work.priority || work.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-muted-foreground">No urgent works</p>
            )}
          </CardContent>
        </Card>

        {canViewTickets && (
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Ticket className="text-purple-500" /> {isTelecaller ? 'My Recent Tickets' : 'Recent Tickets'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTickets.length ? (
                recentTickets.map((ticket) => (
                  <div key={ticket._id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No tickets</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activities + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Activity /> Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b">
                    <div className="mt-1 p-1 rounded-full bg-blue-100 text-blue-600">
                      {activity.type === 'lead' ? (
                        <Target className="w-3 h-3" />
                      ) : activity.type === 'work' ? (
                        <Briefcase className="w-3 h-3" />
                      ) : activity.type === 'ticket' ? (
                        <Ticket className="w-3 h-3" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <AlertTriangle className="text-warning" /> Alerts & Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {canViewLeads && (
                <>
                  {(() => {
                    const next7 = new Date();
                    next7.setDate(next7.getDate() + 7);
                    const upcoming = leads.filter(
                      (lead) =>
                        lead.nextFollowUpDate &&
                        lead.nextFollowUpDate >= today &&
                        lead.nextFollowUpDate <= next7.toISOString().split('T')[0] &&
                        lead.status !== 'Closed'
                    );

                    return (
                      <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                        <p className="text-sm font-medium">Upcoming Follow-ups</p>
                        <p className="text-xs">{upcoming.length} leads in next 7 days</p>
                        {upcoming.slice(0, 2).map((lead) => (
                          <div key={lead._id} className="text-xs mt-1">
                            • {lead.name} - {new Date(lead.nextFollowUpDate!).toLocaleDateString('en-IN')}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {(() => {
                    const overdue = leads.filter(
                      (lead) => lead.nextFollowUpDate && lead.nextFollowUpDate < today && lead.status !== 'Closed'
                    );

                    return (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                        <p className="text-sm font-medium">Overdue Follow-ups</p>
                        <p className="text-xs">{overdue.length} leads past due</p>
                      </div>
                    );
                  })()}
                </>
              )}

              {canViewTickets && highPriorityTickets > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-medium">High Priority Tickets</p>
                  <p className="text-xs">{highPriorityTickets} tickets need attention</p>
                </div>
              )}

              {canViewEmployees && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium">Inactive Employees</p>
                  <p className="text-xs">
                    {employees.filter((employee) => normalizeRole(employee.status) === 'inactive').length} inactive
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{isNormalEmployee ? 'My Pending Works' : 'Pending Works'}</p>
                <p className="text-xs">{pendingWorks} works not completed</p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium">{isNormalEmployee ? 'My Completed Works' : 'Completed Works'}</p>
                <p className="text-xs">{completedWorks} works completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
