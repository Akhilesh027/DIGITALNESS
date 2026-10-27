import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Target,
  Building2,
  ClipboardList,
  Phone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PackageCheck,
  Eye,
  TrendingUp,
  FileSignature,
  GitBranch,
  FileBox,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  CheckSquare,
  Trophy,
  Bell,
  FileBarChart,
  Workflow,
  Calendar,
  UserCheck,
  Newspaper,
  BriefcaseBusiness,
  ShieldCheck,
  Palette,
  Clock,
  Bot,
  Sparkles,
  Megaphone,
  BarChart3,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { clearAuth } from '@/api/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [
          'Admin',
          'Operational Manager',
          'Performance Marketer',
          'Content Writer',
          'Graphic Designer',
          'UI/UX',
          'Frontend Dev',
          'Backend Dev',
          'BDE',
          'Support',
          'Telecaller',
        ],
      },
    ],
  },
  {
    title: 'Growth & Funnel',
    items: [
      {
        label: 'Leads',
        path: '/leads',
        icon: Target,
        roles: ['Admin', 'Operational Manager', 'BDE', 'Performance Marketer', 'Telecaller'],
      },
      {
        label: 'Sales Pipeline',
        path: '/sales-pipeline',
        icon: TrendingUp,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Proposals',
        path: '/proposals',
        icon: FileSignature,
        roles: ['Admin', 'Operational Manager', 'BDE'],
      },
      {
        label: 'Ad Campaigns',
        path: '/ads',
        icon: Megaphone,
        roles: ['Admin', 'Operational Manager', 'Performance Marketer', 'BDE'],
        badge: 'Live',
      },
    ],
  },
  {
    title: 'Client Hub',
    items: [
      {
        label: 'Customers',
        path: '/customers',
        icon: Building2,
        roles: ['Admin', 'Operational Manager', 'BDE'],
      },
      {
        label: 'Client Portal',
        path: '/client-portal',
        icon: Eye,
        roles: ['Admin', 'Operational Manager', 'BDE'],
      },
      {
        label: 'Deliverables',
        path: '/deliverables',
        icon: PackageCheck,
        roles: [
          'Admin',
          'Operational Manager',
          'Content Writer',
          'Graphic Designer',
          'UI/UX',
          'Frontend Dev',
          'Backend Dev',
        ],
      },
      {
        label: 'Telecaller',
        path: '/telecaller',
        icon: Phone,
        roles: ['Admin', 'Operational Manager', 'BDE'],
      },
      {
        label: 'Communications',
        path: '/communications',
        icon: MessageSquare,
        roles: ['Admin', 'Operational Manager', 'BDE', 'Support', 'Telecaller'],
      },
      {
        label: 'Tickets',
        path: '/tickets',
        icon: LifeBuoy,
        roles: ['Admin', 'Operational Manager', 'Support', 'Telecaller'],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Works',
        path: '/works',
        icon: ClipboardList,
        roles: ['Admin', 'Operational Manager', 'UI/UX', 'Frontend Dev', 'Backend Dev'],
      },
      {
        label: 'Tasks',
        path: '/tasks',
        icon: ListChecks,
        roles: [
          'Admin',
          'Operational Manager',
          'Performance Marketer',
          'Content Writer',
          'Graphic Designer',
          'UI/UX',
          'Frontend Dev',
          'Backend Dev',
          'Support',
          'Telecaller',
        ],
      },
      {
        label: 'Content Calendar',
        path: '/content-calendar',
        icon: Calendar,
        roles: ['Admin', 'Operational Manager', 'Content Writer', 'Graphic Designer'],
      },
      {
        label: 'Approvals',
        path: '/approvals',
        icon: CheckSquare,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Templates',
        path: '/templates',
        icon: FileBox,
        roles: ['Admin', 'Operational Manager', 'Content Writer', 'Graphic Designer'],
      },
    ],
  },
  {
    title: 'AI & Automation',
    items: [
      {
        label: 'AI Workspace',
        path: '/ai-workspace',
        icon: Sparkles,
        roles: ['Admin', 'Operational Manager'],
        badge: 'AI',
      },
      {
        label: 'Creative Studio',
        path: '/creative-studio',
        icon: Palette,
        roles: ['Admin', 'Operational Manager', 'Graphic Designer', 'UI/UX'],
        badge: 'AI',
      },
      {
        label: 'Automation Scheduler',
        path: '/scheduler',
        icon: Clock,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Agent Activity',
        path: '/agent-activity',
        icon: Bot,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Workflow Engine',
        path: '/workflow',
        icon: Workflow,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Autonomous Reports',
        path: '/auto-reports',
        icon: FileBarChart,
        roles: ['Admin', 'Operational Manager'],
      },
    ],
  },
  {
    title: 'Performance & Audit',
    items: [
      {
        label: 'Reports',
        path: '/reports',
        icon: BarChart3,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Performance',
        path: '/performance',
        icon: Trophy,
        roles: ['Admin', 'Operational Manager', 'Performance Marketer'],
      },
      {
        label: 'Audit Logs',
        path: '/audit-logs',
        icon: ShieldCheck,
        roles: ['Admin', 'Operational Manager'],
      },
    ],
  },
  {
    title: 'Team & Admin',
    items: [
      {
        label: 'Employees',
        path: '/employees',
        icon: Users,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Attendance',
        path: '/AttendancePage',
        icon: UserCheck,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Employee Report',
        path: '/employee-report',
        icon: ClipboardList,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Recruitment',
        path: '/RecruitmentPage',
        icon: BriefcaseBusiness,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Branches',
        path: '/branches',
        icon: GitBranch,
        roles: ['Admin'],
      },
      {
        label: 'Blog Management',
        path: '/blogs-page',
        icon: Newspaper,
        roles: ['Admin', 'Operational Manager'],
      },
      {
        label: 'Notifications',
        path: '/notifications',
        icon: Bell,
        roles: [
          'Admin',
          'Operational Manager',
          'Performance Marketer',
          'Content Writer',
          'Graphic Designer',
          'UI/UX',
          'Frontend Dev',
          'Backend Dev',
          'BDE',
          'Support',
          'Telecaller',
        ],
      },
    ],
  },
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = getStoredUser();
  const currentRole = currentUser?.role || 'Admin';

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken');

      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api';
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/', { replace: true });
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 272 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-[#18204A]/60 bg-[#0A0D23] text-slate-200 shadow-2xl select-none"
    >
      {/* Brand Header */}
      <div className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-[#18204A]/70 px-4">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 overflow-hidden group focus:outline-none"
        >
          {/* Logo Mark Container */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10 shadow-inner group-hover:border-[#FF1B7A]/50 transition-colors">
            <img
              src="/logo.png"
              alt="Digitalness Logo"
              className="h-full w-full object-contain filter drop-shadow"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#FF1B7A]/20 via-transparent to-[#00D8F6]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-w-0 flex-col"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-lg font-bold tracking-tight text-white">
                  DIGITALNESS
                </span>
                <span className="text-[10px] text-[#00D8F6] font-mono font-semibold">®</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1">
                <span className="text-[#FF1B7A]">︽</span> Grow your business
              </span>
            </motion.div>
          )}
        </NavLink>

        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-lg border border-white/10 bg-[#121738] text-slate-300 hover:bg-[#1C2352] hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
        {navSections.map((section) => {
          // Filter items based on user role
          const visibleItems = section.items.filter((item) => item.roles.includes(currentRole));
          if (visibleItems.length === 0) return null;

          const isSectionOpen = !collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between px-3 py-1 cursor-pointer group select-none text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-slate-500 group-hover:text-slate-300 transition-transform duration-200',
                      !isSectionOpen && '-rotate-90'
                    )}
                  />
                </div>
              )}

              <AnimatePresence initial={false}>
                {(collapsed || isSectionOpen) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {visibleItems.map((item) => {
                      const isActive =
                        location.pathname === item.path ||
                        (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`));

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                            collapsed && 'justify-center px-0 h-10 w-10 mx-auto',
                            isActive
                              ? 'bg-gradient-to-r from-[#FF1B7A] via-[#7928CA] to-[#00D8F6] text-white shadow-lg shadow-[#FF1B7A]/20'
                              : 'text-slate-300 hover:bg-[#161D45] hover:text-white'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#00D8F6]'
                            )}
                          />

                          {!collapsed && (
                            <span className="truncate flex-1 text-xs font-medium tracking-wide">
                              {item.label}
                            </span>
                          )}

                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#FF1B7A]/20 text-[#FF1B7A] border border-[#FF1B7A]/30'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}

                          {isActive && (
                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-white rounded-r-full shadow-glow" />
                          )}
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="shrink-0 border-t border-[#18204A]/80 p-3 bg-[#080B1D]/80">
        {currentUser?.name && (
          <div
            className={cn(
              'mb-2.5 flex items-center gap-3 rounded-xl p-2 bg-[#121738]/60 border border-white/5',
              collapsed && 'justify-center p-1'
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#FF1B7A] to-[#00D8F6] text-xs font-bold text-white shadow-sm">
              {currentUser.name.charAt(0).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0A0D23]" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white tracking-tight">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00D8F6]" />
                  <span className="truncate text-[10px] text-slate-400 font-mono">
                    {currentRole}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 rounded-lg text-xs h-8 transition-colors',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2 font-medium">Log out</span>}
          </Button>

          {!collapsed && (
            <ThemeToggle
              variant="icon-only"
              className="h-8 w-8 rounded-lg border-white/10 bg-[#121738]/60 text-slate-300 hover:text-white hover:bg-[#1C2352]"
            />
          )}
        </div>
      </div>
    </motion.aside>
  );
}
