import React, { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [defaultSidebarOpen, setDefaultSidebarOpen] = useState(true);

  // Sidebar: aberta em desktop (>=1024px) e colapsada em mobile/tablet
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setDefaultSidebarOpen(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="min-h-screen flex w-full bg-grey-light/30 min-w-0 overflow-x-hidden">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Enhanced Header */}
          <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-soft">
            <div className="flex items-center gap-3 flex-shrink-0">
              <SidebarTrigger className="h-8 w-8 hover:bg-primary/10 transition-admin flex-shrink-0" />
              {title && (
                <h1 className="text-lg font-semibold text-foreground truncate hidden sm:block">{title}</h1>
              )}
            </div>

            {/* Center - Week info */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                {(() => {
                  const now = new Date();
                  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
                  return `Week ${weekNum} · ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                })()}
              </p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-[hsl(var(--state-success))] rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6 overflow-y-auto overflow-x-hidden animate-fade-in max-w-full min-w-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}