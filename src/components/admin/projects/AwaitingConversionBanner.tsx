import { Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { HubProposal } from "@/hooks/useProjectsHub";

interface Props {
  proposals: HubProposal[];
}

export function AwaitingConversionBanner({ proposals }: Props) {
  if (proposals.length === 0) return null;
  const total = proposals.reduce((s, p) => {
    const tier = p.selected_tier;
    const price = tier === "good" ? p.good_price : tier === "best" ? p.best_price : p.better_price;
    return s + (price ?? 0);
  }, 0);
  const fmt = total >= 1000 ? `$${(total / 1000).toFixed(1)}k` : `$${total.toFixed(0)}`;

  return (
    <Link
      to="/admin/proposals"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--state-success)/0.4)] bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] hover:bg-[hsl(var(--state-success)/0.15)] transition-colors group"
    >
      <Zap className="h-4 w-4 shrink-0" />
      <p className="text-xs font-medium flex-1 min-w-0">
        <span className="font-mono font-semibold">{proposals.length}</span> accepted{" "}
        {proposals.length === 1 ? "proposal" : "proposals"} · <span className="font-mono">{fmt}</span> awaiting project
        kickoff
      </p>
      <span className="text-[11px] font-medium inline-flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
        Review
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
