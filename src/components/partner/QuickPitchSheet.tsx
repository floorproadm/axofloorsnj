import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Link2,
  Share2,
  Zap,
  Sparkles,
  Target,
  Award,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partnerCode?: string;
  partnerName?: string | null;
}

interface BrandCtx {
  companyName: string;
  link: (path: string) => string;
  partnerName: string;
}

interface Template {
  id: string;
  label: string;
  icon: typeof Zap;
  description: string;
  build: (ctx: BrandCtx) => string;
}

const TEMPLATES: Template[] = [
  {
    id: "intro",
    label: "Quick Intro",
    icon: Sparkles,
    description: "Short pitch — good for a first WhatsApp message.",
    build: ({ link, partnerName, companyName }) =>
      `Hey! I work with ${companyName} — they're the team I trust for hardwood refinishing, installation, and stairs.\n\nIf you're thinking about your floors, take 60 seconds to do their free Floor Diagnostic and they'll get back with a precise quote:\n${link("/quiz")}\n\n— ${partnerName}`,
  },
  {
    id: "diagnostic",
    label: "Floor Diagnostic Invite",
    icon: Target,
    description: "Sends the client to the 60-second guided diagnostic.",
    build: ({ link, partnerName, companyName }) =>
      `Quick favor — before ${companyName} can give you a real number, they need 60 seconds of info on your floor (rooms, condition, what you want done).\n\nHere's the link, it's quick:\n${link("/quiz")}\n\nOnce you finish, their team will reach out with a quote and timeline. Any questions, just ask me.\n\n— ${partnerName}`,
  },
  {
    id: "why-axo",
    label: "Why {company}",
    icon: Award,
    description: "Trust pitch — credentials and guarantee.",
    build: ({ link, partnerName, companyName }) =>
      `Why I send my clients to ${companyName}:\n\n• 10+ years of experience — hardwood refinishing, installation, stairs\n• Workmanship guarantee on every job\n• Clear pricing, on-time finish, no surprises\n\nSee their work + get a quote here:\n${link("/gallery")}\n\n— ${partnerName}`,
  },
  {
    id: "quote-24h",
    label: "Quote in 24h",
    icon: Zap,
    description: "Urgency pitch — for clients ready to move.",
    build: ({ link, partnerName, companyName }) =>
      `If you're ready to get your floors done, ${companyName} turns around quotes in 24 hours.\n\nFill the 60-second diagnostic and they'll come back fast:\n${link("/quiz")}\n\n— ${partnerName}`,
  },
];

export function QuickPitchSheet({
  open,
  onOpenChange,
  partnerCode,
  partnerName,
}: Props) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const companyName = settings?.company_name || "our team";
  const publicBase =
    (typeof window !== "undefined" && window.location?.origin) || "";

  const link = (path: string) =>
    `${publicBase}${path}${partnerCode ? `?ref=${partnerCode}` : ""}`;

  const buildMessage = (t: Template) =>
    t.build({
      link,
      companyName,
      partnerName: partnerName || "Your referral partner",
    });

  const handleWhatsApp = (t: Template) => {
    const msg = encodeURIComponent(buildMessage(t));
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleCopy = async (t: Template) => {
    try {
      await navigator.clipboard.writeText(buildMessage(t));
      setCopiedId(t.id);
      toast({ title: "Message copied" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const handleShare = async (t: Template) => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ text: buildMessage(t) });
        return;
      } catch {
        /* cancel */
      }
    }
    handleCopy(t);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto p-0">
        <SheetHeader className="px-4 pt-4 pb-2 pr-12 sticky top-0 bg-background z-0 border-b">
          <SheetTitle className="text-lg">Ready-to-Send Pitches</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pre-written messages, every link auto-tagged with your referral code.
          </p>
        </SheetHeader>

        <div className="p-3 space-y-2.5">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isCopied = copiedId === t.id;
            const preview = buildMessage(t);
            return (
              <Card key={t.id} className="overflow-hidden">
                <div className="p-3 border-b border-border flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{t.label.replace("{company}", companyName)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.description}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-muted/40">
                  <p className="text-[11px] text-foreground whitespace-pre-line line-clamp-4 font-mono leading-relaxed">
                    {preview}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-px bg-border">
                  <button
                    onClick={() => handleWhatsApp(t)}
                    className="bg-card hover:bg-muted/60 transition-colors p-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#25D366]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleCopy(t)}
                    className={cn(
                      "bg-card hover:bg-muted/60 transition-colors p-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium",
                      isCopied ? "text-green-600" : "text-foreground",
                    )}
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleShare(t)}
                    className="bg-card hover:bg-muted/60 transition-colors p-2.5 flex items-center justify-center gap-1.5 text-[12px] font-medium text-foreground"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </SheetContent>
    </Sheet>
  );
}
