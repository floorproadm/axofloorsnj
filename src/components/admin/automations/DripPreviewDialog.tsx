import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_DATA: Record<string, string> = {
  first_name: "Sarah",
  last_name: "Johnson",
  full_name: "Sarah Johnson",
  company_name: "AXO Floors",
  company_phone: "(973) 555-0123",
  salesperson_name: "Eduardo",
  services: "Hardwood Refinishing",
  view_request_button:
    '<a href="#" style="display:inline-block;background:#0a0a0a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 0">View Your Request</a>',
  unsubscribe_url: "#",
  address: "123 Oak Street, Montclair, NJ",
  appointment_date: "Friday, Dec 12 at 2:00 PM",
  proposal_link: "#",
};

function renderTemplate(tpl: string): string {
  return tpl.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key) => SAMPLE_DATA[key] ?? `{{${key}}}`);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: string;
  subject?: string | null;
  template: string;
}

const CHANNEL_META: Record<string, { label: string; icon: typeof Mail; className: string }> = {
  email: { label: "Email", icon: Mail, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  sms: { label: "SMS", icon: Phone, className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export function DripPreviewDialog({ open, onOpenChange, channel, subject, template }: Props) {
  const meta = CHANNEL_META[channel] || CHANNEL_META.email;
  const Icon = meta.icon;
  const rendered = renderTemplate(template || "");
  const renderedSubject = subject ? renderTemplate(subject) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className={cn("gap-1 text-xs", meta.className)}>
              <Icon className="w-3 h-3" />
              {meta.label} Preview
            </Badge>
            <span className="text-xs text-muted-foreground font-normal">with sample data</span>
          </DialogTitle>
        </DialogHeader>

        {channel === "email" ? (
          <div className="bg-muted/30 p-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm border border-border/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 bg-muted/20">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Subject</div>
                <div className="text-sm font-semibold text-foreground">
                  {renderedSubject || <span className="text-muted-foreground italic">(no subject)</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  From: AXO Floors &lt;noreply@axofloorsnj.com&gt; • To: sarah@example.com
                </div>
              </div>
              <div
                className="px-6 py-5 text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: "Arial, sans-serif" }}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 p-4 max-h-[70vh] overflow-y-auto flex justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-border/40 px-4 py-3 max-w-sm w-full">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {meta.label} message
              </div>
              <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">{rendered}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
