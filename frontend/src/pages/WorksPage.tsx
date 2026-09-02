import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Layers,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Trash2,
  UploadCloud,
  Plus,
  Search,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type WorkStatus =
  | "Pending"
  | "Not Started"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Revision"
  | "Failed";

type WorkPriority = "Low" | "Medium" | "High" | "Urgent";

type Attachment = {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  isLocal?: boolean;
};

type WorkComment = {
  message: string;
  createdBy?: any;
  createdAt?: string;
};

type TimelineItem = {
  title: string;
  message?: string;
  type?: string;
  createdBy?: any;
  createdAt?: string;
};

type WorkForm = {
  id?: string;
  title: string;
  type: string;
  customerId: string;
  parentWorkId: string;
  priority: WorkPriority;
  status: WorkStatus;
  dueDate: string;
  description: string;
  deliverables: number;
  completedDeliverables: number;
  assignedTo: string[];
  slaDays: number;
  estimatedHours: number;
  attachments: Attachment[];
};

const emptyWorkForm: WorkForm = {
  title: "",
  type: "",
  customerId: "",
  parentWorkId: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
  description: "",
  deliverables: 1,
  completedDeliverables: 0,
  assignedTo: [],
  slaDays: 2,
  estimatedHours: 0,
  attachments: [],
};

import { jsonHeaders, authHeaders, getToken } from "@/api/auth";

const getAuthConfig = () => ({
  headers: jsonHeaders(),
});

const getCurrentUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const statusColors: Record<string, any> = {
  Pending: "secondary",
  "Not Started": "secondary",
  "In Progress": "inProgress",
  Review: "info",
  Completed: "completed",
  Revision: "warning",
  Failed: "failed",
};

const priorityColors: Record<string, any> = {
  Low: "secondary",
  Medium: "warning",
  High: "destructive",
  Urgent: "destructive",
};

const statuses: WorkStatus[] = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Completed",
  "Revision",
  "Failed",
];

const kanbanStatuses: WorkStatus[] = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Revision",
  "Completed",
];

const projectTypes = [
  "Digital Marketing",
  "Website Design",
  "App Development",
  "Video Production",
  "SEO",
  "Social Media",
  "Branding",
  "Content Writing",
  "Graphic Design",
  "UI/UX",
  "Support",
];

const toDateInput = (date?: string) => {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function WorksPage() {
  const { toast } = useToast();

  const currentUser = getCurrentUser();
  const currentUserRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();

  const canAddWork =
    currentUserRole === "admin" ||
    currentUserRole === "operational manager" ||
    currentUserRole === "operationalmanager";

  const canManageWork = canAddWork;
  const canEditWork = canManageWork;
  const canAssignWork = canManageWork;
  const canSeeAssignment = canManageWork;
  const canApproveWork = canManageWork;
  const canSubmitWorkUpdate = true;

  const [works, setWorks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [assignUpdatingId, setAssignUpdatingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<any>(null);

  const [newProject, setNewProject] = useState<WorkForm>(emptyWorkForm);
  const [editProject, setEditProject] = useState<WorkForm>(emptyWorkForm);

  const [newComment, setNewComment] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateTimeSpent, setUpdateTimeSpent] = useState(0);
  const [updateFiles, setUpdateFiles] = useState<Attachment[]>([]);
  const [newAttachment, setNewAttachment] = useState<Attachment>({
    fileName: "",
    fileUrl: "",
    fileType: "",
  });

  const getArrayData = (res: any) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.users)) return res.data.users;
    if (Array.isArray(res.data.customers)) return res.data.customers;
    if (Array.isArray(res.data.works)) return res.data.works;
    return [];
  };

  const getEmployeeOptionName = (emp: any) =>
    emp.name || emp.fullName || emp.username || emp.email || "Unnamed User";

  const getEmployeeName = (employee: any) => {
    if (typeof employee === "object") {
      return (
        employee.name ||
        employee.fullName ||
        employee.username ||
        employee.email ||
        "Unassigned"
      );
    }

    const found = employees.find(
      (emp: any) => emp._id === employee || emp.id === employee,
    );

    return getEmployeeOptionName(found || {}) || "Unassigned";
  };

  const formatAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];

    const users = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    return users.map((emp: any) => {
      if (typeof emp === "string") {
        const found = employees.find(
          (user: any) => user._id === emp || user.id === emp,
        );

        return {
          id: emp,
          name: getEmployeeOptionName(found || {}) || "User",
          role: found?.role || found?.department || "Employee",
        };
      }

      return {
        id: emp._id || emp.id,
        name: getEmployeeOptionName(emp),
        role: emp.role || emp.department || "Employee",
      };
    });
  };

  const formatWork = (work: any) => ({
    id: work._id || work.id,
    title: work.title || "",
    type: work.workType || work.type || "",
    parentWorkId: work.parentWorkId?._id || work.parentWorkId || "",
    parentWorkTitle: work.parentWorkId?.title || work.parentWorkTitle || "",
    customerId: work.customer?._id || work.customer || work.customerId || "",
    customerName:
      work.customer?.name ||
      work.customer?.customerName ||
      work.customer?.clientName ||
      work.customer?.companyName ||
      work.customerName ||
      "Unknown",
    assignedTo: formatAssignedUsers(work.assignedTo),
    priority: work.priority || "Medium",
    status: work.status || "Pending",
    dueDate: work.dueDate,
    description: work.description || "",
    deliverables: Number(work.deliverables || 1),
    completedDeliverables: Number(work.completedDeliverables || 0),
    createdOn: work.createdAt,
    slaDays: Number(work.slaDays || 2),
    estimatedHours: Number(work.estimatedHours || 0),
    actualHours: Number(work.actualHours || 0),
    attachments: Array.isArray(work.attachments) ? work.attachments : [],
    comments: Array.isArray(work.comments) ? work.comments : [],
    timeline: Array.isArray(work.timeline)
      ? work.timeline
      : Array.isArray(work.activityLogs)
        ? work.activityLogs
        : [],
    approvalStatus: work.approvalStatus || "Pending",
    reviewRequestedAt: work.reviewRequestedAt || null,
    approvedAt: work.approvedAt || null,
    revisionReason: work.revisionReason || "",
  });

  const fetchCustomersAndUsers = async () => {
    try {
      const [customerRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/customers`, getAuthConfig()),
        axios.get(`${API_URL}/users`, getAuthConfig()),
      ]);

      setCustomers(getArrayData(customerRes));
      setEmployees(getArrayData(userRes));
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch customers and users",
        variant: "destructive",
      });
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/works`, getAuthConfig());
      const data = getArrayData(res);
      setWorks(data.map(formatWork));
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch works",
        variant: "destructive",
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCustomerName = (id: string, fallback?: string) => {
    const customer = customers.find((c: any) => c._id === id || c.id === id);

    return (
      customer?.name ||
      customer?.customerName ||
      customer?.clientName ||
      customer?.companyName ||
      fallback ||
      "Unknown"
    );
  };

  const getFirstAssignedId = (assignedTo: any[]) => {
    if (!assignedTo || assignedTo.length === 0) return "";
    const first = assignedTo[0];
    return typeof first === "string" ? first : first.id || first._id || "";
  };

  const buildAssignedUser = (employeeId: string) => {
    const emp = employees.find(
      (user: any) => user._id === employeeId || user.id === employeeId,
    );

    return {
      id: employeeId,
      name: getEmployeeOptionName(emp || {}) || "User",
      role: emp?.role || emp?.department || "Employee",
    };
  };

  const getProgress = (work: any) => {
    const total = Number(work.deliverables || 0);
    const completed = Number(work.completedDeliverables || 0);
    if (!total) return 0;
    return Math.min(Math.round((completed / total) * 100), 100);
  };

  const isOverdue = (work: any) => {
    if (!work.dueDate || work.status === "Completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(work.dueDate) < today;
  };

  const filteredProjects = useMemo(() => {
    return works.filter((project) => {
      const matchesSearch =
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.customerName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" || project.status === selectedStatus;

      const matchesCustomer =
        selectedCustomer === "All" || project.customerId === selectedCustomer;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [works, searchQuery, selectedStatus, selectedCustomer]);

  const projectsByStatus = kanbanStatuses.reduce((acc: any, status) => {
    acc[status] = filteredProjects.filter((p) => p.status === status);
    return acc;
  }, {});

  const analytics = useMemo(() => {
    const total = works.length;
    const inProgress = works.filter((p) => p.status === "In Progress").length;
    const review = works.filter((p) => p.status === "Review").length;
    const completed = works.filter((p) => p.status === "Completed").length;
    const overdue = works.filter(isOverdue).length;
    const urgent = works.filter((p) => p.priority === "Urgent").length;

    return { total, inProgress, review, completed, overdue, urgent };
  }, [works]);

  const employeeWorkload = useMemo(() => {
    return employees
      .map((emp: any) => {
        const empId = emp._id || emp.id;
        const assignedCount = works.filter((work) =>
          work.assignedTo?.some((assigned: any) => assigned.id === empId),
        ).length;

        return {
          id: empId,
          name: getEmployeeOptionName(emp),
          role: emp.role || emp.department || "Employee",
          assignedCount,
        };
      })
      .sort((a, b) => b.assignedCount - a.assignedCount);
  }, [employees, works]);

  const selectedCustomerDashboard = useMemo(() => {
    if (selectedCustomer === "All") return null;

    const customerWorks = works.filter(
      (work) => work.customerId === selectedCustomer,
    );

    return {
      name: getCustomerName(selectedCustomer),
      total: customerWorks.length,
      pending: customerWorks.filter((w) =>
        ["Pending", "Not Started"].includes(w.status),
      ).length,
      review: customerWorks.filter((w) => w.status === "Review").length,
      completed: customerWorks.filter((w) => w.status === "Completed").length,
      employees: new Set(
        customerWorks.flatMap(
          (w) => w.assignedTo?.map((emp: any) => emp.id) || [],
        ),
      ).size,
    };
  }, [selectedCustomer, works, customers]);

  const buildPayload = (form: WorkForm) => ({
    title: form.title,
    workType: form.type,
    customer: form.customerId || null,
    parentWorkId: form.parentWorkId || null,
    assignedTo: form.assignedTo,
    priority: form.priority,
    status: form.status,
    dueDate: form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    description: form.description,
    deliverables: Number(form.deliverables || 1),
    completedDeliverables: Number(form.completedDeliverables || 0),
    slaDays: Number(form.slaDays || 2),
    estimatedHours: Number(form.estimatedHours || 0),
    attachments: form.attachments || [],
  });

  const validateWorkForm = (form: WorkForm) => {
    if (
      !form.title ||
      !form.customerId ||
      !form.type ||
      form.assignedTo.length === 0
    ) {
      toast({
        title: "Missing Details",
        description:
          "Please fill title, customer, type and assign at least one employee",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleStatusChange = async (
    projectId: string,
    newStatus: WorkStatus,
  ) => {
    try {
      setStatusUpdatingId(projectId);

      try {
        await axios.put(
          `${API_URL}/works/${projectId}/status`,
          { status: newStatus },
          getAuthConfig(),
        );
      } catch {
        await axios.put(
          `${API_URL}/works/${projectId}`,
          { status: newStatus },
          getAuthConfig(),
        );
      }

      setWorks((prev) =>
        prev.map((work) =>
          work.id === projectId ? { ...work, status: newStatus } : work,
        ),
      );

      toast({
        title: "Status Updated",
        description: `Work moved to ${newStatus}`,
      });
      fetchWorks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update work status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleRequestReview = async (projectId: string) => {
    await handleStatusChange(projectId, "Review");
  };

  const handleApproveWork = async (projectId: string) => {
    try {
      setActionLoading(projectId);

      try {
        await axios.put(
          `${API_URL}/works/${projectId}/approve`,
          {},
          getAuthConfig(),
        );
      } catch {
        await axios.put(
          `${API_URL}/works/${projectId}`,
          { status: "Completed", approvalStatus: "Approved" },
          getAuthConfig(),
        );
      }

      toast({
        title: "Work Approved",
        description: "Work marked as completed",
      });
      fetchWorks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve work",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevisionWork = async (projectId: string) => {
    try {
      setActionLoading(projectId);

      try {
        await axios.put(
          `${API_URL}/works/${projectId}/revision`,
          { status: "Revision" },
          getAuthConfig(),
        );
      } catch {
        await axios.put(
          `${API_URL}/works/${projectId}`,
          { status: "Revision", approvalStatus: "Revision" },
          getAuthConfig(),
        );
      }

      toast({
        title: "Revision Requested",
        description: "Work moved to revision",
      });
      fetchWorks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to request revision",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignChange = async (projectId: string, employeeId: string) => {
    try {
      setAssignUpdatingId(projectId);
      const assignedUser = buildAssignedUser(employeeId);
      const payload = { assignedTo: [employeeId] };

      try {
        await axios.put(
          `${API_URL}/works/${projectId}/assign`,
          payload,
          getAuthConfig(),
        );
      } catch {
        await axios.put(
          `${API_URL}/works/${projectId}`,
          payload,
          getAuthConfig(),
        );
      }

      setWorks((prev) =>
        prev.map((work) =>
          work.id === projectId
            ? { ...work, assignedTo: [assignedUser] }
            : work,
        ),
      );

      toast({
        title: "Employee Changed",
        description: `Assigned to ${assignedUser.name}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update employee assignment",
        variant: "destructive",
      });
    } finally {
      setAssignUpdatingId(null);
    }
  };

  const handleEditClick = (project: any) => {
    setEditProject({
      id: project.id,
      title: project.title || "",
      type: project.type || "",
      customerId: project.customerId || "",
      parentWorkId: project.parentWorkId || "",
      priority: project.priority || "Medium",
      status: project.status || "Pending",
      dueDate: toDateInput(project.dueDate),
      description: project.description || "",
      deliverables: Number(project.deliverables || 1),
      completedDeliverables: Number(project.completedDeliverables || 0),
      assignedTo:
        project.assignedTo?.map((emp: any) => emp.id || emp._id || emp) || [],
      slaDays: Number(project.slaDays || 2),
      estimatedHours: Number(project.estimatedHours || 0),
      attachments: project.attachments || [],
    });

    setShowEditModal(true);
  };

  const handleViewClick = (project: any) => {
    setSelectedWork(project);
    setNewComment("");
    setUpdateMessage("");
    setUpdateTimeSpent(0);
    setUpdateFiles([]);
    setNewAttachment({ fileName: "", fileUrl: "", fileType: "" });
    setShowDetailsModal(true);
  };

  const handleAddProject = async () => {
    if (!canAddWork) {
      toast({
        title: "Access Denied",
        description: "Only Admin and Operational Manager can create work",
        variant: "destructive",
      });
      return;
    }

    if (!validateWorkForm(newProject)) return;

    try {
      setCreateLoading(true);
      await axios.post(
        `${API_URL}/works`,
        buildPayload(newProject),
        getAuthConfig(),
      );

      toast({
        title: "Work Created",
        description: "Work saved, assigned and added to customer",
      });
      setShowAddModal(false);
      setNewProject(emptyWorkForm);
      fetchWorks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create work",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editProject.id || !validateWorkForm(editProject)) return;

    try {
      setEditLoading(true);
      await axios.put(
        `${API_URL}/works/${editProject.id}`,
        buildPayload(editProject),
        getAuthConfig(),
      );

      toast({ title: "Updated", description: "Work updated successfully" });
      setShowEditModal(false);
      fetchWorks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update work",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedWork?.id || !newComment.trim()) return;

    try {
      setActionLoading(selectedWork.id);

      try {
        await axios.post(
          `${API_URL}/works/${selectedWork.id}/comments`,
          { message: newComment },
          getAuthConfig(),
        );
      } catch {
        const comments = [
          ...(selectedWork.comments || []),
          {
            message: newComment,
            createdAt: new Date().toISOString(),
            createdBy: currentUser,
          },
        ];
        await axios.put(
          `${API_URL}/works/${selectedWork.id}`,
          { comments },
          getAuthConfig(),
        );
      }

      toast({ title: "Comment Added", description: "Work comment saved" });
      setNewComment("");
      await fetchWorks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };


  const handleSubmitWorkUpdate = async () => {
    if (!selectedWork?.id || !updateMessage.trim()) return;

    try {
      setActionLoading(selectedWork.id);

      const files = updateFiles.map((file) => file.fileUrl).filter(Boolean);

      await axios.post(
        `${API_URL}/works/${selectedWork.id}/update`,
        {
          message: updateMessage,
          files,
          timeSpent: Number(updateTimeSpent || 0),
        },
        getAuthConfig(),
      );

      toast({
        title: "Update Submitted",
        description: "Your work update has been submitted successfully",
      });

      setUpdateMessage("");
      setUpdateTimeSpent(0);
      setUpdateFiles([]);
      await fetchWorks();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to submit work update",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAttachment = async () => {
    if (
      !selectedWork?.id ||
      (!newAttachment.fileName && !newAttachment.fileUrl)
    )
      return;

    try {
      setActionLoading(selectedWork.id);

      try {
        await axios.post(
          `${API_URL}/works/${selectedWork.id}/attachments`,
          newAttachment,
          getAuthConfig(),
        );
      } catch {
        const attachments = [
          ...(selectedWork.attachments || []),
          newAttachment,
        ];
        await axios.put(
          `${API_URL}/works/${selectedWork.id}`,
          { attachments },
          getAuthConfig(),
        );
      }

      toast({
        title: "Attachment Added",
        description: "Work attachment saved",
      });
      setNewAttachment({ fileName: "", fileUrl: "", fileType: "" });
      await fetchWorks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add attachment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const fileToAttachment = (file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileName: file.name,
          fileUrl: String(reader.result || ""),
          fileType: file.type || "file",
          fileSize: file.size,
          isLocal: true,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFormFileUpload = async (
    files: FileList | null,
    mode: "create" | "edit",
  ) => {
    if (!files || files.length === 0) return;

    try {
      const uploadedAttachments = await Promise.all(
        Array.from(files).map(fileToAttachment),
      );

      if (mode === "create") {
        setNewProject((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedAttachments],
        }));
      } else {
        setEditProject((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedAttachments],
        }));
      }

      toast({
        title: "Files Added",
        description: `${uploadedAttachments.length} file(s) added to work attachments`,
      });
    } catch {
      toast({
        title: "Upload Error",
        description: "Failed to read selected files",
        variant: "destructive",
      });
    }
  };

  const handleDetailFileUpload = async (files: FileList | null) => {
    if (!selectedWork?.id || !files || files.length === 0) return;

    try {
      setActionLoading(selectedWork.id);
      const uploadedAttachments = await Promise.all(
        Array.from(files).map(fileToAttachment),
      );

      for (const attachment of uploadedAttachments) {
        try {
          await axios.post(
            `${API_URL}/works/${selectedWork.id}/attachments`,
            attachment,
            getAuthConfig(),
          );
        } catch {
          const attachments = [...(selectedWork.attachments || []), attachment];
          await axios.put(
            `${API_URL}/works/${selectedWork.id}`,
            { attachments },
            getAuthConfig(),
          );
        }
      }

      toast({
        title: "Files Uploaded",
        description: `${uploadedAttachments.length} attachment(s) saved`,
      });

      await fetchWorks();
      setShowDetailsModal(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload attachments",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const WorkCardSkeleton = () => (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card animate-pulse">
      <div className="h-4 bg-muted rounded w-2/3 mb-3" />
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="h-3 bg-muted rounded w-3/4 mb-4" />
      <div className="h-2 bg-muted rounded w-full mb-4" />
      <div className="h-8 bg-muted rounded w-full" />
    </div>
  );

  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <td key={cellIndex} className="p-4">
              <div className="h-4 bg-muted rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const StatCard = ({ title, value, icon: Icon, className }: any) => (
    <div
      className={`p-4 rounded-xl border shadow-card bg-card ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-heading font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );

  const renderProgress = (project: any) => (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">Progress</span>
        <span>
          {project.completedDeliverables}/{project.deliverables} ·{" "}
          {getProgress(project)}%
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full"
          style={{ width: `${getProgress(project)}%` }}
        />
      </div>
    </div>
  );

  const WorkActions = ({ project }: { project: any }) => (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleViewClick(project)}
      >
        <Eye className="w-3 h-3 mr-1" /> View Details
      </Button>

      {canEditWork && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditClick(project)}
        >
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
      )}

      {canSubmitWorkUpdate &&
        !canManageWork &&
        project.status !== "Review" &&
        project.status !== "Completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRequestReview(project.id)}
          >
            <Send className="w-3 h-3 mr-1" /> Send for Review
          </Button>
        )}

      {canApproveWork && project.status === "Review" && (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={actionLoading === project.id}
            onClick={() => handleApproveWork(project.id)}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={actionLoading === project.id}
            onClick={() => handleRevisionWork(project.id)}
          >
            <XCircle className="w-3 h-3 mr-1" /> Revision
          </Button>
        </>
      )}
    </div>
  );

  const WorkFormFields = ({
    form,
    setForm,
    loadingState,
    mode,
  }: {
    form: WorkForm;
    setForm: (data: WorkForm) => void;
    loadingState: boolean;
    mode: "create" | "edit";
  }) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title *</label>
        <Input
          disabled={loadingState}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Work title"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Customer *</label>
          <Select
            disabled={loadingState}
            value={form.customerId}
            onValueChange={(v) => setForm({ ...form, customerId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c: any) => {
                const customerId = c._id || c.id;
                const customerName =
                  c.name ||
                  c.customerName ||
                  c.clientName ||
                  c.companyName ||
                  "Unnamed Customer";
                return (
                  <SelectItem key={customerId} value={customerId}>
                    {customerName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Parent Work / Sub Task
          </label>
          <Select
            disabled={loadingState}
            value={form.parentWorkId || "none"}
            onValueChange={(v) =>
              setForm({ ...form, parentWorkId: v === "none" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No parent work" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parent Work</SelectItem>
              {works
                .filter((work) => work.id !== form.id)
                .map((work) => (
                  <SelectItem key={work.id} value={work.id}>
                    {work.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Type *</label>
          <Select
            disabled={loadingState}
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Priority</label>
          <Select
            disabled={loadingState}
            value={form.priority}
            onValueChange={(v: WorkPriority) =>
              setForm({ ...form, priority: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Low", "Medium", "High", "Urgent"].map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "edit" && (
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            disabled={loadingState}
            value={form.status}
            onValueChange={(v: WorkStatus) => setForm({ ...form, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Due Date</label>
          <Input
            disabled={loadingState}
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">SLA Days</label>
          <Input
            disabled={loadingState}
            type="number"
            min={1}
            value={form.slaDays}
            onChange={(e) =>
              setForm({ ...form, slaDays: Number(e.target.value || 1) })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Estimated Hours
          </label>
          <Input
            disabled={loadingState}
            type="number"
            min={0}
            value={form.estimatedHours}
            onChange={(e) =>
              setForm({ ...form, estimatedHours: Number(e.target.value || 0) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Total Deliverables
          </label>
          <Input
            disabled={loadingState}
            type="number"
            min={1}
            value={form.deliverables}
            onChange={(e) =>
              setForm({ ...form, deliverables: parseInt(e.target.value) || 1 })
            }
          />
        </div>
        {mode === "edit" && (
          <div>
            <label className="text-sm font-medium mb-1 block">
              Completed Deliverables
            </label>
            <Input
              disabled={loadingState}
              type="number"
              min={0}
              value={form.completedDeliverables}
              onChange={(e) =>
                setForm({
                  ...form,
                  completedDeliverables: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Assign Users *</label>
        <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto border rounded-lg p-3">
          {employees.map((emp: any) => {
            const empId = emp._id || emp.id;
            const empName = getEmployeeOptionName(emp);
            const empRole = emp.role || emp.department || "Employee";
            const workload =
              employeeWorkload.find((item) => item.id === empId)
                ?.assignedCount || 0;

            return (
              <div key={empId} className="flex items-center gap-2">
                <Checkbox
                  disabled={loadingState}
                  id={`${mode}-emp-${empId}`}
                  checked={form.assignedTo.includes(empId)}
                  onCheckedChange={(checked) => {
                    if (checked)
                      setForm({
                        ...form,
                        assignedTo: [...form.assignedTo, empId],
                      });
                    else
                      setForm({
                        ...form,
                        assignedTo: form.assignedTo.filter(
                          (id) => id !== empId,
                        ),
                      });
                  }}
                />
                <label
                  htmlFor={`${mode}-emp-${empId}`}
                  className="text-sm flex-1"
                >
                  {empName}{" "}
                  <span className="text-muted-foreground">({empRole})</span>
                </label>
                <Badge variant="secondary">{workload} works</Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          disabled={loadingState}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Work description, expected output, references, blockers, notes"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-medium text-sm">
            <Paperclip className="w-4 h-4" /> Attachments / Uploads
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <UploadCloud className="h-4 w-4" /> Upload Files
            <input
              type="file"
              multiple
              className="hidden"
              disabled={loadingState}
              onChange={(e) => {
                handleFormFileUpload(e.target.files, mode);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          You can upload screenshots, PDFs, design files or add external file
          links. Local uploads are converted into preview URLs; connect backend
          upload later for cloud storage.
        </p>

        <div className="space-y-3">
          {form.attachments.length === 0 && (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              No attachments added yet
            </div>
          )}

          {form.attachments.map((attachment, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-3 lg:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  File Name
                </label>
                <Input
                  value={attachment.fileName}
                  onChange={(e) => {
                    const next = [...form.attachments];
                    next[index] = { ...next[index], fileName: e.target.value };
                    setForm({ ...form, attachments: next });
                  }}
                  placeholder="File name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  File URL / Uploaded Data
                </label>
                <Input
                  value={
                    attachment.fileUrl?.startsWith("data:")
                      ? "Uploaded file ready"
                      : attachment.fileUrl
                  }
                  onChange={(e) => {
                    const next = [...form.attachments];
                    next[index] = {
                      ...next[index],
                      fileUrl: e.target.value,
                      isLocal: false,
                    };
                    setForm({ ...form, attachments: next });
                  }}
                  placeholder="Paste file URL"
                  disabled={attachment.fileUrl?.startsWith("data:")}
                />
                {(attachment.fileType || attachment.fileSize) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {attachment.fileType || "file"}{" "}
                    {formatFileSize(attachment.fileSize)
                      ? `· ${formatFileSize(attachment.fileSize)}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2">
                {attachment.fileUrl && (
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1 lg:flex-none"
                    onClick={() => window.open(attachment.fileUrl, "_blank")}
                  >
                    Open
                  </Button>
                )}
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1 text-destructive hover:text-destructive lg:flex-none"
                  onClick={() =>
                    setForm({
                      ...form,
                      attachments: form.attachments.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            setForm({
              ...form,
              attachments: [
                ...form.attachments,
                { fileName: "", fileUrl: "", fileType: "" },
              ],
            })
          }
        >
          <Plus className="w-3 h-3 mr-1" /> Add Link Manually
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Works & Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage work assignments, subtasks, reviews, comments and customer
            progress
          </p>
        </div>

        {canAddWork && (
          <Button
            variant="gradient"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Work
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Total Works" value={analytics.total} icon={Layers} />
        <StatCard
          title="In Progress"
          value={analytics.inProgress}
          icon={Clock}
          className="border-info/30 bg-info/10"
        />
        <StatCard
          title="In Review"
          value={analytics.review}
          icon={Send}
          className="border-warning/30 bg-warning/10"
        />
        <StatCard
          title="Completed"
          value={analytics.completed}
          icon={CheckCircle2}
          className="border-success/30 bg-success/10"
        />
        <StatCard
          title="Overdue"
          value={analytics.overdue}
          icon={AlertTriangle}
          className="border-destructive/30 bg-destructive/10"
        />
        <StatCard
          title="Urgent"
          value={analytics.urgent}
          icon={AlertTriangle}
          className="border-destructive/30 bg-destructive/10"
        />
      </div>

      {selectedCustomerDashboard && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            <h3 className="font-semibold">
              Customer Work Dashboard: {selectedCustomerDashboard.name}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="rounded-xl bg-muted/50 p-3">
              <b>{selectedCustomerDashboard.total}</b>
              <p className="text-muted-foreground">Total Works</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <b>{selectedCustomerDashboard.pending}</b>
              <p className="text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <b>{selectedCustomerDashboard.review}</b>
              <p className="text-muted-foreground">Review</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <b>{selectedCustomerDashboard.completed}</b>
              <p className="text-muted-foreground">Completed</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <b>{selectedCustomerDashboard.employees}</b>
              <p className="text-muted-foreground">Employees</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search works, customer, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full xl:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-full xl:w-[240px]">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Customers</SelectItem>
            {customers.map((c: any) => {
              const customerId = c._id || c.id;
              const customerName =
                c.name ||
                c.customerName ||
                c.clientName ||
                c.companyName ||
                "Unnamed Customer";
              return (
                <SelectItem key={customerId} value={customerId}>
                  {customerName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            className="w-full sm:w-auto"
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading works...
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4">
          {Object.entries(projectsByStatus).map(
            ([status, statusProjects]: any) => (
              <div
                key={status}
                className="bg-muted/30 rounded-xl p-3 sm:p-4 min-h-[220px]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={statusColors[status]}>{status}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({statusProjects.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {loading
                    ? Array.from({ length: 3 }).map((_, index) => (
                      <WorkCardSkeleton key={`${status}-skeleton-${index}`} />
                    ))
                    : statusProjects.map((project: any) => (
                      <div
                        key={project.id}
                        className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {project.title}
                          </h4>
                          <Badge
                            variant={priorityColors[project.priority]}
                            className="text-xs"
                          >
                            {project.priority}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                          {project.parentWorkId && (
                            <Badge variant="outline">Sub Task</Badge>
                          )}
                          {isOverdue(project) && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {project.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Customer:{" "}
                          {getCustomerName(
                            project.customerId,
                            project.customerName,
                          )}
                        </p>

                        {renderProgress(project)}

                        {canManageWork ? (
                          <Select
                            value={project.status}
                            disabled={statusUpdatingId === project.id}
                            onValueChange={(value: WorkStatus) =>
                              handleStatusChange(project.id, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              {statusUpdatingId === project.id ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                  Updating...
                                </span>
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((statusOption) => (
                                <SelectItem
                                  key={statusOption}
                                  value={statusOption}
                                >
                                  {statusOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            Status: <b className="text-foreground">{project.status}</b>
                          </div>
                        )}

                        {canAssignWork && (
                          <Select
                            value={getFirstAssignedId(project.assignedTo)}
                            disabled={assignUpdatingId === project.id}
                            onValueChange={(value) =>
                              handleAssignChange(project.id, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              {assignUpdatingId === project.id ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                  Assigning...
                                </span>
                              ) : (
                                <SelectValue placeholder="Assign user" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp: any) => {
                                const empId = emp._id || emp.id;
                                return (
                                  <SelectItem key={empId} value={empId}>
                                    {getEmployeeOptionName(emp)}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {project.dueDate
                              ? new Date(project.dueDate).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )
                              : "No date"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {project.comments?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {project.attachments?.length || 0}
                          </span>
                        </div>

                        <WorkActions project={project} />
                      </div>
                    ))}

                  {!loading && statusProjects.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No works
                    </p>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {viewMode === "list" && (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm">Work</th>
                <th className="text-left p-4 text-sm">Customer</th>
                <th className="text-left p-4 text-sm">Type</th>
                <th className="text-left p-4 text-sm">Priority</th>
                <th className="text-left p-4 text-sm">Status</th>
                {canSeeAssignment && <th className="text-left p-4 text-sm">Assigned</th>}
                <th className="text-left p-4 text-sm">Due</th>
                <th className="text-left p-4 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <TableSkeleton />
              ) : (
                filteredProjects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-muted/30">
                    <td className="p-4 min-w-[220px]">
                      <div className="font-medium">{project.title}</div>
                      {project.parentWorkId && (
                        <div className="text-xs text-muted-foreground">
                          Sub task of {project.parentWorkTitle || "parent work"}
                        </div>
                      )}
                      {renderProgress(project)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {getCustomerName(
                        project.customerId,
                        project.customerName,
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{project.type}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={priorityColors[project.priority]}>
                        {project.priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                      {isOverdue(project) && (
                        <Badge variant="destructive" className="ml-2">
                          Overdue
                        </Badge>
                      )}
                    </td>
                    {canSeeAssignment && (
                      <td className="p-4 text-sm text-muted-foreground min-w-[190px]">
                        <Select
                          value={getFirstAssignedId(project.assignedTo)}
                          disabled={assignUpdatingId === project.id}
                          onValueChange={(value) =>
                            handleAssignChange(project.id, value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign user" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp: any) => {
                              const empId = emp._id || emp.id;
                              return (
                                <SelectItem key={empId} value={empId}>
                                  {getEmployeeOptionName(emp)}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                    <td className="p-4 text-sm text-muted-foreground">
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString("en-IN")
                        : "No date"}
                    </td>
                    <td className="p-4 min-w-[260px]">
                      <WorkActions project={project} />
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={canSeeAssignment ? 8 : 7}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No works found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={showAddModal && canAddWork}
        onOpenChange={(open) => !createLoading && setShowAddModal(open)}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Work</DialogTitle>
          </DialogHeader>
          <WorkFormFields
            form={newProject}
            setForm={setNewProject}
            loadingState={createLoading}
            mode="create"
          />
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={createLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddProject}
              disabled={createLoading}
              className="flex-1"
            >
              {createLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {createLoading ? "Creating..." : "Create Work"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditModal}
        onOpenChange={(open) => !editLoading && setShowEditModal(open)}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Work</DialogTitle>
          </DialogHeader>
          <WorkFormFields
            form={editProject}
            setForm={setEditProject}
            loadingState={editLoading}
            mode="edit"
          />
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleUpdateProject}
              disabled={editLoading}
              className="flex-1"
            >
              {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editLoading ? "Updating..." : "Update Work"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Work Details</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{selectedWork.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {getCustomerName(
                        selectedWork.customerId,
                        selectedWork.customerName,
                      )}{" "}
                      · {selectedWork.type}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusColors[selectedWork.status]}>
                      {selectedWork.status}
                    </Badge>
                    <Badge variant={priorityColors[selectedWork.priority]}>
                      {selectedWork.priority}
                    </Badge>
                    {isOverdue(selectedWork) && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-4">{renderProgress(selectedWork)}</div>
                <p className="mt-4 text-sm whitespace-pre-line">
                  {selectedWork.description || "No description added"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <b>
                    {selectedWork.dueDate
                      ? new Date(selectedWork.dueDate).toLocaleDateString(
                        "en-IN",
                      )
                      : "No date"}
                  </b>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">SLA Days</p>
                  <b>{selectedWork.slaDays || 2}</b>
                </div>
                {canSeeAssignment && (
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <b>
                      {selectedWork.assignedTo
                        ?.map((e: any) => e.name)
                        .join(", ") || "Unassigned"}
                    </b>
                  </div>
                )}
              </div>

              {canSubmitWorkUpdate && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Send className="w-4 h-4" /> Submit Work Update
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Employees can submit progress updates, time spent, blockers, and supporting files here.
                  </p>

                  <Textarea
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Write your work update, completed tasks, blockers, or next plan..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={updateTimeSpent}
                      onChange={(e) =>
                        setUpdateTimeSpent(Number(e.target.value || 0))
                      }
                      placeholder="Hours worked"
                    />

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                      <UploadCloud className="h-4 w-4" /> Attach Update Files
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (!e.target.files) return;
                          const uploaded = await Promise.all(
                            Array.from(e.target.files).map(fileToAttachment),
                          );
                          setUpdateFiles((prev) => [...prev, ...uploaded]);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {updateFiles.length > 0 && (
                    <div className="space-y-2">
                      {updateFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileType || "file"} {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setUpdateFiles((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitWorkUpdate}
                    disabled={
                      actionLoading === selectedWork.id || !updateMessage.trim()
                    }
                    className="w-full sm:w-auto"
                  >
                    {actionLoading === selectedWork.id && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Submit Update
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {(selectedWork.comments || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No comments yet
                      </p>
                    )}
                    {(selectedWork.comments || []).map(
                      (comment: WorkComment, index: number) => (
                        <div
                          key={index}
                          className="rounded-xl bg-muted/40 p-3 text-sm"
                        >
                          <p>{comment.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleString(
                                "en-IN",
                              )
                              : ""}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment / update / blocker"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={
                      actionLoading === selectedWork.id || !newComment.trim()
                    }
                  >
                    {actionLoading === selectedWork.id && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Add Comment
                  </Button>
                </div>

                <div className="rounded-2xl border p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attachments
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {(selectedWork.attachments || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No attachments yet
                      </p>
                    )}
                    {(selectedWork.attachments || []).map(
                      (attachment: Attachment, index: number) => (
                        <div
                          key={index}
                          className="rounded-xl bg-muted/40 p-3 text-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              {attachment.fileName || "Attachment"}
                            </p>
                            <p className="text-xs text-muted-foreground break-all sm:truncate sm:max-w-[240px]">
                              {attachment.fileUrl}
                            </p>
                          </div>
                          {attachment.fileUrl && (
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-xs underline"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="rounded-xl border border-dashed p-3">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-muted/30 p-4 text-center text-sm hover:bg-muted/60">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="font-medium">
                        Upload files from device
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, image, design file, document or screenshot
                      </span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleDetailFileUpload(e.target.files);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={newAttachment.fileName}
                      onChange={(e) =>
                        setNewAttachment({
                          ...newAttachment,
                          fileName: e.target.value,
                        })
                      }
                      placeholder="File name"
                    />
                    <Input
                      value={newAttachment.fileUrl}
                      onChange={(e) =>
                        setNewAttachment({
                          ...newAttachment,
                          fileUrl: e.target.value,
                        })
                      }
                      placeholder="File URL"
                    />
                  </div>
                  <Button
                    onClick={handleAddAttachment}
                    disabled={
                      actionLoading === selectedWork.id ||
                      (!newAttachment.fileName && !newAttachment.fileUrl)
                    }
                  >
                    {actionLoading === selectedWork.id && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Add Link Attachment
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Work Timeline
                </h3>
                {(selectedWork.timeline || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Timeline will appear after backend activity logs are
                    enabled.
                  </p>
                )}
                {(selectedWork.timeline || []).map(
                  (item: TimelineItem, index: number) => (
                    <div key={index} className="flex gap-3 border-l pl-4 pb-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 -ml-[21px]" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString("en-IN")
                            : ""}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
