import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { PARTNER_LEAD_STAGES } from "./PartnerStageBar";
import { Phone, Mail, MapPin, DollarSign, Calendar, CheckCircle2 } from "lucide-react";

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
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionPercent: number;
}

export function PartnerLeadDetailSheet({ lead, open, onOpenChange, commissionPercent }: Props) {
  if (!lead) return null;

  const stage = PARTNER_LEAD_STAGES.find((s) => s.key === lead.status);
  const commission =
    lead.status === "completed" && lead.budget ? (lead.budget * commissionPercent) / 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            {stage && <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />}
            <Badge variant="secondary" className="text-[10px]">
              {stage?.label || lead.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{lead.name}</SheetTitle>
          <SheetDescription>Referral details (read-only)</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone} />
            {lead.email && (
              <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
            )}
            {lead.city && (
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="City" value={lead.city} />
            )}
            {lead.budget && lead.budget > 0 && (
              <DetailRow
                icon={<DollarSign className="w-4 h-4" />}
                label="Budget"
                value={`$${lead.budget.toLocaleString()}`}
              />
            )}
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="Submitted"
              value={new Date(lead.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            />
          </div>

          {commission > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
                  Commission Earned
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                +${commission.toFixed(0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {commissionPercent}% of project budget
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Our team manages this referral. You'll see progress updates here as the stage moves
              forward.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
