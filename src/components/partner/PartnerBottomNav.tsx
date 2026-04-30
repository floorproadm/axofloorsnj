import { Users, DollarSign, Plus, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type PartnerView = "pipeline" | "earnings" | "rewards" | "profile";

interface PartnerBottomNavProps {
  active: PartnerView;
  onChange: (v: PartnerView) => void;
  onNewReferral: () => void;
}

const ITEMS: { key: PartnerView; label: string; icon: typeof Users }[] = [
  { key: "pipeline", label: "Pipeline", icon: Users },
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "rewards", label: "Rewards", icon: Trophy },
  { key: "profile", label: "Profile", icon: User },
];

export function PartnerBottomNav({ active, onChange, onNewReferral }: PartnerBottomNavProps) {
  // Render as: [Pipeline, Earnings, FAB, Rewards, Profile]
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--navy-primary)/0.08)]">
      <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
        {left.map((item) => {
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
            </button>
          );
        })}

        {/* Center FAB */}
        <div className="flex flex-col items-center relative -top-4">
          <button
            onClick={onNewReferral}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="New referral"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {right.map((item) => {
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
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
