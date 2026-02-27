import { Phone, Mail } from "lucide-react";
import { Partner, PARTNER_TYPES, PARTNER_STATUSES } from "@/hooks/admin/usePartnersData";
import { cn } from "@/lib/utils";

const statusDotColors: Record<string, string> = {
  active: "bg-emerald-500",
  prospect: "bg-blue-500",
  inactive: "bg-amber-500",
  churned: "bg-red-500",
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

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-all border",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card border-transparent hover:bg-muted/50 hover:border-border/50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {initials}
        </div>
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
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          {PARTNER_TYPES[partner.partner_type] || partner.partner_type}
        </p>
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
