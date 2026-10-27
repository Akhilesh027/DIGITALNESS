import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Sparkles,
  Plus,
  Building2,
  Target,
  ListTodo,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, authHeaders, isTokenValid } from "@/api/auth";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

export function Header() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const getAuthConfig = () => ({
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  const fetchNotificationCount = async () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!token || !isTokenValid(token)) return;

    try {
      const res = await fetch(`${API_URL}/notifications`, getAuthConfig());
      if (res.status === 401) return;
      if (!res.ok) return;

      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // quiet catch
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[70px] px-6 bg-card/80 backdrop-blur-xl border-b border-border/80 shadow-sm transition-all">
      {/* Left Greeting & Context */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {getGreeting()},
            </span>
            <span className="text-xs font-semibold text-foreground/80">
              {currentUser?.name || "Team Member"}
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-heading font-bold text-foreground tracking-tight flex items-center gap-2">
            Agency Control Tower
            <span className="hidden sm:inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Live
            </span>
          </h1>
        </div>
      </div>

      {/* Center Search Bar with Instant Command Look */}
      <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

          <Input
            type="search"
            placeholder="Search clients, leads, tasks, team..."
            className="pl-10 pr-12 h-10 rounded-xl bg-secondary/50 border-border/70 hover:border-primary/40 focus:border-primary focus:bg-background transition-all text-xs"
          />

          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#FF1B7A] via-[#7928CA] to-[#00D8F6] hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-[#FF1B7A]/20 transition-all gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border border-border/80 shadow-xl p-1.5">
            <DropdownMenuLabel className="text-[11px] font-mono text-muted-foreground px-2 py-1">
              Quick Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate("/customers")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span>New Customer</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/leads")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#FF1B7A]" />
              <span>New Lead</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/tasks")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
            >
              <ListTodo className="w-4 h-4 text-[#00D8F6]" />
              <span>New Task</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => navigate("/ai-workspace")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-indigo-600 dark:text-indigo-400"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-xl border-border/70 hover:bg-secondary/70 transition-colors"
          onClick={() => navigate("/notifications")}
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />

          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#FF1B7A] to-rose-600 text-white text-[10px] flex items-center justify-center font-bold shadow-md shadow-[#FF1B7A]/30">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF1B7A] rounded-full animate-ping" />
            </>
          )}
        </Button>

        {/* Dark & Light Theme Switcher */}
        <ThemeToggle />

        {/* User Role Badge */}
        {currentUser && (
          <div className="hidden lg:flex items-center pl-1">
            <Badge
              variant="outline"
              className="rounded-lg text-[11px] font-medium border-border/80 bg-secondary/40 text-foreground px-2.5 py-1"
            >
              {currentUser.role}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}