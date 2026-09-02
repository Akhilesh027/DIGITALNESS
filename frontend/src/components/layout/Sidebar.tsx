import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Target, Building2, ClipboardList, Phone,
  Wallet, BarChart3, ChevronLeft, ChevronRight, LogOut, Crown,
  FileText, PackageCheck, CreditCard, Eye, TrendingUp, FileSignature,
  GitBranch, FileBox, LifeBuoy, ListChecks, MessageSquare, CheckSquare,
  Trophy, Receipt, Bell, FileBarChart, Workflow,
} from 'lucide-react';
import { Calendar, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  Newspaper,
  BriefcaseBusiness,
  ShieldCheck,
  Palette,
  Clock,
  Bot,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { clearAuth } from '@/api/auth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
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

  {
    label: 'Employees',
    path: '/employees',
    icon: Users,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Leads',
    path: '/leads',
    icon: Target,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',
      'Performance Marketer',
      'Telecaller',
    ],
  },

  {
    label: 'Sales Pipeline',
    path: '/sales-pipeline',
    icon: TrendingUp,
    roles: [
      'Admin',
      'Operational Manager',

    ],
  },

  {
    label: 'Proposals',
    path: '/proposals',
    icon: FileSignature,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',
    ],
  },

  {
    label: 'Customers',
    path: '/customers',
    icon: Building2,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',

    ],
  },

  {
    label: 'Works',
    path: '/works',
    icon: ClipboardList,
    roles: [
      'Admin',
      'Operational Manager',
      'UI/UX',
      'Frontend Dev',
      'Backend Dev',
    ],
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
    label: 'Communications',
    path: '/communications',
    icon: MessageSquare,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',
      'Support',
      'Telecaller',
    ],
  },

  {
    label: 'Approvals',
    path: '/approvals',
    icon: CheckSquare,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Performance',
    path: '/performance',
    icon: Trophy,
    roles: [
      'Admin',
      'Operational Manager',
      'Performance Marketer',

    ],
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

  {
    label: 'Auto Reports',
    path: '/auto-reports',
    icon: FileBarChart,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Workflow',
    path: '/workflow',
    icon: Workflow,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Client Portal',
    path: '/client-portal',
    icon: Eye,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',

    ],
  },

  {
    label: 'Telecaller',
    path: '/telecaller',
    icon: Phone,
    roles: [
      'Admin',
      'Operational Manager',
      'BDE',
    ],
  },

  // {
  //   label: 'Accounts',
  //   path: '/accounts',
  //   icon: Wallet,
  //   roles: ['Admin', 'Operational Manager'],
  // },

  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Tickets',
    path: '/tickets',
    icon: LifeBuoy,
    roles: [
      'Admin',
      'Operational Manager',
      'Support',
      'Telecaller',
    ],
  },

  {
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: ShieldCheck,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Content Calendar',
    path: '/content-calendar',
    icon: Calendar,
    roles: ['Admin', 'Operational Manager', 'Content Writer', 'Graphic Designer'],
  },

  {
    label: 'Creative Studio',
    path: '/creative-studio',
    icon: Palette,
    roles: ['Admin', 'Operational Manager', 'Graphic Designer', 'UI/UX'],
  },

  {
    label: 'Scheduler',
    path: '/scheduler',
    icon: Clock,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'AI Workspace',
    path: '/ai-workspace',
    icon: Sparkles,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Ad Campaigns',
    path: '/ads',
    icon: Megaphone,
    roles: ['Admin', 'Operational Manager', 'Performance Marketer', 'BDE'],
  },

  {
    label: 'Agent Activity',
    path: '/agent-activity',
    icon: Bot,
    roles: ['Admin', 'Operational Manager'],
  },

  {
    label: 'Templates',
    path: '/templates',
    icon: FileBox,
    roles: [
      'Admin',
      'Operational Manager',
      'Content Writer',
      'Graphic Designer',
    ],
  },

  {
    label: 'Branches',
    path: '/branches',
    icon: GitBranch,
    roles: ['Admin'],
  },


  {
    label: "Employee Report",
    path: "/employee-report",
    icon: ClipboardList,
    roles: ["Admin", "Operational Manager"],
  },
  {
    label: "Attendance",
    path: "/AttendancePage",
    icon: UserCheck,
    roles: ["Admin", "Operational Manager"],
  },
  {
    label: "Blog Management",
    path: "/blogs-page",
    icon: Newspaper,
    roles: ["Admin", "Operational Manager"],
  },
  {
    label: "Recruitment",
    path: "/RecruitmentPage",
    icon: BriefcaseBusiness,
    roles: ["Admin", "Operational Manager"],
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
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = getStoredUser();
  const currentRole = currentUser?.role;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate("/", { replace: true });
    }
  };
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sticky top-0 z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-[73px] shrink-0 items-center gap-3 border-b border-sidebar-border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/20">
          <Crown className="h-6 w-6 text-sidebar-primary" />
        </div>

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-w-0 flex-col"
          >
            <span className="truncate font-heading text-lg font-bold text-sidebar-foreground">
              Digitalness
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              Digital Marketing CRM
            </span>
          </motion.div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {filteredNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                )}
              />

              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {currentUser?.name && (
          <div
            className={cn(
              'mb-3 flex items-center gap-3',
              collapsed && 'justify-center'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-semibold text-sidebar-primary">
              {currentUser.name.charAt(0)}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {currentRole}
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive',
            collapsed ? 'justify-center px-0' : 'justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
