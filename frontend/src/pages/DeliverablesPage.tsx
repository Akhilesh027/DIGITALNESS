import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  Calendar,
  User,
  Video,
  Image,
  Globe,
  Smartphone,
  BarChart2,
  PenTool,
  FileText,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

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
  if (Array.isArray(res.data.works)) return res.data.works;
  if (Array.isArray(res.data.customers)) return res.data.customers;
  if (Array.isArray(res.data.users)) return res.data.users;
  return [];
};

const categoryIcons: Record<string, React.ElementType> = {
  Video,
  "Social Media Post": Image,
  Design: PenTool,
  Website: Globe,
  "Website Design": Globe,
  "App Feature": Smartphone,
  SEO: BarChart2,
  "Ad Campaign": BarChart2,
  "Digital Marketing": BarChart2,
  "Content Writing": FileText,
};

const statusColumns = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Completed",
] as const;

const statusColors: Record<string, string> = {
  Pending: "bg-muted/50 border-muted-foreground/20",
  "Not Started": "bg-muted/50 border-muted-foreground/20",
  "In Progress": "bg-warning/5 border-warning/30",
  Review: "bg-info/5 border-info/30",
  Completed: "bg-success/5 border-success/30",
  Revision: "bg-destructive/5 border-destructive/30",
  Failed: "bg-destructive/5 border-destructive/30",
};

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedDeliverable, setSelectedDeliverable] = useState<any | null>(
    null
  );
  const [commentText, setCommentText] = useState("");

  const { toast } = useToast();

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const formatAssignedUser = (assignedTo: any) => {
    if (!assignedTo) return null;

    const user = Array.isArray(assignedTo) ? assignedTo[0] : assignedTo;

    if (typeof user === "string") {
      const found = employees.find((e: any) => e._id === user || e.id === user);

      return {
        id: user,
        name:
          found?.name ||
          found?.fullName ||
          found?.username ||
          found?.email ||
          "Unassigned",
      };
    }

    return {
      id: user._id || user.id,
      name: user.name || user.fullName || user.username || user.email,
    };
  };

  const formatWork = (work: any) => {
    const assignedUser = formatAssignedUser(work.assignedTo);

    return {
      id: work._id || work.id,
      title: work.title || "",
      customerId: work.customer?._id || work.customer || work.customerId,
      customerName:
        work.customer?.name ||
        work.customer?.customerName ||
        work.customer?.clientName ||
        work.customer?.companyName ||
        "Unknown",
      category: work.workType || work.type || "General",
      assignedTo: assignedUser?.id || "",
      assignedName: assignedUser?.name || "Unassigned",
      dueDate: work.dueDate,
      priority: work.priority || "Medium",
      status: work.status || "Pending",
      month: work.dueDate ? work.dueDate.slice(0, 7) : "no-date",
      completedDate: work.status === "Completed" ? work.updatedAt : undefined,
      comments:
        work.updates?.map((u: any, index: number) => ({
          id: u._id || u.id || String(index),
          userName: u.byName || "User",
          text: u.message,
          timestamp: u.createdAt,
        })) || [],
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [worksRes, customersRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/works`, getAuthConfig()),
        axios.get(`${API_URL}/customers`, getAuthConfig()),
        axios.get(`${API_URL}/users`, getAuthConfig()),
      ]);

      setCustomers(getArrayData(customersRes));
      setEmployees(getArrayData(usersRes));

      const usersData = getArrayData(usersRes);

      const formatted = getArrayData(worksRes).map((work: any) => {
        const assignedTo = work.assignedTo;
        const user = Array.isArray(assignedTo) ? assignedTo[0] : assignedTo;

        let assignedUser = null;

        if (typeof user === "string") {
          const found = usersData.find(
            (e: any) => e._id === user || e.id === user
          );

          assignedUser = {
            id: user,
            name:
              found?.name ||
              found?.fullName ||
              found?.username ||
              found?.email ||
              "Unassigned",
          };
        } else if (user) {
          assignedUser = {
            id: user._id || user.id,
            name: user.name || user.fullName || user.username || user.email,
          };
        }

        return {
          id: work._id || work.id,
          title: work.title || "",
          customerId: work.customer?._id || work.customer || work.customerId,
          customerName:
            work.customer?.name ||
            work.customer?.customerName ||
            work.customer?.clientName ||
            work.customer?.companyName ||
            "Unknown",
          category: work.workType || work.type || "General",
          assignedTo: assignedUser?.id || "",
          assignedName: assignedUser?.name || "Unassigned",
          dueDate: work.dueDate,
          priority: work.priority || "Medium",
          status: work.status || "Pending",
          month: work.dueDate ? work.dueDate.slice(0, 7) : "no-date",
          completedDate: work.status === "Completed" ? work.updatedAt : undefined,
          comments:
            work.updates?.map((u: any, index: number) => ({
              id: u._id || u.id || String(index),
              userName: u.byName || "User",
              text: u.message,
              timestamp: u.createdAt,
            })) || [],
        };
      });

      setDeliverables(formatted);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deliverables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = deliverables.filter((d) => {
    const matchesCustomer =
      selectedCustomer === "all" || d.customerId === selectedCustomer;

    const matchesMonth = selectedMonth === "all" || d.month === selectedMonth;

    return matchesCustomer && matchesMonth;
  });

  const totalDels = filtered.length;
  const completedDels = filtered.filter((d) => d.status === "Completed").length;
  const progressPercent =
    totalDels > 0 ? Math.round((completedDels / totalDels) * 100) : 0;

  const getEmployeeName = (id: string, fallback?: string) => {
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

  const getCustomerName = (id: string, fallback?: string) => {
    const cust = customers.find((c: any) => c._id === id || c.id === id);

    return (
      cust?.name ||
      cust?.customerName ||
      cust?.clientName ||
      cust?.companyName ||
      fallback ||
      "Unknown"
    );
  };

  const handleStatusChange = async (deliverable: any, newStatus: string) => {
    try {
      await axios.put(
        `${API_URL}/works/${deliverable.id}/status`,
        { status: newStatus },
        getAuthConfig()
      );

      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === deliverable.id
            ? {
              ...d,
              status: newStatus,
              completedDate:
                newStatus === "Completed"
                  ? new Date().toISOString()
                  : undefined,
            }
            : d
        )
      );

      setSelectedDeliverable((prev: any) =>
        prev
          ? {
            ...prev,
            status: newStatus,
            completedDate:
              newStatus === "Completed"
                ? new Date().toISOString()
                : undefined,
          }
          : prev
      );

      toast({
        title: "Status Updated",
        description: `${deliverable.title} → ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedDeliverable) return;

    try {
      const res = await axios.post(
        `${API_URL}/works/${selectedDeliverable.id}/update`,
        {
          message: commentText,
          files: [],
          timeSpent: 0,
        },
        getAuthConfig()
      );

      const updatedWork = formatWork(res.data.data);

      setDeliverables((prev) =>
        prev.map((d) => (d.id === selectedDeliverable.id ? updatedWork : d))
      );

      setSelectedDeliverable(updatedWork);
      setCommentText("");

      toast({ title: "Comment Added" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const customerSummaries = customers
    .map((c) => {
      const id = c._id || c.id;
      const name =
        c.name || c.customerName || c.clientName || c.companyName || "Customer";

      const custDels = filtered.filter((d) => d.customerId === id);
      if (custDels.length === 0) return null;

      const completed = custDels.filter((d) => d.status === "Completed").length;

      return {
        id,
        name,
        total: custDels.length,
        completed,
        progress: Math.round((completed / custDels.length) * 100),
      };
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Deliverables
          </h1>
          <p className="text-muted-foreground">
            Track all client deliverables and work progress
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </Button>

          <Button
            variant={viewMode === "list" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
      >
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((c: any) => {
              const id = c._id || c.id;
              const name =
                c.name ||
                c.customerName ||
                c.clientName ||
                c.companyName ||
                "Customer";

              return (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            <SelectItem value="2026-05">May 2026</SelectItem>
            <SelectItem value="2026-06">June 2026</SelectItem>
            <SelectItem value="2026-07">July 2026</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <Progress value={progressPercent} className="h-3" />
          </div>

          <span className="text-sm font-medium text-muted-foreground">
            {completedDels}/{totalDels} ({progressPercent}%)
          </span>
        </div>
      </motion.div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading deliverables...</p>
      )}

      {selectedCustomer === "all" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {customerSummaries.map((cs: any) => (
            <div
              key={cs.id}
              className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => setSelectedCustomer(cs.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {cs.name.charAt(0)}
                </div>

                <span className="font-semibold text-sm truncate">
                  {cs.name}
                </span>
              </div>

              <Progress value={cs.progress} className="h-2 mb-1" />

              <p className="text-xs text-muted-foreground">
                {cs.completed}/{cs.total} completed
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {viewMode === "kanban" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {statusColumns.map((status) => {
            const columnItems = filtered.filter((d) => d.status === status);

            return (
              <div
                key={status}
                className={`rounded-xl border p-3 min-h-[200px] ${statusColors[status]}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{status}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnItems.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {columnItems.map((del) => (
                    <motion.div
                      key={del.id}
                      layout
                      className="p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-card transition-all cursor-pointer"
                      onClick={() => setSelectedDeliverable(del)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-muted-foreground mt-0.5">
                          {getCategoryIcon(del.category)}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {del.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getCustomerName(del.customerId, del.customerName)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">
                            {getEmployeeName(del.assignedTo, del.assignedName)}
                          </span>
                        </div>

                        <span>
                          {del.dueDate
                            ? new Date(del.dueDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                              }
                            )
                            : "No date"}
                        </span>
                      </div>

                      {del.priority === "Urgent" && (
                        <Badge variant="failed" className="mt-2 text-xs">
                          Urgent
                        </Badge>
                      )}

                      {del.priority === "High" && (
                        <Badge variant="warning" className="mt-2 text-xs">
                          High
                        </Badge>
                      )}

                      {del.comments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{del.comments.length}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Deliverable
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Client
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Assigned
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Due
                  </th>
                  <th className="text-center p-3 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((del) => (
                  <tr
                    key={del.id}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedDeliverable(del)}
                  >
                    <td className="p-3 text-sm font-medium">{del.title}</td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {getCustomerName(del.customerId, del.customerName)}
                    </td>

                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(del.category)} {del.category}
                      </div>
                    </td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {getEmployeeName(del.assignedTo, del.assignedName)}
                    </td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {del.dueDate
                        ? new Date(del.dueDate).toLocaleDateString("en-IN")
                        : "No date"}
                    </td>

                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          del.status === "Completed"
                            ? "completed"
                            : del.status === "In Progress"
                              ? "inProgress"
                              : del.status === "Review"
                                ? "info"
                                : del.status === "Revision"
                                  ? "failed"
                                  : "pending"
                        }
                      >
                        {del.status}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-sm text-muted-foreground"
                    >
                      No deliverables found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <Dialog
        open={!!selectedDeliverable}
        onOpenChange={() => setSelectedDeliverable(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDeliverable &&
                getCategoryIcon(selectedDeliverable.category)}
              {selectedDeliverable?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedDeliverable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-sm">
                    {getCustomerName(
                      selectedDeliverable.customerId,
                      selectedDeliverable.customerName
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium text-sm">
                    {getEmployeeName(
                      selectedDeliverable.assignedTo,
                      selectedDeliverable.assignedName
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-sm">
                    {selectedDeliverable.dueDate
                      ? new Date(
                        selectedDeliverable.dueDate
                      ).toLocaleDateString("en-IN")
                      : "No date"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <Badge
                    variant={
                      selectedDeliverable.priority === "Urgent"
                        ? "failed"
                        : selectedDeliverable.priority === "High"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {selectedDeliverable.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Update Status</p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Pending",
                    "Not Started",
                    "In Progress",
                    "Review",
                    "Completed",
                    "Revision",
                    "Failed",
                  ].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={
                        selectedDeliverable.status === status
                          ? "gradient"
                          : "outline"
                      }
                      onClick={() =>
                        handleStatusChange(selectedDeliverable, status)
                      }
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Comments ({selectedDeliverable.comments.length})
                </p>

                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {selectedDeliverable.comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium">{c.userName}</span>
                        <span>
                          {c.timestamp
                            ? new Date(c.timestamp).toLocaleString("en-IN")
                            : ""}
                        </span>
                      </div>

                      <p>{c.text}</p>
                    </div>
                  ))}

                  {selectedDeliverable.comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  )}
                </div>

                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px]"
                />

                <Button
                  size="sm"
                  variant="gradient"
                  className="mt-2"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Post Comment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}