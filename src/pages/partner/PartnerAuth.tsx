import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Handshake } from "lucide-react";

export default function PartnerAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/partner/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Verifica se é um partner_user
    const { data: pu } = await supabase
      .from("partner_users" as any)
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!pu) {
      await supabase.auth.signOut();
      toast({
        title: "Access denied",
        description: "This account is not linked to any partner. Contact AXO Floors.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    toast({ title: "Welcome back!" });
    navigate("/partner/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Handshake className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Partner Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Send referrals and track commissions</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Don't have an account? Contact AXO Floors to be invited as a partner.
        </p>
      </Card>
    </div>
  );
}
