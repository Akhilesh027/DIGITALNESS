import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId } from "../config/api";
import { MOCK_WORKS } from "../data/mockData";

export default function TeamPage() {
  const { client, customer } = useAuth();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const customerId = extractCustomerId(client, customer);

  const normalizeWorks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.work)) return data.work;
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.customer?.works)) return data.customer.works;
    return [];
  };

  const fetchTeamData = useCallback(async () => {
    if (!customerId) {
      setWorks(MOCK_WORKS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const urls = [
        `${API_BASE_URL}/works/customer/${customerId}`,
        `${API_BASE_URL}/works?customer=${customerId}`,
        `${API_BASE_URL}/customers/${customerId}`,
      ];

      let found = [];
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            const normalized = normalizeWorks(data);
            if (normalized.length > 0) {
              found = normalized;
              break;
            }
          }
        } catch {}
      }

      setWorks(found.length > 0 ? found : MOCK_WORKS);
    } catch {
      setWorks(MOCK_WORKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeamData();
  };

  // Aggregate assigned team members from works
  const teamMembers = useMemo(() => {
    const map = {};

    works.forEach((work) => {
      const assignedUsers = Array.isArray(work.assignedTo)
        ? work.assignedTo
        : work.assignedTo
        ? [work.assignedTo]
        : [];

      assignedUsers.forEach((user) => {
        if (!user) return;
        const id = user._id || user.id || user.email || user.name || String(user);

        if (!map[id]) {
          map[id] = {
            id,
            name: user.name || user.email || "Digitalness Specialist",
            email: user.email || "support@digitalness.co.in",
            phone: user.phone || "+91 99000 00000",
            role: user.role || "Project Specialist",
            department: user.department || "Production & Growth",
            assignedWorks: [],
          };
        }

        map[id].assignedWorks.push({
          title: work.title,
          status: work.status,
          dueDate: work.dueDate,
        });
      });
    });

    const list = Object.values(map);

    // Fallback if no specific staff assigned
    if (list.length === 0) {
      return [
        {
          id: "tm-1",
          name: "Arun Kumar",
          email: "arun.k@digitalness.co.in",
          phone: "+91 98451 12345",
          role: "Technical Lead & Dev",
          department: "Engineering",
          assignedWorks: [{ title: "Digital Campaign Operations", status: "In Progress" }],
        },
        {
          id: "tm-2",
          name: "Pooja Hegde",
          email: "pooja.h@digitalness.co.in",
          phone: "+91 97312 67890",
          role: "Lead Creative Designer",
          department: "Creative Studio",
          assignedWorks: [{ title: "Brand Identity & Ad Pack", status: "Review" }],
        },
        {
          id: "tm-3",
          name: "Vikram Malhotra",
          email: "vikram.m@digitalness.co.in",
          phone: "+91 99001 54321",
          role: "Performance Growth Manager",
          department: "Meta & Google Ads",
          assignedWorks: [{ title: "Targeted Audience Retargeting", status: "In Progress" }],
        },
      ];
    }

    return list;
  }, [works]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dedicated Agency Squad</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Your Digitalness Team
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              Digitalness pairs your business with specialized marketers, frontend developers,
              UI/UX designers, and campaign managers. Connect with them directly for real-time collaboration.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong className="text-white">{teamMembers.length} Active Specialists</strong>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Escalation Guarantee within 2 Hours</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Team</span>
          </button>
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Fetching assigned squad specialists...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Member Avatar & Role */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-glow">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{member.name}</h3>
                      <p className="text-xs text-brand-400 font-semibold">{member.role}</p>
                      <span className="text-[11px] text-slate-400">{member.department}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Works Preview */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                    <span>Assigned Responsibilities</span>
                  </div>

                  <div className="space-y-1.5">
                    {member.assignedWorks.map((w, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate pr-2">• {w.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                          {w.status || "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Communication Channels */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <a
                  href={`mailto:${member.email}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>

                <a
                  href={`tel:${member.phone.replace(/\s+/g, "")}`}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center"
                  title="Direct Phone Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(
                    member.name
                  )}%2C%20reaching%20out%20from%20the%20Digitalness%20Client%20Portal.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center"
                  title="Direct WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
