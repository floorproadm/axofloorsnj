import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Home, CalendarDays, MessageCircle, User, HardHat, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";

const NAV_ITEMS = [
  { path: "/collaborator", icon: Home, label: "Home", exact: true },
  { path: "/collaborator/schedule", icon: CalendarDays, label: "Schedule" },
  { path: "/collaborator/chat", icon: MessageCircle, label: "Chat" },
  { path: "/collaborator/profile", icon: User, label: "Profile" },
];

export default function CollaboratorLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifications = [], unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unread chat messages count
  const { data: unreadChatCount = 0 } = useQuery({
    queryKey: ["unread-chat-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      // Get collaborator's projects
      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) return 0;
      const projectIds = memberships.map((m) => m.project_id);
      
      const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds)
        .eq("read", false)
        .neq("sender_id", user.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // poll every 30s
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/collaborator")} className="flex items-center gap-2">
          <HardHat className="h-5 w-5 text-primary" />
          <span className="font-heading font-semibold text-foreground">
            AXO Field
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-xl border bg-card shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b">
                <span className="text-sm font-semibold text-foreground">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Sem notificações
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markAsRead.mutate(n.id);
                      if (n.link) navigate(n.link);
                      setShowNotifications(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-accent/50 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(new Date(n.created_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-bottom">
        <div className="flex items-center justify-around max-w-2xl mx-auto h-16">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            const badge = item.label === "Chat" ? unreadChatCount : 0;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] relative",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
