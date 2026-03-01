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
  CalendarDays,
  BarChart3,
  FileText,
  BookOpen,
  HelpCircle,
  Handshake,
  DollarSign,
  Zap,
} from "lucide-react";
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

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const { data } = await supabase
        .from("company_settings")
        .select("logo_url")
        .limit(1)
        .maybeSingle();
      const path = (data as any)?.logo_url;
      if (path) {
        const { data: signed } = await supabase.storage.from("media").createSignedUrl(path, 3600);
        if (signed) setLogoUrl(signed.signedUrl);
      }
    }
    fetchLogo();
  }, []);

  const topItems = [
    { title: "Home", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Jobs", url: "/admin/jobs", icon: Building },
    { title: "Performance", url: "/admin/performance", icon: BarChart3 },
    { title: t("sidebar.pagamentos"), url: "/admin/payments", icon: DollarSign },
    { title: "Schedule", url: "/admin/schedule", icon: CalendarDays },
  ];

  const toolsItems = [
    { title: t("sidebar.captacao"), url: "/admin/intake", icon: Inbox },
    { title: t("sidebar.medicoes"), url: "/admin/measurements", icon: Ruler },
    { title: t("sidebar.propostas"), url: "/admin/leads", icon: FileText },
  ];

  const manageItems = [
    { title: "Leads", url: "/admin/leads", icon: Users },
    { title: "Partners", url: "/admin/partners", icon: Handshake },
    { title: t("sidebar.catalogo"), url: "/admin/catalog", icon: BookOpen },
    { title: "Feed", url: "/admin/feed", icon: Images },
    { title: "Automations", url: "/admin/automations", icon: Zap },
  ];

  const labeledGroups = [
    { label: t("sidebar.tools"), items: toolsItems },
    { label: t("sidebar.manage"), items: manageItems },
  ];

  const footerNavItems = [
    { title: t("sidebar.ajuda"), url: "/admin/help", icon: HelpCircle },
    { title: "Settings", url: "/admin/settings", icon: Settings },
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
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-contain flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
            )}
            {!collapsed && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-foreground text-lg">AXO OS</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("sidebar.sistemaOperacional")}</p>
              </div>
            )}
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
                      {!collapsed && <span>{item.title}</span>}
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
                        {!collapsed && <span>{item.title}</span>}
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
                    href="/"
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
