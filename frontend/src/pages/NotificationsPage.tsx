import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckSquare,
  FileText,
  Target,
  Settings as SettingsIcon,
  ClipboardCheck,
  Briefcase,
  Users,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotifType =
  | "task"
  | "work"
  | "approval"
  | "invoice"
  | "lead"
  | "deal"
  | "proposal"
  | "customer"
  | "system";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: NotifType;
  moduleId?: string;
  moduleModel?: string;
  recipient?: string;
  createdBy?: any;
  isRead: boolean;
  link?: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const iconFor: Record<NotifType, any> = {
  task: ClipboardCheck,
  work: Briefcase,
  approval: CheckSquare,
  invoice: FileText,
  lead: Target,
  deal: Briefcase,
  proposal: FileText,
  customer: Users,
  system: SettingsIcon,
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  return [];
};

export default function NotificationsPage() {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/notifications`, getAuthConfig());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
      }

      const notifications = getArrayData(data);

      setList(notifications);
      setUnreadCount(
        data.unreadCount ??
        notifications.filter((n: NotificationItem) => !n.isRead).length
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to mark as read");
      }

      setList((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error: any) {
      toast.error(error.message || "Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to mark all as read");
      }

      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast.success("All marked as read");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as read");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Bell className="w-7 h-7" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2">
                {unreadCount} New
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Inbox of leads, deals, tasks, works, proposals and customer alerts
          </p>
        </div>

        <Button variant="outline" onClick={markAllRead} disabled={!unreadCount}>
          Mark all as read
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      )}

      <div className="space-y-2">
        {!loading && list.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            You're all caught up 🎉
          </p>
        )}

        {list.map((n) => {
          const Icon = iconFor[n.type] || UserPlus;

          return (
            <Card
              key={n._id}
              className={!n.isRead ? "border-primary/40 bg-primary/5" : ""}
            >
              <CardContent className="pt-4 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>

                    {!n.isRead && (
                      <Badge variant="default" className="text-[10px] h-4">
                        NEW
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {n.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {n.message}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    {/* {n.link && (
                      <Link to={n.link}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => !n.isRead && markRead(n._id)}
                        >
                          Open
                        </Button>
                      </Link>
                    )} */}

                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markRead(n._id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}