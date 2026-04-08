import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight, CheckCircle, Star, Shield, Phone, Users, 
  Building2, Home, Key, Pencil, Building, Eye, Camera,
  ClipboardCheck, Clock, Sparkles, Heart
} from "lucide-react";
import sandingHero from "@/assets/sanding-hero-new.jpg";
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

const PartnerProgram = () => {
  const stats = [
    { value: "15+", label: "Years of Master Craftsmanship" },
    { value: "+40%", label: "Documented home value increase" },
    { value: "≤ 5", label: "Projects / month" },
    { value: "10yr", label: "Structural warranty — Transferable" },
  ];

  const segments = [
    { icon: Building2, title: "General Contractors", desc: "A reliable, high-quality flooring subcontractor who shows up on time, coordinates seamlessly, and never compromises the finish." },
    { icon: Home, title: "Builders", desc: "Structured timelines in contracts, predictable pricing, zero-defect execution. 10-year warranty transfers to homeowner." },
    { icon: Key, title: "Realtors", desc: "Staging-ready transformations that close faster. Documented ROI of +15% to +40% to share with your sellers." },
    { icon: Pencil, title: "Architects & Designers", desc: "Exact color and texture matching, custom stain formulation, and 6 hours of collaborative on-site consultation per project." },
    { icon: Building, title: "Property Managers", desc: "Volume contracts, preventive maintenance programs, and one dedicated point of contact for your entire portfolio." },
  ];

  const howItWorks = [
    { step: "01", title: "You Refer", desc: "Send us the lead by call, text, or email. No forms, no friction. Eduardo responds within 24 hours and takes full ownership." },
    { step: "02", title: "We Deliver", desc: "AXO handles the full process: diagnostic visit, custom proposal, execution, and post-project follow-up. White-glove service from day one." },
    { step: "03", title: "You Get Rewarded", desc: "Once the project closes, your referral reward is processed — automatic, transparent, on time. Your tier determines the reward level." },
  ];

  const tiers = [
    {
      name: "Preferred",
      ideal: "Realtors, Independent GCs, First-time partners",
      benefits: [
        "Referral reward per closed project",
        "AXO co-marketing digital materials",
        "Client WOW Pack sent on your behalf",
        "48h scheduling response time",
        "Partner listing on axofloorsnj.com",
      ],
      cta: "Get Started",
      featured: false,
    },
    {
      name: "Strategic",
      ideal: "Active GCs, Designers, Property Managers",
      benefits: [
        "Higher referral reward tier",
        "Priority 24h scheduling",
        "Quarterly business review with Eduardo",
        "Project updates you can forward to clients",
        "AXO name featured in your project portfolio",
      ],
      cta: "Apply Now",
      featured: true,
    },
    {
      name: "Elite",
      ideal: "Builders, Architecture Firms, Volume Partners",
      benefits: [
        "Top-tier rewards + volume bonus",
        "Dedicated account manager — Eduardo direct",
        "6h collaborative consultation per project",
        "Exclusive product lines not available publicly",
        "Joint marketing events & co-branding",
      ],
      cta: "Let's Talk",
      featured: false,
    },
  ];

  const clientExperience = [
    { icon: Eye, title: "Diagnostic Site Assessment", desc: "Full microclimatic evaluation — HVAC, traffic flow, lighting study — before a single board is placed." },
    { icon: Sparkles, title: "Custom Stain Formulation", desc: "Color-matched to light conditions, lifestyle, and furnishings. Custom-built for the space, not off-the-shelf." },
    { icon: Shield, title: "Hospital-Grade Dust Control", desc: "Industrial-grade containment. Minimal disruption. Zero-dust promise throughout the entire project." },
    { icon: ClipboardCheck, title: "Guaranteed Timeline", desc: "Schedule written into the contract. Daily updates. No surprises, no excuses — deadline is a commitment." },
    { icon: Camera, title: "Before & After Documentation", desc: "Professional photos at every stage — perfect for listings, portfolios, and social media content." },
    { icon: Heart, title: "Lifetime Care Relationship", desc: "Post-project maintenance guide, recommended products, and direct access to the team for questions." },
  ];

  const guarantees = [
    { period: "30 Day", title: "Absolute Satisfaction", desc: "Not satisfied within 30 days? We redo the work at zero cost. No arguments. No fine print.", highlight: "Zero risk for your client recommendation." },
    { period: "10 Year", title: "Structural Warranty", desc: "Coverage against warping, cracking, and separation. Fully transferable to the next homeowner.", highlight: "Transfers with the property. A true selling point." },
    { period: "5 Year", title: "Premium Finish Warranty", desc: "Stain resistance, UV protection, natural texture. Maintained without recoating. Documented for appraisals.", highlight: "Strengthens listing value and client confidence." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={sandingHero} alt="AXO Alliance Partner Program" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <p className="text-sm sm:text-base font-heading tracking-[0.3em] text-gold mb-4 uppercase">AXO Alliance — Strategic Partnerships</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight">
              Build More. Earn More. Be Remembered.
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the network of builders, realtors, architects, and contractors who trust AXO Floors to deliver premium results — and reward the professionals who send them.
            </p>

            {/* Pill Tags */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {["NJ · NY · PA", "15+ Years Mastery", "Triple Guarantee", "Bilingual Team", "≤ 5 Projects / Month"].map((tag, i) => (
                <span key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm px-4 py-2 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gold-gradient hover:scale-105 transition-all text-lg px-8 py-5 h-auto text-black font-semibold">
                <Link to="/contact" className="flex items-center gap-2 text-black">
                  Become a Partner <ArrowRight className="w-5 h-5 text-black" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-white bg-transparent hover:bg-white hover:text-navy text-lg px-8 py-5 h-auto font-semibold">
                <a href="tel:7323518653" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" /> Call Eduardo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-8 bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold font-heading text-gold">{stat.value}</p>
                <p className="text-white/70 text-xs sm:text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">What You're Recommending Matters</h2>
              <p className="text-lg text-grey">Every referral carries your professional reputation. When you send a client to AXO, you're delivering a transformation backed by decades of craft and a triple guarantee.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Partner Segments */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">Who This Program Is For</h2>
              <p className="text-lg text-white/80">Built for professionals whose clients demand — and deserve — the best.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {segments.slice(0, 3).map((seg, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white/10 border border-white/20 backdrop-blur-sm h-full hover:bg-white/15 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/20 rounded-full mb-5">
                      <seg.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-white mb-3">{seg.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{seg.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mt-6">
            {segments.slice(3).map((seg, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white/10 border border-white/20 backdrop-blur-sm h-full hover:bg-white/15 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/20 rounded-full mb-5">
                      <seg.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-white mb-3">{seg.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{seg.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">How the Program Works</h2>
              <p className="text-lg text-grey">Three steps. No complexity. We do the heavy lifting — you earn the credit.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {howItWorks.map((step, i) => (
              <ScrollReveal key={i}>
                <Card className="border-2 border-gold/20 h-full group hover:border-gold/40 transition-all">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <span className="text-4xl font-bold font-heading text-gold/30 group-hover:text-gold transition-colors">{step.step}</span>
                    <h3 className="text-xl font-heading font-bold text-navy mt-3 mb-3">{step.title}</h3>
                    <p className="text-grey text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">Choose Your Level</h2>
              <p className="text-lg text-white/80">Start as Preferred. As referrals grow, your benefits grow with it.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, i) => (
              <ScrollReveal key={i}>
                <Card className={`h-full backdrop-blur-sm transition-all ${tier.featured ? 'bg-gold/20 border-2 border-gold scale-[1.02]' : 'bg-white/10 border border-white/20'}`}>
                  <CardContent className="p-6 sm:p-8">
                    <h3 className={`text-2xl font-heading font-bold mb-2 ${tier.featured ? 'text-gold' : 'text-white'}`}>{tier.name}</h3>
                    <p className="text-white/60 text-xs mb-6">Ideal for: {tier.ideal}</p>
                    <ul className="space-y-3 mb-8">
                      {tier.benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-white/80">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.featured ? 'text-gold' : 'text-white/50'}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className={`w-full ${tier.featured ? 'gold-gradient text-black font-semibold' : 'bg-white/10 border border-white/30 text-white hover:bg-white/20'}`}>
                      <Link to="/contact" className={tier.featured ? "text-black" : ""}>{tier.cta} <ArrowRight className="w-4 h-4 ml-2" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Client Experience */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">What Your Clients Will Receive</h2>
              <p className="text-lg text-grey">Your reputation travels with every referral. Here's precisely what every AXO client experiences.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {clientExperience.map((exp, i) => (
              <ScrollReveal key={i}>
                <Card className="border border-gold/20 h-full hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 rounded-full mb-4 group-hover:bg-gold/20 transition-colors">
                      <exp.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-base font-heading font-bold text-navy mb-2">{exp.title}</h3>
                    <p className="text-grey text-sm leading-relaxed">{exp.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Woody's Guarantee */}
      <section className="py-16 sm:py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4">Three Promises You Can Repeat</h2>
              <p className="text-lg text-white/80">The words you give your client. Every one backed in writing.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {guarantees.map((g, i) => (
              <ScrollReveal key={i}>
                <Card className="bg-white/10 border border-white/20 h-full backdrop-blur-sm">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <p className="text-sm font-heading text-gold uppercase tracking-wider mb-2">{g.period}</p>
                    <h3 className="text-xl font-heading font-bold text-white mb-4">{g.title}</h3>
                    <p className="text-white/70 text-sm mb-4 leading-relaxed">{g.desc}</p>
                    <p className="text-gold text-xs font-medium italic">{g.highlight}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">
              One Conversation Is All It Takes
            </h2>
            <p className="text-lg text-grey mb-8 max-w-2xl mx-auto">
              No lengthy onboarding, no paperwork — just a shared commitment to excellence and a handshake.
            </p>
            <div className="bg-navy rounded-xl p-8 max-w-md mx-auto">
              <p className="text-gold font-heading font-bold text-xl mb-1">Eduardo Oliveira</p>
              <p className="text-white/70 text-sm mb-6">General Manager · AXO Alliance Lead</p>
              <div className="flex flex-col gap-3">
                <Button asChild className="gold-gradient text-black font-semibold text-base px-6 py-4 h-auto w-full">
                  <a href="tel:7323518653" className="flex items-center justify-center gap-2 text-black">
                    <Phone className="w-5 h-5 text-black" /> (732) 351-8653
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 text-base px-6 py-4 h-auto w-full">
                  <Link to="/contact" className="flex items-center justify-center gap-2">
                    Send a Message <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerProgram;
