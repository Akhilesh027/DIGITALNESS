import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCRMStore } from "@/store/crmStore";
import { useTaskStore } from "@/store/taskStore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

type Employee = {
  _id?: string;
  id?: string;
  employeeId?: string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  designation?: string;
  branchId?: string;
  status?: string;
  dateOfJoining?: string;
};

type Work = {
  _id?: string;
  id?: string;
  title?: string;
  workType?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: any;
  timeSpent?: number;
  estimatedHours?: number;
  completedDeliverables?: number;
  deliverables?: number;
};

type DailyUpdate = {
  _id?: string;
  employee?: any;
  work?: any;
  date?: string;
  taskTitle?: string;
  projectName?: string;
  clientName?: string;
  totalHours?: number;
  currentStatus?: string;
  approvalStatus?: string;
  progressPercentage?: number;
  workCompleted?: string;
  blockers?: string;
  managerComment?: string;
};

type Score = {
  id: string;
  employeeId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  designation?: string;
  branchId?: string;
  status?: string;
  totalWorks: number;
  completedWorks: number;
  inProgressWorks: number;
  reviewWorks: number;
  delayedWorks: number;
  totalUpdates: number;
  approvedUpdates: number;
  pendingUpdates: number;
  changesRequested: number;
  blockedUpdates: number;
  totalHours: number;
  avgProgress: number;
  completionRate: number;
  approvalRate: number;
  delayRate: number;
  productivityScore: number;
  rank: number;
  grade: "A+" | "A" | "B" | "C" | "Needs Focus";
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const getArrayData = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.users)) return res.data.users;
  if (Array.isArray(res?.data?.works)) return res.data.works;
  if (Array.isArray(res?.data?.updates)) return res.data.updates;
  return [];
};

const getId = (value: any) => String(value?._id || value?.id || value || "");

const getEmployeeName = (employee: Employee) =>
  employee.name ||
  employee.fullName ||
  employee.username ||
  employee.email ||
  "Unnamed Employee";

const normalizeAssignedIds = (assignedTo: any) => {
  if (!assignedTo) return [];
  const assigned = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  return assigned.map((item) => getId(item)).filter(Boolean);
};

const isCompletedStatus = (status?: string) =>
  String(status || "").toLowerCase() === "completed";

const isActiveStatus = (status?: string) => {
  const value = String(status || "Active").toLowerCase();
  return value === "active";
};

const isDelayedWork = (work: Work) => {
  if (!work.dueDate || isCompletedStatus(work.status)) return false;
  const due = new Date(work.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const getGrade = (score: number): Score["grade"] => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "Needs Focus";
};

const formatDateInput = (date: Date) => date.toISOString().split("T")[0];

const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export default function PerformancePage() {
  const { employees: storeEmployees } = useCRMStore();
  const { tasks } = useTaskStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [fromDate, setFromDate] = useState(formatDateInput(getMonthStart()));
  const [toDate, setToDate] = useState(formatDateInput(new Date()));
  const [selectedEmployee, setSelectedEmployee] = useState<Score | null>(null);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      const [usersRes, worksRes, updatesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/users`, getAuthConfig()),
        axios.get(`${API_URL}/works`, getAuthConfig()),
        axios.get(
          `${API_URL}/daily-updates?fromDate=${fromDate}&toDate=${toDate}`,
          getAuthConfig(),
        ),
      ]);

      if (usersRes.status === "fulfilled") {
        const userData = getArrayData(usersRes.value);
        setEmployees(userData.length ? userData : storeEmployees || []);
      } else {
        setEmployees(storeEmployees || []);
      }

      if (worksRes.status === "fulfilled") {
        setWorks(getArrayData(worksRes.value));
      } else {
        const fallbackTasks = (tasks || []).map((task: any) => ({
          ...task,
          assignedTo: task.assignedTo,
          dueDate: task.deadline || task.dueDate,
          workType: task.type || task.workType,
        }));
        setWorks(fallbackTasks);
      }

      if (updatesRes.status === "fulfilled") {
        setDailyUpdates(getArrayData(updatesRes.value));
      } else {
        setDailyUpdates([]);
      }
    } catch {
      setEmployees(storeEmployees || []);
      setWorks(
        (tasks || []).map((task: any) => ({
          ...task,
          assignedTo: task.assignedTo,
          dueDate: task.deadline || task.dueDate,
          workType: task.type || task.workType,
        })),
      );
      setDailyUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const branches = useMemo(
    () => [
      "All",
      ...Array.from(new Set(employees.map((e) => e.branchId).filter(Boolean))),
    ],
    [employees],
  );

  const departments = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(employees.map((e) => e.department).filter(Boolean)),
      ),
    ],
    [employees],
  );

  const roles = useMemo(
    () => [
      "All",
      ...Array.from(new Set(employees.map((e) => e.role).filter(Boolean))),
    ],
    [employees],
  );

  const scores: Score[] = useMemo(() => {
    return employees
      .map((employee) => {
        const employeeId = getId(employee);

        const employeeWorks = works.filter((work) =>
          normalizeAssignedIds(work.assignedTo).includes(employeeId),
        );

        const employeeUpdates = dailyUpdates.filter((update) => {
          const updateEmployeeId = getId(update.employee);
          return updateEmployeeId === employeeId;
        });

        const totalWorks = employeeWorks.length;
        const completedWorks = employeeWorks.filter((work) =>
          isCompletedStatus(work.status),
        ).length;
        const inProgressWorks = employeeWorks.filter(
          (work) => work.status === "In Progress",
        ).length;
        const reviewWorks = employeeWorks.filter(
          (work) => work.status === "Review",
        ).length;
        const delayedWorks = employeeWorks.filter(isDelayedWork).length;

        const totalUpdates = employeeUpdates.length;
        const approvedUpdates = employeeUpdates.filter(
          (update) => update.approvalStatus === "Approved",
        ).length;
        const pendingUpdates = employeeUpdates.filter(
          (update) => update.approvalStatus === "Pending",
        ).length;
        const changesRequested = employeeUpdates.filter(
          (update) => update.approvalStatus === "Changes Requested",
        ).length;
        const blockedUpdates = employeeUpdates.filter(
          (update) =>
            update.currentStatus === "Blocked" ||
            Boolean(String(update.blockers || "").trim()),
        ).length;

        const totalHours = employeeUpdates.reduce(
          (sum, update) => sum + Number(update.totalHours || 0),
          0,
        );

        const avgProgress =
          totalUpdates > 0
            ? Math.round(
              employeeUpdates.reduce(
                (sum, update) =>
                  sum + Number(update.progressPercentage || 0),
                0,
              ) / totalUpdates,
            )
            : 0;

        const completionRate =
          totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0;

        const approvalRate =
          totalUpdates > 0
            ? Math.round((approvedUpdates / totalUpdates) * 100)
            : 0;

        const delayRate =
          totalWorks > 0 ? Math.round((delayedWorks / totalWorks) * 100) : 0;

        const productivityScore = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              completionRate * 0.3 +
              approvalRate * 0.25 +
              avgProgress * 0.2 +
              Math.min(totalHours * 2, 15) +
              (100 - delayRate) * 0.1 -
              blockedUpdates * 3 -
              changesRequested * 2,
            ),
          ),
        );

        return {
          id: employeeId,
          employeeId: employee.employeeId,
          name: getEmployeeName(employee),
          email: employee.email,
          phone: employee.phone,
          role: employee.role || "Employee",
          department: employee.department,
          designation: employee.designation,
          branchId: employee.branchId,
          status: employee.status || "Active",
          totalWorks,
          completedWorks,
          inProgressWorks,
          reviewWorks,
          delayedWorks,
          totalUpdates,
          approvedUpdates,
          pendingUpdates,
          changesRequested,
          blockedUpdates,
          totalHours,
          avgProgress,
          completionRate,
          approvalRate,
          delayRate,
          productivityScore,
          rank: 0,
          grade: getGrade(productivityScore),
        };
      })
      .sort((a, b) => b.productivityScore - a.productivityScore)
      .map((score, index) => ({ ...score, rank: index + 1 }));
  }, [employees, works, dailyUpdates]);

  const filteredScores = useMemo(() => {
    return scores.filter((score) => {
      const matchesSearch =
        score.name.toLowerCase().includes(search.toLowerCase()) ||
        String(score.employeeId || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(score.email || "").toLowerCase().includes(search.toLowerCase());

      const matchesBranch =
        branchFilter === "All" || score.branchId === branchFilter;

      const matchesDepartment =
        departmentFilter === "All" || score.department === departmentFilter;

      const matchesRole = roleFilter === "All" || score.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active"
          ? isActiveStatus(score.status)
          : !isActiveStatus(score.status));

      return (
        matchesSearch &&
        matchesBranch &&
        matchesDepartment &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [scores, search, branchFilter, departmentFilter, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalEmployees = filteredScores.length;
    const avgScore =
      totalEmployees > 0
        ? Math.round(
          filteredScores.reduce(
            (sum, score) => sum + score.productivityScore,
            0,
          ) / totalEmployees,
        )
        : 0;

    const totalHours = filteredScores.reduce(
      (sum, score) => sum + score.totalHours,
      0,
    );

    const avgApproval =
      totalEmployees > 0
        ? Math.round(
          filteredScores.reduce((sum, score) => sum + score.approvalRate, 0) /
          totalEmployees,
        )
        : 0;

    const totalBlocked = filteredScores.reduce(
      (sum, score) => sum + score.blockedUpdates,
      0,
    );

    return {
      totalEmployees,
      avgScore,
      totalHours,
      avgApproval,
      totalBlocked,
      topPerformer: filteredScores[0],
      needsFocus: [...filteredScores].sort(
        (a, b) => a.productivityScore - b.productivityScore,
      )[0],
    };
  }, [filteredScores]);

  const topChartData = filteredScores.slice(0, 8).map((score) => ({
    name: score.name.split(" ")[0],
    score: score.productivityScore,
    hours: score.totalHours,
    approval: score.approvalRate,
  }));

  const gradeData = useMemo(() => {
    const grades = ["A+", "A", "B", "C", "Needs Focus"];
    return grades.map((grade) => ({
      name: grade,
      value: filteredScores.filter((score) => score.grade === grade).length,
    }));
  }, [filteredScores]);

  const hoursTrend = useMemo(() => {
    const grouped: Record<string, number> = {};

    dailyUpdates.forEach((update) => {
      if (!update.date) return;
      const key = new Date(update.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      grouped[key] = (grouped[key] || 0) + Number(update.totalHours || 0);
    });

    return Object.entries(grouped).map(([date, hours]) => ({ date, hours }));
  }, [dailyUpdates]);

  const exportCSV = () => {
    const headers = [
      "Rank",
      "Employee ID",
      "Name",
      "Role",
      "Department",
      "Branch",
      "Score",
      "Grade",
      "Total Works",
      "Completed Works",
      "Completion Rate",
      "Total Updates",
      "Approved Updates",
      "Approval Rate",
      "Total Hours",
      "Blocked",
      "Delayed",
    ];

    const rows = filteredScores.map((score) => [
      score.rank,
      score.employeeId || "",
      score.name,
      score.role,
      score.department || "",
      score.branchId || "",
      score.productivityScore,
      score.grade,
      score.totalWorks,
      score.completedWorks,
      `${score.completionRate}%`,
      score.totalUpdates,
      score.approvedUpdates,
      `${score.approvalRate}%`,
      score.totalHours,
      score.blockedUpdates,
      score.delayedWorks,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employee-performance-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const StatCard = ({ title, value, icon: Icon, note, className }: any) => (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-heading font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const GradeBadge = ({ grade }: { grade: Score["grade"] }) => {
    const variant =
      grade === "A+" || grade === "A"
        ? "default"
        : grade === "B"
          ? "secondary"
          : grade === "C"
            ? "outline"
            : "destructive";

    return <Badge variant={variant}>{grade}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 print:bg-white"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">
            Employee Performance
          </h1>
          <p className="text-muted-foreground">
            Track productivity from works, daily updates, approvals, hours,
            blockers and delivery performance.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row print:hidden">
          <Button variant="outline" onClick={fetchPerformanceData}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={printReport}>
            <FileText className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Employees"
          value={summary.totalEmployees}
          icon={Users}
        />
        <StatCard
          title="Average Score"
          value={`${summary.avgScore}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Hours"
          value={summary.totalHours.toFixed(1)}
          icon={Clock}
        />
        <StatCard
          title="Approval Rate"
          value={`${summary.avgApproval}%`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Blocked Updates"
          value={summary.totalBlocked}
          icon={AlertTriangle}
          className="border-destructive/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {summary.topPerformer?.name || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Score {summary.topPerformer?.productivityScore || 0}% ·{" "}
              {summary.topPerformer?.totalHours || 0} hours
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              Needs Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {summary.needsFocus?.name || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Score {summary.needsFocus?.productivityScore || 0}% ·{" "}
              {summary.needsFocus?.blockedUpdates || 0} blocked updates
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search employee, ID, email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />

            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={String(branch)} value={String(branch)}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem
                    key={String(department)}
                    value={String(department)}
                  >
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={String(role)} value={String(role)}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Leaderboard Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <BarChart data={topChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {topChartData.map((_, index) => (
                      <Cell key={index} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={gradeData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {gradeData.map((_, index) => (
                      <Cell key={index} fill={`hsl(var(--primary))`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <LineChart data={hoursTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading employee performance...
            </div>
          ) : filteredScores.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No employees found for selected filters.
            </div>
          ) : (
            filteredScores.map((score) => (
              <div
                key={score.id}
                className="rounded-xl border bg-card p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      #{score.rank}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{score.name}</p>
                        <GradeBadge grade={score.grade} />
                        <Badge variant="outline">{score.role}</Badge>
                        {score.employeeId && (
                          <Badge variant="secondary">{score.employeeId}</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {score.designation || score.department || "Employee"} ·{" "}
                        {score.branchId || "No Branch"}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-muted-foreground">
                        <span>{score.completedWorks}/{score.totalWorks} works</span>
                        <span>{score.totalUpdates} updates</span>
                        <span>{score.totalHours.toFixed(1)} hours</span>
                        <span>{score.blockedUpdates} blocked</span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Completion</span>
                            <span>{score.completionRate}%</span>
                          </div>
                          <Progress value={score.completionRate} />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Approval</span>
                            <span>{score.approvalRate}%</span>
                          </div>
                          <Progress value={score.approvalRate} />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{score.avgProgress}%</span>
                          </div>
                          <Progress value={score.avgProgress} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:w-[180px]">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        {score.productivityScore}
                      </p>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(score)}
                      className="print:hidden"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
      >
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Performance Details</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserRound className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {selectedEmployee.employeeId || "No Employee ID"} ·{" "}
                        {selectedEmployee.role}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmployee.email || "-"} ·{" "}
                        {selectedEmployee.phone || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-4xl font-bold text-primary">
                      {selectedEmployee.productivityScore}
                    </p>
                    <GradeBadge grade={selectedEmployee.grade} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  title="Total Works"
                  value={selectedEmployee.totalWorks}
                  icon={CalendarDays}
                />
                <StatCard
                  title="Completed"
                  value={selectedEmployee.completedWorks}
                  icon={CheckCircle2}
                />
                <StatCard
                  title="Total Hours"
                  value={selectedEmployee.totalHours.toFixed(1)}
                  icon={Clock}
                />
                <StatCard
                  title="Blocked"
                  value={selectedEmployee.blockedUpdates}
                  icon={AlertTriangle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total Works</span>
                      <b>{selectedEmployee.totalWorks}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Works</span>
                      <b>{selectedEmployee.completedWorks}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>In Progress</span>
                      <b>{selectedEmployee.inProgressWorks}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>In Review</span>
                      <b>{selectedEmployee.reviewWorks}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Delayed Works</span>
                      <b>{selectedEmployee.delayedWorks}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <b>{selectedEmployee.completionRate}%</b>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Update Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total Updates</span>
                      <b>{selectedEmployee.totalUpdates}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Updates</span>
                      <b>{selectedEmployee.approvedUpdates}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Updates</span>
                      <b>{selectedEmployee.pendingUpdates}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Changes Requested</span>
                      <b>{selectedEmployee.changesRequested}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate</span>
                      <b>{selectedEmployee.approvalRate}%</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Progress</span>
                      <b>{selectedEmployee.avgProgress}%</b>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Formula</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Score is calculated from work completion, approved daily
                    updates, average progress, total hours, delay rate, blockers
                    and changes requested.
                  </p>
                  <p>
                    This helps managers compare employees fairly using CRM work
                    data and daily work updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
