import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight, CheckCircle, Star, Shield, Clock, Zap, Users, 
  Calendar, Camera, FileText, Calculator, Wrench, Handshake,
  Phone, Mail, AlertTriangle, ClipboardCheck, Eye, Send
} from "lucide-react";
import sandingHero from "@/assets/sanding-hero-new.jpg";
import beforeAfterImage from "@/assets/before-after-comparison.png";
import beforeAfterImage2 from "@/assets/before-after-2.png";
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

const BuilderPartnerships = () => {
  const heroStats = [
    { value: "10+", label: "Years minimum per craftsman" },
    { value: "100%", label: "Timeline adherence guaranteed" },
    { value: "Zero", label: "Dust — hospital-grade containment" },
    { value: "10yr", label: "Structural warranty — transferable" },
  ];

  const valueProps = [
    { icon: Calendar, title: "Schedule Predictability", description: "Our start date is your start date. We lock in your slot and protect it. Timeline is written into every subcontract — not a verbal estimate." },
    { icon: Shield, title: "Zero Dust Protocol", description: "Hospital-grade containment systems on every sanding job. Your other trades continue working. No cross-contamination, no cleanup delays." },
    { icon: Camera, title: "Daily Documentation", description: "Progress photos and daily status reports every single day. Share updates with your client without making a single call." },
    { icon: Star, title: "Transferable Warranty", description: "Our 10-year structural warranty transfers to the new homeowner at closing. A documented asset that follows the home." },
    { icon: ClipboardCheck, title: "Licensed, Insured, Documented", description: "Full documentation for your project file — COI on request, scope confirmation in writing, punch list resolution in 48 hours." },
    { icon: Phone, title: "One Point of Contact", description: "Eduardo manages every project directly. No account managers, no call centers. You have his cell. Answers in minutes, not days." },
  ];

  const services = [
    { name: "Hardwood Installation", desc: "Solid & engineered — nail-down, glue-down, or floating. Includes acclimation, subfloor prep, and final inspection.", unit: "per sqft" },
    { name: "Sanding & Refinishing", desc: "Full sanding sequence, stain application, multi-coat finish. Hospital-grade dust control included.", unit: "per sqft" },
    { name: "Custom Staining", desc: "Color consultation, sample boards, formulated per microclimate and lifestyle spec (UV resistance, pet/child-safe).", unit: "per sqft" },
    { name: "Floor Repairs", desc: "Board replacement, crack filling, squeaky floor remediation, water damage spot repair. Matched to existing species.", unit: "per area" },
    { name: "Water Damage Restoration", desc: "Assessment, removal, subfloor treatment, reinstallation. Documented before/after for insurance.", unit: "per sqft" },
    { name: "Staircase Refinishing", desc: "Treads, risers, handrails. Matched to adjacent floor species and finish. Open and closed stringer.", unit: "per step" },
    { name: "Baseboard Installation", desc: "Supply and install. Coordinated with floor species and finish for seamless wall transition.", unit: "per linear ft" },
    { name: "Vinyl Plank Flooring", desc: "LVP — floating or glue-down. Below-grade, wet areas, and high-traffic commercial applications.", unit: "per sqft" },
  ];

  const processSteps = [
    { step: "01", title: "Scope Submission", desc: "Send project specs — address, service type, sqft, species, finish direction, target schedule. Eduardo responds within 24h." },
    { step: "02", title: "Site Assessment & Quote", desc: "We visit the site, evaluate subfloor and microclimate, return a firm written quote. Price is locked at this step." },
    { step: "03", title: "Subcontract & Schedule Lock", desc: "Written agreement with start date, scope, pricing, and SLAs. Your slot is guaranteed. COI forwarded." },
    { step: "04", title: "Pre-Job Coordination", desc: "48h before start: access confirmation, site check, materials staged. We confirm other trades' schedule." },
    { step: "05", title: "Execution & Daily Reports", desc: "Master craftsmen on site. Before photos Day 1. Daily progress updates sent each evening." },
    { step: "06", title: "Punch List & Closeout", desc: "Final walkthrough with GC. Punch list resolved within 48h. After photos, warranty docs, and project file delivered." },
  ];

  const slaItems = [
    { title: "Timeline Adherence", desc: "We finish on the date we commit to. Delays within our control are resolved at our cost." },
    { title: "Scope Confirmation Before Start", desc: "No work begins without a written, signed scope. No assumptions. Every detail confirmed." },
    { title: "Zero-Dust Execution", desc: "Hospital-grade containment on all sanding. Site stays clean. Adjacent trades not disrupted." },
    { title: "Change Order Protocol", desc: "Any scope change submitted in writing before execution. You approve the change and revised price." },
    { title: "Punch List in 48 Hours", desc: "Items identified at walkthrough resolved within 48 business hours. No mobilization charge." },
    { title: "Full Documentation at Closeout", desc: "Before/after photos, warranty certificate, spec sheet, and completion certificate within 24h." },
    { title: "Single Accountable Contact", desc: "Eduardo manages every project. Reachable by call or text. Response within 2 business hours." },
  ];

  const axoProvides = [
    "All labor — master craftsmen with 15+ years",
    "All finish materials (stain, sealer, topcoat)",
    "Hospital-grade dust containment equipment",
    "Day-1 before photo documentation",
    "Daily progress reports",
    "Certificate of Insurance on request",
    "Punch list resolution within 48 hours",
    "Full warranty documentation at closeout",
  ];

  const gcProvides = [
    "Clear, unobstructed access on start date",
    "Site temperature 60–80°F, humidity below 55%",
    "Subfloor cleaned, free of adhesive/staples/debris",
    "Flooring materials (when supply-by-GC is agreed)",
    "Coordination of other trades to avoid conflicts",
    "Single contact with authority to approve changes",
    "Deposit per payment schedule at contract execution",
    "Final walkthrough attendance at closeout",
  ];

  const guaranteeStats = [
    { value: "30d", label: "Satisfaction Guarantee" },
    { value: "10yr", label: "Structural Warranty" },
    { value: "5yr", label: "Premium Finish" },
    { value: "48h", label: "Punch List Resolution" },
    { value: "24h", label: "Quote Turnaround" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={sandingHero} alt="AXO Floors GC Partnership" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <p className="text-sm sm:text-base font-heading tracking-[0.3em] text-gold mb-4 uppercase">General Contractor Partner Pack</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight">
              The Subcontractor That Never Lets You Down.
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Premium hardwood flooring execution for GCs, builders, and developers across NJ, NY, and PA. Delivered on schedule. Documented to spec.
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
              {heroStats.map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-gold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gold-gradient hover:scale-105 transition-all text-lg px-8 py-5 h-auto text-black font-semibold">
                <Link to="/contact" className="flex items-center gap-2 text-black">
                  Request a Partnership Call <ArrowRight className="w-5 h-5 text-black" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-black bg-white hover:bg-white/90 text-lg px-8 py-5 h-auto font-semibold">
                <a href="tel:7323518653" className="flex items-center gap-2 text-black">
                  <Phone className="w-5 h-5" /> Call Eduardo Direct
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why GCs Choose AXO */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">Built for the Way You Work</h2>
              <p className="text-lg text-grey max-w-3xl mx-auto">We understand your timeline is everything. Here's how AXO fits into your operation without adding friction.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {valueProps.map((prop, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white border-2 border-gold/20 hover:shadow-xl hover:border-gold/40 transition-all h-full group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-5 group-hover:bg-gold/20 transition-colors">
                      <prop.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-navy mb-3">{prop.title}</h3>
                    <p className="text-grey text-sm leading-relaxed">{prop.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Scope of Work — Services Table */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">What We Deliver</h2>
              <p className="text-lg text-white/80">Full-service hardwood flooring execution. All services priced per unit — no ambiguity.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-gold font-heading font-semibold text-sm uppercase tracking-wider py-4 pr-4">Service</th>
                    <th className="text-gold font-heading font-semibold text-sm uppercase tracking-wider py-4 pr-4 hidden sm:table-cell">What's Included</th>
                    <th className="text-gold font-heading font-semibold text-sm uppercase tracking-wider py-4 text-right">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="py-4 pr-4">
                        <p className="text-white font-semibold text-sm sm:text-base">{svc.name}</p>
                        <p className="text-white/60 text-xs mt-1 sm:hidden">{svc.desc}</p>
                      </td>
                      <td className="py-4 pr-4 text-white/70 text-sm hidden sm:table-cell">{svc.desc}</td>
                      <td className="py-4 text-gold text-sm font-medium text-right whitespace-nowrap">{svc.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
          <ScrollReveal className="mt-6">
            <p className="text-white/60 text-sm text-center max-w-3xl mx-auto">
              📐 Minimum project size: 500 sqft. We maintain max 5 active projects/month for master-craftsman-level attention.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">The AXO Subcontract Process</h2>
              <p className="text-lg text-grey">Six steps from first call to closeout. Transparent, documented, no surprises.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {processSteps.map((step, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white border border-gold/20 hover:shadow-lg transition-all h-full group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold font-heading text-gold/30 group-hover:text-gold transition-colors">{step.step}</span>
                      <h3 className="text-lg font-heading font-bold text-navy">{step.title}</h3>
                    </div>
                    <p className="text-grey text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SLAs — What We Guarantee */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">What We Guarantee</h2>
              <p className="text-lg text-white/80">Written into every subcontract we sign. Not aspirations — commitments.</p>
            </div>
          </ScrollReveal>
          <div className="max-w-4xl mx-auto space-y-4">
            {slaItems.map((item, i) => (
              <ScrollReveal key={i}>
                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors">
                  <CheckCircle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-heading font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/70 text-sm">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {/* Guarantee Stats Strip */}
          <ScrollReveal className="mt-12">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {guaranteeStats.map((stat, i) => (
                <div key={i} className="text-center bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-2xl font-bold font-heading text-gold">{stat.value}</p>
                  <p className="text-white/70 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Division of Responsibility */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">What We Each Own</h2>
              <p className="text-lg text-grey">Clear ownership prevents delays and disputes.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <ScrollReveal>
              <Card className="border-2 border-gold/30 h-full">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-xl font-heading font-bold text-navy mb-6 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gold"></div>
                    AXO Floors Provides
                  </h3>
                  <ul className="space-y-3">
                    {axoProvides.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-grey">
                        <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
            <ScrollReveal>
              <Card className="border-2 border-navy/20 h-full">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-xl font-heading font-bold text-navy mb-6 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-navy"></div>
                    GC / Builder Provides
                  </h3>
                  <ul className="space-y-3">
                    {gcProvides.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-grey">
                        <CheckCircle className="w-4 h-4 text-navy/50 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
          <ScrollReveal className="mt-6">
            <p className="text-sm text-grey/70 text-center max-w-3xl mx-auto">
              ⚠ Subfloor condition assessed at site visit. If remediation is needed (leveling, rot, moisture barrier), a change order is issued before flooring work begins.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Payment Structure */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">Simple, Milestone-Based Billing</h2>
              <p className="text-lg text-white/80">Three clear invoices tied to project milestones. No surprises.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { pct: "30%", title: "Deposit", timing: "At Contract Execution", desc: "Secures your slot on the AXO calendar, covers material staging and crew scheduling." },
              { pct: "40%", title: "Progress", timing: "At Job Midpoint", desc: "Invoiced when 50% of contracted sqft is complete, confirmed by progress photos. Due within 48h." },
              { pct: "30%", title: "Final", timing: "At Punch List Clearance", desc: "Issued upon GC sign-off at walkthrough. Due within 5 business days. Warranty activates upon receipt." },
            ].map((payment, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white/10 border border-white/20 text-center h-full backdrop-blur-sm">
                  <CardContent className="p-6 sm:p-8">
                    <p className="text-4xl font-bold font-heading text-gold mb-2">{payment.pct}</p>
                    <p className="text-white font-heading font-semibold text-lg mb-1">{payment.title}</p>
                    <p className="text-gold/80 text-xs font-medium uppercase tracking-wider mb-4">{payment.timing}</p>
                    <p className="text-white/70 text-sm">{payment.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal className="mt-6">
            <p className="text-white/50 text-sm text-center max-w-3xl mx-auto">
              💳 Check, ACH, or wire transfer. Credit card with 3% processing fee. Net-30 terms available for established GC partners.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Before & After */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">From Slab to Showcase</h2>
              <p className="text-lg text-gold font-semibold">On time. On budget. Every time.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
              <img src={beforeAfterImage} alt="Before and After Transformation 1" className="w-full h-auto rounded-lg shadow-xl" />
              <img src={beforeAfterImage2} alt="Before and After Transformation 2" className="w-full h-auto rounded-lg shadow-xl" />
            </div>
          </ScrollReveal>
          <div className="text-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-all text-lg px-8 py-5 h-auto text-black font-semibold">
              <Link to="/gallery" className="flex items-center gap-2 text-black">
                See More Projects <ArrowRight className="w-5 h-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">
              Send Your Specs to Eduardo
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Eduardo responds within 24 hours with availability and preliminary pricing direction. No sales calls. No runaround.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gold-gradient hover:scale-105 transition-all text-lg px-8 py-5 h-auto text-black font-semibold">
                <Link to="/contact" className="flex items-center gap-2 text-black">
                  Submit Project Scope <Send className="w-5 h-5 text-black" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-white bg-transparent hover:bg-white hover:text-navy text-lg px-8 py-5 h-auto font-semibold">
                <a href="tel:7323518653" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" /> (732) 351-8653
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BuilderPartnerships;
