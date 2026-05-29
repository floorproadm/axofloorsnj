import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, ArrowLeft } from "lucide-react";

export default function ReferralAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // signin
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // signup
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // forgot
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/referral-program", { replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signinEmail.trim(),
      password: signinPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/referral-program", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/referral-program`,
        data: {
          full_name: signupName.trim(),
          phone: signupPhone.trim(),
          portal: "referral",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Check your email",
      description: "We sent a confirmation link to activate your account.",
    });
    setTab("signin");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Couldn't send reset email", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reset link sent", description: "Check your inbox to set a new password." });
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <Link
          to="/referral-program"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Send friends, earn rewards. Track everything in one place.
          </p>
        </div>

        {showForgot ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
            </Button>
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="(973) 555-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  We'll email you a link to verify your account.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}
