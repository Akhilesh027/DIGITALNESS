import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingAICopilot } from '@/components/ai/FloatingAICopilot';
import { ServiceAccessProvider, useServiceAccess } from '@/lib/serviceAccess';
import { clearAuth, authHeaders } from '@/api/auth';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  return <ServiceAccessProvider><AuthorizedLayout /></ServiceAccessProvider>;
}
function AuthorizedLayout() {
  const { access, error, refresh } = useServiceAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = async () => {
    try { await fetch(`${import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api'}/auth/logout`, { method: 'POST', headers: authHeaders() }); }
    finally { clearAuth(); navigate('/', { replace: true }); }
  };
  if (!access) return <main className="p-6"><p>{error || 'Checking your access…'}</p>{error && <Button onClick={refresh}>Retry Access Check</Button>}<Button variant="ghost" onClick={logout}>Sign Out</Button></main>;
  if (access.mode === 'assigned') {
    if (location.pathname !== '/my-services') return <Navigate to="/my-services" replace />;
    return <div className="min-h-screen bg-background"><header className="flex items-center justify-between gap-3 border-b p-4"><span className="font-semibold">Digitalness Employee Workspace</span><Button variant="outline" onClick={logout}>Sign Out</Button></header><main className="p-4 sm:p-6"><Outlet /></main></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background relative">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* GLOBAL FLOATING AI COPILOT BOT WIDGET */}
      <FloatingAICopilot />
    </div>
  );
}
