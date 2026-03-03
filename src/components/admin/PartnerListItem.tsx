import { Phone, Mail } from "lucide-react";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Partner, PARTNER_TYPES } from "@/hooks/admin/usePartnersData";
import { cn } from "@/lib/utils";

const statusDotColors: Record<string, string> = {
  active: "bg-emerald-500",
  prospect: "bg-blue-500",
  inactive: "bg-amber-500",
  churned: "bg-red-500",
};

const avatarColors: Record<string, string> = {
  builder: "bg-blue-500/15 text-blue-700",
  realtor: "bg-purple-500/15 text-purple-700",
  gc: "bg-orange-500/15 text-orange-700",
  designer: "bg-pink-500/15 text-pink-700",
};

interface Props {
  partner: Partner;
  isSelected: boolean;
  onSelect: () => void;
}

export function PartnerListItem({ partner, isSelected, onSelect }: Props) {
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

  const isChurned = partner.status === "churned";

  const lastContactText = partner.last_contacted_at
    ? formatDistanceToNow(new Date(partner.last_contacted_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-all border-l-[3px]",
        isSelected
          ? "bg-primary/10 border-l-primary shadow-sm"
          : isChurned
          ? "bg-card border-l-red-400 hover:bg-muted/50"
          : isAtRisk
          ? "bg-card border-l-amber-400 hover:bg-muted/50"
          : "bg-card border-l-transparent hover:bg-muted/50 hover:border-l-border"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {partner.photo_url ? (
          <img src={partner.photo_url} alt={partner.contact_name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
              avatarColors[partner.partner_type] || "bg-muted text-muted-foreground"
            )}
          >
            {initials}
          </div>
        )}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
            statusDotColors[partner.status] || "bg-muted-foreground"
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{partner.contact_name}</p>
        <p className="text-xs text-muted-foreground truncate">{partner.company_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground/70">
            {PARTNER_TYPES[partner.partner_type] || partner.partner_type}
          </span>
          {partner.total_referrals > 0 && (
            <span className="text-[10px] text-blue-600 font-medium">
              {partner.total_referrals} ind.
            </span>
          )}
        </div>
        {lastContactText ? (
          <p className={cn("text-[10px] mt-0.5", isAtRisk ? "text-amber-600" : "text-muted-foreground/60")}>
            {lastContactText}
          </p>
        ) : (
          <p className="text-[10px] mt-0.5 text-red-500/70">Sem contato</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {partner.phone && (
          <a
            href={`tel:${partner.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {partner.email && (
          <a
            href={`mailto:${partner.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </button>
  );
}
