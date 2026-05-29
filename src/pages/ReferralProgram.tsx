// React import not needed — only JSX is used
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import ReferralDashboard from "@/components/referral/ReferralDashboard";
import { useReferralProfile } from "@/hooks/useReferralProfile";
import hardwoodHero from "@/assets/hardwood-hero.jpg";
import {
  Gift,
  Share2,
  DollarSign,
  UserPlus,
  Check,
  Star,
  Loader2,
  
  Phone,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

const NAVY = "#0a1628";
const GOLD = "#f5a623";

const ReferralProgram = () => {
  const { profile, referrals, rewards, tier, isLoading, addReferral, signOut } = useReferralProfile();

  const goToAuth = () => {
    window.location.href = "/referral/auth";
  };

  const scrollToForm = () => {
    document.getElementById("referral-signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  // Logged-in dashboard (standalone, no site frame)
  if (profile) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-2xl mx-auto px-4 sm:px-0 py-4">
          <ReferralDashboard
            profile={profile}
            referrals={referrals}
            rewards={rewards}
            tier={tier}
            isLoading={isLoading}
            onAddReferral={addReferral}
            onSignOut={signOut}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* 1. HERO */}
      <section
        className="relative py-20 sm:py-28 overflow-hidden"
        style={{ backgroundColor: NAVY }}
      >
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: `url(${hardwoodHero})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${NAVY}cc 0%, ${NAVY}f5 100%)`,
          }}
        />

        <div className="relative container mx-auto px-4 max-w-4xl text-center text-white">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: `${GOLD}1a`, color: GOLD, border: `1px solid ${GOLD}40` }}
          >
            <Gift className="w-4 h-4" />
            Earn $100 for Every Referral
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading leading-tight mb-6">
            Join Our{" "}
            <span style={{ color: GOLD }}>Referral Program</span>
            <br className="hidden sm:block" /> & Earn Rewards
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Love AXO Floors? Share us with friends and family — and earn a{" "}
            <span className="font-semibold text-white">$100 Gift Card</span> every time someone you
            refer becomes a client.
          </p>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto pt-8 border-t border-white/10">
            {[
              { value: "$100", label: "Gift Card per referral" },
              { value: "∞", label: "No limit on referrals" },
              { value: "10+", label: "Years of trusted service" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-2xl sm:text-4xl font-bold font-heading mb-1"
                  style={{ color: GOLD }}
                >
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-white/60 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <div
              className="text-xs font-bold tracking-[0.2em] mb-3"
              style={{ color: GOLD }}
            >
              SIMPLE PROCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading" style={{ color: NAVY }}>
              How It Works
            </h2>
          </div>

          <div className="space-y-8 max-w-2xl mx-auto">
            {[
              {
                icon: UserPlus,
                title: "Sign Up",
                desc: "Fill out the form below. It's free and takes less than a minute.",
              },
              {
                icon: Share2,
                title: "Share the Link",
                desc: "Share your unique link with friends, neighbors, or anyone who needs new floors.",
              },
              {
                icon: DollarSign,
                title: "Earn $100",
                desc: "When your referral becomes a client and signs a contract, you receive a $100 Gift Card.",
              },
            ].map((step, i) => (
              <div key={step.title} className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: NAVY }}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white"
                    style={{ backgroundColor: GOLD }}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold font-heading mb-2" style={{ color: NAVY }}>
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PROGRAM BENEFITS */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-[0.2em] mb-3" style={{ color: GOLD }}>
              WHY JOIN
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading" style={{ color: NAVY }}>
              Program Benefits
            </h2>
          </div>

          <ul className="space-y-4 mb-10">
            {[
              "No limit on how many people you can refer",
              "$100 gift card delivered after client signs contract",
              "Completely free to join — no fees ever",
              "You'll be notified at every step of the process",
              "Trusted by New Jersey homeowners",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100"
              >
                <div
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: `${GOLD}20` }}
                >
                  <Check className="w-4 h-4" style={{ color: GOLD }} strokeWidth={3} />
                </div>
                <span className="text-base text-gray-700 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          <div
            className="rounded-2xl p-6 sm:p-8 text-center text-white"
            style={{ backgroundColor: NAVY }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Gift className="w-7 h-7" style={{ color: GOLD }} />
              <div className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: GOLD }}>
                $100 Gift Card
              </div>
            </div>
            <div className="text-white/70 text-sm sm:text-base">
              Per converted client · Delivered within 48h of contract signing
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIGN UP CTA */}
      <section id="referral-signup" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-xl">
          <Card className="border border-gray-200 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${GOLD}1a` }}
              >
                <Sparkles className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-heading" style={{ color: NAVY }}>
                Join the Referral Program
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Free signup — secure account with password & email verification
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className="flex items-start gap-3 p-4 rounded-lg text-sm"
                style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}33` }}
              >
                <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                <p className="text-gray-700 leading-relaxed">
                  Create your account, share your unique link, and earn{" "}
                  <strong style={{ color: NAVY }}>$100</strong> for every friend that signs a
                  contract.
                </p>
              </div>

              <Button
                onClick={goToAuth}
                className="w-full h-14 text-base font-bold hover:opacity-90 shadow-lg"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                <Gift className="w-5 h-5 mr-2" />
                Create Account — It's Free
              </Button>

              <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
                Already a member?{" "}
                <button
                  type="button"
                  onClick={goToAuth}
                  className="font-semibold hover:underline"
                  style={{ color: GOLD }}
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* 5. TESTIMONIALS */}
      <section className="py-20" style={{ backgroundColor: NAVY }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-[0.2em] mb-3" style={{ color: GOLD }}>
              MEMBER STORIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
              Our Referrers Love the Program
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "I referred two neighbors and earned $200! AXO's work is so good that recommending them is easy.",
                name: "Jennifer M.",
                location: "Westfield, NJ",
              },
              {
                quote:
                  "The referral program is simple and the gift cards arrive quickly. I love supporting a local business I trust.",
                name: "Robert K.",
                location: "Summit, NJ",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" style={{ color: GOLD }} />
                  ))}
                </div>
                <p className="text-white/90 text-base sm:text-lg leading-relaxed italic mb-5">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-bold font-heading text-white">{t.name}</div>
                  <div className="text-sm text-white/60">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4" style={{ color: NAVY }}>
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Join hundreds of satisfied clients who are already earning gift cards by sharing AXO
            Floors with their community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={scrollToForm}
              className="h-14 px-8 text-base font-bold hover:opacity-90 shadow-lg"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              Sign Up Now <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 text-base font-semibold border-2"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <a href="tel:+17323518653">
                <Phone className="w-5 h-5 mr-2" />
                (732) 351-8653
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReferralProgram;
