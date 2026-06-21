import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Palette, Users, Globe, Mail, FileEdit, ListChecks, MonitorPlay, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IntakeTabContent } from "@/components/admin/IntakeTabContent";

const GeneralSettings = lazy(() => import("@/components/admin/settings/GeneralSettings"));
const BrandingSettings = lazy(() => import("@/components/admin/settings/BrandingSettings"));
const TeamSettings = lazy(() => import("@/components/admin/settings/TeamSettings"));
const EmailLogsSettings = lazy(() => import("@/components/admin/settings/EmailLogsSettings"));
const EmailTemplateEditor = lazy(() => import("@/components/admin/settings/EmailTemplateEditor"));
const B2BPricingSettings = lazy(() => import("@/components/admin/settings/B2BPricingSettings"));
const DemoPortalsSettings = lazy(() => import("@/components/admin/settings/DemoPortalsSettings"));

type Section = "general" | "branding" | "team" | "language" | "email_logs" | "email_templates" | "b2b_pricing" | "demo_portals" | "intake";

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Card className="border-l-4 border-l-primary shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">{t("settings.idioma")}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t("settings.idiomaDesc")}</p>
      <div className="max-w-xs space-y-2">
        <Label>Language / Idioma</Label>
        <Select value={language} onValueChange={(v) => setLanguage(v as "pt" | "en")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">🇧🇷 Português</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {language === "pt"
            ? "Palavras como Jobs, Leads, Feed, Schedule continuam em inglês."
            : "Industry terms like Jobs, Leads, Feed, Schedule stay in English."}
        </p>
      </div>
    </Card>
  );
}

const VALID_SECTIONS: Section[] = ["general", "branding", "team", "language", "email_logs", "email_templates", "b2b_pricing", "demo_portals", "intake"];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSection = searchParams.get("section") as Section | null;
  const active: Section = urlSection && VALID_SECTIONS.includes(urlSection) ? urlSection : "general";
  const { t } = useLanguage();

  const setActive = (id: Section) => {
    const next = new URLSearchParams(searchParams);
    if (id === "general") next.delete("section");
    else next.set("section", id);
    setSearchParams(next, { replace: true });
  };

  const sections: { id: Section; label: string; description: string; icon: React.ElementType }[] = [
    { id: "general", label: t("settings.geral"), description: t("settings.geralDesc"), icon: SettingsIcon },
    { id: "branding", label: "Branding", description: t("settings.brandingDesc"), icon: Palette },
    { id: "team", label: t("settings.equipe"), description: t("settings.equipeDesc"), icon: Users },
    { id: "language", label: t("settings.idioma"), description: t("settings.idiomaDesc"), icon: Globe },
    { id: "intake", label: "Captação", description: "Fontes de leads e entrada manual", icon: BarChart3 },
    { id: "email_logs", label: "Email Logs", description: "Gmail email audit trail", icon: Mail },
    { id: "email_templates", label: "Email Templates", description: "Edit email copy & CTAs", icon: FileEdit },
    { id: "b2b_pricing", label: "Catálogo B2B", description: "Serviços disponíveis para cotações de parceiros", icon: ListChecks },
    { id: "demo_portals", label: "Demo Portals", description: "Quick access to client-facing portals for live demos", icon: MonitorPlay },
  ];

  return (
    <AdminLayout title={t("settings.titulo")}>
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <Card className="md:w-56 flex-shrink-0 bg-muted/30 border-border/50 p-2">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5 rounded-md text-sm transition-all whitespace-nowrap md:whitespace-normal text-left w-full",
                      isActive
                        ? "bg-background border-l-[3px] border-l-primary shadow-sm font-medium text-foreground"
                        : "border-l-[3px] border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isActive && "text-primary")} />
                    <div className="hidden md:block min-w-0">
                      <span className="block text-sm leading-tight">{s.label}</span>
                      <span className="block text-[11px] text-muted-foreground font-normal leading-tight mt-0.5">{s.description}</span>
                    </div>
                    <span className="md:hidden">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<LoadingFallback />}>
              {active === "general" && <GeneralSettings />}
              {active === "branding" && <BrandingSettings />}
              {active === "team" && <TeamSettings />}
              {active === "language" && <LanguageSettings />}
              {active === "intake" && <IntakeTabContent />}
              {active === "email_logs" && <EmailLogsSettings />}
              {active === "email_templates" && <EmailTemplateEditor />}
              {active === "b2b_pricing" && <B2BPricingSettings />}
              {active === "demo_portals" && <DemoPortalsSettings />}
            </Suspense>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
