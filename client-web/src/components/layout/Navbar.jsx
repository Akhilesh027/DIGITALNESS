import React from "react";
import { Menu, Bell, MessageSquare, PhoneCall, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar = ({ onOpenSidebar, pageTitle = "Digitalness Portal" }) => {
  const { client, customer } = useAuth();

  const businessName = customer?.name || client?.businessType || "Digitalness Client";

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{pageTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Connected to <span className="text-brand-400 font-semibold">{businessName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live sync badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CRM Synchronized</span>
        </div>

        {/* Support quick link */}
        <a
          href="https://wa.me/919900000000?text=Hi%20Digitalness%20Team%2C%20I%20need%20assistance%20with%20my%20project."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold transition-all shadow-glow"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Priority Support</span>
        </a>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-glow">
          {(client?.name || customer?.name || "D").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
