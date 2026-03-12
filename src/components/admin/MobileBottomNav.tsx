import { useState, useEffect } from "react";
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
  Zap,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NewJobDialog } from "./NewJobDialog";
import { NewLeadDialog } from "./NewLeadDialog";
import { NewEstimateDialog } from "./NewEstimateDialog";
import { NewPartnerDialog } from "./NewPartnerDialog";
import { QuickQuoteSheet } from "./QuickQuoteSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizeStatus } from "@/hooks/useLeadPipeline";

interface EligibleLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  services?: string[];
  city?: string;
  status: string;
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newEstimateOpen, setNewEstimateOpen] = useState(false);
  const [newPartnerOpen, setNewPartnerOpen] = useState(false);
  const { t } = useLanguage();

  // Quick Quote states
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [eligibleLeads, setEligibleLeads] = useState<EligibleLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [quickQuoteLead, setQuickQuoteLead] = useState<EligibleLead | null>(null);
  const [showQuickQuote, setShowQuickQuote] = useState(false);

  // Universal words stay in English
  const navItems = [
    { label: "Home", icon: Home, path: "/admin/dashboard" },
    { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
    { label: null, icon: Plus, path: null },
    { label: "Feed", icon: Camera, path: "/admin/feed" },
    { label: "Stats", icon: BarChart3, path: "/admin/performance" },
  ];

  const quickActions = [
    { label: t("mobile.novaTarefa"), icon: ClipboardList, action: "task" },
    { label: t("mobile.novoJob"), icon: HardHat, action: "job" },
    { label: t("mobile.novoLead"), icon: UserPlus, action: "lead" },
    { label: "Quick Quote", icon: Zap, action: "quickquote" },
    { label: t("mobile.novoOrcamento"), icon: FileText, action: "estimate" },
    { label: t("mobile.novaOrdem"), icon: ShoppingCart, action: "order" },
    { label: t("mobile.novaDespesa"), icon: Receipt, action: "expense" },
    { label: t("mobile.novaFatura"), icon: FileSpreadsheet, action: "invoice" },
    { label: t("mobile.novaFoto"), icon: ImagePlus, action: "photo" },
    { label: "Novo Partner", icon: UserPlus, action: "partner" },
  ];

  // Fetch eligible leads when picker opens
  useEffect(() => {
    if (!leadPickerOpen) return;
    setLoadingLeads(true);
    supabase
      .from("leads")
      .select("id, name, phone, email, services, city, status")
      .order("updated_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const eligible = (data || []).filter((l) => {
          const s = normalizeStatus(l.status);
          return s === "estimate_scheduled" || s === "in_draft";
        }).map((l) => ({
          ...l,
          email: l.email ?? undefined,
          services: Array.isArray(l.services) ? (l.services as string[]) : [],
          city: l.city ?? undefined,
        }));
        setEligibleLeads(eligible);
        setLoadingLeads(false);
      });
  }, [leadPickerOpen]);

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
      case "partner":
        setNewPartnerOpen(true);
        break;
      case "quickquote":
        setLeadPickerOpen(true);
        break;
      default:
        break;
    }
  };

  const handleSelectLead = (lead: EligibleLead) => {
    setLeadPickerOpen(false);
    setQuickQuoteLead(lead);
    setShowQuickQuote(true);
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
                    aria-label={t("mobile.criarNovo")}
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle className="text-lg font-semibold">{t("mobile.criar")}</DrawerTitle>
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
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/60 active:scale-95 transition-all",
                  qa.action === "quickquote" && "ring-1 ring-primary/20 bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center",
                  qa.action === "quickquote" ? "bg-primary/20" : "bg-primary/10"
                )}>
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

      {/* Lead Picker for Quick Quote */}
      <Dialog open={leadPickerOpen} onOpenChange={setLeadPickerOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Quote — Selecionar Lead
            </DialogTitle>
            <DialogDescription>
              Escolha um lead em Visita Agendada ou Em Elaboração
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {loadingLeads ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : eligibleLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhum lead elegível</p>
                <p className="text-xs mt-1">Leads precisam estar em "Visita Agendada" ou "Em Elaboração"</p>
              </div>
            ) : (
              eligibleLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{lead.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {normalizeStatus(lead.status) === "estimate_scheduled" ? "Visita Agendada" : "Em Elaboração"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{lead.phone}</span>
                    {lead.city && <span>· {lead.city}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Quote Sheet */}
      <QuickQuoteSheet
        lead={quickQuoteLead}
        open={showQuickQuote}
        onClose={() => { setShowQuickQuote(false); setQuickQuoteLead(null); }}
        onSuccess={() => { setShowQuickQuote(false); setQuickQuoteLead(null); }}
      />

      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <NewEstimateDialog open={newEstimateOpen} onOpenChange={setNewEstimateOpen} />
      <NewPartnerDialog open={newPartnerOpen} onOpenChange={setNewPartnerOpen} defaultStatus="prospect" showStageSelector />
    </>
  );
}