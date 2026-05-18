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
import { ArrowRight, Layers, Wrench, Sparkles } from "lucide-react";
import hardwoodHero from "@/assets/hardwood-hero.jpg";

const Installation = () => {
  const options = [
    {
      icon: Layers,
      name: "Solid Hardwood",
      tagline: "Built to last 50+ years.",
      description:
        "3/4\" thick solid plank — white oak, red oak, hickory, maple. Can be sanded and refinished 5+ times over its lifetime. The right pick for above-grade rooms.",
      bestFor: "Main floors, bedrooms, living rooms.",
    },
    {
      icon: Wrench,
      name: "Engineered Hardwood",
      tagline: "Real wood, dimensional stability.",
      description:
        "Real hardwood top layer over a stable plywood core. Handles humidity and slabs better than solid. Looks identical once installed.",
      bestFor: "Basements, kitchens, over concrete.",
    },
    {
      icon: Sparkles,
      name: "Unfinished + Site Finish",
      tagline: "Custom color, perfect seal.",
      description:
        "We install raw boards, then sand, stain, and finish them in your home. You pick the exact stain. Seamless — no gaps between boards where dirt collects.",
      bestFor: "Open floor plans, custom stain colors.",
    },
  ];

  const faqs = [
    {
      q: "How much does new hardwood cost?",
      a: "Material + labor typically runs $9 – $15 per square foot installed, depending on species and whether it's prefinished or site-finished. Our minimum project is $3,500. We'll give you a fixed price after measuring.",
    },
    {
      q: "Solid vs engineered — which one?",
      a: "If you're installing above ground (main floor, bedrooms), solid is the gold standard. If you're going over concrete or in a basement, engineered handles moisture better. Both look the same once installed.",
    },
    {
      q: "Prefinished or site-finished?",
      a: "Prefinished is faster (1 – 2 days) and has factory-tough coating. Site-finished takes longer (4 – 6 days total) but gives you a custom stain color and zero gaps between boards. Most clients pick prefinished for speed, site-finished for design.",
    },
    {
      q: "How long does the whole job take?",
      a: "Prefinished install: 1 – 2 days. Site-finished (install + sand + stain + finish): 4 – 6 days. We'll lay out a day-by-day schedule before starting so you know exactly when we're in and out.",
    },
    {
      q: "Do I need to move my furniture?",
      a: "We handle furniture in the work area — included in the quote. Just remove personal items, electronics, and anything fragile.",
    },
    {
      q: "What about the old flooring?",
      a: "We remove and haul it. If there's a subfloor issue underneath, we'll flag it and quote the repair before continuing. No surprise change orders.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hardwood Floor Installation in NJ | AXO Floors"
        description="New hardwood floors installed and finished by one team — no juggling contractors. Solid, engineered, prefinished, or site-finished. 10-year warranty."
        keywords="hardwood installation NJ, wood floor installer New Jersey, solid hardwood, engineered hardwood, site-finished floors"
      />
      <Header />

      <Hero
        title="New Hardwood Floors — Installed and Finished by One Team"
        subtitle="Hardwood Floor Installation"
        description="No juggling between an installer and a separate finisher. We handle the whole job — from bare subfloor to the final coat of finish."
        image={hardwoodHero}
        ctaPrimary="Get My Free Estimate"
        ctaSecondary="See Our Work"
        ctaPrimaryHref="/quiz"
        ctaSecondaryHref="/gallery"
        trustLine="500+ Homes • 10-Year Warranty • Licensed & Insured"
      />

      {/* Opening hook */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              One Team, One Timeline, <span className="text-gradient-gold">One Warranty</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground leading-relaxed mb-3">
              Most installs go bad at the handoff — the install crew leaves, the finishing crew shows up a week later, and nobody owns the gaps in between.
            </p>
            <p className="text-mobile-base text-foreground leading-relaxed font-medium">
              We don't do handoffs. The team that lays your boards is the same team that sands, stains, and finishes them.
            </p>
          </div>
        </div>
      </section>

      {/* 3 options */}
      <section className="spacing-mobile-md bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
              Three Ways We Install
            </p>
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              Pick the Right Floor for <span className="text-gradient-gold">Your Space</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
              The wood matters. So does where it's going.
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

      {/* Timeline */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              From Bare Subfloor to <span className="text-gradient-gold">Finished Floor</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
              A site-finished install, day by day. Prefinished jobs cut this in half.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { day: "Day 1", title: "Install", body: "Old floor removed, subfloor checked and leveled, new boards laid and nailed down." },
              { day: "Day 2", title: "Sand", body: "Fresh boards sanded flat — eliminates any height differences between planks." },
              { day: "Day 3", title: "Stain", body: "You pick the stain from real samples. Applied, dries overnight." },
              { day: "Day 4 – 6", title: "Finish & cure", body: "Three coats of Bona or Loba. Light traffic same day as last coat. Furniture in 48 – 72 hrs." },
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
      <section className="spacing-mobile-md bg-secondary/40">
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
              Get a Real Number on <span className="text-accent">Your Install</span>
            </h2>
            <p className="text-mobile-base text-white/80 mb-8 leading-relaxed">
              Tell us about your project in under 2 minutes. We'll get back to you within 24 hours with a clear, fixed quote.
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

export default Installation;
