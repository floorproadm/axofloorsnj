import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PARTNER_LEAD_STAGES } from "./PartnerStageBar";
import { Trophy, XCircle } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  city: string | null;
  budget: number | null;
  created_at: string;
  converted_to_project_id: string | null;
}

interface Props {
  leads: Lead[];
  commissionPercent: number;
}

const ACTIVE_STAGES = PARTNER_LEAD_STAGES.filter(
  (s) => s.key !== "completed" && s.key !== "lost"
);

const formatValue = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;

export function PartnerPipelineBoard({ leads, commissionPercent }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const l of leads) (map[l.status] ||= []).push(l);
    return map;
  }, [leads]);

  const wonLeads = grouped["completed"] || [];
  const lostLeads = grouped["lost"] || [];
  const wonValue = wonLeads.reduce(
    (s, l) => s + ((l.budget || 0) * commissionPercent) / 100,
    0
  );

  const visibleStages = ACTIVE_STAGES.filter(
    (s) => (grouped[s.key] || []).length > 0
  );

  if (leads.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleStages.length > 0 ? (
        <div className="-mx-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          <div className="flex gap-3 px-4">
            {visibleStages.map((stage) => {
              const items = grouped[stage.key] || [];
              return (
                <div key={stage.key} className="flex-shrink-0 snap-start w-[260px]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", stage.dot)} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground truncate">
                        {stage.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((lead) => {
                      const value = lead.budget || 0;
                      return (
                        <Card
                          key={lead.id}
                          className="p-2.5 hover:border-primary/40 transition-colors"
                        >
                          <p className="text-sm font-semibold truncate leading-tight">
                            {lead.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {lead.city || lead.phone}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {new Date(lead.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {value > 0 && (
                              <span className="text-[11px] font-semibold tabular-nums text-foreground">
                                {formatValue(value)}
                              </span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No active leads in the pipeline.</p>
        </Card>
      )}

      {(wonLeads.length > 0 || lostLeads.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Won
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{wonLeads.length}</p>
            {wonValue > 0 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                +${wonValue.toFixed(0)} earned
              </p>
            )}
          </Card>
          <Card className="p-3 bg-muted/40 border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lost
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-muted-foreground">{lostLeads.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Not converted</p>
          </Card>
        </div>
      )}
    </div>
  );
}
