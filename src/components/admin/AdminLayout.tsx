import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
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
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8" />
              
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
                      </BreadcrumbItem>
                      {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {item.href ? (
                              <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                )}
              </div>
            </div>

            {/* Header Actions - pode ser expandido futuramente */}
            <div className="flex items-center gap-2">
              {/* Placeholder para notificações, perfil, etc. */}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}