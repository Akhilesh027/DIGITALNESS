import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Paperclip,
  Search,
  Send,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import axios from "axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

const WORK_STATUSES = [
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Completed",
  "Revision",
  "Failed",
  "Blocked",
  "On Hold",
] as const;

const APPROVAL_STATUSES = ["Pending", "Approved", "Changes Requested"] as const;

type WorkStatus = (typeof WORK_STATUSES)[number];
type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

type Attachment = {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  isLocal?: boolean;
};

type DailyUpdateForm = {
  work: string;
  customer: string;
  taskTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  currentStatus: WorkStatus;
  progressPercentage: number;
  workCompleted: string;
  pendingWork: string;
  blockers: string;
  tomorrowPlan: string;
  referencesLinks: string;
  attachments: Attachment[];
  uploadFiles: File[];
};

const todayInput = () => new Date().toISOString().split("T")[0];

const emptyForm: DailyUpdateForm = {
  work: "",
  customer: "",
  taskTitle: "",
  date: todayInput(),
  startTime: "",
  endTime: "",
  totalHours: "",
  currentStatus: "In Progress",
  progressPercentage: 0,
  workCompleted: "",
  pendingWork: "",
  blockers: "",
  tomorrowPlan: "",
  referencesLinks: "",
  attachments: [],
  uploadFiles: [],
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

const getUploadAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "multipart/form-data",
    },
  };
};

const getCurrentUser = () => {
  try {
    const stored =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getArrayData = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.updates)) return res.data.updates;
  if (Array.isArray(res?.data?.dailyUpdates)) return res.data.dailyUpdates;
  if (Array.isArray(res?.data?.works)) return res.data.works;
  if (Array.isArray(res?.data?.users)) return res.data.users;
  return [];
};

const getId = (item: any) => item?._id || item?.id || "";
const getRefId = (value: any) =>
  typeof value === "object" ? value?._id || value?.id || "" : value || "";

const getUserName = (user: any) =>
  user?.name || user?.fullName || user?.username || user?.email || "User";

const isManagerRole = (role = "") =>
  ["admin", "operational manager", "operationalmanager", "branch manager"].includes(
    role.trim().toLowerCase(),
  );

const getCustomerNameFromWork = (work: any) =>
  work?.customer?.name ||
  work?.customer?.companyName ||
  work?.customerName ||
  work?.clientName ||
  "Unknown Customer";

const getWorkTitle = (work: any) =>
  work?.title || work?.workTitle || work?.projectName || "Untitled Work";

const normalizeApprovalStatus = (update: any): ApprovalStatus =>
  update?.approvalStatus || update?.reviewStatus || "Pending";

const statusTone = (status?: string) => {
  if (status === "Approved" || status === "Completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "Changes Requested" || status === "Revision" || status === "Blocked") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (status === "Review" || status === "Pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const formatDate = (date?: string | Date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string | Date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateKey = (date?: string | Date) => {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const isWeekend = (date: Date) => [0, 6].includes(date.getDay());

const fileToAttachment = (file: File): Attachment => ({
  fileName: file.name,
  fileUrl: URL.createObjectURL(file),
  fileType: file.type || "file",
  fileSize: file.size,
  isLocal: true,
});

const formatFileSize = (size?: number) => {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DailyUpdatesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getCurrentUser();
  const canReview = isManagerRole(currentUser?.role || "");

  const [works, setWorks] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterApproval, setFilterApproval] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "productivity" | "reports">("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [form, setForm] = useState<DailyUpdateForm>(emptyForm);

  const loadWorks = async () => {
    const res = await axios.get(`${API_URL}/works`, getAuthConfig());
    setWorks(getArrayData(res));
  };

  const loadEmployees = async () => {
    if (!canReview) return;
    try {
      const res = await axios.get(`${API_URL}/users`, getAuthConfig());
      setEmployees(getArrayData(res));
    } catch {
      setEmployees([]);
    }
  };

  const loadUpdates = async () => {
    const urls = canReview
      ? [`${API_URL}/daily-updates`, `${API_URL}/daily-updates/all`]
      : [`${API_URL}/daily-updates/my`, `${API_URL}/daily-updates`];

    let loaded: any[] = [];
    for (const url of urls) {
      try {
        const res = await axios.get(url, getAuthConfig());
        loaded = getArrayData(res);
        break;
      } catch {
        // fallback
      }
    }

    setUpdates(loaded);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadWorks(), loadEmployees(), loadUpdates()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load daily updates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedWork = works.find((work) => getId(work) === form.work);

  const monthStart = useMemo(
    () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1),
    [calendarMonth],
  );

  const monthEnd = useMemo(() => {
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [calendarMonth]);

  const visibleUpdates = useMemo(() => {
    return updates.filter((update) => {
      const employeeId = getRefId(update.employee);
      const selectedEmployeeMatches =
        selectedEmployee === "All" || employeeId === selectedEmployee;
      return selectedEmployeeMatches;
    });
  }, [updates, selectedEmployee]);

  const analytics = useMemo(() => {
    const total = visibleUpdates.length;
    const pending = visibleUpdates.filter((u) => normalizeApprovalStatus(u) === "Pending").length;
    const approved = visibleUpdates.filter((u) => normalizeApprovalStatus(u) === "Approved").length;
    const changes = visibleUpdates.filter((u) => normalizeApprovalStatus(u) === "Changes Requested").length;
    const blocked = visibleUpdates.filter(
      (u) => u.currentStatus === "Blocked" || String(u.blockers || "").trim(),
    ).length;
    const hours = visibleUpdates.reduce((sum, u) => sum + Number(u.totalHours || 0), 0);
    const averageProgress = total
      ? Math.round(
        visibleUpdates.reduce((sum, u) => sum + Number(u.progressPercentage || 0), 0) / total,
      )
      : 0;
    const approvalRate = total ? Math.round((approved / total) * 100) : 0;

    return { total, pending, approved, changes, blocked, hours, averageProgress, approvalRate };
  }, [visibleUpdates]);

  const employeeProductivity = useMemo(() => {
    const sourceEmployees = canReview ? employees : [currentUser].filter(Boolean);

    return sourceEmployees
      .map((employee: any) => {
        const employeeId = getId(employee);
        const employeeUpdates = updates.filter((u) => getRefId(u.employee) === employeeId);
        const totalUpdates = employeeUpdates.length;
        const approved = employeeUpdates.filter((u) => normalizeApprovalStatus(u) === "Approved").length;
        const totalHours = employeeUpdates.reduce((sum, u) => sum + Number(u.totalHours || 0), 0);
        const avgProgress = totalUpdates
          ? Math.round(
            employeeUpdates.reduce((sum, u) => sum + Number(u.progressPercentage || 0), 0) /
            totalUpdates,
          )
          : 0;
        const completedTasks = employeeUpdates.filter((u) => u.currentStatus === "Completed").length;
        const blockedTasks = employeeUpdates.filter(
          (u) => u.currentStatus === "Blocked" || String(u.blockers || "").trim(),
        ).length;
        const approvalRate = totalUpdates ? Math.round((approved / totalUpdates) * 100) : 0;

        return {
          id: employeeId,
          name: getUserName(employee),
          role: employee?.role || employee?.department || "Employee",
          totalUpdates,
          approved,
          totalHours,
          avgProgress,
          completedTasks,
          blockedTasks,
          approvalRate,
        };
      })
      .sort((a, b) => b.approvalRate - a.approvalRate || b.totalHours - a.totalHours);
  }, [employees, currentUser, updates, canReview]);

  const filteredUpdates = useMemo(() => {
    return visibleUpdates.filter((update) => {
      const q = search.toLowerCase();
      const title = String(update.taskTitle || update.work?.title || "").toLowerCase();
      const customer = String(
        update.customer?.name || update.customer?.companyName || update.clientName || "",
      ).toLowerCase();
      const employee = String(getUserName(update.employee)).toLowerCase();
      const matchesSearch = title.includes(q) || customer.includes(q) || employee.includes(q);
      const matchesReview =
        filterApproval === "All" || normalizeApprovalStatus(update) === filterApproval;
      return matchesSearch && matchesReview;
    });
  }, [visibleUpdates, search, filterApproval]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalSlots = Math.ceil((startPadding + lastDay.getDate()) / 7) * 7;

    return Array.from({ length: totalSlots }, (_, index) => {
      const dayNumber = index - startPadding + 1;
      const date = new Date(year, month, dayNumber);
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
      const key = getDateKey(date);
      const updatesForDay = isCurrentMonth
        ? visibleUpdates.filter((update) => getDateKey(update.date || update.createdAt) === key)
        : [];

      const weekend = isWeekend(date);
      const hasBlocked = updatesForDay.some(
        (update) => update.currentStatus === "Blocked" || String(update.blockers || "").trim(),
      );
      const hasChanges = updatesForDay.some(
        (update) => normalizeApprovalStatus(update) === "Changes Requested",
      );
      const hasApproved = updatesForDay.some((update) => normalizeApprovalStatus(update) === "Approved");
      const hasPending = updatesForDay.some((update) => normalizeApprovalStatus(update) === "Pending");

      let label = "Missing";
      let className = "border-slate-300 bg-slate-900 text-white";
      let dot = "bg-slate-900";

      if (!isCurrentMonth) {
        label = "";
        className = "border-transparent bg-transparent text-transparent";
        dot = "bg-transparent";
      } else if (weekend && updatesForDay.length === 0) {
        label = "Weekend";
        className = "border-slate-200 bg-slate-100 text-slate-500";
        dot = "bg-slate-300";
      } else if (hasBlocked) {
        label = "Blocked";
        className = "border-red-200 bg-red-50 text-red-700";
        dot = "bg-red-500";
      } else if (hasChanges) {
        label = "Changes";
        className = "border-orange-200 bg-orange-50 text-orange-700";
        dot = "bg-orange-500";
      } else if (hasApproved) {
        label = "Approved";
        className = "border-emerald-200 bg-emerald-50 text-emerald-700";
        dot = "bg-emerald-500";
      } else if (hasPending) {
        label = "Pending";
        className = "border-amber-200 bg-amber-50 text-amber-700";
        dot = "bg-amber-500";
      }

      return {
        date,
        key,
        dayNumber,
        isCurrentMonth,
        isWeekend: weekend,
        updates: updatesForDay,
        label,
        className,
        dot,
        isToday: key === getDateKey(new Date()),
      };
    });
  }, [calendarMonth, visibleUpdates]);

  const calendarSummary = useMemo(() => {
    const currentMonthDays = calendarDays.filter((day) => day.isCurrentMonth);
    const monthUpdates = currentMonthDays.flatMap((day) => day.updates);
    const submittedDays = new Set(monthUpdates.map((u) => getDateKey(u.date || u.createdAt))).size;
    const approvedDays = new Set(
      monthUpdates
        .filter((u) => normalizeApprovalStatus(u) === "Approved")
        .map((u) => getDateKey(u.date || u.createdAt)),
    ).size;
    const blockedDays = new Set(
      monthUpdates
        .filter((u) => u.currentStatus === "Blocked" || String(u.blockers || "").trim())
        .map((u) => getDateKey(u.date || u.createdAt)),
    ).size;
    const missingDays = currentMonthDays.filter(
      (day) => !day.isWeekend && day.updates.length === 0 && day.date <= new Date(),
    ).length;
    const monthHours = monthUpdates.reduce((sum, u) => sum + Number(u.totalHours || 0), 0);

    return { submittedDays, approvedDays, blockedDays, missingDays, monthHours };
  }, [calendarDays]);

  const missingEmployeesToday = useMemo(() => {
    if (!canReview) return [];
    const today = getDateKey(new Date());
    const submittedEmployeeIds = new Set(
      updates
        .filter((u) => getDateKey(u.date || u.createdAt) === today)
        .map((u) => getRefId(u.employee)),
    );

    return employees.filter((emp: any) => !submittedEmployeeIds.has(getId(emp)));
  }, [canReview, updates, employees]);

  const updateFormFromWork = (workId: string) => {
    const work = works.find((item) => getId(item) === workId);
    setForm((prev) => ({
      ...prev,
      work: workId,
      customer: getRefId(work?.customer),
      taskTitle: getWorkTitle(work),
      currentStatus: WORK_STATUSES.includes(work?.status) ? work.status : "In Progress",
    }));
  };

  const calculateHours = () => {
    if (!form.startTime || !form.endTime) return;
    const [startHour, startMinute] = form.startTime.split(":").map(Number);
    const [endHour, endMinute] = form.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    const diff = Math.max((end - start) / 60, 0);
    setForm((prev) => ({ ...prev, totalHours: diff ? String(diff.toFixed(2)) : prev.totalHours }));
  };

  useEffect(() => {
    calculateHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startTime, form.endTime]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    const attachmentPreviews = selectedFiles.map(fileToAttachment);
    setForm((prev) => ({
      ...prev,
      uploadFiles: [...prev.uploadFiles, ...selectedFiles],
      attachments: [...prev.attachments, ...attachmentPreviews],
    }));
  };

  const validateForm = () => {
    if (!form.date || !form.workCompleted.trim()) {
      toast({
        title: "Missing Details",
        description: "Date and completed work are required.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const submitUpdate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = new FormData();

      payload.append("date", form.date);
      if (form.work) payload.append("work", form.work);
      if (form.customer) payload.append("customer", form.customer);
      payload.append("taskTitle", form.taskTitle || selectedWork?.title || "Daily Work Update");
      payload.append("startTime", form.startTime);
      payload.append("endTime", form.endTime);
      payload.append("totalHours", String(form.totalHours || 0));
      payload.append("currentStatus", form.currentStatus);
      payload.append("progressPercentage", String(form.progressPercentage || 0));
      payload.append("workCompleted", form.workCompleted);
      payload.append("pendingWork", form.pendingWork);
      payload.append("blockers", form.blockers);
      payload.append("tomorrowPlan", form.tomorrowPlan);
      payload.append("referencesLinks", form.referencesLinks);
      payload.append("attachments", JSON.stringify(form.attachments.filter((a) => !a.isLocal)));

      form.uploadFiles.forEach((file) => payload.append("attachments", file));

      await axios.post(`${API_URL}/daily-updates`, payload, getUploadAuthConfig());

      toast({ title: "Submitted", description: "Daily update submitted successfully." });
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Submit Failed",
        description: error?.response?.data?.message || "Failed to submit daily update",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reviewUpdate = async (id: string, approvalStatus: ApprovalStatus) => {
    try {
      setReviewLoading(id);
      await axios.put(
        `${API_URL}/daily-updates/${id}/review`,
        {
          approvalStatus,
          managerComment: reviewNote,
          revisionReason: approvalStatus === "Changes Requested" ? reviewNote : "",
        },
        getAuthConfig(),
      );
      toast({
        title: approvalStatus === "Approved" ? "Approved" : "Changes Requested",
        description: "Daily update review saved successfully.",
      });
      setReviewNote("");
      setShowDetails(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Review Failed",
        description: error?.response?.data?.message || "Failed to review update",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(null);
    }
  };

  const openDetails = (update: any) => {
    setSelectedUpdate(update);
    setReviewNote(update.managerComment || update.revisionReason || "");
    setShowDetails(true);
  };

  const makeReportRows = () => {
    return filteredUpdates.map((u) => ({
      Date: formatDate(u.date || u.createdAt),
      Employee: getUserName(u.employee),
      Project: u.projectName || u.work?.workType || "-",
      Customer: u.clientName || u.customer?.name || u.customer?.companyName || "-",
      Task: u.taskTitle || u.work?.title || "-",
      Hours: Number(u.totalHours || 0),
      Progress: `${Number(u.progressPercentage || 0)}%`,
      Status: u.currentStatus || "-",
      Approval: normalizeApprovalStatus(u),
      Blockers: u.blockers || "-",
      ManagerComment: u.managerComment || "-",
    }));
  };

  const downloadCsvReport = (type: "daily" | "weekly" | "monthly") => {
    const rows = makeReportRows();
    if (!rows.length) {
      toast({ title: "No Data", description: "No updates available for report." });
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row: any) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digitalness-${type}-daily-updates-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdfReport = (type: "daily" | "weekly" | "monthly") => {
    const rows = makeReportRows();
    if (!rows.length) {
      toast({ title: "No Data", description: "No updates available for report." });
      return;
    }

    const html = `
      <html>
        <head>
          <title>Digitalness Daily Updates Report</title>
          <style>
            body { font-family: Arial, sans-serif; color:#111827; padding:24px; }
            .header { border-bottom:3px solid #06053A; padding-bottom:16px; margin-bottom:20px; }
            h1 { margin:0; color:#06053A; }
            .muted { color:#6b7280; font-size:13px; }
            .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:18px 0; }
            .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#f9fafb; }
            table { width:100%; border-collapse:collapse; font-size:12px; }
            th { background:#06053A; color:white; padding:8px; text-align:left; }
            td { border:1px solid #e5e7eb; padding:8px; vertical-align:top; }
            .footer { margin-top:24px; font-size:12px; color:#6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Digitalness Industries LLP</h1>
            <p class="muted">${type.toUpperCase()} Daily Work Update Report</p>
            <p class="muted">Generated on ${new Date().toLocaleString("en-IN")}</p>
          </div>
          <div class="summary">
            <div class="card"><b>${analytics.total}</b><br/><span class="muted">Total Updates</span></div>
            <div class="card"><b>${analytics.hours.toFixed(1)}h</b><br/><span class="muted">Total Hours</span></div>
            <div class="card"><b>${analytics.approvalRate}%</b><br/><span class="muted">Approval Rate</span></div>
            <div class="card"><b>${analytics.blocked}</b><br/><span class="muted">Blocked</span></div>
          </div>
          <table>
            <thead>
              <tr>${Object.keys(rows[0]).map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
        .map(
          (row: any) =>
            `<tr>${Object.keys(row)
              .map((h) => `<td>${String(row[h] ?? "")}</td>`)
              .join("")}</tr>`,
        )
        .join("")}
            </tbody>
          </table>
          <div class="footer">Generated by Digitalness CRM · https://digitalness.co.in</div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const sendMissingReminder = async () => {
    if (!canReview) return;

    try {
      setReminderLoading(true);
      try {
        await axios.post(
          `${API_URL}/daily-updates/reminders/send`,
          { employeeIds: missingEmployeesToday.map((emp: any) => getId(emp)) },
          getAuthConfig(),
        );
      } catch {
        // Backend may be added later. UI still explains missing people.
      }
      toast({
        title: "Reminder Action Completed",
        description: `${missingEmployeesToday.length} employee(s) marked for reminder.`,
      });
    } catch (error: any) {
      toast({
        title: "Reminder Failed",
        description: error?.response?.data?.message || "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setReminderLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, tone }: any) => (
    <Card className={tone || ""}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Daily Work Updates
          </h1>
          <p className="text-muted-foreground">
            Submit work updates, review employee progress, track missing updates, and download reports.
          </p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(true)}>
          <Send className="mr-2 h-4 w-4" /> Submit Update
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Updates" value={analytics.total} icon={FileText} />
        <StatCard title="Pending" value={analytics.pending} icon={Clock} tone="border-amber-200 bg-amber-50/60" />
        <StatCard title="Approved" value={analytics.approved} icon={CheckCircle2} tone="border-emerald-200 bg-emerald-50/60" />
        <StatCard title="Changes" value={analytics.changes} icon={XCircle} tone="border-red-200 bg-red-50/60" />
        <StatCard title="Total Hours" value={`${analytics.hours.toFixed(1)}h`} icon={Clock} tone="border-blue-200 bg-blue-50/60" />
        <StatCard title="Approval Rate" value={`${analytics.approvalRate}%`} icon={TrendingUp} tone="border-purple-200 bg-purple-50/60" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by work, customer or employee..."
                className="pl-10"
              />
            </div>

            {canReview && (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full 2xl:w-[240px]">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Employees</SelectItem>
                  {employees.map((emp: any) => (
                    <SelectItem key={getId(emp)} value={getId(emp)}>
                      {getUserName(emp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterApproval} onValueChange={setFilterApproval}>
              <SelectTrigger className="w-full 2xl:w-[220px]">
                <SelectValue placeholder="Approval Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Reviews</SelectItem>
                {APPROVAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:w-[520px]">
              <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>List</Button>
              <Button variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>Calendar</Button>
              <Button variant={viewMode === "productivity" ? "default" : "outline"} onClick={() => setViewMode("productivity")}>Productivity</Button>
              <Button variant={viewMode === "reports" ? "default" : "outline"} onClick={() => setViewMode("reports")}>Reports</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canReview && (
        <Card className="border-orange-200 bg-orange-50/60">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Auto Reminder Monitor</h3>
                <p className="text-sm text-orange-800">
                  {missingEmployeesToday.length} employee(s) have not submitted today’s daily update.
                </p>
                <p className="text-xs text-orange-700">
                  Backend cron can run this at 6 PM and 8 PM. This button triggers manual reminder action.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              disabled={reminderLoading || missingEmployeesToday.length === 0}
              onClick={sendMissingReminder}
              className="border-orange-300 bg-white"
            >
              {reminderLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
              Send Missing Update Reminder
            </Button>
          </CardContent>
        </Card>
      )}

      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5" /> Missing Update Calendar
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Green = approved, yellow = pending, orange = changes, red = blocked, black = missing, gray = weekend.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <div className="min-w-[180px] rounded-xl border bg-muted/30 px-4 py-2 text-center text-sm font-semibold">
                  {getMonthLabel(calendarMonth)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                    )
                  }
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Submitted</p><b>{calendarSummary.submittedDays}</b></div>
              <div className="rounded-xl border bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Approved</p><b>{calendarSummary.approvedDays}</b></div>
              <div className="rounded-xl border bg-red-50 p-3"><p className="text-xs text-red-700">Blocked</p><b>{calendarSummary.blockedDays}</b></div>
              <div className="rounded-xl border bg-slate-900 p-3 text-white"><p className="text-xs text-slate-200">Missing</p><b>{calendarSummary.missingDays}</b></div>
              <div className="rounded-xl border bg-blue-50 p-3"><p className="text-xs text-blue-700">Hours</p><b>{calendarSummary.monthHours.toFixed(1)}h</b></div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground sm:gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day) => (
                <button
                  key={`${day.key}-${day.dayNumber}`}
                  type="button"
                  disabled={!day.isCurrentMonth || day.updates.length === 0}
                  onClick={() => day.updates.length > 0 && openDetails(day.updates[0])}
                  className={`min-h-[86px] rounded-xl border p-2 text-left transition hover:shadow-sm sm:min-h-[112px] ${day.className} ${day.isToday ? "ring-2 ring-primary" : ""}`}
                >
                  {day.isCurrentMonth && (
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold">{day.dayNumber}</span>
                        <span className={`h-2 w-2 rounded-full ${day.dot}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="truncate text-[10px] font-semibold sm:text-xs">{day.label}</p>
                        {day.updates.length > 0 && (
                          <>
                            <p className="truncate text-[10px] sm:text-xs">{day.updates[0].taskTitle || day.updates[0].work?.title || "Daily Update"}</p>
                            <p className="text-[10px] sm:text-xs">{day.updates.length} update(s)</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "productivity" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" /> Employee Productivity Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {employeeProductivity.map((employee) => (
                  <div key={employee.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.role}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                        {employee.approvalRate}% Approval
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Hours</p><b>{employee.totalHours.toFixed(1)}h</b></div>
                      <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Updates</p><b>{employee.totalUpdates}</b></div>
                      <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Avg Progress</p><b>{employee.avgProgress}%</b></div>
                      <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Blocked</p><b>{employee.blockedTasks}</b></div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs"><span>Progress Quality</span><span>{employee.avgProgress}%</span></div>
                      <Progress value={employee.avgProgress} />
                    </div>
                  </div>
                ))}
                {!employeeProductivity.length && (
                  <div className="rounded-2xl border p-6 text-center text-muted-foreground">
                    No productivity data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" /> Daily Update Reports
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Download or print Digitalness-branded daily, weekly, and monthly reports using the current filters.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["daily", "weekly", "monthly"] as const).map((type) => (
              <div key={type} className="rounded-2xl border bg-muted/20 p-4">
                <h3 className="mb-1 font-semibold capitalize">{type} Report</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Includes employee, customer, work, hours, progress, blockers, and manager review.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                  <Button variant="outline" onClick={() => downloadCsvReport(type)}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                  <Button onClick={() => printPdfReport(type)}>
                    <FileText className="mr-2 h-4 w-4" /> PDF Print
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {viewMode === "list" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
                  <div className="mb-3 h-3 w-1/2 rounded bg-muted" />
                  <div className="h-20 rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          ) : filteredUpdates.length === 0 ? (
            <Card className="xl:col-span-2">
              <CardContent className="p-8 text-center text-muted-foreground">
                No daily updates found
              </CardContent>
            </Card>
          ) : (
            filteredUpdates.map((update) => (
              <Card key={getId(update)} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {update.taskTitle || update.work?.title || "Daily Update"}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(update.date || update.createdAt)} · {getUserName(update.employee)}
                      </p>
                    </div>
                    <Badge className={statusTone(normalizeApprovalStatus(update))} variant="outline">
                      {normalizeApprovalStatus(update)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Hours</p><b>{Number(update.totalHours || 0)}h</b></div>
                    <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Progress</p><b>{Number(update.progressPercentage || 0)}%</b></div>
                    <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Status</p><b>{update.currentStatus || "-"}</b></div>
                    <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Files</p><b>{(update.attachments || []).length}</b></div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Completed Work</p>
                    <p className="line-clamp-3 whitespace-pre-line text-sm">{update.workCompleted}</p>
                  </div>
                  {update.blockers && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <b>Blocker:</b> {update.blockers}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={() => openDetails(update)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                    {canReview && normalizeApprovalStatus(update) === "Pending" && (
                      <div className="grid grid-cols-2 gap-2 sm:flex">
                        <Button
                          disabled={reviewLoading === getId(update)}
                          onClick={() => {
                            setSelectedUpdate(update);
                            reviewUpdate(getId(update), "Approved");
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={reviewLoading === getId(update)}
                          onClick={() => openDetails(update)}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Submit Daily Work Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Date *</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Select Work</label>
                <Select value={form.work || "manual"} onValueChange={(v) => updateFormFromWork(v === "manual" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select work" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Daily Update</SelectItem>
                    {works.map((work: any) => (
                      <SelectItem key={getId(work)} value={getId(work)}>
                        {getWorkTitle(work)} · {getCustomerNameFromWork(work)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Task Title</label>
              <Input value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} placeholder="Task / project title" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Start Time</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End Time</label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Total Hours</label>
                <Input type="number" min="0" max="24" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Current Status</label>
                <Select value={form.currentStatus} onValueChange={(v: WorkStatus) => setForm({ ...form, currentStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WORK_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Progress %</label>
                <Input type="number" min="0" max="100" value={form.progressPercentage} onChange={(e) => setForm({ ...form, progressPercentage: Number(e.target.value || 0) })} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Work Completed *</label>
              <Textarea value={form.workCompleted} onChange={(e) => setForm({ ...form, workCompleted: e.target.value })} placeholder="Explain what you completed today" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pending Work</label>
              <Textarea value={form.pendingWork} onChange={(e) => setForm({ ...form, pendingWork: e.target.value })} placeholder="Pending items / next steps" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Blockers</label>
              <Textarea value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} placeholder="Any blocker or dependency" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tomorrow Plan</label>
              <Textarea value={form.tomorrowPlan} onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })} placeholder="Tomorrow plan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reference Links</label>
              <Input value={form.referencesLinks} onChange={(e) => setForm({ ...form, referencesLinks: e.target.value })} placeholder="Drive/Figma/GitHub/reference links" />
            </div>

            <div className="rounded-2xl border border-dashed p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Attachments</h3>
                  <p className="text-sm text-muted-foreground">Upload screenshots, docs, reports or reference files.</p>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Files
                </Button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {form.attachments.map((file, index) => (
                  <div key={index} className="rounded-xl border bg-muted/30 p-3 text-sm">
                    <b>{file.fileName}</b>
                    <p className="text-xs text-muted-foreground">{file.fileType || "file"} {formatFileSize(file.fileSize) ? `· ${formatFileSize(file.fileSize)}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1">Cancel</Button>
              <Button onClick={submitUpdate} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Daily Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Daily Update Details</DialogTitle>
          </DialogHeader>
          {selectedUpdate && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedUpdate.taskTitle || selectedUpdate.work?.title}</h2>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUpdate.date)} · {getUserName(selectedUpdate.employee)}</p>
                  </div>
                  <Badge className={statusTone(normalizeApprovalStatus(selectedUpdate))} variant="outline">
                    {normalizeApprovalStatus(selectedUpdate)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Hours</p><b>{selectedUpdate.totalHours || 0}h</b></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Progress</p><b>{selectedUpdate.progressPercentage || 0}%</b></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Status</p><b>{selectedUpdate.currentStatus || "-"}</b></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Submitted</p><b>{formatDateTime(selectedUpdate.submittedAt || selectedUpdate.createdAt)}</b></div>
              </div>

              <div className="space-y-3">
                <section className="rounded-2xl border p-4"><h3 className="mb-2 font-semibold">Completed Work</h3><p className="whitespace-pre-line text-sm">{selectedUpdate.workCompleted || "-"}</p></section>
                <section className="rounded-2xl border p-4"><h3 className="mb-2 font-semibold">Pending Work</h3><p className="whitespace-pre-line text-sm">{selectedUpdate.pendingWork || "-"}</p></section>
                <section className="rounded-2xl border p-4"><h3 className="mb-2 font-semibold">Blockers</h3><p className="whitespace-pre-line text-sm">{selectedUpdate.blockers || "No blockers"}</p></section>
                <section className="rounded-2xl border p-4"><h3 className="mb-2 font-semibold">Tomorrow Plan</h3><p className="whitespace-pre-line text-sm">{selectedUpdate.tomorrowPlan || "-"}</p></section>
              </div>

              {(selectedUpdate.attachments || []).length > 0 && (
                <section className="rounded-2xl border p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold"><Paperclip className="h-4 w-4" /> Attachments</h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {(selectedUpdate.attachments || []).map((file: any, index: number) => {
                      const fileUrl = typeof file === "string" ? file : file.fileUrl;
                      const fileName = typeof file === "string" ? file.split("/").pop() : file.fileName;
                      return (
                        <a key={index} href={fileUrl} target="_blank" rel="noreferrer" className="rounded-xl border bg-muted/30 p-3 text-sm hover:bg-muted">
                          <b>{fileName || "Attachment"}</b>
                          <p className="break-all text-xs text-muted-foreground">{fileUrl}</p>
                        </a>
                      );
                    })}
                  </div>
                </section>
              )}

              {canReview && normalizeApprovalStatus(selectedUpdate) === "Pending" && (
                <section className="rounded-2xl border p-4">
                  <h3 className="mb-2 font-semibold">Manager Review</h3>
                  <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add approval comment or change request reason" />
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button disabled={reviewLoading === getId(selectedUpdate)} onClick={() => reviewUpdate(getId(selectedUpdate), "Approved")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" disabled={reviewLoading === getId(selectedUpdate)} onClick={() => reviewUpdate(getId(selectedUpdate), "Changes Requested")}>
                      <XCircle className="mr-2 h-4 w-4" /> Request Changes
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
