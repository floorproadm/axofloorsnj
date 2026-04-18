import { cn } from "@/lib/utils";
import { AlertTriangle, Camera, FileWarning, TrendingDown, MessageCircle, X } from "lucide-react";

export type SmartFilter = "at_risk" | "need_photos" | "overdue" | "low_margin" | "unread_chat";

const CHIPS: { key: SmartFilter; label: string; icon: typeof AlertTriangle }[] = [
  { key: "at_risk", label: "At Risk", icon: AlertTriangle },
  { key: "low_margin", label: "Margin <15%", icon: TrendingDown },
  { key: "overdue", label: "Overdue Invoice", icon: FileWarning },
  { key: "need_photos", label: "Need Photos", icon: Camera },
  { key: "unread_chat", label: "Unread Chat", icon: MessageCircle },
];

interface Props {
  active: Set<SmartFilter>;
  counts: Partial<Record<SmartFilter, number>>;
  onToggle: (k: SmartFilter) => void;
  onClear: () => void;
}

export function SmartFilterChips({ active, counts, onToggle, onClear }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CHIPS.map((c) => {
        const isActive = active.has(c.key);
        const count = counts[c.key] ?? 0;
        const Icon = c.icon;
        return (
          <button
            key={c.key}
            onClick={() => onToggle(c.key)}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2 rounded-full border text-[11px] font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
              count === 0 && !isActive && "opacity-50",
            )}
            disabled={count === 0 && !isActive}
          >
            <Icon className="h-3 w-3" />
            {c.label}
            {count > 0 && (
              <span
                className={cn(
                  "ml-0.5 px-1 rounded text-[10px] font-mono",
                  isActive ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
