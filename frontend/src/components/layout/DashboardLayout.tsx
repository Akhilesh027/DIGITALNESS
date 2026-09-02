import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingAICopilot } from '@/components/ai/FloatingAICopilot';

export function DashboardLayout() {

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