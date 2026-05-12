import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, CheckCircle2, KeyRound, Mail, Send, RefreshCw } from "lucide-react";

interface Props {
  partnerId: string | null;
  partnerName: string;
  partnerEmail: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function InvitePartnerDialog({ partnerId, partnerName, partnerEmail, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState(partnerEmail || "");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !partnerId) return;
    setEmail(partnerEmail || "");
    setChecking(true);
    (async () => {
      const { data } = await supabase
        .from("partner_users" as any)
        .select("user_id")
        .eq("partner_id", partnerId)
        .maybeSingle();
      if (data) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", (data as any).user_id)
          .maybeSingle();
        setHasAccess(true);
        setLinkedEmail(prof?.email || null);
      } else {
        setHasAccess(false);
        setLinkedEmail(null);
      }
      setChecking(false);
    })();
  }, [open, partnerId, partnerEmail]);

  const sendInvite = async () => {
    if (!partnerId || !email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-partner-portal", {
        body: {
          partner_id: partnerId,
          email: email.trim(),
          redirect_origin: window.location.origin,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: hasAccess ? "Invite resent" : "Invite sent!",
        description: `${partnerName} will receive an email at ${email.trim()} with a secure activation link.`,
      });
      setHasAccess(true);
      setLinkedEmail(email.trim());
    } catch (e: any) {
      toast({ title: "Failed to send invite", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/partner/auth`);
    toast({ title: "Portal URL copied" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Partner Portal Access
          </DialogTitle>
          <DialogDescription>{partnerName}</DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {hasAccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Portal access enabled</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{linkedEmail || "Account linked"}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Partner email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Mail className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {hasAccess
                  ? "Resend a fresh secure sign-in link. Useful if they lost access or forgot their password."
                  : "We'll email a one-click activation link. The partner sets their own password — no need to share credentials manually."}
              </p>
            </div>

            <Button onClick={sendInvite} disabled={loading || !email.trim()} className="w-full">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasAccess ? (
                <><RefreshCw className="w-4 h-4 mr-2" /> Resend invite email</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send invite email</>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={copyPortalUrl} className="w-full">
              <Copy className="w-3.5 h-3.5 mr-2" /> Copy portal URL
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
