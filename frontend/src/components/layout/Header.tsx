import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCRMStore } from "@/store/crmStore";
import { Badge } from "@/components/ui/badge";

import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

import { getCurrentUser, authHeaders, isTokenValid } from "@/api/auth";

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
      const res = await fetch(
        `${API_URL}/notifications`,
        getAuthConfig()
      );

      if (res.status === 401) {
        return;
      }

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
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}
          </p>

          <h1 className="text-lg font-heading font-semibold text-foreground">
            {currentUser?.name}
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <Input
            type="search"
            placeholder="Search leads, customers, tasks..."
            className="pl-10 bg-secondary/50 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="w-5 h-5 text-muted-foreground" />

          {unreadCount > 0 && (
            <>
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </>
          )}
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Role */}
        {currentUser && (
          <Badge
            variant="secondary"
            className="ml-2 hidden sm:flex"
          >
            {currentUser.role}
          </Badge>
        )}
      </div>
    </header>
  );
}