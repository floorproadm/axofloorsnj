import React, { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ActionableAlertsSection } from "./ActionableAlertsSection";
import { TensionMetricsCards } from "./TensionMetricsCards";
import { supabase } from "@/integrations/supabase/client";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

interface Lead {
  id: string;
  name: string;
  status: string;
  follow_up_actions?: { date: string; action: string }[];
  next_action_date?: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  customer_name: string;
  project_status: string;
}

interface JobProof {
  project_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
}

export function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobProofs, setJobProofs] = useState<JobProof[]>([]);

  useEffect(() => {
    const fetchAlertData = async () => {
      try {
        const [leadsRes, projectsRes, jobProofsRes] = await Promise.all([
          supabase.from('leads').select('id, name, status, follow_up_actions, next_action_date, created_at, updated_at'),
          supabase.from('projects').select('id, customer_name, project_status'),
          supabase.from('job_proof').select('project_id, before_image_url, after_image_url')
        ]);

        if (leadsRes.data) {
          setLeads(leadsRes.data.map(l => ({
            ...l,
            follow_up_actions: Array.isArray(l.follow_up_actions) 
              ? l.follow_up_actions as { date: string; action: string }[]
              : []
          })));
        }
        if (projectsRes.data) setProjects(projectsRes.data);
        if (jobProofsRes.data) setJobProofs(jobProofsRes.data);
      } catch (error) {
        console.error('Error fetching alert data:', error);
      }
    };

    fetchAlertData();
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-grey-light/30">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
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
          <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in max-w-full">
            {/* Ações Obrigatórias - Fixed Section at Top */}
            <ActionableAlertsSection 
              leads={leads} 
              projects={projects} 
              jobProofs={jobProofs} 
            />
            
            {/* Tension Metrics Cards */}
            <TensionMetricsCards 
              leads={leads} 
              projects={projects} 
              jobProofs={jobProofs} 
            />
            
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}