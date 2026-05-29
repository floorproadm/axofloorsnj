import { useState } from "react";
import {
  Home,
  Plus,
  User,
  FileText,
  Image as ImageIcon,
  UserPlus,
  MessageCircle,
  Phone,
  Target,
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

export type PartnerView =
  | "pipeline"
  | "earnings"
  | "quotes"
  | "rewards"
  | "gallery"
  | "profile";
export type PartnerProgram = "referral" | "trade";

interface PartnerBottomNavProps {
  active: PartnerView;
  onChange: (v: PartnerView) => void;
  onNewReferral: () => void;
  program?: PartnerProgram;
  whatsappNumber?: string; // e.g. "17323518653"
  phoneNumber?: string;    // e.g. "(732) 351-8653"
  partnerCode?: string;    // partner referral code for diagnostic attribution
}

const NAV_ITEMS: { key: PartnerView; label: string; icon: typeof Home }[] = [
  { key: "pipeline", label: "Home", icon: Home },
  { key: "quotes", label: "Quotes", icon: FileText },
  { key: "gallery", label: "Gallery", icon: ImageIcon },
  { key: "profile", label: "Profile", icon: User },
];

const SITE_BASE_URL = "https://www.axofloorsnj.com";

export function PartnerBottomNav({
  active,
  onChange,
  onNewReferral,
  program = "referral",
  whatsappNumber = "17323518653",
  phoneNumber = "(732) 351-8653",
  partnerCode,
}: PartnerBottomNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isTrade = program === "trade";

  const handleAction = (action: "referral" | "diagnostic" | "whatsapp" | "call") => {
    setDrawerOpen(false);
    if (action === "referral") {
      onNewReferral();
    } else if (action === "diagnostic") {
      const url = partnerCode
        ? `${SITE_BASE_URL}/quiz?ref=${partnerCode}`
        : `${SITE_BASE_URL}/quiz`;
      window.open(url, "_blank");
    } else if (action === "whatsapp") {
      window.open(`https://wa.me/${whatsappNumber}`, "_blank");
    } else if (action === "call") {
      window.location.href = `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
    }
  };

  const quickActions = [
    { key: "referral" as const, label: "Quick Referral", icon: UserPlus },
    { key: "diagnostic" as const, label: "Floor Diagnostic", icon: Target },
    { key: "whatsapp" as const, label: "WhatsApp AXO", icon: MessageCircle },
    { key: "call" as const, label: "Call AXO", icon: Phone },
  ];

  const items = NAV_ITEMS;
  // Split around the FAB center: half left, half right
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  const renderItem = (item: (typeof items)[number]) => {
    const isActive = active === item.key;
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        onClick={() => onChange(item.key)}
        className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-colors",
            isActive ? "text-[hsl(var(--navy-primary))]" : "text-muted-foreground",
          )}
        />
        <span
          className={cn(
            "text-[10px] font-medium transition-colors",
            isActive ? "text-[hsl(var(--navy-primary))]" : "text-muted-foreground",
          )}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--navy-primary)/0.08)]">
        <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
          {left.map(renderItem)}

          {/* Center FAB - navy, matches admin */}
          <div className="flex flex-col items-center relative -top-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-12 h-12 rounded-full bg-[hsl(var(--navy-primary))] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              aria-label="Quick actions"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {right.map(renderItem)}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle className="text-lg font-semibold">Quick Actions</DrawerTitle>
            <DrawerClose asChild>
              <button className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="grid grid-cols-4 gap-2 px-4 pb-6">
            {quickActions.map((qa) => {
              const isFeatured = qa.key === "referral" || qa.key === "diagnostic";
              return (
                <button
                  key={qa.key}
                  onClick={() => handleAction(qa.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/60 active:scale-95 transition-all",
                    isFeatured && "ring-1 ring-primary/20 bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center",
                      isFeatured
                        ? "bg-primary/20"
                        : "bg-[hsl(var(--navy-primary))]/10",
                    )}
                  >
                    <qa.icon
                      className={cn(
                        "w-5 h-5",
                        isFeatured
                          ? "text-primary"
                          : "text-[hsl(var(--navy-primary))]",
                      )}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                    {qa.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
