import { cn } from "@/lib/utils";

export const PARTNER_LEAD_STAGES: { key: string; label: string; dot: string }[] = [
  { key: "cold_lead", label: "New", dot: "bg-slate-400" },
  { key: "warm_lead", label: "Contacted", dot: "bg-blue-500" },
  { key: "estimate_requested", label: "Est. Req.", dot: "bg-cyan-500" },
  { key: "estimate_scheduled", label: "Scheduled", dot: "bg-indigo-500" },
  { key: "in_draft", label: "Drafting", dot: "bg-purple-500" },
  { key: "proposal_sent", label: "Proposal", dot: "bg-amber-500" },
  { key: "in_production", label: "Production", dot: "bg-orange-500" },
  { key: "completed", label: "Won", dot: "bg-emerald-500" },
  { key: "lost", label: "Lost", dot: "bg-red-500" },
];

interface Props {
  counts: Record<string, number>;
  active: string | null;
  onSelect: (stage: string | null) => void;
}

export function PartnerStageBar({ counts, active, onSelect }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 snap-start px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
          active === null
            ? "bg-foreground text-background border-foreground"
            : "bg-card border-border text-muted-foreground hover:text-foreground"
        )}
      >
        All · {Object.values(counts).reduce((s, n) => s + n, 0)}
      </button>
      {PARTNER_LEAD_STAGES.map((s) => {
        const count = counts[s.key] || 0;
        if (count === 0 && active !== s.key) return null;
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(isActive ? null : s.key)}
            className={cn(
              "flex-shrink-0 snap-start px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {s.label} · {count}
          </button>
        );
      })}
    </div>
  );
}
