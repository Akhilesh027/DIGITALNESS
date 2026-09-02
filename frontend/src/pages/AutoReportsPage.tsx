import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  FileText,
  Calendar,
  Loader2,
  Users,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  Clock,
  Briefcase,
  UserCheck,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

interface Customer {
  _id: string;
  name: string;
  businessType: string;
  city?: string;
  branchId?: string;
  status?: string;
  createdAt?: string;
}

interface Work {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  workType?: string;
  dueDate?: string;
  assignedTo?: any;
  customer?: any;
  customerId?: string;
  parentWorkId?: any;
  description?: string;
  slaDays?: number;
  timeSpent?: number;
  progressNote?: string;
  updates?: any[];
  createdAt?: string;
}

export default function AutoReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const month = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const getArrayData = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.customers)) return data.customers;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [customerRes, taskRes] = await Promise.all([
        fetch(`${API_URL}/customers`, { headers }),
        fetch(`${API_URL}/works`, { headers }),
      ]);

      const customerData = await customerRes.json();
      const taskData = await taskRes.json();

      setCustomers(getArrayData(customerData));
      setTasks(getArrayData(taskData));
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const getCustomerTasks = (customerId: string) => {
    return tasks.filter((task) => {
      const taskCustomerId = task.customer?._id || task.customer || task.customerId;
      return String(taskCustomerId) === String(customerId);
    });
  };

  const getAssignedNames = (assignedTo: any) => {
    if (!assignedTo) return "Unassigned";

    if (Array.isArray(assignedTo)) {
      return assignedTo
        .map((user) => {
          if (typeof user === "object") {
            return user.name || user.fullName || user.username || user.email || "Employee";
          }
          return "Employee";
        })
        .join(", ");
    }

    if (typeof assignedTo === "object") {
      return (
        assignedTo.name ||
        assignedTo.fullName ||
        assignedTo.username ||
        assignedTo.email ||
        "Employee"
      );
    }

    return "Employee";
  };

  const getParentWorkTitle = (task: Work) => {
    if (!task.parentWorkId) return "Main Work";
    if (typeof task.parentWorkId === "object") return task.parentWorkId.title || "Parent Work";
    return "Parent Work";
  };

  const getCustomerName = (task: Work) => {
    return task.customer?.name || task.customer?.companyName || "Client";
  };

  const isOverdue = (task: Work) => {
    if (!task.dueDate || task.status === "Completed") return false;

    const today = new Date();
    const due = new Date(task.dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today;
  };

  const daysLeft = (task: Work) => {
    if (!task.dueDate) return "-";

    const today = new Date();
    const due = new Date(task.dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return "Due today";
    return `${diff} days left`;
  };

  const reportStats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const review = tasks.filter((task) => task.status === "Review").length;
    const inProgress = tasks.filter((task) => task.status === "In Progress").length;
    const pending = tasks.filter((task) => task.status !== "Completed").length;
    const overdue = tasks.filter(isOverdue).length;
    const mainWorks = tasks.filter((task) => !task.parentWorkId).length;
    const childTasks = tasks.filter((task) => task.parentWorkId).length;
    const totalHours = tasks.reduce((sum, task) => sum + Number(task.timeSpent || 0), 0);

    return {
      completed,
      review,
      inProgress,
      pending,
      overdue,
      mainWorks,
      childTasks,
      totalHours,
    };
  }, [tasks]);

  const downloadClient = (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId);
    if (!customer) return;

    const customerTasks = getCustomerTasks(customerId);
    const completedTasks = customerTasks.filter((task) => task.status === "Completed").length;
    const pendingTasks = customerTasks.filter((task) => task.status !== "Completed").length;
    const overdueTasks = customerTasks.filter(isOverdue).length;
    const totalHours = customerTasks.reduce((sum, task) => sum + Number(task.timeSpent || 0), 0);

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("DIGITALNESS CRM", 14, 20);

    doc.setFontSize(14);
    doc.text(`Client Monthly Report - ${month}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Client Name", customer.name],
        ["Business Type", customer.businessType || "-"],
        ["City", customer.city || "-"],
        ["Branch", customer.branchId || "-"],
        ["Status", customer.status || "Active"],
        ["Total Works / Tasks", String(customerTasks.length)],
        ["Completed", String(completedTasks)],
        ["Pending", String(pendingTasks)],
        ["Overdue", String(overdueTasks)],
        ["Total Time Spent", `${totalHours} hours`],
      ],
    });

    if (customerTasks.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [
          [
            "Work / Task",
            "Parent Work",
            "Type",
            "Assigned",
            "Status",
            "Priority",
            "SLA",
            "Due Date",
            "Time",
            "Progress Note",
          ],
        ],
        body: customerTasks.map((task) => [
          task.title || "-",
          getParentWorkTitle(task),
          task.workType || "-",
          getAssignedNames(task.assignedTo),
          task.status || "-",
          task.priority || "-",
          task.slaDays ? `${task.slaDays} days` : "-",
          task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "-",
          `${task.timeSpent || 0}h`,
          task.progressNote || task.description || "-",
        ]),
        styles: {
          fontSize: 8,
        },
      });
    }

    doc.save(`${customer.name.replace(/\s+/g, "_")}_${month.replace(" ", "_")}_Report.pdf`);
    toast.success("Client report downloaded");
  };

  const downloadAgency = () => {
    const doc = new jsPDF();

    doc.setFontSize(24);
    doc.text("DIGITALNESS CRM", 14, 20);

    doc.setFontSize(16);
    doc.text(`Agency Monthly Work Report - ${month}`, 14, 32);

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Total Clients", String(customers.length)],
        ["Total Main Works", String(reportStats.mainWorks)],
        ["Total Child Tasks", String(reportStats.childTasks)],
        ["Total Works / Tasks", String(tasks.length)],
        ["Completed", String(reportStats.completed)],
        ["In Progress", String(reportStats.inProgress)],
        ["Review", String(reportStats.review)],
        ["Pending", String(reportStats.pending)],
        ["Overdue", String(reportStats.overdue)],
        ["Total Time Spent", `${reportStats.totalHours} hours`],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [
        [
          "Client",
          "Work / Task",
          "Parent Work",
          "Assigned",
          "Type",
          "Status",
          "Priority",
          "Due Date",
          "Time",
        ],
      ],
      body: tasks.map((task) => [
        getCustomerName(task),
        task.title || "-",
        getParentWorkTitle(task),
        getAssignedNames(task.assignedTo),
        task.workType || "-",
        task.status || "-",
        task.priority || "-",
        task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "-",
        `${task.timeSpent || 0}h`,
      ]),
      styles: {
        fontSize: 8,
      },
    });

    doc.save(`Digitalness_Agency_${month.replace(" ", "_")}_Report.pdf`);
    toast.success("Agency report downloaded");
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
    .slice(0, 8);

  const overdueTasks = tasks.filter(isOverdue).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-heading font-bold">Automated Reports</h1>
        <p className="text-muted-foreground">
          Monthly client, work, task, employee and deadline performance reports
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <h2 className="text-2xl font-bold">{customers.length}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Works / Tasks</p>
                <h2 className="text-2xl font-bold">{tasks.length}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h2 className="text-2xl font-bold">{reportStats.completed}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <h2 className="text-2xl font-bold">{reportStats.overdue}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Briefcase className="w-9 h-9 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Main Works</p>
                <h2 className="text-xl font-bold">{reportStats.mainWorks}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="w-9 h-9 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Child Tasks</p>
                <h2 className="text-xl font-bold">{reportStats.childTasks}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <UserCheck className="w-9 h-9 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Review</p>
                <h2 className="text-xl font-bold">{reportStats.review}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Clock className="w-9 h-9 text-pink-500" />
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <h2 className="text-xl font-bold">{reportStats.totalHours}h</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report Period: {month}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Button onClick={downloadAgency} size="lg">
            <FileDown className="w-4 h-4 mr-2" />
            Download Full Agency Report
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Works / Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No overdue tasks</p>
            )}

            {overdueTasks.map((task) => (
              <div key={task._id} className="p-4 border rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCustomerName(task)} • {getAssignedNames(task.assignedTo)}
                    </p>
                  </div>
                  <Badge variant="destructive">{daysLeft(task)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Works / Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task._id} className="p-4 border rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getCustomerName(task)} • {getParentWorkTitle(task)}
                    </p>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per Client Reports</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {customers.map((customer) => {
            const customerTasks = getCustomerTasks(customer._id);
            const completed = customerTasks.filter((task) => task.status === "Completed").length;
            const overdue = customerTasks.filter(isOverdue).length;
            const totalHours = customerTasks.reduce(
              (sum, task) => sum + Number(task.timeSpent || 0),
              0
            );

            return (
              <div
                key={customer._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-xl"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />

                    <p className="font-medium">{customer.name}</p>

                    <Badge variant="outline">
                      {completed}/{customerTasks.length} completed
                    </Badge>

                    {overdue > 0 && (
                      <Badge variant="destructive">{overdue} overdue</Badge>
                    )}

                    <Badge variant="secondary">{totalHours}h spent</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {customer.businessType || "-"} • {customer.city || "-"} • Branch:{" "}
                    {customer.branchId || "-"}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadClient(customer._id)}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Client PDF
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}