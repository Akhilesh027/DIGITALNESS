import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

const PAGE_TITLES = {
  "/": "Overview & Analytics",
  "/works": "Project Works & Deliverables",
  "/team": "Dedicated Agency Team",
  "/attachments": "Project Files & Brand Assets",
  "/payments": "Invoices & Retainers",
  "/profile": "Company & Client Profile",
};

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle = PAGE_TITLES[location.pathname] || "Digitalness Portal";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} pageTitle={currentTitle} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 sm:px-8 border-t border-slate-900 text-center text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Digitalness Media & Technology. Confidential Client Portal.
          </p>
        </footer>
      </div>
    </div>
  );
};
