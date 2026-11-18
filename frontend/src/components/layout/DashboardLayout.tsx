import { Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingAICopilot } from '@/components/ai/FloatingAICopilot';
import { ServiceAccessProvider, useServiceAccess } from '@/lib/serviceAccess';
import { clearAuth, authHeaders, getCurrentUser } from '@/api/auth';
import { BriefcaseBusiness, LogOut, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { employeeViews } from '@/pages/EmployeeWorkspacePage';

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
    const user = getCurrentUser();
    return <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6"><img src="/logo.png" alt="" className="h-10 w-10 rounded-xl object-contain" /><div><p className="text-lg font-bold tracking-wide">DIGITALNESS</p><p className="text-xs text-white/50">Employee workspace</p></div></div>
        <nav aria-label="Workspace navigation" className="flex-1 space-y-2 p-4"><p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Workspace</p>{employeeViews.map(({ id, label, Icon }) => {
          const active = (new URLSearchParams(location.search).get('view') || 'today') === id;
          return <Link key={id} to={`/my-services?view=${id}`} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}><Icon className={`h-5 w-5 ${active ? 'text-pink-400' : ''}`} />{label}</Link>;
        })}<div className="mx-2 mt-8 rounded-xl border border-white/10 p-4"><ShieldCheck className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-sm font-medium">Your assigned work</p><p className="mt-2 text-xs leading-relaxed text-white/50">Clients, services and tools shared with you by your team.</p></div></nav>
        <div className="border-t border-white/10 p-5"><p className="truncate text-sm font-semibold">{user?.name || 'Team member'}</p><p className="mt-1 truncate text-xs text-white/50">{user?.role || 'Employee'}</p><button onClick={logout} className="mt-4 flex items-center gap-2 text-xs text-white/60 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button></div>
      </aside>
      <div className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between gap-3 border-b bg-card px-4 sm:px-8"><div className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-semibold">My workspace</p><p className="text-xs text-muted-foreground">Digitalness / Employee portal</p></div></div><div className="flex items-center gap-3"><ThemeToggle /><span className="hidden rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium sm:block">{user?.name || 'Team member'}</span><Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}><LogOut className="h-4 w-4" /></Button></div></header><main className="p-4 sm:p-8"><Outlet /></main></div>
    </div>;
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
