import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Images,
  Building,
  Settings,
  LogOut,
  Home,
  TrendingUp,
  Calendar,
  FileText
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: null
  },
  {
    title: "Gestão de Leads",
    url: "/admin/leads",
    icon: Users,
    badge: null
  },
  {
    title: "Galeria",
    url: "/admin/gallery",
    icon: Images,
    badge: null
  },
  {
    title: "Projetos",
    url: "/admin/projects",
    icon: Building,
    badge: null
  },
  {
    title: "Relatórios",
    url: "/admin/reports",
    icon: FileText,
    badge: null
  },
  {
    title: "Agendamentos",
    url: "/admin/appointments",
    icon: Calendar,
    badge: null
  }
];

const quickActions = [
  {
    title: "Site Principal",
    url: "/",
    icon: Home
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: TrendingUp
  },
  {
    title: "Configurações",
    url: "/admin/settings",
    icon: Settings
  }
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isMainNavExpanded = navigationItems.some((item) => isActive(item.url));
  const isQuickActionsExpanded = quickActions.some((item) => isActive(item.url));

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15" 
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card/95 backdrop-blur-sm border-r border-border/50">
        {/* Enhanced Logo/Brand */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center shadow-gold">
              <span className="text-navy font-bold text-lg">A</span>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h2 className="font-semibold text-navy text-lg">AXO Admin</h2>
                <p className="text-xs text-muted-foreground">Sistema Administrativo</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Main Navigation */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-navy font-medium">
            {!collapsed && "Navegação Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin/dashboard"}
                      className={({ isActive }) => `
                        relative rounded-lg transition-admin hover-lift
                        ${isActive 
                          ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-soft" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-navy"
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge className="bg-primary/20 text-primary text-xs animate-pulse">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Quick Actions */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-navy font-medium">
            {!collapsed && "Ações Rápidas"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        rounded-lg transition-admin hover-lift
                        ${isActive 
                          ? "bg-accent/50 text-accent-foreground font-medium" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-navy"
                        }
                      `}
                      target={item.url === "/" ? "_blank" : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Logout Button */}
        <div className="mt-auto p-4 border-t border-border/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-admin"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Sair do Sistema</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}