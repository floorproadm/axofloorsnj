import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Briefcase,
  Plus,
  Camera,
  BarChart3,
  ClipboardList,
  HardHat,
  UserPlus,
  FileText,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  ImagePlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { NewJobDialog } from "./NewJobDialog";
import { NewLeadDialog } from "./NewLeadDialog";
import { NewEstimateDialog } from "./NewEstimateDialog";

const navItems = [
  { label: "Home", icon: Home, path: "/admin/dashboard" },
  { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: null, icon: Plus, path: null }, // FAB center
  { label: "Feed", icon: Camera, path: "/admin/feed" },
  { label: "Stats", icon: BarChart3, path: "/admin/performance" },
];

const quickActions = [
  { label: "Nova Tarefa", icon: ClipboardList, action: "task" },
  { label: "Novo Job", icon: HardHat, action: "job" },
  { label: "Novo Lead", icon: UserPlus, action: "lead" },
  { label: "Novo Orçamento", icon: FileText, action: "estimate" },
  { label: "Nova Ordem", icon: ShoppingCart, action: "order" },
  { label: "Nova Despesa", icon: Receipt, action: "expense" },
  { label: "Nova Fatura", icon: FileSpreadsheet, action: "invoice" },
  { label: "Nova Foto", icon: ImagePlus, action: "photo" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newEstimateOpen, setNewEstimateOpen] = useState(false);

  const handleQuickAction = (action: string) => {
    setDrawerOpen(false);
    switch (action) {
      case "lead":
        setNewLeadOpen(true);
        break;
      case "job":
        setNewJobOpen(true);
        break;
      case "estimate":
        setNewEstimateOpen(true);
        break;
      case "photo":
        navigate("/admin/feed");
        break;
      default:
        // placeholder for future actions
        break;
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--navy-primary)/0.08)]">
        <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
          {navItems.map((item, idx) => {
            if (item.path === null) {
              return (
                <div key={idx} className="flex flex-col items-center relative -top-4">
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Criar novo"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              );
            }

            const isActive =
              location.pathname === item.path ||
              (item.path === "/admin/jobs" &&
                location.pathname.startsWith("/admin/jobs"));

            return (
              <NavLink
                key={idx}
                to={item.path}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Quick Actions Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle className="text-lg font-semibold">Criar</DrawerTitle>
            <DrawerClose asChild>
              <button className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="grid grid-cols-4 gap-3 px-4 pb-6">
            {quickActions.map((qa) => (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa.action)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/60 active:scale-95 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <qa.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                  {qa.label}
                </span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <NewEstimateDialog open={newEstimateOpen} onOpenChange={setNewEstimateOpen} />
    </>
  );
}
