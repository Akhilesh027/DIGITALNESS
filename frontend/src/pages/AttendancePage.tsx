import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Download,
  LogIn,
  LogOut,
  Search,
  Timer,
  UserCheck,
  Users,
  BriefcaseBusiness,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Half Day" | "On Leave";

interface Employee {
  _id: string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  department?: string;
  branchId?: string | { _id?: string; name?: string };
  status?: string;
}

interface WorkUpdate {
  _id: string;
  employee?: string | Employee;
  user?: string | Employee;
  date?: string;
  taskTitle?: string;
  work?: any;
  customer?: any;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  currentStatus?: string;
  progressPercentage?: number;
  blockers?: string;
  tomorrowPlan?: string;
  reviewStatus?: string;
}

interface AttendanceRecord {
  _id: string;
  employee?: string | Employee;
  user?: string | Employee;
  date?: string;
  loginTime?: string;
  logoutTime?: string;
  checkIn?: string;
  checkOut?: string;
  punchIn?: string;
  punchOut?: string;
  workStartTime?: string;
  workEndTime?: string;
  breakMinutes?: number;
  totalHours?: number;
  workingHours?: number;
  status?: AttendanceStatus | string;
  remarks?: string;
  branchId?: string | { _id?: string; name?: string };
}

interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  branchId: string;
  branchName: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  workStartTime?: string;
  workEndTime?: string;
  breakMinutes: number;
  attendanceHours: number;
  updateHours: number;
  totalTasks: number;
  completedTasks: number;
  status: AttendanceStatus | string;
  remarks?: string;
  updates: WorkUpdate[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

function getArrayData(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.updates)) return data.updates;
  if (Array.isArray(data?.dailyUpdates)) return data.dailyUpdates;
  return [];
}

function getId(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function getEmployeeName(employee?: Employee | string) {
  if (!employee) return "Employee";
  if (typeof employee === "string") return employee;
  return employee.name || employee.fullName || employee.username || employee.email || "Employee";
}

function getBranchId(branch: any) {
  if (!branch) return "";
  if (typeof branch === "string") return branch;
  return String(branch._id || branch.branchId || branch.id || "");
}

function getBranchName(branch: any) {
  if (!branch) return "—";
  if (typeof branch === "string") return branch;
  return branch.name || branch.branchName || branch._id || "—";
}

function toDateKey(date?: string) {
  if (!date) return todayISO();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function getTimeValue(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;
  const today = todayISO();
  const fallback = new Date(`${today}T${value}`);
  return Number.isNaN(fallback.getTime()) ? undefined : fallback;
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  const d = getTimeValue(value);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours?: number) {
  const safeHours = Number(hours || 0);
  const totalMinutes = Math.round(safeHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function hoursBetween(start?: string, end?: string, breakMinutes = 0) {
  const startDate = getTimeValue(start);
  const endDate = getTimeValue(end);
  if (!startDate || !endDate) return 0;
  const minutes = Math.max(0, (endDate.getTime() - startDate.getTime()) / 60000 - breakMinutes);
  return Number((minutes / 60).toFixed(2));
}

function getAttendanceStatus(row: AttendanceRow): AttendanceStatus | string {
  if (row.status) return row.status;
  if (!row.loginTime) return "Absent";

  const loginDate = getTimeValue(row.loginTime);
  if (loginDate) {
    const hour = loginDate.getHours();
    const minute = loginDate.getMinutes();
    if (hour > 10 || (hour === 10 && minute > 15)) return "Late";
  }

  const hours = row.attendanceHours || row.updateHours;
  if (hours > 0 && hours < 4) return "Half Day";
  return "Present";
}

function statusVariant(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "present") return "success";
  if (s === "late") return "warning";
  if (s === "absent") return "destructive";
  if (s === "half day") return "pending";
  if (s === "on leave") return "secondary";
  return "outline";
}

function downloadCSV(filename: string, rows: AttendanceRow[]) {
  const headers = [
    "Employee",
    "Role",
    "Department",
    "Branch",
    "Date",
    "Login Time",
    "Logout Time",
    "Work Start",
    "Work End",
    "Break Minutes",
    "Attendance Hours",
    "Daily Update Hours",
    "Tasks",
    "Completed Tasks",
    "Status",
    "Remarks",
  ];

  const csvRows = rows.map((row) => [
    row.employeeName,
    row.role,
    row.department,
    row.branchName,
    formatDate(row.date),
    formatTime(row.loginTime),
    formatTime(row.logoutTime),
    formatTime(row.workStartTime),
    formatTime(row.workEndTime),
    row.breakMinutes,
    formatHours(row.attendanceHours),
    formatHours(row.updateHours),
    row.totalTasks,
    row.completedTasks,
    row.status,
    row.remarks || "",
  ]);

  const csv = [headers, ...csvRows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AttendancePage() {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [employeesRes, attendanceRes, updatesRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers: authHeaders() }),
        fetch(`${API_URL}/attendance?date=${selectedDate}`, { headers: authHeaders() }),
        fetch(`${API_URL}/daily-updates?date=${selectedDate}`, { headers: authHeaders() }),
      ]);

      const employeesData = await employeesRes.json().catch(() => ({}));
      const attendanceData = await attendanceRes.json().catch(() => ({}));
      const updatesData = await updatesRes.json().catch(() => ({}));

      if (!employeesRes.ok) {
        toast({
          title: "Employee Error",
          description: employeesData.message || "Unable to load employees",
          variant: "destructive",
        });
      }

      setEmployees(getArrayData(employeesData));
      setAttendance(attendanceRes.ok ? getArrayData(attendanceData) : []);
      setUpdates(updatesRes.ok ? getArrayData(updatesData) : []);

      if (!attendanceRes.ok) {
        toast({
          title: "Attendance API Missing",
          description: "Attendance records are not loading. Check /api/attendance route.",
          variant: "destructive",
        });
      }

      if (!updatesRes.ok) {
        toast({
          title: "Daily Updates API Missing",
          description: "Work timing from daily updates is not loading. Check /api/daily-updates route.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Server Error",
        description: "Unable to load attendance report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const rows = useMemo<AttendanceRow[]>(() => {
    const attendanceByEmployee = new Map<string, AttendanceRecord>();
    attendance.forEach((record) => {
      const employeeId = getId(record.employee || record.user);
      if (employeeId) attendanceByEmployee.set(employeeId, record);
    });

    const updatesByEmployee = new Map<string, WorkUpdate[]>();
    updates.forEach((update) => {
      const employeeId = getId(update.employee || update.user);
      if (!employeeId) return;
      const list = updatesByEmployee.get(employeeId) || [];
      list.push(update);
      updatesByEmployee.set(employeeId, list);
    });

    return employees.map((employee) => {
      const employeeId = getId(employee);
      const attendanceRecord = attendanceByEmployee.get(employeeId);
      const employeeUpdates = updatesByEmployee.get(employeeId) || [];

      const loginTime =
        attendanceRecord?.loginTime ||
        attendanceRecord?.checkIn ||
        attendanceRecord?.punchIn;

      const logoutTime =
        attendanceRecord?.logoutTime ||
        attendanceRecord?.checkOut ||
        attendanceRecord?.punchOut;

      const workStartTime =
        attendanceRecord?.workStartTime ||
        employeeUpdates
          .map((u) => u.startTime)
          .filter(Boolean)
          .sort()[0];

      const workEndTime =
        attendanceRecord?.workEndTime ||
        employeeUpdates
          .map((u) => u.endTime)
          .filter(Boolean)
          .sort()
          .reverse()[0];

      const breakMinutes = Number(attendanceRecord?.breakMinutes || 0);

      const attendanceHours =
        Number(attendanceRecord?.totalHours || attendanceRecord?.workingHours || 0) ||
        hoursBetween(loginTime, logoutTime, breakMinutes);

      const updateHours = employeeUpdates.reduce(
        (sum, update) => sum + Number(update.totalHours || hoursBetween(update.startTime, update.endTime)),
        0
      );

      const completedTasks = employeeUpdates.filter((update) =>
        String(update.currentStatus || "").toLowerCase() === "completed"
      ).length;

      const branch = attendanceRecord?.branchId || employee.branchId;
      const row: AttendanceRow = {
        employeeId,
        employeeName: getEmployeeName(employee),
        role: employee.role || employee.designation || "Employee",
        department: employee.department || "Other",
        branchId: getBranchId(branch),
        branchName: getBranchName(branch),
        date: selectedDate,
        loginTime,
        logoutTime,
        workStartTime,
        workEndTime,
        breakMinutes,
        attendanceHours,
        updateHours: Number(updateHours.toFixed(2)),
        totalTasks: employeeUpdates.length,
        completedTasks,
        status: attendanceRecord?.status || "",
        remarks: attendanceRecord?.remarks,
        updates: employeeUpdates,
      };

      row.status = getAttendanceStatus(row);
      return row;
    });
  }, [employees, attendance, updates, selectedDate]);

  const branches = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.branchId) map.set(row.branchId, row.branchName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch =
      row.employeeName.toLowerCase().includes(q) ||
      row.role.toLowerCase().includes(q) ||
      row.department.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    const matchesBranch = branchFilter === "All" || row.branchId === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const selectedRow = filteredRows.find((row) => row.employeeId === selectedEmployeeId) || null;

  const stats = {
    total: rows.length,
    present: rows.filter((row) => row.status === "Present").length,
    late: rows.filter((row) => row.status === "Late").length,
    absent: rows.filter((row) => row.status === "Absent").length,
    totalHours: rows.reduce((sum, row) => sum + Math.max(row.attendanceHours, row.updateHours), 0),
    totalTasks: rows.reduce((sum, row) => sum + row.totalTasks, 0),
  };

  const StatCard = ({
    title,
    value,
    icon,
    sub,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    sub?: string;
  }) => (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Attendance & Work Timing
          </h1>
          <p className="text-muted-foreground">
            Track employee login time, logout time, working hours, task timing and daily update details.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-44"
          />
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button
            variant="gradient"
            onClick={() => downloadCSV(`attendance-${selectedDate}.csv`, filteredRows)}
            disabled={loading || filteredRows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard title="Employees" value={stats.total} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Present" value={stats.present} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard title="Late" value={stats.late} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Absent" value={stats.absent} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Work Hours" value={formatHours(stats.totalHours)} icon={<Timer className="h-5 w-5" />} />
        <StatCard title="Tasks Updated" value={stats.totalTasks} icon={<BriefcaseBusiness className="h-5 w-5" />} />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, role or department..."
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Present", "Late", "Absent", "Half Day", "On Leave"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Branch</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Login</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Logout</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Work Start</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Work End</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Break</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Working Time</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Tasks</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 11 }).map((__, tdIndex) => (
                        <td key={tdIndex} className="p-3">
                          <div className="h-4 w-24 rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-muted-foreground">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium text-foreground">{row.employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.role} • {row.department}
                        </p>
                      </td>
                      <td className="p-3 text-sm">{row.branchName}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <LogIn className="h-4 w-4 text-success" />
                          {formatTime(row.loginTime)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <LogOut className="h-4 w-4 text-destructive" />
                          {formatTime(row.logoutTime)}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{formatTime(row.workStartTime)}</td>
                      <td className="p-3 text-sm">{formatTime(row.workEndTime)}</td>
                      <td className="p-3 text-sm">{row.breakMinutes}m</td>
                      <td className="p-3">
                        <p className="text-sm font-semibold text-foreground">
                          {formatHours(Math.max(row.attendanceHours, row.updateHours))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Attendance: {formatHours(row.attendanceHours)} | Updates: {formatHours(row.updateHours)}
                        </p>
                      </td>
                      <td className="p-3 text-sm">
                        {row.completedTasks}/{row.totalTasks}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant(row.status) as any}>{row.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployeeId(row.employeeId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedRow && (
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedRow.employeeName} - Full Day Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedRow.date)} • {selectedRow.role} • {selectedRow.department}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedEmployeeId(null)}>
                Close Details
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Login Time</p>
                <p className="font-semibold">{formatTime(selectedRow.loginTime)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Logout Time</p>
                <p className="font-semibold">{formatTime(selectedRow.logoutTime)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Work Start</p>
                <p className="font-semibold">{formatTime(selectedRow.workStartTime)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Work End</p>
                <p className="font-semibold">{formatTime(selectedRow.workEndTime)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Total Timing</p>
                <p className="font-semibold">{formatHours(Math.max(selectedRow.attendanceHours, selectedRow.updateHours))}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusVariant(selectedRow.status) as any}>{selectedRow.status}</Badge>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">Daily Work Updates</h3>
              <div className="space-y-3">
                {selectedRow.updates.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No daily work updates submitted for this date.
                  </div>
                ) : (
                  selectedRow.updates.map((update) => (
                    <div key={update._id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {update.taskTitle || update.work?.title || "Work Update"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {update.work?.workType || update.work?.title || "Work"} • {update.customer?.name || update.customer?.companyName || "No customer"}
                          </p>
                        </div>
                        <Badge variant={statusVariant(update.reviewStatus) as any}>
                          {update.reviewStatus || update.currentStatus || "Submitted"}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
                        <div>
                          <p className="text-xs text-muted-foreground">Start</p>
                          <p className="font-medium">{formatTime(update.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End</p>
                          <p className="font-medium">{formatTime(update.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hours</p>
                          <p className="font-medium">{formatHours(Number(update.totalHours || hoursBetween(update.startTime, update.endTime)))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="font-medium">{update.progressPercentage || 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-medium">{update.currentStatus || "—"}</p>
                        </div>
                      </div>

                      {update.blockers && (
                        <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                          <b>Blockers:</b> {update.blockers}
                        </div>
                      )}

                      {update.tomorrowPlan && (
                        <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                          <b>Tomorrow Plan:</b> {update.tomorrowPlan}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
