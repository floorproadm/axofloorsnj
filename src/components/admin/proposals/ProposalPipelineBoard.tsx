import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { isPast, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";
import { MapPin, Send, CheckCircle2, DollarSign } from "lucide-react";

interface ProposalWithRelations {
  id: string;
  proposal_number: string;
  status: string;
  good_price: number;
  better_price: number;
  best_price: number;
  margin_good: number;
  margin_better: number;
  margin_best: number;
  selected_tier: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  valid_until: string;
  created_at: string;
  project_id: string;
  projects: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    project_type: string;
    address: string | null;
    city: string | null;
    zip_code: string | null;
    square_footage: number | null;
  } | null;
}

const fmt = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const PIPELINE_STAGES = [
  { key: "draft",    label: "Draft",    dot: "bg-muted-foreground" },
  { key: "sent",     label: "Sent",     dot: "bg-blue-500" },
  { key: "viewed",   label: "Viewed",   dot: "bg-violet-500" },
  { key: "accepted", label: "Accepted", dot: "bg-emerald-500" },
  { key: "declined", label: "Declined", dot: "bg-red-500" },
];

function getStageKey(p: ProposalWithRelations): string {
  if (p.status === "rejected") return "declined";
  if (isPast(parseISO(p.valid_until)) && !["accepted", "rejected"].includes(p.status)) return "declined";
  return p.status;
}

interface Props {
  proposals: ProposalWithRelations[];
  onSelect: (p: ProposalWithRelations) => void;
}

export function ProposalPipelineBoard({ proposals, onSelect }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, ProposalWithRelations[]> = {};
    for (const stage of PIPELINE_STAGES) map[stage.key] = [];
    for (const p of proposals) {
      const key = getStageKey(p);
      if (map[key]) map[key].push(p);
    }
    return map;
  }, [proposals]);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-3 h-full min-w-max">
        {PIPELINE_STAGES.map((stage) => {
          const items = grouped[stage.key] || [];
          const stageTotal = items.reduce((s, p) => s + p.better_price, 0);
          return (
            <div
              key={stage.key}
              className="flex flex-col w-[220px] sm:w-[250px] bg-muted/30 rounded-xl border border-border/50 shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                <span className={cn("w-2.5 h-2.5 rounded-full", stage.dot)} />
                <span className="text-sm font-semibold text-foreground truncate">{stage.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {items.length}
                </Badge>
              </div>
              {items.length > 0 && (
                <div className="px-3 py-1.5 border-b border-border/30">
                  <span className="text-[10px] text-muted-foreground">{fmt(stageTotal)}</span>
                </div>
              )}
              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.map((p) => (
                  <PipelineCard key={p.id} proposal={p} onClick={() => onSelect(p)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({ proposal, onClick }: { proposal: ProposalWithRelations; onClick: () => void }) {
  const c = proposal.projects;
  const isExpired = isPast(parseISO(proposal.valid_until)) && !["accepted", "rejected"].includes(proposal.status);
  const selectedTier = proposal.selected_tier;
  const displayPrice = selectedTier
    ? (proposal[`${selectedTier}_price` as keyof ProposalWithRelations] as number)
    : proposal.better_price;
  const daysLeft = Math.ceil((parseISO(proposal.valid_until).getTime() - Date.now()) / 86400000);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all space-y-1.5"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{c?.customer_name || "—"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{c?.project_type}</p>
        </div>
        <span className="text-sm font-bold tabular-nums flex-shrink-0">{fmt(displayPrice)}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {c?.city && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />{c.city}
          </span>
        )}
        {!isExpired && !["accepted", "rejected"].includes(proposal.status) && daysLeft > 0 && (
          <span className={cn("text-[10px]", daysLeft <= 5 ? "text-amber-500" : "text-muted-foreground")}>
            {daysLeft}d left
          </span>
        )}
        {isExpired && <span className="text-[10px] text-red-500">Expired</span>}
        {proposal.accepted_at && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
      </div>
    </button>
  );
}
