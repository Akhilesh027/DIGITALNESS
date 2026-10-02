import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Paperclip,
  CreditCard,
  FileText,
  UserCheck,
  LogOut,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/works", label: "My Works & Tasks", icon: Briefcase },
  { to: "/team", label: "Assigned Team", icon: Users },
  { to: "/attachments", label: "Project Attachments", icon: Paperclip },
  { to: "/payments", label: "Invoices & Payments", icon: CreditCard },
  { to: "/proposals", label: "Proposals & Agreements", icon: FileText },
  { to: "/profile", label: "Client Profile", icon: UserCheck },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { client, customer, logout } = useAuth();

  const clientName = client?.name || customer?.name || "Valued Client";
  const businessName = customer?.name || client?.businessType || "Digitalness Partner";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-glow">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">Digitalness</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Enterprise Client Desk</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Client Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-brand-500/20 to-amber-500/5 text-brand-300 border border-brand-500/30 shadow-glow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-brand-400" : "text-slate-400 group-hover:text-white"
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-glow" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Agency Services
          </div>

          <a
            href="https://digitalness.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Digitalness Main Website
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* User Card Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{clientName}</p>
                <p className="text-[11px] text-slate-400 truncate">{businessName}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
