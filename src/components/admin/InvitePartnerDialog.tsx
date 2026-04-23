import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, CheckCircle2, KeyRound } from "lucide-react";

interface Props {
  partnerId: string | null;
  partnerName: string;
  partnerEmail: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface ExistingLink {
  user_id: string;
  email: string | null;
}

export function InvitePartnerDialog({ partnerId, partnerName, partnerEmail, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState(partnerEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<ExistingLink | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open || !partnerId) return;
    setEmail(partnerEmail || "");
    setPassword("");
    setChecking(true);
    (async () => {
      const { data } = await supabase
        .from("partner_users" as any)
        .select("user_id")
        .eq("partner_id", partnerId)
        .maybeSingle();
      if (data) {
        // Get email from profiles
        const { data: prof } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", (data as any).user_id)
          .maybeSingle();
        setExisting({ user_id: (data as any).user_id, email: prof?.email || null });
      } else {
        setExisting(null);
      }
      setChecking(false);
    })();
  }, [open, partnerId, partnerEmail]);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pw);
  };

  const handleInvite = async () => {
    if (!partnerId || !email.trim() || !password.trim()) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1) Create the auth user (signup)
      const { data: auth, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/partner/dashboard` },
      });
      if (authError) throw authError;
      if (!auth.user) throw new Error("Failed to create user");

      // 2) Link user to partner via SECURITY DEFINER function
      const { error: linkError } = await supabase.rpc("link_partner_user" as any, {
        p_partner_id: partnerId,
        p_user_id: auth.user.id,
      });
      if (linkError) throw linkError;

      toast({
        title: "Partner invited!",
        description: `Send these credentials to ${partnerName}.`,
      });
      setExisting({ user_id: auth.user.id, email: email.trim() });
    } catch (e: any) {
      toast({ title: "Failed to invite", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Partner Portal Access\n\nURL: ${window.location.origin}/partner/auth\nEmail: ${email}\nPassword: ${password}\n\nLog in to send leads and track your commissions.`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
        ) : existing ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Portal already enabled</p>
                <p className="text-muted-foreground text-xs mt-1">{existing.email || "Account linked"}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
              Portal URL: <code className="text-foreground">{window.location.origin}/partner/auth</code>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/partner/auth`);
                toast({ title: "URL copied" });
              }}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Portal URL
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Partner Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-pw">Initial Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-pw"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share these credentials with the partner. They can change later.
              </p>
            </div>
            {password && email && (
              <Button type="button" variant="ghost" size="sm" onClick={copyCredentials} className="w-full">
                <Copy className="w-3.5 h-3.5 mr-2" /> Copy credentials to share
              </Button>
            )}
            <Button onClick={handleInvite} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Partner Account"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
