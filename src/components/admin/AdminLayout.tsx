import React, { useEffect, useState } from "react";
import { Bell, UserPlus, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useDashboardData } from "@/hooks/admin/useDashboardData";

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

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setDefaultSidebarOpen(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Notifications from shared RPC — zero extra queries
  const { criticalAlerts } = useDashboardData();

  const notifications = React.useMemo(() => {
    const items: { id: string; name: string; type: "cold" | "proposal" | "stalled"; link: string }[] = [];
    (criticalAlerts.newLeadsNoContact24h || []).forEach(l => items.push({ id: l.id, name: l.name, type: "cold", link: "/admin/leads?status=cold_lead" }));
    (criticalAlerts.proposalWithoutFollowUp || []).forEach(l => items.push({ id: l.id, name: l.name, type: "proposal", link: "/admin/leads?status=proposal_sent" }));
    (criticalAlerts.leadsStalled48h || []).forEach(l => items.push({ id: l.id, name: l.name, type: "stalled", link: "/admin/leads" }));
    return items;
  }, [criticalAlerts]);

  const notificationCount = notifications.length;

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <div className="h-dvh flex w-full bg-grey-light/30 min-w-0 overflow-hidden">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Enhanced Header */}
          <header className="h-14 flex-shrink-0 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 z-40 shadow-soft">
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[hsl(var(--state-blocked))] text-[10px] font-bold text-white px-1">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 bg-card border border-border shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">Notificações</h3>
                    <p className="text-[11px] text-muted-foreground">{notificationCount} pendente{notificationCount !== 1 ? "s" : ""}</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma notificação 🎉
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifications.map((n) => {
                        const config = {
                          cold: { icon: UserPlus, label: "Lead sem contato 24h", dotClass: "bg-[hsl(var(--state-risk))]" },
                          proposal: { icon: FileText, label: "Proposta sem follow-up", dotClass: "bg-[hsl(var(--state-blocked))]" },
                          stalled: { icon: AlertTriangle, label: "Parado +48h", dotClass: "bg-[hsl(var(--state-risk))]" },
                        }[n.type];
                        const Icon = config.icon;
                        return (
                          <Link
                            key={`${n.type}-${n.id}`}
                            to={n.link}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
                          >
                            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${config.dotClass}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{n.name}</p>
                              <p className="text-[11px] text-muted-foreground">{config.label}</p>
                            </div>
                            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <div className="px-4 py-2.5 border-t border-border">
                    <Link to="/admin/leads" className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline">
                      Ver todos os leads →
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-[hsl(var(--state-success))] rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 min-h-0 p-4 sm:p-6 pb-20 lg:pb-6 overflow-y-auto overflow-x-hidden animate-fade-in max-w-full min-w-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}