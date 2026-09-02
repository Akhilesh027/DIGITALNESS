import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Timer,
  Send,
  RotateCcw,
  Loader2,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type TaskStatus =
  | "Pending"
  | "Not Started"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Revision"
  | "Failed";

const STATUSES: TaskStatus[] = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Completed",
  "Revision",
  "Failed",
];

const POSITIONS = [
  "Operational Manager",
  "Digital Marketer",
  "Performance Marketer",
  "Content Writer",
  "Graphic Designer",
  "UI/UX Designer",
  "Frontend Developer",
  "Backend Developer",
  "BDE",
  "Support & Voice Process",
];

const PRIORITIES = ["High", "Medium", "Low"];

const statusVariant: Record<string, string> = {
  Pending: "secondary",
  "Not Started": "secondary",
  "In Progress": "inProgress",
  Review: "info",
  Completed: "completed",
  Revision: "warning",
  Failed: "destructive",
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getArrayData = (res: any) => {
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.data.users)) return res.data.users;
  if (Array.isArray(res.data.customers)) return res.data.customers;
  if (Array.isArray(res.data.works)) return res.data.works;
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

const daysToDeadline = (deadline?: string) => {
  if (!deadline) return 0;

  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isOverdue = (task: any) => {
  if (!task.dueDate) return false;
  if (task.status === "Completed") return false;
  return daysToDeadline(task.dueDate) < 0;
};

const Spinner = ({ className = "w-4 h-4 mr-2" }: { className?: string }) => (
  <Loader2 className={`${className} animate-spin`} />
);

const TableSkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        {Array.from({ length: 8 }).map((__, cellIndex) => (
          <td key={cellIndex} className="p-3">
            <div className="h-4 w-full rounded bg-muted" />
            {cellIndex === 0 && <div className="mt-2 h-3 w-2/3 rounded bg-muted" />}
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default function TasksPage() {
  const currentUser = getCurrentUser();

  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<"Completed" | "Revision" | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");

  const [selected, setSelected] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [updMsg, setUpdMsg] = useState("");
  const [updFiles, setUpdFiles] = useState("");
  const [updTime, setUpdTime] = useState<number>(1);
  const [reviewNote, setReviewNote] = useState("");

  const [form, setForm] = useState({
    title: "",
    parentWorkId: "",
    customerId: "",
    serviceType: "",
    assignedTo: "",
    assignedPosition: "",
    priority: "Medium",
    deadline: "",
    notes: "",
    slaDays: 2,
  });

  const role = currentUser?.role;
  const isAdminOrManager =
    role === "Admin" ||
    role === "admin" ||
    role === "Manager" ||
    role === "Operational Manager";

  const isEmployee = !isAdminOrManager;

  const formatAssignedUser = (assignedTo: any) => {
    if (!assignedTo) return null;

    if (typeof assignedTo === "string") {
      const user = employees.find(
        (emp: any) => emp._id === assignedTo || emp.id === assignedTo
      );

      return {
        id: assignedTo,
        name: user?.name || user?.fullName || user?.email || "Unassigned",
        role: user?.role || user?.department || "Employee",
      };
    }

    return {
      id: assignedTo._id || assignedTo.id,
      name:
        assignedTo.name ||
        assignedTo.fullName ||
        assignedTo.username ||
        assignedTo.email ||
        "Unassigned",
      role: assignedTo.role || assignedTo.department || "Employee",
    };
  };

  const formatWork = (work: any) => {
    const assignedUser = Array.isArray(work.assignedTo)
      ? formatAssignedUser(work.assignedTo[0])
      : formatAssignedUser(work.assignedTo);

    return {
      id: work._id || work.id,
      title: work.title || "",
      parentWorkId:
        work.parentWorkId?._id || work.parentWorkId || work.parentTaskId || "",
      parentWorkTitle:
        work.parentWorkId?.title || work.parentWorkTitle || work.parentTitle || "",
      customerId: work.customer?._id || work.customer || work.customerId,
      customerName:
        work.customer?.name ||
        work.customer?.customerName ||
        work.customer?.clientName ||
        work.customer?.companyName ||
        "—",
      serviceType: work.workType || work.type || "",
      assignedTo: assignedUser?.id || "",
      assignedName: assignedUser?.name || "Unassigned",
      assignedPosition: assignedUser?.role || "Employee",
      priority: work.priority || "Medium",
      deadline: work.dueDate || work.deadline,
      dueDate: work.dueDate || work.deadline,
      status: work.status || "Pending",
      progressNote: work.progressNote || "",
      attachments: work.attachments || [],
      timeSpent: work.timeSpent || 0,
      managerReviewNote: work.managerReviewNote || "",
      notes: work.description || work.notes || "",
      slaDays: work.slaDays || 2,
      createdAt: work.createdAt,
      updates: work.updates || [],
      raw: work,
    };
  };

  const fetchCustomersAndUsers = async () => {
    try {
      const [customerRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/customers`, getAuthConfig()),
        axios.get(`${API_URL}/users`, getAuthConfig()),
      ]);

      setCustomers(getArrayData(customerRes));
      setEmployees(getArrayData(userRes));
    } catch {
      toast.error("Failed to fetch customers and users");
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/works`, getAuthConfig());
      const data = getArrayData(res);
      setTasks(data.map(formatWork));
    } catch {
      toast.error("Failed to fetch works");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCustomersAndUsers();
      await fetchWorks();
    };

    loadData();
  }, []);

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (isEmployee) {
        const userId = currentUser?._id || currentUser?.id;
        const userPosition = currentUser?.position || currentUser?.employeePosition;

        if (t.assignedTo !== userId && t.assignedPosition !== userPosition) {
          return false;
        }
      }

      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
      if (positionFilter !== "All" && t.assignedPosition !== positionFilter)
        return false;

      if (search) {
        const q = search.toLowerCase();

        return (
          t.title.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.serviceType.toLowerCase().includes(q) ||
          t.assignedName.toLowerCase().includes(q) ||
          t.assignedPosition.toLowerCase().includes(q) ||
          t.parentWorkTitle.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    positionFilter,
    isEmployee,
    currentUser,
  ]);

  const stats = {
    pending: visible.filter((t) => t.status === "Pending").length,
    ongoing: visible.filter((t) => t.status === "In Progress").length,
    review: visible.filter((t) => t.status === "Review").length,
    completed: visible.filter((t) => t.status === "Completed").length,
  };

  const empName = (id?: string, fallback?: string) => {
    if (!id) return fallback || "Unassigned";

    const emp = employees.find((e: any) => e._id === id || e.id === id);

    return (
      emp?.name ||
      emp?.fullName ||
      emp?.username ||
      emp?.email ||
      fallback ||
      "Unassigned"
    );
  };

  const custName = (id?: string, fallback?: string) => {
    if (!id) return fallback || "—";

    const cust = customers.find((c: any) => c._id === id || c.id === id);

    return (
      cust?.name ||
      cust?.customerName ||
      cust?.clientName ||
      cust?.companyName ||
      fallback ||
      "—"
    );
  };

  const suggestedEmployees = employees.filter((emp: any) => {
    if (!form.assignedPosition) return true;

    return (
      emp.position === form.assignedPosition ||
      emp.employeePosition === form.assignedPosition ||
      emp.role === form.assignedPosition ||
      emp.department === form.assignedPosition
    );
  });

  const resetForm = () => {
    setForm({
      title: "",
      parentWorkId: "",
      customerId: "",
      serviceType: "",
      assignedTo: "",
      assignedPosition: "",
      priority: "Medium",
      deadline: "",
      notes: "",
      slaDays: 2,
    });
  };

  const handleParentWorkChange = (workId: string) => {
    const parentWork = tasks.find((t) => t.id === workId);

    setForm({
      ...form,
      parentWorkId: workId,
      customerId: parentWork?.customerId || form.customerId,
      serviceType: parentWork?.serviceType || form.serviceType,
      assignedTo: parentWork?.assignedTo || "",
      assignedPosition: parentWork?.assignedPosition || "",
      priority: parentWork?.priority || form.priority,
      deadline: parentWork?.deadline || form.deadline,
    });
  };

  const handleCreateTask = async () => {
    if (!form.title || !form.customerId || !form.serviceType || !form.assignedTo) {
      toast.error("Title, customer, service type and employee are required");
      return;
    }

    try {
      setCreateLoading(true);

      const payload = {
        title: form.title,
        parentWorkId: form.parentWorkId || null,
        workType: form.serviceType,
        customer: form.customerId,
        assignedTo: form.assignedTo,
        priority: form.priority,
        dueDate: form.deadline,
        description: form.notes,
        status: "Pending",
        slaDays: Number(form.slaDays) || 2,
      };

      await axios.post(`${API_URL}/works`, payload, getAuthConfig());

      toast.success(
        form.parentWorkId
          ? "Task created under existing work"
          : "Task created successfully"
      );

      setCreateOpen(false);
      resetForm();
      fetchWorks();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!selected || !updMsg.trim()) {
      toast.error("Add a message to log work");
      return;
    }

    try {
      setUpdateLoading(true);

      const files = updFiles
        ? updFiles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : [];

      const payload = {
        message: updMsg,
        files,
        timeSpent: Number(updTime) || 0,
      };

      const res = await axios.post(
        `${API_URL}/works/${selected.id}/update`,
        payload,
        getAuthConfig()
      );

      const updatedTask = formatWork(res.data.data);

      setTasks((prev) =>
        prev.map((task) => (task.id === selected.id ? updatedTask : task))
      );

      setSelected(updatedTask);
      setUpdMsg("");
      setUpdFiles("");
      setUpdTime(1);

      toast.success("Work update saved");
    } catch {
      toast.error("Failed to save work update");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStatus = async (status: TaskStatus) => {
    if (!selected) return;

    if (isEmployee && status !== "Review" && status !== "In Progress") {
      toast.error("Employees can only start work or submit for review");
      return;
    }

    try {
      setStatusLoading(status);

      await axios.put(
        `${API_URL}/works/${selected.id}/status`,
        { status },
        getAuthConfig()
      );

      const updated = { ...selected, status };

      setTasks((prev) =>
        prev.map((task) => (task.id === selected.id ? updated : task))
      );

      setSelected(updated);
      toast.success(`Status changed to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(null);
    }
  };

  const handleManagerReview = async (status: "Completed" | "Revision") => {
    if (!selected) return;

    try {
      setReviewLoading(status);

      await axios.put(
        `${API_URL}/works/${selected.id}/status`,
        { status },
        getAuthConfig()
      );

      const updated = {
        ...selected,
        status,
        managerReviewNote: reviewNote,
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === selected.id ? updated : task))
      );

      setSelected(updated);
      setReviewNote("");

      toast.success(status === "Completed" ? "Task approved" : "Revision requested");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setReviewLoading(null);
    }
  };

  const handleAssignTask = async (employeeId: string) => {
    if (!selected) return;

    const employee = employees.find((e: any) => (e._id || e.id) === employeeId);
    if (!employee) {
      toast.error("Employee not found");
      return;
    }

    try {
      setAssignLoading(true);

      const payload = {
        assignedTo: employeeId,
        assignedPosition:
          employee.position ||
          employee.employeePosition ||
          employee.role ||
          employee.department ||
          selected.assignedPosition,
      };

      let updatedFromApi: any = null;

      try {
        const res = await axios.put(
          `${API_URL}/works/${selected.id}/assign`,
          payload,
          getAuthConfig()
        );

        updatedFromApi = res.data?.data || res.data?.work || res.data;
      } catch {
        const res = await axios.put(
          `${API_URL}/works/${selected.id}`,
          payload,
          getAuthConfig()
        );

        updatedFromApi = res.data?.data || res.data?.work || res.data;
      }

      const updatedTask = updatedFromApi?._id
        ? formatWork(updatedFromApi)
        : {
          ...selected,
          assignedTo: employeeId,
          assignedName:
            employee.name ||
            employee.fullName ||
            employee.username ||
            employee.email ||
            "Assigned Employee",
          assignedPosition: payload.assignedPosition,
        };

      setTasks((prev) =>
        prev.map((task) => (task.id === selected.id ? updatedTask : task))
      );

      setSelected(updatedTask);
      toast.success("Task assigned successfully");
    } catch {
      toast.error("Failed to assign task");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Works / Tasks
          </h1>
          <p className="text-muted-foreground">
            Create tasks under existing work and track progress
          </p>
        </div>

        {isAdminOrManager && (
          <Button variant="gradient" onClick={() => setCreateOpen(true)} disabled={loading}>
            {loading ? <Spinner /> : <Plus className="w-4 h-4 mr-2" />}
            Create Task
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>

        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-bold text-info">{stats.ongoing}</p>
          <p className="text-sm text-muted-foreground">Ongoing</p>
        </div>

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-bold text-warning">{stats.review}</p>
          <p className="text-sm text-muted-foreground">Review</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            disabled={loading}
            placeholder="Search task, work, client, employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={setPositionFilter} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Positions</SelectItem>
            {POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Task
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Parent Work
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Client
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Assigned
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Priority
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  SLA / Deadline
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Updates
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <TableSkeleton />
              ) : (
                visible.map((t, i) => {
                  const overdue = isOverdue(t);
                  const days = daysToDeadline(t.dueDate);

                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelected(t)}
                    >
                      <td className="p-3">
                        <p className="font-medium text-sm">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.serviceType || "General"}
                        </p>
                      </td>

                      <td className="p-3 text-sm">
                        {t.parentWorkTitle ? (
                          <Badge variant="outline">{t.parentWorkTitle}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Main Work</span>
                        )}
                      </td>

                      <td className="p-3 text-sm">
                        <p>{custName(t.customerId, t.customerName)}</p>
                      </td>

                      <td className="p-3 text-sm">
                        <p>{empName(t.assignedTo, t.assignedName)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.assignedPosition || "—"}
                        </p>
                      </td>

                      <td className="p-3">
                        <Badge variant={statusVariant[t.status] as any}>
                          {t.status}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline">{t.priority || "Medium"}</Badge>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Timer className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{t.slaDays || 0}d SLA</span>
                        </div>

                        <div className="mt-1">
                          {overdue ? (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue {Math.abs(days)}d
                            </Badge>
                          ) : t.status === "Completed" ? (
                            <Badge variant="completed" className="text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Done
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {days >= 0 ? `${days}d left` : "Due"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-sm text-muted-foreground">
                        {t.updates?.length || 0}
                      </td>
                    </motion.tr>
                  );
                })
              )}

              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              disabled={createLoading}
              value={form.parentWorkId}
              onValueChange={handleParentWorkChange}
            >
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="Select Existing Work / Project" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((work: any) => (
                  <SelectItem key={work.id} value={work.id}>
                    {work.title} - {work.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              disabled={createLoading}
              placeholder="Task Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <Input
              disabled={createLoading}
              placeholder="Service Type"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            />

            <Select
              disabled={createLoading}
              value={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => {
                  const id = c._id || c.id;
                  const name =
                    c.name ||
                    c.customerName ||
                    c.clientName ||
                    c.companyName ||
                    "Unnamed Customer";

                  return (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              disabled={createLoading}
              value={form.assignedPosition}
              onValueChange={(v) => setForm({ ...form, assignedPosition: v, assignedTo: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assigned Position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              disabled={createLoading}
              value={form.assignedTo}
              onValueChange={(v) => setForm({ ...form, assignedTo: v })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    form.assignedTo
                      ? empName(form.assignedTo, "Assigned Employee")
                      : "Assigned Employee"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {suggestedEmployees.map((e: any) => {
                  const id = e._id || e.id;
                  const name = e.name || e.fullName || e.username || e.email;

                  return (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              disabled={createLoading}
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              disabled={createLoading}
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />

            <Input
              disabled={createLoading}
              type="number"
              placeholder="SLA Days"
              value={form.slaDays}
              onChange={(e) => setForm({ ...form, slaDays: Number(e.target.value) })}
            />

            <Textarea
              disabled={createLoading}
              className="md:col-span-2"
              placeholder="Task notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button variant="gradient" onClick={handleCreateTask} disabled={createLoading}>
            {createLoading && <Spinner />}
            {createLoading ? "Creating..." : "Create Task"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Parent Work</p>
                    <p className="font-medium">{selected.parentWorkTitle || "Main Work"}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{custName(selected.customerId, selected.customerName)}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-medium">{empName(selected.assignedTo, selected.assignedName)}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="font-medium">{selected.assignedPosition || "—"}</p>
                  </div>

                  {isAdminOrManager && (
                    <div className="p-3 rounded-lg bg-muted/40 col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Assign / Reassign</p>
                      <Select
                        value={selected.assignedTo || ""}
                        onValueChange={handleAssignTask}
                        disabled={assignLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((e: any) => {
                            const id = e._id || e.id;
                            const name = e.name || e.fullName || e.username || e.email || "Employee";
                            const position = e.position || e.employeePosition || e.role || e.department || "Employee";

                            return (
                              <SelectItem key={id} value={id}>
                                {name} - {position}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {assignLoading && (
                        <p className="mt-2 text-xs text-muted-foreground flex items-center">
                          <Spinner className="w-3 h-3 mr-2" />
                          Updating assignment...
                        </p>
                      )}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {selected.dueDate
                        ? new Date(selected.dueDate).toLocaleDateString("en-IN")
                        : "No date"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? "gradient" : "outline"}
                        onClick={() => handleStatus(s)}
                        disabled={
                          !!statusLoading ||
                          (isEmployee && s !== "In Progress" && s !== "Review")
                        }
                      >
                        {statusLoading === s ? (
                          <>
                            <Spinner className="w-3 h-3 mr-1" />
                            Updating...
                          </>
                        ) : s === "Review" && isEmployee ? (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Submit Review
                          </>
                        ) : (
                          s
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Add Work Update</p>
                  <Textarea
                    disabled={updateLoading}
                    placeholder="What did you do?"
                    value={updMsg}
                    onChange={(e) => setUpdMsg(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      disabled={updateLoading}
                      placeholder="Files / links comma separated"
                      value={updFiles}
                      onChange={(e) => setUpdFiles(e.target.value)}
                    />

                    <Input
                      disabled={updateLoading}
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Hours spent"
                      value={updTime}
                      onChange={(e) => setUpdTime(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <Button
                    size="sm"
                    className="mt-2"
                    variant="gradient"
                    onClick={handleAddUpdate}
                    disabled={updateLoading}
                  >
                    {updateLoading ? <Spinner className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                    {updateLoading ? "Saving..." : "Log Update"}
                  </Button>
                </div>

                {isAdminOrManager && selected.status === "Review" && (
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <p className="text-sm font-semibold mb-2">Manager Review</p>

                    <Textarea
                      disabled={!!reviewLoading}
                      placeholder="Review note"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleManagerReview("Completed")}
                        disabled={!!reviewLoading}
                      >
                        {reviewLoading === "Completed" ? <Spinner className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {reviewLoading === "Completed" ? "Approving..." : "Approve"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManagerReview("Revision")}
                        disabled={!!reviewLoading}
                      >
                        {reviewLoading === "Revision" ? <Spinner className="w-3 h-3 mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                        {reviewLoading === "Revision" ? "Sending..." : "Request Revision"}
                      </Button>
                    </div>
                  </div>
                )}

                {selected.managerReviewNote && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                    <p className="font-semibold">Manager Note</p>
                    <p className="text-muted-foreground">{selected.managerReviewNote}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-2">
                    Updates ({selected.updates?.length || 0})
                  </p>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(selected.updates?.length || 0) === 0 && (
                      <p className="text-xs text-muted-foreground">No updates yet</p>
                    )}

                    {[...(selected.updates || [])].reverse().map((u: any) => (
                      <div
                        key={u.id || u._id || u.createdAt}
                        className="p-2 rounded-lg bg-muted/30 text-sm"
                      >
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{u.byName || u.by}</span>
                          <span>{new Date(u.createdAt).toLocaleString("en-IN")}</span>
                        </div>

                        <p>{u.message}</p>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {u.timeSpent}h
                          </span>

                          {u.files?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {u.files.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}