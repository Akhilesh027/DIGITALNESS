import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  FileDown,
  FileText,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  Loader2,
  PieChart as PieChartIcon,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/store/invoiceStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = [
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

type Section =
  | "overview"
  | "team"
  | "tasks"
  | "payments"
  | "invoices"
  | "reports"
  | "downloads";

const NAV: { key: Section; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "team", label: "Team", icon: Users },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "downloads", label: "Downloads", icon: FileDown },
];

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.works)) return data.works;
  if (Array.isArray(data?.invoices)) return data.invoices;
  if (Array.isArray(data?.payments)) return data.payments;
  return [];
};

const getCurrentUser = () => {
  try {
    const user =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser");

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusVariant = (status: string): any => {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete") || s.includes("paid") || s.includes("approved")) {
    return "completed";
  }
  if (s.includes("progress") || s.includes("sent")) return "inProgress";
  if (s.includes("review") || s.includes("pending")) return "warning";
  if (s.includes("failed") || s.includes("overdue") || s.includes("rejected")) {
    return "destructive";
  }
  return "secondary";
};

export default function ClientPortalPage() {
  const { invoices: localInvoices, paymentRecords } = useInvoiceStore();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const isCustomerRole = String(currentUser?.role || "").toLowerCase() === "customer";

  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [backendInvoices, setBackendInvoices] = useState<any[]>([]);
  const [backendPayments, setBackendPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [active, setActive] = useState<Section>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [reportRange, setReportRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });
  const [selectedWork, setSelectedWork] = useState<any>(null);

  const fetchBackendData = async () => {
    try {
      setLoading(true);

      const requests = [
        fetch(`${API_URL}/customers`, getAuthConfig()),
        fetch(`${API_URL}/users`, getAuthConfig()),
        fetch(`${API_URL}/works`, getAuthConfig()),
      ];

      const [customersRes, usersRes, worksRes] = await Promise.all(requests);
      const [customersData, usersData, worksData] = await Promise.all([
        customersRes.json(),
        usersRes.json(),
        worksRes.json(),
      ]);

      const customerList = getArrayData(customersData);
      const userList = getArrayData(usersData);
      const workList = getArrayData(worksData);

      setCustomers(customerList);
      setEmployees(userList);
      setWorks(workList);

      try {
        const [invoiceRes, paymentRes] = await Promise.all([
          fetch(`${API_URL}/invoices`, getAuthConfig()),
          fetch(`${API_URL}/payments`, getAuthConfig()),
        ]);

        if (invoiceRes.ok) setBackendInvoices(getArrayData(await invoiceRes.json()));
        if (paymentRes.ok) setBackendPayments(getArrayData(await paymentRes.json()));
      } catch {
        setBackendInvoices([]);
        setBackendPayments([]);
      }

      if (!selectedCustomerId && customerList.length > 0) {
        const currentUserId = currentUser?._id || currentUser?.id;

        const matchedCustomer = customerList.find((c: any) => {
          const userId = c.userId?._id || c.userId?.id || c.userId;
          const assignedId = c.assignedTo?._id || c.assignedTo?.id || c.assignedTo;
          return (
            String(userId) === String(currentUserId) ||
            String(c._id || c.id) === String(currentUserId) ||
            String(assignedId) === String(currentUserId) ||
            String(c.email || "").toLowerCase() ===
            String(currentUser?.email || "").toLowerCase()
          );
        });

        setSelectedCustomerId(
          isCustomerRole && matchedCustomer
            ? matchedCustomer._id || matchedCustomer.id
            : customerList[0]._id || customerList[0].id
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch client portal data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCustomerId = (customer: any) => customer?._id || customer?.id;
  const getCustomerName = (customer: any) =>
    customer?.name || customer?.customerName || customer?.clientName || customer?.companyName || "Unnamed Customer";

  const getWorkCustomerId = (work: any) =>
    work?.customer?._id || work?.customer?.id || work?.customer || work?.customerId;

  const getAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];
    const assignedArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    return assignedArray.map((user: any) => {
      if (typeof user === "object") {
        return {
          id: user._id || user.id,
          name: user.name || user.fullName || user.username || user.email || "Unassigned",
          role: user.role || user.designation || user.department || "Employee",
          email: user.email || "",
        };
      }

      const found = employees.find(
        (emp: any) => String(emp._id || emp.id) === String(user)
      );

      return {
        id: user,
        name: found?.name || found?.fullName || found?.username || found?.email || "Unassigned",
        role: found?.role || found?.designation || found?.department || "Employee",
        email: found?.email || "",
      };
    });
  };

  const customer = customers.find(
    (c) => String(getCustomerId(c)) === String(selectedCustomerId)
  );

  const allInvoices = backendInvoices.length > 0 ? backendInvoices : localInvoices || [];
  const allPayments = backendPayments.length > 0 ? backendPayments : paymentRecords || [];

  const customerWorks = useMemo(() => {
    return works
      .filter((work) => String(getWorkCustomerId(work)) === String(selectedCustomerId))
      .map((work) => {
        const deliverables = Number(work.deliverables || 1);
        const completedDeliverables = Number(work.completedDeliverables || 0);
        const progress = deliverables
          ? Math.min(Math.round((completedDeliverables / deliverables) * 100), 100)
          : Number(work.progressPercentage || work.progress || 0);

        return {
          id: work._id || work.id,
          title: work.title || "Untitled Work",
          category: work.workType || work.type || "General",
          status: work.status || "Pending",
          priority: work.priority || "Medium",
          dueDate: work.dueDate || work.deadline || "",
          completedDate: work.status === "Completed" ? work.updatedAt || work.completedDate : null,
          progress,
          deliverables,
          completedDeliverables,
          description: work.description || "",
          assignedUsers: getAssignedUsers(work.assignedTo),
          attachments: Array.isArray(work.attachments) ? work.attachments : [],
          updates: Array.isArray(work.updates) ? work.updates : [],
          comments: Array.isArray(work.comments) ? work.comments : [],
        };
      });
  }, [works, selectedCustomerId, employees]);

  const customerInvoices = useMemo(() => {
    return allInvoices.filter((invoice: any) => {
      const invoiceCustomerId =
        invoice.customer?._id || invoice.customer?.id || invoice.customer || invoice.customerId;
      return String(invoiceCustomerId) === String(selectedCustomerId);
    });
  }, [allInvoices, selectedCustomerId]);

  const customerPayments = useMemo(() => {
    return allPayments.filter((payment: any) => {
      const paymentCustomerId =
        payment.customer?._id || payment.customer?.id || payment.customer || payment.customerId;
      return String(paymentCustomerId) === String(selectedCustomerId);
    });
  }, [allPayments, selectedCustomerId]);

  const filteredWorks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customerWorks.filter(
      (work) =>
        work.title.toLowerCase().includes(q) ||
        work.category.toLowerCase().includes(q) ||
        work.status.toLowerCase().includes(q)
    );
  }, [customerWorks, searchQuery]);

  const uniqueTeam = useMemo(() => {
    const map = new Map<string, any>();
    customerWorks.forEach((work) => {
      work.assignedUsers.forEach((user: any) => {
        if (user.id && !map.has(String(user.id))) map.set(String(user.id), user);
      });
    });
    return Array.from(map.values());
  }, [customerWorks]);

  const overview = useMemo(() => {
    const total = customerWorks.length;
    const completed = customerWorks.filter((w) => w.status === "Completed").length;
    const inProgress = customerWorks.filter((w) => w.status === "In Progress").length;
    const review = customerWorks.filter((w) => w.status === "Review").length;
    const pending = customerWorks.filter((w) => ["Pending", "Not Started"].includes(w.status)).length;
    const overdue = customerWorks.filter(
      (w) => w.dueDate && new Date(w.dueDate) < new Date() && w.status !== "Completed"
    ).length;
    const avgProgress = total
      ? Math.round(customerWorks.reduce((sum, w) => sum + Number(w.progress || 0), 0) / total)
      : 0;
    const paid = customerPayments.reduce((sum: number, p: any) => sum + Number(p.amount || p.paidAmount || 0), 0);
    const invoiceTotal = customerInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total || inv.amount || inv.grandTotal || 0), 0);
    const pendingAmount = Math.max(invoiceTotal - paid, 0);

    return {
      total,
      completed,
      inProgress,
      review,
      pending,
      overdue,
      avgProgress,
      paid,
      invoiceTotal,
      pendingAmount,
      teamCount: uniqueTeam.length,
    };
  }, [customerWorks, customerInvoices, customerPayments, uniqueTeam]);

  const statusChartData = useMemo(
    () => [
      { name: "Completed", value: overview.completed },
      { name: "In Progress", value: overview.inProgress },
      { name: "Review", value: overview.review },
      { name: "Pending", value: overview.pending },
      { name: "Overdue", value: overview.overdue },
    ].filter((item) => item.value > 0),
    [overview]
  );

  const progressChartData = useMemo(() => {
    return customerWorks.map((work) => ({
      name: work.title.length > 14 ? `${work.title.slice(0, 14)}...` : work.title,
      progress: work.progress,
    }));
  }, [customerWorks]);

  const reportSummary = useMemo(
    () => ({
      client: getCustomerName(customer),
      company: customer?.companyName || customer?.businessName || "-",
      email: customer?.email || "-",
      phone: Array.isArray(customer?.contactNumbers)
        ? customer.contactNumbers.join(", ")
        : customer?.phone || customer?.contactNumber || "-",
      businessType: customer?.businessType || "-",
      branch: customer?.branchId || "-",
      generatedOn: new Date().toLocaleString("en-IN"),
      range: `${formatDate(reportRange.fromDate)} - ${formatDate(reportRange.toDate)}`,
      totalWorks: overview.total,
      completedWorks: overview.completed,
      avgProgress: overview.avgProgress,
      teamCount: overview.teamCount,
      paid: overview.paid,
      pendingAmount: overview.pendingAmount,
    }),
    [customer, overview, reportRange]
  );

  const callReportApi = async (endpoint: string, label: string) => {
    try {
      if (!selectedCustomerId) return;
      setReportLoading(label);

      const res = await fetch(endpoint, getAuthConfig());

      if (!res.ok) {
        throw new Error("Report API not available yet");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label}-${getCustomerName(customer)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Report Downloaded", description: `${label} downloaded successfully` });
    } catch {
      printClientReport(label);
    } finally {
      setReportLoading(null);
    }
  };

  const printClientReport = (label: string) => {
    const rows = customerWorks
      .map(
        (work) => `
          <tr>
            <td>${work.title}</td>
            <td>${work.category}</td>
            <td>${work.status}</td>
            <td>${work.progress}%</td>
            <td>${work.assignedUsers.map((u: any) => u.name).join(", ") || "-"}</td>
            <td>${formatDate(work.dueDate)}</td>
          </tr>`
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${label}</title>
          <style>
            body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111827;background:#fff}
            .header{border-bottom:3px solid #06053A;padding-bottom:18px;margin-bottom:24px}
            .brand{font-size:28px;font-weight:800;color:#06053A;margin:0}
            .sub{color:#6b7280;margin:4px 0 0}
            .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
            .card{border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f9fafb}
            .card b{font-size:20px;color:#06053A}
            table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
            th{background:#06053A;color:white;text-align:left;padding:10px;border:1px solid #06053A}
            td{padding:10px;border:1px solid #e5e7eb;vertical-align:top}
            .section{margin-top:24px}
            .footer{margin-top:32px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}
            @media print{body{padding:20px}.no-print{display:none}}
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">Digitalness Industries LLP</h1>
            <p class="sub">Professional Client Work Report</p>
          </div>

          <h2>${label}</h2>
          <p><b>Client:</b> ${reportSummary.client}</p>
          <p><b>Company:</b> ${reportSummary.company}</p>
          <p><b>Email:</b> ${reportSummary.email}</p>
          <p><b>Phone:</b> ${reportSummary.phone}</p>
          <p><b>Business Type:</b> ${reportSummary.businessType}</p>
          <p><b>Branch:</b> ${reportSummary.branch}</p>
          <p><b>Date Range:</b> ${reportSummary.range}</p>

          <div class="grid">
            <div class="card"><b>${reportSummary.totalWorks}</b><br/>Total Works</div>
            <div class="card"><b>${reportSummary.completedWorks}</b><br/>Completed</div>
            <div class="card"><b>${reportSummary.avgProgress}%</b><br/>Avg Progress</div>
            <div class="card"><b>${formatMoney(reportSummary.pendingAmount)}</b><br/>Pending Amount</div>
          </div>

          <div class="section">
            <h3>Project / Work Progress</h3>
            <table>
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Assigned Team</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>${rows || `<tr><td colspan="6">No works found</td></tr>`}</tbody>
            </table>
          </div>

          <div class="footer">
            Generated on ${reportSummary.generatedOn} · Digitalness CRM
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 16px;background:#06053A;color:white;border:0;border-radius:8px">Print / Save PDF</button>
        </body>
      </html>
    `);
    win.document.close();
  };

  const downloadReport = (type: "daily" | "weekly" | "monthly" | "project" | "payment") => {
    const params = new URLSearchParams({
      fromDate: reportRange.fromDate,
      toDate: reportRange.toDate,
    });

    const endpoints: Record<string, string> = {
      daily: `${API_URL}/reports/customer/${selectedCustomerId}/daily?${params}`,
      weekly: `${API_URL}/reports/customer/${selectedCustomerId}/weekly?${params}`,
      monthly: `${API_URL}/reports/customer/${selectedCustomerId}/monthly?${params}`,
      project: `${API_URL}/reports/customer/${selectedCustomerId}/projects?${params}`,
      payment: `${API_URL}/reports/customer/${selectedCustomerId}/payments?${params}`,
    };

    const labels: Record<string, string> = {
      daily: "Daily Client Report",
      weekly: "Weekly Client Report",
      monthly: "Monthly Client Report",
      project: "Project Progress Report",
      payment: "Payment Report",
    };

    callReportApi(endpoints[type], labels[type]);
  };

  const StatCard = ({ title, value, icon: Icon, className }: any) => (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );

  const WorkCard = ({ work }: { work: any }) => (
    <div className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{work.title}</h3>
          <p className="text-sm text-muted-foreground">{work.category}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(work.status)}>{work.status}</Badge>
          <Badge variant="outline">{work.priority}</Badge>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{work.progress}%</span>
        </div>
        <Progress value={work.progress} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Due Date</p>
          <p className="font-medium">{formatDate(work.dueDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Deliverables</p>
          <p className="font-medium">
            {work.completedDeliverables}/{work.deliverables}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Team</p>
          <p className="font-medium">{work.assignedUsers.length} member(s)</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {work.assignedUsers.slice(0, 3).map((user: any) => (
          <Badge key={user.id} variant="secondary">
            {user.name}
          </Badge>
        ))}
      </div>

      <Button className="mt-4 w-full" variant="outline" onClick={() => setSelectedWork(work)}>
        View Details
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-primary">Client Portal</p>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-foreground lg:text-3xl">
                {getCustomerName(customer)} Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">
                Track projects, team, reports, invoices, payments and downloads in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {!isCustomerRole && (
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={getCustomerId(c)} value={getCustomerId(c)}>
                        {getCustomerName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" onClick={fetchBackendData} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={active === item.key ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setActive(item.key)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Projects" value={overview.total} icon={FileText} />
          <StatCard title="Completed" value={overview.completed} icon={CheckCircle} className="border-success/30 bg-success/10" />
          <StatCard title="In Progress" value={overview.inProgress} icon={Clock} className="border-info/30 bg-info/10" />
          <StatCard title="Avg Progress" value={`${overview.avgProgress}%`} icon={TrendingUp} />
          <StatCard title="Team Members" value={overview.teamCount} icon={Users} />
          <StatCard title="Pending Amount" value={formatMoney(overview.pendingAmount)} icon={IndianRupee} className="border-warning/30 bg-warning/10" />
        </div>

        {active === "overview" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Project Status Overview</h2>
              <div className="mt-4 h-[300px]">
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                        {statusChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No project data</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Progress by Project</h2>
              <div className="mt-4 h-[300px]">
                {progressChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No progress data</div>
                )}
              </div>
            </div>
          </div>
        )}

        {active === "team" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uniqueTeam.map((member: any) => (
              <div key={member.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {member.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                {member.email && <p className="mt-3 text-sm text-muted-foreground">{member.email}</p>}
              </div>
            ))}
            {uniqueTeam.length === 0 && <EmptyState title="No team assigned yet" />}
          </div>
        )}

        {active === "tasks" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, work type or status..."
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredWorks.map((work) => <WorkCard key={work.id} work={work} />)}
              {filteredWorks.length === 0 && <EmptyState title="No works found" />}
            </div>
          </div>
        )}

        {active === "payments" && (
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Payment Summary</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard title="Invoice Total" value={formatMoney(overview.invoiceTotal)} icon={Receipt} />
              <StatCard title="Paid Amount" value={formatMoney(overview.paid)} icon={CheckCircle} />
              <StatCard title="Pending Amount" value={formatMoney(overview.pendingAmount)} icon={Clock} />
            </div>
            <div className="mt-5 space-y-3">
              {customerPayments.map((payment: any, index: number) => (
                <div key={payment._id || payment.id || index} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{payment.referenceId || payment.title || `Payment ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.date || payment.createdAt)}</p>
                  </div>
                  <Badge variant="completed">{formatMoney(payment.amount || payment.paidAmount || 0)}</Badge>
                </div>
              ))}
              {customerPayments.length === 0 && <EmptyState title="No payments found" />}
            </div>
          </div>
        )}

        {active === "invoices" && (
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Invoices</h2>
            <div className="mt-5 space-y-3">
              {customerInvoices.map((invoice: any, index: number) => (
                <div key={invoice._id || invoice.id || index} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber || invoice.title || `Invoice ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.date || invoice.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status || "Pending"}</Badge>
                    <Badge variant="outline">{formatMoney(invoice.total || invoice.amount || invoice.grandTotal || 0)}</Badge>
                  </div>
                </div>
              ))}
              {customerInvoices.length === 0 && <EmptyState title="No invoices found" />}
            </div>
          </div>
        )}

        {active === "reports" && (
          <div className="space-y-5">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Client Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate daily, weekly, monthly, project, payment and performance reports.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Report Type</p>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">From</p>
                    <Input
                      type="date"
                      value={reportRange.fromDate}
                      onChange={(e) => setReportRange({ ...reportRange, fromDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">To</p>
                    <Input
                      type="date"
                      value={reportRange.toDate}
                      onChange={(e) => setReportRange({ ...reportRange, toDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <ReportButton title="Daily Report" type="daily" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Weekly Report" type="weekly" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Monthly Report" type="monthly" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Project Report" type="project" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Payment Report" type="payment" onClick={downloadReport} loading={reportLoading} />
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Report Preview</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PreviewItem label="Client" value={reportSummary.client} />
                <PreviewItem label="Company" value={reportSummary.company} />
                <PreviewItem label="Total Works" value={reportSummary.totalWorks} />
                <PreviewItem label="Average Progress" value={`${reportSummary.avgProgress}%`} />
                <PreviewItem label="Completed Works" value={reportSummary.completedWorks} />
                <PreviewItem label="Team Members" value={reportSummary.teamCount} />
                <PreviewItem label="Paid Amount" value={formatMoney(reportSummary.paid)} />
                <PreviewItem label="Pending Amount" value={formatMoney(reportSummary.pendingAmount)} />
              </div>
            </div>
          </div>
        )}

        {active === "downloads" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DownloadCard title="Complete Client PDF" desc="Full client overview with projects, team and payments." onClick={() => printClientReport("Complete Client Report")} />
            <DownloadCard title="Work History PDF" desc="All works, progress, assigned employees and status." onClick={() => downloadReport("project")} />
            <DownloadCard title="Monthly Report PDF" desc="Monthly project and performance summary." onClick={() => downloadReport("monthly")} />
            <DownloadCard title="Payment Report PDF" desc="Invoice total, paid amount and pending balance." onClick={() => downloadReport("payment")} />
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedWork)} onOpenChange={() => setSelectedWork(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Work Details</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedWork.title}</h2>
                    <p className="text-muted-foreground">{selectedWork.category}</p>
                  </div>
                  <Badge variant={getStatusVariant(selectedWork.status)}>{selectedWork.status}</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{selectedWork.progress}%</span>
                  </div>
                  <Progress value={selectedWork.progress} />
                </div>
                <p className="mt-4 whitespace-pre-line text-sm">{selectedWork.description || "No description added"}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PreviewItem label="Due Date" value={formatDate(selectedWork.dueDate)} />
                <PreviewItem label="Deliverables" value={`${selectedWork.completedDeliverables}/${selectedWork.deliverables}`} />
                <PreviewItem label="Priority" value={selectedWork.priority} />
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Assigned Team</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedWork.assignedUsers.map((user: any) => (
                    <div key={user.id} className="rounded-xl bg-muted/40 p-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Attachments</h3>
                <div className="mt-3 space-y-2">
                  {selectedWork.attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments found</p>}
                  {selectedWork.attachments.map((file: any, index: number) => {
                    const url = file.fileUrl || file.url || file;
                    const name = file.fileName || String(url).split("/").pop() || `Attachment ${index + 1}`;
                    return (
                      <div key={index} className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium">{name}</p>
                        {url && (
                          <a className="text-sm text-primary underline" href={url} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
      {title}
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value || "-"}</p>
    </div>
  );
}

function ReportButton({ title, type, onClick, loading }: any) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col items-start gap-2 p-4 text-left"
      onClick={() => onClick(type)}
      disabled={loading === title}
    >
      <div className="flex w-full items-center justify-between">
        <FileText className="h-5 w-5 text-primary" />
        {loading === title ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </div>
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">Download / print PDF report</span>
    </Button>
  );
}

function DownloadCard({ title, desc, onClick }: any) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit">
        <Download className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button className="mt-4 w-full" onClick={onClick}>
        Download
      </Button>
    </div>
  );
}
