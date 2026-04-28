import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import Portfolio from "@/components/shared/Portfolio";

import ReviewsSection from "@/components/shared/ReviewsSection";
import GoogleBusinessIntegration from "@/components/shared/GoogleBusinessIntegration";
import SEOHead from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Award, Users, Clock, Shield, Sparkles, BookOpen, Calculator, Palette, Wind, Zap, Home, Trophy, ClipboardList, FileText, Hammer, BadgeCheck } from "lucide-react";
import homeHero from "@/assets/home-hero.jpg";
import serviceSanding from "@/assets/service-sanding.jpg";
import serviceHardwood from "@/assets/service-hardwood.jpg";
import serviceVinyl from "@/assets/service-vinyl.jpg";
import serviceStaircase from "@/assets/service-staircase.jpg";
import { useState, useEffect, useRef } from "react";
import LeadMagnetGate from "@/components/shared/LeadMagnetGate";
const Index = () => {
  const [activeServiceIndex, setActiveServiceIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const serviceRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    if (!isMobile) {
      setActiveServiceIndex(null);
      return;
    }
    const observers = serviceRefs.current.map((ref, index) => {
      if (!ref) return null;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          setActiveServiceIndex(index);
        }
      }, {
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
      });
      observer.observe(ref);
      return observer;
    });
    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [isMobile]);
  const services = [{
    title: "Sanding & Refinishing",
    description: "Restore your floors to like-new condition with a dustless, precision process.",
    href: "/sanding-and-refinish",
    features: ["Full Restoration", "Dust-Free Sanding", "Fast Turnaround"],
    image: serviceSanding
  }, {
    title: "Hardwood Flooring",
    description: "Premium hardwood installation built to last for decades.",
    href: "/hardwood-flooring",
    features: ["High-End Materials", "Expert Craftsmanship", "Lifetime Structural Integrity"],
    image: serviceHardwood
  }, {
    title: "Vinyl Plank Flooring",
    description: "The beauty of hardwood with modern durability and water resistance.",
    href: "/vinyl-plank-flooring",
    features: ["100% Waterproof", "Low Maintenance", "Perfect for Any Room"],
    image: serviceVinyl
  }, {
    title: "Staircase Renovation",
    description: "Transform your staircase into a true centerpiece.",
    href: "/staircase",
    features: ["Custom Design", "Safety-Focused Installation", "Premium Finishes"],
    image: serviceStaircase
  }];
  const benefits = [{
    icon: Users,
    title: "Expert Craftsmen",
    description: "A father-and-son team with over a decade of hands-on experience.",
    stat: "10+ Years"
  }, {
    icon: Clock,
    title: "Quick Turnaround",
    description: "Most projects completed in 2–5 days — without compromising quality.",
    stat: "2–5 Days"
  }, {
    icon: Shield,
    title: "10-Year Warranty",
    description: "Backed by our written guarantee on workmanship and finish.",
    stat: "10 Years"
  }];
  const differentials = [{
    icon: Wind,
    title: "Dustless Process",
    description: "No mess, no cleanup nightmare."
  }, {
    icon: Zap,
    title: "Fast Turnaround",
    description: "Most projects completed in 2–5 days."
  }, {
    icon: Home,
    title: "In-Home Service",
    description: "No moving out, no disruption."
  }, {
    icon: Trophy,
    title: "Limited Weekly Projects",
    description: "We prioritize quality over volume."
  }];
  const processSteps = [{
    icon: ClipboardList,
    step: "01",
    title: "In-Home Assessment",
    description: "We visit your home, measure precisely, and listen to what you actually want."
  }, {
    icon: FileText,
    step: "02",
    title: "Custom Plan & Transparent Quote",
    description: "A clear scope and a fixed price. No surprises, no hidden fees."
  }, {
    icon: Hammer,
    step: "03",
    title: "Precision Execution",
    description: "Our craftsmen deliver the work on schedule, with daily updates."
  }, {
    icon: BadgeCheck,
    step: "04",
    title: "Final Walkthrough & Approval",
    description: "We don't leave until every detail meets your standard — and ours."
  }];
  const testimonials = [{
    name: "Michelle Allen",
    text: "Outstanding experience overall! The workmanship was superb, we highly recommend AXO Floors to everyone!",
    rating: 5,
    location: "Ocean County, NJ"
  }, {
    name: "Richard Davis",
    text: "We hired AXO Floors and they did amazing work! It was done fast, we had all the work completed. We would highly recommend to anyone! Thank you once again!",
    rating: 5,
    location: "Monmouth County, NJ"
  }, {
    name: "David Nakano",
    text: "Professional and quality work! They transformed our home and we couldn't be happier with the results.",
    rating: 5,
    location: "Middlesex County, NJ"
  }];
  return <div className="min-h-screen">
      <SEOHead title="AXO Floors NJ - #1 Hardwood Flooring Experts in New Jersey" description="Transform your home with AXO Floors NJ. Expert hardwood installation, refinishing & restoration. 4.9★ rating, licensed & insured. Free estimates - Call (732) 351-8653" keywords="hardwood flooring NJ, floor refinishing New Jersey, flooring installation Newark, wood floor restoration Jersey City, AXO Floors, professional flooring contractors" />
      <Header />
      
      {/* Hero Section */}
      <Hero
        title="Restore Your Floors in Days — Without Dust, Delays, or Disruption"
        subtitle="Premium Flooring Solutions in New Jersey"
        description="Expert hardwood refinishing and installation for homeowners who expect flawless results — without turning their home into a construction site."
        image={homeHero}
        ctaPrimary="Get My Free Estimate"
        ctaSecondary="View Real Transformations"
        ctaPrimaryHref="/contact"
        ctaSecondaryHref="/gallery"
        trustLine="500+ Homes Transformed • 10+ Years Experience • 10-Year Warranty"
        showReviews={true}
      />

      {/* Emotional Hook Section */}
      <section className="spacing-mobile-md bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-mobile-3xl font-bold font-heading mb-8">
              Your Floors Shouldn't Be Something <span className="text-gradient-gold">You Apologize For</span>
            </h2>
            <div className="space-y-3 text-mobile-base text-muted-foreground leading-relaxed mb-8">
              <p>Scratches that catch the light.</p>
              <p>Stains that never come out.</p>
              <p>Floors that quietly age your entire home.</p>
            </div>
            <p className="text-mobile-base text-foreground leading-relaxed mb-4">
              Now imagine walking into a space that feels clean, refined, and worth every dollar you invested in it.
            </p>
            <p className="text-mobile-base font-semibold text-accent">
              This is what we do — every single day.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="spacing-mobile-md bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              Complete Flooring Solutions — <span className="text-gradient-gold">Done Right the First Time</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From restoration to installation, every service is delivered with the precision and care your home deserves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => <Card key={index} ref={el => serviceRefs.current[index] = el} className={`group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] ${isMobile && activeServiceIndex === index ? 'shadow-2xl shadow-accent/20 -translate-y-4 scale-[1.02]' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent transition-opacity duration-500 ${isMobile && activeServiceIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                
                <CardContent className="relative p-6 text-center h-full flex flex-col">
                  <div className="relative mb-6 overflow-hidden rounded-xl">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      width={512}
                      height={512}
                      className={`w-full h-40 object-cover transition-all duration-500 ${isMobile && activeServiceIndex === index ? 'scale-110' : 'group-hover:scale-110'}`}
                    />
                  </div>
                  
                  <h3 className={`text-lg font-heading font-bold mb-3 transition-all duration-300 leading-tight ${isMobile && activeServiceIndex === index ? 'text-accent' : 'group-hover:text-accent'}`}>
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed text-sm flex-grow">
                    {service.description}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {service.features.map((feature, i) => <div key={i} className="flex items-center gap-3 text-sm group/feature">
                        <div className="relative">
                          <CheckCircle className="w-4 h-4 text-accent relative z-10 group-hover/feature:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-accent/20 rounded-full blur-sm opacity-0 group-hover/feature:opacity-100 transition-opacity duration-300" />
                        </div>
                        <span className="font-medium text-foreground group-hover/feature:text-accent transition-colors duration-300">{feature}</span>
                      </div>)}
                  </div>
                  
                  <Button asChild variant="outline" className={`w-full transition-all duration-300 font-semibold relative overflow-hidden ${isMobile && activeServiceIndex === index ? 'bg-accent text-accent-foreground border-accent' : 'group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent'}`}>
                    <Link to={service.href} className="flex items-center justify-center gap-2 relative z-10">
                      <span className={`transition-transform duration-300 ${isMobile && activeServiceIndex === index ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>Saiba Mais</span>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isMobile && activeServiceIndex === index ? 'translate-x-2' : 'group-hover:translate-x-2'}`} />
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${isMobile && activeServiceIndex === index ? 'translate-x-[100%]' : 'translate-x-[-100%] group-hover:translate-x-[100%]'}`} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="spacing-mobile-md bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              Why Choose <span className="text-gradient-gold">AXO Floors?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => <Card key={index} className="group text-center hover:shadow-gold transition-all duration-300 border-0 shadow-elegant hover:-translate-y-2 bg-card">
                <CardContent className="p-6 md:p-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-accent/10 rounded-2xl mb-4 md:mb-6 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                    <benefit.icon className="w-7 h-7 md:w-10 md:h-10 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
                  </div>
                  
                  <div className="text-2xl md:text-3xl font-bold font-heading text-accent mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                    {benefit.stat}
                  </div>
                  
                  <h3 className="text-lg md:text-2xl font-heading font-semibold mb-3 md:mb-4 group-hover:text-accent transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-lg">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <Portfolio />

      {/* Lead Magnets Section */}
      

      {/* Google Business Integration */}
      <GoogleBusinessIntegration />
      

      {/* Testimonials Section */}
      <section className="spacing-mobile-md navy-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-accent text-accent" />)}
            </div>
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              See What Our <span className="text-accent">Customers</span> Are Saying
            </h2>
            <p className="text-mobile-base text-white/80 max-w-2xl mx-auto">
              Don't just take our word for it - hear from satisfied homeowners across New Jersey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
                  </div>
                  <p className="text-white/90 mb-6 leading-relaxed text-lg">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="text-accent font-semibold text-lg">
                      {testimonial.name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {testimonial.location}
                    </p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>



      {/* Project Wizard CTA */}
      <section className="spacing-mobile-md bg-gradient-subtle border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Personalized Estimate</span>
            </div>
            <h2 className="text-mobile-3xl font-bold font-heading mb-4">
              Ready to Transform <span className="text-gradient-gold">Your Floors?</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Tell us about your project in under 2 minutes. Our specialists will reach out within 24 hours with a tailored plan — no generic quotes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button asChild size="lg" className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-8 py-5 h-auto min-h-[52px] text-black font-semibold w-full sm:w-auto">
                <Link to="/project-wizard" className="flex items-center justify-center gap-2 text-black">
                  Start My Project
                  <ArrowRight className="w-5 h-5 text-black" />
                </Link>
              </Button>
              <a href="tel:(732) 351-8653" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                Or call <span className="font-semibold underline">(732) 351-8653</span>
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              ⚡ 4 quick steps · 📍 NJ · NY · PA · 🛡️ Licensed & insured
            </p>
          </div>
        </div>
      </section>


      <Footer />
    </div>;
};
export default Index;