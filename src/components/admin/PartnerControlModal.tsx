import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Eye,
  Trash2,
  Zap,
  Globe,
} from "lucide-react";
import {
  Partner,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  usePartnersData,
} from "@/hooks/admin/usePartnersData";
import {
  usePartnerPipeline,
  PARTNER_NRA,
  PARTNER_VALID_TRANSITIONS,
} from "@/hooks/usePartnerPipeline";

const SOURCE_TAG_LABELS: Record<string, string> = {
  builders_page: "via Builders Page",
  realtors_page: "via Realtors Page",
};

interface Props {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails: (id: string) => void;
}

export function PartnerControlModal({ partner, open, onOpenChange, onViewDetails }: Props) {
  const { advancePartner } = usePartnerPipeline();
  const { deletePartner } = usePartnersData();

  if (!partner) return null;

  const nra = PARTNER_NRA[partner.status];
  const canAdvance = !!PARTNER_VALID_TRANSITIONS[partner.status];

  const initials = partner.contact_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAdvance = async () => {
    await advancePartner.mutateAsync({ id: partner.id, currentStatus: partner.status });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!confirm("Remover este partner permanentemente?")) return;
    await deletePartner.mutateAsync(partner.id);
    onOpenChange(false);
  };

  const sourceTag = (partner as any).lead_source_tag as string | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="p-4 pb-3 pr-10 border-b border-border/50 text-left">
          <div className="flex items-center gap-3">
            {partner.photo_url ? (
              <img src={partner.photo_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary/10 text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base truncate">{partner.contact_name}</DialogTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building className="w-3 h-3" />
                {partner.company_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {PARTNER_STATUSES[partner.status] || partner.status}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {PARTNER_TYPES[partner.partner_type] || partner.partner_type}
            </Badge>
            {sourceTag && SOURCE_TAG_LABELS[sourceTag] && (
              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-500/10 gap-0.5">
                <Globe className="w-2.5 h-2.5" />
                {SOURCE_TAG_LABELS[sourceTag]}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* NRA */}
        {nra && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-200/50">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              Próxima Ação
            </p>
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {nra.label}
            </p>
          </div>
        )}

        {/* Contact info */}
        <div className="px-4 py-3 space-y-2">
          {partner.phone && (
            <a href={`tel:${partner.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {partner.phone}
            </a>
          )}
          {partner.email && (
            <a href={`mailto:${partner.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {partner.email}
            </a>
          )}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Criado em {format(new Date(partner.created_at), "dd/MM/yyyy")}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex flex-col gap-2">
          {canAdvance && (
            <Button
              onClick={handleAdvance}
              disabled={advancePartner.isPending}
              className="w-full gap-2"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
              {advancePartner.isPending ? "Avançando..." : "Avançar Pipeline"}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onViewDetails(partner.id);
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
