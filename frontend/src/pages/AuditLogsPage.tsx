import { useEffect, useState } from "react";
import { Shield, Search, RefreshCw, Filter, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuditLogs } from "../api/auditLogApi";

interface AuditLogItem {
  _id: string;
  actorType: string;
  actorName: string;
  action: string;
  entityType?: string;
  inputSummary?: string;
  outputSummary?: string;
  status: string;
  error?: string;
  createdAt: string;
  customerId?: { name?: string; companyName?: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actorFilter !== "all") params.actorType = actorFilter;
      const data = await getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actorFilter]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.customerId?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" /> System & AI Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central audit trail recording all human actions, AI agent operations, and system events.
          </p>
        </div>

        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by action, actor, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Actor Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actors</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Employee">Employee</SelectItem>
              <SelectItem value="AI Agent">AI Agent</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No audit logs found matching your query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target / Customer</th>
                  <th className="p-4">Input / Summary</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.actorType === "AI Agent" ? "secondary" : "outline"}
                          className={log.actorType === "AI Agent" ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                        >
                          {log.actorType}
                        </Badge>
                        <span>{log.actorName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{log.action}</td>
                    <td className="p-4 text-xs text-slate-600">
                      {log.customerId?.name ? (
                        <span className="font-medium text-indigo-600">{log.customerId.name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-xs max-w-xs truncate text-slate-600">
                      {log.inputSummary || log.outputSummary || "—"}
                    </td>
                    <td className="p-4">
                      {log.status === "Success" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" /> Success
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 w-fit">
                          <AlertCircle className="h-3 w-3" /> {log.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
