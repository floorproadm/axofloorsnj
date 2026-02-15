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
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-soft">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <SidebarTrigger className="h-8 w-8 hover:bg-primary/10 transition-admin flex-shrink-0" />
              
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-navy truncate">{title}</h1>
                
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <Breadcrumb>
                    <BreadcrumbList className="flex-wrap">
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-admin text-xs sm:text-sm">
                          Admin
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {item.href ? (
                              <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-primary transition-admin text-xs sm:text-sm">
                                {item.label}
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage className="text-navy font-medium text-xs sm:text-sm">{item.label}</BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Sistema Online
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