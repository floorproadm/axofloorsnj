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
      <div className="min-h-screen flex w-full bg-grey-light/30">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40 shadow-soft">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 hover:bg-primary/10 transition-admin" />
              
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-navy">{title}</h1>
                
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-admin">
                          Admin
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {item.href ? (
                              <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-primary transition-admin">
                                {item.label}
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage className="text-navy font-medium">{item.label}</BreadcrumbPage>
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
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Sistema Online
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 overflow-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}