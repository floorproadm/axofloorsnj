import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import SEOHead from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  X,
  Wind,
  Hammer,
  Sparkles,
} from "lucide-react";
import sandingHero from "@/assets/sanding-hero-new.jpg";

const Refinishing = () => {
  const options = [
    {
      icon: Sparkles,
      name: "Sanding & Refinishing",
      tagline: "The standard restoration.",
      description:
        "Full sand to bare wood, your choice of stain, then three coats of premium finish. Brings most floors back to like-new.",
      bestFor: "Floors with surface wear, dull finish, light scratches.",
    },
    {
      icon: Wind,
      name: "Dustless Sanding",
      tagline: "Same result. Zero dust.",
      description:
        "Same process — but our equipment captures 99% of dust at the source. You can stay in the house. No two-day cleanup.",
      bestFor: "Families, allergies, occupied homes.",
    },
    {
      icon: Hammer,
      name: "Complete Restoration",
      tagline: "When boards need fixing first.",
      description:
        "Damaged boards, pet stains, water marks, gaps. We repair or replace what's broken, then sand and refinish the whole floor so it looks uniform.",
      bestFor: "Older floors, water damage, missing boards.",
    },
  ];

  const replaceCompare = [
    { label: "Typical cost (1,000 sqft)", refinish: "$3,500 – $6,000", replace: "$10,000 – $18,000" },
    { label: "Time on site", refinish: "2 – 4 days", replace: "1 – 2 weeks" },
    { label: "Mess & demolition", refinish: "Minimal — dustless option", replace: "Tear-out, debris haul" },
    { label: "Same character & age", refinish: "Yes — preserves the original wood", replace: "New wood, new look" },
    { label: "Sustainability", refinish: "Reuses what you have", replace: "Old wood goes to landfill" },
  ];

  const faqs = [
    {
      q: "How much does refinishing cost?",
      a: "Most projects run $3.50 – $6.00 per square foot, depending on stain, finish, and condition. We never start a job under $1,800 — below that, mobilization and material costs make it not worth doing right. We'll give you a fixed price after seeing the floor.",
    },
    {
      q: "How long does it take?",
      a: "A standard refinish takes 2 – 4 days. Day 1: sand. Day 2: stain. Day 3 – 4: three coats of finish, with dry time between coats. You'll get a daily update so you know when to expect us out.",
    },
    {
      q: "Can I stay in the house?",
      a: "With dustless sanding, yes — you can be in other rooms. You just can't walk on the floor being worked on. Most clients block off the area and continue normal life.",
    },
    {
      q: "How long until I can walk on it?",
      a: "Light foot traffic (socks) after 24 hours from the last coat. Furniture back after 48 – 72 hours. Rugs after 2 weeks — finishes need to fully cure before they're covered.",
    },
    {
      q: "Will it really look brand new?",
      a: "Yes — assuming the wood is structurally sound. We sand past all the old finish and scratches, so you're starting from bare wood. The only thing that doesn't disappear is deep dents that go below the wood surface (rare).",
    },
    {
      q: "What finish do you use?",
      a: "Bona or Loba waterborne finishes — low odor, fast cure, 10+ year durability. Matte, satin, or semi-gloss. We'll show you samples in your home before applying.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hardwood Floor Refinishing in NJ | AXO Floors"
        description="Don't replace your hardwood floors — refinish them for half the cost. Dustless sanding, 10-year warranty, 2–4 day turnaround. Free estimate in 24 hours."
        keywords="hardwood floor refinishing NJ, dustless sanding New Jersey, wood floor restoration, refinish hardwood floors Newark"
      />
      <Header />

      <Hero
        title="Don't Replace Your Floors. Restore Them."
        subtitle="Hardwood Floor Refinishing"
        description="Most worn floors don't need to be replaced — they need to be refinished. Half the cost, a fraction of the mess, and the same wood you already love."
        image={sandingHero}
        ctaPrimary="Get My Free Estimate"
        ctaSecondary="See Before & After"
        ctaPrimaryHref="/quiz"
        ctaSecondaryHref="/gallery"
        trustLine="500+ Floors Restored • 10-Year Warranty • Dustless Process"
      />

      {/* Opening hook */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              Worn-Out Floors Don't Mean <span className="text-gradient-gold">It's Time to Replace</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground leading-relaxed mb-3">
              Scratches. Dull spots. Stains that won't come out. Most homeowners assume the only fix is ripping it all out.
            </p>
            <p className="text-mobile-base text-foreground leading-relaxed font-medium">
              It isn't. If the wood underneath is solid, refinishing brings it back — for a third of the price.
            </p>
          </div>
        </div>
      </section>

      {/* 3 ways we refinish */}
      <section className="spacing-mobile-md bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
              Three Ways We Refinish
            </p>
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              Pick the Approach That Fits <span className="text-gradient-gold">Your Floor</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
              Same craftsmen, three levels of work — depending on what your floor actually needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {options.map((opt, i) => (
              <Card
                key={i}
                className="group border-0 shadow-elegant hover:shadow-gold transition-all duration-300 hover:-translate-y-2 bg-card"
              >
                <CardContent className="p-7">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl mb-5 group-hover:bg-accent transition-colors">
                    <opt.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-1">{opt.name}</h3>
                  <p className="text-sm text-accent font-medium mb-4">{opt.tagline}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {opt.description}
                  </p>
                  <div className="pt-4 border-t border-border/60">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Best for</p>
                    <p className="text-sm text-foreground">{opt.bestFor}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Refinish vs Replace */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-mobile-3xl font-bold font-heading mb-4">
                Refinish vs. <span className="text-gradient-gold">Replace</span>
              </h2>
              <p className="text-mobile-base text-muted-foreground">
                Side by side — for a typical 1,000 sqft home.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-elegant bg-card">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-secondary/50 border-b border-border/60">
                <div className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">&nbsp;</div>
                <div className="p-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-accent font-bold">
                    <Check className="w-4 h-4" /> Refinish
                  </div>
                </div>
                <div className="p-4 text-center text-muted-foreground font-medium">
                  Replace
                </div>
              </div>
              {replaceCompare.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1.4fr_1fr_1fr] text-sm ${
                    i % 2 === 0 ? "bg-background" : "bg-secondary/20"
                  }`}
                >
                  <div className="p-4 font-medium text-foreground">{row.label}</div>
                  <div className="p-4 text-center text-foreground font-semibold">{row.refinish}</div>
                  <div className="p-4 text-center text-muted-foreground">{row.replace}</div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
              If your boards are cupping, rotting, or beyond repair — we'll tell you upfront. Refinishing only works on wood that's still sound.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="spacing-mobile-md bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              How It Works — <span className="text-gradient-gold">Day by Day</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
              No mystery. You'll know what's happening in your home every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { day: "Day 1", title: "Sanding", body: "We remove the old finish, stains, and scratches — down to bare wood. Dustless equipment runs throughout." },
              { day: "Day 2", title: "Staining", body: "You pick the color from real samples. Or keep the wood's natural tone. Stain goes on, dries overnight." },
              { day: "Day 3", title: "First & second coat", body: "Two coats of Bona or Loba finish go down, with light buffing between coats." },
              { day: "Day 4", title: "Final coat & cure", body: "Third coat seals it. Light foot traffic same day. Furniture back in 48 hours." },
            ].map((s, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{s.day}</p>
                  <h3 className="text-lg font-heading font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-mobile-3xl font-bold font-heading mb-4">
                Common <span className="text-gradient-gold">Questions</span>
              </h2>
              <p className="text-mobile-base text-muted-foreground">
                The things every homeowner asks before saying yes.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
                  <AccordionTrigger className="text-left text-base font-semibold hover:text-accent">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="spacing-mobile-md navy-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              Get a Real Number on <span className="text-accent">Your Floor</span>
            </h2>
            <p className="text-mobile-base text-white/80 mb-8 leading-relaxed">
              Tell us about your project in under 2 minutes. We'll get back to you within 24 hours with a clear, fixed quote — no upsells, no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button asChild size="lg" className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-8 py-5 h-auto min-h-[52px] text-black font-semibold w-full sm:w-auto">
                <Link to="/quiz" className="flex items-center justify-center gap-2 text-black">
                  Get My Free Estimate
                  <ArrowRight className="w-5 h-5 text-black" />
                </Link>
              </Button>
              <a href="tel:(732) 351-8653" className="text-sm text-white/80 hover:text-accent transition-colors">
                Or call <span className="font-semibold underline">(732) 351-8653</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Refinishing;
