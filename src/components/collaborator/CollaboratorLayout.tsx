import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Home, CalendarDays, MessageCircle, User, HardHat, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";

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
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {/* Notification dot — uncomment when notifications are wired */}
          {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" /> */}
        </button>
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
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
