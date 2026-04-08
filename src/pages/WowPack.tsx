import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import SEOHead from "@/components/shared/SEOHead";
import throwbackPhoto from "@/assets/ademir-eduardo-throwback.jpg";
import {
  Phone, Search, Palette, ClipboardList, FileText,
  Shield, Star, CheckCircle, ArrowRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
};

const ScrollReveal = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
};

const WowPack = () => {
  const stains = [
    { name: "Natural Oak", desc: "Warm honey tones that highlight the wood's natural grain. Timeless, never goes out of style.", best: "Best for: bright rooms, traditional homes", gradient: "linear-gradient(135deg, #c8945a, #e0b472, #b07840)" },
    { name: "Classic Brown", desc: "Rich medium-brown with warm undertones. The most requested finish in the NJ market.", best: "Best for: transitional style, real estate prep", gradient: "linear-gradient(135deg, #5e3018, #8a4a22, #4a2010)" },
    { name: "Espresso Dark", desc: "Deep, dramatic finish that creates a high-contrast, luxury look. Pairs with light walls.", best: "Best for: modern homes, high-end staging", gradient: "linear-gradient(135deg, #1e0e06, #3a1a08, #160a04)" },
    { name: "Whitewash / Driftwood", desc: "Bleached, coastal finish with a soft grey undertone. Trending in NJ shore towns.", best: "Best for: coastal, Scandi, and farmhouse styles", gradient: "linear-gradient(135deg, #d0c8b4, #e8e0cc, #b8b0a0)" },
    { name: "Warm Drift", desc: "A greige blend — the perfect balance between grey and brown. Works in almost any light.", best: "Best for: neutral interiors, all lighting", gradient: "linear-gradient(135deg, #6e5e4c, #8a7260, #5a4c3c)" },
    { name: "Gunmetal Grey", desc: "Striking contemporary grey that reads differently in every light. Bold and editorial.", best: "Best for: contemporary, open-plan spaces", gradient: "linear-gradient(135deg, #2e2e26, #484840, #1e1e18)" },
  ];

  const transformations = [
    { location: "Monmouth County — Living Room & Hallway", detail: "800 sqft · Sand + Custom Natural Stain + 3 coats", result: "Home value +$28,000 at resale", beforeLabel: "Worn, grey finish", afterLabel: "Natural Oak stain", beforeGrad: "linear-gradient(135deg, #1a1208, #2a1e10, #1e160a)", afterGrad: "linear-gradient(135deg, #6b4a18, #c9a84c, #8a6020)" },
    { location: "Bergen County — Full First Floor", detail: "1,200 sqft · Water damage restoration + Classic Brown", result: "Listed & sold 12 days after completion", beforeLabel: "Water damage, dark", afterLabel: "Classic Brown finish", beforeGrad: "linear-gradient(135deg, #110d08, #1e160a, #150e06)", afterGrad: "linear-gradient(135deg, #8a4a1a, #c07838, #7a3c12)" },
    { location: "Morris County — Modern Renovation", detail: "920 sqft · Sand + Whitewash + Satin Bona finish", result: "Realtor: \"Best-looking house on the block\"", beforeLabel: "Dull, scratched", afterLabel: "Driftwood Whitewash", beforeGrad: "linear-gradient(135deg, #1a1a14, #262618, #1a1a12)", afterGrad: "linear-gradient(135deg, #c0c0b0, #e0ddd0, #a8a898)" },
    { location: "Essex County — Staircase + Open Floor", detail: "1,400 sqft · New boards + Espresso + Platinum finish", result: "10-year structural guarantee now active", beforeLabel: "Old, uneven boards", afterLabel: "Espresso Dark", beforeGrad: "linear-gradient(135deg, #0e0e0a, #1a1a14, #0a0a08)", afterGrad: "linear-gradient(135deg, #1e1208, #2e1a0a, #160e06)" },
  ];

  const processSteps = [
    { num: "01", title: "Diagnostic Analysis", desc: "Before we touch a thing, we analyze your space the way an engineer would. This includes microclimate mapping, subfloor assessment, HVAC compatibility, and foot traffic patterns.", tags: ["Microclimate mapping", "Subfloor assessment", "HVAC compatibility", "Traffic analysis"] },
    { num: "02", title: "Custom Materials Engineering", desc: "Based on the diagnostic, we select the specific wood species, finish formulation, and installation technique for your exact conditions.", tags: ["Species selection by microclimate", "Custom finish formulation", "Northeast climate adaptation"] },
    { num: "03", title: "Master Craftsman Execution", desc: "Every project is executed by a craftsman with a minimum of 10+ years of hands-on experience. We use dustless sanding workspace — meaning zero dust contamination in your home.", tags: ["10+ years minimum experience", "Zero-dust equipment", "German quality protocols", "Daily progress photos"] },
    { num: "04", title: "Proprietary Finishing System", desc: "Our finish is formulated for the specific demands of your home — pet traffic, children, Northeast humidity swings. Red wine sits on the surface for up to 24 hours without staining.", tags: ["24h stain resistance", "UV fade protection", "15+ year lifespan", "Natural wood texture preserved"] },
  ];

  const beforeArrival = [
    "Clear the room of furniture and rugs (we can help if needed — just let us know ahead of time)",
    "Secure pets in a separate area — the equipment and fumes aren't dangerous, but animals get anxious",
    "Set HVAC to 65–72°F and keep it stable — temperature affects drying time",
    "Confirm access and any door codes with Eduardo the day before",
    "Confirm deposit and invoice — no surprises on either end",
  ];

  const timeline = [
    { day: "Day 1", title: "Sanding & Prep", desc: "Full sand of existing floor, subfloor corrections, dust containment setup." },
    { day: "Day 2", title: "Stain Application", desc: "First stain coat applied. This is the moment your floor comes to life — we send you progress photos." },
    { day: "Day 3", title: "Finish Coats", desc: "2–3 finish coats applied with light sanding between each." },
    { day: "Day 4", title: "Final Curing", desc: "24h light walk-only period. Full traffic and furniture return after 72h." },
  ];

  return (
    <>
      <SEOHead
        title="Your Pre-Visit Guide | AXO Floors NJ"
        description="Everything you need to know before your free site visit — our process, guarantees, stain guide, and investment options."
      />
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="bg-gradient-to-b from-primary to-primary/95 text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-4 font-medium">Your Personal Pre-Visit Guide</p>
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-5 leading-tight">
              Before We Meet,<br /><span className="text-accent italic">Let Me Show You How We Work.</span>
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto leading-relaxed">
              This guide was prepared specifically for you — so you know exactly who we are, what to expect, and why AXO Floors is different from every flooring company you've ever called.
            </p>
            <Card className="bg-primary-foreground/5 border-accent/20 text-left max-w-xl mx-auto backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <p className="text-sm text-primary-foreground/70 leading-relaxed mb-3">Thank you for reaching out. Before our visit, I want to be transparent about everything: our process, our guarantees, our options, and what we'll actually do when we arrive at your home.</p>
                <p className="text-sm text-primary-foreground/70 leading-relaxed mb-3">My goal isn't to sell you. It's to help you make the right decision — even if that means telling you your floors are in better shape than you think.</p>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">Read this at your own pace. By the time we meet, you'll already know everything you need to know.</p>
                <div className="mt-5 pt-5 border-t border-primary-foreground/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-heading text-sm font-semibold shrink-0">E</div>
                  <div>
                    <p className="text-sm font-semibold text-primary-foreground">Eduardo Oliveira</p>
                    <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">General Manager · AXO Floors NJ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── OUR STORY ── */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">Our Story</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">Two craftsmen.<br /><span className="text-accent italic">One standard of work.</span></h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">AXO Floors isn't a flooring company. We're a team of master craftsmen who happen to work with floors — and there's a meaningful difference between the two.</p>
            </ScrollReveal>

            <ScrollReveal>
              <div className="mb-8 flex flex-col items-center">
                <div className="w-64 h-72 sm:w-72 sm:h-80 rounded-2xl overflow-hidden shadow-lg border-2 border-accent/20 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                  <img src={throwbackPhoto} alt="Ademir and Eduardo — early days on the job site" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic text-center max-w-xs">Where it all started — father and son, side by side on the job site.</p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <ScrollReveal>
                <Card className="border-border h-full">
                  <CardContent className="p-6">
                    <p className="text-xs tracking-wider uppercase text-accent mb-2 font-medium">Owner & Head Craftsman</p>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-3">Ademir Oliveira</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">Ademir brought his craft from Brazil, where flooring is treated as an art form. With over 15 years of hands-on experience in hardwood installation, sanding, and refinishing, he approaches every project with the precision of someone who takes it personally.</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">He doesn't oversee. He executes. Every premium project in NJ/NY/PA has Ademir's hands and eyes directly on it.</p>
                    <div className="mt-5 pt-4 border-t border-border flex items-baseline gap-2">
                      <span className="font-heading text-3xl text-accent font-bold">15+</span>
                      <span className="text-xs text-muted-foreground">years of mastery<br />in hardwood</span>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal>
                <Card className="border-border h-full">
                  <CardContent className="p-6">
                    <p className="text-xs tracking-wider uppercase text-accent mb-2 font-medium">General Manager</p>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-3">Eduardo Oliveira</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">Eduardo is your point of contact from the first call to the final walkthrough. Fluent in English and Portuguese, with 8 years in premium flooring, he translates complex technical decisions into clear, honest guidance.</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">He's the one who answers your questions before you even ask them — and the one who calls you after every project to make sure you love what you see.</p>
                    <div className="mt-5 pt-4 border-t border-border flex items-baseline gap-2">
                      <span className="font-heading text-3xl text-accent font-bold">8</span>
                      <span className="text-xs text-muted-foreground">years serving<br />NJ · NY · PA</span>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <blockquote className="border-l-4 border-accent/30 bg-accent/5 rounded-r-lg py-5 px-6">
                <p className="font-heading text-lg italic text-foreground leading-relaxed">"We approach every floor like it's our own home. Because somewhere down the line, it probably will be — and we want to be proud of the work we left behind."</p>
                <cite className="block mt-3 text-xs text-muted-foreground uppercase tracking-wider not-italic">— Eduardo Oliveira, AXO Floors</cite>
              </blockquote>
            </ScrollReveal>
          </div>
        </section>

        {/* ── WOODY'S GUARANTEE ── */}
        <section className="py-16 md:py-20 bg-muted">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">The Woody's Guarantee</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4"><span className="text-accent italic">Three layers</span> of protection.<br />Zero exceptions.</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">Most flooring companies offer a vague "we'll make it right" promise. Ours is different. It's named after Woody — Ademir's nickname on the job site — and it's been keeping our clients worry-free since day one.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { period: "30", unit: "DAYS", title: "Absolute Satisfaction", desc: "Not happy with any aspect of the result? We come back and redo it — at zero cost to you. No negotiations, no exceptions." },
                { period: "10", unit: "YEARS", title: "Structural Guarantee", desc: "Warping, cracking, separation — covered for a full decade. And if you sell your home, this guarantee transfers to the new owner." },
                { period: "5", unit: "YEARS", title: "Premium Finish", desc: "The appearance and performance of your finish — guaranteed for 5 years. If it wears, peels, or dulls before its time, we handle it." },
              ].map((g, i) => (
                <ScrollReveal key={i}>
                  <Card className="border-accent/20 bg-accent/5 text-center h-full">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full border-2 border-accent mx-auto mb-4 flex items-center justify-center bg-accent/10">
                        <span className="text-accent font-mono text-xs font-bold leading-none text-center">{g.period}<br />{g.unit}</span>
                      </div>
                      <h3 className="font-heading text-base font-semibold text-foreground mb-2">{g.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Why does this matter?</strong> Because when you invest in your floors, you shouldn't have to wonder "what if." The Woody's Guarantee means the risk is entirely ours — not yours.</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* ── TRANSFORMATIONS ── */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">Transformations</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">What a difference<br /><span className="text-accent italic">the right craftsman</span> makes.</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">These are real projects from homeowners across New Jersey and New York.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {transformations.map((t, i) => (
                <ScrollReveal key={i}>
                  <Card className="border-border overflow-hidden">
                    <div className="grid grid-cols-2">
                      <div className="h-28 relative flex items-end" style={{ background: t.beforeGrad }}>
                        <div className="relative z-10 p-3 w-full">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Before</p>
                          <p className="text-[11px] text-white/30">{t.beforeLabel}</p>
                        </div>
                      </div>
                      <div className="h-28 relative flex items-end" style={{ background: t.afterGrad }}>
                        <div className="relative z-10 p-3 w-full">
                          <p className="text-[10px] uppercase tracking-wider text-white/85 font-medium">After</p>
                          <p className="text-[11px] text-white/70">{t.afterLabel}</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">{t.location}</p>
                      <p className="text-xs text-muted-foreground">{t.detail}</p>
                      <p className="text-xs text-accent mt-2 flex items-center gap-1">↑ {t.result}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Full photo gallery at <Link to="/gallery" className="text-accent hover:underline">axofloorsnj.com/gallery</Link> · Instagram <a href="https://instagram.com/axofloors" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@axofloors</a>
            </p>
          </div>
        </section>

        {/* ── STAIN GUIDE ── */}
        <section className="py-16 md:py-20 bg-muted">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">Stain & Finish Guide</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">Choosing your stain<br />is <span className="text-accent italic">easier than you think.</span></h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">During our visit, I'll walk you through the options based on your home's lighting, style, and how you actually live. Here's a preview of the most popular finishes.</p>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {stains.map((s, i) => (
                <ScrollReveal key={i}>
                  <Card className="border-border overflow-hidden">
                    <div className="h-20" style={{ background: s.gradient }} />
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold text-foreground mb-1">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                      <p className="text-[10px] text-accent mt-2">{s.best}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal>
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground"><strong className="text-accent">Custom Stain Available.</strong> None of these feel exactly right? During the site visit, I'll mix custom stain samples on a real piece of your floor — so you see exactly what it will look like before we commit.</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* ── OUR PROCESS ── */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">Our Process</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">The Método<br /><span className="text-accent italic">Transformação Completa™</span></h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">Every flooring company sands and finishes. What separates AXO is what happens before, between, and after those steps.</p>
            </ScrollReveal>

            <div className="space-y-0">
              {processSteps.map((step, i) => (
                <ScrollReveal key={i}>
                  <div className={`flex gap-5 py-6 ${i < processSteps.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-10 h-10 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0">{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.tags.map((tag, j) => (
                          <span key={j} className="text-[11px] bg-muted border border-border rounded-full px-3 py-1 text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── INSTALLATION DAY ── */}
        <section className="py-16 md:py-20 bg-muted">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">What to Expect</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">Installation day,<br /><span className="text-accent italic">from start to finish.</span></h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">We believe in zero surprises. Here's exactly what happens on the day of your project.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              <ScrollReveal>
                <div>
                  <p className="text-xs tracking-wider uppercase text-accent mb-4 font-medium">Before We Arrive</p>
                  {beforeArrival.map((item, i) => (
                    <div key={i} className={`flex gap-3 py-3 ${i < beforeArrival.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div>
                  <p className="text-xs tracking-wider uppercase text-accent mb-4 font-medium">Project Timeline</p>
                  {timeline.map((t, i) => (
                    <div key={i} className={`flex gap-4 py-3 ${i < timeline.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="font-mono text-xs text-accent w-12 shrink-0 pt-0.5">{t.day}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── INVESTMENT OPTIONS ── */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-3">Your Investment Options</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">Three packages.<br /><span className="text-accent italic">One standard of craft.</span></h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl">All three packages are executed by the same craftsmen, with the same care and the same Woody's Guarantee. During the site visit, we'll recommend the one that actually fits your goals.</p>
            </ScrollReveal>

            <div className="space-y-3 mb-4">
              {/* Silver */}
              <ScrollReveal>
                <Card className="border-border">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start">
                    <div className="text-center shrink-0 w-14">
                      <div className="w-11 h-11 rounded-full border-2 border-gray-400 mx-auto mb-1 flex items-center justify-center text-gray-400 font-heading text-base">S</div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Silver</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-foreground mb-1">Essential Quality</h3>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Good · Entry AXO Standard</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">Everything you need, nothing you don't. Professional sand + 2 coats of oil-based finish. The result still outperforms any competitor's premium package.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Full sand", "2 finish coats (oil-based)", "Woody's Guarantee", "Same-day cleanup"].map((item, j) => (
                          <span key={j} className="text-[11px] px-2.5 py-0.5 rounded-full border border-gray-300/30 text-muted-foreground bg-muted">{item}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Gold */}
              <ScrollReveal>
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start">
                    <div className="text-center shrink-0 w-14">
                      <div className="w-11 h-11 rounded-full border-2 border-accent mx-auto mb-1 flex items-center justify-center text-accent font-heading text-base">G</div>
                      <span className="text-[10px] uppercase tracking-wider text-accent">Gold</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-accent mb-1">Complete Upgrade</h3>
                      <p className="text-[10px] uppercase tracking-wider text-accent/70 mb-2">Better · Most Popular</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">The most chosen package among our clients. Includes custom stain application plus 3 coats of water-based finish — faster drying, deeper protection.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Full sand", "Custom stain", "3 finish coats (water-based)", "Stain consultation", "Woody's Guarantee"].map((item, j) => (
                          <span key={j} className="text-[11px] px-2.5 py-0.5 rounded-full border border-accent/30 text-accent/80 bg-accent/10">{item}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Platinum */}
              <ScrollReveal>
                <Card className="border-purple-400/30 bg-purple-500/5">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start">
                    <div className="text-center shrink-0 w-14">
                      <div className="w-11 h-11 rounded-full border-2 border-purple-400/50 mx-auto mb-1 flex items-center justify-center text-purple-400 font-heading text-base">P</div>
                      <span className="text-[10px] uppercase tracking-wider text-purple-400">Platinum</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-purple-300 mb-1">Definitive Transformation</h3>
                      <p className="text-[10px] uppercase tracking-wider text-purple-400/70 mb-2">Best · No Compromise</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">For clients who want the absolute best — once, and done. Custom stain, Bona premium finish, extended guarantee, plus stain resistance and UV protection treatment.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Full sand", "Custom stain", "Bona premium finish", "Stain resistance treatment", "UV protection", "Extended guarantee", "Lighting consultation (incl.)"].map((item, j) => (
                          <span key={j} className="text-[11px] px-2.5 py-0.5 rounded-full border border-purple-400/25 text-purple-400/80 bg-purple-500/10">{item}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            <p className="text-center text-sm text-muted-foreground italic">All prices are per square foot. Minimum project size: 500 sqft. Full written estimate during the site visit — no pressure, no surprises.</p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/95 to-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <ScrollReveal>
              <p className="text-xs tracking-[0.2em] uppercase text-accent mb-4 font-medium">Your Free Site Visit</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold mb-4">One visit.<br /><span className="text-accent italic">Everything answered.</span></h2>
              <p className="text-base text-primary-foreground/70 mb-10 max-w-md mx-auto leading-relaxed">The site visit is free, takes about 45 minutes, and comes with zero sales pressure.</p>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="bg-primary-foreground/5 border-accent/20 text-left max-w-lg mx-auto backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-wider text-accent mb-4 font-medium">What We Do During the Visit</p>

                  {[
                    { icon: Search, title: "Diagnostic walkthrough", desc: "We assess every room — condition, species, subfloor, microclimate, damage." },
                    { icon: Palette, title: "Live stain samples", desc: "We test 2–3 stain options on a real section of your floor so you can see the actual result." },
                    { icon: ClipboardList, title: "Honest recommendation", desc: "Based on your goals, budget, and what we find — we tell you which package makes sense." },
                    { icon: FileText, title: "Written estimate on the spot", desc: "Silver, Gold, or Platinum — all three options in writing before we leave." },
                  ].map((item, i) => (
                    <div key={i} className={`flex gap-3 py-3 ${i < 3 ? 'border-b border-primary-foreground/10' : ''}`}>
                      <item.icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground mb-0.5">{item.title}</p>
                        <p className="text-xs text-primary-foreground/60 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-5 pt-5 border-t border-accent/20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-heading text-lg font-bold shrink-0">E</div>
                    <div>
                      <p className="text-sm font-semibold text-primary-foreground">Eduardo Oliveira</p>
                      <a href="tel:7323518653" className="font-mono text-sm text-accent hover:underline">(732) 351-8653</a>
                      <p className="text-[11px] text-primary-foreground/50 mt-0.5">Text or call · NJ / NY / PA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Button asChild size="lg" className="mt-8 gold-gradient text-black font-semibold hover:scale-105 transition-bounce">
                <a href="tel:7323518653" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call or Text Eduardo
                </a>
              </Button>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default WowPack;
