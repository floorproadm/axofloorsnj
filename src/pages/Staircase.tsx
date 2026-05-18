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
import { ArrowRight, RotateCcw, Layers, GitBranch, Grip } from "lucide-react";
import staircaseHero from "@/assets/staircase-hero.jpg";

const Staircase = () => {
  const services = [
    {
      icon: RotateCcw,
      name: "Refinish Existing Stairs",
      tagline: "Same wood, new life.",
      description:
        "Sand the treads and risers down to bare wood, stain to match your floors (or contrast on purpose), seal with three coats. Brings tired stairs back to like-new.",
      bestFor: "Worn, dull, or scratched stair treads.",
      pricing: "From $85 per step",
    },
    {
      icon: Layers,
      name: "New Treads & Risers",
      tagline: "When the wood is past saving.",
      description:
        "We remove old steps and install new solid hardwood treads and risers. Matches your existing floor or upgrades the look entirely.",
      bestFor: "Cracked, rotted, or carpet-covered stairs.",
      pricing: "From $180 per step",
    },
    {
      icon: GitBranch,
      name: "Railings",
      tagline: "The detail that makes the room.",
      description:
        "Install new handrails or replace old ones. Wood, painted, modern metal — we match what fits the house. Code-compliant, properly anchored.",
      bestFor: "Updating staircase style, safety upgrades.",
      pricing: "Quoted per project",
    },
    {
      icon: Grip,
      name: "Balusters",
      tagline: "Custom design, clean install.",
      description:
        "Replace wood spindles with iron, swap dated styles for clean modern verticals, or install fresh on a new staircase. Drilled, set, and locked in.",
      bestFor: "Modernizing the look, replacing damaged spindles.",
      pricing: "From $25 per baluster",
    },
  ];

  const faqs = [
    {
      q: "Do I need to redo the whole staircase at once?",
      a: "No. You can refinish treads now and update railings/balusters later. Most people start with what's most visible — usually the treads.",
    },
    {
      q: "Can I match the new stairs to my existing hardwood floors?",
      a: "Yes — that's standard. We bring stain samples to your home, test on a small spot, and match the floor color. If you want contrast (dark stairs, light floors), we do that too.",
    },
    {
      q: "How long does a staircase project take?",
      a: "Refinishing a standard 13-step staircase: 2 – 3 days (sanding, staining, finishing). New treads & risers: 3 – 4 days. Railings and balusters add a day on top.",
    },
    {
      q: "Can I still use the stairs during the project?",
      a: "Not while we're working on them — but we time it so you have one functional path through the house if you have a second staircase. Most clients plan around it.",
    },
    {
      q: "Is iron baluster replacement messy?",
      a: "Some dust — we have to drill the existing handrail and shoe rail. We contain it and clean up at the end of each day.",
    },
    {
      q: "Do you handle the inspection if I'm adding new railings?",
      a: "We install to code (handrail height, baluster spacing under 4\"). If you need a township inspection, you handle the permit and we coordinate the visit.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Staircase Renovation in NJ | AXO Floors"
        description="Refinish stair treads, install new steps, update railings and balusters. Hardwood staircase work that becomes the centerpiece of your home. Free estimate."
        keywords="staircase renovation NJ, stair refinishing New Jersey, hardwood stairs, baluster replacement, stair railing install"
      />
      <Header />

      <Hero
        title="Stairs That Become the Centerpiece"
        subtitle="Staircase Renovation"
        description="From refinishing tired treads to replacing balusters and railings — we do the full staircase, or just the part that needs it."
        image={staircaseHero}
        ctaPrimary="Get My Free Estimate"
        ctaSecondary="See Our Work"
        ctaPrimaryHref="/quiz"
        ctaSecondaryHref="/gallery"
        trustLine="Refinish • New Treads • Railings • Balusters"
      />

      {/* Opening hook */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              The First Thing Guests See — <span className="text-gradient-gold">Don't Skip It</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground leading-relaxed mb-3">
              Most homeowners refinish their floors and forget the stairs. Then the stairs look 10 years older than everything around them.
            </p>
            <p className="text-mobile-base text-foreground leading-relaxed font-medium">
              Stairs are visible from every angle. They deserve the same finish quality as the floors they connect to.
            </p>
          </div>
        </div>
      </section>

      {/* 4 services */}
      <section className="spacing-mobile-md bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
              What We Do
            </p>
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              Four Services. <span className="text-gradient-gold">Pick What You Need.</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
              Bundle them, or hire us for one. Same craftsmen either way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {services.map((s, i) => (
              <Card
                key={i}
                className="group border-0 shadow-elegant hover:shadow-gold transition-all duration-300 hover:-translate-y-2 bg-card"
              >
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl group-hover:bg-accent transition-colors">
                      <s.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground transition-colors" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                      {s.pricing}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-1">{s.name}</h3>
                  <p className="text-sm text-accent font-medium mb-4">{s.tagline}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {s.description}
                  </p>
                  <div className="pt-4 border-t border-border/60">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Best for</p>
                    <p className="text-sm text-foreground">{s.bestFor}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
            Prices shown are starting points — final quote depends on wood species, stair count, and condition. Most full staircases land between $1,500 and $5,500.
          </p>
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
              Get a Real Number on <span className="text-accent">Your Staircase</span>
            </h2>
            <p className="text-mobile-base text-white/80 mb-8 leading-relaxed">
              Tell us what you have in mind. We'll get back to you within 24 hours with a clear quote.
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

export default Staircase;
