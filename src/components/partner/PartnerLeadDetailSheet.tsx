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
  Sparkles,
  ExternalLink,
  Clock,
  Send,
  Trophy,
  XCircle,
  FileText,
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
  address?: string | null;
  city: string | null;
  zip_code?: string | null;
  budget: number | null;
  services?: any;
  room_size?: string | null;
  message?: string | null;
  next_step?: string | null;
  expected_close_date?: string | null;
  internal_note_for_partner?: string | null;
  last_contacted_at?: string | null;
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

type NextAction = {
  tone: "info" | "warn" | "success" | "danger";
  title: string;
  body: string;
};

function computeNextAction(lead: Lead): NextAction | null {
  const ageDays =
    (Date.now() - new Date(lead.status_changed_at || lead.created_at).getTime()) /
    (1000 * 60 * 60 * 24);

  switch (lead.status) {
    case "cold_lead":
    case "estimate_requested":
      return {
        tone: ageDays > 2 ? "warn" : "info",
        title: "AXO is reviewing this referral",
        body:
          ageDays > 2
            ? `It's been ${Math.floor(ageDays)} days. You can give the client a heads-up that AXO will reach out.`
            : "The AXO team will reach out within 24h. A quick courtesy text from you helps close faster.",
      };
    case "visit_scheduled":
      return {
        tone: "info",
        title: "Site visit scheduled",
        body: "Let the client know they'll meet a trusted AXO specialist — this boosts conversion by ~30%.",
      };
    case "proposal_sent":
      return {
        tone: ageDays > 3 ? "warn" : "info",
        title: "Proposal in client's hands",
        body:
          ageDays > 3
            ? `Sent ${Math.floor(ageDays)} days ago. A short follow-up call from you can unblock the decision.`
            : "Give it 2–3 days. If silent, a friendly nudge from you often closes the deal.",
      };
    case "negotiation":
      return {
        tone: "warn",
        title: "Client is negotiating",
        body: "If you have context (budget concerns, timing), share it in the thread below — AXO will adapt.",
      };
    case "completed":
      return {
        tone: "success",
        title: "Commission earned 🎉",
        body: "Payment goes out on the next monthly cycle. Ask the client for a referral to keep momentum.",
      };
    case "lost":
      return {
        tone: "danger",
        title: "Referral didn't close",
        body: "It happens. Check the thread for context — useful intel for your next referral.",
      };
    default:
      return null;
  }
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
  const smsMessage = encodeURIComponent(
    `Hi ${lead.name.split(" ")[0]}, this is regarding your flooring project. The AXO team will reach out shortly.`
  );

  const fullAddress = [lead.address, lead.city, lead.zip_code].filter(Boolean).join(", ");
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  const services: string[] = Array.isArray(lead.services)
    ? lead.services
    : typeof lead.services === "string"
    ? [lead.services]
    : [];

  const action = computeNextAction(lead);

  const copyPhone = async () => {
    await navigator.clipboard.writeText(lead.phone);
    toast({ title: "Phone copied" });
  };

  // Build richer timeline from lead fields
  type Event = { label: string; date: string; dotClass: string; icon?: React.ReactNode };
  const events: Event[] = [];
  events.push({
    label: "Referral submitted",
    date: lead.created_at,
    dotClass: "bg-foreground",
    icon: <Send className="w-3 h-3" />,
  });
  if (lead.last_contacted_at) {
    events.push({
      label: "AXO contacted the client",
      date: lead.last_contacted_at,
      dotClass: "bg-blue-500",
      icon: <Phone className="w-3 h-3" />,
    });
  }
  if (
    lead.status_changed_at &&
    lead.status !== "cold_lead" &&
    lead.status !== "estimate_requested" &&
    stage
  ) {
    events.push({
      label: `Moved to ${stage.label}`,
      date: lead.status_changed_at,
      dotClass: stage.dot,
      icon:
        lead.status === "completed" ? (
          <Trophy className="w-3 h-3" />
        ) : lead.status === "lost" ? (
          <XCircle className="w-3 h-3" />
        ) : lead.status === "proposal_sent" ? (
          <FileText className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        ),
    });
  }
  if (lead.expected_close_date && !["completed", "lost"].includes(lead.status)) {
    events.push({
      label: "Expected close",
      date: lead.expected_close_date,
      dotClass: "bg-amber-500",
      icon: <Calendar className="w-3 h-3" />,
    });
  }
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const toneStyles: Record<NextAction["tone"], string> = {
    info: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    danger: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300",
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

        {/* Next Action smart banner */}
        {action && (
          <div className={cn("mt-4 rounded-lg border p-3", toneStyles[action.tone])}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {action.title}
                </p>
                <p className="text-[12px] mt-1 leading-snug text-foreground/80">
                  {action.body}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick contact actions */}
        {cleanPhone && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`tel:${cleanPhone}`}>
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`sms:${cleanPhone}?&body=${smsMessage}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                SMS
              </a>
            </Button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Richer Timeline */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Timeline
            </p>
            <div className="space-y-2.5">
              {events.map((ev, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white",
                      ev.dotClass
                    )}
                  >
                    {ev.icon}
                  </span>
                  <span className="text-xs font-medium flex-1 truncate">{ev.label}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatDistanceToNow(new Date(ev.date), { addSuffix: true })}
                  </span>
                </div>
              ))}
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

          {/* Project scope (services + room) */}
          {(services.length > 0 || lead.room_size || lead.message) && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Project scope
              </p>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {services.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              {lead.room_size && (
                <p className="text-xs text-muted-foreground">
                  Size: <span className="text-foreground font-medium">{lead.room_size}</span>
                </p>
              )}
              {lead.message && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                  "{lead.message}"
                </p>
              )}
            </div>
          )}

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

            {/* Full address with Google Maps link */}
            {fullAddress ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Location
                  </p>
                  <p className="text-sm font-medium break-words">{fullAddress}</p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                    >
                      Open in Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              lead.city && (
                <DetailRow icon={<MapPin className="w-4 h-4" />} label="City" value={lead.city} />
              )
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

          {/* Internal note from AXO to partner */}
          {lead.internal_note_for_partner && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                Note from AXO
              </p>
              <p className="text-xs text-foreground/90">{lead.internal_note_for_partner}</p>
            </div>
          )}

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
