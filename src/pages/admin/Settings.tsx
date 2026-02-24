import { useState, lazy, Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Settings as SettingsIcon, Palette, Users, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const GeneralSettings = lazy(() => import("@/components/admin/settings/GeneralSettings"));
const BrandingSettings = lazy(() => import("@/components/admin/settings/BrandingSettings"));
const TeamSettings = lazy(() => import("@/components/admin/settings/TeamSettings"));
const GalleryManager = lazy(() => import("./GalleryManager"));

type Section = "general" | "branding" | "team" | "gallery";

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Geral", icon: SettingsIcon },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "team", label: "Equipe", icon: Users },
  { id: "gallery", label: "Marketing Gallery", icon: Images },
];

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

export default function Settings() {
  const [active, setActive] = useState<Section>("general");

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Configurações da Empresa
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Centro de governança — parâmetros globais, branding e equipe.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="flex md:flex-col gap-1 md:w-52 flex-shrink-0 overflow-x-auto md:overflow-visible">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    active === s.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<LoadingFallback />}>
              {active === "general" && <GeneralSettings />}
              {active === "branding" && <BrandingSettings />}
              {active === "team" && <TeamSettings />}
              {active === "gallery" && <GalleryManager embedded />}
            </Suspense>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
