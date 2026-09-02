import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import LeadsPage from "./pages/LeadsPage";
import CustomersPage from "./pages/CustomersPage";
import WorksPage from "./pages/WorksPage";
import TelecallerPage from "./pages/TelecallerPage";
import AccountsPage from "./pages/AccountsPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";
import InvoicesPage from "./pages/InvoicesPage";
import DeliverablesPage from "./pages/DeliverablesPage";
import PaymentsPage from "./pages/PaymentsPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import EmployeeReportPage from "./pages/EmployeeReportPage";
import SalesPipelinePage from "./pages/SalesPipelinePage";
import ProposalsPage from "./pages/ProposalsPage";
import BranchesPage from "./pages/BranchesPage";
import TemplatesPage from "./pages/TemplatesPage";
import TicketsPage from "./pages/TicketsPage";
import TasksPage from "./pages/TasksPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import PerformancePage from "./pages/PerformancePage";
import ExpensesPage from "./pages/ExpensesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AutoReportsPage from "./pages/AutoReportsPage";
import WorkflowPage from "./pages/WorkflowPage";
import EmployeeDailyUpdate from "./pages/EmployeeDailyUpdate";
import BlogsPage from "./pages/BlogsPage";
import AdminDailyUpdates from "./pages/AdminDailyUpdates";
import AttendancePage from "./pages/AttendancePage";
import RecruitmentPage from "./pages/RecruitmentPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ContentCalendarPage from "./pages/ContentCalendarPage";
import ContentOperationsWorkspace from "./pages/ContentOperationsWorkspace";
import AgencyExecutiveDashboard from "./pages/AgencyExecutiveDashboard";
import ClientReportingWorkspace from "./pages/ClientReportingWorkspace";
import ProductionCertificationDashboard from "./pages/ProductionCertificationDashboard";
import CreativeStudioPage from "./pages/CreativeStudioPage";
import SchedulerPage from "./pages/SchedulerPage";
import CustomerOnboardingPage from "./pages/CustomerOnboardingPage";
import AIWorkspacePage from "./pages/AIWorkspacePage";
import AgentActivityPage from "./pages/AgentActivityPage";
import AdCampaignsPage from "./pages/AdCampaignsPage";
import { isTokenValid, clearAuth } from "@/api/auth";

// Routes
const queryClient = new QueryClient();

const roleRoutes: Record<string, string> = {
  Admin: "/dashboard",
  "Operational Manager": "/employees",
  "Performance Marketer": "/performance",
  "Content Writer": "/tasks",
  "Graphic Designer": "/tasks",
  "UI/UX": "/works",
  "Frontend Dev": "/works",
  "Backend Dev": "/works",
  BDE: "/leads",
  Support: "/tickets",
};

const getUserRoute = () => {
  try {
    const user = localStorage.getItem("user") || localStorage.getItem("currentUser");
    if (!user) return "/dashboard";

    const parsedUser = JSON.parse(user);
    return roleRoutes[parsedUser.role] || "/dashboard";
  } catch {
    return "/dashboard";
  }
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (!token || !isTokenValid(token)) {
    clearAuth();
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (token && isTokenValid(token)) {
    return <Navigate to={getUserRoute()} replace />;
  }

  return children;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/works" element={<WorksPage />} />
            <Route path="/telecaller" element={<TelecallerPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/deliverables" element={<DeliverablesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/client-portal" element={<ClientPortalPage />} />
            <Route path="/employee-report" element={<EmployeeReportPage />} />
            <Route path="/sales-pipeline" element={<SalesPipelinePage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/AttendancePage" element={<AttendancePage />} />
            
            <Route path="/daily-update" element={<EmployeeDailyUpdate />} />
            <Route
              path="/admin/daily-updates"
              element={<AdminDailyUpdates />}
            />
            <Route path="/daily-update" element={<EmployeeDailyUpdate />} />
            <Route
              path="/daily-updates-review"
              element={<AdminDailyUpdates />}
            />
            <Route path="/blogs-page" element={<BlogsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/auto-reports" element={<AutoReportsPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/RecruitmentPage" element={<RecruitmentPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/content-calendar" element={<ContentCalendarPage />} />
            <Route path="/operations/calendar" element={<ContentOperationsWorkspace />} />
            <Route path="/campaign-operations" element={<ContentOperationsWorkspace />} />
            <Route path="/executive-dashboard" element={<AgencyExecutiveDashboard />} />
            <Route path="/client-reporting" element={<ClientReportingWorkspace />} />
            <Route path="/system/certification" element={<ProductionCertificationDashboard />} />
            <Route path="/creative-studio" element={<CreativeStudioPage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/customers/:id/onboarding" element={<CustomerOnboardingPage />} />
            <Route path="/ai-workspace" element={<AIWorkspacePage />} />
            <Route path="/agent-activity" element={<AgentActivityPage />} />
            <Route path="/ads" element={<AdCampaignsPage />} />
            <Route path="/ad-campaigns" element={<AdCampaignsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
