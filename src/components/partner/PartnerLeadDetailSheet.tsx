import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PARTNER_LEAD_STAGES } from "./PartnerStageBar";
import {
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ReferralCollabPanel } from "@/components/referral/ReferralCollabPanel";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  city: string | null;
  budget: number | null;
  created_at: string;
  status_changed_at?: string | null;
  converted_to_project_id: string | null;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionPercent: number;
  partnerName: string;
}

export function PartnerLeadDetailSheet({ lead, open, onOpenChange, commissionPercent, partnerName }: Props) {
  if (!lead) return null;

  const stageIndex = PARTNER_LEAD_STAGES.findIndex((s) => s.key === lead.status);
  const stage = PARTNER_LEAD_STAGES[stageIndex];
  const commission =
    lead.status === "completed" && lead.budget ? (lead.budget * commissionPercent) / 100 : 0;
  const potentialCommission =
    !["completed", "lost"].includes(lead.status) && lead.budget
      ? (lead.budget * commissionPercent) / 100
      : 0;

  const cleanPhone = (lead.phone || "").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Hi ${lead.name.split(" ")[0]}, this is regarding your flooring project. The AXO team will reach out shortly.`
  );

  const copyPhone = async () => {
    await navigator.clipboard.writeText(lead.phone);
    toast({ title: "Phone copied" });
  };


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
          <SheetDescription>Referral details</SheetDescription>
        </SheetHeader>

        {/* Quick contact actions */}
        {cleanPhone && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`tel:${cleanPhone}`}>
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`sms:${cleanPhone}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                SMS
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.6.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.6 4.1.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3M12 22c-1.7 0-3.4-.5-4.9-1.3l-5.5 1.4 1.5-5.3C2.4 15.2 2 13.6 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10" />
                </svg>
                WA
              </a>
            </Button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Stage timeline */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Progress
            </p>
            <div className="space-y-2">
              <TimelineRow
                label="Submitted"
                value={formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                dotClass="bg-foreground"
              />
              {lead.status_changed_at && lead.status !== "cold_lead" && stage && (
                <TimelineRow
                  label={`Moved to ${stage.label}`}
                  value={formatDistanceToNow(new Date(lead.status_changed_at), { addSuffix: true })}
                  dotClass={stage.dot}
                />
              )}
            </div>
            {stageIndex >= 0 && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      lead.status === "lost" ? "bg-red-500" : "bg-emerald-500"
                    )}
                    style={{
                      width: `${((stageIndex + 1) / PARTNER_LEAD_STAGES.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
                  Stage {stageIndex + 1} of {PARTNER_LEAD_STAGES.length}
                </p>
              </div>
            )}
          </div>

          {/* Contact details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Phone
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tabular-nums">{lead.phone}</p>
                  <button
                    onClick={copyPhone}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

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

          {/* Commission cards */}
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

          {potentialCommission > 0 && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                Potential Commission
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                ${potentialCommission.toFixed(0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                If this referral closes ({commissionPercent}% of budget)
              </p>
            </div>
          )}

          {/* Collaboration: status from AXO + shared thread */}
          <ReferralCollabPanel
            leadId={lead.id}
            mode="partner"
            authorName={partnerName}
          />

        </div>
      </SheetContent>
    </Sheet>
  );
}

function TimelineRow({ label, value, dotClass }: { label: string; value: string; dotClass: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("w-2 h-2 rounded-full shrink-0", dotClass)} />
      <span className="text-xs font-medium flex-1 truncate">{label}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">{value}</span>
    </div>
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
