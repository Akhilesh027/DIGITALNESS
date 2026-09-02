import { useEffect, useMemo, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardList,
  LifeBuoy,
  PhoneCall,
  AlertTriangle,
  Timer,
  Download,
  FileText,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Tooltip,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Employee {
  _id: string;
  name?: string;
  fullName?: string;
  username?: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  status: string;
  branchId: string | { _id: string; name: string };
}

interface Work {
  _id: string;
  title: string;
  workType?: string;
  module?: string;
  customer?: { _id: string; name?: string; companyName?: string };
  parentWorkId?: { _id: string; title?: string } | string | null;
  status: string;
  priority?: string;
  assignedTo: any;
  dueDate?: string;
  slaDays?: number;
  timeSpent?: number;
  updates?: any[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Lead {
  _id: string;
  name?: string;
  status: string;
  assignedTo: any;
  callLogs?: any[];
}

interface Ticket {
  _id: string;
  status: string;
  assignedTo: any;
}

function getArrayData(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.works)) return data.works;
  if (Array.isArray(data?.leads)) return data.leads;
  if (Array.isArray(data?.tickets)) return data.tickets;
  return [];
}

function getEmployeeName(emp?: Employee) {
  return emp?.name || emp?.fullName || emp?.username || emp?.email || "Employee";
}

function getBranchDisplay(branch: Employee["branchId"]) {
  if (!branch) return "—";
  if (typeof branch === "string") return branch;
  return branch.name || branch._id;
}

function assignedIncludesUser(assignedTo: any, userId: string) {
  if (!assignedTo || !userId) return false;

  const list = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

  return list.some((item) => {
    if (!item) return false;
    if (typeof item === "string") return String(item) === String(userId);
    return String(item._id || item.id) === String(userId);
  });
}

function getClientName(work: Work) {
  return work.customer?.name || work.customer?.companyName || "Digitalness CRM";
}

function isCompleted(status?: string) {
  return String(status || "").toLowerCase() === "completed";
}

function isReview(status?: string) {
  return String(status || "").toLowerCase() === "review";
}

function isInProgress(status?: string) {
  return String(status || "").toLowerCase() === "in progress";
}

function isOverdue(work: Work) {
  if (!work.dueDate || isCompleted(work.status)) return false;

  const today = new Date();
  const due = new Date(work.dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function formatDate(date?: string | Date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date?: string | Date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeReportPage() {
  const { toast } = useToast();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchData = async () => {
    if (!token) {
      toast({
        title: "Auth Error",
        description: "No token found. Please login again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersRes, worksRes, leadsRes, ticketsRes] = await Promise.allSettled([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/works`, { headers }),
        fetch(`${API_URL}/leads`, { headers }),
        fetch(`${API_URL}/tickets`, { headers }),
      ]);

      const usersData =
        usersRes.status === "fulfilled" && usersRes.value.ok
          ? await usersRes.value.json()
          : [];

      const worksData =
        worksRes.status === "fulfilled" && worksRes.value.ok
          ? await worksRes.value.json()
          : [];

      const leadsData =
        leadsRes.status === "fulfilled" && leadsRes.value.ok
          ? await leadsRes.value.json()
          : [];

      const ticketsData =
        ticketsRes.status === "fulfilled" && ticketsRes.value.ok
          ? await ticketsRes.value.json()
          : [];

      const employeeList = getArrayData(usersData);

      setEmployees(employeeList);
      setWorks(getArrayData(worksData));
      setLeads(getArrayData(leadsData));
      setTickets(getArrayData(ticketsData));

      if (employeeList.length && !selectedEmpId) {
        setSelectedEmpId(employeeList[0]._id);
      }
    } catch (error: any) {
      toast({
        title: "Data Fetch Failed",
        description: error.message || "Unable to load employee report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employee = useMemo(
    () => employees.find((emp) => emp._id === selectedEmpId),
    [employees, selectedEmpId]
  );

  const employeeWorks = useMemo(
    () => works.filter((work) => assignedIncludesUser(work.assignedTo, selectedEmpId)),
    [works, selectedEmpId]
  );

  const employeeLeads = useMemo(
    () => leads.filter((lead) => assignedIncludesUser(lead.assignedTo, selectedEmpId)),
    [leads, selectedEmpId]
  );

  const employeeTickets = useMemo(
    () => tickets.filter((ticket) => assignedIncludesUser(ticket.assignedTo, selectedEmpId)),
    [tickets, selectedEmpId]
  );

  const completedWorks = employeeWorks.filter((work) => isCompleted(work.status)).length;
  const reviewWorks = employeeWorks.filter((work) => isReview(work.status)).length;
  const inProgressWorks = employeeWorks.filter((work) => isInProgress(work.status)).length;
  const pendingWorks = employeeWorks.filter((work) => !isCompleted(work.status)).length;
  const overdueWorks = employeeWorks.filter(isOverdue).length;

  const totalCalls = employeeLeads.reduce(
    (sum, lead) => sum + (lead.callLogs?.length || 0),
    0
  );

  const totalTimeSpent = employeeWorks.reduce(
    (sum, work) => sum + Number(work.timeSpent || 0),
    0
  );

  const wonLeads = employeeLeads.filter(
    (lead) => lead.status === "Own Close" || lead.status === "Won"
  ).length;

  const conversionRate = employeeLeads.length
    ? Math.round((wonLeads / employeeLeads.length) * 100)
    : 0;

  const productivity = employeeWorks.length
    ? Math.round((completedWorks / employeeWorks.length) * 100)
    : 0;

  const openTickets = employeeTickets.filter(
    (ticket) => ticket.status !== "Closed"
  ).length;

  const analyticsChart = [
    { name: "Completed", value: completedWorks },
    { name: "Review", value: reviewWorks },
    { name: "Pending", value: pendingWorks },
    { name: "Overdue", value: overdueWorks },
  ];

  const timelineData = employeeWorks.slice(0, 6).map((work, index) => ({
    time: work.updatedAt || work.createdAt ? formatTime(work.updatedAt || work.createdAt) : `${9 + index}:30 AM`,
    activity: `${work.title} - ${work.status}`,
  }));

  const workUpdates = employeeWorks
    .flatMap((work) => {
      if (Array.isArray(work.updates) && work.updates.length > 0) {
        return work.updates.map((update) => update.message || update.note || update.description);
      }
      return work.description ? [work.description] : [];
    })
    .filter(Boolean)
    .slice(0, 5);

  const generatePDF = async () => {
    if (!employee) return;

    try {
      setDownloading(true);

      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 16;

      const addFooter = (page: number) => {
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text("Generated from Digitalness CRM", margin, 285);
        doc.text("Confidential Internal Productivity Report", pageWidth / 2, 285, {
          align: "center",
        });
        doc.text(`Page ${page}`, pageWidth - margin, 285, { align: "right" });
      };

      const sectionTitle = (title: string) => {
        y += 6;
        doc.setFontSize(13);
        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 5;
      };

      const drawRow = (label: string, value: string, x: number, rowY: number) => {
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.setFont("helvetica", "normal");
        doc.text(label, x, rowY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(25);
        doc.text(value || "-", x + 34, rowY);
      };

      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, 34, "F");

      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Employee Daily Work Update Report", margin, 15);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Digitalness CRM – Professional Productivity Report", margin, 23);

      y = 44;

      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, y - 6, pageWidth - margin * 2, 32, 3, 3, "F");

      drawRow("Employee Name", getEmployeeName(employee), margin + 4, y);
      drawRow("Designation", employee.designation || employee.role || "-", margin + 104, y);

      drawRow("Project", "Digitalness CRM", margin + 4, y + 9);
      drawRow("Company", "Digitalness", margin + 104, y + 9);

      drawRow("Report Date", formatDate(), margin + 4, y + 18);
      drawRow("Branch", getBranchDisplay(employee.branchId), margin + 104, y + 18);

      y += 34;

      sectionTitle("1. Daily Performance Summary");

      const summary = [
        ["Tasks Assigned", String(employeeWorks.length)],
        ["Tasks Completed", String(completedWorks)],
        ["Pending Tasks", String(pendingWorks)],
        ["Tasks in Review", String(reviewWorks)],
        ["Working Hours", `${totalTimeSpent || 0}h`],
        ["Productivity", `${productivity}%`],
      ];

      summary.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * 90;
        const rowY = y + row * 9;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, rowY - 5, 82, 7, 2, 2, "F");
        drawRow(item[0], item[1], x + 2, rowY);
      });

      y += 30;

      sectionTitle("2. Work Activity Timeline");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Time", margin, y);
      doc.text("Activity", margin + 38, y);
      y += 6;

      if (timelineData.length) {
        timelineData.forEach((item) => {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50);
          doc.text(item.time, margin, y);
          doc.text(doc.splitTextToSize(item.activity, 135), margin + 38, y);
          y += 8;
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.text("No timeline activity available.", margin, y);
        y += 8;
      }

      sectionTitle("3. Tasks Worked On");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Task", margin, y);
      doc.text("Module", margin + 64, y);
      doc.text("Priority", margin + 104, y);
      doc.text("Status", margin + 130, y);
      doc.text("Hours", margin + 164, y);
      y += 5;

      employeeWorks.slice(0, 7).forEach((work) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40);
        doc.text(doc.splitTextToSize(work.title || "-", 55), margin, y);
        doc.text(work.module || work.workType || getClientName(work), margin + 64, y);
        doc.text(work.priority || "Medium", margin + 104, y);
        doc.text(work.status || "-", margin + 130, y);
        doc.text(`${work.timeSpent || 0}h`, margin + 164, y);
        y += 8;
      });

      addFooter(1);
      doc.addPage();
      y = 18;

      sectionTitle("4. Work Updates");

      const updates =
        workUpdates.length > 0
          ? workUpdates
          : [
            "Updated assigned work progress in Digitalness CRM.",
            "Reviewed task status and completed daily productivity tracking.",
            "Maintained work updates for manager review.",
          ];

      updates.forEach((update) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40);
        doc.text(`• ${doc.splitTextToSize(update, 168)}`, margin, y);
        y += 8;
      });

      sectionTitle("5. Productivity Analytics");

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Completed: ${completedWorks}`, margin, y);
      doc.text(`Review: ${reviewWorks}`, margin + 50, y);
      doc.text(`Pending: ${pendingWorks}`, margin + 90, y);
      doc.text(`Overdue: ${overdueWorks}`, margin + 135, y);
      y += 14;

      const maxValue = Math.max(completedWorks, reviewWorks, pendingWorks, overdueWorks, 1);
      analyticsChart.forEach((item) => {
        const barWidth = (item.value / maxValue) * 120;

        doc.setFontSize(8);
        doc.text(item.name, margin, y);
        doc.setFillColor(229, 231, 235);
        doc.rect(margin + 35, y - 4, 120, 5, "F");
        doc.setFillColor(17, 24, 39);
        doc.rect(margin + 35, y - 4, barWidth, 5, "F");
        doc.text(String(item.value), margin + 160, y);
        y += 10;
      });

      sectionTitle("6. Manager Remarks");

      const remarks = `${getEmployeeName(
        employee
      )} has shown good progress in assigned CRM work. Completed tasks, review items, pending work, productivity and overall performance have been recorded for manager review.`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40);
      doc.text(doc.splitTextToSize(remarks, 175), margin, y);
      y += 24;

      sectionTitle("7. Employee Self Notes");

      const notes =
        "Today's work updates were tracked through Digitalness CRM. Assigned tasks, progress status, productivity and reporting data were reviewed for internal performance monitoring.";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(notes, 175), margin, y);
      y += 28;

      sectionTitle("8. Approval");

      doc.setFontSize(9);
      doc.text("Employee Signature: ____________________", margin, y);
      doc.text("Manager Approval: ____________________", margin + 95, y);
      y += 10;
      doc.text("Approval Status: Pending Review", margin, y);

      addFooter(2);

      doc.save(`${getEmployeeName(employee)}-Daily-Work-Report.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Employee work report downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "PDF Download Failed",
        description:
          "Please install jspdf: npm install jspdf",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading employee report...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No employee found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Employee Daily Work Update Report
          </h1>
          <p className="text-muted-foreground">
            Digitalness CRM – Professional Productivity Report
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-[320px]">
            <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {getEmployeeName(emp)} ({emp.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generatePDF} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Generating..." : "Download Report"}
          </Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Employee Name</p>
              <h2 className="text-2xl font-bold">{getEmployeeName(employee)}</h2>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>

            <InfoItem label="Designation" value={employee.designation || employee.role} />
            <InfoItem label="Project" value="Digitalness CRM" />
            <InfoItem label="Company" value="Digitalness" />
            <InfoItem label="Report Date" value={formatDate()} />
            <InfoItem label="Branch" value={getBranchDisplay(employee.branchId)} />

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{employee.status || "Active"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Section title="1. Daily Performance Summary">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Tasks Assigned" value={employeeWorks.length} icon={<ClipboardList />} />
          <StatCard title="Tasks Completed" value={completedWorks} icon={<CheckCircle />} />
          <StatCard title="Pending Tasks" value={pendingWorks} icon={<Clock />} />
          <StatCard title="Tasks in Review" value={reviewWorks} icon={<TrendingUp />} />
          <StatCard title="Working Hours" value={`${totalTimeSpent || 0}h`} icon={<Timer />} />
          <StatCard title="Productivity" value={`${productivity}%`} icon={<Target />} />
        </div>
      </Section>

      <Section title="2. Work Activity Timeline">
        <div className="space-y-3">
          {timelineData.length > 0 ? (
            timelineData.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl border bg-card">
                <div className="min-w-[90px] font-semibold text-primary">{item.time}</div>
                <div className="text-sm">{item.activity}</div>
              </div>
            ))
          ) : (
            <EmptyText text="No timeline activity available." />
          )}
        </div>
      </Section>

      <Section title="3. Tasks Worked On">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Module</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeeWorks.length > 0 ? (
                employeeWorks.map((work) => (
                  <tr key={work._id} className="border-t">
                    <td className="p-3 font-medium">{work.title}</td>
                    <td className="p-3">{work.module || work.workType || getClientName(work)}</td>
                    <td className="p-3">
                      <Badge variant="outline">{work.priority || "Medium"}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge>{work.status}</Badge>
                    </td>
                    <td className="p-3">{work.timeSpent || 0}h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No tasks assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Work Updates">
        <ul className="space-y-3">
          {(workUpdates.length > 0
            ? workUpdates
            : [
              "Updated assigned work progress in Digitalness CRM.",
              "Reviewed task status and completed daily productivity tracking.",
              "Maintained work updates for manager review.",
            ]
          ).map((update, index) => (
            <li key={index} className="p-4 rounded-xl border bg-card text-sm">
              • {update}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="5. Productivity Analytics">
        <Card>
          <CardContent className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#111827" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="6. Manager Remarks">
        <Card>
          <CardContent className="p-6 text-sm leading-7">
            {getEmployeeName(employee)} has shown good progress in assigned CRM work.
            Completed tasks, review items, pending work, productivity and overall
            performance have been recorded for manager review.
          </CardContent>
        </Card>
      </Section>

      <Section title="7. Employee Self Notes">
        <Card>
          <CardContent className="p-6 text-sm leading-7">
            Today's work updates were tracked through Digitalness CRM. Assigned tasks,
            progress status, productivity and reporting data were reviewed for internal
            performance monitoring.
          </CardContent>
        </Card>
      </Section>

      <Section title="8. Additional CRM Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Leads Assigned" value={employeeLeads.length} icon={<Target />} />
          <StatCard title="Calls Logged" value={totalCalls} icon={<PhoneCall />} />
          <StatCard title="Conversion" value={`${conversionRate}%`} icon={<TrendingUp />} />
          <StatCard title="Open Tickets" value={openTickets} icon={<LifeBuoy />} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-muted-foreground border rounded-xl">
      {text}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 text-primary">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}