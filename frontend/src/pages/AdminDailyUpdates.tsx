// pages/AdminDailyUpdates.tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Timer,
  TrendingUp,
  Users,
  UploadCloud,
  Plus,
  X,
} from "lucide-react";
import axios from "axios";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";
const SERVER_URL = API_URL.replace("/api", "");

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
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

type ReviewAction = "Approved" | "Changes Requested";
type TabValue = "pending" | "reviewed" | "all" | "timeline" | "analytics";

type DailyUpdate = {
  _id: string;
  employee?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  work?: {
    _id?: string;
    title?: string;
    workType?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  };
  customer?: {
    _id?: string;
    name?: string;
    businessName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  date?: string;
  projectName?: string;
  clientName?: string;
  workCategory?: string;
  taskTitle?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  currentStatus?: string;
  progressPercentage?: number;
  workCompleted?: string;
  pendingWork?: string;
  blockers?: string;
  tomorrowPlan?: string;
  referencesLinks?: string;
  attachments?: string[];
  approvalStatus?: "Pending" | "Approved" | "Changes Requested";
  managerComment?: string;
  revisionReason?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type WorkOption = {
  _id: string;
  title?: string;
  workType?: string;
  status?: string;
  priority?: string;
  customer?: {
    _id?: string;
    name?: string;
    companyName?: string;
    businessType?: string;
  };
};

type DailyUpdateForm = {
  work: string;
  date: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  currentStatus: string;
  progressPercentage: string;
  workCompleted: string;
  pendingWork: string;
  blockers: string;
  tomorrowPlan: string;
  referencesLinks: string;
  attachments: string[];
};

const emptyDailyUpdateForm: DailyUpdateForm = {
  work: "",
  date: format(new Date(), "yyyy-MM-dd"),
  taskTitle: "",
  startTime: "",
  endTime: "",
  totalHours: "",
  currentStatus: "In Progress",
  progressPercentage: "0",
  workCompleted: "",
  pendingWork: "",
  blockers: "",
  tomorrowPlan: "",
  referencesLinks: "",
  attachments: [],
};

const getInitial = (name?: string) => name?.charAt(0)?.toUpperCase() || "E";

const safeDate = (date?: string, pattern = "dd MMM yyyy") => {
  if (!date) return "—";

  try {
    return format(new Date(date), pattern);
  } catch {
    return "—";
  }
};

const getAttachmentUrl = (file: string) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${SERVER_URL}${file}`;
};

const isImageFile = (file: string) =>
  /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file);

const getEmployeeName = (update: DailyUpdate) =>
  update.employee?.name || "Unknown Employee";

const getEmployeeRole = (update: DailyUpdate) =>
  update.employee?.role || "Employee";

const getProjectName = (update: DailyUpdate) =>
  update.projectName || update.work?.workType || "—";

const getTaskTitle = (update: DailyUpdate) =>
  update.taskTitle || update.work?.title || "Untitled Task";

const getClientName = (update: DailyUpdate) =>
  update.clientName ||
  update.customer?.name ||
  update.customer?.businessName ||
  update.customer?.companyName ||
  "—";

export default function AdminDailyUpdates() {
  const { toast } = useToast();

  const currentUser = getCurrentUser();
  const currentUserRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();

  const canReviewUpdates =
    currentUserRole === "admin" ||
    currentUserRole === "operational manager" ||
    currentUserRole === "operationalmanager" ||
    currentUserRole === "branch manager";

  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<ReviewAction>("Approved");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>(
    canReviewUpdates ? "pending" : "all"
  );

  const [works, setWorks] = useState<WorkOption[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(!canReviewUpdates);
  const [dailyForm, setDailyForm] = useState<DailyUpdateForm>(
    emptyDailyUpdateForm
  );

  const fetchUpdates = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const res = await axios.get(`${API_URL}/daily-updates`, getAuthConfig());
      const data = res.data?.data || res.data?.updates || res.data || [];

      setUpdates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch updates error:", error?.response?.data || error);

      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to fetch daily updates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWorks = async () => {
    try {
      const res = await axios.get(`${API_URL}/works`, getAuthConfig());
      const data = res.data?.data || res.data?.works || res.data || [];
      setWorks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch works error:", error?.response?.data || error);
    }
  };

  useEffect(() => {
    fetchUpdates();
    fetchWorks();
  }, []);

  const employees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    updates.forEach((update) => {
      const employee = update.employee;

      if (employee?._id && employee?.name) {
        map.set(employee._id, {
          id: employee._id,
          name: employee.name,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    return updates.filter((update) => {
      const employeeName = getEmployeeName(update).toLowerCase();
      const projectName = getProjectName(update).toLowerCase();
      const taskTitle = getTaskTitle(update).toLowerCase();
      const clientName = getClientName(update).toLowerCase();
      const workCategory = String(update.workCategory || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        projectName.includes(search) ||
        taskTitle.includes(search) ||
        clientName.includes(search) ||
        workCategory.includes(search);

      const matchesStatus =
        statusFilter === "All" || update.approvalStatus === statusFilter;

      const matchesEmployee =
        employeeFilter === "All" || getEmployeeName(update) === employeeFilter;

      const matchesDate =
        !dateFilter ||
        (update.date && format(new Date(update.date), "yyyy-MM-dd") === dateFilter);

      const matchesTab =
        activeTab === "pending"
          ? update.approvalStatus === "Pending"
          : activeTab === "reviewed"
            ? update.approvalStatus !== "Pending"
            : true;

      return matchesSearch && matchesStatus && matchesEmployee && matchesDate && matchesTab;
    });
  }, [updates, searchTerm, statusFilter, employeeFilter, dateFilter, activeTab]);

  const stats = useMemo(() => {
    const pending = updates.filter((u) => u.approvalStatus === "Pending").length;
    const approved = updates.filter((u) => u.approvalStatus === "Approved").length;
    const changes = updates.filter(
      (u) => u.approvalStatus === "Changes Requested"
    ).length;
    const totalHours = updates.reduce(
      (sum, u) => sum + Number(u.totalHours || 0),
      0
    );
    const uniqueEmployees = new Set(
      updates.map((u) => u.employee?._id).filter(Boolean)
    ).size;
    const approvalRate = updates.length
      ? Math.round((approved / updates.length) * 100)
      : 0;

    return {
      pending,
      approved,
      changes,
      totalHours,
      uniqueEmployees,
      approvalRate,
      total: updates.length,
    };
  }, [updates]);

  const employeeAnalytics = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        role: string;
        total: number;
        approved: number;
        pending: number;
        changes: number;
        hours: number;
      }
    >();

    updates.forEach((update) => {
      const id = update.employee?._id || getEmployeeName(update);

      const existing =
        map.get(id) || {
          name: getEmployeeName(update),
          role: getEmployeeRole(update),
          total: 0,
          approved: 0,
          pending: 0,
          changes: 0,
          hours: 0,
        };

      existing.total += 1;
      existing.hours += Number(update.totalHours || 0);

      if (update.approvalStatus === "Approved") existing.approved += 1;
      else if (update.approvalStatus === "Changes Requested") existing.changes += 1;
      else existing.pending += 1;

      map.set(id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [updates]);

  const projectAnalytics = useMemo(() => {
    const map = new Map<string, { project: string; total: number; hours: number }>();

    updates.forEach((update) => {
      const project = getProjectName(update);
      const existing = map.get(project) || { project, total: 0, hours: 0 };

      existing.total += 1;
      existing.hours += Number(update.totalHours || 0);

      map.set(project, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [updates]);

  const timelineItems = useMemo(() => {
    return updates
      .flatMap((update) => {
        const items = [
          {
            id: `${update._id}-submitted`,
            date: update.submittedAt || update.createdAt || update.date,
            title: "Daily update submitted",
            description: `${getEmployeeName(update)} submitted update for ${getTaskTitle(
              update
            )}`,
            status: update.approvalStatus || "Pending",
            update,
          },
        ];

        if (update.reviewedAt) {
          items.push({
            id: `${update._id}-reviewed`,
            date: update.reviewedAt,
            title:
              update.approvalStatus === "Approved"
                ? "Update approved"
                : "Changes requested",
            description:
              update.managerComment ||
              update.revisionReason ||
              `${getTaskTitle(update)} was reviewed`,
            status: update.approvalStatus || "Pending",
            update,
          });
        }

        return items;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
  }, [updates]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );

      case "Changes Requested":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
            <RefreshCcw className="mr-1 h-3 w-3" />
            Changes Requested
          </Badge>
        );

      default:
        return (
          <Badge className="border-orange-200 bg-orange-50 text-orange-700">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const openAttachment = (file: string) => {
    const url = getAttachmentUrl(file);
    window.open(url, "_blank");
  };

  const openReviewDialog = (update: DailyUpdate) => {
    setSelectedUpdate(update);
    setReviewComment(update.managerComment || update.revisionReason || "");
    setReviewAction(
      update.approvalStatus === "Changes Requested"
        ? "Changes Requested"
        : "Approved"
    );
  };

  const closeReviewDialog = () => {
    setSelectedUpdate(null);
    setReviewComment("");
    setReviewAction("Approved");
  };

  const handleReview = async () => {
    if (!selectedUpdate) return;

    if (reviewAction === "Changes Requested" && !reviewComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a revision reason before requesting changes.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await axios.put(
        `${API_URL}/daily-updates/${selectedUpdate._id}/review`,
        {
          approvalStatus: reviewAction,
          managerComment: reviewComment,
          revisionReason:
            reviewAction === "Changes Requested" ? reviewComment : "",
        },
        getAuthConfig()
      );

      toast({
        title: "Review submitted",
        description:
          reviewAction === "Approved"
            ? "Daily update approved and employee notification saved."
            : "Changes requested and employee notification saved.",
      });

      closeReviewDialog();
      await fetchUpdates(true);
    } catch (error: any) {
      console.error("Review error:", error?.response?.data || error);

      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedWork = () =>
    works.find((work: any) => work._id === dailyForm.work);

  const updateDailyForm = (key: keyof DailyUpdateForm, value: any) => {
    setDailyForm((prev) => ({ ...prev, [key]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDailyAttachmentUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      const uploaded = await Promise.all(Array.from(files).map(fileToBase64));
      setDailyForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploaded],
      }));

      toast({
        title: "Files Added",
        description: `${uploaded.length} attachment(s) added`,
      });
    } catch {
      toast({
        title: "Upload Error",
        description: "Failed to read selected files",
        variant: "destructive",
      });
    }
  };

  const handleSubmitDailyUpdate = async () => {
    if (!dailyForm.work || !dailyForm.taskTitle || !dailyForm.workCompleted) {
      toast({
        title: "Missing Details",
        description: "Please select work, task title and work description.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitLoading(true);

      const selectedWork = getSelectedWork();

      await axios.post(
        `${API_URL}/daily-updates`,
        {
          work: dailyForm.work,
          customer:
            selectedWork?.customer?._id ||
            (typeof selectedWork?.customer === "string"
              ? selectedWork.customer
              : undefined),
          date: dailyForm.date,
          taskTitle: dailyForm.taskTitle,
          startTime: dailyForm.startTime,
          endTime: dailyForm.endTime,
          totalHours: Number(dailyForm.totalHours || 0),
          currentStatus: dailyForm.currentStatus,
          progressPercentage: Number(dailyForm.progressPercentage || 0),
          workCompleted: dailyForm.workCompleted,
          pendingWork: dailyForm.pendingWork,
          blockers: dailyForm.blockers,
          tomorrowPlan: dailyForm.tomorrowPlan,
          referencesLinks: dailyForm.referencesLinks,
          attachments: dailyForm.attachments,
          projectName: selectedWork?.workType || "",
          clientName:
            selectedWork?.customer?.name ||
            selectedWork?.customer?.companyName ||
            "",
          workCategory: selectedWork?.workType || "General",
        },
        getAuthConfig()
      );

      toast({
        title: "Daily Update Submitted",
        description: "Your work update has been submitted for review.",
      });

      setDailyForm(emptyDailyUpdateForm);
      setShowSubmitForm(!canReviewUpdates);
      await fetchUpdates(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to submit daily update",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setEmployeeFilter("All");
    setDateFilter("");
  };

  const renderUpdateCard = (update: DailyUpdate) => (
    <div key={update._id} className="p-5 transition hover:bg-muted/20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex flex-1 gap-4">
          <Avatar>
            <AvatarFallback>{getInitial(update.employee?.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{getEmployeeName(update)}</span>
              <span className="text-xs text-muted-foreground">
                {getEmployeeRole(update)}
              </span>
              {getStatusBadge(update.approvalStatus)}
              <span className="text-xs text-muted-foreground">
                {safeDate(update.date)}
              </span>
            </div>

            <p className="font-medium">{getTaskTitle(update)}</p>

            <p className="text-sm text-muted-foreground">
              {getProjectName(update)} • {getClientName(update)} •{" "}
              {update.workCategory || "General"}
            </p>

            <p className="line-clamp-2 text-sm">
              {update.workCompleted || "No update provided"}
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {update.totalHours || 0}h
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {update.progressPercentage || 0}% progress
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {update.currentStatus || "—"}
              </span>
              {update.attachments?.length ? (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                  {update.attachments.length} attachment(s)
                </span>
              ) : null}
            </div>

            {update.managerComment && (
              <p className="rounded bg-gray-50 p-2 text-xs">
                📝 {update.managerComment}
              </p>
            )}
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={() => openReviewDialog(update)}>
          <Eye className="mr-1 h-4 w-4" />
          {canReviewUpdates ? "Review" : "View"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Daily Updates Review
            </h1>
            <p className="text-muted-foreground">
              {canReviewUpdates
                ? "Review employee submissions, approve updates, request changes, and track productivity."
                : "Submit your daily updates and track review status."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchUpdates(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Export / Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Changes Requested
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.changes}
                  </p>
                </div>
                <RefreshCcw className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalHours.toFixed(1)}h
                  </p>
                </div>
                <Timer className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approval Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.approvalRate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Submit Daily Work Update</CardTitle>
              <p className="text-sm text-muted-foreground">
                Employees can submit work completed, hours, blockers, tomorrow plan and attachments.
              </p>
            </div>
            {canReviewUpdates && (
              <Button
                variant="outline"
                onClick={() => setShowSubmitForm((prev) => !prev)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {showSubmitForm ? "Hide Form" : "Add Update"}
              </Button>
            )}
          </CardHeader>

          {showSubmitForm && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Select Assigned Work *
                  </label>
                  <Select
                    value={dailyForm.work}
                    onValueChange={(value) => {
                      const selected = works.find((work: any) => work._id === value);
                      setDailyForm((prev) => ({
                        ...prev,
                        work: value,
                        taskTitle: selected?.title || prev.taskTitle,
                        currentStatus: selected?.status || prev.currentStatus,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work/task" />
                    </SelectTrigger>
                    <SelectContent>
                      {works.map((work: any) => (
                        <SelectItem key={work._id} value={work._id}>
                          {work.title} · {work.workType || "Work"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={dailyForm.date}
                    onChange={(e) => updateDailyForm("date", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Task Name *
                  </label>
                  <Input
                    value={dailyForm.taskTitle}
                    onChange={(e) => updateDailyForm("taskTitle", e.target.value)}
                    placeholder="Task name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={dailyForm.startTime}
                    onChange={(e) => updateDailyForm("startTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={dailyForm.endTime}
                    onChange={(e) => updateDailyForm("endTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hours Worked *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={dailyForm.totalHours}
                    onChange={(e) => updateDailyForm("totalHours", e.target.value)}
                    placeholder="Example: 4.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <Select
                    value={dailyForm.currentStatus}
                    onValueChange={(value) =>
                      updateDailyForm("currentStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Not Started",
                        "In Progress",
                        "Review",
                        "Revision",
                        "Completed",
                        "Blocked",
                      ].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Progress %
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={dailyForm.progressPercentage}
                    onChange={(e) =>
                      updateDailyForm("progressPercentage", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Reference Link
                  </label>
                  <Input
                    value={dailyForm.referencesLinks}
                    onChange={(e) =>
                      updateDailyForm("referencesLinks", e.target.value)
                    }
                    placeholder="Drive/Figma/GitHub link"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Work Description / Completed Work *
                </label>
                <Textarea
                  rows={4}
                  value={dailyForm.workCompleted}
                  onChange={(e) => updateDailyForm("workCompleted", e.target.value)}
                  placeholder="Explain what you completed today..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Pending Work
                  </label>
                  <Textarea
                    value={dailyForm.pendingWork}
                    onChange={(e) => updateDailyForm("pendingWork", e.target.value)}
                    placeholder="Pending tasks..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Issues / Blockers
                  </label>
                  <Textarea
                    value={dailyForm.blockers}
                    onChange={(e) => updateDailyForm("blockers", e.target.value)}
                    placeholder="Any blockers?"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tomorrow Plan
                  </label>
                  <Textarea
                    value={dailyForm.tomorrowPlan}
                    onChange={(e) => updateDailyForm("tomorrowPlan", e.target.value)}
                    placeholder="Plan for tomorrow..."
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed p-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
                  <UploadCloud className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-medium">Upload Attachments</span>
                  <span className="text-xs text-muted-foreground">
                    Screenshots, PDFs, reports, source files or images
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleDailyAttachmentUpload(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {dailyForm.attachments.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {dailyForm.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-sm"
                      >
                        <span className="truncate">
                          Attachment {index + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDailyForm((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDailyForm(emptyDailyUpdateForm)}
                  disabled={submitLoading}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmitDailyUpdate}
                  disabled={submitLoading}
                >
                  {submitLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Daily Update
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative min-w-[250px] flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employee, project, client, task..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[170px]"
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Changes Requested">
                    Changes Requested
                  </SelectItem>
                </SelectContent>
              </Select>

              {canReviewUpdates && (
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-5 lg:w-[650px]">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {["pending", "reviewed", "all"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card className="border-0 shadow-md">
                <CardContent className="divide-y p-0">
                  {loading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredUpdates.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      No updates found
                    </div>
                  ) : (
                    filteredUpdates.map(renderUpdateCard)
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="timeline" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Review Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineItems.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      No timeline activity found
                    </div>
                  ) : (
                    timelineItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative border-l-2 border-muted pl-5"
                      >
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-primary" />
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {safeDate(item.date, "dd MMM yyyy, hh:mm a")}
                              </p>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 px-0"
                            onClick={() => openReviewDialog(item.update)}
                          >
                            View update
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employee Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employeeAnalytics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No employee data available
                    </p>
                  ) : (
                    employeeAnalytics.map((emp) => {
                      const rate = emp.total
                        ? Math.round((emp.approved / emp.total) * 100)
                        : 0;

                      return (
                        <div key={emp.name} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {emp.role}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {emp.hours.toFixed(1)}h
                            </Badge>
                          </div>

                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>
                              {emp.approved} approved / {emp.total} updates
                            </span>
                            <span>{rate}%</span>
                          </div>

                          <Progress value={rate} />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectAnalytics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No project data available
                    </p>
                  ) : (
                    projectAnalytics.map((project) => {
                      const percent = stats.totalHours
                        ? Math.round((project.hours / stats.totalHours) * 100)
                        : 0;

                      return (
                        <div key={project.project}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="truncate pr-4">
                              {project.project}
                            </span>
                            <strong>{project.hours.toFixed(1)}h</strong>
                          </div>
                          <Progress value={percent} />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={!!selectedUpdate}
        onOpenChange={(open) => {
          if (!open) closeReviewDialog();
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Daily Update</DialogTitle>
          </DialogHeader>

          {selectedUpdate && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-muted/30 p-4 text-sm md:grid-cols-2">
                <div>
                  <span className="font-medium">Employee:</span>{" "}
                  {getEmployeeName(selectedUpdate)}
                </div>
                <div>
                  <span className="font-medium">Role:</span>{" "}
                  {getEmployeeRole(selectedUpdate)}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {safeDate(selectedUpdate.date)}
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>{" "}
                  {safeDate(
                    selectedUpdate.submittedAt || selectedUpdate.createdAt,
                    "dd MMM yyyy, hh:mm a"
                  )}
                </div>
                <div>
                  <span className="font-medium">Project:</span>{" "}
                  {getProjectName(selectedUpdate)}
                </div>
                <div>
                  <span className="font-medium">Client:</span>{" "}
                  {getClientName(selectedUpdate)}
                </div>
                <div>
                  <span className="font-medium">Task:</span>{" "}
                  {getTaskTitle(selectedUpdate)}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {selectedUpdate.workCategory || "General"}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{" "}
                  {selectedUpdate.totalHours || 0}h
                </div>
                <div>
                  <span className="font-medium">Progress:</span>{" "}
                  {selectedUpdate.progressPercentage || 0}%
                </div>
                <div>
                  <span className="font-medium">Work Status:</span>{" "}
                  {selectedUpdate.currentStatus || "—"}
                </div>
                <div>
                  <span className="font-medium">Review Status:</span>{" "}
                  {getStatusBadge(selectedUpdate.approvalStatus)}
                </div>
              </div>

              <div>
                <p className="mb-1 font-medium">Work Completed</p>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  {selectedUpdate.workCompleted || "—"}
                </div>
              </div>

              {selectedUpdate.pendingWork && (
                <div>
                  <p className="mb-1 font-medium">Pending Work</p>
                  <div className="rounded-lg bg-yellow-50 p-3 text-sm">
                    {selectedUpdate.pendingWork}
                  </div>
                </div>
              )}

              {selectedUpdate.blockers && (
                <div>
                  <p className="mb-1 flex items-center gap-2 font-medium text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Blockers
                  </p>
                  <div className="rounded-lg bg-red-50 p-3 text-sm">
                    {selectedUpdate.blockers}
                  </div>
                </div>
              )}

              {selectedUpdate.tomorrowPlan && (
                <div>
                  <p className="mb-1 font-medium">Tomorrow Plan</p>
                  <div className="rounded-lg bg-blue-50 p-3 text-sm">
                    {selectedUpdate.tomorrowPlan}
                  </div>
                </div>
              )}

              {selectedUpdate.referencesLinks && (
                <div>
                  <p className="mb-1 font-medium">Reference Link</p>
                  <a
                    href={selectedUpdate.referencesLinks}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Open Reference
                  </a>
                </div>
              )}

              {selectedUpdate.attachments?.length ? (
                <div>
                  <p className="mb-2 font-medium">Attachments</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedUpdate.attachments.map((file, idx) => {
                      const url = getAttachmentUrl(file);
                      const image = isImageFile(file);

                      return (
                        <button
                          key={`${file}-${idx}`}
                          type="button"
                          onClick={() => openAttachment(file)}
                          className="flex items-center gap-3 rounded-lg border bg-white p-2 text-left text-sm hover:bg-muted/40"
                        >
                          {image ? (
                            <img
                              src={url}
                              alt="attachment"
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}

                          <span className="truncate">{file.split("/").pop()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <Separator />

              {canReviewUpdates ? (
                <>
                  <div>
                    <p className="mb-1 font-medium">Review Action</p>
                    <Select
                      value={reviewAction}
                      onValueChange={(v) => setReviewAction(v as ReviewAction)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Approved">✅ Approve</SelectItem>
                        <SelectItem value="Changes Requested">
                          🔄 Request Changes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    rows={3}
                    placeholder={
                      reviewAction === "Approved"
                        ? "Manager comment (optional)..."
                        : "Revision reason is required..."
                    }
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />

                  <DialogFooter>
                    <Button variant="outline" onClick={closeReviewDialog}>
                      Cancel
                    </Button>

                    <Button onClick={handleReview} disabled={submitting}>
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {reviewAction === "Approved"
                        ? "Approve Update"
                        : "Request Changes"}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <DialogFooter>
                  <Button variant="outline" onClick={closeReviewDialog}>
                    Close
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}