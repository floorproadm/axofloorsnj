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
  FolderOpen,
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Grupo 1: Menu (visão geral)
const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Captação", url: "/admin/intake", icon: Inbox },
];

// Grupo 2: Ferramentas (operação do dia-a-dia)
const toolsItems = [
  { title: "Pipeline de Vendas", url: "/admin/leads", icon: Users },
  { title: "Pipeline Operacional", url: "/admin/jobs", icon: Building },
  { title: "Portfólio", url: "/admin/gallery", icon: Images },
];

// Grupo 3: Gestão (configuração e admin)
const managementItems = [
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

const navGroups = [
  { label: "Menu", items: menuItems },
  { label: "Ferramentas", items: toolsItems },
  { label: "Gestão", items: managementItems },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    } catch {
      toast({ title: "Erro ao fazer logout", description: "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-card/95 backdrop-blur-sm border-r border-border/50">
        {/* Brand */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-navy text-lg">AXO OS</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sistema Operacional</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        {navGroups.map((group) => (
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
        ))}

        {/* Quick Action: Ver Site */}
        <SidebarGroup className="px-2 mt-auto">
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
                    {!collapsed && <span>Ver Site</span>}
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
            className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Sair do Sistema</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
