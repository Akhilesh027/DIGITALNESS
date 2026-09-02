import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  PhoneCall,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

interface User {
  _id: string;
  id?: string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  department?: string;
  branchId?: string;
}

interface Lead {
  _id: string;
  name: string;
  businessType?: string;
  contactNumber?: string;
  email?: string;
  status?: string;
  city?: string;
  source?: string;
  leadScore?: string;
  lastContactDate?: string;
  followUpDate?: string;
  nextFollowUpDate?: string;
  assignedTo?: string | User;
  callLogs?: any[];
  requirements?: string[];
  notes?: string[];
}

export default function TelecallerPage() {
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthConfig = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const getArrayData = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.leads)) return data.leads;
    if (Array.isArray(data?.users)) return data.users;
    return [];
  };

  const getCurrentUserFromStorage = () => {
    try {
      const stored =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        localStorage.getItem("authUser");

      if (!stored) return null;

      const user = JSON.parse(stored);

      return {
        _id: user._id || user.id,
        id: user.id || user._id,
        name: user.name || user.fullName || user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      };
    } catch {
      return null;
    }
  };

  const getAssignedId = (lead: Lead) => {
    if (!lead.assignedTo) return "";
    if (typeof lead.assignedTo === "object") return lead.assignedTo._id || lead.assignedTo.id || "";
    return lead.assignedTo;
  };

  const getAssignedName = (lead: Lead) => {
    if (!lead.assignedTo) return "Unassigned";

    if (typeof lead.assignedTo === "object") {
      return (
        lead.assignedTo.name ||
        lead.assignedTo.fullName ||
        lead.assignedTo.username ||
        lead.assignedTo.email ||
        "Employee"
      );
    }

    const emp = employees.find((e) => e._id === lead.assignedTo || e.id === lead.assignedTo);

    return emp?.name || emp?.fullName || emp?.username || emp?.email || "Employee";
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, getAuthConfig());
      const data = await res.json();

      if (res.ok) {
        setEmployees(getArrayData(data));
      }
    } catch {
      console.log("Unable to fetch employees");
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`, getAuthConfig());
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch leads");

      const user = getCurrentUserFromStorage();
      let allLeads = getArrayData(data);

      if (
        user &&
        user.role !== "Admin" &&
        user.role !== "admin" &&
        user.role !== "Operational Manager"
      ) {
        allLeads = allLeads.filter((lead: Lead) => {
          const assignedId = getAssignedId(lead);
          return String(assignedId) === String(user._id);
        });
      }

      setLeads(allLeads);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const user = getCurrentUserFromStorage();
    setCurrentUser(user);

    const loadData = async () => {
      setLoading(true);
      await fetchEmployees();
      await fetchLeads();
      setLoading(false);
    };

    loadData();
  }, []);

  const allCallLogs = useMemo(() => {
    return leads.flatMap((lead) =>
      (lead.callLogs || []).map((log) => ({
        ...log,
        lead,
        leadId: lead._id,
        leadName: lead.name,
        contactNumber: lead.contactNumber,
        businessType: lead.businessType,
        dateTime: log.calledAt || log.dateTime || log.createdAt,
        result: log.callStatus || log.result || lead.status,
        duration: log.duration || 0,
      }))
    );
  }, [leads]);

  const today = new Date().toISOString().split("T")[0];

  const todayCalls = allCallLogs.filter((log) => {
    if (!log.dateTime) return false;
    return new Date(log.dateTime).toISOString().split("T")[0] === today;
  });

  const todayFollowups = leads.filter((lead) => {
    const followDate = lead.followUpDate || lead.nextFollowUpDate;
    if (!followDate) return false;
    return new Date(followDate).toISOString().split("T")[0] === today;
  });

  const overdueFollowups = leads.filter((lead) => {
    const followDate = lead.followUpDate || lead.nextFollowUpDate;
    if (!followDate || lead.status === "Own Close") return false;

    const due = new Date(followDate);
    const now = new Date();

    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return due < now;
  });

  const stats = {
    assignedLeads: leads.length,
    totalCalls: allCallLogs.length,
    todayCalls: todayCalls.length,
    followups: leads.filter(
      (lead) => lead.status === "Follow Up" || lead.status === "Call Back"
    ).length,
    todayFollowups: todayFollowups.length,
    overdueFollowups: overdueFollowups.length,
    ownClose: leads.filter((lead) => lead.status === "Own Close").length,
    ownLoss: leads.filter((lead) => lead.status === "Own Loss").length,
    conversionRate: leads.length
      ? Math.round(
        (leads.filter((lead) => lead.status === "Own Close").length / leads.length) * 100
      )
      : 0,
  };

  const statusBadge = (status?: string) => {
    if (status === "Own Close") return "success";
    if (status === "Own Loss" || status === "Failed") return "destructive";
    if (status === "Follow Up" || status === "Call Back") return "warning";
    if (status === "Demo Completed") return "info";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading telecaller data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Telecaller Dashboard
        </h1>
        <p className="text-muted-foreground">
          {currentUser?.name ? `${currentUser.name} • ` : ""}
          Manage assigned leads, calls, follow-ups and conversions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4"
      >
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <UserCheck className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Assigned Leads</p>
          <p className="text-2xl font-bold">{stats.assignedLeads}</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <Phone className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Total Calls</p>
          <p className="text-2xl font-bold">{stats.totalCalls}</p>
        </div>

        <div className="p-5 rounded-xl bg-info/10 border border-info/30">
          <PhoneCall className="w-5 h-5 text-info mb-2" />
          <p className="text-sm text-muted-foreground">Today Calls</p>
          <p className="text-2xl font-bold text-info">{stats.todayCalls}</p>
        </div>

        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <Clock className="w-5 h-5 text-warning mb-2" />
          <p className="text-sm text-muted-foreground">Follow-ups</p>
          <p className="text-2xl font-bold text-warning">{stats.followups}</p>
        </div>

        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <Calendar className="w-5 h-5 text-warning mb-2" />
          <p className="text-sm text-muted-foreground">Today Follow-ups</p>
          <p className="text-2xl font-bold text-warning">{stats.todayFollowups}</p>
        </div>

        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-destructive">{stats.overdueFollowups}</p>
        </div>

        <div className="p-5 rounded-xl bg-success/10 border border-success/30">
          <CheckCircle className="w-5 h-5 text-success mb-2" />
          <p className="text-sm text-muted-foreground">Own Close</p>
          <p className="text-2xl font-bold text-success">{stats.ownClose}</p>
        </div>

        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <TrendingUp className="w-5 h-5 mb-2" />
          <p className="text-sm text-primary-foreground/80">Conversion</p>
          <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Today’s Follow-ups
            </h3>
            <Badge variant="warning">{todayFollowups.length} pending</Badge>
          </div>

          <div className="space-y-3">
            {todayFollowups.length > 0 ? (
              todayFollowups.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.businessType || "-"} • {lead.contactNumber || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned: {getAssignedName(lead)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadge(lead.status) as any}>
                      {lead.status || "New"}
                    </Badge>
                    <Button size="icon" variant="ghost" className="text-accent">
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No follow-ups scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-primary" />
            Recent Call Logs
          </h3>

          <div className="space-y-3">
            {allCallLogs.slice(0, 8).map((log, index) => (
              <div
                key={log._id || `${log.leadId}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
              >
                <div className="p-2 rounded-lg bg-info/10 text-info mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{log.leadName}</p>
                    <span className="text-xs text-muted-foreground">
                      {log.duration ? `${log.duration} min` : "—"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {log.notes || "No notes added"}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusBadge(log.result) as any} className="text-xs">
                      {log.result || "Call"}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      {log.dateTime
                        ? new Date(log.dateTime).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {allCallLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No call logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Telecaller Assigned Leads
          </h3>

          <span className="text-sm text-muted-foreground">
            {leads.length} leads
          </span>
        </div>

        <table className="w-full min-w-[850px]">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Lead
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Business
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Assigned To
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Follow-up
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Calls
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Last Contact
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {lead.name?.charAt(0) || "L"}
                    </div>

                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.contactNumber || "-"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3 text-sm text-muted-foreground">
                  {lead.businessType || "-"}
                </td>

                <td className="py-3 text-sm text-muted-foreground">
                  {getAssignedName(lead)}
                </td>

                <td className="py-3">
                  <Badge variant={statusBadge(lead.status) as any}>
                    {lead.status || "New"}
                  </Badge>
                </td>

                <td className="py-3 text-sm text-muted-foreground">
                  {lead.followUpDate || lead.nextFollowUpDate
                    ? new Date(lead.followUpDate || lead.nextFollowUpDate || "").toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    )
                    : "—"}
                </td>

                <td className="py-3 text-sm text-muted-foreground">
                  {lead.callLogs?.length || 0}
                </td>

                <td className="py-3 text-sm text-muted-foreground">
                  {lead.lastContactDate
                    ? new Date(lead.lastContactDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                    : "—"}
                </td>

                <td className="py-3">
                  <Button size="sm" variant="ghost" className="text-accent">
                    <PhoneCall className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </td>
              </tr>
            ))}

            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No telecaller leads assigned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}