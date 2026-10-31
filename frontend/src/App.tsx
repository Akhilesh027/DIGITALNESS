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
import CertificatesPage from "./pages/CertificatesPage";
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
import { UpcomingFeatureGuard } from "@/components/layout/UpcomingFeatureGuard";
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


import { ThemeProvider } from "@/components/theme-provider";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
              path="/client-login"
              element={<Navigate to="/" replace />}
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
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/certificates-page" element={<CertificatesPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/communications" element={<CommunicationsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/auto-reports"
                element={
                  <UpcomingFeatureGuard
                    title="Autonomous Reporting Engine"
                    category="Client Intelligence"
                    description="Scheduled executive digests, automated KPI infographics, and real-time agency client performance exports."
                    highlights={["Automated client performance summaries", "Weekly metric roll-ups", "Exportable executive PDFs"]}
                  >
                    <AutoReportsPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route
                path="/workflow"
                element={
                  <UpcomingFeatureGuard
                    title="Visual Workflow Automation"
                    category="Process Orchestration"
                    description="Automated trigger-and-action rules for SLA escalations, lead auto-assignment, and customer communication triggers."
                    highlights={["Visual event-driven workflow rules", "Automatic lead triage & routing", "Multi-channel SLA alerts"]}
                  >
                    <WorkflowPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route path="/RecruitmentPage" element={<RecruitmentPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route
                path="/content-calendar"
                element={
                  <UpcomingFeatureGuard
                    title="AI Content Calendar"
                    category="Autonomous Social Media"
                    description="Real-time festival and industry trend scanning, multi-brand post schedules, and autonomous creative draft generation."
                    highlights={["Indian festival & commercial holiday detection", "Multi-platform scheduling (FB, IG, GBP)", "Autonomous creative caption generator"]}
                  >
                    <ContentCalendarPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route path="/operations/calendar" element={<ContentOperationsWorkspace />} />
              <Route path="/campaign-operations" element={<ContentOperationsWorkspace />} />
              <Route path="/executive-dashboard" element={<AgencyExecutiveDashboard />} />
              <Route path="/client-reporting" element={<ClientReportingWorkspace />} />
              <Route path="/system/certification" element={<ProductionCertificationDashboard />} />
              <Route
                path="/creative-studio"
                element={
                  <UpcomingFeatureGuard
                    title="AI Creative Studio"
                    category="Visual Asset Generator"
                    description="Autonomous prompt-to-banner design, Canva asset generation, brand-safe palette styling, and one-click cloud publishing."
                    highlights={["One-click ad creatives & carousel banners", "Multi-aspect ratio rendering (1:1, 9:16)", "Direct Cloudinary asset storage"]}
                  >
                    <CreativeStudioPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route
                path="/scheduler"
                element={
                  <UpcomingFeatureGuard
                    title="24/7 Automation Scheduler"
                    category="Background Queue Engine"
                    description="Central control tower managing BullMQ background workers, recurring cron routines, and system-wide task execution."
                    highlights={["Real-time worker concurrency monitor", "Automatic job failover & retry", "Autonomous SLA guardian"]}
                  >
                    <SchedulerPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route path="/customers/:id/onboarding" element={<CustomerOnboardingPage />} />
              <Route
                path="/ai-workspace"
                element={
                  <UpcomingFeatureGuard
                    title="AI Agent Workspace & Copilot"
                    category="Agency Supercomputer"
                    description="Conversational agentic copilot capable of answering agency questions, analyzing customer health, and dispatching CRM workflows."
                    highlights={["Multi-agent chat assistant", "Live database insights & query tools", "Automated marketing audits"]}
                  >
                    <AIWorkspacePage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route
                path="/agent-activity"
                element={
                  <UpcomingFeatureGuard
                    title="AI Agent Activity Monitor"
                    category="Telemetry & Token Audit"
                    description="Live audit trail of background agent executions, model token consumption, success rates, and autonomous decisions."
                    highlights={["Live agent task stream", "Token expense analytics", "Worker event logs & forensics"]}
                  >
                    <AgentActivityPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route
                path="/ads"
                element={
                  <UpcomingFeatureGuard
                    title="AI Ad Operations & Spend Lock"
                    category="Meta & Google Performance Ads"
                    description="Unified ad campaign builder, real-time ROAS tracker, and emergency spending kill-switches across Meta and Google Ads."
                    highlights={["Emergency spend & write safety locks", "Meta & Google Ads sync", "Automated audience cohort optimization"]}
                  >
                    <AdCampaignsPage />
                  </UpcomingFeatureGuard>
                }
              />
              <Route
                path="/ad-campaigns"
                element={
                  <UpcomingFeatureGuard
                    title="AI Ad Operations & Spend Lock"
                    category="Meta & Google Performance Ads"
                    description="Unified ad campaign builder, real-time ROAS tracker, and emergency spending kill-switches across Meta and Google Ads."
                    highlights={["Emergency spend & write safety locks", "Meta & Google Ads sync", "Automated audience cohort optimization"]}
                  >
                    <AdCampaignsPage />
                  </UpcomingFeatureGuard>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
