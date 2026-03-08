import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import ReferralDashboard from "@/components/referral/ReferralDashboard";
import { useReferralProfile } from "@/hooks/useReferralProfile";
import { Share2, Users, DollarSign, Check, Gift, Heart, Star, Loader2, LogIn } from "lucide-react";

const ReferralProgram = () => {
  const { profile, referrals, rewards, tier, isLoading, register, lookupByEmail, addReferral } = useReferralProfile();
  
  // Registration form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) return;
    await register(regName.trim(), regEmail.trim(), regPhone.trim());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = await lookupByEmail(loginEmail.trim());
    if (!result) {
      setLoginError('No account found with this email. Register below.');
    }
  };

  // If user has a profile, show dashboard
  if (profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <ReferralDashboard
              profile={profile}
              referrals={referrals}
              rewards={rewards}
              tier={tier}
              isLoading={isLoading}
              onAddReferral={addReferral}
            />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-20 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-accent" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-4">
            Refer & Earn 7-10%
          </h1>
          
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Happy with your floors? Share the love — and earn 7-10% of every project you refer.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-accent">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-medium">We'll treat your referrals like VIPs</span>
          </div>
        </div>
      </section>

      {/* Registration + Login */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-lg">
          {showLogin ? (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="text-xl font-heading flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-accent" />
                  Access Your Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" required />
                  </div>
                  {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                  <Button type="submit" className="w-full gold-gradient text-black font-semibold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Access Dashboard
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New here?{' '}
                    <button type="button" onClick={() => setShowLogin(false)} className="text-accent font-semibold hover:underline">
                      Register
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="text-xl font-heading flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" />
                  Join the Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name">Your Name *</Label>
                    <Input id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Sarah Johnson" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email *</Label>
                    <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="sarah@email.com" required maxLength={255} />
                  </div>
                  <div>
                    <Label htmlFor="reg-phone">Phone *</Label>
                    <Input id="reg-phone" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="(555) 123-4567" required maxLength={30} />
                  </div>
                  <Button type="submit" className="w-full gold-gradient text-black font-semibold h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                    Get My Referral Code
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already registered?{' '}
                    <button type="button" onClick={() => setShowLogin(true)} className="text-accent font-semibold hover:underline">
                      Access Dashboard
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start earning. Your friends get perfect floors. You get paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-2 border-accent/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Share2 className="w-8 h-8 text-accent" />
                </div>
                <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
                <h3 className="text-xl font-heading font-semibold text-primary mb-4">Register & Share</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sign up and get your unique referral link + QR code. Share via WhatsApp, SMS, or email.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-accent/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
                <h3 className="text-xl font-heading font-semibold text-primary mb-4">Friends Sign Up</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When someone uses your link, they become a lead linked to you. We track everything automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-accent/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-accent" />
                </div>
                <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
                <h3 className="text-xl font-heading font-semibold text-primary mb-4">Earn Credits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive 7-10% of the project value when it completes. Credits for services or gift cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Earnings Examples */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary mb-8">
                Earn More with Each Tier
              </h2>
              <div className="space-y-4">
                {[
                  { tier: 'Bronze ★', refs: '1-2', desc: 'Start earning 7% commission' },
                  { tier: 'Silver ★★', refs: '3-5', desc: 'Unlock 8% commission' },
                  { tier: 'Gold ★★★', refs: '6-9', desc: 'Enjoy 9% commission' },
                  { tier: 'Diamond ★★★★', refs: '10+', desc: 'Maximum 10% commission' },
                ].map(t => (
                  <div key={t.tier} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="font-bold font-heading text-accent min-w-[120px]">{t.tier}</div>
                    <div>
                      <p className="font-medium text-primary">{t.refs} converted referrals</p>
                      <p className="text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="text-2xl font-heading text-primary flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-accent" />
                  Earnings Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { project: '$5,000 Refinishing', earn: '$350-500' },
                  { project: '$12,000 Installation', earn: '$840-1,200' },
                  { project: '$25,000 Whole House', earn: '$1,750-2,500' },
                ].map(e => (
                  <div key={e.project} className="flex justify-between items-center p-4 bg-accent/5 rounded-lg">
                    <p className="font-medium text-primary">{e.project}</p>
                    <p className="text-xl font-bold text-accent">{e.earn}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary mb-12">
            Happy Referrers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { quote: "I've referred 3 families and earned over $2,800. Everyone loves their work!", name: "Sarah T." },
              { quote: "Best referral program I've seen. My neighbor got amazing floors and I got a $960 check!", name: "Mike R." },
            ].map(t => (
              <Card key={t.name} className="border-2 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed italic">"{t.quote}"</p>
                  <p className="font-heading font-semibold text-primary">- {t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReferralProgram;
