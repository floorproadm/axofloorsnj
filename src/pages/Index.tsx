import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import Portfolio from "@/components/shared/Portfolio";
import ContactSection from "@/components/shared/ContactSection";
import ReviewsSection from "@/components/shared/ReviewsSection";
import GoogleBusinessIntegration from "@/components/shared/GoogleBusinessIntegration";
import SEOHead from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Award, Users, Clock, Shield, Sparkles, BookOpen, Calculator, Palette } from "lucide-react";
import homeHero from "@/assets/home-hero.jpg";
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
    description: "Restore your floors to their original beauty with professional refinishing services.",
    href: "/sanding-and-refinish",
    features: ["Complete Restoration", "Dust-Free Process", "Quick Turnaround"],
    icon: "✨"
  }, {
    title: "Hardwood Flooring",
    description: "Premium hardwood installation with expert craftsmanship and attention to detail.",
    href: "/hardwood-flooring",
    features: ["Premium Materials", "Expert Installation", "Lifetime Warranty"],
    icon: "🌳"
  }, {
    title: "Vinyl Plank Flooring",
    description: "Waterproof and durable luxury vinyl with the look of real hardwood.",
    href: "/vinyl-plank-flooring",
    features: ["100% Waterproof", "Easy Maintenance", "Realistic Wood Look"],
    icon: "💧"
  }, {
    title: "Staircase Renovation",
    description: "Transform your staircase with custom hardwood steps and elegant railings.",
    href: "/staircase",
    features: ["Custom Design", "Safety First", "Premium Materials"],
    icon: "🪜"
  }];
  const benefits = [{
    icon: Users,
    title: "Expert Craftsmen",
    description: "Professional installation team with years of experience",
    stat: "10+ Years"
  }, {
    icon: Clock,
    title: "Quick Turnaround",
    description: "Efficient project completion without compromising quality",
    stat: "On Time"
  }, {
    icon: Shield,
    title: "Quality Guarantee",
    description: "100% satisfaction guarantee on all our work",
    stat: "100%"
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
      <Hero title="Your Flooring deserves the attention that only us can provide!" subtitle="Flooring Solutions in New Jersey and Beyond" description="Over time, flooring often fades and becomes damaged. However, with expert care and the right team by your side, this won't be a problem anymore." image={homeHero} showReviews={true} />

      {/* Services Section */}
      <section className="spacing-mobile-md bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-accent/20">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-accent font-medium">Premium Services</span>
            </div>
            <h2 className="text-mobile-3xl font-bold font-heading mb-6">
              We have all the solutions you need to <span className="text-gradient-gold">renew your space!</span>
            </h2>
            <p className="text-mobile-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We offer a wide range of services, from installation to finishing touches, guaranteeing that you achieve the modern, sophisticated, and elegant aesthetics you desire for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => <Card key={index} ref={el => serviceRefs.current[index] = el} className={`group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] ${isMobile && activeServiceIndex === index ? 'shadow-2xl shadow-accent/20 -translate-y-4 scale-[1.02]' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent transition-opacity duration-500 ${isMobile && activeServiceIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                
                <CardContent className="relative p-6 text-center h-full flex flex-col">
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-accent/20 rounded-full blur-xl transition-opacity duration-500 transform scale-150 ${isMobile && activeServiceIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    <div className={`relative text-4xl mb-2 transition-all duration-500 ${isMobile && activeServiceIndex === index ? 'scale-125 rotate-3' : 'group-hover:scale-125 group-hover:rotate-3'}`}>
                      {service.icon}
                    </div>
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



      {/* Contact Form Section */}
      <ContactSection />


      <Footer />
    </div>;
};
export default Index;