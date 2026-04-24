import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PARTNER_LEAD_STAGES } from "./PartnerStageBar";

const STAGE_BADGE: Record<string, { label: string; color: string }> = {
  cold_lead: { label: "New", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  warm_lead: { label: "Contacted", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  estimate_requested: { label: "Estimate Requested", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  estimate_scheduled: { label: "Estimate Scheduled", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  in_draft: { label: "Drafting", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  proposal_sent: { label: "Proposal Sent", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  in_production: { label: "In Production", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  completed: { label: "Completed ✓", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  lost: { label: "Lost", color: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

interface Props {
  lead: {
    id: string;
    name: string;
    phone: string;
    status: string;
    city: string | null;
    budget: number | null;
    created_at: string;
  };
  commission: number;
}

export function PartnerLeadCard({ lead, commission }: Props) {
  const status = STAGE_BADGE[lead.status] || { label: lead.status, color: "bg-muted" };
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {lead.phone}
            {lead.city ? ` · ${lead.city}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className={`${status.color} text-[10px] whitespace-nowrap`}>
          {status.label}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
        {commission > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+${commission.toFixed(0)}</span>
        )}
      </div>
    </Card>
  );
}

export { PARTNER_LEAD_STAGES };
