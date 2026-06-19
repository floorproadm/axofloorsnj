import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Images,
  Building,
  Settings,
  LogOut,
  Home,
  Inbox,
  Ruler,
  BarChart3,
  Star,
  FileText,
  BookOpen,
  HelpCircle,
  Handshake,
  DollarSign,
  Zap,
  Truck,
  FolderKanban,
  
  CalendarDays,
  Clock,
  UserCheck,
  MessageSquare,
  Shield,
  Scan,
  MapPin,
  Receipt,
} from "lucide-react";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import floorproLogo from "@/assets/floorpro-logo.png.asset.json";
import { useOrgPlan } from "@/hooks/useOrgPlan";
import { useQuery } from "@tanstack/react-query";
import { resolveLogoUrl } from "@/hooks/useCompanySettings";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const chatUnread = useChatUnreadCount();
  const { isPro } = useOrgPlan();
  const { isPlatformAdmin } = usePlatformAdmin();

  // Only fetch tenant sidebar logo when the org is on PRO.
  // If sidebar_logo_url is not set, fall back DIRECTLY to the FloorPro logo
  // (do NOT use the general company logo — that one is for proposals/emails).
  const { data: tenantLogoUrl } = useQuery({
    queryKey: ["admin-sidebar-tenant-logo", isPro],
    enabled: isPro,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string> => {
      const { data: orgIdRes } = await supabase.rpc("get_user_org_id");
      const orgId = orgIdRes as string | null;
      if (!orgId) return "";
      const { data: cs } = await supabase
        .from("company_settings")
        .select("sidebar_logo_url")
        .eq("organization_id", orgId)
        .maybeSingle();
      return await resolveLogoUrl((cs as any)?.sidebar_logo_url);
    },
  });

  const brandLogoUrl = isPro && tenantLogoUrl ? tenantLogoUrl : floorproLogo.url;
  const brandLogoAlt = isPro && tenantLogoUrl ? "Logo" : "FloorPro";

  const topItems = [
    { title: "Home", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Projects", url: "/admin/projects", icon: FolderKanban },
    { title: "Schedule & Appointments", url: "/admin/schedule", icon: CalendarDays },
    { title: "Financeiro", url: "/admin/payments", icon: DollarSign },
    { title: "Invoices", url: "/admin/invoices", icon: Receipt },
  ];

  const toolsItems = [
    { title: t("sidebar.captacao"), url: "/admin/intake", icon: Inbox },
    { title: "Leads & Vendas", url: "/admin/leads", icon: Users },
    { title: "Visualizer", url: "/admin/visualizer", icon: Scan },
    { title: t("sidebar.propostas"), url: "/admin/proposals", icon: FileText },
    { title: "Reputation", url: "/admin/reputation", icon: Star },
  ];

  const manageItems = [
    { title: "Chat", url: "/admin/chat", icon: MessageSquare, badge: "chat" as const },
    { title: "Partners", url: "/admin/partners", icon: Handshake },
    { title: "Customers", url: "/admin/customers", icon: UserCheck },
    { title: "Equipe", url: "/admin/team", icon: Users },
    { title: "Map View", url: "/admin/gps", icon: MapPin },
    
    
    
    
    { title: t("sidebar.catalogo"), url: "/admin/catalog", icon: BookOpen },
    { title: "Gallery", url: "/admin/gallery", icon: Images },
    { title: "Automations", url: "/admin/automations", icon: Zap },
  ];

  const labeledGroups = [
    { label: t("sidebar.tools"), items: toolsItems },
    { label: t("sidebar.manage"), items: manageItems },
  ];

  const footerNavItems = [
    { title: t("sidebar.ajuda"), url: "/admin/help", icon: HelpCircle },
    { title: "Settings", url: "/admin/settings", icon: Settings },
    ...(isPlatformAdmin ? [{ title: "Platform Admin", url: "/platform", icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: t("auth.logoutRealizado"), description: t("auth.logoutDesc") });
    } catch {
      toast({ title: t("auth.erroLogout"), description: t("auth.tenteNovamente"), variant: "destructive" });
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-card/95 backdrop-blur-sm border-r border-border/50">
        {/* Brand */}
        <div className="py-6 px-4 border-b border-border/50">
          <div className="flex items-center justify-center">
            <img
              src={brandLogoUrl}
              alt={brandLogoAlt}
              className={`${collapsed ? "h-12" : "h-16"} w-auto object-contain animate-fade-in`}
            />
          </div>
        </div>

        {/* Top Items (no group label) */}
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {topItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin/dashboard"}
                      className={({ isActive }) => `
                        relative rounded-lg transition-all duration-150
                        ${isActive
                          ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {(item as any).badge === "chat" && chatUnread > 0 && (
                        <Badge className="ml-auto h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                          {chatUnread > 99 ? "99+" : chatUnread}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Labeled Groups (Tools, Manage) */}
        {labeledGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => `
                          relative rounded-lg transition-all duration-150
                          ${isActive
                            ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {(item as any).badge === "chat" && chatUnread > 0 && (
                          <Badge className="ml-auto h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                            {chatUnread > 99 ? "99+" : chatUnread}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Footer Nav (Help, Settings) */}
        <SidebarGroup className="px-2 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {footerNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => `
                        relative rounded-lg transition-all duration-150
                        ${isActive
                          ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ver Site */}
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href="https://axofloorsnj.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150"
                  >
                    <Home className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{t("sidebar.verSite")}</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">{t("sidebar.sair")}</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
