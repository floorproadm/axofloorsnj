import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Users, Globe } from "lucide-react";
import {
  Partner,
  PARTNER_TYPES,
  PARTNER_PIPELINE_STAGES,
  PARTNER_STATUSES,
  PARTNER_STAGE_CONFIG,
} from "@/hooks/admin/usePartnersData";
import { subDays, isAfter } from "date-fns";

const avatarColors: Record<string, string> = {
  builder: "bg-blue-500/15 text-blue-700",
  realtor: "bg-purple-500/15 text-purple-700",
  gc: "bg-orange-500/15 text-orange-700",
  designer: "bg-pink-500/15 text-pink-700",
  flooring_contractor: "bg-teal-500/15 text-teal-700",
};

interface Props {
  partners: Partner[];
  onSelectPartner: (id: string) => void;
  onNewPartner: () => void;
}

export function PartnerPipelineBoard({ partners, onSelectPartner, onNewPartner }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, Partner[]> = {};
    for (const stage of PARTNER_PIPELINE_STAGES) {
      map[stage] = [];
    }
    for (const p of partners) {
      if (map[p.status]) {
        map[p.status].push(p);
      }
    }
    return map;
  }, [partners]);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-3 h-full min-w-max">
        {PARTNER_PIPELINE_STAGES.map((stage) => {
          const config = PARTNER_STAGE_CONFIG[stage];
          const stagePartners = grouped[stage] || [];
          return (
            <div
              key={stage}
              className="flex flex-col w-[220px] sm:w-[250px] bg-muted/30 rounded-xl border border-border/50 shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <span className="text-sm font-semibold text-foreground truncate">
                  {PARTNER_STATUSES[stage]}
                </span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {stagePartners.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stagePartners.map((p) => (
                  <PartnerCard key={p.id} partner={p} onClick={() => onSelectPartner(p.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartnerCard({ partner, onClick }: { partner: Partner; onClick: () => void }) {
  const initials = partner.contact_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAtRisk =
    partner.status === "active" &&
    (!partner.last_contacted_at ||
      !isAfter(new Date(partner.last_contacted_at), subDays(new Date(), 30)));

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all space-y-2"
    >
      <div className="flex items-center gap-2">
        {partner.photo_url ? (
          <img src={partner.photo_url} alt={partner.contact_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              avatarColors[partner.partner_type] || "bg-muted text-muted-foreground"
            }`}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{partner.contact_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{partner.company_name}</p>
        </div>
        {isAtRisk && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
          {PARTNER_TYPES[partner.partner_type] || partner.partner_type}
        </Badge>
        {(partner as any).lead_source_tag && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-500/10 gap-0.5">
            <Globe className="w-2.5 h-2.5" />
            {(partner as any).lead_source_tag === "builders_page" ? "Builders" : "Realtors"}
          </Badge>
        )}
        {partner.total_referrals > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {partner.total_referrals}
          </span>
        )}
      </div>
    </button>
  );
}
