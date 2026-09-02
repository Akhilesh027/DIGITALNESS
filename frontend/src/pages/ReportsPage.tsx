import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Download,
  Filter,
  Mic,
  Square,
  Loader2,
  Briefcase,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [customerId, setCustomerId] = useState("all");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const normalizeArray = (data: any, key?: string) => {
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const getRecordId = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || value.customerId || "";
  };

  const matchBranch = (item: any) => {
    if (branchId === "all") return true;

    return (
      item.branchId === branchId ||
      item.branch?._id === branchId ||
      item.branch?.branchId === branchId ||
      item.assignedTo?.branchId === branchId ||
      item.customer?.branchId === branchId ||
      item.createdBy?.branchId === branchId
    );
  };

  const matchCustomer = (item: any) => {
    if (customerId === "all") return true;

    return (
      getRecordId(item.customer) === customerId ||
      getRecordId(item.customerId) === customerId ||
      getRecordId(item.clientId) === customerId ||
      item.customer?._id === customerId ||
      item.customerId === customerId
    );
  };

  const isWithinDateRange = (dateValue: string) => {
    if (!dateValue) return true;

    const itemDate = new Date(dateValue);

    if (fromDate && itemDate < new Date(fromDate)) return false;

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      if (itemDate > endDate) return false;
    }

    return true;
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [employeeRes, leadRes, customerRes, workRes, branchRes] =
        await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/leads`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          fetch(`${API_URL}/works`, { headers }),
          fetch(`${API_URL}/branches`, { headers }),
        ]);

      const employeeData = await employeeRes.json();
      const leadData = await leadRes.json();
      const customerData = await customerRes.json();
      const workData = await workRes.json();
      const branchData = await branchRes.json();

      setEmployees(normalizeArray(employeeData, "users"));
      setLeads(normalizeArray(leadData, "leads"));
      setCustomers(normalizeArray(customerData, "customers"));
      setWorks(normalizeArray(workData, "works"));
      setBranches(normalizeArray(branchData, "branches"));
    } catch (error) {
      console.log(error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const branchFilteredCustomers = useMemo(() => {
    return customers.filter((customer) => matchBranch(customer));
  }, [customers, branchId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!matchBranch(customer)) return false;
      if (customerId !== "all" && customer._id !== customerId) return false;
      if (!isWithinDateRange(customer.createdAt)) return false;
      return true;
    });
  }, [customers, branchId, customerId, fromDate, toDate]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (branchId === "all") return true;

      return (
        employee.branchId === branchId ||
        employee.branch?._id === branchId ||
        employee.branch?.branchId === branchId
      );
    });
  }, [employees, branchId]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!matchBranch(lead)) return false;
      if (!isWithinDateRange(lead.createdAt)) return false;
      return true;
    });
  }, [leads, branchId, fromDate, toDate]);

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      if (!matchBranch(work)) return false;
      if (!matchCustomer(work)) return false;
      if (!isWithinDateRange(work.createdAt)) return false;
      return true;
    });
  }, [works, branchId, customerId, fromDate, toDate]);

  const wonLeads = filteredLeads.filter(
    (lead) =>
      lead.status === "Own Close" ||
      lead.status === "Won" ||
      lead.status === "Closed"
  );

  const activeWorks = filteredWorks.filter(
    (work) => work.status !== "Completed"
  );

  const completedWorks = filteredWorks.filter(
    (work) => work.status === "Completed"
  );

  const conversionRate =
    filteredLeads.length === 0
      ? 0
      : Math.round((wonLeads.length / filteredLeads.length) * 100);

  const leadStatusDistribution = useMemo(() => {
    const statuses = [
      "New",
      "Interested",
      "Follow Up",
      "Own Close",
      "Won",
      "Lost",
      "Closed",
    ];

    const colors = [
      "#2563eb",
      "#06b6d4",
      "#f59e0b",
      "#22c55e",
      "#16a34a",
      "#ef4444",
      "#7c3aed",
    ];

    return statuses
      .map((status, index) => ({
        name: status,
        value: filteredLeads.filter((l) => l.status === status).length,
        color: colors[index],
      }))
      .filter((item) => item.value > 0);
  }, [filteredLeads]);

  const workStatusDistribution = useMemo(() => {
    const grouped: any = {};

    filteredWorks.forEach((work) => {
      const status = work.status || "Pending";
      grouped[status] = (grouped[status] || 0) + 1;
    });

    return Object.keys(grouped).map((status) => ({
      status,
      count: grouped[status],
    }));
  }, [filteredWorks]);

  const monthlyLeadData = useMemo(() => {
    const grouped: any = {};

    filteredLeads.forEach((lead) => {
      const date = lead.createdAt || lead.updatedAt;
      if (!date) return;

      const month = new Date(date).toLocaleString("en-IN", {
        month: "short",
      });

      grouped[month] = (grouped[month] || 0) + 1;
    });

    return Object.keys(grouped).map((month) => ({
      month,
      leads: grouped[month],
    }));
  }, [filteredLeads]);

  const employeesByDepartment = useMemo(() => {
    const grouped: any = {};

    filteredEmployees.forEach((emp) => {
      const dept = emp.department || emp.role || "Other";
      grouped[dept] = (grouped[dept] || 0) + 1;
    });

    return Object.keys(grouped).map((department) => ({
      department,
      count: grouped[department],
    }));
  }, [filteredEmployees]);

  const employeePerformance = useMemo(() => {
    return filteredEmployees
      .map((emp) => {
        const assignedWorks = filteredWorks.filter(
          (work) =>
            getRecordId(work.assignedTo) === emp._id ||
            work.assignedTo?._id === emp._id
        );

        const completed = assignedWorks.filter(
          (work) => work.status === "Completed"
        ).length;

        return {
          name: emp.name?.split(" ")[0] || "User",
          assigned: assignedWorks.length,
          completed,
          pending: assignedWorks.length - completed,
        };
      })
      .filter((item) => item.assigned > 0);
  }, [filteredEmployees, filteredWorks]);

  const topEmployees = useMemo(() => {
    return [...employeePerformance]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [employeePerformance]);

  const selectedBranchName =
    branchId === "all"
      ? "All Branches"
      : branches.find(
        (branch) => branch.branchId === branchId || branch._id === branchId
      )?.name || branchId;

  const selectedCustomerName =
    customerId === "all"
      ? "All Customers"
      : customers.find((customer) => customer._id === customerId)?.name ||
      customers.find((customer) => customer._id === customerId)
        ?.customerName ||
      customerId;

  const generateReportSummary = useCallback(() => {
    return `
Digitalness CRM Report Summary.
Branch filter ${selectedBranchName}.
Customer filter ${selectedCustomerName}.
Total Employees ${filteredEmployees.length}.
Total Customers ${filteredCustomers.length}.
Total Leads ${filteredLeads.length}.
Won Leads ${wonLeads.length}.
Conversion Rate ${conversionRate} percent.
Total Works ${filteredWorks.length}.
Active Works ${activeWorks.length}.
Completed Works ${completedWorks.length}.
    `;
  }, [
    selectedBranchName,
    selectedCustomerName,
    filteredEmployees,
    filteredCustomers,
    filteredLeads,
    wonLeads,
    conversionRate,
    filteredWorks,
    activeWorks,
    completedWorks,
  ]);

  const speakReport = () => {
    if (!window.speechSynthesis) {
      toast.error("Voice not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(generateReportSummary());
    utterance.lang = "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthRef.current = window.speechSynthesis;
    speechSynthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) speechSynthRef.current.cancel();
    setIsSpeaking(false);
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setBranchId("all");
    setCustomerId("all");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Digitalness CRM Report", 14, 18);

    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 14, 26);
    doc.text(`Branch: ${selectedBranchName}`, 14, 32);
    doc.text(`Customer: ${selectedCustomerName}`, 14, 38);
    doc.text(
      `Date Filter: ${fromDate || "Start"} to ${toDate || "Today"}`,
      14,
      44
    );

    autoTable(doc, {
      startY: 54,
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", filteredEmployees.length],
        ["Total Customers", filteredCustomers.length],
        ["Total Leads", filteredLeads.length],
        ["Won Leads", wonLeads.length],
        ["Conversion Rate", `${conversionRate}%`],
        ["Total Works", filteredWorks.length],
        ["Active Works", activeWorks.length],
        ["Completed Works", completedWorks.length],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [["Lead Status", "Count"]],
      body: leadStatusDistribution.map((item) => [item.name, item.value]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [["Employee", "Assigned Works", "Completed", "Pending"]],
      body: employeePerformance.map((item) => [
        item.name,
        item.assigned,
        item.completed,
        item.pending,
      ]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [["Work Title", "Customer", "Assigned To", "Status"]],
      body: filteredWorks.slice(0, 20).map((work) => [
        work.title || work.workTitle || "-",
        work.customer?.name || work.customerName || "-",
        work.assignedTo?.name || "-",
        work.status || "-",
      ]),
    });

    doc.save(
      `digitalness-crm-report-${new Date().toISOString().slice(0, 10)}.pdf`
    );

    toast.success("Report downloaded successfully");
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Branch-wise, customer-wise and date-wise CRM reports
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant={isSpeaking ? "destructive" : "outline"}
            onClick={isSpeaking ? stopSpeaking : speakReport}
          >
            {isSpeaking ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Voice Report
              </>
            )}
          </Button>

          <Button onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </motion.div>

      <div className="bg-card border rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="flex items-center gap-2 font-medium">
          <Filter className="w-4 h-4 text-primary" />
          Filters
        </div>

        <div>
          <Label>From Date</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <Label>To Date</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Branch</Label>
          <Select
            value={branchId}
            onValueChange={(value) => {
              setBranchId(value);
              setCustomerId("all");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>

              {branches.map((branch) => (
                <SelectItem
                  key={branch._id || branch.branchId}
                  value={branch.branchId || branch._id}
                >
                  {branch.name || branch.city || branch.branchId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>

              {branchFilteredCustomers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.name ||
                    customer.customerName ||
                    customer.companyName ||
                    customer.phone ||
                    "Unnamed Customer"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-muted/40 border rounded-xl p-4 text-sm text-muted-foreground">
        Showing report for <b>{selectedBranchName}</b> and{" "}
        <b>{selectedCustomerName}</b>
        {fromDate || toDate ? (
          <>
            {" "}
            from <b>{fromDate || "Start"}</b> to <b>{toDate || "Today"}</b>
          </>
        ) : (
          " for all dates"
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Employees"
          value={filteredEmployees.length}
        />

        <ReportCard
          icon={<Target className="w-5 h-5 text-orange-500" />}
          label="Leads"
          value={filteredLeads.length}
        />

        <ReportCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Conversion"
          value={`${conversionRate}%`}
        />

        <ReportCard
          icon={<Briefcase className="w-5 h-5 text-cyan-500" />}
          label="Active Works"
          value={activeWorks.length}
        />

        <ReportCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          label="Completed Works"
          value={completedWorks.length}
        />

        <ReportCard
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          label="Pending Works"
          value={activeWorks.length}
        />

        <ReportCard
          icon={<Users className="w-5 h-5 text-purple-500" />}
          label="Customers"
          value={filteredCustomers.length}
        />

        <ReportCard
          icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
          label="Total Works"
          value={filteredWorks.length}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Monthly Lead Growth">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyLeadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="leads" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {leadStatusDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Work Status Report">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Employee Performance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEmployees}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" name="Assigned" />
              <Bar dataKey="completed" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Employees by Department">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeesByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">Recent Work Report</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Work</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Assigned</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredWorks.slice(0, 8).map((work, index) => (
                  <tr key={work._id || index} className="border-b">
                    <td className="py-3 pr-4">
                      {work.title || work.workTitle || "-"}
                    </td>

                    <td className="py-3 pr-4">
                      {work.customer?.name ||
                        work.customer?.customerName ||
                        work.customerName ||
                        "-"}
                    </td>

                    <td className="py-3 pr-4">
                      {work.assignedTo?.name || "-"}
                    </td>

                    <td className="py-3 pr-4">{work.status || "-"}</td>
                  </tr>
                ))}

                {filteredWorks.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No work reports found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-5 bg-card border rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>

      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}