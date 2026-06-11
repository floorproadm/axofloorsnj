import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Handshake, CheckCircle2 } from "lucide-react";

export default function PartnerWelcome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("FloorPRO");

  useEffect(() => {
    // Supabase auto-parses the magic-link hash and establishes a session.
    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      setHasSession(!!session);
      setChecking(false);
      if (session?.user?.id) loadBranding(session.user.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
      if (data.session?.user?.id) loadBranding(data.session.user.id);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const loadBranding = async (userId: string) => {
    const { data: pu } = await supabase
      .from("partner_users" as any)
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    const orgId = (pu as any)?.organization_id;
    if (!orgId) return;
    // Gate by plan — Basic tenants always present as "FloorPRO"
    const { data: planRes } = await supabase.rpc("get_org_plan" as any, { p_org_id: orgId });
    const isPro = planRes === "pro" || planRes === "enterprise";
    if (!isPro) {
      setCompanyName("FloorPRO");
      return;
    }
    const { data: cs } = await supabase
      .from("company_settings")
      .select("company_name")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (cs?.company_name) setCompanyName(cs.company_name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Failed to set password", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    toast({ title: "Welcome to the Partner Portal!" });
    navigate("/partner/dashboard", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Invitation link expired</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This invite link is no longer valid. Please contact {companyName} to receive a new one.
          </p>
          <Button onClick={() => navigate("/partner/auth")} className="w-full">
            Go to Partner Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Handshake className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            One last step — choose a password to secure your Partner Portal account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpw">Confirm password</Label>
            <Input id="cpw" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><CheckCircle2 className="w-4 h-4 mr-2" /> Activate my account</>)}
          </Button>
        </form>
      </Card>
    </div>
  );
}
