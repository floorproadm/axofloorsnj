import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Plus,
  Camera,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, path: "/admin/dashboard" },
  { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: null, icon: Plus, path: null }, // FAB center
  { label: "Feed", icon: Camera, path: "/admin/gallery" },
  { label: "Stats", icon: BarChart3, path: "/admin/performance" },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--navy-primary)/0.08)]">
      <div className="flex items-end justify-around px-2 h-16 max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          // FAB center button
          if (item.path === null) {
            return (
              <div key={idx} className="flex flex-col items-center -mt-5">
                <button
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Criar novo"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            );
          }

          const isActive = location.pathname === item.path ||
            (item.path === "/admin/jobs" && location.pathname.startsWith("/admin/jobs"));

          return (
            <NavLink
              key={idx}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
